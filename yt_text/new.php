<?php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['content'])) {
    $header = $_POST['header'];
    $header_code = bin2hex(random_bytes(5)); // Генерируем случайный код для URL
    $content = trim($_POST['content']);
    $lines = explode("\n", $content);

    try {
        $pdo->beginTransaction();

        // 1. Вставляем заголовок
        $stmt = $pdo->prepare("INSERT INTO text (header, header_code) VALUES (?, ?)");
        $stmt->execute([$header, $header_code]);
        $text_id = $pdo->lastInsertId();

        // 2. Вставляем строки
        $stmtDetail = $pdo->prepare("INSERT INTO text_detail (id, idx, text_row_en, text_row_ru) VALUES (?, ?, ?, ?)");
        
        foreach ($lines as $index => $line) {
            $parts = explode("\t", $line);
            $en = trim($parts[0] ?? '');
            $ru = trim($parts[1] ?? '');
            
            if ($en || $ru) {
                $stmtDetail->execute([$text_id, $index, $en, $ru]);
            }
        }

        $pdo->commit();
        header("Location: list.php");
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        echo "Ошибка сохранения: " . $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html>
<head><title>Новый текст</title></head>
<body>
    <h1>Добавить текст</h1>
    <form method="post">
        <input type="text" name="header" placeholder="Заголовок текста" required style="width: 100%; margin-bottom: 10px;"><br>
        <textarea name="content" rows="15" style="width: 100%;" placeholder="English [TAB] Russian"></textarea><br>
        <button type="submit">Сохранить</button>
    </form>
    <p><a href="list.php">К списку текстов</a></p>
</body>
</html>