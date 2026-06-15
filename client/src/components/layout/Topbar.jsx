import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { logoutApi } from '../../api/auth.api';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Key,
  CheckCheck,
  Trash2,
  Calendar,
  Building2,
  IndianRupee,
  HeartPulse,
  BookOpen,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

const Topbar = ({ toggleSidebar }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Generate role-specific notifications
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const role = user.role || 'principal';
    
    let list = [];
    if (role === 'student') {
      list = [
        { id: 1, text: 'Your outing pass to Noida Mall has been approved!', time: '10 mins ago', read: false, type: 'hostel' },
        { id: 2, text: 'New Class Timetable slot added for Friday Period 4.', time: '2 hours ago', read: false, type: 'academic' },
        { id: 3, text: 'Tuition Fee (Q1) payment receipt generated successfully.', time: '1 day ago', read: true, type: 'finance' }
      ];
    } else if (role === 'principal' || role === 'vice_principal') {
      list = [
        { id: 1, text: 'New Leave Request pending: Anita Verma (Class Teacher)', time: '5 mins ago', read: false, type: 'hr' },
        { id: 2, text: 'Outing Gate Pass request: Rohan Gupta (>48 Hours approval)', time: '20 mins ago', read: false, type: 'hostel' },
        { id: 3, text: 'Fee Collection collection target reached 84% for June.', time: '4 hours ago', read: true, type: 'finance' }
      ];
    } else if (role === 'hostel_warden' || role === 'asst_hostel_warden') {
      list = [
        { id: 1, text: 'Outing Pass submitted: Rohan Gupta (Aravali Block)', time: '12 mins ago', read: false, type: 'hostel' },
        { id: 2, text: 'Visitor check-in log: Father of Rohan Gupta in lobby', time: '1 hour ago', read: false, type: 'hostel' }
      ];
    } else if (role === 'accounts_officer' || role === 'cashier') {
      list = [
        { id: 1, text: 'Razorpay Online payment captured: Rohan Gupta (₹2,500)', time: '30 mins ago', read: false, type: 'finance' },
        { id: 2, text: 'Overdue library fine ledger transaction posted: ADM-2025-100', time: '2 hours ago', read: false, type: 'finance' }
      ];
    } else {
      list = [
        { id: 1, text: 'Welcome to the new VidyaERP administrative system.', time: 'Just now', read: false, type: 'system' }
      ];
    }
    setNotifications(list);
  }, [user]);

  // Generate breadcrumb from current path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('  /  ');

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

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleClearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'hostel': return <Building2 className="w-4 h-4 text-teal-600" />;
      case 'finance': return <IndianRupee className="w-4 h-4 text-emerald-600" />;
      case 'academic': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'hr': return <User className="w-4 h-4 text-orange-600" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left side: hamburger & breadcrumb */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs md:text-sm font-semibold text-gray-700 tracking-wide truncate max-w-[120px] sm:max-w-none">
          {breadcrumb || 'Overview'}
        </span>
      </div>

      {/* Right side: notifications & user menu */}
      <div className="flex items-center space-x-6">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold flex items-center gap-0.5"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 flex gap-3 items-start transition-colors relative hover:bg-gray-50 ${
                        !n.read ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <div className="p-2 bg-gray-100 rounded-xl flex-shrink-0 mt-0.5">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-xs text-gray-700 leading-normal ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                          {n.text}
                        </p>
                        <span className="text-[9px] text-gray-400 font-semibold mt-1 block">
                          {n.time}
                        </span>
                      </div>
                      <button
                        onClick={() => handleClearNotification(n.id)}
                        className="absolute right-3 top-3.5 text-gray-300 hover:text-gray-500 transition-colors"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-400 font-medium">
                      All clean! No new notifications.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 transition-all focus:outline-none"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm ring-2 ring-indigo-50">
              {user?.name?.charAt(0) || 'U'}
            </div>
            
            {/* User details */}
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-900 leading-none">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium capitalize mt-0.5">
                {user?.role?.replace('_', ' ') || 'Role'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {/* Dropdown Options */}
          {dropdownOpen && (
            <>
              {/* Overlay to close on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    toast.info(`My Profile details for ${user.name}: Role is ${user.role}`);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    toast.info('To change password, contact the IT Administrator.');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                >
                  <Key className="h-4 w-4 text-gray-400" />
                  <span>Change Password</span>
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
