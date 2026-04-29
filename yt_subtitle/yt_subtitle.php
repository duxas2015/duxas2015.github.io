<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $url = $_POST['url'];
    // Получаем выбранный язык из выпадающего списка
    $selectedLang = $_POST['lang_choice'] ?? 'ru';
    
    $pythonPath = "C:\\Python313\\python.exe";
    $scriptPath = "C:\\vhosts\\movie\\yt_subtitle\\processor5.py";
    $outputDir = "C:\\vhosts\\movie\\yt_subtitle\\downloads";

    $escapedUrl = escapeshellarg($url);
    $escapedLangs = escapeshellarg($selectedLang); // Передаем только один выбранный язык
    $escapedOut = escapeshellarg($outputDir);

    // Установка кодировки и запуск
    $command = "set PYTHONIOENCODING=utf-8 && $pythonPath $scriptPath $escapedUrl $escapedLangs --output-dir $escapedOut 2>&1";
    
    exec($command, $output, $returnCode);

    if ($returnCode === 0) {
        echo "<h3>Готово! Файл скачивается...</h3>";
        echo "<script>";
        foreach ($output as $line) {
            if (strpos($line, "- ") === 0) {
                $fileName = trim(str_replace("- ", "", $line));
                $fileUrl = "downloads/" . $fileName;
                
                echo "
                (function() {
                    var link = document.createElement('a');
                    link.href = '$fileUrl';
                    link.download = '$fileName';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })();
                ";
            }
        }
        echo "</script>";
        echo "<p><a href='yt_subtitle.php'>Назад</a></p>";
        exit;
    } else {
        echo "<h3>Ошибка:</h3><pre>" . implode("\n", $output) . "</pre>";
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>YouTube Subtitles</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; }
        input, select, button { width: 100%; padding: 10px; margin: 10px 0; display: block; }
        label { font-size: 0.9em; color: #555; }
    </style>
</head>
<body>
    <h2>Генератор субтитров</h2>
    <form method="POST">
        <label>Ссылка на видео:</label>
        <input type="text" name="url" placeholder="https://www.youtube.com/watch?v=..." required>
        
        <label>Выберите язык субтитров:</label>
        <select name="lang_choice">
            <option value="ru">Русский (RU)</option>
            <option value="en">Английский (EN)</option>
        </select>
        
        <button type="submit">Сгенерировать и скачать</button>
    </form>
</body>
</html>