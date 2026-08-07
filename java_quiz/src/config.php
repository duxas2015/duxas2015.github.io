<?php
// config.php

return [
    'host'    => 'db',       // Имя сервиса БД из docker-compose.yml
    'port'    => '3306',     // Внутренний порт MySQL в сети Docker
    'db'      => 'javaquiz', // MYSQL_DATABASE
    'user'    => 'javaquiz', // MYSQL_USER
    'pass'    => 'javaquiz', // MYSQL_PASSWORD
    'charset' => 'utf8mb4',
];
?>