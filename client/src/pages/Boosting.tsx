import { useState, useRef, useEffect } from "react";
import { useBooster } from "@/contexts/BoosterContext";
import { useYoutubeBooster } from "@/hooks/useYoutubeBooster";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import VideoQueue from "@/components/VideoQueue";
import { formatTime } from "@/lib/youtube";

export default function Boosting() {
  const { isBoosting, currentBoosting, currentChannel, videoQueue, stopBoosting } = useBooster();
  const { 
    isPlaying, volume, quality, setPlayerVolume, setPlayerQuality, currentVideo 
  } = useYoutubeBooster();
  
  const [sessionTime, setSessionTime] = useState(0);
  const [visibleVideos, setVisibleVideos] = useState(5);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  // Update session time every second
  useEffect(() => {
    if (!isBoosting) return;
    
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isBoosting]);
  
  // Format the session time as HH:MM:SS
  const formattedSessionTime = formatTime(sessionTime);
  
  // Calculate estimated completion time
  const estimateCompletionTime = () => {
    if (!videoQueue || videoQueue.length === 0) return "0h 0m";
    
    const remainingVideos = videoQueue.filter(v => v.status === "queued").length;
    const avgDuration = videoQueue.reduce((sum, v) => sum + v.duration, 0) / videoQueue.length;
    const estimatedSecondsRemaining = remainingVideos * avgDuration;
    
    return formatTime(estimatedSecondsRemaining);
  };
  
  const handleStopBoosting = () => {
    stopBoosting();
  };
  
  const handleShowMoreVideos = () => {
    setVisibleVideos(prev => prev + 5);
  };
  
  if (!isBoosting) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">No Active Boosting Session</h2>
        <p className="text-neutral-600 mb-6">
          You're not currently boosting any channels. Go to the Channels tab to start boosting.
        </p>
        <Button onClick={() => window.location.href = '/channels'}>
          Browse Channels
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Active Boosting</h2>
        
        {/* Current Boosting Status */}
        <div className="bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage src={currentChannel?.thumbnailUrl} alt={currentChannel?.name} />
              <AvatarFallback>{currentChannel?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-neutral-800">{currentChannel?.name}</div>
              <div className="text-sm text-neutral-600">Currently boosting this channel</div>
            </div>
            <div className="ml-auto">
              <Button 
                variant="destructive" 
                onClick={handleStopBoosting}
                className="bg-red-500 hover:bg-red-600"
              >
                Stop Boosting
              </Button>
            </div>
          </div>
        </div>
        
        {/* YouTube Player */}
        <div 
          ref={playerContainerRef} 
          id="youtube-player-container" 
          className="rounded-lg overflow-hidden mb-6 bg-neutral-900 relative"
          style={{ height: "240px" }}
        >
          <div id="youtube-player"></div>
          <div className="absolute bottom-4 right-4 bg-neutral-800 text-white text-xs px-2 py-1 rounded">
            Currently playing video {currentBoosting?.videosWatched ? currentBoosting.videosWatched + 1 : 1} of {videoQueue.length}
          </div>
        </div>
        
        {/* Boosting Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-neutral-100 rounded-lg p-4">
            <div className="text-neutral-600 text-sm mb-1">Current Session</div>
            <div className="text-xl font-semibold text-neutral-800">{formattedSessionTime}</div>
          </div>
          
          <div className="bg-neutral-100 rounded-lg p-4">
            <div className="text-neutral-600 text-sm mb-1">Videos Watched</div>
            <div className="text-xl font-semibold text-neutral-800">
              {currentBoosting?.videosWatched || 0} / {videoQueue.length}
            </div>
          </div>
          
          <div className="bg-neutral-100 rounded-lg p-4">
            <div className="text-neutral-600 text-sm mb-1">Est. Completion</div>
            <div className="text-xl font-semibold text-neutral-800">{estimateCompletionTime()}</div>
          </div>
        </div>
        
        {/* Boosting Settings */}
        <div className="border-t border-neutral-200 pt-4 mt-6">
          <h3 className="text-lg font-medium text-neutral-800 mb-3">Boosting Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Playback Volume</Label>
              <Slider 
                min={0} 
                max={1} 
                step={0.01} 
                value={[volume]} 
                onValueChange={(vals) => setPlayerVolume(vals[0])}
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Mute</span>
                <span>{Math.round(volume * 100)}%</span>
                <span>Max</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Video Quality</Label>
              <Select 
                defaultValue={quality} 
                onValueChange={setPlayerQuality}
              >
                <SelectTrigger className="w-full bg-neutral-100 border border-neutral-300">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="240p">240p (Lowest)</SelectItem>
                  <SelectItem value="480p">480p (Recommended)</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="background-play" defaultChecked />
              <Label htmlFor="background-play">Allow background playback</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="auto-next" defaultChecked />
              <Label htmlFor="auto-next">Auto-play next video</Label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Queue Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-neutral-800 mb-4">Video Queue</h3>
        
        <VideoQueue 
          videos={videoQueue.slice(0, visibleVideos)} 
          showMore={visibleVideos < videoQueue.length ? handleShowMoreVideos : undefined}
          remainingCount={videoQueue.length - visibleVideos}
        />
      </div>
    </>
  );
}
