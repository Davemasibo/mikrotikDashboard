import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import './app.css'; // ✅ Restored full styling with app.css!
import InternetPlans from "./pages/InternetPlans";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/internet-plans" element={<InternetPlans />} />
        {/* Hotspot users (default landing page) */}
      <Route path="/" element={<App />} />

    
      {/* Optional: 404 page (if not existing, remove this) */}
      {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
