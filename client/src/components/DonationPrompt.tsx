import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function DonationPrompt({ channelId }: { channelId?: string }) {
  const [, navigate] = useLocation();

  const { data: channels } = useQuery({
    queryKey: ['/api/channels'],
    queryFn: async () => {
      const res = await fetch('/api/channels');
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    },
    enabled: !channelId
  });

  const handleDonateClick = () => {
    if (channelId) {
      navigate(`/donate/${channelId}`);
    } else if (channels && channels.length > 0) {
      // If no specific channel, direct to the first verified channel
      navigate(`/channels`);
    } else {
      navigate('/channels');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <h3 className="text-lg font-medium text-neutral-700 mb-1">Feel Moved to Do More?</h3>
          <p className="text-neutral-600 text-sm opacity-80">
            Your views already make a difference! If you feel inspired, you can also support these causes directly.
          </p>
          <div className="mt-3 text-xs text-neutral-500">
            <span className="inline-flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              100% of donations go directly to the charities
            </span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
          onClick={handleDonateClick}
        >
          {channelId ? "Support This Channel" : "View Donation Options"}
        </Button>
      </div>
    </div>
  );
}
