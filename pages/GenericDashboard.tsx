
import React from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { DashboardType } from '../types';

interface GenericDashboardProps {
  type: DashboardType;
}

export const GenericDashboard: React.FC<GenericDashboardProps> = ({ type }) => {
  const { authState } = useAuth();

  const getDashboardIcon = () => {
    switch (type) {
      case DashboardType.SALES_TEAM: return 'fa-chart-line';
      case DashboardType.INVENTORY: return 'fa-warehouse';
      case DashboardType.ACCOUNTING: return 'fa-calculator';
      case DashboardType.PRODUCTION: return 'fa-microchip';
      case DashboardType.DISPATCH: return 'fa-truck-loading';
      case DashboardType.SECURITY: return 'fa-shield-halved';
      case DashboardType.STATUS_OF_TASK: return 'fa-tasks';
      default: return 'fa-industry';
    }
  };

  return (
    <Layout title={type}>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="bg-indigo-900 text-white p-10 rounded-[40px] relative overflow-hidden shadow-2xl shadow-indigo-200/50">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <i className={`fas ${getDashboardIcon()} text-[180px]`}></i>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4">Command Center: {authState.user?.firstName}</h3>
            <p className="text-indigo-200 max-w-xl text-lg font-medium leading-relaxed">
              Monitoring <span className="font-black text-white underline decoration-indigo-400">{type}</span> segment. 
              Real-time corrugation metrics and department-level protocols are initialized.
            </p>
          </div>
        </div>

        {/* Dummy Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 shadow-inner">
                <i className="fas fa-spinner fa-spin text-xl"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation Status</span>
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">Current Sync</p>
            <p className="text-2xl font-black text-gray-900">TERMINAL ONLINE</p>
          </div>

          <div className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-green-100 p-4 rounded-2xl text-green-600 shadow-inner">
                <i className="fas fa-id-badge text-xl"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authentication</span>
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">Clearance Tier</p>
            <p className="text-2xl font-black text-gray-900 uppercase">TIER: {authState.user?.roles[0] || 'STANDARD'}</p>
          </div>

          <div className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-purple-100 p-4 rounded-2xl text-purple-600 shadow-inner">
                <i className="fas fa-microchip text-xl"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telemetry</span>
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">Last Protocol</p>
            <p className="text-2xl font-black text-gray-900">SECURE HANDSHAKE</p>
          </div>
        </div>

        {/* Placeholder UI for Future Modules */}
        <div className="border-4 border-dashed border-gray-100 rounded-[48px] flex flex-col items-center justify-center py-24 px-12 text-center group">
          <div className="bg-gray-50 p-10 rounded-full mb-8 group-hover:scale-110 transition-transform">
            <i className={`fas ${getDashboardIcon()} text-gray-200 text-7xl`}></i>
          </div>
          <h4 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Module Segment Encrypted</h4>
          <p className="text-gray-300 max-w-md mt-4 text-sm font-bold uppercase tracking-tight">
            The operational tools for {type} are locked for this user profile. 
            Verification of departmental logic will be deployed in the upcoming cycle.
          </p>
        </div>
      </div>
    </Layout>
  );
};
