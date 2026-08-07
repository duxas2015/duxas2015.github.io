<?php
// list.php
require_once 'db_config.php';
$db = getDbConnection();
if ($db->connect_error) {
    die("Ошибка подключения: " . $db->connect_error);
}

// Получаем все записи для построения дерева
$query = "SELECT movie, movie_code, series, episode FROM subtitle ORDER BY movie, series, episode";
$result = $db->query($query);

$tree = [];
while ($row = $result->fetch_assoc()) {
    $m_code = $row['movie_code'];
    $m_title = $row['movie'];
    $s = $row['series'];
    $e = $row['episode'];
    
    // Ключ для группировки: используем movie_code, а если его нет — название фильма
    $group_key = !empty($m_code) ? $m_code : 'no_code_' . md5($m_title);
    
    if (!isset($tree[$group_key])) {
        $tree[$group_key] = [
            'title' => $m_title,
            'code' => $m_code,
            'seasons' => []
        ];
    }
    
    if (!isset($tree[$group_key]['seasons'][$s])) {
        $tree[$group_key]['seasons'][$s] = [];
    }
    
    $tree[$group_key]['seasons'][$s][] = $e;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Список субтитров</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 40px; background: #f0f2f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        ul { list-style-type: none; padding-left: 20px; }
        .movie-title { font-size: 1.2em; font-weight: bold; color: #333; margin-top: 15px; }
        .season-item { font-weight: bold; margin-top: 5px; color: #555; }
        .episode-item { margin-bottom: 3px; }
        .no-link { color: #888; font-style: italic; }
        a { text-decoration: none; color: #007bff; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Доступные субтитры</h2>
        <ul>
            <?php foreach ($tree as $group_key => $movieData): ?>
                <li>
                    <div class="movie-title"><?= htmlspecialchars($movieData['title']) ?></div>
                    <ul>
                        <?php foreach ($movieData['seasons'] as $s_num => $episodes): ?>
                            <li>
                                <div class="season-item">Сезон <?= $s_num ?></div>
                                <ul>
                                    <?php foreach ($episodes as $e_num): ?>
                                        <li class="episode-item">
                                            <?php if (!empty($movieData['code'])): ?>
                                                <a href="view.php?movie_code=<?= urlencode($movieData['code']) ?>&series=<?= $s_num ?>&episode=<?= $e_num ?>">
                                                    Эпизод <?= $e_num ?>
                                                </a>
                                            <?php else: ?>
                                                <span class="no-link">Эпизод <?= $e_num ?> (ссылка недоступна)</span>
                                            <?php endif; ?>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </li>
            <?php endforeach; ?>
        </ul>
        <hr>
        <a href="new.php" style="font-weight: bold;">+ Добавить новые субтитры</a>
    </div>
</body>
</html>