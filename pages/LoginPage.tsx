
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_ROUTES } from '../constants';

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

    // Simulate network delay
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        const savedUsers = JSON.parse(localStorage.getItem('pspms_users') || '[]');
        const user = savedUsers.find((u: any) => u.username === username);
        if (user) {
          // Navigate to the first assigned dashboard
          navigate(DASHBOARD_ROUTES[user.assignedDashboards[0]]);
        }
      } else {
        setError('Verification failed. Invalid ID or Access Revoked.');
        setLoading(false);
      }
    }, 1000);
  };

  const inputClasses = "block w-full pl-11 pr-4 py-4 bg-white text-gray-900 border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none placeholder-gray-400 font-bold";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
         <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
         <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full mx-4 z-10">
        <div className="bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
          <div className="p-10 pb-2 flex flex-col items-center">
            <div className="bg-indigo-600 w-20 h-20 rounded-3xl shadow-2xl shadow-indigo-400/40 mb-8 flex items-center justify-center transform -rotate-6">
              <i className="fas fa-industry text-white text-4xl"></i>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tightest">PSPMS</h1>
            <p className="text-gray-400 font-bold text-center mt-3 uppercase tracking-[0.3em] text-[10px]">Secure Factory Gateway</p>
          </div>

          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-shake flex items-center space-x-3">
                <i className="fas fa-shield-alt text-red-500"></i>
                <p className="text-xs font-bold text-red-700 uppercase tracking-tighter">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Terminal ID (Username)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-user-circle text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
                  </div>
                  <input
                    type="text"
                    required
                    className={inputClasses}
                    placeholder="ENTER USERNAME"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Access Protocol (Password)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-fingerprint text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className={`${inputClasses} pr-12`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 px-6 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-300/40 transition-all flex items-center justify-center space-x-3 ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 transform hover:-translate-y-1 active:translate-y-0'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>Initialize Login</span>
                  <i className="fas fa-bolt text-indigo-300"></i>
                </>
              )}
            </button>
          </form>

          <div className="bg-gray-50/80 p-6 text-center border-t border-gray-100 flex flex-col items-center">
            <div className="flex space-x-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-50"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-20"></span>
            </div>
            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest leading-relaxed">
              Mainframe Connection Active • 128-bit Encryption<br/>
              Authorized Terminal ID: 882-BOX-CORR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};