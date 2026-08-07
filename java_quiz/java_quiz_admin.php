<?php
$host = 'localhost';
$db   = 'javaquiz';
$user = 'root';
$pass = 'mysql'; 
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    die("Ошибка подключения: " . $e->getMessage());
}

$message = "";

// 1. Управление КНИГАМИ
if (isset($_POST['add_book'])) {
    $stmt = $pdo->prepare("INSERT INTO books (title) VALUES (?)");
    $stmt->execute([$_POST['book_title']]);
    $message = "Книга добавлена!";
}

if (isset($_POST['rename_book'])) {
    $stmt = $pdo->prepare("UPDATE books SET title = ? WHERE id = ?");
    $stmt->execute([$_POST['new_title'], $_POST['book_id']]);
    $message = "Название книги обновлено!";
}

// 2. Управление ГЛАВАМИ
if (isset($_POST['add_chapter'])) {
    $stmt = $pdo->prepare("INSERT INTO chapters (book_id, chapter_name) VALUES (?, ?)");
    $stmt->execute([$_POST['book_id'], $_POST['chapter_name']]);
    $message = "Глава добавлена!";
}

if (isset($_POST['rename_chapter'])) {
    $stmt = $pdo->prepare("UPDATE chapters SET chapter_name = ? WHERE id = ?");
    $stmt->execute([$_POST['new_chapter_name'], $_POST['chapter_id']]);
    $message = "Название главы обновлено!";
}

// 3. Массовый импорт JSON
if (isset($_POST['import_json_questions'])) {
    $chapterId = $_POST['chapter_id'];
    $jsonData = json_decode($_POST['json_text'], true);
    if ($jsonData) {
        try {
            $pdo->beginTransaction();
            foreach ($jsonData as $q) {
                $stmt = $pdo->prepare("INSERT INTO questions (chapter_id, idx, question_text, select_type, explanation) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$chapterId, $q['idx'], $q['text'], $q['select_type'], $q['correct']['description'] ?? null]);
                $questionId = $pdo->lastInsertId();
                $correctLetters = $q['correct']['letter'] ?? [];
                foreach ($q['answers'] as $ans) {
                    $isCorrect = in_array($ans['letter'], $correctLetters) ? 1 : 0;
                    $stmt = $pdo->prepare("INSERT INTO answers (question_id, letter, answer_text, is_correct) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$questionId, $ans['letter'], $ans['text'], $isCorrect]);
                }
            }
            $pdo->commit();
            $message = "Вопросы импортированы!";
        } catch (Exception $e) { $pdo->rollBack(); $message = "Ошибка: " . $e->getMessage(); }
    }
}

// 4. Сохранение вопроса и ответов
if (isset($_POST['save_question'])) {
    $questionId = $_POST['question_id'];
    
    $stmt = $pdo->prepare("UPDATE questions SET question_text = ?, select_type = ?, explanation = ? WHERE id = ?");
    $stmt->execute([$_POST['question_text'], $_POST['select_type'], $_POST['explanation'], $questionId]);
    
    if (isset($_POST['ans_ids'])) {
        $correctAnswers = $_POST['ans_corrects'] ?? [];
        foreach ($_POST['ans_ids'] as $ansId) {
            $newText = $_POST['ans_texts'][$ansId];
            $isCorrect = in_array($ansId, $correctAnswers) ? 1 : 0;
            $stmtA = $pdo->prepare("UPDATE answers SET answer_text = ?, is_correct = ? WHERE id = ?");
            $stmtA->execute([$newText, $isCorrect, $ansId]);
        }
    }

    // Если это AJAX-запрос, просто завершаем выполнение
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest' || isset($_POST['save_question'])) {
        // Если запрос пришел от нашего JS fetch, можно вывести "ok" и выйти
        // Но для простоты, если мы не хотим делать редирект:
        if (isset($_POST['save_question']) && !isset($_POST['ajax_manual_flag'])) {
             // Если вы хотите оставить поддержку обычной отправки формы (без JS),
             // закомментируйте строку ниже. 
             // exit; 
        }
    }
    $message = "Вопрос обновлен!";
}

$books = $pdo->query("SELECT * FROM books")->fetchAll();
$selectedBookId = $_GET['edit_book'] ?? null;
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Редактор тестов</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; padding: 20px; color: #333; }
        .container { max-width: 1100px; margin: 0 auto; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .flex-form { display: flex; gap: 10px; margin-top: 10px; }
        input[type="text"], textarea, select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; flex-grow: 1; }
        .btn { padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; color: white; font-weight: bold; }
        .btn-blue { background: #1a73e8; }
        .btn-green { background: #34a853; }
        .btn-orange { background: #fbbc05; color: #333; }
        .chapter-section { border-left: 4px solid #1a73e8; padding-left: 20px; margin-top: 30px; }
        .alert { background: #e6f4ea; color: #137333; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #34a853; }
        details { background: #f9f9f9; padding: 10px; border-radius: 5px; }
		
		/* Обновленные стили для полей ввода */
		.form-group-admin {
			display: flex;
			flex-direction: column;
			margin-bottom: 15px;
		}
		.form-group-admin label {
			font-weight: bold;
			margin-bottom: 5px;
			font-size: 14px;
		}
		.auto-resize {
			width: 100%;
			min-height: 100px;
			resize: vertical; /* Позволяет пользователю растягивать вручную, если нужно */
			padding: 10px;
			box-sizing: border-box;
		}
		
    </style>
</head>
<body>
<div class="container">
    <h1>Управление контентом</h1>
    <?php if ($message): ?><div class="alert"><?= $message ?></div><?php endif; ?>

    <div class="card">
        <h2>Книги</h2>
        <form method="post" class="flex-form">
            <input type="text" name="book_title" placeholder="Новая книга" required>
            <button type="submit" name="add_book" class="btn btn-blue">Создать</button>
        </form>
        <hr>
        <?php foreach ($books as $b): ?>
            <div class="flex-form" style="align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                <form method="post" style="display:flex; flex-grow:1; gap:10px;">
                    <input type="hidden" name="book_id" value="<?= $b['id'] ?>">
                    <input type="text" name="new_title" value="<?= htmlspecialchars($b['title']) ?>">
                    <button type="submit" name="rename_book" class="btn btn-orange">Переименовать</button>
                </form>
                <a href="?edit_book=<?= $b['id'] ?>" class="btn btn-blue" style="text-decoration:none;">Управлять главами</a>
            </div>
        <?php endforeach; ?>
    </div>

    <?php if ($selectedBookId): ?>
        <div class="card">
            <?php 
                $stmt = $pdo->prepare("SELECT title FROM books WHERE id = ?");
                $stmt->execute([$selectedBookId]);
                $bookTitle = $stmt->fetchColumn();
            ?>
            <h2>Книга: <?= htmlspecialchars($bookTitle) ?></h2>
            
            <form method="post" class="flex-form" style="background:#f0f7ff; padding:15px; border-radius:8px;">
                <input type="hidden" name="book_id" value="<?= $selectedBookId ?>">
                <input type="text" name="chapter_name" placeholder="Название новой главы" required>
                <button type="submit" name="add_chapter" class="btn btn-green">Добавить главу</button>
            </form>

            <?php
            $stmtCh = $pdo->prepare("SELECT * FROM chapters WHERE book_id = ?");
            $stmtCh->execute([$selectedBookId]);
            while ($ch = $stmtCh->fetch()):
            ?>
                <div class="chapter-section">
                    <form method="post" class="flex-form">
                        <input type="hidden" name="chapter_id" value="<?= $ch['id'] ?>">
                        <input type="text" name="new_chapter_name" value="<?= htmlspecialchars($ch['chapter_name']) ?>" style="font-weight:bold; font-size:1.1em;">
                        <button type="submit" name="rename_chapter" class="btn btn-orange">Обновить название</button>
                    </form>

                    <form method="post" style="margin: 15px 0;">
                        <input type="hidden" name="chapter_id" value="<?= $ch['id'] ?>">
                        <textarea name="json_text" placeholder="Вставьте JSON вопросов..."></textarea>
                        <button type="submit" name="import_json_questions" class="btn btn-blue">Импорт вопросов</button>
                    </form>

                    <details>
                        <summary>Редактировать вопросы (<?php 
                            $c = $pdo->prepare("SELECT COUNT(*) FROM questions WHERE chapter_id = ?");
                            $c->execute([$ch['id']]); echo $c->fetchColumn(); 
                        ?>)</summary>
							<?php
							$stmtQ = $pdo->prepare("SELECT * FROM questions WHERE chapter_id = ? ORDER BY idx");
							$stmtQ->execute([$ch['id']]);
							while ($q = $stmtQ->fetch()):
							?>
<div style="border:1px solid #ddd; padding:15px; margin-top:10px; background:white; border-radius: 8px;">
    <form method="post">
        <input type="hidden" name="question_id" value="<?= $q['id'] ?>">
        
        <div class="form-group-admin">
            <label>Текст вопроса:</label>
            <textarea name="question_text" class="auto-resize" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'"><?= htmlspecialchars($q['question_text']) ?></textarea>
        </div>
        
        <label>Варианты ответов:</label>
        <div style="margin: 10px 0; padding: 10px; background: #f1f3f4; border-radius: 5px;">
            <?php
            $stmtA = $pdo->prepare("SELECT * FROM answers WHERE question_id = ? ORDER BY letter");
            $stmtA->execute([$q['id']]);
            while ($ans = $stmtA->fetch()):
            ?>
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                    <input type="hidden" name="ans_ids[]" value="<?= $ans['id'] ?>">
                    <strong style="width: 20px;"><?= $ans['letter'] ?>:</strong>
                    <input type="text" name="ans_texts[<?= $ans['id'] ?>]" value="<?= htmlspecialchars($ans['answer_text']) ?>" style="flex-grow: 1;">
                    <label style="white-space: nowrap; font-size: 0.9em; margin-bottom: 0;">
                        <input type="checkbox" name="ans_corrects[]" value="<?= $ans['id'] ?>" <?= $ans['is_correct'] ? 'checked' : '' ?>>
                        Верный
                    </label>
                </div>
            <?php endwhile; ?>
        </div>

        <div class="form-group-admin">
            <label>Пояснение (Explanation):</label>
            <textarea name="explanation" class="auto-resize" placeholder="Пояснение" oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'"><?= htmlspecialchars($q['explanation']) ?></textarea>
        </div>
        
        <div style="display: flex; gap: 15px; align-items: center;">
            <select name="select_type" style="width: auto; flex-grow: 0;">
                <option value="single" <?= $q['select_type']=='single'?'selected':'' ?>>single</option>
                <option value="multiply" <?= $q['select_type']=='multiply'?'selected':'' ?>>multiply</option>
            </select>
            <button type="submit" name="save_question" class="btn btn-green">Сохранить изменения</button>
        </div>
    </form>
</div>
							<?php endwhile; ?>
                    </details>
                </div>
            <?php endwhile; ?>
        </div>
    <?php endif; ?>
</div>

<script>
// Функция для инициализации высоты всех textarea с классом auto-resize
function adjustAllTextareas() {
    document.querySelectorAll('.auto-resize').forEach(el => {
        el.style.height = '';
        el.style.height = el.scrollHeight + 'px';
    });
}

// Запускаем при клике на <details>, так как скрытые элементы имеют scrollHeight = 0
document.querySelectorAll('details').forEach(det => {
    det.addEventListener('toggle', () => {
        if (det.open) adjustAllTextareas();
    });
});

// На всякий случай при загрузке страницы
window.addEventListener('load', adjustAllTextareas);
</script>

<script>
document.addEventListener('submit', async function(e) {
    // Проверяем, что нажата кнопка сохранения вопроса
    if (e.target.closest('form') && e.target.querySelector('button[name="save_question"]')) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        // Добавляем флаг, чтобы сервер понял, что это сохранение
        formData.append('save_question', '1');

        try {
            const response = await fetch(window.location.href, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const btn = form.querySelector('button[name="save_question"]');
                const originalText = btn.innerText;
                
                // Визуальная индикация успеха
                btn.innerText = '✅ Сохранено!';
                btn.classList.replace('btn-green', 'btn-blue');
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.replace('btn-blue', 'btn-green');
                }, 2000);
            } else {
                alert('Ошибка при сохранении');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка соединения');
        }
    }
});

// Ваш предыдущий код для авто-размера textarea и раскрытия details
function adjustAllTextareas() {
    document.querySelectorAll('.auto-resize').forEach(el => {
        el.style.height = '';
        el.style.height = el.scrollHeight + 'px';
    });
}

document.querySelectorAll('details').forEach(det => {
    det.addEventListener('toggle', () => {
        if (det.open) adjustAllTextareas();
    });
});

window.addEventListener('load', adjustAllTextareas);
</script>


</body>
</html>