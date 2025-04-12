import { useState, useEffect, useRef } from 'react';
import { useBooster } from '@/contexts/BoosterContext';
import { useToast } from '@/hooks/use-toast';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYoutubeBooster() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [volume, setVolume] = useState(0.1); // 10% volume
  const [quality, setQuality] = useState('480p');
  const playerRef = useRef<any>(null);
  const { isBoosting, currentBoosting, currentChannel, videoQueue, countView, stopBoosting } = useBooster();
  const { toast } = useToast();
  
  // Find the currently playing video
  const currentVideo = videoQueue.find(video => video.status === 'playing');
  
  // Setup YouTube iframe API
  useEffect(() => {
    // Load YouTube API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    // Initialize player when API is ready and we have a video to play
    window.onYouTubeIframeAPIReady = () => {
      if (currentVideo) {
        initializePlayer(currentVideo.videoId);
      }
    };
    
    // Check if API is already loaded
    if (window.YT && window.YT.Player && currentVideo) {
      initializePlayer(currentVideo.videoId);
    }
    
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [currentVideo?.videoId]);
  
  // Update playback settings when they change
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume * 100);
      
      if (quality === '240p') playerRef.current.setPlaybackQuality('small');
      else if (quality === '480p') playerRef.current.setPlaybackQuality('medium');
      else if (quality === '720p') playerRef.current.setPlaybackQuality('hd720');
      else if (quality === '1080p') playerRef.current.setPlaybackQuality('hd1080');
    }
  }, [volume, quality]);
  
  // Initialize YouTube player
  const initializePlayer = (videoId: string) => {
    try {
      // Clear any existing interval
      if ((window as any).playbackTimeInterval) {
        clearInterval((window as any).playbackTimeInterval);
      }
      
      // Safely destroy existing player if it exists
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error("Error destroying player:", error);
        }
      }
      
      // Make sure the container element exists
      const container = document.getElementById('youtube-player');
      if (!container) {
        console.error("YouTube player container not found!");
        // Create a new div with this ID
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        const playerContainer = document.getElementById('youtube-player-container');
        if (playerContainer) {
          playerContainer.innerHTML = '';
          playerContainer.appendChild(playerDiv);
        } else {
          console.error("Player container not found either!");
          return;
        }
      }
      
      // Create new player
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '240',
        width: '100%',
        videoId: videoId,
        playerVars: {
          'autoplay': 1,
          'modestbranding': 1,
          'playsinline': 1,
          'rel': 0,
          'controls': 1,
          'enablejsapi': 1
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onError': onPlayerError
        }
      });
      
      setCurrentVideoId(videoId);
      
      // Backup strategy for player initialization
      setTimeout(() => {
        if (playerRef.current && !isPlaying) {
          try {
            playerRef.current.playVideo();
          } catch (error) {
            console.error("Error in delayed play:", error);
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error initializing YouTube player:", error);
      toast({
        title: "Player Error",
        description: "There was an error initializing the YouTube player. Please refresh the page.",
        variant: "destructive",
      });
    }
  };
  
  // Player event handlers
  const onPlayerReady = (event: any) => {
    event.target.setVolume(volume * 100);
    event.target.playVideo();
    setIsPlaying(true);
  };
  
  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      
      // Set up interval to track playback time only when playing
      const interval = setInterval(() => {
        try {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            setPlaybackTime(playerRef.current.getCurrentTime());
          }
        } catch (error) {
          console.error("Error getting current time:", error);
        }
      }, 1000);
      
      // Store the interval ID so we can clear it later
      (window as any).playbackTimeInterval = interval;
      
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      
      // Clear the playback time interval when paused
      if ((window as any).playbackTimeInterval) {
        clearInterval((window as any).playbackTimeInterval);
      }
      
      // Auto resume if paused
      setTimeout(() => {
        try {
          if (playerRef.current && 
              typeof playerRef.current.getPlayerState === 'function' && 
              playerRef.current.getPlayerState() === window.YT.PlayerState.PAUSED) {
            playerRef.current.playVideo();
          }
        } catch (error) {
          console.error("Error auto-resuming video:", error);
        }
      }, 2000);
      
    } else if (event.data === window.YT.PlayerState.ENDED) {
      // Video finished, count the view and play next video
      handleVideoEnded();
      
      // Clear the playback time interval when ended
      if ((window as any).playbackTimeInterval) {
        clearInterval((window as any).playbackTimeInterval);
      }
    }
  };
  
  const onPlayerError = (event: any) => {
    console.error('YouTube player error:', event.data);
    toast({
      title: "Playback Error",
      description: "There was an error playing this video. Skipping to the next one.",
      variant: "destructive",
    });
    
    // Skip to next video on error
    handleVideoEnded();
  };
  
  // Handle video completion
  const handleVideoEnded = () => {
    if (!currentChannel || !currentVideo) return;
    
    // Count view for the completed video
    countView(currentVideo.videoId, currentChannel.channelId, Math.floor(currentVideo.duration));
    
    // Find the next queued video
    const nextVideo = videoQueue.find(video => video.status === 'queued');
    
    if (nextVideo) {
      // Play the next video
      initializePlayer(nextVideo.videoId);
    } else {
      // All videos are completed
      toast({
        title: "Boosting Complete",
        description: "All videos for this channel have been watched",
      });
      stopBoosting();
    }
  };
  
  // Playback controls
  const playVideo = () => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };
  
  const pauseVideo = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  };
  
  const setPlayerVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume * 100);
    }
  };
  
  const setPlayerQuality = (newQuality: string) => {
    setQuality(newQuality);
    if (playerRef.current) {
      if (newQuality === '240p') playerRef.current.setPlaybackQuality('small');
      else if (newQuality === '480p') playerRef.current.setPlaybackQuality('medium');
      else if (newQuality === '720p') playerRef.current.setPlaybackQuality('hd720');
      else if (newQuality === '1080p') playerRef.current.setPlaybackQuality('hd1080');
    }
  };
  
  return {
    isPlaying,
    currentVideoId,
    playbackTime,
    volume,
    quality,
    playVideo,
    pauseVideo,
    setPlayerVolume,
    setPlayerQuality,
    currentVideo,
    videoQueue
  };
}
