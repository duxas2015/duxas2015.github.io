<?php
$db = new mysqli("localhost", "subtitle", "Subtitle@2026", "subtitle");
$m_code = $_GET['movie_code'] ?? '';
$series = isset($_GET['series']) ? (int)$_GET['series'] : 0;
$episode = isset($_GET['episode']) ? (int)$_GET['episode'] : 0;

$query = "SELECT d.* FROM subtitle_detail d JOIN subtitle s ON d.id = s.id 
          WHERE s.movie_code = ? AND s.series = ? AND s.episode = ? ORDER BY d.idx";
$stmt = $db->prepare($query);
$stmt->bind_param("sii", $m_code, $series, $episode);
$stmt->execute();
$result = $stmt->get_result();
$rows = $result->fetch_all(MYSQLI_ASSOC);
$subId = $rows[0]['id'] ?? 0;
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>View Subtitles</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="header-actions">
        <h2>Subtitles: <?= htmlspecialchars($m_code) ?> (S<?= $series ?>E<?= $episode ?>)</h2>
        <div class="controls">
            <label><input type="checkbox" id="modeSwitch"> Edit Mode</label>
            <button class="btn-save" id="saveBtn">Сохранить изменения</button>
        </div>
    </div>

    <table id="subsTable">
        <thead>
            <tr>
                <th class="edit-col col-idx"># EN</th>
                <th class="edit-col col-time">Time EN</th>
                <th>Text EN</th>
                <th>Text RU</th>
                <th class="edit-col col-idx"># RU</th>
                <th class="edit-col col-time">Time RU</th>
            </tr>
        </thead>
        <tbody id="subBody">
            </tbody>
    </table>

    <script>
        // Передаем данные из PHP в JS
        const subId = <?= $subId ?>;
        let subData = <?= json_encode($rows) ?>;
    </script>
    <script src="scripts.js"></script>
</body>
</html>