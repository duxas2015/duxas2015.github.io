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

function getToTheClosestSubtitle() { video.currentTime = findClosestSubtitle (video, track) - 0.5; }

function handle(e) {

	if ( e.code === 'Numpad1' ) { backMoving (2); }
    else if ( e.code === 'Numpad2' ) { backMoving (3); }
	else if ( e.code === 'Numpad3' ) { backMoving (4); }
	else if ( e.code === 'Numpad4' ) { getToTheClosestSubtitle(); }
	else if ( e.code === 'Numpad9' ) { 
	  video = document.getElementsByTagName('video')[0];
      track = document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()];
	  track.mode = "showing";
      document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
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
	  if ( (typeof versionMobile !== 'undefined') && versionMobile === true ) { // mobile mode
        document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()].oncuechange = f_eng;
		track.mode = "hidden";		
	  } else { // desctop mode
		track.mode = "showing";
	  }
      document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
	});
}

function get_seasons_arr(text) {
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
				add_new_subtitle(seasons_obj, seasonObj.season, parseInt(episodeObj.episode, 10), './familyguy_cc/en/' + seasonObj.season + String( parseInt(episodeObj.episode, 10) ).padStart(2, '0') + '.vtt', 'English')
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

window.onload = function() {
  if ( (typeof versionMobile !== 'undefined') && versionMobile === true ) {

		fetch(url)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
				}
				return response.text();
			})
			.then(data => {
				return get_seasons_arr ( data );
			})
			.then(data => {
			    try {
                var parsedObject = eval('({' + data + '})');

                if (parsedObject && typeof parsedObject === 'object') {
                    return parsedObject;
                } else {
                }
				} catch (error) {
				}
			})
			.then(data => {
				return handle_all_episodes (data);
			})
			.then(data => {

				player = VenomPlayer.make({
				publicPath: 'https://cdn.jsdelivr.net/npm/venom-player@' + VenomPlayer.version + '/dist/',
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
							
							seasons: data.seasons.slice()

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
				  document.getElementById("idRewind2Second").addEventListener('click', ( event ) => { backMoving (2); } );
				  document.getElementById("idRewind3Second").addEventListener('click', ( event ) => { backMoving (3); } );
				  document.getElementById("idRewindUntilNextSub").addEventListener('click', ( event ) => { getToTheClosestSubtitle(); } );
				  document.getElementById("idSetRusSub").addEventListener('click', ( event ) => { 
					  document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
					  document.getElementsByTagName('video')[0].textTracks[findEnglishSubtitleTrackIndex()].oncuechange = f_eng;
					} )				
			})
			.catch(error => {
				console.error('Ошибка AJAX-запроса:', error.message);
				// Вызываем handle с ошибкой
				handle(null, error.message);
			});
  } else {
	  // desktop	
	  window.onkeydown = handle;
	  player.onRenew = listen;
	  listen(player);
  }
};
