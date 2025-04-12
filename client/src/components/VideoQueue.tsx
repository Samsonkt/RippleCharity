import { Video } from "@shared/schema";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface VideoQueueProps {
  videos: Video[];
  showMore?: () => void;
  remainingCount?: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getStatusColor(status: 'playing' | 'completed' | 'queued'): string {
  switch (status) {
    case 'playing':
      return 'bg-blue-50';
    case 'completed':
      return 'bg-green-50';
    default:
      return '';
  }
}

function getStatusBadge(status: 'playing' | 'completed' | 'queued'): { color: string, text: string } {
  switch (status) {
    case 'playing':
      return { color: 'bg-blue-100 text-blue-800', text: 'Playing' };
    case 'completed':
      return { color: 'bg-green-100 text-green-800', text: 'Completed' };
    default:
      return { color: 'bg-neutral-100 text-neutral-800', text: 'Queued' };
  }
}

export default function VideoQueue({ videos, showMore, remainingCount = 0 }: VideoQueueProps) {
  return (
    <div className="overflow-hidden border border-neutral-200 rounded-lg">
      <Table>
        <TableHeader className="bg-neutral-100">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Video Title</TableHead>
            <TableHead className="w-24">Duration</TableHead>
            <TableHead className="w-24">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video, index) => {
            const statusBadge = getStatusBadge(video.status);
            
            return (
              <TableRow key={video.videoId} className={getStatusColor(video.status)}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{video.title}</TableCell>
                <TableCell>{formatDuration(video.duration)}</TableCell>
                <TableCell>
                  <Badge className={`${statusBadge.color} px-2 py-0.5 font-semibold`}>
                    {statusBadge.text}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {showMore && remainingCount > 0 && (
        <div className="flex justify-center my-4">
          <button 
            className="text-neutral-600 text-sm hover:text-neutral-800"
            onClick={showMore}
          >
            Show more videos ({remainingCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
