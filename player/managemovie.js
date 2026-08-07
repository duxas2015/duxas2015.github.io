var video;
var player;
var track;
var shiftEnglishSubtitle = 0;
var shiftRussianSubtitle = 0;
var subtitleIntervals = []; // Структура: { start: float, end: float, isGap: boolean }
var autoForwardTimer = null;

function assignGlobalVariables(){
	player = window.frames[0].window.app;
	video = window.frames[0].document.getElementsByTagName('video')[0];
}

function buildSubtitleMap(textTrack) {
	console.log("Build Subtitle Map event");
    subtitleIntervals = [];
	if (!textTrack || !textTrack.cues || textTrack.cues.length === 0) return;

    const cues = Array.from(textTrack.cues).sort((a, b) => a.startTime - b.startTime);
    let lastEndTime = 0;

    cues.forEach(cue => {
        // Если есть промежуток между предыдущим субтитром и текущим
        if (cue.startTime > lastEndTime) {
            subtitleIntervals.push({ start: lastEndTime, end: cue.startTime, isGap: true });
        }
        // Добавляем сам интервал субтитра
        subtitleIntervals.push({ start: cue.startTime, end: cue.endTime, isGap: false });
        lastEndTime = cue.endTime;
    });
    
    // Добавляем финальный интервал до конца видео (условно)
    subtitleIntervals.push({ start: lastEndTime, end: 100000, isGap: true });
}

function getNextSubtitleInterval(currentTime) {
    // Ищем интервал, в который попадает текущее время
    const interval = subtitleIntervals.find(i => currentTime >= i.start && currentTime < i.end);

    if (interval && interval.isGap) {
        const diffFromStart = currentTime - interval.start;
        const diffFromEnd = interval.end - currentTime;

        // Если мы в пустом интервале и от границ больше 0.5 сек
        if (diffFromStart > 1 && diffFromEnd > 1) {
            return interval.end - 1;
        }
    }
    return null;
}


function turnOnOffAutoForward( isMobile ) {
	if (autoForwardTimer) {
		// Выключаем
		clearInterval(autoForwardTimer);
		autoForwardTimer = null;
		if ( isMobile ) btnAutoForward.classList.remove('active'); // Опционально для стилизации
		console.log("Auto-forward OFF");
	} else {
		// Включаем
		const engTrack = findEnglishSubtitleTrack();
		
		// Строим карту, если она еще не построена
		if (subtitleIntervals.length === 0) buildSubtitleMap(engTrack);

		autoForwardTimer = setInterval(() => {
			console.log('setInterval');
			const jumpTo = getNextSubtitleInterval(video.currentTime);
			if (jumpTo !== null) {
				video.currentTime = jumpTo;
			}
		}, 500);
		
		if ( isMobile ) btnAutoForward.classList.add('active');
		console.log("Auto-forward ON");
	}	
}	

function findClosestSubtitle ( video, track ) {
    var foundTime;
    var currentTime = video.currentTime;
	const pattern = /^\[[^\]]*\]$/; // exclude text in []
	const pattern_2 = /^\([^\)]*\)$/; // exclude text in ()
	const pattern_3 = /^[♪\s]+$/; // exclude text ♪
	const pattern_4 = /^\[[^\]]*\]\n\[[^\]]*\]$/; // exclude text in []
    Array.from(track.cues).forEach( function ( item, index ) {
     if ( foundTime === undefined && item.startTime > currentTime && !pattern.test(item.text) && !pattern_2.test(item.text) && !pattern_3.test(item.text) && !pattern_4.test(item.text) ) {
            console.log ( currentTime );
			console.log ( item.text );
            console.log( item.startTime );
            foundTime = item.startTime;
        } 
    });
	return foundTime;
}

function getToTheClosestSubtitle() { 
    video.currentTime = findClosestSubtitle (video, track) - 0.5; 
  }

function handle(e) {

	if ( e.code === 'Numpad1' ) { backMoving (2); }
    else if ( e.code === 'Numpad2' ) { backMoving (3); }
	else if ( e.code === 'Numpad3' ) { backMoving (4); }
	else if ( e.code === 'Numpad4' ) { getToTheClosestSubtitle(); }
	else if ( e.code === 'Numpad0' && !e.altKey ) {
        if (video.paused) { video.play(); } else { video.pause(); }
    }
	else if ( e.code === 'Numpad0' && e.altKey ) {
		turnOnOffAutoForward( false );
    }
	else if ( e.code === 'Numpad9' ) { 
	  //track.mode = "showing";
	  console.log('Numpad9 pressed. Assigned events on Ru and En texttracks.');
      video.textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
      video.textTracks[findEnglishSubtitleTrackIndex()].oncuechange = f_eng;
	}
	else if ( e.code === 'Numpad5' && !e.altKey ) { 
  	  shiftTextTrack(findEnglishSubtitleTrack(), -0.2 );
	  shiftEnglishSubtitle-= 0.2;
	  console.log(shiftEnglishSubtitle.toFixed(2));
	}
	else if ( e.code === 'Numpad6' && !e.altKey ) { 
  	  shiftTextTrack(findEnglishSubtitleTrack(), 0.2 );
	  shiftEnglishSubtitle+= 0.2;	  
	  console.log(shiftEnglishSubtitle.toFixed(2));
	}
	else if ( e.code === 'Numpad7' && !e.altKey ) { 
	  downloadSubtitlesAsVTT( video, video.textTracks[findEnglishSubtitleTrackIndex()] );
	}
	else if ( e.code === 'Numpad7' && e.altKey ) { 
	  downloadSubtitlesAsVTT( video, video.textTracks[findRussianSubtitleTrackIndex()] );
	}
	else if ( e.code === 'Numpad5' && e.altKey ) { 
  	  shiftTextTrack(findRussianSubtitleTrack(), -0.2 );
	  shiftRussianSubtitle-= 0.2;
	  console.log(shiftRussianSubtitle.toFixed(2));
	  e.stopImmediatePropagation();
	}
	else if ( e.code === 'Numpad6' && e.altKey ) { 
  	  shiftTextTrack(findRussianSubtitleTrack(), 0.2 );
	  shiftRussianSubtitle+= 0.2;	  
	  console.log(shiftRussianSubtitle.toFixed(2));
	  e.stopImmediatePropagation();
	}
	else if ( e.code === 'Numpad8' && !e.altKey ) { 
	  syncSubtitles( video, findEnglishSubtitleTrackIndex(), findRussianSubtitleTrackIndex(), true );
	}
	else if ( e.code === 'Numpad8' && e.altKey ) { 
	  syncSubtitles( video, findEnglishSubtitleTrackIndex(), findRussianSubtitleTrackIndex(), false );
	}
}

function backMoving( shift ){
	video.currentTime = video.currentTime - shift;
}

function shiftTextTrack ( textTrack, shift ) {
	var activeSubtitleTrack = findActiveSubtitleTrack;
	if ( activeSubtitleTrack === textTrack ) { textTrack.mode = 'hidden'; }
	Array.from(textTrack.cues).forEach( function ( item, index ) {
		textTrack.cues[index].startTime = textTrack.cues[index].startTime + shift;
		textTrack.cues[index].endTime = textTrack.cues[index].endTime + shift;
		});
	if ( activeSubtitleTrack === textTrack ) { textTrack.mode = 'showing'; }
}

function shiftTextTrackSmoothly ( textTrack, shiftPerSecond ) {
	var activeSubtitleTrack = findActiveSubtitleTrack;
	if ( activeSubtitleTrack === textTrack ) { textTrack.mode = 'hidden'; }
	Array.from(textTrack.cues).forEach( function ( item, index ) {
		textTrack.cues[index].startTime = textTrack.cues[index].startTime + textTrack.cues[index].startTime * shiftPerSecond;
		textTrack.cues[index].endTime = textTrack.cues[index].endTime + textTrack.cues[index].endTime * shiftPerSecond;
		});
	if ( activeSubtitleTrack === textTrack ) { textTrack.mode = 'showing'; }
}

function findEnglishSubtitleTrackIndex(){
	var choosenTrackIndex;
	Array.from(video.textTracks).forEach( function ( item, index ) {
		if ( item.label.search('Eng') === 0 && choosenTrackIndex === undefined ) {
			choosenTrackIndex = index;
		}
	} )
	return choosenTrackIndex;
}

function findEnglishSubtitleTrack(){
	return video.textTracks[findEnglishSubtitleTrackIndex()];
}

function findRussianSubtitleTrackIndex(){
	var choosenTrackIndex;
	Array.from(video.textTracks).forEach( function ( item, index ) {
		if ( ( item.label.search('Rus') === 0 || item.label.search('Рус') === 0 ) && item.label.search('форс') === -1 && choosenTrackIndex === undefined ) {
			choosenTrackIndex = index;
		}
	} )
	return choosenTrackIndex;
}

function findRussianSubtitleTrack(){
	return video.textTracks[findRussianSubtitleTrackIndex()];
}

function findActiveSubtitleTrackIndex(){
	var choosenTrack;
	Array.from(video.textTracks).forEach( function ( item, index ) {
		if ( item.mode === "showing" ) {
			choosenTrack = video.textTracks[index];
		}
	} )
	return choosenTrack;
}

function findActiveSubtitleTrack(){
	return video.textTracks[findActiveSubtitleTrackIndex()];
}

var f = function ( event ) { 
 //console.log('f event. refresh ru subtitles'); 
 if ( event.currentTarget.activeCues[0] !== undefined ) { document.getElementById("subtitleContainerId").innerText = event.currentTarget.activeCues[0].text; } 
 else { document.getElementById("subtitleContainerId").innerHtml = "";}
 }

var f_eng = function ( event ) {
 //console.log('f_eng event. refresh ru subtitles');
 if ( event.currentTarget.activeCues[0] !== undefined ) { document.getElementById("engSubtitleContainerId").innerText = event.currentTarget.activeCues[0].text; } 
 else { document.getElementById("engSubtitleContainerId").innerHtml = "";}
 }


function listen(player) {
	player.once('ready', () => {
	  console.log('player.once event');
	  
	  assignGlobalVariables();
	  
	  document.getElementById("engSubtitleContainerId").innerText =	'';  
	  document.getElementById("subtitleContainerId").innerText = '';
	  
      track = video.textTracks[findEnglishSubtitleTrackIndex()];
	  shiftEnglishSubtitle = 0;
	  shiftRussianSubtitle = 0;
	  if ( isMobileVersion() === true ) { // mobile mode
		track.mode = "hidden";
	  } else { // desktop mode
		//track.mode = "showing";
	  }
	  if ( findEnglishSubtitleTrackIndex() >= 0 ) {
		video.textTracks[findEnglishSubtitleTrackIndex()].oncuechange = f_eng;
	  }
	  if ( findRussianSubtitleTrackIndex() >= 0 ) {
		video.textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
	  }

      clearInterval(autoForwardTimer);
	  autoForwardTimer = null;
	  subtitleIntervals = [];
	  if ( isMobileVersion() ) btnAutoForward.classList.remove('active'); // Опционально для стилизации
	  
	  // Rebuild Eng Subtitle Map if autoForwardMode enabled	
  	  //if ( autoForwardTimer !== null ) buildSubtitleMap( video.textTracks[findEnglishSubtitleTrackIndex()] );
	  
	});
}

function extract_seasons_arr(text) {
	// Проверяем, что входной параметр — строка
	if (typeof text !== 'string' || !text.trim()) {
		console.error('Входной параметр должен быть непустой строкой');
		return '';
	}

	// Регулярное выражение для поиска тегов <script>
	const scriptTagRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

	// Находим все теги <script>
	const scriptTags = text.match(scriptTagRegex) || [];

	for (const scriptTag of scriptTags) {
		const scriptContent = scriptTag.replace(/<script\b[^>]*>/i, '').replace(/<\/script>/i, '');
		
		// Проверяем наличие подстроки (seasons: [{
		const seasonsStartIndex = scriptContent.indexOf('seasons:[{');
		if (seasonsStartIndex === -1) {
			continue; // Переходим к следующему тегу, если подстрока не найдена
		}

		// Находим начало seasons
		const seasonsIndex = scriptContent.indexOf('seasons', seasonsStartIndex);
		if (seasonsIndex === -1) {
			continue;
		}

		// Ищем соответствующую закрывающую ]
		let bracketCount = 0;
		let endIndex = seasonsIndex;
		let i = seasonsIndex;
		
		while (i < scriptContent.length) {
			if (scriptContent[i] === '[') {
				bracketCount++;
			} else if (scriptContent[i] === ']') {
				bracketCount--;
				if (bracketCount === 0) {
					endIndex = i + 1; // Включаем закрывающую ]
					break;
				}
			}
			i++;
		}

		if (bracketCount === 0 && endIndex > seasonsIndex) {
			// Извлекаем текст от seasons до закрывающей ]
			return scriptContent.slice(seasonsIndex, endIndex);
		}
	}

	console.error('Не найдено подходящее содержимое с seasons');
	return '';
}

function handle_all_episodes(seasons_obj) {
	// Проверяем, что seasons_obj и seasons существуют
	if (!seasons_obj || !Array.isArray(seasons_obj.seasons)) {
		console.error('Неверный формат объекта или отсутствует массив seasons');
		return false;
	}

	// Перебираем все сезоны
	seasons_obj.seasons.forEach(seasonObj => {
		// Проверяем, что сезон имеет поле season и массив episodes
		if (typeof seasonObj.season !== 'number' || !Array.isArray(seasonObj.episodes)) {
			console.error(`Неверный формат сезона или отсутствует массив episodes: ${JSON.stringify(seasonObj)}`);
			return;
		}

		// Перебираем все эпизоды в сезоне
		seasonObj.episodes.forEach(episodeObj => {
			// Проверяем, что эпизод имеет поле episode
			if (!episodeObj.episode) {
				console.error(`Неверный формат эпизода: ${JSON.stringify(episodeObj)}`);
				return;
			}

			// Вызываем handle_function с номерами сезона и эпизода
			try {
				add_new_subtitle(seasons_obj, seasonObj.season, parseInt(episodeObj.episode, 10), en_subtitle_directory + seasonObj.season + String( parseInt(episodeObj.episode, 10) ).padStart(2, '0') + '.vtt', 'English')
				add_new_subtitle(seasons_obj, seasonObj.season, parseInt(episodeObj.episode, 10), ru_subtitle_directory + seasonObj.season + String( parseInt(episodeObj.episode, 10) ).padStart(2, '0') + '.vtt', 'Русский')
			} catch (error) {
				console.error(`Ошибка при вызове handle_function для сезона ${seasonObj.season}, эпизода ${episodeObj.episode}: ${error.message}`);
			}
		});
	});

	return seasons_obj;
}		

function add_new_subtitle(seasons_obj, season, episode, url, name) {
	// Проверяем, что seasons_obj и seasons существуют
	if (!seasons_obj || !Array.isArray(seasons_obj.seasons)) {
		console.error('Неверный формат объекта или отсутствует массив seasons');
		return false;
	}

	// Находим сезон с указанным номером
	const seasonObj = seasons_obj.seasons.find(s => s.season === season);
	if (!seasonObj) {
		console.error(`Сезон ${season} не найден`);
		return false;
	}

	// Проверяем, что episodes существует
	if (!Array.isArray(seasonObj.episodes)) {
		console.error('Массив episodes отсутствует или имеет неверный формат');
		return false;
	}

	// Находим эпизод с указанным номером
	const episodeObj = seasonObj.episodes.find(e => e.episode === episode.toString());
	if (!episodeObj) {
		console.error(`Эпизод ${episode} не найден в сезоне ${season}`);
		return false;
	}

	// Проверяем, что массив cc существует, если нет — создаём
	if (!Array.isArray(episodeObj.cc)) {
		episodeObj.cc = [];
	}

	// Добавляем новый объект субтитров в массив cc
	episodeObj.cc.push({
		url: url,
		name: name
	});

	console.log(`Субтитры "${name}" успешно добавлены для сезона ${season}, эпизода ${episode}`);
	return true;
}

function getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    return isMobile ? 'mobile' : 'desktop';
}

function getMobileParam() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mobile');
}

function isMobileVersion(){
	//if ( (typeof versionMobile !== 'undefined') && versionMobile === true ) { return true; } else { return false; }
	if ( getDeviceType() === 'mobile' || getMobileParam() === "1" ) return true; else return false;
}

function removeNodeById(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    } else {
        console.warn(`Элемент с id "${id}" не найден`);
    }
}

function loadCSS(path) {
    return new Promise((resolve, reject) => {
        // Проверяем, что path — строка и не пустая
        if (typeof path !== 'string' || !path.trim()) {
            reject(new Error('Путь к CSS-файлу должен быть непустой строкой'));
            return;
        }

        // Создаём элемент <link>
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = path;

        // Обработчик успешной загрузки
        link.onload = () => {
            resolve();
        };

        // Обработчик ошибки загрузки
        link.onerror = () => {
            reject(new Error(`Ошибка загрузки CSS-файла: ${path}`));
        };

        // Добавляем <link> в <head>
        document.head.appendChild(link);
    });
}

function downloadSubtitlesAsVTT(video, textTrack, filename = 'subtitles.vtt') {
    // Проверяем входные параметры
    if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Параметр video должен быть элементом <video>');
    }
    if (!(textTrack instanceof TextTrack)) {
        throw new Error('Параметр textTrack должен быть объектом TextTrack');
    }

    // Проверяем, есть ли cues в textTrack
    const cues = textTrack.cues;
    if (!cues || cues.length === 0) {
        throw new Error('В textTrack отсутствуют субтитры (cues)');
    }

    // Формируем WebVTT контент
    let vttContent = 'WEBVTT\n\n';

    // Функция для форматирования времени в формате HH:MM:SS.mmm
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        const milliseconds = Math.round((seconds % 1) * 1000);
        const wholeSeconds = Math.floor(seconds);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    // Перебираем все cues
    Array.from(cues).forEach((cue, index) => {
        if (!(cue instanceof VTTCue)) {
            console.warn(`Cue ${index} не является VTTCue, пропускается`);
            return;
        }

        const startTime = formatTime(cue.startTime);
        const endTime = formatTime(cue.endTime);
        const text = cue.text.trim();

        // Добавляем cue в WebVTT формат
        vttContent += `${index + 1}\n${startTime} --> ${endTime}\n${text}\n\n`;
    });

    // Создаём Blob для WebVTT
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);

    // Создаём ссылку для скачивания
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

function syncSubtitles(video, textTrack1, textTrack2, directionFlag) {
    // Проверяем входные параметры
    if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Параметр video должен быть элементом <video>');
    }
    if (!Number.isInteger(textTrack1) || textTrack1 < 0 || textTrack1 >= video.textTracks.length) {
        throw new Error('Неверный индекс textTrack1');
    }
    if (!Number.isInteger(textTrack2) || textTrack2 < 0 || textTrack2 >= video.textTracks.length) {
        throw new Error('Неверный индекс textTrack2');
    }
    if (typeof directionFlag !== 'boolean') {
        throw new Error('Параметр directionFlag должен быть булевым значением');
    }

    // Получаем треки субтитров
    const track1 = video.textTracks[textTrack1];
    const track2 = video.textTracks[textTrack2];

    if (!(track1 instanceof TextTrack)) {
        throw new Error('textTrack1 не является объектом TextTrack');
    }
    if (!(track2 instanceof TextTrack)) {
        throw new Error('textTrack2 не является объектом TextTrack');
    }

    // Проверяем наличие cues
    if (!track1.cues || track1.cues.length === 0) {
        throw new Error('В textTrack1 отсутствуют субтитры (cues)');
    }
    if (!track2.cues || track2.cues.length === 0) {
        throw new Error('В textTrack2 отсутствуют субтитры (cues)');
    }

    // Получаем текущее время видео
    const currentTime = video.currentTime;

    // Находим текущие субтитры в обоих треках
    let currentCue1 = null;
    let currentCue2 = null;

    for (const cue of track1.cues) {
        if (currentTime >= cue.startTime && currentTime < cue.endTime) {
            currentCue1 = cue;
            break;
        }
    }

    for (const cue of track2.cues) {
        if (currentTime >= cue.startTime && currentTime < cue.endTime) {
            currentCue2 = cue;
            break;
        }
    }

    // Проверяем, существуют ли оба текущих субтитра
    if (!currentCue1 || !currentCue2) {
        throw new Error('Один или оба текущих субтитра не найдены на текущем времени видео');
    }

    // Вычисляем разницу во времени между началом текущих субтитров
    const timeDifference = currentCue1.startTime - currentCue2.startTime;

    // Определяем, какой трек нужно сместить
    const targetTrack = directionFlag ? track2 : track1;
    const shift = directionFlag ? timeDifference : -timeDifference;

    // Смещаем все субтитры в целевом треке
    for (const cue of targetTrack.cues) {
        if (!(cue instanceof VTTCue)) {
            console.warn(`Cue не является VTTCue, пропускается`);
            continue;
        }

        const newStartTime = cue.startTime + shift;
        const newEndTime = cue.endTime + shift;

        // Проверяем, что времена не отрицательные
        if (newStartTime < 0 || newEndTime < 0) {
            throw new Error(`Сдвиг приводит к отрицательному времени для cue: ${cue.startTime} --> ${cue.endTime}`);
        }

        // Обновляем времена
        cue.startTime = newStartTime;
        cue.endTime = newEndTime;
    }

    // Возвращаем информацию о сдвиге для отладки
    return {
        shiftedTrack: directionFlag ? textTrack2 : textTrack1,
        shiftApplied: shift,
        alignedTime: directionFlag ? currentCue1.startTime : currentCue2.startTime
    };
}

// Function to get URL parameter by name
function getUrlParameter(name) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
}

window.onload = function() {
/*
	fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
			}
			return response.text();
		})
		.then(data => {
			try {
			var parsedObject = eval('({' + extract_seasons_arr ( data ) + '})');

			if (parsedObject && typeof parsedObject === 'object') {
				return parsedObject;
			} else {
			}
			} catch (error) {
			}
		})
		.then(data => {
			if ( ( typeof en_subtitle_directory !== undefined && en_subtitle_directory !== null && en_subtitle_directory != '' ) || 
				 ( typeof ru_subtitle_directory !== undefined && ru_subtitle_directory !== null && ru_subtitle_directory != '' )
			   )	 
			{
			  return handle_all_episodes (data);
			} else {
			  return data;	
			};
		})
		.then(data => {
			
            const v_episode = getUrlParameter('epsd');
			const v_season = getUrlParameter('ssn');

			player = VenomPlayer.make({
//			publicPath: 'https://cdn.jsdelivr.net/npm/venom-player@' + VenomPlayer.version + '/dist/',
			publicPath: 'https://cdn.jsdelivr.net/npm/venom-player@' + '0.2.90' + '/dist/',
			container: document.getElementById('player'),

					playlist: {
						open: false,
						ignoreLast: true,
						autoNext: true,
						id: 3462,
						current: {
							season: v_season ?? "1", 
							episode: v_episode ?? "1"
						},
						
						seasons: data.seasons

					},
				qualityByWidth: {"1280":1080,"640":480,"864":720},
				p2p: {
					geo: ["ES","","AS57269"],
					tolerance:  4 ,
					tracker: "wss://t4.zcvh.net/v1/ws",
					longDownload: 30 * 1000
				}

			});
			return true;
		})
		.then(data => {
*/			
			  console.log ('window.onload event');
			  assignGlobalVariables();
			  window.onkeydown = handle;
			  player.onRenew = listen;
			  listen(player);
			  
			if ( isMobileVersion() ) {

			  // mobile	
			  loadCSS('styles_mobile.css');
			  
			  document.getElementById("idRewind2Second").addEventListener('click', ( event ) => { backMoving (2); } );
			  document.getElementById("idRewind3Second").addEventListener('click', ( event ) => { backMoving (3); } );
			  document.getElementById("idRewindUntilNextSub").addEventListener('click', ( event ) => { getToTheClosestSubtitle(); } );

    			document.getElementById('idPauseVideo').addEventListener('click', () => {
					if (video.paused) { video.play(); } else { video.pause(); }
				});

/*			  
			  // English Subtitle Shift Handlers
			  document.getElementById("idMoveEngSubBackward").addEventListener('click', ( event ) => { 
				  shiftTextTrack(findEnglishSubtitleTrack(), -0.2 );
				  shiftEnglishSubtitle-= 0.2;
				  console.log(shiftEnglishSubtitle.toFixed(2));
				} );					  
			  document.getElementById("idMoveEngSubForward").addEventListener('click', ( event ) => {
				  shiftTextTrack(findEnglishSubtitleTrack(), 0.2 );
				  shiftEnglishSubtitle+= 0.2;
				  console.log(shiftEnglishSubtitle.toFixed(2));
				} );
				
			  // Russian Subtitle Shift Handlers (NEW)
			  document.getElementById("idMoveRusSubBackward").addEventListener('click', ( event ) => { 
				  shiftTextTrack(findRussianSubtitleTrack(), -0.2 );
				  shiftRussianSubtitle-= 0.2;
				  console.log(shiftRussianSubtitle.toFixed(2));
				} );					  
			  document.getElementById("idMoveRusSubForward").addEventListener('click', ( event ) => {
				  shiftTextTrack(findRussianSubtitleTrack(), 0.2 );
				  shiftRussianSubtitle+= 0.2;
				  console.log(shiftRussianSubtitle.toFixed(2));
				} );
*/				
				// Внутри .then(data => { ... }) после создания плеера
				const btnAutoForward = document.getElementById('idAutoForward');
				if (btnAutoForward) {
					btnAutoForward.addEventListener('click', () => {
						turnOnOffAutoForward( true );
					});
				}

			} else {
				// desktop
			    removeNodeById('controlPanel');
			    loadCSS('styles.css');
			}
/*
		}
		)
		.catch(error => {
			console.error('Ошибка AJAX-запроса:', error.message);
			// Вызываем handle с ошибкой
			//handle(null, error.message);
		});
*/		
};

function parseUrl(urlString) {
  try {
    const url = new URL(urlString);
    return {
      host: url.hostname,
      path: url.pathname
    };
  } catch (error) {
    console.error("Некорректный URL:", error);
    return null;
  }
}

/**
 * Создает iframe внутри указанного контейнера
 * @param {string} containerId - ID родительского div
 * @param {string} src - Ссылка для iframe
 * @param {string} iframeId - (Опционально) ID для самого iframe
 */
function createPlayerIframe(containerId, src, iframeId = 'player_iframe') {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Контейнер с id "${containerId}" не найден.`);
    return;
  }

  // Создаем элемент iframe
  const iframe = document.createElement('iframe');

  // Устанавливаем атрибуты
  iframe.id = iframeId;
  iframe.src = src;
  
  // Разрешаем полноэкранный режим (актуально для плееров)
  iframe.allowFullscreen = true;

  // Очищаем контейнер перед добавлением, если там что-то было
  container.innerHTML = '';

  // Добавляем iframe в div
  container.appendChild(iframe);
}
