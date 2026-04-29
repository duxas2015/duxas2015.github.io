<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>

<!doctype html>
<html lang="en">
<head>
    <script src="https://cdn.jsdelivr.net/npm/venom-player@0.2.90"></script>
    <script src="managemovie.js"></script>
    <script src="catalog.js"></script>
</head>	
<body>

<div id="outerContainer">
	<div id="player"></div>
	<div id="controlPanel">
		<button class="clsButton" id="idSetRusSub" type="button">S</button>
		<button class="clsButton" id="idAutoForward" type="button">A</button>
		<button class="clsButton" id="idRewindUntilNextSub" type="button">R</button>
		<button class="clsButton" id="idRewind3Second" type="button">3</button>
		<button class="clsButton" id="idRewind2Second" type="button">2</button>
		<button class="clsButton" id="idPauseVideo" type="button">P</button>		

	</div>
</div>

<div id="engSubtitleOuterContainerId" class="subtitleOuterContainerCls">
	<div id="engSubtitleContainerId" class="subtitleContainerCls"></div>
</div>
<div id="subtitleOuterContainerId" class="subtitleOuterContainerCls">
	<div id="subtitleContainerId" class="subtitleContainerCls"></div>
</div>

<script>
    var player;

    // 1. Получаем параметры из URL (например, ?movie=foundation)
    const urlParams = new URLSearchParams(window.location.search);
    const movieKey = urlParams.get('movie') || 'foundation'; // 'foundation' как значение по умолчанию

    // 2. Извлекаем данные из каталога по ключу
    const movieSettings = movieCatalog[movieKey];

    // Проверка на случай, если ключа нет в каталоге
    if (movieSettings) {
        var url = movieSettings.url;
        var en_subtitle_directory = movieSettings.en_subtitle_directory;
        var ru_subtitle_directory = movieSettings.ru_subtitle_directory;
    } else {
        console.error("Movie not found in catalog: " + movieKey);
    }
</script>
</body>
</html>