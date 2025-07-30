import { useEffect, useState } from "react";
import {
  Bell, User, ChevronDown, LogOut, Globe, Settings,
  Wifi, BarChart2, CreditCard, HelpCircle, Smartphone, Home,
  Moon, Sun, Mail, Phone
} from "lucide-react";
import "./App.css";

export default function App() {
  const [userData, setUserData] = useState({
    username: '',
    ip: '',
    mac: '',
    uptime: '',
    sessionTimeLeft: '',
    bytesOut: '',
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const getQueryParam = (param) => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param) || '';
    };

    const fields = ['username', 'ip', 'mac', 'uptime', 'sessionTimeLeft', 'bytesOut'];
    const data = {};
    fields.forEach(field => {
      data[field] = getQueryParam(field);
    });
    setUserData(data);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    const number = prompt(`Enter your M-Pesa number to buy:\n\n${plan.name} for ${plan.price}`, mpesaNumber);
    if (!number || number.length < 10) return alert("Invalid number.");

    setMpesaNumber(number);
    alert(`Sending STK push to ${number} for ${plan.name} - ${plan.price}`);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h2>Loading WiFi Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1 className="logo">📶 WiFiPay</h1>
        
        {/* Dark/Light Mode Toggle at the top */}
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="theme-toggle"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? ' Light Mode' : ' Dark Mode'}
        </button>

        <nav className="nav-links">
          <NavLink icon={<Home size={18} />} text="Dashboard Home" href="#" />
          <NavLink icon={<BarChart2 size={18} />} text="Data Usage" href="#usage" />
          <NavLink icon={<Wifi size={18} />} text="Plans" href="#plans" />
          <NavLink icon={<Smartphone size={18} />} text="Devices" href="#devices" />
          <NavLink icon={<HelpCircle size={18} />} text="Support" href="#support" />
        </nav>
        <div className="sidebar-footer">
          <div className="balance">Balance: 6.8 GB</div>
          <a href="/logout" className="logout-btn">
            <LogOut size={16} className="mr-1" /> Logout
          </a>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="right-menu">
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="icon-btn"
            >
              <Bell size={20} />
              <span className="badge">3</span>
            </button>
            {showNotifications && (
              <div className="dropdown">
                <p>⚠️ Plan expires in 3 days</p>
                <p>📶 80% data used</p>
                <p>🔧 Maintenance tonight</p>
              </div>
            )}
            <Globe size={20} />
            <div 
              className="profile" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${userData.username || 'Guest'}&background=0D8ABC&color=fff`}
                alt="User Avatar"
                className="avatar"
              />
              <span>{userData.username || 'Guest'}</span>
              <ChevronDown size={16} />
            </div>
            {showProfileMenu && (
              <div className="dropdown profile-menu">
                <a href="#profile">Profile Settings</a>
                <a href="#changepw">Change Password</a>
                <a href="#payments">Payment History</a>
                <a href="/logout" className="danger">Log Out</a>
              </div>
            )}
          </div>
        </header>

        <main>
          <section className="section welcome-card">
            <h2>Welcome back, {userData.username || 'Guest'}!</h2>
            <p>Active Plan: 10GB Monthly (Expires: Aug 15, 2025)</p>
          </section>

          <section id="usage" className="section">
            <h3>📊 Usage Summary</h3>
            <div className="grid-2">
              <DataRow label="MAC Address" value={userData.mac} />
              <DataRow label="Uptime" value={userData.uptime} />
              <DataRow label="Time Left" value={userData.sessionTimeLeft} />
              <DataRow label="Data Used (Bytes Out)" value={userData.bytesOut} />
            </div>
          </section>

          <section id="plans" className="section">
            <h3>📦 Select a Plan</h3>
            <PlanCategory 
              title="📦 Monthly Plans" 
              plans={[
                { name: "1 Mbps", price: "Ksh 300" },
                { name: "2 Mbps", price: "Ksh 500" },
                { name: "5 Mbps", price: "Ksh 900" },
                { name: "10 Mbps", price: "Ksh 1500" },
                { name: "20 Mbps", price: "Ksh 2500" },
              ]} 
              onSelect={handlePlanSelection} 
            />
            <PlanCategory 
              title="🗓️ 7-Day Bundles" 
              plans={[
                { name: "10 GB", price: "Ksh 150" },
                { name: "20 GB", price: "Ksh 250" },
                { name: "40 GB", price: "Ksh 450" },
              ]} 
              onSelect={handlePlanSelection} 
            />
            <PlanCategory 
              title="⏱️ Daily / Hourly Access" 
              plans={[
                { name: "24 Hours Unlimited", price: "Ksh 100" },
                { name: "12 Hours Unlimited", price: "Ksh 50" },
                { name: "6 Hours Unlimited", price: "Ksh 30" },
                { name: "1 Hour Unlimited", price: "Ksh 20" },
              ]} 
              onSelect={handlePlanSelection} 
            />
          </section>

          <section id="devices" className="section">
            <h3>📱 Connected Devices</h3>
            <div className="devices-grid">
              <div className="device-card">
                <div className="device-info">
                  <div className="device-icon">📱</div>
                  <div>
                    <p className="device-name">iPhone 13 Pro</p>
                    <p className="device-mac">MAC: 00:1A:2B:3C:4D:5E</p>
                    <p className="device-ip">IP: 192.168.1.5</p>
                  </div>
                </div>
                <div className="device-status">
                  <span className="active">Active</span>
                  <span className="connection-time">Connected: 2h 15m</span>
                </div>
              </div>
              <div className="device-card">
                <div className="device-info">
                  <div className="device-icon">💻</div>
                  <div>
                    <p className="device-name">MacBook Pro</p>
                    <p className="device-mac">MAC: 00:1A:2B:3C:4D:5F</p>
                    <p className="device-ip">IP: 192.168.1.6</p>
                  </div>
                </div>
                <div className="device-status">
                  <span className="active">Active</span>
                  <span className="connection-time">Connected: 1h 30m</span>
                </div>
              </div>
            </div>
          </section>

          <section id="support" className="section">
            <h3>📞 Contact Support</h3>
            <div className="contact-cards">
              <a href="mailto:support@d3athshottwifi.com" className="contact-card">
                <Mail size={24} />
                <span>Email Support</span>
              </a>
              <a href="https://wa.me/254729909387" target="_blank" rel="noopener noreferrer" className="contact-card">
                <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" alt="WhatsApp" width={24} />
                <span>WhatsApp</span>
              </a>
              <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer" className="contact-card">
                <img src="https://cdn-icons-png.flaticon.com/512/3670/3670157.png" alt="X (Twitter)" width={24} />
                <span>X (Twitter)</span>
              </a>
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>© {new Date().getFullYear()} EcolandAttic Wireless. Powered by MikroTik RouterOS</p>
        </footer>
      </div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="data-row">
      <span>{label}:</span>
      <span>{value || '—'}</span>
    </div>
  );
}

function PlanCategory({ title, plans, onSelect }) {
  return (
    <div className="plan-category">
      <h4>{title}</h4>
      <div className="plan-grid">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`plan-card ${i === 0 ? 'featured' : ''}`}
            onClick={() => onSelect(plan)}
          >
            <p className="plan-name">{plan.name}</p>
            <p className="plan-price">{plan.price}</p>
            <button className="btn-primary">Buy Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavLink({ icon, text, href }) {
  return (
    <a href={href} className="nav-link">
      {icon}
      <span>{text}</span>
    </a>
  );
}