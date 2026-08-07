<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['files'])) {
    $uploadDir = "C:\\vhosts\\movie\\yt_subtitle\\downloads\\"; 
    $pythonPath = "C:\\Python313\\python.exe";
    $scriptPath = "C:\\vhosts\\movie\\yt_subtitle\\merge.py";

    $format = $_POST['format'] ?? 'xlsx';
    $files = $_FILES['files'];
    $totalFiles = count($files['name']);
    
    // 1. Загружаем все файлы и группируем их по префиксу имени (до первой точки)
    $groups = [];
    for ($i = 0; $i < $totalFiles; $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $originalName = $files['name'][$i];
            
            // Извлекаем префикс до первой точки
            $dotPos = strpos($originalName, '.');
            $prefix = ($dotPos !== false) ? substr($originalName, 0, $dotPos) : $originalName;
            
            $tmpPath = $files['tmp_name'][$i];
            $targetPath = $uploadDir . time() . "_" . $i . "_" . $originalName;
            
            if (move_uploaded_file($tmpPath, $targetPath)) {
                $groups[$prefix][] = $targetPath;
            }
        }
    }

    $processedFiles = [];

    // 2. Обрабатываем сформированные группы
    foreach ($groups as $prefix => $paths) {
        // Проверяем, что в группе ровно два файла для слияния
        if (count($paths) === 2) {
            $file1 = escapeshellarg($paths[0]);
            $file2 = escapeshellarg($paths[1]);
            $outDir = escapeshellarg($uploadDir);
            $argFormat = escapeshellarg($format);

            // Запуск Python-скрипта для пары
            $command = "$pythonPath $scriptPath $file1 $file2 $outDir $argFormat 2>&1";
            exec($command, $output, $returnCode);

            $resultLine = end($output);
            if ($returnCode === 0 && strpos($resultLine, "SUCCESS:") !== false) {
                $fileName = trim(str_replace("SUCCESS:", "", $resultLine));
                $processedFiles[] = $fileName;
            }
            
            // Удаляем временные исходные файлы
            foreach ($paths as $p) { unlink($p); }
        } else {
            // Если файлов в группе не два, просто удаляем их (не пара)
            foreach ($paths as $p) { unlink($p); }
        }
    }

    // 3. Выдача результатов
    if (!empty($processedFiles)) {
        echo "<h3>Готово! Пары объединены по именам:</h3>";
        echo "<script>";
        foreach ($processedFiles as $fName) {
            $fileUrl = "downloads/" . $fName;
            echo "
            (function() {
                var link = document.createElement('a');
                link.href = '$fileUrl';
                link.download = '$fName';
                document.body.appendChild(link);
                setTimeout(function() {
                    link.click();
                    document.body.removeChild(link);
                }, 500); 
            })();
            ";
        }
        echo "</script>";
        echo "<p><a href='merge.php'>Назад</a></p>";
        exit;
    } else {
        echo "<h3>Ошибка: не найдено подходящих пар файлов с одинаковыми именами.</h3>";
        echo "<p><a href='merge.php'>Попробовать снова</a></p>";
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Merge Pairs by Name</title>
    <style>
        body { font-family: sans-serif; max-width: 500px; margin: 50px auto; border: 1px solid #ccc; padding: 20px; border-radius: 10px; background: #f4f4f9; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        input[type="file"], button { width: 100%; margin: 10px 0; padding: 12px; box-sizing: border-box; }
        button { background-color: #28a745; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px; }
        .radio-group { margin: 15px 0; border: 1px dashed #bbb; padding: 15px; border-radius: 4px; }
        .info { font-size: 0.9em; color: #666; margin-bottom: 15px; background: #e7f3fe; padding: 10px; border-left: 4px solid #2196F3; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Слияние пар по имени</h2>
        <p class="info">Скрипт автоматически найдет пары файлов, у которых совпадает название до первой точки (например, <b>video1</b>.ru.xlsx и <b>video1</b>.en.xlsx).</p>
        
        <form method="POST" enctype="multipart/form-data">
            <label>Выберите файлы .xlsx:</label>
            <input type="file" name="files[]" multiple accept=".xlsx" required>
            
            <div class="radio-group">
                <label><strong>Формат результата:</strong></label><br><br>
                <input type="radio" name="format" value="xlsx" id="f_xlsx" checked>
                <label for="f_xlsx">Excel (.xlsx)</label><br>
                <input type="radio" name="format" value="txt" id="f_txt">
                <label for="f_txt">Текст (TSV .txt)</label>
            </div>

            <button type="submit">Найти пары и объединить</button>
        </form>
    </div>
</body>
</html>