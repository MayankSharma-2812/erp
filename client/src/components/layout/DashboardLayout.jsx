import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    // If on mobile/tablet, toggle the mobile drawer
    // If on desktop, toggle the sidebar collapse state
    if (window.innerWidth < 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar - responsive behavior */}
      <Sidebar
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        mobileOpen={mobileOpen}
        closeMobile={closeMobileSidebar}
      />

      {/* Content wrapper with responsive margin left */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ml-0 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        }`}
      >
        {/* Topbar */}
        <Topbar toggleSidebar={toggleSidebar} />

        {/* Main page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
