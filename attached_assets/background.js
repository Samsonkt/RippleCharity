let tabId = null;
let videoList = [];
let currentVideoIndex = 0;
let currentChannelId = null;
const API_KEY = 'AIzaSyC2_HeRLg-_D4PMvVgBaTPIlT6tN7Ooyjo';

async function fetchChannelVideos(channelId) {
  try {
    console.log('Step 1: Fetching channel data for:', channelId);
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
    );
    if (!channelResponse.ok) {
      throw new Error(`Channel fetch failed: ${channelResponse.status} ${channelResponse.statusText}`);
    }
    const channelData = await channelResponse.json();
    console.log('Step 1.1: Channel response:', channelData);

    if (!channelData.items || channelData.items.length === 0) {
      console.error('Step 1.2: No channel found for ID:', channelId, 'Falling back to search method');
      return await fetchVideosBySearch(channelId);
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    console.log('Step 2: Uploads playlist ID:', uploadsPlaylistId);

    let videos = [];
    let nextPageToken = '';
    do {
      console.log('Step 3: Fetching playlist items, pageToken:', nextPageToken);
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${nextPageToken}&key=${API_KEY}`
      );
      if (!playlistResponse.ok) {
        console.error('Step 3.1: Playlist fetch failed:', playlistResponse.status, playlistResponse.statusText, 'Falling back to search method');
        return await fetchVideosBySearch(channelId);
      }
      const playlistData = await playlistResponse.json();
      console.log('Step 3.2: Playlist response:', playlistData);

      if (!playlistData.items || playlistData.items.length === 0) {
        console.error('Step 3.3: No items in playlist response:', playlistData, 'Falling back to search method');
        return await fetchVideosBySearch(channelId);
      }

      videos = videos.concat(playlistData.items);
      nextPageToken = playlistData.nextPageToken || '';
    } while (nextPageToken);

    if (videos.length === 0) {
      console.error('Step 3.4: No videos found in playlist, falling back to search method');
      return await fetchVideosBySearch(channelId);
    }

    videos = videos.slice(0, 50);
    const videoIds = videos.map(item => item.contentDetails.videoId).join(',');
    console.log('Step 4: Fetching durations for video IDs:', videoIds);
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
    );
    if (!videoResponse.ok) {
      console.error('Step 4.1: Video details fetch failed:', videoResponse.status, videoResponse.statusText, 'Falling back to default duration');
      return videos.map(item => ({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        duration: 300
      }));
    }
    const videoData = await videoResponse.json();
    console.log('Step 4.2: Video durations response:', videoData);

    if (!videoData.items || videoData.items.length === 0) {
      console.error('Step 4.3: No video details found:', videoData, 'Falling back to default duration');
      return videos.map(item => ({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        duration: 300
      }));
    }

    return videos.map((item, index) => {
      const duration = videoData.items[index]?.contentDetails.duration || 'PT5M';
      return {
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        duration: parseDuration(duration)
      };
    });
  } catch (error) {
    console.error('Error fetching videos:', error, 'Falling back to search method');
    return await fetchVideosBySearch(channelId);
  }
}

async function fetchVideosBySearch(channelId) {
  try {
    console.log('Search Method: Fetching videos for channel:', channelId);
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=50&key=${API_KEY}`
    );
    if (!searchResponse.ok) {
      throw new Error(`Search fetch failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }
    const searchData = await searchResponse.json();
    console.log('Search Method: Search response:', searchData);

    if (!searchData.items || searchData.items.length === 0) {
      console.error('Search Method: No videos found for channel:', channelId);
      return [];
    }

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    console.log('Search Method: Fetching durations for video IDs:', videoIds);
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
    );
    if (!videoResponse.ok) {
      console.error('Search Method: Video details fetch failed:', videoResponse.status, videoResponse.statusText, 'Falling back to default duration');
      return searchData.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        duration: 300
      }));
    }
    const videoData = await videoResponse.json();
    console.log('Search Method: Video durations response:', videoData);

    if (!videoData.items || videoData.items.length === 0) {
      console.error('Search Method: No video details found:', videoData, 'Falling back to default duration');
      return searchData.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        duration: 300
      }));
    }

    return searchData.items.map((item, index) => {
      const duration = videoData.items[index]?.contentDetails.duration || 'PT5M';
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        duration: parseDuration(duration)
      };
    });
  } catch (error) {
    console.error('Search Method: Error fetching videos:', error);
    return [];
  }
}

function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1]) || 0;
  const minutes = parseInt(match?.[2]) || 5;
  const seconds = parseInt(match?.[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function playPlaylist(channelId) {
  const playlistUrl = `https://www.youtube.com/playlist?list=UU${channelId.slice(2)}`;
  if (tabId) {
    chrome.tabs.update(tabId, { url: playlistUrl }, () => {
      console.log('Playing playlist:', playlistUrl);
      chrome.tabs.update(tabId, { active: true }, () => {
        setTimeout(() => chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: false }), 1000);
      });
    });
  } else {
    chrome.tabs.create({ url: playlistUrl, active: false }, (tab) => {
      tabId = tab.id;
      console.log('Playing playlist:', playlistUrl);
      chrome.tabs.update(tabId, { active: true }, () => {
        setTimeout(() => chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: false }), 1000);
      });
    });
  }
}

function playVideosIndividually(videos) {
  if (currentVideoIndex >= videos.length) {
    console.log('All videos played');
    chrome.runtime.sendMessage({ action: 'videosFinished', channelId: currentChannelId });
    return;
  }

  const video = videos[currentVideoIndex];
  const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  if (tabId) {
    chrome.tabs.update(tabId, { url: videoUrl }, () => {
      console.log(`Playing video: ${video.title} (${video.duration}s)`);
      chrome.tabs.update(tabId, { active: true }, () => {
        setTimeout(() => chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: false }), 1000);
      });
    });
  } else {
    chrome.tabs.create({ url: videoUrl, active: false }, (tab) => {
      tabId = tab.id;
      console.log(`Playing video: ${video.title} (${video.duration}s)`);
      chrome.tabs.update(tabId, { active: true }, () => {
        setTimeout(() => chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, { focused: false }), 1000);
      });
    });
  }
}

function incrementViewCount(channelId) {
  chrome.storage.sync.get(['viewsByChannel'], (result) => {
    let viewsByChannel = result.viewsByChannel || {};
    viewsByChannel[channelId] = (viewsByChannel[channelId] || 0) + 1;
    chrome.storage.sync.set({ viewsByChannel }, () => {
      console.log('Updated views for channel:', channelId, viewsByChannel[channelId]);
      chrome.runtime.sendMessage({ action: 'viewCounted', channelId: channelId, viewsByChannel: viewsByChannel });
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    console.log('Step 5: Starting playback for channel:', message.channelId);
    currentChannelId = message.channelId;
    currentVideoIndex = 0;
    videoList = [];
    fetchChannelVideos(currentChannelId).then(result => {
      if (result.useFallback) {
        console.log('Step 5.1: Using playlist method for channel:', currentChannelId);
        playPlaylist(currentChannelId);
      } else if (result.length === 0) {
        console.log('Step 5.2: No videos to play, notifying user');
        chrome.runtime.sendMessage({ action: 'videosFinished', channelId: currentChannelId });
      } else {
        videoList = result;
        console.log(`Step 5.1: Fetched ${videoList.length} videos`);
        playVideosIndividually(videoList);
      }
    });
  } else if (message.action === 'stop') {
    if (tabId) {
      chrome.tabs.remove(tabId);
      tabId = null;
      videoList = [];
      currentVideoIndex = 0;
      console.log('Playback stopped');
    }
  } else if (message.action === 'viewCounted') {
    incrementViewCount(message.channelId);
    currentVideoIndex++;
    if (videoList.length > 0) {
      playVideosIndividually(videoList);
    }
  } else if (message.action === 'getChannelId') {
    sendResponse({ channelId: currentChannelId });
  } else if (message.action === 'videosFinished') {
    chrome.runtime.sendMessage({ action: 'videosFinished', channelId: currentChannelId });
  }
});