<?php
// new.php
require_once 'db_config.php';
$db = getDbConnection();
// Получаем список "корневых" элементов (где нет кода фильма)
$parents = $db->query("SELECT id, movie FROM subtitle WHERE movie_code = '' OR movie_code IS NULL ORDER BY movie");
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Загрузка субтитров</title>
    <style>
        body { font-family: sans-serif; padding: 20px; line-height: 1.6; background: #f0f2f5; }
        .form-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 500px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-weight: bold; margin-bottom: 5px; }
        input, select { padding: 8px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 10px 20px; cursor: pointer; background: #28a745; color: white; border: none; border-radius: 4px; font-weight: bold; }
        button:hover { background: #218838; }
        .hint { font-size: 0.85em; color: #666; margin-top: 2px; }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>Добавить новые субтитры</h2>
        <form id="subForm">
            <div class="form-group">
                <label>Родительский элемент (из списка существующих):</label>
                <select name="parent_id">
                    <option value="">-- Создать новый или оставить без родителя --</option>
                    <?php while($p = $parents->fetch_assoc()): ?>
                        <option value="<?= $p['id'] ?>"><?= htmlspecialchars($p['movie']) ?></option>
                    <?php endwhile; ?>
                </select>
            </div>
            <div class="form-group">
                <label>Movie Title (если новый):</label>
                <input type="text" name="movie" required>
            </div>
            <div class="form-group">
                <label>Movie Code (latin, numbers, _):</label>
                <input type="text" name="movie_code" pattern="[a-z0-9_]+" required>
            </div>
            <div class="form-group">
                <label>Series (Season):</label>
                <select name="series" id="series"></select>
            </div>
            <div class="form-group">
                <label>Episode:</label>
                <select name="episode" id="episode"></select>
            </div>
            <div class="form-group">
                <label>EN Subtitles (.srt, .vtt):</label>
                <input type="file" id="enFile" accept=".srt,.vtt" required>
            </div>
            <div class="form-group">
                <label>RU Subtitles (.srt, .vtt):</label>
                <input type="file" id="ruFile" accept=".srt,.vtt" required>
            </div>
            <button type="button" onclick="handleUpload()">Сохранить и Показать</button>
        </form>
    </div>

    <script>
        const fillSelect = (id) => {
            const s = document.getElementById(id);
            for(let i=0; i<=30; i++) s.options[s.options.length] = new Option(i, i);
        };
        fillSelect('series'); fillSelect('episode');

        // Автозаполнение названия фильма при выборе родителя
        document.querySelector('select[name="parent_id"]').addEventListener('change', function() {
            const selectedText = this.options[this.selectedIndex].text;
            if (this.value !== "") {
                document.querySelector('input[name="movie"]').value = selectedText;
            }
        });

        async function handleUpload() {
            const form = document.getElementById('subForm');
            const enFile = document.getElementById('enFile').files[0];
            const ruFile = document.getElementById('ruFile').files[0];

            if (!form.checkValidity() || !enFile || !ruFile) return alert("Заполните все поля");

            let enText = await enFile.text();
            let ruText = await ruFile.text();

			enText = enText.replace(/^\uFEFF/, "");
			ruText = ruText.replace(/^\uFEFF/, "");
            
            const enSubs = parseSubtitles(enText);
            const ruSubs = parseSubtitles(ruText);
            const aligned = alignData(enSubs, ruSubs);
			
            const payload = {
                parent_id: form.parent_id.value, // Передаем ID родителя
                movie: form.movie.value,
                movie_code: form.movie_code.value,
                series: form.series.value,
                episode: form.episode.value,
                subtitle_en: enText,
                subtitle_ru: ruText,
                details: aligned
            };

            const resp = await fetch('save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await resp.json();
            if (res.success) {
                window.location.href = `view.php?movie_code=${payload.movie_code}&series=${payload.series}&episode=${payload.episode}`;
            } else {
                alert("Ошибка сохранения: " + res.error);
            }
        }

        function parseSubtitles(data) {
            const blocks = data.trim().split(/\r?\n\r?\n/);
            return blocks.map(block => {
                const lines = block.split(/\r?\n/);
                let index = "", timeRange = "", text = "";
                if (lines[0] && lines[0].includes('-->')) { timeRange = lines[0]; text = lines.slice(1).join(' '); }
                else if (lines.length >= 2 && lines[1].includes('-->')) { index = lines[0]; timeRange = lines[1]; text = lines.slice(2).join(' '); }
                return timeRange ? { index, time: timeRange, startTime: timeToSeconds(timeRange.split(' --> ')[0]), text } : null;
            }).filter(Boolean);
        }

        function timeToSeconds(t) {
            const p = t.trim().replace(',', '.').split(':');
            return p.length === 3 ? p[0]*3600 + p[1]*60 + parseFloat(p[2]) : p[0]*60 + parseFloat(p[1]);
        }

        function alignData(enRaw, ruRaw) {
            let res = [], eI = 0, rI = 0;
            while (eI < enRaw.length || rI < ruRaw.length) {
                const e = enRaw[eI], r = ruRaw[rI];
                if (e && r && Math.abs(e.startTime - r.startTime) <= 1.5) {
                    res.push({en_tag: e.index, en_time: e.time, en_text: e.text, ru_tag: r.index, ru_time: r.time, ru_text: r.text});
                    eI++; rI++;
                } else if (e && (!r || e.startTime < r.startTime)) {
                    res.push({en_tag: e.index, en_time: e.time, en_text: e.text, ru_tag: '', ru_time: '', ru_text: ''});
                    eI++;
                } else {
                    res.push({en_tag: '', en_time: '', en_text: '', ru_tag: r.index, ru_time: r.time, ru_text: r.text});
                    rI++;
                }
            }
            return res;
        }
    </script>
</body>
</html>