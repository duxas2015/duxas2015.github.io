<?php
header('Content-Type: application/json');
require_once 'db_config.php';
$db = getDbConnection();
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) die(json_encode(['success' => false, 'error' => 'No data']));

// Предполагаем, что в таблице subtitle есть поле parent_id
$stmt = $db->prepare("INSERT INTO subtitle (movie, movie_code, series, episode, subtitle_en, subtitle_ru, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
$parentId = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;

$stmt->bind_param("ssiissi", 
    $data['movie'], 
    $data['movie_code'], 
    $data['series'], 
    $data['episode'], 
    $data['subtitle_en'], 
    $data['subtitle_ru'],
    $parentId
);
$stmt->execute();
$newId = $db->insert_id;

$stmtDet = $db->prepare("INSERT INTO subtitle_detail (id, idx, en_tag, en_time, en_text, ru_text, ru_tag, ru_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($data['details'] as $i => $row) {
    $stmtDet->bind_param("iissssss", $newId, $i, $row['en_tag'], $row['en_time'], $row['en_text'], $row['ru_text'], $row['ru_tag'], $row['ru_time']);
    $stmtDet->execute();
}

echo json_encode(['success' => true]);
?>