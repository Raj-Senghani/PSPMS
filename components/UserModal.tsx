
import React, { useState, useEffect } from 'react';
import { User, DashboardType } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: any) => void;
  editingUser?: User | null;
}

const INITIAL_ROLES = [
  'Administrator',
  'Owner',
  'Manager',
  'Supervisor',
  'Production Lead',
  'Inventory Controller',
  'Sales Representative',
  'Dispatch Coordinator',
  'Security Officer',
  'Task Monitor'
];

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, editingUser }) => {
  const [availableRoles, setAvailableRoles] = useState<string[]>(INITIAL_ROLES);
  const [availableDashboards, setAvailableDashboards] = useState<string[]>(Object.values(DashboardType));
  
  const [newRoleName, setNewRoleName] = useState('');
  const [newDashName, setNewDashName] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    phoneNumber: '',
    vehicleNumber: '',
    roles: [] as string[],
    assignedDashboards: [] as string[],
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setAvailableRoles(prev => Array.from(new Set([...prev, ...editingUser.roles])));
      setAvailableDashboards(prev => Array.from(new Set([...prev, ...editingUser.assignedDashboards])));
      
      setFormData({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        username: editingUser.username,
        password: editingUser.password || '',
        phoneNumber: editingUser.phoneNumber || '',
        vehicleNumber: editingUser.vehicleNumber || '',
        roles: editingUser.roles,
        assignedDashboards: editingUser.assignedDashboards,
        isActive: editingUser.isActive
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        phoneNumber: '',
        vehicleNumber: '',
        roles: [],
        assignedDashboards: [DashboardType.SALES_TEAM],
        isActive: true
      });
    }
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const toggleDashboard = (dash: string) => {
    setFormData(prev => ({
      ...prev,
      assignedDashboards: prev.assignedDashboards.includes(dash)
        ? prev.assignedDashboards.filter(d => d !== dash)
        : [...prev.assignedDashboards, dash]
    }));
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const addNewRole = () => {
    if (newRoleName.trim() && !availableRoles.includes(newRoleName.trim())) {
      const role = newRoleName.trim();
      setAvailableRoles(prev => [...prev, role]);
      setFormData(prev => ({ ...prev, roles: [...prev.roles, role] }));
      setNewRoleName('');
    }
  };

  const addNewDashboard = () => {
    if (newDashName.trim() && !availableDashboards.includes(newDashName.trim())) {
      const dash = newDashName.trim();
      setAvailableDashboards(prev => [...prev, dash]);
      setFormData(prev => ({ ...prev, assignedDashboards: [...prev.assignedDashboards, dash] }));
      setNewDashName('');
    }
  };

  const inputClasses = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder-gray-400 text-sm font-medium";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-[32px] text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-3xl w-full border border-gray-100">
          <div className="bg-indigo-900 px-8 py-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-white">
                {editingUser ? 'Personnel Update Protocol' : 'New Member Initialization'}
              </h3>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mt-1">Access Control Management System</p>
            </div>
            <button onClick={onClose} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="flex items-center space-x-2 text-indigo-900 mb-2">
                  <i className="fas fa-id-card"></i>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Identity Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">First Name</label>
                    <input required className={inputClasses} value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Last Name</label>
                    <input required className={inputClasses} value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Login Username (Terminal ID)</label>
                  <input required className={inputClasses} value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="j.doe01" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Phone Number</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      className={inputClasses} 
                      value={formData.phoneNumber} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, phoneNumber: val });
                      }} 
                      placeholder="0000000000" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Vehicle Number</label>
                    <input className={inputClasses} value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })} placeholder="ABC-1234" />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Security Password</label>
                  <input
                    required={!editingUser}
                    type={showPassword ? "text" : "password"}
                    className={inputClasses}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute bottom-3 right-4 text-gray-400 hover:text-indigo-600">
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <div className="pt-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-gray-700">System Authorization</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Enable or Disable User Access</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-indigo-900">
                    <i className="fas fa-user-tag"></i>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Designated Roles</h4>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className={`${inputClasses} py-2 text-xs`} 
                    placeholder="New Role Name..."
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={addNewRole}
                    className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-black transition-colors text-xs font-bold"
                  >
                    ADD
                  </button>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-[220px] overflow-y-auto grid grid-cols-1 gap-2">
                  {availableRoles.map(role => (
                    <label key={role} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      formData.roles.includes(role) 
                       ? 'bg-white border-indigo-200 shadow-sm' 
                       : 'hover:bg-white hover:border-gray-200 border-transparent'
                    }`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" 
                        checked={formData.roles.includes(role)}
                        onChange={() => toggleRole(role)}
                      />
                      <span className={`text-xs font-bold ${formData.roles.includes(role) ? 'text-indigo-900' : 'text-gray-500'}`}>{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center space-x-2 text-indigo-900">
                    <i className="fas fa-layer-group"></i>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard Access Matrix</h4>
                 </div>
                 <div className="flex space-x-2 max-w-xs">
                    <input 
                      type="text" 
                      className={`${inputClasses} py-2 text-xs`} 
                      placeholder="New Segment Name..."
                      value={newDashName}
                      onChange={(e) => setNewDashName(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={addNewDashboard}
                      className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-black transition-colors text-xs font-bold"
                    >
                      ADD
                    </button>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[200px] overflow-y-auto p-1">
                 {availableDashboards.map(dash => (
                   <label key={dash} className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                     formData.assignedDashboards.includes(dash) 
                      ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-200' 
                      : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm'
                   }`}>
                     <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                       formData.assignedDashboards.includes(dash) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'
                     }`}>
                        {formData.assignedDashboards.includes(dash) && <i className="fas fa-check text-[10px]"></i>}
                     </div>
                     <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.assignedDashboards.includes(dash)}
                      onChange={() => toggleDashboard(dash)}
                     />
                     <span className={`text-[10px] font-black uppercase tracking-tight truncate ${formData.assignedDashboards.includes(dash) ? 'text-indigo-900' : 'text-gray-500'}`}>{dash}</span>
                   </label>
                 ))}
               </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="px-8 py-3 text-gray-500 font-black uppercase tracking-widest text-[10px] hover:text-gray-900 transition-colors">Cancel Protocol</button>
              <button type="submit" className="px-10 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-200 hover:bg-black transform hover:-translate-y-1 transition-all">
                {editingUser ? 'Save Personnel Data' : 'Authorize Credentials'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
