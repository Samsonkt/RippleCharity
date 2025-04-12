import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  ArrowRight, 
  TrendingUp, 
  BarChart2, 
  RefreshCw,
  Eye, 
  Users, 
  Award, 
  Filter 
} from 'lucide-react';

// Type definitions
interface ChannelImpactScore {
  channelId: string;
  name: string;
  thumbnailUrl: string;
  impactScore: number;
  viewsPotential: number;
  viewsGenerated: number;
  category: string;
  description?: string;
  bannerUrl?: string;
}

// Colors for charts
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FF6B6B', '#6A6AFF'
];

// Impact Score Card Component
const ImpactScoreCard = ({ channel }: { channel: ChannelImpactScore }) => {
  const progress = Math.min(100, Math.round((channel.viewsGenerated / channel.viewsPotential) * 100));
  
  return (
    <Card className="overflow-hidden">
      <div 
        className="h-32 bg-cover bg-center" 
        style={{ 
          backgroundImage: channel.bannerUrl 
            ? `url(${channel.bannerUrl})` 
            : 'linear-gradient(to right, #4F46E5, #10B981)' 
        }}
      />
      <CardHeader className="relative pb-2">
        <div className="absolute -top-12 left-4 h-16 w-16 rounded-full border-4 border-background overflow-hidden bg-white">
          <img 
            src={channel.thumbnailUrl} 
            alt={channel.name} 
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex justify-between items-start pt-3">
          <div>
            <CardTitle className="text-xl">{channel.name}</CardTitle>
            <CardDescription>{channel.category}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary font-bold">
            Score: {channel.impactScore.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {channel.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
            {channel.description}
          </p>
        )}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{channel.viewsGenerated} views generated</span>
            <span>{channel.viewsPotential} potential</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/boosting/${channel.channelId}`}>
            Start Boosting <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Key Metrics Component
const KeyMetrics = ({ channels }: { channels: ChannelImpactScore[] }) => {
  // Calculate total metrics
  const totalPotential = channels.reduce((sum, channel) => sum + channel.viewsPotential, 0);
  const totalGenerated = channels.reduce((sum, channel) => sum + channel.viewsGenerated, 0);
  const totalImpactScore = channels.reduce((sum, channel) => sum + channel.impactScore, 0);

  const metrics = [
    {
      title: 'Total View Potential',
      value: totalPotential.toLocaleString(),
      icon: <Eye className="h-5 w-5 text-blue-500" />,
      description: 'Estimated views that could be generated'
    },
    {
      title: 'Views Generated',
      value: totalGenerated.toLocaleString(),
      icon: <Users className="h-5 w-5 text-green-500" />,
      description: `${Math.round((totalGenerated / totalPotential) * 100)}% of potential reached`
    },
    {
      title: 'Average Impact Score',
      value: (totalImpactScore / channels.length).toFixed(1),
      icon: <Award className="h-5 w-5 text-yellow-500" />,
      description: 'Average impact score across all channels'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-500">{metric.title}</CardTitle>
              {metric.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Analytics Charts Component
const AnalyticsCharts = ({ channels }: { channels: ChannelImpactScore[] }) => {
  // Prepare data for bar chart
  const barChartData = channels.slice(0, 5).map(channel => ({
    name: channel.name,
    potential: channel.viewsPotential,
    generated: channel.viewsGenerated,
  }));

  // Prepare data for pie chart
  const pieChartData = channels.reduce((acc, channel) => {
    const existingCategory = acc.find(item => item.name === channel.category);
    if (existingCategory) {
      existingCategory.value += channel.viewsPotential;
    } else {
      acc.push({
        name: channel.category,
        value: channel.viewsPotential
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">View Potential vs. Generated</CardTitle>
          <CardDescription>Top 5 channels by impact score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  tick={{ fontSize: 12 }}
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="potential" name="View Potential" fill="#8884d8" />
                <Bar dataKey="generated" name="Views Generated" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">View Potential by Category</CardTitle>
          <CardDescription>Distribution of views across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Potential Views']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Component
export default function Recommendations() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const userId = 1; // Replace with actual user ID from auth context
  const [activeTab, setActiveTab] = useState('recommendations');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch channel recommendations
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['/api/recommendations', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/recommendations?userId=${userId}`);
      return response.json();
    }
  });

  // Get unique categories for filtering
  const categories = Array.from(
    new Set(recommendations.map((channel: ChannelImpactScore) => channel.category))
  );

  // Filter channels by category if a filter is applied
  const filteredChannels = categoryFilter
    ? recommendations.filter((channel: ChannelImpactScore) => channel.category === categoryFilter)
    : recommendations;

  // Sort channels by impact score (descending)
  const sortedChannels = [...filteredChannels].sort(
    (a: ChannelImpactScore, b: ChannelImpactScore) => b.impactScore - a.impactScore
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channel Recommendations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Discover channels with the highest potential impact
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="recommendations">
            <TrendingUp className="mr-2 h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <>
              {sortedChannels.length > 0 ? (
                <>
                  {/* Category filter */}
                  {categories.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge 
                        variant={categoryFilter === null ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setCategoryFilter(null)}
                      >
                        All Categories
                      </Badge>
                      {categories.map(category => (
                        <Badge 
                          key={category}
                          variant={categoryFilter === category ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setCategoryFilter(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Channel cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedChannels.map((channel: ChannelImpactScore) => (
                      <ImpactScoreCard key={channel.channelId} channel={channel} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <Award className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No recommendations yet</h3>
                  <p className="mt-1 text-gray-500">
                    Watch some videos to generate personalized channel recommendations
                  </p>
                  <Button className="mt-6" asChild>
                    <Link to="/channels">
                      Browse Channels
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <>
              {recommendations.length > 0 ? (
                <>
                  <KeyMetrics channels={recommendations} />
                  <AnalyticsCharts channels={recommendations} />
                </>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No analytics available</h3>
                  <p className="mt-1 text-gray-500">
                    Watch videos to generate analytics data
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}