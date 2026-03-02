<?php
// load.php (new file)

$host = 'sql113.infinityfree.com'; // Change to your DB host
$dbname = 'if0_39565491_eg'; // Change to your DB name
$user = 'if0_39565491'; // Change to your DB user
$pass = 'Xafz8ivXK5MtQwj'; // Change to your DB password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

if (!isset($_GET['file_key'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing file_key parameter']);
    exit;
}

$file_key = $_GET['file_key'];

try {
    $stmt = $pdo->prepare("SELECT json_text FROM json_data WHERE file_key = :file_key");
    $stmt->execute([':file_key' => $file_key]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        header('Content-Type: application/json');
        echo $result['json_text'];
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>