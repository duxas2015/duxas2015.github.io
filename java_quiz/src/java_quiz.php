<?php
// 1. Загружаем настройки подключения из отдельного файла
$config = require_once __DIR__ . '/config.php';

// 2. Формируем DSN из загруженного массива
$dsn = sprintf(
    "mysql:host=%s;port=%s;dbname=%s;charset=%s",
    $config['host'],
    $config['port'],
    $config['db'],
    $config['charset']
);

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

$fullData = [];

try {
    $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);

    // 2. Сбор данных в структуру, идентичную вашему JSON
    $booksStmt = $pdo->query("SELECT id, title FROM books");
    while ($book = $booksStmt->fetch()) {
        $bookArr = [
            "book" => $book['title'],
            "chapters" => []
        ];

        $chaptersStmt = $pdo->prepare("SELECT id, chapter_name FROM chapters WHERE book_id = ?");
        $chaptersStmt->execute([$book['id']]);
        
        while ($chapter = $chaptersStmt->fetch()) {
            $chapterArr = [
                "chapter_name" => $chapter['chapter_name'],
                "questions" => []
            ];

            $questionsStmt = $pdo->prepare("SELECT id, idx, question_text, select_type, explanation FROM questions WHERE chapter_id = ?");
            $questionsStmt->execute([$chapter['id']]);

            while ($q = $questionsStmt->fetch()) {
                // Получаем варианты ответов
                $answersStmt = $pdo->prepare("SELECT letter, answer_text, is_correct FROM answers WHERE question_id = ?");
                $answersStmt->execute([$q['id']]);
                $answers = $answersStmt->fetchAll();

                $correctLetters = [];
                $formattedAnswers = [];

                foreach ($answers as $ans) {
                    $formattedAnswers[] = [
                        "letter" => $ans['letter'],
                        "text" => $ans['answer_text']
                    ];
                    if ($ans['is_correct']) {
                        $correctLetters[] = $ans['letter'];
                    }
                }

                $chapterArr['questions'][] = [
                    "idx" => $q['idx'],
                    "text" => $q['question_text'],
                    "select_type" => $q['select_type'],
                    "answers" => $formattedAnswers,
                    "correct" => [
                        "letter" => $correctLetters,
                        "description" => $q['explanation']
                    ]
                ];
            }
            $bookArr['chapters'][] = $chapterArr;
        }
        $fullData[] = $bookArr;
    }
} catch (\PDOException $e) {
    // В случае ошибки выведем её в консоль браузера через JS ниже
    $db_error = $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Java Professional Quiz Training (Dynamic)</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    <style>
        /* Стили оставляем без изменений, как в вашем файле */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; padding: 20px; color: #333; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        h1 { color: #1a73e8; text-align: center; }
        .filter-section { display: flex; gap: 20px; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
        .filter-group { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        label { font-weight: bold; font-size: 14px; color: #555; }
        select { padding: 12px; border-radius: 6px; border: 1px solid #ced4da; font-size: 15px; background-color: white; outline: none; }
        .question-card { margin-bottom: 40px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
        .question-text { font-size: 18px; font-weight: 600; margin-bottom: 20px; line-height: 1.5; }
        .answers-list { display: flex; flex-direction: column; gap: 10px; }
        .answer-item { display: flex; align-items: flex-start; padding: 12px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .answer-item:hover { background: #f1f3f4; }
        .answer-item input { margin-top: 5px; margin-right: 15px; transform: scale(1.2); }
        .check-btn { margin-top: 20px; padding: 10px 25px; background-color: #1a73e8; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
        .result-box { margin-top: 20px; padding: 20px; border-radius: 8px; display: none; }
        .result-box.correct { background-color: #e6f4ea; border-left: 5px solid #34a853; }
        .result-box.incorrect { background-color: #fce8e6; border-left: 5px solid #ea4335; }
        pre { background: #2d2d2d !important; padding: 15px !important; border-radius: 6px !important; }
        code { font-family: 'Consolas', 'Monaco', monospace !important; }
    </style>
</head>
<body>

<div class="container">
    <h1>Java Training Center</h1>

    <div class="filter-section">
        <div class="filter-group">
            <label>Выберите книгу:</label>
            <select id="bookSelect">
                <option value="">-- Выберите книгу --</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Выберите главу:</label>
            <select id="chapterSelect" disabled>
                <option value="">-- Сначала выберите книгу --</option>
            </select>
        </div>
    </div>

    <div id="quiz-app"></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>

<script>
// 3. Прямая вставка данных из PHP в JS
let globalData = <?php echo json_encode($fullData, JSON_UNESCAPED_UNICODE); ?>;
const dbError = "<?php echo $db_error ?? ''; ?>";

function init() {
    if (dbError) {
        document.getElementById('quiz-app').innerHTML = `<p style="color:red">Ошибка БД: ${dbError}</p>`;
        return;
    }
    if (globalData.length === 0) {
        document.getElementById('quiz-app').innerHTML = '<p>База данных пуста. Загрузите JSON через скрипт импорта.</p>';
    }
    populateBooks();
}

function populateBooks() {
    const bookSelect = document.getElementById('bookSelect');
    globalData.forEach((item, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = item.book;
        bookSelect.appendChild(opt);
    });
}

// Логика выбора книги, главы и проверки (остается такой же, как в оригинале)
document.getElementById('bookSelect').addEventListener('change', function() {
    const chapterSelect = document.getElementById('chapterSelect');
    const bookIndex = this.value;
    chapterSelect.innerHTML = '<option value="">-- Выберите главу --</option>';
    document.getElementById('quiz-app').innerHTML = '';
    if (bookIndex !== "") {
        chapterSelect.disabled = false;
        globalData[bookIndex].chapters.forEach((ch, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.textContent = ch.chapter_name;
            chapterSelect.appendChild(opt);
        });
    } else {
        chapterSelect.disabled = true;
    }
});

document.getElementById('chapterSelect').addEventListener('change', function() {
    const bookIndex = document.getElementById('bookSelect').value;
    const chapterIndex = this.value;
    if (bookIndex !== "" && chapterIndex !== "") {
        renderQuestions(globalData[bookIndex].chapters[chapterIndex].questions);
    }
});

function renderQuestions(questions) {
    const container = document.getElementById('quiz-app');
    container.innerHTML = '';
    questions.forEach(q => {
        const card = document.createElement('div');
        card.className = 'question-card';
        const formattedText = q.text.replace(/<pre>/g, '<pre><code class="language-java">').replace(/<\/pre>/g, '</code></pre>');
        
        let html = `
            <div class="question-text">${q.idx}. ${formattedText}</div>
            <div class="answers-list" id="answers-container-${q.idx}">`;
        
        q.answers.forEach(ans => {
            const type = q.select_type === 'multiple' ? 'checkbox' : 'radio';
            const formattedAns = ans.text.replace(/<pre>/g, '<code class="language-java">').replace(/<\/pre>/g, '</code>');
            html += `
                <label class="answer-item">
                    <input type="${type}" name="q${q.idx}" value="${ans.letter}">
                    <div class="answer-content"><strong>${ans.letter}:</strong> ${formattedAns}</div>
                </label>`;
        });
        
        html += `
            </div>
            <button class="check-btn" onclick="checkAnswer(${q.idx}, ${JSON.stringify(q.correct.letter).replace(/"/g, '&quot;')}, '${q.correct.description.replace(/'/g, "\\'")}')">
                Check
            </button>
            <div id="result-${q.idx}" class="result-box"></div>
        `;
        card.innerHTML = html;
        container.appendChild(card);
    });
    Prism.highlightAll();
}

function checkAnswer(idx, correctLetters, description) {
    const resultDiv = document.getElementById(`result-${idx}`);
    const selectedInputs = document.querySelectorAll(`input[name="q${idx}"]:checked`);
    const selectedValues = Array.from(selectedInputs).map(i => i.value);
    const isCorrect = selectedValues.length === correctLetters.length && 
                      selectedValues.every(val => correctLetters.includes(val));

    resultDiv.style.display = 'block';
    if (isCorrect) {
        resultDiv.className = 'result-box correct';
        resultDiv.innerHTML = `<div class="result-header" style="color:#137333">✔ Correct</div><div class="description-text">${description}</div>`;
    } else {
        resultDiv.className = 'result-box incorrect';
        resultDiv.innerHTML = `<div class="result-header" style="color:#c5221f">✖ Incorrect</div><div class="description-text"><strong>Правильный ответ: ${correctLetters.join(', ')}</strong><br><br>${description}</div>`;
    }
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

init();
</script>
</body>
</html>