import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  Globe,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  RefreshCw,
  Map,
  BarChart2,
  TrendingUp,
  Tv,
} from 'lucide-react';

// Type definitions
interface GeoViewMetrics {
  country: string;
  region?: string;
  city?: string;
  count: number;
  percentage: number;
}

interface DeviceViewMetrics {
  deviceType: string;
  browser?: string;
  count: number;
  percentage: number;
}

// Colors for charts
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#8884D8', '#82CA9D', '#FF6B6B', '#6A6AFF',
  '#A0522D', '#C71585', '#556B2F', '#FF69B4',
  '#1E90FF', '#32CD32', '#FF7F50', '#9370DB'
];

// Device icon component
const DeviceIcon = ({ type }: { type: string }) => {
  const iconClass = "h-5 w-5";
  const lowerType = type.toLowerCase();

  if (lowerType.includes('mobile') || lowerType.includes('phone')) {
    return <Smartphone className={iconClass} />;
  } else if (lowerType.includes('tablet')) {
    return <Tablet className={iconClass} />;
  } else if (lowerType.includes('tv') || lowerType.includes('console')) {
    return <Tv className={iconClass} />;
  } else if (lowerType.includes('laptop')) {
    return <Laptop className={iconClass} />;
  } else {
    return <Monitor className={iconClass} />;
  }
};

// Geographic Overview Component
const GeoOverview = ({ geoData }: { geoData: GeoViewMetrics[] }) => {
  // Prepare data for pie chart
  const pieChartData = geoData.slice(0, 10).map(item => ({
    name: item.country,
    value: item.count
  }));

  // Prepare data for bar chart
  const barChartData = geoData.slice(0, 8);

  // Total views for top card
  const totalViews = geoData.reduce((sum, item) => sum + item.count, 0);
  const topCountry = geoData.length > 0 ? geoData[0] : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Geographic Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Globe className="h-8 w-8 mr-2 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                <p className="text-xs text-gray-500">From {geoData.length} locations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Top Country</CardTitle>
          </CardHeader>
          <CardContent>
            {topCountry ? (
              <div className="flex items-center">
                <Map className="h-8 w-8 mr-2 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{topCountry.country}</div>
                  <p className="text-xs text-gray-500">
                    {topCountry.count.toLocaleString()} views ({topCountry.percentage}%)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Global Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 mr-2 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{geoData.length}</div>
                <p className="text-xs text-gray-500">Countries reached</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Views by Country</CardTitle>
            <CardDescription>Top 8 countries by view count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={barChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="country" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name) => {
                    return name === 'percentage' ? `${value}%` : value;
                  }} />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="count" 
                    name="View Count" 
                    fill="#8884d8" 
                    barSize={30} 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="percentage" 
                    name="Percentage" 
                    stroke="#ff7300" 
                    strokeWidth={2} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution by Country</CardTitle>
            <CardDescription>Percentage of views by country</CardDescription>
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
                  <Tooltip formatter={(value) => [value, 'Views']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full country table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Geographic Breakdown</CardTitle>
          <CardDescription>All countries where your videos have been viewed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Country</th>
                    <th className="px-4 py-3 text-right font-medium">Views</th>
                    <th className="px-4 py-3 text-right font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {geoData.map((item, index) => (
                    <tr 
                      key={item.country} 
                      className={(index % 2 === 0) ? '' : 'bg-gray-50 dark:bg-gray-900/50'}
                    >
                      <td className="px-4 py-2 font-medium">{item.country}</td>
                      <td className="px-4 py-2 text-right">{item.count.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Device Overview Component
const DeviceOverview = ({ deviceData }: { deviceData: DeviceViewMetrics[] }) => {
  // Group data by device type
  const deviceTypes = deviceData.reduce((acc, item) => {
    const existing = acc.find(d => d.deviceType === item.deviceType);
    if (existing) {
      existing.count += item.count;
    } else {
      acc.push({ deviceType: item.deviceType, count: item.count });
    }
    return acc;
  }, [] as { deviceType: string, count: number }[]);

  // Sort by count descending
  deviceTypes.sort((a, b) => b.count - a.count);

  // Calculate percentages
  const totalViews = deviceTypes.reduce((sum, item) => sum + item.count, 0);
  deviceTypes.forEach(item => {
    (item as any).percentage = Math.round((item.count / totalViews) * 100);
  });

  // Group data by browser
  const browserData = deviceData.reduce((acc, item) => {
    if (!item.browser) return acc;
    const existing = acc.find(d => d.browser === item.browser);
    if (existing) {
      existing.count += item.count;
    } else {
      acc.push({ browser: item.browser, count: item.count });
    }
    return acc;
  }, [] as { browser: string, count: number }[]);

  // Sort by count descending and calculate percentages
  browserData.sort((a, b) => b.count - a.count);
  browserData.forEach(item => {
    (item as any).percentage = Math.round((item.count / totalViews) * 100);
  });

  // For area chart - trend data (using the same data but formatted differently)
  const trendData = deviceTypes.map((item, index) => ({
    name: item.deviceType,
    value: item.count,
    trend: (index * 5) + 10 // Simulated trend data
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Device Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Monitor className="h-8 w-8 mr-2 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Across {deviceTypes.length} device types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Top Device Type</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceTypes.length > 0 ? (
              <div className="flex items-center">
                <DeviceIcon type={deviceTypes[0].deviceType} />
                <div className="ml-2">
                  <div className="text-2xl font-bold">{deviceTypes[0].deviceType}</div>
                  <p className="text-xs text-gray-500">
                    {deviceTypes[0].count.toLocaleString()} views ({(deviceTypes[0] as any).percentage}%)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Top Browser</CardTitle>
          </CardHeader>
          <CardContent>
            {browserData.length > 0 ? (
              <div className="flex items-center">
                <BarChart2 className="h-8 w-8 mr-2 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{browserData[0].browser}</div>
                  <p className="text-xs text-gray-500">
                    {browserData[0].count.toLocaleString()} views ({(browserData[0] as any).percentage}%)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Views by Device Type</CardTitle>
            <CardDescription>Distribution across different devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="deviceType"
                    label={({ deviceType, percentage }) => `${deviceType}: ${percentage}%`}
                  >
                    {deviceTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Views']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Distribution</CardTitle>
            <CardDescription>Views by browser type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={browserData.slice(0, 5)}
                  margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="browser" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Views']} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Views" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device details table */}
      <Card>
        <CardHeader>
          <CardTitle>Device Analytics</CardTitle>
          <CardDescription>Detailed breakdown by device and browser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Device Type</th>
                    <th className="px-4 py-3 text-left font-medium">Browser</th>
                    <th className="px-4 py-3 text-right font-medium">Views</th>
                    <th className="px-4 py-3 text-right font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceData.map((item, index) => (
                    <tr 
                      key={`${item.deviceType}-${item.browser || 'unknown'}-${index}`}
                      className={(index % 2 === 0) ? '' : 'bg-gray-50 dark:bg-gray-900/50'}
                    >
                      <td className="px-4 py-2 font-medium flex items-center">
                        <DeviceIcon type={item.deviceType} />
                        <span className="ml-2">{item.deviceType}</span>
                      </td>
                      <td className="px-4 py-2">{item.browser || 'Unknown'}</td>
                      <td className="px-4 py-2 text-right">{item.count.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Component
export default function GeoAnalytics() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const userId = 1; // Replace with actual user ID from auth context
  const [activeTab, setActiveTab] = useState('geography');

  // Fetch geographic data
  const { data: geoData = [], isLoading: isLoadingGeo } = useQuery({
    queryKey: ['/api/geo-metrics', userId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/geo-metrics?userId=${userId}`);
        return response.json();
      } catch (error) {
        console.error('Error fetching geographic metrics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load geographic metrics',
          variant: 'destructive',
        });
        return [];
      }
    }
  });

  // Fetch device data
  const { data: deviceData = [], isLoading: isLoadingDevice } = useQuery({
    queryKey: ['/api/device-metrics', userId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/device-metrics?userId=${userId}`);
        return response.json();
      } catch (error) {
        console.error('Error fetching device metrics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load device metrics',
          variant: 'destructive',
        });
        return [];
      }
    }
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">View Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Geographic and device analytics for your video views
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="geography">
            <Globe className="mr-2 h-4 w-4" />
            Geographic
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Laptop className="mr-2 h-4 w-4" />
            Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geography" className="mt-6">
          {isLoadingGeo ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : geoData.length > 0 ? (
            <GeoOverview geoData={geoData} />
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Globe className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No geographic data yet</h3>
              <p className="mt-1 text-gray-500">
                Geographic analytics will appear here as you start boosting channels
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          {isLoadingDevice ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : deviceData.length > 0 ? (
            <DeviceOverview deviceData={deviceData} />
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No device data yet</h3>
              <p className="mt-1 text-gray-500">
                Device analytics will appear here as you start boosting channels
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}