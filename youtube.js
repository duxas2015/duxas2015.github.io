// Getting IFrame element without id
var playerIframe = document.getElementsByTagName("iframe")[0];

// Futute player object
var yPlayer;

loadYouTubeApi();

// This function loads the IFrame Player API code asynchronously.
function loadYouTubeApi() {
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// This function initializes YouTube player
// after the API code downloads.
// Notice. We are passing playerIframe element retrieved above.
function onYouTubeIframeAPIReady() {
  yPlayer = new YT.Player(playerIframe, {
    events: {
      onReady: playVideo
    }
  });
}

// This function plays video without sound,
// once the player is ready.
function playVideo() {
  yPlayer.playVideo();
  yPlayer.mute();
}