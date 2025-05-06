//src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  UserCog,
  Phone,
  MapPin,
  Clock,
  Shield,
  RefreshCw,
  CheckSquare,
  Calendar,
  User,
  AlertTriangle,
  Activity,
  PieChart,
  BarChart,
  Wifi,
  WifiOff
} from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { format } from "date-fns";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, subscribeToEvent } = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [stats, setStats] = useState({
    staffCount: 0,
    clientCount: 0,
    activeEmergencies: 0,
    resolvedEmergencies: 0,
    pendingEmergencies: 0,
    totalEmergencies: 0,
    avgResponseTime: 0,
    staffAvailability: 0
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to dashboard updates
    const unsubscribe = subscribeToEvent('dashboard:update', () => {
      console.log('Dashboard update received');
      fetchDashboardData();
    });
    
    return unsubscribe;
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch users (staff and admins)
      const usersResponse = await api.get("/users");
      const users = usersResponse.data.data || [];
      const staffCount = users.filter(user => user.role === "staff").length;
      const staffAvailable = users.filter(user => user.role === "staff" && user.active_status === "available").length;
      const staffAvailability = staffCount > 0 ? (staffAvailable / staffCount) * 100 : 0;

      // Fetch clients
      const clientsResponse = await api.get("/clients/admin");
      const clientCount = (clientsResponse.data.data || []).length;
      
      // Fetch emergencies
      const emergenciesResponse = await api.get("/emergencies");
      const emergencies = emergenciesResponse.data.data || [];
      const totalEmergencies = emergencies.length;
      
      // Calculate emergencies by status
      const activeEmergencies = emergencies.filter(e => e.status === "assigned").length;
      const pendingEmergencies = emergencies.filter(e => e.status === "pending").length;
      const resolvedEmergencies = emergencies.filter(e => e.status === "completed").length;
      
      // Get recent emergencies
      const recent = [...emergencies]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      setRecentEmergencies(recent);
      
      // Calculate average response time (this is a mock calculation)
      // In a real scenario, you'd calculate this from actual assignment times
      const avgResponseTime = 8.3; // minutes
      
      // Set all dashboard data
      setStats({
        staffCount,
        clientCount,
        activeEmergencies,
        resolvedEmergencies,
        pendingEmergencies,
        totalEmergencies,
        avgResponseTime,
        staffAvailability
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
      });
      setIsLoading(false);
    }
  };

  // Data for stat cards
  const statCards = [
    {
      title: "Staff Members",
      value: stats.staffCount,
      icon: UserCog,
      description: `${Math.round(stats.staffAvailability)}% currently available`,
    },
    {
      title: "Clients",
      value: stats.clientCount,
      icon: User,
      description: "Registered clients",
    },
    {
      title: "Active Emergencies",
      value: stats.activeEmergencies,
      icon: AlertTriangle,
      description: "Currently being handled",
    },
    {
      title: "Response Time",
      value: `${stats.avgResponseTime} min`,
      icon: Clock,
      description: "Average response time",
    },
    {
      title: "Total Incidents",
      value: stats.totalEmergencies,
      icon: AlertCircle,
      description: `${stats.resolvedEmergencies} resolved`,
    },
  ];

  // Data for navigation cards
  const navCards = [
    {
      title: "Staff",
      description: "Manage staff members and assignments",
      icon: UserCog,
      link: "/admin/users",
      color: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      title: "Clients",
      description: "View and manage client accounts",
      icon: User,
      link: "/admin/clients",
      color: "bg-green-500/10",
      iconColor: "text-green-500"
    },
    {
      title: "Emergencies",
      description: "View and manage all emergency reports",
      icon: AlertCircle,
      link: "/admin/emergencies",
      color: "bg-red-500/10",
      iconColor: "text-red-500"
    },
    {
      title: "Assignments",
      description: "Manage staff assignments to emergencies",
      icon: CheckSquare,
      link: "/admin/emergencies", 
      color: "bg-amber-500/10",
      iconColor: "text-amber-500"
    }
  ];
  
  // Helper functions for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</span>;
      case "assigned":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Assigned</span>;
      case "completed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{status}</span>;
    }
  };
  
  const getLevelBadge = (level) => {
    switch (level) {
      case "low":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low</span>;
      case "medium":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</span>;
      case "high":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">High</span>;
      case "critical":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Critical</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{level}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center text-xs text-green-600 dark:text-green-400">
              <Wifi className="h-3 w-3 mr-1" />
              Live Updates
            </span>
          ) : (
            <span className="flex items-center text-xs text-red-600 dark:text-red-400">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </span>
          )}
          <Button onClick={fetchDashboardData} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Welcome Card */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-medium">Welcome, {user?.name || 'Administrator'}!</h3>
            <p className="text-muted-foreground">
              Welcome to the Fire Emergency Response Dashboard. Here you can manage staff, clients, and emergency responses.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Staff Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Availability</CardTitle>
            <CardDescription>Percentage of staff available for assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {stats.staffAvailability.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {stats.staffAvailability >= 50 
                  ? "Sufficient Capacity" 
                  : stats.staffAvailability >= 25 
                  ? "Limited Capacity" 
                  : "Critical Capacity"}
              </span>
            </div>
            <Progress value={stats.staffAvailability} className="h-2" />
          </CardContent>
        </Card>

        {/* Emergency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Status</CardTitle>
            <CardDescription>Distribution of emergency cases by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-bold text-yellow-500">{stats.pendingEmergencies}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-500">{stats.activeEmergencies}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-500">{stats.resolvedEmergencies}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Emergencies */}
      <h3 className="text-xl font-semibold mt-6">Recent Emergencies</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-sm">ID</th>
              <th className="text-left p-3 font-medium text-sm">Level</th>
              <th className="text-left p-3 font-medium text-sm">Status</th>
              <th className="text-left p-3 font-medium text-sm">Location</th>
              <th className="text-left p-3 font-medium text-sm">Reported</th>
              <th className="text-right p-3 font-medium text-sm">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recentEmergencies.length > 0 ? (
              recentEmergencies.map((emergency) => (
                <tr key={emergency.id} className="hover:bg-muted/30">
                  <td className="p-3">#{emergency.id}</td>
                  <td className="p-3">{getLevelBadge(emergency.level)}</td>
                  <td className="p-3">{getStatusBadge(emergency.status)}</td>
                  <td className="p-3 max-w-[200px] truncate">{emergency.address}</td>
                  <td className="p-3 text-sm text-muted-foreground">{format(new Date(emergency.created_at), "MMM d, h:mm a")}</td>
                  <td className="p-3 text-right">
                    <Link to={`/admin/emergencies/${emergency.id}`}>
                      <Button size="sm" variant="outline">View Details</Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-muted-foreground">
                  {isLoading ? "Loading recent emergencies..." : "No recent emergencies found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="bg-muted/20 p-3 text-center">
          <Link to="/admin/emergencies">
            <Button variant="link">View All Emergencies</Button>
          </Link>
        </div>
      </div>

      {/* Navigation Cards */}
      <h3 className="text-xl font-semibold mt-6">Quick Access</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {navCards.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className={`${card.color}`}>
              <div className="flex items-center gap-2">
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                <CardTitle>{card.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
            <CardFooter>
              <Link to={card.link} className="w-full">
                <Button className="w-full">Manage {card.title}</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}; 