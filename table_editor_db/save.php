<?php
// save.php (new file)

$host = 'sql113.infinityfree.com'; // Change to your DB host
$dbname = 'if0_39565491_eg'; // Change to your DB name
$user = 'if0_39565491'; // Change to your DB user
$pass = 'Xafz8ivXK5MtQwj'; // Change to your DB password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['file_key']) || !isset($data['json'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$file_key = $data['file_key'];
$json_text = $data['json'];

try {
    $stmt = $pdo->prepare("INSERT INTO json_data (file_key, json_text) VALUES (:file_key, :json_text) 
                           ON DUPLICATE KEY UPDATE json_text = :json_text_update");
    $stmt->execute([
        ':file_key' => $file_key,
        ':json_text' => $json_text,
        ':json_text_update' => $json_text
    ]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>