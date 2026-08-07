<?php
set_time_limit(600);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $videoUrl = $_POST['url'] ?? '';
    $playlistUrl = $_POST['playlist_url'] ?? '';
    $selectedLang = $_POST['lang_choice'] ?? 'ru';
    
    $pythonPath = "C:\\Python313\\python.exe";
    $outputDir = "C:\\vhosts\\movie\\yt_subtitle\\downloads";
    
    // Логика выбора скрипта и URL
    if (!empty($playlistUrl)) {
        $scriptPath = "C:\\vhosts\\movie\\yt_subtitle\\processor_playlist.py";
        $targetUrl = $playlistUrl;
    } else {
        $scriptPath = "C:\\vhosts\\movie\\yt_subtitle\\processor5.py";
        $targetUrl = $videoUrl;
    }

    $escapedUrl = escapeshellarg($targetUrl);
    $escapedLangs = escapeshellarg($selectedLang);
    $escapedOut = escapeshellarg($outputDir);

    // Установка кодировки и запуск
    $command = "set PYTHONIOENCODING=utf-8 && $pythonPath $scriptPath $escapedUrl $escapedLangs --output-dir $escapedOut 2>&1";
    
    exec($command, $output, $returnCode);

    if ($returnCode === 0) {
        echo "<h3>Готово! Файлы обработаны.</h3>";
        echo "<script>";
        foreach ($output as $line) {
            // Новое регулярное выражение: 
            // Ищет любую строку, заканчивающуюся на .xlsx
            if (preg_match('/([a-zA-Z0-9_-]+\.[a-z]{2,4}\.xlsx)$/i', trim($line), $matches)) {
                $fileName = $matches[1];
                $fileUrl = "downloads/" . $fileName;
                
                echo "
                (function() {
                    var link = document.createElement('a');
                    link.href = '$fileUrl';
                    link.download = '$fileName';
                    document.body.appendChild(link);
                    setTimeout(function() {
                        link.click();
                        document.body.removeChild(link);
                    }, 100); // Небольшая задержка для стабильности в очереди скачивания
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
        body { font-family: Arial, sans-serif; max-width: 450px; margin: 50px auto; line-height: 1.6; }
        .section { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #f9f9f9; }
        input, select, button { width: 100%; padding: 10px; margin: 10px 0; display: block; box-sizing: border-box; }
        label { font-weight: bold; color: #333; }
        .hint { font-size: 0.8em; color: #666; margin-top: -5px; margin-bottom: 10px; }
        h2 { text-align: center; color: #d32f2f; }
        .divider { text-align: center; margin: 10px 0; font-weight: bold; color: #999; }
    </style>
</head>
<body>
    <h2>Генератор субтитров</h2>
    
    <form method="POST">
        <div class="section">
            <label>Вариант 1: Одиночное видео</label>
            <input type="text" name="url" placeholder="https://www.youtube.com/watch?v=...">
            <div class="hint">Используется processor5.py</div>
            
            <div class="divider">ИЛИ</div>
            
            <label>Вариант 2: Плейлист</label>
            <input type="text" name="playlist_url" placeholder="https://www.youtube.com/playlist?list=...">
            <div class="hint">Используется processor_playlist.py</div>
        </div>

        <label>Выберите язык субтитров:</label>
        <select name="lang_choice">
            <option value="ru">Русский (RU)</option>
            <option value="en">Английский (EN)</option>
        </select>
        
        <button type="submit" style="background: #d32f2f; color: white; border: none; cursor: pointer; font-weight: bold;">
            Начать обработку и скачать
        </button>
    </form>
</body>
</html>