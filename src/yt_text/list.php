<?php
require 'db.php';
$stmt = $pdo->query("SELECT header, header_code FROM text ORDER BY id DESC");
$texts = $stmt->fetchAll();
?>

<!DOCTYPE html>
<html>
<head><title>Список текстов</title></head>
<body>
    <h1>Архив текстов</h1>
    <ul>
        <?php foreach ($texts as $row): ?>
            <li>
                <a href="view.php?header_code=<?= htmlspecialchars($row['header_code']) ?>">
                    <?= htmlspecialchars($row['header']) ?>
                </a>
            </li>
        <?php endforeach; ?>
    </ul>
    <a href="new.php">+ Добавить новый</a>
    <a href="upload_excel.php">+ Добавить новый из файла</a>
</body>
</html>