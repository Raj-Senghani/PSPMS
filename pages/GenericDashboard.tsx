
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
      case DashboardType.STATUS_OF_TASK: return 'fa-clipboard-list';
      default: return 'fa-industry';
    }
  };

  return (
    <Layout title={type}>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="bg-indigo-900 text-white p-10 md:p-14 rounded-[48px] relative overflow-hidden shadow-2xl shadow-indigo-100">
          <div className="absolute -top-10 -right-10 p-10 opacity-5">
            <i className={`fas ${getDashboardIcon()} text-[240px]`}></i>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-black mb-6 tracking-tight">Command Center: {authState.user?.firstName}</h3>
            <div className="flex items-center space-x-6">
                <p className="text-indigo-200 max-w-xl text-lg font-medium leading-relaxed">
                    Monitoring <span className="font-black text-white underline underline-offset-8 decoration-4 decoration-indigo-400">{type}</span> segment. 
                    Operational protocols and departmental telemetry initialized.
                </p>
                <div className="hidden lg:flex flex-col items-center bg-white/5 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-1">Health</span>
                    <span className="text-xl font-black text-emerald-400">99.8%</span>
                </div>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-10 bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <div className="bg-blue-50 p-5 rounded-2xl text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                <i className="fas fa-satellite-dish text-xl"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation Status</span>
            </div>
            <p className="text-xs font-bold text-gray-400 mb-2">Live Terminal Connectivity</p>
            <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <p className="text-2xl font-black text-gray-900">TERMINAL SYNCED</p>
            </div>
          </div>

          <div className="p-10 bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <div className="bg-emerald-50 p-5 rounded-2xl text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                <i className="fas fa-key text-xl"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorization</span>
            </div>
            <p className="text-xs font-bold text-gray-400 mb-2">Security Clearance Tier</p>
            <p className="text-2xl font-black text-gray-900 uppercase tracking-tight">TIER: {authState.user?.roles[0] || 'STANDARD'}</p>
          </div>

          <div className="p-10 bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <div className="bg-purple-50 p-5 rounded-2xl text-purple-600 shadow-inner group-hover:scale-110 transition-transform">
                <i className="fas fa-dna text-xl"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Neural Link</span>
            </div>
            <p className="text-xs font-bold text-gray-400 mb-2">Departmental Hash</p>
            <p className="text-2xl font-black text-gray-900">VERIFIED.v{Math.floor(Math.random() * 9)}</p>
          </div>
        </div>

        {/* Encrypted Data Visualization Placeholder */}
        <div className="border-4 border-dashed border-gray-100 rounded-[64px] flex flex-col items-center justify-center py-32 px-12 text-center group hover:bg-gray-50/50 transition-all">
          <div className="bg-white p-12 rounded-full mb-10 shadow-2xl shadow-indigo-50 border border-gray-50 group-hover:scale-110 transition-transform duration-500">
            <i className={`fas ${getDashboardIcon()} text-indigo-900 text-8xl opacity-10 group-hover:opacity-40 transition-opacity`}></i>
          </div>
          <h4 className="text-3xl font-black text-gray-300 uppercase tracking-widest mb-6">Module Segment Encrypted</h4>
          <p className="text-gray-300 max-w-lg mx-auto text-sm font-black uppercase tracking-widest leading-loose">
            The high-precision tools for {type} are currently undergoing departmental calibration. 
            Operational deployment scheduled for upcoming development cycle.
          </p>
          <div className="mt-12 flex space-x-4">
              <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-200 w-[60%] animate-pulse"></div>
              </div>
              <div className="w-12 h-1 bg-gray-100 rounded-full"></div>
              <div className="w-12 h-1 bg-gray-100 rounded-full"></div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
