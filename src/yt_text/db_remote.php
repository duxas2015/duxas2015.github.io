<?php
$host = 'sql113.infinityfree.com';
$db   = 'if0_39565491_yt_text';
$user = 'if0_39565491';
$pass = 'Xafz8ivXK5MtQwj';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     die("Ошибка подключения: " . $e->getMessage());
}