
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_ROUTES } from '../constants';
import { DashboardType } from '../types';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(username, password);
    if (success) {
      setTimeout(() => {
        const savedAuth = JSON.parse(localStorage.getItem('pspms_auth') || '{}');
        const user = savedAuth.user;
        if (user && user.assignedDashboards.length > 0) {
          const firstDash = user.assignedDashboards[0];
          const route = DASHBOARD_ROUTES[firstDash as DashboardType] || `/segment/${encodeURIComponent(firstDash)}`;
          navigate(route);
        }
      }, 300);
    } else {
      setError('Invalid username or password.');
      setLoading(false);
    }
  };

  const inputClasses = "block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <i className="fas fa-boxes text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">PSPMS Login</h1>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-2">Factory Management Console</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-3 text-red-700 text-xs font-semibold">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Username</label>
              <input type="text" required className={inputClasses} placeholder="Enter your terminal ID" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required className={inputClasses} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors">
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-3">
              {loading ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Connecting...</> : "Sign In"}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Secure Personnel Access Layer</p>
          </div>
        </div>
      </div>
    </div>
  );
};
