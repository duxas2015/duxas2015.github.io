<?php
require 'db.php';

$code = $_GET['header_code'] ?? '';

$stmt = $pdo->prepare("
    SELECT t.header, td.text_row_en, td.text_row_ru 
    FROM text t
    JOIN text_detail td ON t.id = td.id
    WHERE t.header_code = ?
    ORDER BY td.idx ASC
");
$stmt->execute([$code]);
$rows = $stmt->fetchAll();

if (!$rows) {
    die("Текст не найден.");
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($rows[0]['header']) ?></title>
    <style>
        body { font-family: sans-serif; padding: 15px; }
        .controls { 
            position: sticky; 
            top: 0; 
            background: white; 
            padding: 10px 0; 
            border-bottom: 1px solid #eee;
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
        }
        button { 
            padding: 10px 20px; 
            font-size: 18px; 
            cursor: pointer; 
            border: 1px solid #ccc;
            background: #f0f0f0;
            border-radius: 5px;
            /* Улучшение для Android (убирает стандартные стили кнопок) */
            -webkit-appearance: none;
        }
        table { border-collapse: collapse; width: 100%; font-size: 16px; }
        td, th { border: 1px solid #ccc; padding: 12px; text-align: left; vertical-align: top; }
        tr:nth-child(even) { background: #f9f9f9; }
        
        /* Стили для мобильных устройств */
        @media (max-width: 600px) {
            td { word-break: break-word; }
        }
    </style>
</head>
<body>

    <div class="controls">
        <a href="list.php"><button type="button">←</button></a>
        <button onclick="changeFontSize(1.1)">A +</button>
        <button onclick="changeFontSize(0.9)">A -</button>
    </div>

    <h1><?= htmlspecialchars($rows[0]['header']) ?></h1>

    <table id="textTable">
        <thead>
            <tr>
                <th>English</th>
                <th>Русский</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($rows as $row): ?>
            <tr>
                <td><?= htmlspecialchars($row['text_row_en']) ?></td>
                <td><?= htmlspecialchars($row['text_row_ru']) ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <script>
        function changeFontSize(multiplier) {
            const table = document.getElementById('textTable');
            // Получаем текущий вычисленный размер шрифта
            let currentSize = parseFloat(window.getComputedStyle(table).fontSize);
            
            // Вычисляем новый размер
            let newSize = currentSize * multiplier;
            
            // Ограничиваем разумными пределами (от 8px до 80px)
            if (newSize > 8 && newSize < 80) {
                table.style.fontSize = newSize + 'px';
            }
        }
    </script>
</body>
</html>