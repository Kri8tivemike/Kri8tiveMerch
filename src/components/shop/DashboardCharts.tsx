import { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';

// Type for sales data
interface SalesData {
  name: string;
  sales: number;
}

// Type for order status data
interface OrderStatusData {
  name: string;
  value: number;
}

// Type for product sales data
interface ProductSalesData {
  name: string;
  sales: number;
}

// Type for activity data
interface ActivityData {
  time: string;
  event: string;
  type: 'order' | 'customer' | 'product' | 'shipping';
}

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardCharts() {
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [topProductsData, setTopProductsData] = useState<ProductSalesData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // In a real app, these would be API calls to your backend
      // Here we're simulating data loading with a timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate sales data based on time range
      const sales = generateSalesData(timeRange);
      setSalesData(sales);
      
      // For demo purposes, we're using static data for these
      // In a real app, you would fetch this from your database
      setOrderStatusData([
        { name: 'Pending', value: 20 },
        { name: 'Processing', value: 35 },
        { name: 'Shipped', value: 25 },
        { name: 'Delivered', value: 45 },
        { name: 'Cancelled', value: 10 }
      ]);
      
      setTopProductsData([
        { name: 'Classic White Tee', sales: 120 },
        { name: 'Premium Black Tee', sales: 98 },
        { name: 'Essential Gray Tee', sales: 86 },
        { name: 'Organic Cotton Tee', sales: 72 },
        { name: 'Vintage Logo Tee', sales: 63 }
      ]);
      
      setRecentActivity([
        { time: '2 hours ago', event: 'New order #1234 received', type: 'order' },
        { time: '4 hours ago', event: 'Order #1232 shipped', type: 'shipping' },
        { time: '5 hours ago', event: 'New customer registration', type: 'customer' },
        { time: '1 day ago', event: 'Product "Classic White Tee" restocked', type: 'product' },
        { time: '1 day ago', event: 'Order #1231 delivered', type: 'shipping' }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate realistic sales data
  const generateSalesData = (range: 'week' | 'month' | 'year'): SalesData[] => {
    let data: SalesData[] = [];
    
    if (range === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = days.map(day => ({
        name: day,
        sales: Math.floor(Math.random() * 5000) + 1000
      }));
    } else if (range === 'month') {
      // Generate last 30 days data grouped by week
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = weeks.map(week => ({
        name: week,
        sales: Math.floor(Math.random() * 15000) + 5000
      }));
    } else {
      // Generate yearly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = months.map(month => ({
        name: month,
        sales: Math.floor(Math.random() * 50000) + 10000
      }));
    }
    
    return data;
  };

  // Activity item color based on type
  const getActivityColor = (type: ActivityData['type']) => {
    switch (type) {
      case 'order': return 'bg-blue-500';
      case 'customer': return 'bg-green-500';
      case 'product': return 'bg-yellow-500';
      case 'shipping': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Time Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Sales Analytics</h3>
          <div className="flex space-x-2">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as 'week' | 'month' | 'year')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === range
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `₦${value.toLocaleString()}`} 
                />
                <Tooltip 
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Sales']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#000000" 
                  fill="rgba(0, 0, 0, 0.1)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Orders']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProductsData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value) => [`${value}`, 'Units Sold']} />
                <Bar dataKey="sales" fill="#000000" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4 overflow-auto max-h-[300px] pr-2">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start hover:bg-gray-50 p-2 rounded-md transition-colors">
                <div className={`flex-shrink-0 w-3 h-3 mt-1.5 rounded-full ${getActivityColor(activity.type)}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{activity.event}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}