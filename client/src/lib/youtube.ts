import { Video } from "@shared/schema";

const API_KEY = import.meta.env.YOUTUBE_API_KEY || 'AIzaSyC2_HeRLg-_D4PMvVgBaTPIlT6tN7Ooyjo';

export async function fetchChannelVideos(channelId: string): Promise<Video[]> {
  try {
    // Use our backend proxy instead of direct YouTube API calls
    const response = await fetch(`/api/youtube/channel/${channelId}/videos`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
    }
    
    const videos = await response.json();
    return videos;
  } catch (error) {
    console.error("Error fetching channel videos:", error);
    return [];
  }
}

export function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1] || '0');
  const minutes = parseInt(match?.[2] || '0');
  const seconds = parseInt(match?.[3] || '0');
  return (hours * 3600) + (minutes * 60) + seconds;
}

export function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
