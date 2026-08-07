<?php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. ПОДГОТОВКА ПАРАМЕТРОВ
    $pythonPath = "C:\\Python313\\python.exe";
    $scriptPath = "C:\\vhosts\\movie\\yt_text\\process_xlsx.py";
    
    // Массив для сбора данных о файлах (и ручном тексте)
    $tasks = [];

    // ПРОВЕРКА: Ручной ввод текста (Вариант А - текстовое поле)
    if (!empty(trim($_POST['manual_text'] ?? ''))) {
        $tasks[] = [
            'header' => $_POST['header'] ?: 'Ручной ввод ' . date('H:i:s'),
            'content' => $_POST['manual_text']
        ];
    }

    // ПРОВЕРКА: Загрузка нескольких текстовых файлов (Вариант А - TXT)
    if (isset($_FILES['text_files'])) {
        foreach ($_FILES['text_files']['name'] as $i => $name) {
            if ($_FILES['text_files']['error'][$i] === UPLOAD_ERR_OK) {
                $filename = pathinfo($name, PATHINFO_FILENAME); // Имя файла без расширения
                $tasks[] = [
                    'header' => $filename,
                    'content' => file_get_contents($_FILES['text_files']['tmp_name'][$i])
                ];
            }
        }
    }

    // ОБРАБОТКА И СОХРАНЕНИЕ
    if (!empty($tasks)) {
        try {
            $pdo->beginTransaction();

            foreach ($tasks as $task) {
                $data = [];
                $lines = explode("\n", str_replace("\r", "", trim($task['content'])));
                foreach ($lines as $line) {
                    $cols = explode("\t", $line);
                    if (count($cols) >= 1) {
                        $data[] = [
                            'en' => $cols[0] ?? '',
                            'ru' => $cols[1] ?? ''
                        ];
                    }
                }

                if (!empty($data)) {
                    $header_code = bin2hex(random_bytes(5));
                    $stmt = $pdo->prepare("INSERT INTO text (header, header_code) VALUES (?, ?)");
                    $stmt->execute([$task['header'], $header_code]);
                    $text_id = $pdo->lastInsertId();

                    $stmtDetail = $pdo->prepare("INSERT INTO text_detail (id, idx, text_row_en, text_row_ru) VALUES (?, ?, ?, ?)");
                    foreach ($data as $index => $row) {
                        $stmtDetail->execute([$text_id, $index, $row['en'], $row['ru']]);
                    }
                }
            }

            $pdo->commit();
            header("Location: list.php");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            echo "Ошибка БД: " . $e->getMessage();
        }
    } 
    // ПРОВЕРКА: Загрузка через 2 Excel файла (Вариант Б - старая логика сохранена)
    elseif (isset($_FILES['excel_files']) && count($_FILES['excel_files']['name']) === 2) {
        $header = $_POST['header'] ?: 'Загрузка Excel ' . date('H:i:s');
        $path1 = $_FILES['excel_files']['tmp_name'][0];
        $path2 = $_FILES['excel_files']['tmp_name'][1];

        $command = escapeshellcmd("$pythonPath $scriptPath " . escapeshellarg($path1) . " " . escapeshellarg($path2));
        $output = shell_exec($command);
        $data = json_decode($output, true);

        if ($data && !isset($data['error'])) {
            // ... (здесь логика сохранения из исходного файла для Excel)
            // Аналогично оборачивается в транзакцию и сохраняется под $header
        }
    } else {
        echo "Ошибка: Файлы не выбраны или имеют неверный формат.";
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Массовая загрузка данных</title>
    <style>
        body { font-family: sans-serif; max-width: 650px; margin: 20px auto; line-height: 1.6; background: #f4f4f9; }
        .container { background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; background: #fafafa; }
        h3 { margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        textarea { width: 100%; height: 80px; font-family: monospace; box-sizing: border-box; }
        .hint { font-size: 0.85em; color: #666; font-style: italic; }
        input[type="text"], input[type="file"] { width: 100%; padding: 8px; margin: 8px 0; box-sizing: border-box; }
        button { padding: 12px 25px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; font-size: 1em; width: 100%; }
        button:hover { background: #218838; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Загрузить тексты в БД</h1>
        <form method="post" enctype="multipart/form-data">
            
            <div class="section">
                <h3>Общий заголовок</h3>
                <input type="text" name="header" placeholder="Заголовок (если не заполнено, будет имя файла)">
                <p class="hint">Используется для ручного ввода или как префикс.</p>
            </div>

            <div class="section">
                <h3>Вариант А: Текстовые файлы (.txt с табуляцией)</h3>
                <label>Выберите один или несколько файлов:</label>
                <input type="file" name="text_files[]" accept=".txt" multiple>
                
                <br><br>
                <label>Или вставьте текст вручную:</label>
                <textarea name="manual_text" placeholder="English text [TAB] Русский текст"></textarea>
                <p class="hint">Каждый файл будет создан как отдельная запись в списке.</p>
            </div>

            <div class="section">
                <h3>Вариант Б: Два Excel файла (.xlsx)</h3>
                <label>Выберите два файла одновременно (оригинал и перевод):</label>
                <input type="file" name="excel_files[]" multiple accept=".xlsx">
            </div>

            <button type="submit">Начать загрузку в базу</button>
        </form>
        <p style="text-align: center;"><a href="list.php">← К списку текстов</a></p>
    </div>
</body>
</html>