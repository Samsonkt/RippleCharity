import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { queryClient } from "@/lib/queryClient";
import { Video } from "@shared/schema";

interface CurrentBoosting {
  id: number;
  userId: number;
  channelId: string;
  startTime: string;
  lastUpdated: string;
  activeVideoId: string | null;
  videosWatched: number;
}

interface Channel {
  id: number;
  channelId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string;
  category: string;
  isVerified: boolean;
}

interface BoosterContextType {
  isBoosting: boolean;
  currentBoosting: CurrentBoosting | null;
  currentChannel: Channel | null;
  videoQueue: Video[];
  startBoosting: (channelId: string) => Promise<void>;
  stopBoosting: () => Promise<void>;
  countView: (videoId: string, channelId: string, duration: number) => Promise<void>;
}

const BoosterContext = createContext<BoosterContextType | undefined>(undefined);

export function BoosterProvider({ children }: { children: ReactNode }) {
  const [currentBoosting, setCurrentBoosting] = useState<CurrentBoosting | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [videoQueue, setVideoQueue] = useState<Video[]>([]);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  
  // Get user from localStorage instead of auth context
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    try {
      const message = JSON.parse(lastMessage);
      
      if (message.type === "viewCounted" && message.data.userId === user?.id) {
        // Update boosting data when view is counted
        setCurrentBoosting(message.data.boosting);
        
        // Invalidate user stats query to refresh dashboard
        queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
        
        toast({
          title: "View counted",
          description: `Your view for this video has been counted!`,
        });
      }
      
      if (message.type === "boostingStopped" && message.data.userId === user?.id) {
        setCurrentBoosting(null);
        setCurrentChannel(null);
        setVideoQueue([]);
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }, [lastMessage, user, toast]);

  // Check for existing boosting session on load
  useEffect(() => {
    if (!user) return;
    
    async function checkCurrentBoosting() {
      try {
        const response = await apiRequest("GET", `/api/boosting/current?userId=${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setCurrentBoosting(data);
          
          // Fetch channel info
          const channelResponse = await apiRequest("GET", `/api/channel/${data.channelId}`);
          if (channelResponse.ok) {
            const channelData = await channelResponse.json();
            setCurrentChannel(channelData);
          }
          
          // Fetch videos
          const videosResponse = await apiRequest("GET", `/api/youtube/channel/${data.channelId}/videos`);
          if (videosResponse.ok) {
            const videos = await videosResponse.json();
            
            // Mark current video as playing and previous as completed
            const updatedVideos = videos.map((video: Video, index: number) => {
              if (video.videoId === data.activeVideoId) {
                return { ...video, status: 'playing' };
              } else if (index < data.videosWatched) {
                return { ...video, status: 'completed' };
              }
              return video;
            });
            
            setVideoQueue(updatedVideos);
          }
        }
      } catch (error) {
        console.error("Failed to check current boosting:", error);
      }
    }
    
    checkCurrentBoosting();
  }, [user]);

  const startBoosting = async (channelId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start boosting",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Start the boosting session
      const response = await apiRequest("POST", "/api/boosting/start", {
        userId: user.id,
        channelId
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start boosting");
      }
      
      const boostingData = await response.json();
      setCurrentBoosting(boostingData);
      
      // Fetch channel info
      const channelResponse = await apiRequest("GET", `/api/channel/${channelId}`);
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        setCurrentChannel(channelData);
      }
      
      // Fetch videos
      const videosResponse = await apiRequest("GET", `/api/youtube/channel/${channelId}/videos`);
      if (videosResponse.ok) {
        const videos = await videosResponse.json();
        
        // Mark first video as playing
        if (videos.length > 0) {
          videos[0].status = 'playing';
          
          // Update boosting with active video
          await apiRequest("POST", "/api/boosting/update", {
            userId: user.id,
            videoId: videos[0].videoId,
            videosWatched: 0
          });
        }
        
        setVideoQueue(videos);
      }
      
      toast({
        title: "Boosting started",
        description: `Now boosting ${currentChannel?.name || channelId}`,
      });
    } catch (error: any) {
      console.error("Failed to start boosting:", error);
      toast({
        title: "Boosting Error",
        description: error.message || "Failed to start boosting",
        variant: "destructive",
      });
    }
  };

  const stopBoosting = async () => {
    if (!user || !currentBoosting) return;
    
    try {
      const response = await apiRequest("POST", "/api/boosting/stop", {
        userId: user.id
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to stop boosting");
      }
      
      setCurrentBoosting(null);
      setCurrentChannel(null);
      setVideoQueue([]);
      
      toast({
        title: "Boosting stopped",
        description: "Your boosting session has been stopped",
      });
    } catch (error: any) {
      console.error("Failed to stop boosting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to stop boosting",
        variant: "destructive",
      });
    }
  };

  const countView = async (videoId: string, channelId: string, duration: number) => {
    if (!user) return;
    
    try {
      const response = await apiRequest("POST", "/api/view/count", {
        userId: user.id,
        channelId,
        videoId,
        viewDuration: duration
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to count view");
      }
      
      // Update video queue status
      setVideoQueue(prev => 
        prev.map(video => {
          if (video.videoId === videoId) {
            return { ...video, status: 'completed' };
          } else if (video.status === 'queued' && !prev.some(v => v.status === 'playing')) {
            return { ...video, status: 'playing' };
          }
          return video;
        })
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
    } catch (error: any) {
      console.error("Failed to count view:", error);
    }
  };

  const isBoosting = !!currentBoosting;

  return (
    <BoosterContext.Provider
      value={{
        isBoosting,
        currentBoosting,
        currentChannel,
        videoQueue,
        startBoosting,
        stopBoosting,
        countView,
      }}
    >
      {children}
    </BoosterContext.Provider>
  );
}

export function useBooster() {
  const context = useContext(BoosterContext);
  if (context === undefined) {
    throw new Error("useBooster must be used within a BoosterProvider");
  }
  return context;
}
