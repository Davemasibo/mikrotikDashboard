
import React, { useState, useEffect } from "react";
import { 
  Users, Activity, DollarSign, Clock, Wifi, Settings,
  LogOut, RefreshCw, UserCheck, UserX, TrendingUp, Menu,
  Search, Bell, ChevronDown, Shield, Database,
  BarChart3, FileText, CreditCard, Globe, Server,
  HardDrive, Cog, CheckCircle,
  XCircle, Plus, Edit, Trash, Eye, Download, Upload,
  Calendar, Home, UserPlus, Package, Router,
  ChevronRight, Circle, User, CreditCard as CreditCardIcon
} from "lucide-react";

export default function AdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    pppoeThisMonth: 0,
    staticThisMonth: 0,
    hotspotToday: 0,
    activeUsers: 0,
    totalRevenue: 0,
    onlineSessions: 0,
    todayTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientStats, setClientStats] = useState({
    online: 0,
    active: 0,
    expired: 0
  });
  const [revenueStats, setRevenueStats] = useState({
    totalToday: 0,
    totalYesterday: 0,
    totalThisMonth: 0,
    totalThisYear: 0
  });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [latestPayments, setLatestPayments] = useState([]);
  const [systemInfo, setSystemInfo] = useState({});

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch active sessions from MikroTik
      const sessionsResponse = await fetch('http://localhost:5000/api/active-sessions');
      const sessionsData = await sessionsResponse.json();
      setUsers(sessionsData);
      
      // Fetch system info from MikroTik
      const systemResponse = await fetch('http://localhost:5000/api/system-info');
      const systemData = await systemResponse.json();
      setSystemInfo(systemData);
      
      // Fetch hotspot users
      const usersResponse = await fetch('http://localhost:5000/api/hotspot-users');
      const usersData = await usersResponse.json();
      
      // Calculate stats based on real data
      const activeUsers = sessionsData.length;
      const totalUsers = usersData.length;
      const expiredUsers = totalUsers - activeUsers;
      
      // Update stats with real data
      setStats({
        totalThisMonth: calculateMonthlyRevenue(usersData),
        pppoeThisMonth: calculatePPPoERevenue(usersData),
        staticThisMonth: calculateStaticRevenue(usersData),
        hotspotToday: calculateTodayHotspotRevenue(sessionsData),
        activeUsers: activeUsers,
        totalRevenue: calculateTotalRevenue(usersData),
        onlineSessions: activeUsers,
        todayTransactions: calculateTodayTransactions(sessionsData)
      });
      
      // Update client stats
      setClientStats({
        online: activeUsers,
        active: totalUsers,
        expired: expiredUsers
      });
      
      // Update revenue stats
      setRevenueStats({
        totalToday: calculateTodayRevenue(sessionsData),
        totalYesterday: calculateYesterdayRevenue(usersData),
        totalThisMonth: calculateMonthlyRevenue(usersData),
        totalThisYear: calculateYearlyRevenue(usersData)
      });
      
      // Set latest payments (mock data for now - you can implement real payment tracking)
      setLatestPayments(generateMockPayments(sessionsData));
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set empty data on error
      setUsers([]);
      setSystemInfo({});
      setStats({
        totalThisMonth: 0,
        pppoeThisMonth: 0,
        staticThisMonth: 0,
        hotspotToday: 0,
        activeUsers: 0,
        totalRevenue: 0,
        onlineSessions: 0,
        todayTransactions: 0
      });
      setClientStats({
        online: 0,
        active: 0,
        expired: 0
      });
      setRevenueStats({
        totalToday: 0,
        totalYesterday: 0,
        totalThisMonth: 0,
        totalThisYear: 0
      });
      setLatestPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper functions for calculations
  const calculateMonthlyRevenue = (users) => {
    // Simple calculation - replace with your actual revenue logic
    return users.length * 1000;
  };

  const calculatePPPoERevenue = (users) => {
    // Filter PPPoE users and calculate revenue
    const pppoeUsers = users.filter(user => user.profile && user.profile.includes('pppoe'));
    return pppoeUsers.length * 1200;
  };

  const calculateStaticRevenue = (users) => {
    // Filter static IP users and calculate revenue
    const staticUsers = users.filter(user => user.profile && user.profile.includes('static'));
    return staticUsers.length * 1500;
  };

  const calculateTodayHotspotRevenue = (sessions) => {
    // Calculate today's hotspot revenue
    return sessions.length * 200;
  };

  const calculateTotalRevenue = (users) => {
    return users.length * 1000;
  };

  const calculateTodayRevenue = (sessions) => {
    return sessions.length * 200;
  };

  const calculateYesterdayRevenue = (users) => {
    // Mock yesterday's revenue
    return users.length * 800;
  };

  const calculateYearlyRevenue = (users) => {
    return users.length * 1000 * 12;
  };

  const calculateTodayTransactions = (sessions) => {
    return sessions.length;
  };

  const generateMockPayments = (sessions) => {
    // Generate mock payment data based on active sessions
    return sessions.slice(0, 5).map((session, index) => ({
      id: `pay-${index + 1}`,
      transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toLocaleDateString(),
      paymentMethod: index % 2 === 0 ? 'MPesa' : 'Cash',
      serviceType: session.profile || 'Hotspot',
      amount: index % 2 === 0 ? 500 : 1000,
      username: session.username
    }));
  };

  useEffect(() => {
    fetchData();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const handleDisconnectUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/disconnect-user/${userId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
        alert('User disconnected successfully');
      } else {
        alert('Failed to disconnect user');
      }
    } catch (error) {
      console.error('Error disconnecting user:', error);
      alert('Error disconnecting user');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/block-user/${userId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
        alert('User blocked successfully');
      } else {
        alert('Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error blocking user');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg w-64 min-h-screen fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Wifi className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FortuNet</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="space-y-1">
            <SidebarItem 
              icon={Home} 
              label="Dashboard" 
              active={activeSection === "dashboard"} 
              onClick={() => setActiveSection("dashboard")}
            />
            <SidebarItem 
              icon={Users} 
              label="Clients" 
              active={activeSection === "clients"} 
              onClick={() => setActiveSection("clients")}
            />
            <SidebarItem 
              icon={Wifi} 
              label="Internet Plans" 
              active={activeSection === "plans"} 
              onClick={() => setActiveSection("plans")}
            />
            <SidebarItem 
              icon={CreditCard} 
              label="Account & Payments" 
              active={activeSection === "payments"} 
              onClick={() => setActiveSection("payments")}
            />
            <SidebarItem 
              icon={UserPlus} 
              label="User Management" 
              active={activeSection === "users"} 
              onClick={() => setActiveSection("users")}
            />
            <SidebarItem 
              icon={Cog} 
              label="Settings" 
              active={activeSection === "settings"} 
              onClick={() => setActiveSection("settings")}
            />
            <div className="pt-4 mt-4 border-t border-gray-200">
              <SidebarItem 
                icon={LogOut} 
                label="Logout" 
                onClick={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-0' : 'ml-0'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search here..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 md:p-6">
          {/* Router Info Banner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Router className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{systemInfo.identity || 'MikroTik Router'}</h3>
                  <p className="text-sm text-gray-500">RouterOS {systemInfo.version || 'Unknown'} • Uptime: {systemInfo.uptime || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">CPU: {systemInfo.cpu_load || 'N/A'}% • Memory: {systemInfo.free_memory || 'N/A'}/{systemInfo.total_memory || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <StatsCard 
              value={`KES ${stats.totalThisMonth.toFixed(2)}`} 
              label="TOTAL THIS MONTH" 
              icon={TrendingUp}
              trend="up"
              trendValue=""
              color="blue"
            />
            
            <StatsCard 
              value={`KES ${stats.pppoeThisMonth.toFixed(2)}`} 
              label="PPPoE THIS MONTH" 
              icon={DollarSign}
              trend="neutral"
              color="green"
            />
            
            <StatsCard 
              value={`KES ${stats.staticThisMonth.toFixed(2)}`} 
              label="STATIC THIS MONTH" 
              icon={DollarSign}
              trend="neutral"
              color="purple"
            />
            
            <StatsCard 
              value={`KES ${stats.hotspotToday.toFixed(2)}`} 
              label="HOTSPOT TODAY" 
              icon={DollarSign}
              trend="up"
              trendValue=""
              color="orange"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Client Statistics */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Client Statistics</h2>
                  <p className="text-sm text-gray-500 mt-1">Your clients analytics</p>
                </div>
                <div className="p-4 md:p-6">
                  {/* Client Status Counters */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCounter value={clientStats.online} label="ONLINE" color="blue" />
                    <StatCounter value={clientStats.active} label="ACTIVE" color="green" />
                    <StatCounter value={clientStats.expired} label="EXPIRED" color="red" />
                  </div>
                  
                  {/* Chart Placeholder */}
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Client Activity Chart</p>
                      <p className="text-sm text-gray-400">Weekly hotspot, PPPoE, and static usage</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Revenue & Payments */}
            <div className="space-y-6">
              {/* Revenue Statistics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Statistics</h3>
                </div>
                <div className="p-4 md:p-6">
                  <div className="space-y-3">
                    <RevenueStatItem label="Total Today" value={revenueStats.totalToday} />
                    <RevenueStatItem label="Total Yesterday" value={revenueStats.totalYesterday} />
                    <RevenueStatItem label="Total This Month" value={revenueStats.totalThisMonth} />
                    <RevenueStatItem label="Total This Year" value={revenueStats.totalThisYear} />
                  </div>
                </div>
              </div>

              {/* Latest Payments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Latest Payments</h3>
                </div>
                <div className="p-4 md:p-6">
                  <div className="space-y-3">
                    {latestPayments.length > 0 ? (
                      latestPayments.map((payment) => (
                        <PaymentItem key={payment.id} payment={payment} />
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No recent payments</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Users Table */}
          <div className="mt-6 md:mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Active Users</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage currently connected users</p>
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAC Address</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Usage</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.address}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.mac_address}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(user.uptime)}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Download className="h-3 w-3 mr-1" />
                              {formatBytes(user.bytes_in)}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Upload className="h-3 w-3 mr-1" />
                              {formatBytes(user.bytes_out)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {user.profile}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDisconnectUser(user.id)}
                              className="text-blue-600 hover:text-blue-900 text-xs px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                            >
                              Disconnect
                            </button>
                            <button
                              onClick={() => handleBlockUser(user.address)}
                              className="text-red-600 hover:text-red-900 text-xs px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                            >
                              Block
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && (
                  <div className="text-center py-12">
                    <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Transactions */}
          <div className="mt-6 md:mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Monthly Transactions</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Monthly Transaction Chart</p>
                    <p className="text-sm text-gray-400">Transaction volume and revenue over time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper Components
function SidebarItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <div 
      className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span className="ml-3 flex-1">{label}</span>
    </div>
  );
}

function StatsCard({ value, label, icon: Icon, trend, trendValue, color }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100'
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-xl md:text-2xl font-semibold ${colorClasses[color].split(' ')[0]}`}>{value}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{label}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color].split(' ')[1]}`}>
          <Icon className={`h-5 w-5 ${colorClasses[color].split(' ')[0]}`} />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {trend === 'up' ? (
          <>
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">{trendValue}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">No change</span>
        )}
      </div>
    </div>
  );
}

function StatCounter({ value, label, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600'
  };
  
  return (
    <div className={`text-center p-4 rounded-lg ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium uppercase">{label}</div>
    </div>
  );
}

function RevenueStatItem({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">KES {value.toFixed(2)}</span>
    </div>
  );
}

function PaymentItem({ payment }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
        <CreditCardIcon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{payment.username}</p>
        <p className="text-xs text-gray-500">{payment.transactionId}</p>
        <p className="text-xs text-gray-500">{payment.paymentMethod} • {payment.serviceType}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">KES {payment.amount.toFixed(2)}</p>
        <p className="text-xs text-gray-500">{payment.date}</p>
      </div>
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const bytesNum = parseInt(bytes);
  if (bytesNum === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytesNum) / Math.log(k));
  return parseFloat((bytesNum / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format time
function formatTime(timeStr) {
  if (!timeStr) return '0h 0m';
  
  // Handle MikroTik time format (e.g., "1d2h3m4s")
  const regex = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const match = timeStr.match(regex);
  if (!match) return timeStr;
  
  const [, days, hours, minutes, seconds] = match.map(x => parseInt(x) || 0);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && !days && !hours) parts.push(`${seconds}s`);
  
  return parts.join(' ') || '0h 0m';
}

export { formatBytes, formatTime };