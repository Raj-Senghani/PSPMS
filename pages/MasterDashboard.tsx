
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserModal } from '../components/UserModal';
import { User, DashboardType, RequestType } from '../types';
import { DASHBOARD_ROUTES } from '../constants';

export const MasterDashboard: React.FC = () => {
  const { authState, users, addUser, updateUser, deleteUser, requests, handleRequest, createRequest, lockUserMaster } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Terminal Authorization (for secondary masters)
  const [isTerminalAuthorized, setIsTerminalAuthorized] = useState(false);
  const [terminalPassword, setTerminalPassword] = useState('');
  const [terminalError, setTerminalError] = useState('');

  // Deletion logic states
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [sessionDeletions, setSessionDeletions] = useState(0);

  const navigate = useNavigate();

  const isMasterAdmin = authState.user?.isMasterAdmin;
  const isLocked = authState.user?.isMasterLocked;

  useEffect(() => {
    if (isMasterAdmin) {
      setIsTerminalAuthorized(true);
    }
  }, [isMasterAdmin]);

  const handleTerminalAuth = () => {
    if (authState.user?.password === terminalPassword) {
      setIsTerminalAuthorized(true);
      setTerminalError('');
    } else {
      setTerminalError('Identity Verification Failed');
    }
  };

  const handleSaveUser = (userData: any) => {
    // Check if editing primary admin
    const targetIsAdmin = users.find(u => u.id === editingUser?.id)?.isMasterAdmin;
    if (targetIsAdmin && !isMasterAdmin) {
      createRequest(RequestType.EDIT_ADMIN, editingUser?.id, `${userData.firstName} ${userData.lastName}`);
      alert("Unauthorized Access Attempt: Modifying Master Admin requires primary approval. System admin notified.");
      return;
    }

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
    if (user.isRevocable === false && user.isActive) return;
    updateUser(user.id, { isActive: !user.isActive });
  };

  const authorizeDeletion = () => {
    setDeleteError('');
    
    // Limitation for secondary users: Only 1 deletion per terminal session without flagging
    if (!isMasterAdmin && sessionDeletions >= 1) {
      createRequest(RequestType.DELETE_MEMBER, deletingUserId!, users.find(u => u.id === deletingUserId)?.firstName);
      setDeleteError('Security Alert: Excessive deletion detected. Request sent to Master Admin for approval.');
      setDeletingUserId(null);
      return;
    }

    const adminUser = users.find(u => u.isMasterAdmin);
    if (adminUser && adminPassword === adminUser.password) {
      if (deletingUserId) {
        deleteUser(deletingUserId);
        setDeletingUserId(null);
        setAdminPassword('');
        setSessionDeletions(prev => prev + 1);
      }
    } else {
      setDeleteError('Authorization Failed: Invalid Admin Credentials');
    }
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
    if (route) navigate(route);
    else navigate(`/segment/${encodeURIComponent(dash)}`);
  };

  const allDashboards = Array.from(new Set([
    ...Object.values(DashboardType),
    ...users.flatMap(u => u.assignedDashboards)
  ]));

  if (isLocked) {
    return (
      <Layout title="Access Denied">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-32 h-32 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-5xl">
            <i className="fas fa-user-lock"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase">Master Access Revoked</h2>
          <p className="text-gray-500 max-w-md font-medium">
            Your clearance to the Master Terminal has been suspended due to unauthorized manipulation attempts or security policy violations.
            Contact the primary Administrator to restore access.
          </p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-indigo-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl">Return to Safe Zone</button>
        </div>
      </Layout>
    )
  }

  if (!isTerminalAuthorized) {
    return (
      <Layout title="Secure Gateway">
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 w-full max-w-md space-y-8 animate-scale-up">
             <div className="flex flex-col items-center">
               <div className="w-20 h-20 bg-indigo-900 text-white rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-xl shadow-indigo-100"><i className="fas fa-fingerprint"></i></div>
               <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Terminal Authorization</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Secondary Master Protocol Required</p>
             </div>
             <div className="space-y-4">
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Terminal Password" 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-center font-bold tracking-[0.3em] outline-none focus:ring-4 focus:ring-indigo-50"
                  value={terminalPassword}
                  onChange={(e) => setTerminalPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTerminalAuth()}
                />
                {terminalError && <p className="text-center text-[10px] font-black text-red-600 uppercase tracking-widest">{terminalError}</p>}
                <button 
                  onClick={handleTerminalAuth}
                  className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-black transition-all"
                >
                  Confirm Identity
                </button>
             </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Master Control Terminal">
      <div className="space-y-12">
        
        {/* Admin Notification Panel (Only for Primary Admin) */}
        {isMasterAdmin && requests.filter(r => r.status === 'PENDING').length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center animate-bounce shadow-lg shadow-orange-100">
                <i className="fas fa-bell"></i>
              </div>
              <div>
                <h4 className="text-xl font-black text-orange-900 uppercase">Master Approval Pending</h4>
                <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">Action requested by secondary personnel</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {requests.filter(r => r.status === 'PENDING').map(req => (
                 <div key={req.id} className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-black text-gray-900">{req.fromUserName}</p>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4">
                        Requesting: {req.type.replace('_', ' ')} {req.targetName ? `(${req.targetName})` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleRequest(req.id, true)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Approve</button>
                       <button onClick={() => { handleRequest(req.id, false); lockUserMaster(req.fromUserId); }} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Reject & Lock</button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Analytics & Quick Access Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">System Analytics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-indigo-900 p-7 rounded-[32px] text-white flex items-center justify-between shadow-xl shadow-indigo-100 group transition-all">
                <div><p className="text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1">Total Onboarded</p><p className="text-4xl font-black">{users.length}</p></div>
                <div className="bg-white/10 p-4 rounded-2xl text-white group-hover:scale-110 transition-transform"><i className="fas fa-users-gear text-2xl"></i></div>
              </div>
              <div className="bg-white p-7 rounded-[32px] border border-gray-100 flex items-center justify-between shadow-sm group hover:shadow-lg transition-all">
                <div><p className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">Online Status</p><p className="text-4xl font-black text-gray-900">{users.filter(u => u.isActive).length}</p></div>
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 transition-all"><i className="fas fa-signal text-2xl"></i></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">Sub-Terminal Teleport</h4>
            <div className="relative">
              <div className="flex overflow-x-auto pb-6 gap-5 snap-x px-1 no-scrollbar">
                {allDashboards.map((dash) => (
                  <button key={dash} onClick={() => navigateToDash(dash)} className="flex-shrink-0 w-48 p-7 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-indigo-400 transition-all group snap-start text-left relative overflow-hidden">
                    <div className="bg-indigo-50 group-hover:bg-indigo-900 group-hover:text-white p-5 rounded-2xl text-indigo-600 mb-6 transition-all inline-block shadow-inner"><i className={`fas ${getDashboardIcon(dash)} text-2xl`}></i></div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-indigo-400 transition-colors mb-1">Enter Segment</p>
                    <p className="text-lg font-black text-gray-800 leading-tight group-hover:text-indigo-900 truncate">{dash}</p>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-[0.03] transition-opacity"><i className={`fas ${getDashboardIcon(dash)} text-6xl`}></i></div>
                    <i className="fas fa-arrow-right-long absolute bottom-7 right-7 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 text-indigo-600"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Personnel Registry Section */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Personnel Registry</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Authorized Clearance Levels</p>
            </div>
            <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="w-full md:w-auto bg-indigo-900 hover:bg-black text-white px-8 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-4 transform hover:-translate-y-1">
              <i className="fas fa-user-plus text-lg"></i>
              <span>Register New Member</span>
            </button>
          </div>

          <div className="hidden lg:block overflow-hidden rounded-[40px] border border-gray-100 shadow-2xl bg-white">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/30">
                <tr>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Identity</th>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</th>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Matrix Access</th>
                  <th className="px-8 py-7 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-7 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Command</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-14 w-14 rounded-3xl bg-indigo-900 flex items-center justify-center text-white font-black shadow-lg text-xl group-hover:rotate-6 transition-transform relative">
                          {user.firstName.charAt(0)}
                          {user.isRevocable === false && <div className="absolute -top-1 -right-1 bg-orange-500 text-[8px] p-1 rounded-full border border-white"><i className="fas fa-lock text-[6px]"></i></div>}
                        </div>
                        <div className="ml-5">
                          <div className="text-base font-black text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="flex gap-1 mt-1 flex-wrap max-w-[200px]">{user.roles.map(r => <span key={r} className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{r}</span>)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap"><code className="text-[11px] font-black bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 border border-gray-200">@{user.username.toUpperCase()}</code></td>
                    <td className="px-8 py-7 whitespace-nowrap"><div className="flex flex-wrap gap-1.5 max-w-[240px]">{user.assignedDashboards.map(d => <span key={d} className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-white text-indigo-900 border border-indigo-100 uppercase shadow-sm">{d}</span>)}</div></td>
                    <td className="px-8 py-7 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${user.isActive ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${user.isActive ? 'text-green-700' : 'text-gray-400'}`}>{user.isActive ? 'Access Active' : 'Revoked'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-7 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleEdit(user)} className="bg-white text-indigo-600 hover:bg-indigo-900 hover:text-white p-3.5 rounded-xl transition-all border border-gray-100 shadow-sm"><i className="fas fa-edit"></i></button>
                        <button onClick={() => toggleStatus(user)} disabled={user.isRevocable === false && user.isActive} className={`${user.isActive ? 'text-orange-500 hover:bg-orange-500' : 'text-green-600 hover:bg-green-600'} bg-white hover:text-white p-3.5 rounded-xl transition-all border border-gray-100 shadow-sm disabled:opacity-20`}><i className={`fas ${user.isRevocable === false && user.isActive ? 'fa-shield-alt' : (user.isActive ? 'fa-power-off' : 'fa-check')}`}></i></button>
                        <button onClick={() => setDeletingUserId(user.id)} disabled={user.isRevocable === false} className="bg-white text-red-500 hover:bg-red-500 hover:text-white p-3.5 rounded-xl transition-all border border-gray-100 shadow-sm disabled:opacity-20"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-3xl bg-indigo-900 flex items-center justify-center text-white font-black shadow-lg text-2xl relative">
                      {user.firstName.charAt(0)}
                      {user.isRevocable === false && <div className="absolute -top-1 -right-1 bg-orange-500 text-[10px] p-1.5 rounded-full border-2 border-white"><i className="fas fa-lock"></i></div>}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-lg leading-tight">{user.firstName} {user.lastName}</h4>
                      <code className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 block">@{user.username}</code>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${user.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{user.isActive ? 'Active' : 'Locked'}</div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end gap-2">
                   <button onClick={() => handleEdit(user)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-900 hover:text-white transition-all border border-gray-100"><i className="fas fa-edit text-sm"></i></button>
                   <button onClick={() => toggleStatus(user)} disabled={user.isRevocable === false && user.isActive} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border border-gray-100 disabled:opacity-20 ${user.isActive ? 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white'}`}><i className={`fas ${user.isRevocable === false && user.isActive ? 'fa-shield-alt' : (user.isActive ? 'fa-power-off' : 'fa-check')} text-sm`}></i></button>
                   <button onClick={() => setDeletingUserId(user.id)} disabled={user.isRevocable === false} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 disabled:opacity-20"><i className="fas fa-trash-alt text-sm"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MEMBER DELETION: Master Authorization Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-scale-up">
            <div className="bg-red-600 p-8 text-white flex flex-col items-center">
               <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4"><i className="fas fa-exclamation-triangle text-3xl"></i></div>
               <h3 className="text-xl font-black uppercase tracking-tight">Destructive Action</h3>
               <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest mt-1">Master Clearance Required</p>
            </div>
            <div className="p-10 space-y-6">
               <p className="text-sm font-medium text-gray-500 text-center leading-relaxed">
                 You are about to permanently purge this member profile from the central database. 
                 Provide the <span className="text-red-600 font-bold uppercase">Administrator Password</span> to proceed.
               </p>
               <div className="space-y-4">
                  <input 
                    type="password" 
                    autoFocus
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-lg font-bold tracking-[0.5em] focus:ring-4 focus:ring-red-100 outline-none" 
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && authorizeDeletion()}
                  />
                  {deleteError && <p className="text-[10px] font-black text-red-600 text-center uppercase tracking-widest">{deleteError}</p>}
               </div>
               <div className="flex gap-4 pt-4">
                  <button onClick={() => { setDeletingUserId(null); setAdminPassword(''); setDeleteError(''); }} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Abort Access</button>
                  <button onClick={authorizeDeletion} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-black transition-all">Authorize Purge</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <UserModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser(null); }} onSave={handleSaveUser} editingUser={editingUser} />
      
      <style>{`
        @keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </Layout>
  );
};
