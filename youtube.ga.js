/*!
 * youtube.ga.js | v0.3.1
 * Copyright (c) 2012 - 2013 Sander Heilbron (http://sanderheilbron.nl)
 * Edits by Ali Karbassi (http://karbassi.com)
 * MIT licensed
 * Cleaner code, only Universal Analytics / analytics.js; removed minified version - everybody should tweak this - modified by Tomas Strejce //tomas-strejcek.cz
 */

// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "//youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var YT_GA = YT_GA || {
    configYouTubePlayer: {
        players: [],
        callback: false
    }
};

function onYouTubePlayerAPIReady() {
    if ('callback' in YT_GA.configYouTubePlayer && typeof YT_GA.configYouTubePlayer.callback === 'function') {
        YT_GA.configYouTubePlayer.callback(YT_GA.onReady);
    } else {
        YT_GA.onReady();
    }
}

YT_GA.onReady = function () {
    for(player in YT_GA.configYouTubePlayer.players) {
        var p = YT_GA.configYouTubePlayer.players[player];
        YT_GA.playerOptions = {
            height: p.height,
            width: p.width,
            videoId: p.videoID,
            playerVars: {},
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onPlaybackQualityChange': onPlayerPlaybackQualityChange
            }
        };

        for (var setting in p.playerVars) {
            if (!p.playerVars.hasOwnProperty(setting)) {
                continue;
            }
            YT_GA.playerOptions.playerVars[setting] = p.playerVars[setting];
        }

        YT_GA.player = new YT.Player(p.container, YT_GA.playerOptions);
    }
}

function onPlayerReady(event) {
    // Check video status every 500ms
    setInterval(onPlayerProgressChange, 500);

    YT_GA.progress25 = false;
    YT_GA.progress50 = false;
    YT_GA.progress75 = false;
    YT_GA.url = YT_GA.player.getVideoUrl();
    YT_GA.videoPlayed = false;
    YT_GA.videoCompleted = false;
}

function onPlayerProgressChange() {
    if (!configYouTubePlayer.trackProgress || typeof _gaq === 'undefined') {
        return;
    }

    // Calculate percent complete
    YT_GA.timePercentComplete = Math.round(YT_GA.player.getCurrentTime() / YT_GA.player.getDuration() * 100);

    var progress;

    if (YT_GA.timePercentComplete > 24 && !YT_GA.progress25) {
        progress = '25%';
        YT_GA.progress25 = true;
    }

    if (YT_GA.timePercentComplete > 49 && !YT_GA.progress50) {
        progress = '50%';
        YT_GA.progress50 = true;
    }

    if (YT_GA.timePercentComplete > 74 && !YT_GA.progress75) {
        progress = '75%';
        YT_GA.progress75 = true;
    }

    if (progress) {
        _gaq.push(['_trackEvent', 'YouTube', 'Played video: ' + progress, YT_GA.url, undefined, true]);
    }
}

function onPlayerPlaybackQualityChange(event) {
    if (!configYouTubePlayer.trackPlaybackQuality || typeof _gaq === 'undefined') {
        return;
    }

    var quality;

    switch (event.data) {
        case 'hd1080':
            quality = '1080p HD';
            break;
        case 'hd720':
            quality = '720p HD';
            break;
        case 'large':
            quality = '480p';
            break;
        case 'medium':
            quality = '360p';
            break;
        case 'small':
            quality = '240p';
            break;
    }

    if (quality) {
        _gaq.push(['_trackEvent', 'YouTube', 'Video quality: ' + quality, YT_GA.url, undefined, true]);
    }
}

function onPlayerStateChange(event) {
    if (typeof _gaq === 'undefined') {
        return;
    }

    // Calculate percent complete
    YT_GA.timePercentComplete = Math.round(YT_GA.player.getCurrentTime() / YT_GA.player.getDuration() * 100);

    if (event.data === YT.PlayerState.PLAYING && !YT_GA.videoPlayed) {

        _gaq.push(['_trackEvent', 'YouTube', 'Started video', YT_GA.url, undefined, true]);
        YT_GA.videoPaused = false;
        YT_GA.videoPlayed = true; //  Avoid subsequent play trackings

    } else if (event.data === YT.PlayerState.PAUSED && (YT_GA.timePercentComplete < 92 && !YT_GA.videoPaused)) {

        _gaq.push(['_trackEvent', 'YouTube', 'Paused video', YT_GA.url, undefined, true]);
        YT_GA.videoPaused = true; // Avoid subsequent pause trackings

    } else if (event.data === YT.PlayerState.ENDED && !YT_GA.videoCompleted) {

        _gaq.push(['_trackEvent', 'YouTube', 'Completed video', YT_GA.url, undefined, true]);
        YT_GA.videoCompleted = true; // Avoid subsequent finish trackings

    }

}