<?php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $header = $_POST['header'];
    $header_code = bin2hex(random_bytes(5));
    $data = null;

    $pythonPath = "C:\\Python313\\python.exe";
    $scriptPath = "C:\\vhosts\\movie\\yt_text\\process_xlsx.py";

    // 1. ПРОВЕРКА: Загрузка через текстовое поле или текстовый файл (.txt с табуляцией)
    $rawText = $_POST['manual_text'] ?? '';
    
    // Если загружен текстовый файл, берем содержимое из него
    if (isset($_FILES['text_file']) && $_FILES['text_file']['error'] === UPLOAD_ERR_OK) {
        $rawText = file_get_contents($_FILES['text_file']['tmp_name']);
    }

    if (!empty(trim($rawText))) {
        // Обработка текста с разделителем TAB
        $data = [];
        $lines = explode("\n", str_replace("\r", "", trim($rawText)));
        foreach ($lines as $line) {
            $cols = explode("\t", $line);
            $data[] = [
                'en' => $cols[0] ?? '',
                'ru' => $cols[1] ?? ''
            ];
        }
    } 
    // 2. ПРОВЕРКА: Загрузка через 2 Excel файла (старая логика)
    elseif (isset($_FILES['excel_files']) && count($_FILES['excel_files']['name']) === 2) {
        $path1 = $_FILES['excel_files']['tmp_name'][0];
        $path2 = $_FILES['excel_files']['tmp_name'][1];

        $command = escapeshellcmd("$pythonPath $scriptPath " . escapeshellarg($path1) . " " . escapeshellarg($path2));
        $output = shell_exec($command);
        $data = json_decode($output, true);
    }

    // 3. СОХРАНЕНИЕ В БД
    if ($data && !isset($data['error'])) {
        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("INSERT INTO text (header, header_code) VALUES (?, ?)");
            $stmt->execute([$header, $header_code]);
            $text_id = $pdo->lastInsertId();

            $stmtDetail = $pdo->prepare("INSERT INTO text_detail (id, idx, text_row_en, text_row_ru) VALUES (?, ?, ?, ?)");
            
            foreach ($data as $index => $row) {
                $stmtDetail->execute([$text_id, $index, $row['en'], $row['ru']]);
            }

            $pdo->commit();
            header("Location: list.php");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            echo "Ошибка БД: " . $e->getMessage();
        }
    } else {
        echo "Ошибка: Не удалось получить данные для загрузки (проверьте формат файла или Python скрипт).";
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Загрузка данных</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 20px auto; line-height: 1.6; }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        h3 { margin-top: 0; color: #333; }
        textarea { width: 100%; height: 100px; font-family: monospace; }
        .hint { font-size: 0.85em; color: #666; }
    </style>
</head>
<body>
    <h1>Загрузить текст в БД</h1>
    <form method="post" enctype="multipart/form-data">
        <input type="text" name="header" placeholder="Заголовок (название видео/текста)" required style="width: 100%; padding: 8px; margin-bottom: 15px;"><br>

        <div class="section">
            <h3>Вариант А: Текст или TXT файл (Tab-separated)</h3>
            <label>Текстовый файл (.txt):</label><br>
            <input type="file" name="text_file" accept=".txt"><br><br>
            
            <label>Или вставьте текст вручную (Столбец1 [TAB] Столбец2):</label>
            <textarea name="manual_text" placeholder="English text [TAB] Русский текст"></textarea>
            <p class="hint">Файл/текст должен содержать два столбца, разделенных табуляцией.</p>
        </div>

        <div class="section">
            <h3>Вариант Б: Два Excel файла (.xlsx)</h3>
            <label>Выберите два файла одновременно:</label><br>
            <input type="file" name="excel_files[]" multiple accept=".xlsx">
        </div>

        <button type="submit" style="padding: 10px 20px; background: #28a745; color: white; border: none; cursor: pointer;">Загрузить в базу</button>
    </form>
    <p><a href="list.php">← К списку текстов</a></p>
</body>
</html>