import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ChannelProgressBarProps {
  channel: {
    name: string;
    thumbnailUrl: string;
    views: number;
    percentage: number;
    isVerified: boolean;
  };
}

export default function ChannelProgressBar({ channel }: ChannelProgressBarProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={channel.thumbnailUrl} alt={channel.name} />
            <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="ml-2 font-medium text-neutral-700">{channel.name}</span>
          {channel.isVerified && (
            <Badge variant="secondary" className="ml-2 px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded text-xs">
              Verified
            </Badge>
          )}
        </div>
        <div className="text-neutral-600 text-sm">{channel.views} views</div>
      </div>
      <Progress value={channel.percentage} className="h-2 bg-neutral-200" />
    </div>
  );
}
