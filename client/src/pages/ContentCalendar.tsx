import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar as CalendarIcon, Plus, RefreshCw, Trash2 } from 'lucide-react';

// Type definitions
interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  scheduledDate: Date;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  videoCount: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
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

// Utility function to format dates
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, 'PPP'); // Format as "Apr 12, 2025"
  } catch (error) {
    return dateString;
  }
};

// Event Status Badge Component
const StatusBadge = ({ status }: { status: CalendarEvent['status'] }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <Badge className={getStatusStyles()}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </Badge>
  );
};

// Calendar Event Card Component
const EventCard = ({ 
  event,
  onEdit,
  onDelete,
  selected,
  onSelect
}: { 
  event: CalendarEvent,
  onEdit: (event: CalendarEvent) => void,
  onDelete: (id: number) => void,
  selected: boolean,
  onSelect: (id: number) => void
}) => {
  return (
    <Card className={`mb-4 ${selected ? 'bg-primary-100' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <img 
              src={event.thumbnailUrl} 
              alt={event.channelName} 
              className="w-8 h-8 rounded-full"
            />
            <div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <CardDescription>{event.channelName}</CardDescription>
            </div>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          <CalendarIcon className="inline-block w-4 h-4 mr-1" />
          {format(new Date(event.scheduledDate), 'PPP')}
        </div>
        {event.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{event.description}</p>
        )}
        <div className="text-xs text-gray-500 mt-2">
          {event.videoCount} videos scheduled
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onDelete(event.id)}>
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
        <Button variant="default" size="sm" onClick={() => onEdit(event)}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSelect(event.id)}>
          {selected ? <Check className="w-4 h-4 mr-1"/> : null}
          Select
        </Button>
      </CardFooter>
    </Card>
  );
};

// Event Form Dialog Component
const EventFormDialog = ({ 
  isOpen,
  onClose,
  event,
  channels,
  onSave
}: { 
  isOpen: boolean,
  onClose: () => void,
  event?: CalendarEvent,
  channels: Channel[],
  onSave: (data: any) => void
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    channelId: '',
    scheduledDate: new Date(),
    status: 'scheduled'
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        channelId: event.channelId,
        scheduledDate: new Date(event.scheduledDate),
        status: event.status
      });
    } else {
      setFormData({
        title: '',
        description: '',
        channelId: channels.length > 0 ? channels[0].channelId : '',
        scheduledDate: new Date(),
        status: 'scheduled'
      });
    }
  }, [event, channels, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: event?.id
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {event 
              ? 'Update your content calendar event details' 
              : 'Add a new event to your content calendar'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Event title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Event description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="channelId">Channel</Label>
              <Select 
                value={formData.channelId} 
                onValueChange={handleSelectChange('channelId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map(channel => (
                    <SelectItem key={channel.channelId} value={channel.channelId}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={handleSelectChange('status')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                name="scheduledDate"
                value={format(formData.scheduledDate, 'yyyy-MM-dd')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scheduledDate: e.target.value ? new Date(e.target.value) : new Date() 
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{event ? 'Save Changes' : 'Create Event'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Content Calendar Component
export default function ContentCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const userId = 1; // Replace with actual user ID from auth context

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);

  // Fetch events
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/calendar/events', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/calendar/events?userId=${userId}`);
      const data = await response.json();
      return data.map((event: any) => ({
        ...event,
        scheduledDate: new Date(event.scheduledDate)
      }));
    }
  });

  // Fetch channels for the form
  const { data: channels = [] } = useQuery({
    queryKey: ['/api/channels'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/channels');
      return response.json();
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/calendar/event', {
        userId,
        title: data.title,
        description: data.description,
        channelId: data.channelId,
        scheduledDate: data.scheduledDate,
        status: data.status,
        videoIds: [] // Initialize with empty array
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: "Event Created",
        description: "Your content calendar event has been created successfully.",
        variant: "default",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/calendar/event/${data.id}`, {
        title: data.title,
        description: data.description,
        channelId: data.channelId,
        scheduledDate: data.scheduledDate,
        status: data.status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: "Event Updated",
        description: "Your content calendar event has been updated successfully.",
        variant: "default",
      });
      setIsDialogOpen(false);
      setSelectedEvent(undefined);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/calendar/event/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: "Event Deleted",
        description: "Your content calendar event has been deleted.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveEvent = (data: any) => {
    if (selectedEvent) {
      updateEventMutation.mutate(data);
    } else {
      createEventMutation.mutate(data);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(undefined);
    setIsDialogOpen(true);
  };

  // Filter events by selected date if in calendar view
  const filteredEvents = view === 'calendar' && selectedDate
    ? events.filter((event: CalendarEvent) => 
        format(new Date(event.scheduledDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      )
    : events;

  // Get dates with events for the calendar
  const eventsDateMap = events.reduce((acc: Record<string, number>, event: CalendarEvent) => {
    const dateKey = format(new Date(event.scheduledDate), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});

  const calendarDays = Object.keys(eventsDateMap).map(dateStr => ({
    date: new Date(dateStr),
    badge: eventsDateMap[dateStr]
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Plan and organize your content schedule for maximum impact
          </p>
        </div>
        <div className="flex mt-4 sm:mt-0 space-x-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-r-none"
            >
              List
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              className="rounded-l-none"
            >
              Calendar
            </Button>
          </div>
          <Button onClick={handleCreateEvent}>
            <Plus className="mr-1 h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      {isLoadingEvents ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : (
        <>
          {view === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No events scheduled</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4 max-w-md">
                    Create your first content calendar event to start planning your content strategy
                  </p>
                  <Button onClick={handleCreateEvent}>
                    <Plus className="mr-1 h-4 w-4" /> Create Event
                  </Button>
                </div>
              ) : (
                events.map((event: CalendarEvent) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    selected={selectedEvents.includes(event.id)}
                    onSelect={(id) => {
                      setSelectedEvents(prev => 
                        prev.includes(id) 
                          ? prev.filter(eventId => eventId !== id)
                          : [...prev, id]
                      );
                    }}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    event: calendarDays.map(day => day.date),
                  }}
                  modifiersStyles={{
                    event: {
                      fontWeight: 'bold',
                      backgroundColor: 'var(--color-primary-100)',
                      color: 'var(--color-primary-700)',
                    }
                  }}
                />
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium">Events on this day:</p>
                  {selectedDate && (
                    <p className="text-sm text-gray-500">
                      {format(selectedDate, 'MMMM d, yyyy')}: {filteredEvents.length} events
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium mb-4">
                  {selectedDate ? (
                    `Events for ${format(selectedDate, 'MMMM d, yyyy')}`
                  ) : (
                    'All Events'
                  )}
                </h3>
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
                    <CalendarIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No events on this day</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
                      Select a different day or create a new event
                    </p>
                    <Button onClick={handleCreateEvent}>
                      <Plus className="mr-1 h-4 w-4" /> Create Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event: CalendarEvent) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                        selected={selectedEvents.includes(event.id)}
                        onSelect={(id) => {
                          setSelectedEvents(prev => 
                            prev.includes(id) 
                              ? prev.filter(eventId => eventId !== id)
                              : [...prev, id]
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <EventFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedEvent(undefined);
        }}
        event={selectedEvent}
        channels={channels}
        onSave={handleSaveEvent}
      />
    </div>
  );
}