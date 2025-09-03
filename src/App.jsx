import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Wifi, 
  Clock, 
  Download, 
  Upload, 
  User, 
  CreditCard, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  LogOut
} from "lucide-react";


export default function App() {
  // User session state
  const [sessionData, setSessionData] = useState({
    username: '',
    ip: '',
    mac: '',
    bytesIn: 0,
    bytesOut: 0,
    uptime: '',
    idleTime: '',
    sessionTimeLeft: '',
    planName: '',
    planSpeed: '',
    planExpiry: '',
    isActive: false,
    error: null
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Mock packages for M-Pesa integration
  const packages = [
    { id: 1, name: "1 Hour", price: 50, speed: "5 Mbps", validity: "1 hour" },
    { id: 2, name: "6 Hours", price: 200, speed: "5 Mbps", validity: "6 hours" },
    { id: 3, name: "24 Hours", price: 500, speed: "10 Mbps", validity: "24 hours" },
    { id: 4, name: "7 Days", price: 2500, speed: "15 Mbps", validity: "7 days" },
    { id: 5, name: "30 Days", price: 8000, speed: "20 Mbps", validity: "30 days" }
  ];

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time string
  const formatTime = (timeStr) => {
    if (!timeStr) return '0h 0m';
    const regex = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
    const match = timeStr.match(regex);
    if (!match) return timeStr;
    
    const [, days, hours, minutes, seconds] = match.map(x => parseInt(x) || 0);
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);
    
    return parts.join(' ') || '0h 0m';
  };

  // Parse session time left to seconds
  const parseTimeLeft = (timeStr) => {
    if (!timeStr) return 0;
    const regex = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
    const match = timeStr.match(regex);
    if (!match) return 0;
    
    const [, days, hours, minutes, seconds] = match.map(x => parseInt(x) || 0);
    return (days * 24 * 3600) + (hours * 3600) + (minutes * 60) + seconds;
  };

  // Fetch session data from MikroTik
  const fetchSessionData = async () => {
    try {
      setIsRefreshing(true);
      
      // Get current user session from MikroTik
      const response = await fetch('http://localhost:5000/api/current-session');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSessionData({
        username: data.username || 'Guest',
        ip: data.address || 'N/A',
        mac: data['mac-address'] || 'N/A',
        bytesIn: parseInt(data['bytes-in'] || 0),
        bytesOut: parseInt(data['bytes-out'] || 0),
        uptime: formatTime(data.uptime || ''),
        idleTime: formatTime(data['idle-time'] || ''),
        sessionTimeLeft: data['session-time-left'] || '',
        planName: data.profile || 'Default',
        planSpeed: data['rate-limit'] || 'Unlimited',
        planExpiry: data['limit-uptime'] || '',
        isActive: true,
        error: null
      });
      
    } catch (error) {
      console.error('Failed to fetch session data:', error);
      setSessionData(prev => ({
        ...prev,
        error: error.message,
        isActive: false
      }));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle M-Pesa payment
  const handlePayment = async (packageId) => {
    try {
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) return;
      
      setSelectedPackage(pkg);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
    }
  };

  // Process M-Pesa payment
  const processMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    if (!selectedPackage) {
      alert('No package selected');
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      // Initiate M-Pesa payment
      const response = await fetch('http://localhost:5000/api/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          phoneNumber: phoneNumber,
          packageName: selectedPackage.name,
          username: sessionData.username
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('STK push sent! Please check your phone and enter M-Pesa PIN to complete payment.');
        setShowPaymentModal(false);
        setPhoneNumber('');
        setSelectedPackage(null);
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'http://192.168.88.1/logout';
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = 'http://192.168.88.1/login';
    }
  };

  // Auto-refresh session data
  useEffect(() => {
    fetchSessionData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessionData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for session time left
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    const initialTime = parseTimeLeft(sessionData.sessionTimeLeft);
    setTimeLeft(initialTime);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sessionData.sessionTimeLeft]);

  // Format countdown
  const formatCountdown = (seconds) => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wifi className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">FortuNet</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchSessionData}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <Link 
              to="/admin" 
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Admin Panel
            </Link>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8">
        {/* Error Banner */}
        {sessionData.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{sessionData.error}</p>
            </div>
          </div>
        )}

        {/* Session Status Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Session Status</h2>
            <div className="flex items-center space-x-2">
              {sessionData.isActive ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                sessionData.isActive ? 'text-green-600' : 'text-red-600'
              }`}>
                {sessionData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium text-gray-900">{sessionData.username}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Wifi className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">IP Address</p>
                <p className="font-medium text-gray-900">{sessionData.ip}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="font-medium text-gray-900">{sessionData.uptime}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Idle Time</p>
                <p className="font-medium text-gray-900">{sessionData.idleTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Download className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Downloaded</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatBytes(sessionData.bytesIn)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Upload className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Uploaded</p>
              <p className="text-2xl font-bold text-green-600">
                {formatBytes(sessionData.bytesOut)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Time Remaining</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCountdown(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
              <p className="text-sm opacity-90">Plan Name</p>
              <p className="text-xl font-bold">{sessionData.planName}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
              <p className="text-sm opacity-90">Speed</p>
              <p className="text-xl font-bold">{sessionData.planSpeed}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white">
              <p className="text-sm opacity-90">Expires</p>
              <p className="text-xl font-bold">{sessionData.planExpiry || 'Unlimited'}</p>
            </div>
          </div>
        </div>

        {/* Buy More Time */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Buy More Time</h2>
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">KSh {pkg.price}</p>
                  <p className="text-sm text-gray-500 mb-2">{pkg.speed}</p>
                  <p className="text-xs text-gray-400 mb-4">{pkg.validity}</p>
                  
                  <button
                    onClick={() => handlePayment(pkg.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete Payment</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Package: {selectedPackage.name}</p>
              <p className="text-gray-600 mb-2">Amount: KSh {selectedPackage.price}</p>
              <p className="text-gray-600 mb-4">Speed: {selectedPackage.speed}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 0712345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the phone number registered with M-Pesa
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPhoneNumber('');
                  setSelectedPackage(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processMpesaPayment}
                disabled={isProcessingPayment}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isProcessingPayment ? 'Processing...' : 'Pay with M-Pesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="w-full px-4 py-6 text-center text-gray-500">
          <p>&copy; 2024 FortuNet. Powered by MikroTik Hotspot & M-Pesa.</p>
        </div>
      </footer>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout from FortuNet?</p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}