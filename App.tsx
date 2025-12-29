
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { MasterDashboard } from './pages/MasterDashboard';
import { GenericDashboard } from './pages/GenericDashboard';
import { DashboardType } from './types';
import { DASHBOARD_ROUTES } from './constants';

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedDashboard?: string }> = ({ children, allowedDashboard }) => {
  const { authState } = useAuth();
  
  if (!authState.isAuthenticated || !authState.user) {
    return <Navigate to="/login" replace />;
  }

  // Allow MASTER users to access any dashboard
  const isMaster = authState.user.assignedDashboards.includes(DashboardType.MASTER);
  
  // If no specific dashboard is requested, just ensure they are logged in (usually root redirect does this)
  if (!allowedDashboard) return <>{children}</>;

  // Check if the requested dashboard is in user's assigned list
  const isAuthorized = authState.user.assignedDashboards.includes(allowedDashboard);

  if (!isMaster && !isAuthorized) {
    // Redirect to their first available dashboard
    const firstDash = authState.user.assignedDashboards[0];
    const targetRoute = DASHBOARD_ROUTES[firstDash as DashboardType] || `/segment/${encodeURIComponent(firstDash)}`;
    return <Navigate to={targetRoute} replace />;
  }

  return <>{children}</>;
};

const RootRedirect = () => {
  const { authState } = useAuth();
  if (authState.isAuthenticated && authState.user) {
    const firstDash = authState.user.assignedDashboards[0];
    const targetRoute = DASHBOARD_ROUTES[firstDash as DashboardType] || `/segment/${encodeURIComponent(firstDash)}`;
    return <Navigate to={targetRoute} replace />;
  }
  return <Navigate to="/login" replace />;
};

const CustomSegmentWrapper = () => {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name || '');
  return (
    <PrivateRoute allowedDashboard={decodedName}>
      <GenericDashboard type={decodedName as any} />
    </PrivateRoute>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/master" element={
            <PrivateRoute allowedDashboard={DashboardType.MASTER}>
              <MasterDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/sales" element={
            <PrivateRoute allowedDashboard={DashboardType.SALES_TEAM}>
              <GenericDashboard type={DashboardType.SALES_TEAM} />
            </PrivateRoute>
          } />
          
          <Route path="/inventory" element={
            <PrivateRoute allowedDashboard={DashboardType.INVENTORY}>
              <GenericDashboard type={DashboardType.INVENTORY} />
            </PrivateRoute>
          } />
          
          <Route path="/accounting" element={
            <PrivateRoute allowedDashboard={DashboardType.ACCOUNTING}>
              <GenericDashboard type={DashboardType.ACCOUNTING} />
            </PrivateRoute>
          } />
          
          <Route path="/production" element={
            <PrivateRoute allowedDashboard={DashboardType.PRODUCTION}>
              <GenericDashboard type={DashboardType.PRODUCTION} />
            </PrivateRoute>
          } />
          
          <Route path="/dispatch" element={
            <PrivateRoute allowedDashboard={DashboardType.DISPATCH}>
              <GenericDashboard type={DashboardType.DISPATCH} />
            </PrivateRoute>
          } />

          <Route path="/security" element={
            <PrivateRoute allowedDashboard={DashboardType.SECURITY}>
              <GenericDashboard type={DashboardType.SECURITY} />
            </PrivateRoute>
          } />
          
          <Route path="/tasks" element={
            <PrivateRoute allowedDashboard={DashboardType.STATUS_OF_TASK}>
              <GenericDashboard type={DashboardType.STATUS_OF_TASK} />
            </PrivateRoute>
          } />

          {/* Dynamic Catch-all for Custom Dashboards */}
          <Route path="/segment/:name" element={<CustomSegmentWrapper />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
