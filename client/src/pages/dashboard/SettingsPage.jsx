import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Settings,
  Building,
  CreditCard,
  ShieldAlert,
  Server,
  Activity,
  CheckCircle,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('school');
  
  // School Settings State
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'VidyaERP Academy',
    affiliation: 'CBSE Boarding School',
    schoolCode: 'CBSE-99104',
    affiliationNo: '1930218',
    email: 'admin@vidyaerp.com',
    phone: '+91 98765 43210',
    address: 'Vasant Kunj, New Delhi, Delhi 110070',
  });

  // Gateway Settings
  const [gatewayConfig, setGatewayConfig] = useState({
    razorpayKeyId: 'rzp_test_5b349b663143bc3e',
    razorpayKeySecret: '••••••••••••••••••••••••',
    mode: 'test',
    webhookUrl: 'http://localhost:5000/api/v1/finance/razorpay/webhook',
  });

  // Security Settings
  const [securityConfig, setSecurityConfig] = useState({
    jwtExpiry: '15 minutes',
    refreshTokenExpiry: '7 days',
    passwordMinLength: 8,
    requireSpecialChar: true,
  });

  // System Environment stats
  const [envStats, setEnvStats] = useState({
    nodeVersion: 'v20.11.0',
    dbStatus: 'Connected',
    dbName: 'vidyaerp_prod',
    environment: 'development',
    serverUptime: '2h 15m',
    activeSessions: 4,
  });

  // Mock Audit Logs
  const [auditLogs] = useState([
    { timestamp: new Date(Date.now() - 50000).toLocaleString(), action: 'User Login', user: 'principal@vidyaerp.com', ip: '127.0.0.1' },
    { timestamp: new Date(Date.now() - 300000).toLocaleString(), action: 'Fee Waiver Approved', user: 'principal@vidyaerp.com', ip: '127.0.0.1' },
    { timestamp: new Date(Date.now() - 1200000).toLocaleString(), action: 'Syllabus Topic Added', user: 'classteacher@vidyaerp.com', ip: '192.168.1.14' },
    { timestamp: new Date(Date.now() - 3600000).toLocaleString(), action: 'Room Allocated', user: 'warden@vidyaerp.com', ip: '192.168.1.5' },
    { timestamp: new Date(Date.now() - 7200000).toLocaleString(), action: 'Student Admission Confirmed', user: 'principal@vidyaerp.com', ip: '127.0.0.1' },
  ]);

  const handleSaveSchoolInfo = (e) => {
    e.preventDefault();
    toast.success('School profile settings saved successfully!');
  };

  const handleSaveGateway = (e) => {
    e.preventDefault();
    toast.success('Razorpay Payment Gateway credentials updated.');
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    toast.success('Security configurations applied successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans flex items-center gap-2">
          <Settings className="w-8 h-8 text-indigo-600" /> System Settings
        </h1>
        <p className="text-gray-500">Configure school profiles, payment gateways, security thresholds, and inspect audit trails.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        {[
          { key: 'school', label: 'School Profile', icon: Building },
          { key: 'gateway', label: 'Payment Gateways', icon: CreditCard },
          { key: 'security', label: 'Security & Access', icon: ShieldAlert },
          { key: 'system', label: 'Environment & Audits', icon: Server },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}

      {/* SCHOOL PROFILE */}
      {activeTab === 'school' && (
        <form onSubmit={handleSaveSchoolInfo} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">School Information Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">School Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={schoolInfo.name}
                onChange={e => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Board Affiliation Type</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={schoolInfo.affiliation}
                onChange={e => setSchoolInfo({ ...schoolInfo, affiliation: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Affiliation Number</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={schoolInfo.affiliationNo}
                onChange={e => setSchoolInfo({ ...schoolInfo, affiliationNo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">School Code</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={schoolInfo.schoolCode}
                onChange={e => setSchoolInfo({ ...schoolInfo, schoolCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Official Email Address</label>
              <input
                type="email"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={schoolInfo.email}
                onChange={e => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Contact Phone</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={schoolInfo.phone}
                onChange={e => setSchoolInfo({ ...schoolInfo, phone: e.target.value })}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Postal Address</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={schoolInfo.address}
                onChange={e => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-4.5 h-4.5" /> Save Profile Info
            </button>
          </div>
        </form>
      )}

      {/* GATEWAY CONFIG */}
      {activeTab === 'gateway' && (
        <form onSubmit={handleSaveGateway} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Razorpay Online Payments Gateway</h3>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Razorpay Key ID</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600 font-mono"
                value={gatewayConfig.razorpayKeyId}
                onChange={e => setGatewayConfig({ ...gatewayConfig, razorpayKeyId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Razorpay Key Secret</label>
              <input
                type="password"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={gatewayConfig.razorpayKeySecret}
                onChange={e => setGatewayConfig({ ...gatewayConfig, razorpayKeySecret: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Operation Mode</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={gatewayConfig.mode}
                onChange={e => setGatewayConfig({ ...gatewayConfig, mode: e.target.value })}
              >
                <option value="test">Test Mode / Sandbox</option>
                <option value="live">Live Production</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Webhook URL Endpoint (Read-only)</label>
              <input
                type="text"
                readOnly
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2 text-sm font-mono text-gray-500 cursor-not-allowed outline-none"
                value={gatewayConfig.webhookUrl}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-4.5 h-4.5" /> Save Gateway Credentials
            </button>
          </div>
        </form>
      )}

      {/* SECURITY CONFIG */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Security & Access parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">JWT Expiry (Access Token)</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={securityConfig.jwtExpiry}
                onChange={e => setSecurityConfig({ ...securityConfig, jwtExpiry: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Refresh Token Expiry</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={securityConfig.refreshTokenExpiry}
                onChange={e => setSecurityConfig({ ...securityConfig, refreshTokenExpiry: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Minimum Password Length</label>
              <input
                type="number"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={securityConfig.passwordMinLength}
                onChange={e => setSecurityConfig({ ...securityConfig, passwordMinLength: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Password requirements</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={securityConfig.requireSpecialChar ? 'yes' : 'no'}
                onChange={e => setSecurityConfig({ ...securityConfig, requireSpecialChar: e.target.value === 'yes' })}
              >
                <option value="yes">Require numbers & special characters</option>
                <option value="no">Any characters allowed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-4.5 h-4.5" /> Apply Settings
            </button>
          </div>
        </form>
      )}

      {/* ENVIRONMENT & AUDITS */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Env Roster */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-2xs font-extrabold uppercase text-gray-400">Database Status</span>
                <div className="text-lg font-bold text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {envStats.dbStatus}
                </div>
              </div>
              <Activity className="w-8 h-8 text-green-500 opacity-25" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-2xs font-extrabold uppercase text-gray-400">Node Environment</span>
                <div className="text-lg font-bold text-gray-800 mt-1 capitalize">
                  {envStats.environment}
                </div>
              </div>
              <Server className="w-8 h-8 text-gray-500 opacity-25" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-2xs font-extrabold uppercase text-gray-400">Database Name</span>
                <div className="text-lg font-bold text-indigo-600 mt-1 font-mono">
                  {envStats.dbName}
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-2xs font-extrabold uppercase text-gray-400">Runtime Version</span>
                <div className="text-lg font-bold text-gray-700 mt-1 font-mono">
                  {envStats.nodeVersion}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Active System Audit Logs (Gateways Log)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-2xs font-bold uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Action Description</th>
                    <th className="px-6 py-3">Performed By</th>
                    <th className="px-6 py-3 font-mono">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-750">
                  {auditLogs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-gray-400">{log.timestamp}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{log.action}</td>
                      <td className="px-6 py-4 text-indigo-650 font-semibold">{log.user}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
