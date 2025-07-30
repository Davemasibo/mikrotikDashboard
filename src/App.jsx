import { useEffect, useState, useRef } from "react";
import {
  Bell, User, ChevronDown, LogOut, Settings,
  Wifi, BarChart2, HelpCircle, Smartphone, Home,
  Moon, Sun, Mail, Menu, X, Twitter
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const profileMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    const number = prompt(`Enter your M-Pesa number to buy:\n\n${plan.name} for ${plan.price}`, mpesaNumber);
    if (!number || number.length < 10) return alert("Invalid number.");

    setMpesaNumber(number);
    alert(`Sending STK push to ${number} for ${plan.name} - ${plan.price}`);
  };

  const toggleMainMenu = () => {
    setShowMainMenu(!showMainMenu);
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
      {/* Top Navigation */}
      <header className="topbar">
        <h1 className="logo">📶 WiFiPay</h1>
        
        <div className="right-menu">
          <div ref={notificationsMenuRef}>
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
                <button 
                  className="close-dropdown-btn" 
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
          <div 
            className="profile" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            ref={profileMenuRef}
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
              <button 
                className="close-dropdown-btn" 
                onClick={() => setShowProfileMenu(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <X size={24} /> : <Menu size={24} />}
        <span>Menu</span>
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${showSidebar ? 'show' : ''}`}>
        <nav className="nav-links">
          <NavLink 
            icon={<Home size={18} />} 
            text="Dashboard Home" 
            active={activeSection === 'dashboard'}
            onClick={() => {
              setActiveSection('dashboard');
              setShowSidebar(false);
            }}
          />
          <NavLink 
            icon={<BarChart2 size={18} />} 
            text="Data Usage" 
            active={activeSection === 'usage'}
            onClick={() => {
              setActiveSection('usage');
              setShowSidebar(false);
            }}
          />
          
          {/* Plans Link */}
          <NavLink 
            icon={<Wifi size={18} />} 
            text="Plans" 
            active={activeSection === 'plans'}
            onClick={() => {
              setActiveSection('plans');
              setShowMainMenu(true);
              setShowSidebar(false);
            }}
          />
          
          {/* Devices Link */}
          <NavLink 
            icon={<Smartphone size={18} />} 
            text="Devices" 
            active={activeSection === 'devices'}
            onClick={() => {
              setActiveSection('devices');
              setShowMainMenu(true);
              setShowSidebar(false);
            }}
          />
          
          <NavLink 
            icon={<HelpCircle size={18} />} 
            text="Support" 
            active={activeSection === 'support'}
            onClick={() => {
              setActiveSection('support');
              setShowSidebar(false);
            }}
          />
        </nav>
        <div className="sidebar-footer">
          <div className="balance">Balance: 6.8 GB</div>
          <button className="logout-btn" onClick={() => window.location.href = '/logout'}>
            <LogOut size={16} className="mr-1" /> Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        {/* Main Menu Dropdown */}
        {showMainMenu && (
          <div className="main-menu-dropdown">
            <div className="main-menu-content">
              {activeSection === 'plans' && (
                <>
                  <h3>📡 Select a Plan</h3>
                  <PlanCategory 
                    title="📅 Monthly Plans" 
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
                </>
              )}
              {activeSection === 'devices' && (
                <>
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
                </>
              )}
              <button 
                className="close-main-menu-btn" 
                onClick={() => setShowMainMenu(false)}
              >
                Close Menu
              </button>
            </div>
          </div>
        )}

        <main>
          {activeSection === 'dashboard' && (
            <>
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
            </>
          )}

          {activeSection === 'usage' && (
            <section className="section">
              <h3>📊 Detailed Usage Statistics</h3>
              <div className="data-row">
                <span>Data Used Today:</span>
                <span>1.2 GB</span>
              </div>
              <div className="data-row">
                <span>Data Remaining:</span>
                <span>8.8 GB</span>
              </div>
              <div className="data-row">
                <span>Daily Average:</span>
                <span>0.4 GB</span>
              </div>
              <div className="data-row">
                <span>Peak Usage Time:</span>
                <span>8:00 PM - 10:00 PM</span>
              </div>
            </section>
          )}

          {activeSection === 'support' && (
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
                  <Twitter size={24} />
                  <span>Twitter</span>
                </a>
              </div>
            </section>
          )}
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

function NavLink({ icon, text, active, onClick }) {
  return (
    <button 
      className={`nav-link ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}