<?php
// db_config.php

define('DB_HOST', 'db');
define('DB_USER', 'subtitle');
define('DB_PASS', 'Subtitle@2026');
define('DB_NAME', 'subtitle');

/**
 * Вспомогательная функция для создания подключения, 
 * чтобы не дублировать код во всех файлах.
 */
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die(json_encode(['success' => false, 'error' => 'Connection failed: ' . $conn->connect_error]));
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}