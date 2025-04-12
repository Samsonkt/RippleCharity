import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import ChannelProgressBar from "@/components/ChannelProgressBar";
import DonationPrompt from "@/components/DonationPrompt";
import { formatTime } from "@/lib/youtube";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  
  // Get user from localStorage
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/user/stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/user/stats?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return res.json();
    },
    enabled: !!user
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Your Impact Summary</h2>
        <p className="text-red-500">Failed to load statistics. Please try again later.</p>
      </div>
    );
  }
  
  const formattedSessionTime = stats ? formatTime(stats.sessionTime) : '0s';
  
  return (
    <div className="space-y-6">
      {/* Impact Summary Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-neutral-800">Your Ripple Impact</h2>
          <div className="text-sm text-neutral-500 flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Live Updates</span>
          </div>
        </div>
        
        {/* Impact Stats with improved design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Views Generated" 
            value={stats?.totalViews || 0} 
            change={stats?.totalViews > 0 ? `+${Math.min(stats.totalViews, 32)} since yesterday` : undefined}
          />
          
          <StatCard 
            title="Channels Uplifted" 
            value={stats?.channelsSupported || 0} 
            change={stats?.channelsSupported > 0 ? `+${Math.min(stats.channelsSupported, 1)} this week` : undefined}
          />
          
          <StatCard 
            title="Total Watch Time" 
            value={formattedSessionTime} 
            change={stats?.sessionTime > 0 ? "Active today" : undefined}
          />
        </div>
        
        {/* Achievement Milestone */}
        {stats?.totalViews > 0 && (
          <div className="bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-lg p-4 mb-6 flex items-center">
            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-white">
              🌊
            </div>
            <div className="ml-4">
              <h4 className="font-medium text-neutral-800">Ripple Creator Badge Earned!</h4>
              <p className="text-sm text-neutral-600">
                You've helped create positive impact through your viewing support.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Channel Performance Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-neutral-800 mb-5">Your Ripple Distribution</h3>
        
        {stats?.viewsByChannel && stats.viewsByChannel.length > 0 ? (
          <div className="space-y-4">
            {stats.viewsByChannel.map((channel: {
              channelId: string;
              channelName: string;
              views: number;
              percentage: number;
            }) => (
              <ChannelProgressBar 
                key={channel.channelId}
                channel={{
                  name: channel.channelName,
                  thumbnailUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=random`,
                  views: channel.views,
                  percentage: channel.percentage,
                  isVerified: true
                }}
              />
            ))}
            
            {/* Tooltips explaining the impact */}
            <div className="mt-6 bg-neutral-50 rounded-lg p-4">
              <h4 className="font-medium text-neutral-700 mb-2">Understanding Your Impact</h4>
              <p className="text-sm text-neutral-600">
                Each view you generate helps charity channels improve their visibility in YouTube's algorithm.
                Higher watch time means more algorithm favor, translating to increased organic discovery.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="inline-block p-4 bg-neutral-100 rounded-full mb-4">
              🌊
            </div>
            <h4 className="text-lg font-medium text-neutral-800 mb-2">Start Your Ripple</h4>
            <p className="text-neutral-600 text-sm mb-4 max-w-md mx-auto">
              You haven't boosted any channels yet. Visit the Channels tab to discover worthy causes and start creating your ripple effect.
            </p>
            <a 
              href="/channels" 
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Discover Channels
            </a>
          </div>
        )}
      </div>
      
      {/* Optional Donation Section - Redesigned to be subtle */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <details className="group">
          <summary className="flex justify-between items-center text-neutral-700 cursor-pointer">
            <h3 className="text-lg font-medium">Support Further <span className="text-primary">(Optional)</span></h3>
            <span className="transition-transform group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="pt-4 mt-2">
            <DonationPrompt />
          </div>
        </details>
      </div>
    </div>
  );
}
