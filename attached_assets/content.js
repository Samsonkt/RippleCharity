let targetChannelId = null;
let lastVideoId = null;
let videoCount = 0;
let totalVideos = 0;

// Wait for the page to fully load
document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getChannelId' }, (response) => {
    targetChannelId = response.channelId;
    console.log('Target channel ID:', targetChannelId);
    initialize();
  });
});

function initialize() {
  // Disable YouTube's autoplay
  function disableAutoplay() {
    const autoplayToggle = document.querySelector('.ytp-autonav-toggle-button');
    if (autoplayToggle && autoplayToggle.getAttribute('aria-checked') === 'true') {
      autoplayToggle.click();
      console.log('Autoplay disabled');
    }
  }

  // Set a low volume
  function setLowVolume() {
    const video = document.querySelector('video');
    if (video) {
      if (video.volume !== 0.01) {
        console.log('Setting YouTube player volume to 0.01');
        video.volume = 0.01;
      }
      if (video.muted) {
        console.log('Unmuting YouTube player');
        video.muted = false;
      }
    }
  }

  // Simulate user interaction by scrolling
  function simulateScroll() {
    window.scrollBy(0, 50);
    setTimeout(() => window.scrollBy(0, -50), 500);
  }

  // Monitor video playback and count views
  function monitorPlayback() {
    const video = document.querySelector('video');
    if (!video) {
      console.log('No video element found');
      return;
    }

    const currentVideoId = new URLSearchParams(window.location.search).get('v');
    if (!currentVideoId) {
      console.log('No video ID in URL');
      return;
    }

    if (currentVideoId !== lastVideoId) {
      lastVideoId = currentVideoId;
      videoCount++;
      console.log(`Playing video ${videoCount} of ${totalVideos}`);

      // Count a view after 30 seconds
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'viewCounted', channelId: targetChannelId });
      }, 30000 + Math.random() * 10000);

      // Check if this is the last video
      if (videoCount >= totalVideos) {
        console.log('Playlist finished');
        chrome.runtime.sendMessage({ action: 'videosFinished', channelId: targetChannelId });
      }
    }

    // Ensure the video plays
    if (video.paused) {
      video.play();
      console.log('Video was paused, playing now');
    }
  }

  // Get the total number of videos in the playlist
  function getTotalVideos() {
    const playlistItems = document.querySelectorAll('ytd-playlist-video-renderer');
    totalVideos = playlistItems.length;
    console.log('Total videos in playlist:', totalVideos);
  }

  // Run on interval
  setInterval(() => {
    disableAutoplay();
    setLowVolume();
    simulateScroll();
    if (window.location.href.includes('playlist')) {
      getTotalVideos();
      monitorPlayback();
    } else {
      monitorPlayback();
    }
  }, 5000);
}