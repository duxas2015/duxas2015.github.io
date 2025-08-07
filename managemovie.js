var video;
var track;
var shiftEnglishSubtitle = 0;
var shiftRussianSubtitle = 0;

function findClosestSubtitle ( video, track ) {
    var foundTime;
    var currentTime = video.currentTime;
	const pattern = /^\[[^\]]*\]$/; // exclude text in []
	const pattern_2 = /^\([^\)]*\)$/; // exclude text in ()
	const pattern_3 = /^[♪\s]+$/; // exclude text ♪
    Array.from(track.cues).forEach( function ( item, index ) {
if ( foundTime === undefined && item.startTime > currentTime && !pattern.test(item.text) && !pattern_2.test(item.text) && !pattern_3.test(item.text) ) {
            console.log ( currentTime );
            console.log( item.startTime );
            foundTime = item.startTime;
        } 
    });
	return foundTime;
}

function getToTheClosestSubtitle() { 
  var video = document.getElementsByTagName('video')[0];
  video.currentTime = findClosestSubtitle (video, track) - 0.5; 
  }

function handle(e) {

	if ( e.code === 'Numpad1' ) { backMoving (2); }
    else if ( e.code === 'Numpad2' ) { backMoving (3); }
	else if ( e.code === 'Numpad3' ) { backMoving (4); }
	else if ( e.code === 'Numpad4' ) { getToTheClosestSubtitle(); }
	else if ( e.code === 'Numpad9' ) { 
	  video = document.getElementsByTagName('video')[0];
      //track = document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()];
	  //track.mode = "showing";
      document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
      document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()].oncuechange = f_eng;
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
	  downloadSubtitlesAsVTT( document.getElementsByTagName('video')[0], document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()] );
	}
	else if ( e.code === 'Numpad7' && e.altKey ) { 
	  downloadSubtitlesAsVTT( document.getElementsByTagName('video')[0], document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()] );
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
	  syncSubtitles( document.getElementsByTagName('video')[0], findEnglishSubtitleTrackIndex(), findRussianSubtitleTrackIndex(), true );
	}
	else if ( e.code === 'Numpad8' && e.altKey ) { 
	  syncSubtitles( document.getElementsByTagName('video')[0], findEnglishSubtitleTrackIndex(), findRussianSubtitleTrackIndex(), false );
	}
}

function backMoving( shift ){
	var video = document.getElementsByTagName('video')[0];
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
	var video = document.getElementsByTagName('video')[0];
	var choosenTrackIndex;
	Array.from(video.textTracks).forEach( function ( item, index ) {
		if ( item.label.search('Eng') === 0 && choosenTrackIndex === undefined ) {
			choosenTrackIndex = index;
		}
	} )
	return choosenTrackIndex;
}

function findEnglishSubtitleTrack(){
	return document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()];
}

function findRussianSubtitleTrackIndex(){
	var video = document.getElementsByTagName('video')[0];
	var choosenTrackIndex;
	Array.from(video.textTracks).forEach( function ( item, index ) {
		if ( ( item.label.search('Rus') === 0 || item.label.search('Рус') === 0 ) && item.label.search('форс') === -1 && choosenTrackIndex === undefined ) {
			choosenTrackIndex = index;
		}
	} )
	return choosenTrackIndex;
}

function findRussianSubtitleTrack(){
	return document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()];
}

function findActiveSubtitleTrackIndex(){
	var video = document.getElementsByTagName('video')[0];
	var choosenTrack;
	Array.from(video.textTracks).forEach( function ( item, index ) {
		if ( item.mode === "showing" ) {
			choosenTrack = document.getElementsByTagName('video')[0].textTracks[index];
		}
	} )
	return choosenTrack;
}

function findActiveSubtitleTrack(){
	return document.getElementsByTagName('video')[0].textTracks[findActiveSubtitleTrackIndex()];
}

var f = function ( event ) { 
 if ( event.currentTarget.activeCues[0] !== undefined ) { document.getElementById("subtitleContainerId").innerText = event.currentTarget.activeCues[0].text; } 
 else { document.getElementById("subtitleContainerId").innerHtml = "";}
 }

var f_eng = function ( event ) {
 if ( event.currentTarget.activeCues[0] !== undefined ) { document.getElementById("engSubtitleContainerId").innerText = event.currentTarget.activeCues[0].text; } 
 else { document.getElementById("engSubtitleContainerId").innerHtml = "";}
 }


function listen(player) {
	player.once('ready', () => {
      track = document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()];
	  shiftEnglishSubtitle = 0;
	  shiftRussianSubtitle = 0;
	  if ( isMobileVersion() === true ) { // mobile mode
		track.mode = "hidden";
	  } else { // desktop mode
		//track.mode = "showing";
	  }
	  if ( findEnglishSubtitleTrackIndex() >= 0 ) {
		document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()].oncuechange = f_eng;
	  }
	  if ( findRussianSubtitleTrackIndex() >= 0 ) {
		document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
	  }	
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
    downloadLink.click();
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

window.onload = function() {

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
							season: 1,
							episode: "1"
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
			  window.onkeydown = handle;
			  player.onRenew = listen;
			  listen(player);
			  
			if ( isMobileVersion() ) {
			  // mobile	
			  loadCSS('styles_mobile.css');
			  
			  document.getElementById("idRewind2Second").addEventListener('click', ( event ) => { backMoving (2); } );
			  document.getElementById("idRewind3Second").addEventListener('click', ( event ) => { backMoving (3); } );
			  document.getElementById("idRewindUntilNextSub").addEventListener('click', ( event ) => { getToTheClosestSubtitle(); } );
			  document.getElementById("idSetRusSub").addEventListener('click', ( event ) => { 
				  document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
				  document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()].oncuechange = f_eng;
				  video = document.getElementsByTagName('video')[0];
				} );
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
			} else {
				// desktop
			    removeNodeById('controlPanel');
			    loadCSS('styles.css');
			}
		})
		.catch(error => {
			console.error('Ошибка AJAX-запроса:', error.message);
			// Вызываем handle с ошибкой
			//handle(null, error.message);
		});
};
