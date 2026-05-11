<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['files'])) {
    $uploadDir = "C:\\vhosts\\movie\\yt_subtitle\\downloads\\"; 
    $pythonPath = "C:\\Python313\\python.exe";
    $scriptPath = "C:\\vhosts\\movie\\yt_subtitle\\merge.py";

    $format = $_POST['format'] ?? 'xlsx';
    $files = $_FILES['files'];
    $totalFiles = count($files['name']);
    
    $processedFiles = [];

    // Идем по файлам с шагом 2
    for ($i = 0; $i < $totalFiles; $i += 2) {
        // Проверяем, есть ли пара для текущего файла
        if (isset($files['name'][$i+1])) {
            $pair = [];
            
            // Загружаем два файла текущей пары
            for ($j = 0; $j < 2; $j++) {
                $idx = $i + $j;
                $tmpPath = $files['tmp_name'][$idx];
                $originalName = basename($files['name'][$idx]);
                $targetPath = $uploadDir . time() . "_" . $originalName; // Добавляем время, чтобы избежать конфликтов имен
                
                if (move_uploaded_file($tmpPath, $targetPath)) {
                    $pair[] = $targetPath;
                }
            }

            // Если пара успешно загружена на сервер, запускаем Python
            if (count($pair) === 2) {
                $file1 = escapeshellarg($pair[0]);
                $file2 = escapeshellarg($pair[1]);
                $outDir = escapeshellarg($uploadDir);
                $argFormat = escapeshellarg($format);

                $command = "$pythonPath $scriptPath $file1 $file2 $outDir $argFormat 2>&1";
                exec($command, $output, $returnCode);

                $resultLine = end($output);
                if ($returnCode === 0 && strpos($resultLine, "SUCCESS:") !== false) {
                    $fileName = trim(str_replace("SUCCESS:", "", $resultLine));
                    $processedFiles[] = $fileName;
                }
                
                // Удаляем временные исходные файлы сразу после обработки пары
                unlink($pair[0]);
                unlink($pair[1]);
            }
        }
    }

    // Если обработали файлы, отдаем их пользователю через JS (так как header() сработает только для одного файла)
    if (!empty($processedFiles)) {
        echo "<h3>Готово! Файлы объединены:</h3>";
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
        echo "<h3>Ошибка: не удалось обработать ни одной пары файлов.</h3>";
        echo "<p><a href='merge.php'>Попробовать снова</a></p>";
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Merge Multiple Pairs</title>
    <style>
        body { font-family: sans-serif; max-width: 500px; margin: 50px auto; border: 1px solid #ccc; padding: 20px; border-radius: 10px; background: #f4f4f9; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        input[type="file"], button { width: 100%; margin: 10px 0; padding: 12px; box-sizing: border-box; }
        button { background-color: #007bff; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px; }
        button:hover { background-color: #0056b3; }
        .radio-group { margin: 15px 0; border: 1px dashed #bbb; padding: 15px; border-radius: 4px; background: #fff; }
        .info { font-size: 0.9em; color: #666; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Слияние пар файлов</h2>
        <p class="info">Выберите четное количество файлов. Скрипт объединит их попарно (1 со 2, 3 с 4 и т.д.)</p>
        
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

            <button type="submit">Объединить все пары</button>
        </form>
    </div>
</body>
</html>