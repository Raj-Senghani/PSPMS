
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { DASHBOARD_ROUTES } from '../constants';
import { DashboardType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { authState, logout, users, requests } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPhoneNotification, setShowPhoneNotification] = useState(false);

  useEffect(() => {
    // If admin is logged in and there's a new pending request, show phone notification
    if (authState.user?.isMasterAdmin) {
      const pendingCount = requests.filter(r => r.status === 'PENDING').length;
      if (pendingCount > 0) {
        setShowPhoneNotification(true);
        const timer = setTimeout(() => setShowPhoneNotification(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [requests.length, authState.user?.isMasterAdmin]);

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
      {/* Mobile-Style Admin Notification (Simulated Phone Alert) */}
      {showPhoneNotification && authState.user?.isMasterAdmin && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm bg-black/90 text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 animate-slide-down backdrop-blur-lg">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-shield-alt"></i></div>
          <div className="flex-grow">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Master Security Alert</p>
            <p className="text-xs font-bold leading-tight">Secondary user is requesting critical clearance. Action required in Master Dashboard.</p>
          </div>
          <button onClick={() => navigate('/master')} className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase rounded-lg">Open</button>
        </div>
      )}

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
              <div className="flex items-center justify-end gap-1">
                {user.isMasterAdmin && <i className="fas fa-crown text-[8px] text-orange-500"></i>}
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{user.roles[0]}</p>
              </div>
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
      <style>{`
        @keyframes slide-down { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .animate-slide-down { animation: slide-down 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};
