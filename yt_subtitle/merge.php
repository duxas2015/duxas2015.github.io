<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['files'])) {
    $uploadDir = "C:\\vhosts\\movie\\yt_subtitle\\downloads\\"; // Укажите ваш путь
    $pythonPath = "C:\\Python313\\python.exe";
    $scriptPath = "C:\\vhosts\\movie\\yt_subtitle\\merge.py";

    $files = $_FILES['files'];
    $uploadedPaths = [];

    // 1. Сохраняем загруженные файлы
    if (count($files['name']) >= 2) {
        for ($i = 0; $i < 2; $i++) {
            $tmpPath = $files['tmp_name'][$i];
            $newName = $uploadDir . basename($files['name'][$i]);
            if (move_uploaded_file($tmpPath, $newName)) {
                $uploadedPaths[] = $newName;
            }
        }
    }

    if (count($uploadedPaths) === 2) {
        $file1 = escapeshellarg($uploadedPaths[0]);
        $file2 = escapeshellarg($uploadedPaths[1]);
        $outDir = escapeshellarg($uploadDir);

        // 2. Запускаем Python-скрипт
        $command = "$pythonPath $scriptPath $file1 $file2 $outDir 2>&1";
        exec($command, $output, $returnCode);

        // 3. Обрабатываем результат
        $resultLine = end($output);
        if ($returnCode === 0 && strpos($resultLine, "SUCCESS:") !== false) {
            $fileName = trim(str_replace("SUCCESS:", "", $resultLine));
            $fullPath = $uploadDir . $fileName;

            if (file_exists($fullPath)) {
                // Автоматическая выгрузка в браузер
                header('Content-Description: File Transfer');
                header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                header('Content-Disposition: attachment; filename="merged_data.xlsx"');
                header('Content-Length: ' . filesize($fullPath));
                readfile($fullPath);
                
                // Удаляем временные файлы
                unlink($uploadedPaths[0]);
                unlink($uploadedPaths[1]);
                unlink($fullPath);
                exit;
            }
        } else {
            echo "<h3>Ошибка при слиянии:</h3><pre>" . implode("\n", $output) . "</pre>";
        }
    } else {
        echo "<h3>Пожалуйста, выберите 2 файла .xlsx</h3>";
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Merge Excel Files</title>
    <style>
        body { font-family: sans-serif; max-width: 500px; margin: 50px auto; border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
        input, button { width: 100%; margin: 10px 0; padding: 10px; }
        button { background-color: #007bff; color: white; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h2>Слияние двух Excel файлов</h2>
    <form method="POST" enctype="multipart/form-data">
        <label>Выберите два файла .xlsx одновременно:</label>
        <input type="file" name="files[]" multiple accept=".xlsx" required>
        <button type="submit">Объединить и скачать</button>
    </form>
    <p style="font-size: 0.8em; color: #666;">* Выберите два файла в окне выбора, зажав Ctrl или Shift.</p>
</body>
</html>