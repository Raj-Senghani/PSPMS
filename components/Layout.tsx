
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

  const getTargetRoute = (dash: string) => {
    const route = DASHBOARD_ROUTES[dash as DashboardType];
    return route || `/segment/${encodeURIComponent(dash)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <i className="fas fa-boxes text-white"></i>
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">PSPMS</span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-1 border-l border-gray-200 pl-6 h-8">
              {availableDashboards.map(dash => {
                const target = getTargetRoute(dash);
                const isActive = location.pathname === target;
                return (
                  <button
                    key={dash}
                    onClick={() => navigate(target)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {dash}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{user.roles[0]}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-all border border-gray-200"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        <div className="mb-8 flex items-end justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 transition-all"
            >
              <i className="fas fa-arrow-left text-sm"></i>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Management Portal v2.0</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">System Online</span>
          </div>
        </div>

        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} PSPMS - Factory Management System</p>
          <div className="flex gap-4">
             <span>Terms</span>
             <span>Privacy</span>
             <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
