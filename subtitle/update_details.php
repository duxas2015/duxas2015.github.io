<?php
header('Content-Type: application/json');
$db = new mysqli("localhost", "subtitle", "Subtitle@2026", "subtitle");
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

$id = (int)$data['id'];

// Начинаем транзакцию
$db->begin_transaction();

try {
    // 1. Удаляем старые детали
    $db->query("DELETE FROM subtitle_detail WHERE id = $id");

    // 2. Вставляем новые
    $stmt = $db->prepare("INSERT INTO subtitle_detail (id, idx, en_tag, en_time, en_text, ru_text, ru_tag, ru_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($data['rows'] as $i => $row) {
        // Пропускаем полностью пустые строки
        if (empty($row['en_text']) && empty($row['ru_text']) && empty($row['en_time']) && empty($row['ru_time'])) continue;

        $stmt->bind_param("iissssss", 
            $id, $i, 
            $row['en_tag'], $row['en_time'], $row['en_text'], 
            $row['ru_text'], $row['ru_tag'], $row['ru_time']
        );
        $stmt->execute();
    }

    $db->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $db->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}