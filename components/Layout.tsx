
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { DASHBOARD_ROUTES } from '../constants';
import { DashboardType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { authState, logout, users } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!authState.isAuthenticated || !authState.user) return null;

  const user = authState.user;
  const isMaster = user.assignedDashboards.includes(DashboardType.MASTER);

  const availableDashboards = isMaster 
    ? Array.from(new Set([
        ...Object.values(DashboardType),
        ...users.flatMap(u => u.assignedDashboards)
      ]))
    : user.assignedDashboards;

  const hasMultipleDashboards = availableDashboards.length > 1;

  const getTargetRoute = (dash: string) => {
    const route = DASHBOARD_ROUTES[dash as DashboardType];
    return route || `/segment/${encodeURIComponent(dash)}`;
  };

  const handleBack = () => {
    // If it's a master user and they are NOT on the master dashboard, take them back to master.
    // This solves the 'stuck in loop' issue where back takes them to login then redirects.
    if (isMaster && location.pathname !== '/master') {
      navigate('/master');
    } else {
      // Standard history back
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-white p-2 rounded-lg">
                <i className="fas fa-boxes text-indigo-900 text-xl"></i>
              </div>
              <div className="hidden xs:block">
                <h1 className="text-xl font-bold tracking-tight">PSPMS</h1>
                <p className="text-xs text-indigo-300">Factory Hub</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {hasMultipleDashboards && (
                <div className="hidden lg:flex items-center space-x-2 bg-indigo-800/50 p-1 rounded-xl border border-indigo-700/50">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 px-2">Jump:</span>
                  <div className="flex space-x-1 max-w-[400px] overflow-x-auto py-0.5 no-scrollbar">
                    {availableDashboards.map(dash => {
                      const target = getTargetRoute(dash);
                      const isActive = location.pathname === target;
                      return (
                        <button
                          key={dash}
                          onClick={() => navigate(target)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${
                            isActive 
                              ? 'bg-white text-indigo-900 shadow-sm' 
                              : 'text-indigo-100 hover:bg-indigo-700'
                          }`}
                        >
                          {dash}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="text-right hidden sm:block border-l border-indigo-700 pl-4 ml-4">
                <p className="text-sm font-bold">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest truncate max-w-[150px]">{user.roles.join(', ')}</p>
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white px-3 py-2 rounded-lg transition-all border border-red-500/30"
              >
                <i className="fas fa-power-off text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
              title="Go Back"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
                {title}
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Departmental Portal</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Terminal: {user.username}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/40 p-6 md:p-8 min-h-[65vh] border border-gray-100">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            PSPMS Factory Core © {new Date().getFullYear()} • Secure Connection Established
          </p>
        </div>
      </footer>
    </div>
  );
};
