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
	  } else { // desctop mode
		track.mode = "showing"; 		  
	  }
      document.getElementsByTagName('video')[0].textTracks[findRussianSubtitleTrackIndex()].oncuechange = f;
	});
}

window.onload = function() {
  window.onkeydown = handle;
  player.onRenew = listen;
  listen(player);
  if ( (typeof versionMobile !== 'undefined') && versionMobile === true ) {
	  document.getElementById("idRewind2Second").addEventListener('click', ( event ) => { backMoving (2); } );
	  document.getElementById("idRewind3Second").addEventListener('click', ( event ) => { backMoving (3); } );
  }		
};
