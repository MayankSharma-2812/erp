import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import ProtectedRoute from './components/ProtectedRoute';
import StudentsPage from './pages/dashboard/StudentsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import { useAuthStore } from './store/authStore';

const DashboardIndex = () => {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'student' || user?.role === 'parent') {
    return <Navigate to="/dashboard/student" replace />;
  }
  return <Navigate to="/dashboard/overview" replace />;
};

import AdmissionsPage from './pages/dashboard/AdmissionsPage';
import AcademicsPage from './pages/dashboard/AcademicsPage';
import TimetablePage from './pages/dashboard/TimetablePage';
import AttendancePage from './pages/dashboard/AttendancePage';
import ExamsPage from './pages/dashboard/ExamsPage';
import MarksEntryPage from './pages/dashboard/MarksEntryPage';
import FinancePage from './pages/dashboard/FinancePage';
import FeeCollectionPage from './pages/dashboard/FeeCollectionPage';
import LibraryPage from './pages/dashboard/LibraryPage';
import TransportPage from './pages/dashboard/TransportPage';
import HealthPage from './pages/dashboard/HealthPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import HostelPage from './pages/dashboard/HostelPage';
import HrPage from './pages/dashboard/HrPage';
import StudentPage from './pages/dashboard/StudentPage';
import StaffPortalPage from './pages/dashboard/StaffPortalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="overview" element={<OverviewPage />} />
            
            {/* Catch role-specific routes and redirect to their module or overview */}
            <Route path="students" element={<StudentsPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="academics" element={<AcademicsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="marks" element={<MarksEntryPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="fee-collection" element={<FeeCollectionPage />} />
            <Route path="hostel" element={<HostelPage />} />
            <Route path="hr" element={<HrPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="transport" element={<TransportPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="student" element={<StudentPage />} />
            <Route path="staff-portal" element={<StaffPortalPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            <Route index element={<DashboardIndex />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
