import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import CharityCard from "@/components/CharityCard";

export default function Channels() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  const { data: channels, isLoading } = useQuery({
    queryKey: ['/api/channels'],
    queryFn: async () => {
      const res = await fetch('/api/channels');
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    }
  });
  
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/user/stats?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch user stats');
      return res.json();
    },
    enabled: !!user
  });
  
  // Filter channels based on search query and category
  const filteredChannels = channels?.filter(channel => {
    const matchesSearch = searchQuery === "" || 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "All" || channel.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Available categories from the channels
  const categories = channels 
    ? ["All", ...new Set(channels.map(channel => channel.category))] 
    : ["All"];
  
  // Get channel stats from user stats
  const getChannelStats = (channelId: string) => {
    if (!userStats || !userStats.viewsByChannel) return undefined;
    
    const channelStat = userStats.viewsByChannel.find(stat => stat.channelId === channelId);
    if (!channelStat) return undefined;
    
    return {
      views: channelStat.views,
      hours: Math.round(userStats.sessionTime / 3600 * 10) / 10 // Convert seconds to hours with 1 decimal
    };
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-800">Verified Charity Channels</h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search channels..."
            className="pl-9 pr-4 py-2 rounded-lg border border-neutral-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-neutral-400" />
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            className={activeCategory === category 
              ? "bg-primary text-white" 
              : "bg-white text-neutral-600 hover:bg-neutral-100"
            }
            size="sm"
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Channel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels?.map(channel => (
              <CharityCard 
                key={channel.id} 
                channel={channel} 
                stats={getChannelStats(channel.channelId)}
              />
            ))}
          </div>
          
          {filteredChannels?.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No channels found</h3>
              <p className="text-neutral-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
