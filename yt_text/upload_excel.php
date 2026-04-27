<?php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['excel_files'])) {
    $header = $_POST['header'];
    $header_code = bin2hex(random_bytes(5));
    $files = $_FILES['excel_files'];

    // Проверяем, что загружено ровно 2 файла
    if (count($files['name']) === 2) {
        $path1 = $files['tmp_name'][0];
        $path2 = $files['tmp_name'][1];

        // Вызов Python скрипта
        $pythonPath = "C:\\Python313\\python.exe"; // Укажите ваш путь
        $scriptPath = "C:\\vhosts\\movie\\yt_text\\process_xlsx.py";
        
        $command = escapeshellcmd("$pythonPath $scriptPath " . escapeshellarg($path1) . " " . escapeshellarg($path2));
        $output = shell_exec($command);
		$data = json_decode($output, true);		

        if ($data && !isset($data['error'])) {
            try {
                $pdo->beginTransaction();

                // Вставка в таблицу text
                $stmt = $pdo->prepare("INSERT INTO text (header, header_code) VALUES (?, ?)");
                $stmt->execute([$header, $header_code]);
                $text_id = $pdo->lastInsertId();

                // Вставка в таблицу text_detail
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
            echo "Ошибка Python: " . ($data['error'] ?? 'Неизвестная ошибка');
        }
    } else {
        echo "Пожалуйста, выберите ровно 2 файла.";
    }
}
?>

<!DOCTYPE html>
<html>
<head><title>Загрузка Excel</title></head>
<body>
    <h1>Загрузить файлы Excel в БД</h1>
    <form method="post" enctype="multipart/form-data">
        <input type="text" name="header" placeholder="Заголовок текста" required style="width: 100%; margin-bottom: 10px;"><br>
        <label>Выберите два файла .xlsx одновременно:</label><br>
        <input type="file" name="excel_files[]" multiple accept=".xlsx" required style="margin-bottom: 10px;"><br>
        <button type="submit">Загрузить в базу</button>
    </form>
    <p><a href="list.php">К списку текстов</a></p>
</body>
</html>