import { Check } from "lucide-react";
import { Eye, Clock, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBooster } from "@/contexts/BoosterContext";
import { useLocation } from "wouter";

interface CharityCardProps {
  channel: {
    id: number;
    channelId: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    bannerUrl: string;
    category: string;
    isVerified: boolean;
  };
  stats?: {
    views: number;
    hours: number;
  };
}

export default function CharityCard({ channel, stats }: CharityCardProps) {
  const { startBoosting, isBoosting, currentChannel } = useBooster();
  const [, navigate] = useLocation();
  
  const isCurrentlyBoosting = isBoosting && currentChannel?.channelId === channel.channelId;
  
  const handleBoost = () => {
    startBoosting(channel.channelId);
  };
  
  const handleDonate = () => {
    navigate(`/donate/${channel.channelId}`);
  };
  
  return (
    <div className="charity-card bg-white rounded-xl shadow-sm overflow-hidden transition-transform hover:translate-y-[-3px] hover:shadow-md">
      <div className="relative h-40 bg-neutral-200">
        <img 
          src={channel.bannerUrl} 
          alt={`${channel.name} banner`} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white p-1">
          <img 
            src={channel.thumbnailUrl} 
            alt={channel.name} 
            className="w-full h-full rounded-full object-cover" 
          />
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-neutral-800">{channel.name}</h3>
          {channel.isVerified && (
            <span className="flex items-center text-emerald-600 text-xs">
              <Check className="h-4 w-4 mr-1" />
              Verified
            </span>
          )}
        </div>
        
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{channel.description}</p>
        
        <div className="flex items-center text-xs text-neutral-500 mb-4">
          {stats && (
            <>
              <span className="flex items-center mr-3">
                <Eye className="h-4 w-4 mr-1" />
                {stats.views} views
              </span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {stats.hours} hours
              </span>
            </>
          )}
          {!stats && (
            <>
              <span className="flex items-center mr-3">
                <Eye className="h-4 w-4 mr-1" />
                0 views
              </span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                0 hours
              </span>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            className="bg-primary hover:bg-blue-500" 
            onClick={handleBoost}
            disabled={isBoosting && !isCurrentlyBoosting}
          >
            {isCurrentlyBoosting ? 'Currently Boosting' : 'Boost'}
          </Button>
          
          <Button 
            className="bg-amber-500 hover:bg-amber-600 flex items-center justify-center"
            onClick={handleDonate}
          >
            <Heart className="h-4 w-4 mr-1" /> Donate
          </Button>
        </div>
      </div>
    </div>
  );
}
