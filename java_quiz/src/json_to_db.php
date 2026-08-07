<?php
// Настройки подключения
$host = 'localhost';
$db   = 'javaquiz';
$user = 'root';
$pass = 'mysql'; // Ваш пароль
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    $error = "Ошибка подключения: " . $e->getMessage();
}

$message = "";

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['json_file'])) {
    $json_content = file_get_contents($_FILES['json_file']['tmp_name']);
    $books = json_decode($json_content, true);

    if ($books === null) {
        $message = "Ошибка: Некорректный JSON файл.";
    } else {
        try {
            $pdo->beginTransaction();

            foreach ($books as $bookData) {
                // Вставка книги
                $stmt = $pdo->prepare("INSERT INTO books (title) VALUES (?)");
                $stmt->execute([$bookData['book']]);
                $bookId = $pdo->lastInsertId();

                foreach ($bookData['chapters'] as $chapterData) {
                    // Вставка главы
                    $stmt = $pdo->prepare("INSERT INTO chapters (book_id, chapter_name) VALUES (?, ?)");
                    $stmt->execute([$bookId, $chapterData['chapter_name']]);
                    $chapterId = $pdo->lastInsertId();

                    foreach ($chapterData['questions'] as $q) {
                        // Вставка вопроса
                        $stmt = $pdo->prepare("INSERT INTO questions (chapter_id, idx, question_text, select_type, explanation) VALUES (?, ?, ?, ?, ?)");
                        $stmt->execute([
                            $chapterId,
                            $q['idx'],
                            $q['text'],
                            $q['select_type'],
                            $q['correct']['description'] ?? null
                        ]);
                        $questionId = $pdo->lastInsertId();

                        // Список правильных букв
                        $correctLetters = $q['correct']['letter'] ?? [];

                        foreach ($q['answers'] as $ans) {
                            // Вставка варианта ответа
                            $isCorrect = in_array($ans['letter'], $correctLetters) ? 1 : 0;
                            $stmt = $pdo->prepare("INSERT INTO answers (question_id, letter, answer_text, is_correct) VALUES (?, ?, ?, ?)");
                            $stmt->execute([
                                $questionId,
                                $ans['letter'],
                                $ans['text'],
                                $isCorrect
                            ]);
                        }
                    }
                }
            }

            $pdo->commit();
            $message = "Данные успешно загружены в базу!";
        } catch (Exception $e) {
            $pdo->rollBack();
            $message = "Критическая ошибка: " . $e->getMessage();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>JSON to MySQL Loader</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 50px auto; line-height: 1.6; }
        .box { border: 1px solid #ccc; padding: 20px; border-radius: 8px; background: #f9f9f9; }
        .msg { padding: 10px; margin-bottom: 20px; border-radius: 4px; background: #e3f2fd; color: #0d47a1; }
    </style>
</head>
<body>

<div class="box">
    <h2>Загрузка JSON книг</h2>
    <?php if ($message): ?>
        <div class="msg"><?php echo htmlspecialchars($message); ?></div>
    <?php endif; ?>

    <form method="post" enctype="multipart/form-data">
        <p>Выберите JSON файл:</p>
        <input type="file" name="json_file" accept=".json" required>
        <br><br>
        <button type="submit">Загрузить в базу данных</button>
    </form>
</div>

</body>
</html>