
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserModal } from '../components/UserModal';
import { User, DashboardType } from '../types';
import { DASHBOARD_ROUTES } from '../constants';

export const MasterDashboard: React.FC = () => {
  const { users, addUser, updateUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const handleSaveUser = (userData: any) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const toggleStatus = (user: User) => {
    updateUser(user.id, { isActive: !user.isActive });
  };

  const getDashboardIcon = (type: string) => {
    switch (type) {
      case DashboardType.SALES_TEAM: return 'fa-chart-line';
      case DashboardType.INVENTORY: return 'fa-warehouse';
      case DashboardType.ACCOUNTING: return 'fa-calculator';
      case DashboardType.PRODUCTION: return 'fa-microchip';
      case DashboardType.DISPATCH: return 'fa-truck-loading';
      case DashboardType.SECURITY: return 'fa-shield-halved';
      case DashboardType.STATUS_OF_TASK: return 'fa-tasks';
      case DashboardType.MASTER: return 'fa-user-shield';
      default: return 'fa-terminal';
    }
  };

  const navigateToDash = (dash: string) => {
    const route = DASHBOARD_ROUTES[dash as DashboardType];
    if (route) {
      navigate(route);
    } else {
      navigate(`/segment/${encodeURIComponent(dash)}`);
    }
  };

  // Get all unique dashboards present in the system
  const allDashboards = Array.from(new Set([
    ...Object.values(DashboardType),
    ...users.flatMap(u => u.assignedDashboards)
  ]));

  return (
    <Layout title="Master Control Terminal">
      <div className="space-y-12">
        
        {/* Top Section: Metrics and Quick Access */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Stats Column */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">System Analytics</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-indigo-900 p-7 rounded-[32px] text-white flex items-center justify-between shadow-xl shadow-indigo-100 group transition-all">
                <div>
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1">Total Onboarded</p>
                  <p className="text-4xl font-black">{users.length}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl text-white group-hover:scale-110 transition-transform">
                  <i className="fas fa-users-gear text-2xl"></i>
                </div>
              </div>
              <div className="bg-white p-7 rounded-[32px] border border-gray-100 flex items-center justify-between shadow-sm group hover:shadow-lg transition-all">
                <div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">Online Status</p>
                  <p className="text-4xl font-black text-gray-900">{users.filter(u => u.isActive).length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl text-green-600 transition-all">
                  <i className="fas fa-signal text-2xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Column - Scrollable Section */}
          <div className="lg:col-span-8 space-y-6">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">Sub-Terminal Teleport</h4>
            <div className="relative">
              <div className="flex overflow-x-auto pb-6 gap-5 scrollbar-hide snap-x px-1">
                {allDashboards.map((dash) => (
                  <button
                    key={dash}
                    onClick={() => navigateToDash(dash)}
                    className="flex-shrink-0 w-48 p-7 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-indigo-400 transition-all group snap-start text-left relative overflow-hidden"
                  >
                    <div className="bg-indigo-50 group-hover:bg-indigo-900 group-hover:text-white p-5 rounded-2xl text-indigo-600 mb-6 transition-all inline-block shadow-inner">
                      <i className={`fas ${getDashboardIcon(dash)} text-2xl`}></i>
                    </div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-indigo-400 transition-colors mb-1">Enter Segment</p>
                    <p className="text-lg font-black text-gray-800 leading-tight group-hover:text-indigo-900 truncate">{dash}</p>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-[0.03] transition-opacity">
                       <i className={`fas ${getDashboardIcon(dash)} text-6xl`}></i>
                    </div>
                    <i className="fas fa-arrow-right-long absolute bottom-7 right-7 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 text-indigo-600"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Personnel Registry</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Authorized Factory Personnel and Clearance Levels</p>
            </div>
            <button 
              onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
              className="mt-6 md:mt-0 bg-indigo-900 hover:bg-black text-white px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all flex items-center space-x-4 transform hover:-translate-y-1 active:translate-y-0"
            >
              <i className="fas fa-user-plus text-lg"></i>
              <span>Register New Member</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-[40px] border border-gray-100 shadow-2xl bg-white">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/30">
                <tr>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Identity</th>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</th>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Matrix Access</th>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocols</th>
                  <th className="px-8 py-7 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Command</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-14 w-14 rounded-3xl bg-indigo-900 flex items-center justify-center text-white font-black shadow-lg text-xl group-hover:rotate-6 transition-transform">
                          {user.firstName.charAt(0)}
                        </div>
                        <div className="ml-5">
                          <div className="text-base font-black text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="flex gap-1 mt-1 flex-wrap max-w-[200px]">
                            {user.roles.map(r => (
                              <span key={r} className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{r}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <code className="text-[11px] font-black bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 border border-gray-200">ID::{user.username.toUpperCase()}</code>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {user.assignedDashboards.map(d => (
                           <span key={d} className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-white text-indigo-900 border border-indigo-100 uppercase shadow-sm">
                            {d}
                           </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${user.isActive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-pulse' : 'bg-gray-300'}`}></span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          user.isActive ? 'text-green-700' : 'text-gray-400'
                        }`}>
                          {user.isActive ? 'Auth Established' : 'Access Revoked'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="bg-white text-indigo-600 hover:bg-indigo-900 hover:text-white p-4 rounded-2xl transition-all border border-gray-100 shadow-md"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => toggleStatus(user)}
                          className={`${user.isActive ? 'text-red-600 hover:bg-red-600' : 'text-green-600 hover:bg-green-600'} bg-white hover:text-white p-4 rounded-2xl transition-all border border-gray-100 shadow-md`}
                        >
                          <i className={`fas ${user.isActive ? 'fa-ban' : 'fa-check'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </Layout>
  );
};
