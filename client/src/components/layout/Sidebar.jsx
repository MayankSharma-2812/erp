import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { navigationItems } from '../../config/navigation';
import { logoutApi } from '../../api/auth.api';
import * as Icons from 'lucide-react';
import { toast } from 'sonner';

const Sidebar = ({ collapsed, toggleCollapse, mobileOpen, closeMobile }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  // Filter navigation items by user's role
  const filteredNavItems = navigationItems.filter(
    (item) => item.roles && item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    try {
      await logoutApi();
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  // On mobile, show labels if the drawer is open.
  const showFullMenu = !collapsed || mobileOpen;

  return (
    <aside
      className={`h-screen bg-gray-50 border-r border-gray-200 flex flex-col justify-between transition-all duration-300 z-40 fixed left-0 top-0 
        ${mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-16' : 'md:w-60'}
      `}
    >
      {/* Top: Logo section */}
      <div>
        <div className="h-16 flex items-center px-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-indigo-600 text-white flex-shrink-0">
              <Icons.GraduationCap className="h-6 w-6" />
            </div>
            {showFullMenu && (
              <span className="font-bold text-lg text-gray-900 tracking-tight whitespace-nowrap animate-in fade-in duration-300">
                VidyaERP
              </span>
            )}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="mt-4 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {filteredNavItems.map((item) => {
            const IconComponent = Icons[item.icon] || Icons.HelpCircle;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 pl-2'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${collapsed ? 'md:justify-center' : 'space-x-3'}`
                }
                title={collapsed ? item.label : undefined}
              >
                <IconComponent className="h-5 w-5 flex-shrink-0" />
                {showFullMenu && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Collapse toggle & logout */}
      <div className="p-2 border-t border-gray-200 bg-white space-y-1">
        {/* Toggle Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="w-full hidden md:flex items-center justify-center rounded-lg py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <Icons.ChevronRight className="h-5 w-5" />
          ) : (
            <div className="flex items-center space-x-3 w-full px-2 text-xs font-semibold">
              <Icons.ChevronLeft className="h-5 w-5" />
              <span>Collapse Menu</span>
            </div>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-red-600 hover:bg-red-50 ${
            collapsed ? 'md:justify-center' : 'space-x-3'
          }`}
          title={collapsed ? 'Log Out' : undefined}
        >
          <Icons.LogOut className="h-5 w-5 flex-shrink-0" />
          {showFullMenu && <span>Log Out</span>}
        </button>

        {showFullMenu && (
          <div className="pt-2 text-center text-[8px] text-gray-400 font-semibold tracking-wider uppercase pointer-events-none select-none leading-normal">
            designed & created by<br/>RankSchool Digital
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
