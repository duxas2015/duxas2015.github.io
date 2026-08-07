<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['files'])) {
    $uploadDir = "/var/www/html/yt_subtitle/downloads/"; 
    $pythonPath = "/usr/bin/python3";
    $scriptPath = "/var/www/html/yt_subtitle/py/merge.py";

    $format = $_POST['format'] ?? 'xlsx';
    $files = $_FILES['files'];
    $uploadedPaths = [];

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
        $argFormat = escapeshellarg($format);

        $command = "$pythonPath $scriptPath $file1 $file2 $outDir $argFormat 2>&1";
        exec($command, $output, $returnCode);

        $resultLine = end($output);
        if ($returnCode === 0 && strpos($resultLine, "SUCCESS:") !== false) {
            $fileName = trim(str_replace("SUCCESS:", "", $resultLine));
            $fullPath = $uploadDir . $fileName;

            if (file_exists($fullPath)) {
                header('Content-Description: File Transfer');
                
                if ($format === 'xlsx') {
                    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                } else {
                    header('Content-Type: text/plain');
                }
                
                header('Content-Disposition: attachment; filename="' . $fileName . '"');
                header('Content-Length: ' . filesize($fullPath));
                readfile($fullPath);
                
                unlink($uploadedPaths[0]);
                unlink($uploadedPaths[1]);
                unlink($fullPath);
                exit;
            }
        } else {
            echo "<h3>Ошибка:</h3><pre>" . implode("\n", $output) . "</pre>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Merge Files</title>
    <style>
        body { font-family: sans-serif; max-width: 500px; margin: 50px auto; border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
        input[type="file"], button { width: 100%; margin: 10px 0; padding: 10px; }
        button { background-color: #28a745; color: white; border: none; cursor: pointer; font-weight: bold; }
        .radio-group { margin: 15px 0; border: 1px dashed #bbb; padding: 10px; }
    </style>
</head>
<body>
    <h2>Слияние файлов</h2>
    <form method="POST" enctype="multipart/form-data">
        <label>Выберите два файла .xlsx:</label>
        <input type="file" name="files[]" multiple accept=".xlsx" required>
        
        <div class="radio-group">
            <label>Формат результата:</label><br>
            <input type="radio" name="format" value="xlsx" id="f_xlsx" checked>
            <label for="f_xlsx">Excel (.xlsx)</label><br>
            <input type="radio" name="format" value="txt" id="f_txt">
            <label for="f_txt">Текст (Tab-separated .txt)</label>
        </div>

        <button type="submit">Объединить и скачать</button>
    </form>
</body>
</html>
