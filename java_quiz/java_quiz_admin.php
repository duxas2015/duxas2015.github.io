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

// 4. Сохранение вопроса
if (isset($_POST['save_question'])) {
    $stmt = $pdo->prepare("UPDATE questions SET question_text = ?, select_type = ?, explanation = ? WHERE id = ?");
    $stmt->execute([$_POST['question_text'], $_POST['select_type'], $_POST['explanation'], $_POST['question_id']]);
    if (isset($_POST['answers'])) {
        foreach ($_POST['answers'] as $ansId => $ansData) {
            $isCorrect = isset($ansData['is_correct']) ? 1 : 0;
            $stmt = $pdo->prepare("UPDATE answers SET answer_text = ?, is_correct = ? WHERE id = ?");
            $stmt->execute([$ansData['text'], $isCorrect, $ansId]);
        }
    }
    $message = "Вопрос сохранен!";
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
                            <div style="border:1px solid #ddd; padding:15px; margin-top:10px; background:white;">
                                <form method="post">
                                    <input type="hidden" name="question_id" value="<?= $q['id'] ?>">
                                    <textarea name="question_text"><?= htmlspecialchars($q['question_text']) ?></textarea>
                                    <textarea name="explanation" placeholder="Пояснение"><?= htmlspecialchars($q['explanation']) ?></textarea>
                                    <select name="select_type">
                                        <option value="single" <?= $q['select_type']=='single'?'selected':'' ?>>single</option>
                                        <option value="multiply" <?= $q['select_type']=='multiply'?'selected':'' ?>>multiply</option>
                                    </select>
                                    <button type="submit" name="save_question" class="btn btn-green">Сохранить</button>
                                </form>
                            </div>
                        <?php endwhile; ?>
                    </details>
                </div>
            <?php endwhile; ?>
        </div>
    <?php endif; ?>
</div>
</body>
</html>