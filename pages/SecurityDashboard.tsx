
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  SecurityEntry, 
  SecurityCategory, 
  SecuritySubType, 
  SecurityStatus 
} from '../types';

const OVERSTAY_THRESHOLD_HOURS = 8;

const formatForInput = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export const SecurityDashboard: React.FC = () => {
  const { authState, users, updateUser } = useAuth();
  const [entries, setEntries] = useState<SecurityEntry[]>(() => {
    const saved = localStorage.getItem('pspms_security_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterSubType, setFilterSubType] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'today' | 'active' | 'pending'>('today');

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SecurityEntry | null>(null);
  const [fullSizePhotoUrl, setFullSizePhotoUrl] = useState<string | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    category: SecurityCategory.PERSON,
    subType: SecuritySubType.VISITOR,
    name: '',
    staffId: '',
    phoneNumber: '',
    vehiclePresence: false,
    vehicleNumber: '',
    reason: '',
    remarks: '',
    inTime: formatForInput(new Date()),
    expectedOutTime: '',
    photoUrl: ''
  });

  useEffect(() => {
    localStorage.setItem('pspms_security_data', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (!isEntryModalOpen) {
      stopCamera();
    }
  }, [isEntryModalOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  const computedEntries = useMemo(() => {
    const now = new Date();
    return entries.map(entry => {
      if (entry.status === SecurityStatus.IN) {
        const inTime = new Date(entry.inTime);
        const diffHours = (now.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        if (diffHours >= OVERSTAY_THRESHOLD_HOURS) {
          return { ...entry, status: SecurityStatus.OVERSTAY };
        }
      }
      return entry;
    });
  }, [entries]);

  const filteredEntries = computedEntries.filter(entry => {
    const isToday = new Date(entry.inTime).toDateString() === new Date().toDateString();
    
    if (activeTab === 'today' && !isToday) return false;
    if (activeTab === 'active' && entry.status === SecurityStatus.OUT) return false;
    if (activeTab === 'pending' && entry.status !== SecurityStatus.IN && entry.status !== SecurityStatus.OVERSTAY) return false;

    if (filterCategory !== 'All' && entry.category !== filterCategory) return false;
    if (filterSubType !== 'All' && entry.subType !== filterSubType) return false;

    return true;
  });

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subType === SecuritySubType.STAFF && formData.staffId) {
      updateUser(formData.staffId, {
        vehicleNumber: formData.vehiclePresence ? formData.vehicleNumber : ''
      });
    }

    const newEntry: SecurityEntry = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      inTime: new Date(formData.inTime).toISOString(),
      expectedOutTime: formData.expectedOutTime ? new Date(formData.expectedOutTime).toISOString() : undefined,
      status: SecurityStatus.IN,
      createdBy: authState.user?.id || 'sys',
      createdByName: `${authState.user?.firstName} ${authState.user?.lastName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries([newEntry, ...entries]);
    setIsEntryModalOpen(false);
    resetForm();
  };

  const handleMarkExit = (id: string) => {
    setEntries(entries.map(e => 
      e.id === id ? { ...e, outTime: new Date().toISOString(), status: SecurityStatus.OUT, updatedAt: new Date().toISOString() } : e
    ));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  const resetForm = () => {
    setFormData({
      category: SecurityCategory.PERSON,
      subType: SecuritySubType.VISITOR,
      name: '',
      staffId: '',
      phoneNumber: '',
      vehiclePresence: false,
      vehicleNumber: '',
      reason: '',
      remarks: '',
      inTime: formatForInput(new Date()),
      expectedOutTime: '',
      photoUrl: ''
    });
    setIsCameraActive(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStaffSelect = (staffId: string) => {
    const selectedStaff = users.find(u => u.id === staffId);
    if (selectedStaff) {
      setFormData({
        ...formData,
        staffId,
        name: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
        phoneNumber: selectedStaff.phoneNumber || '',
        vehicleNumber: selectedStaff.vehicleNumber || '',
        vehiclePresence: !!selectedStaff.vehicleNumber,
        reason: 'Staff Duty'
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold placeholder-gray-300 text-sm";

  return (
    <Layout title="Security Command">
      <div className="space-y-6 md:space-y-10 animate-fade-in w-full max-w-full overflow-x-hidden">
        {/* Responsive Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-indigo-900 p-4 md:p-8 rounded-2xl md:rounded-[32px] text-white shadow-xl shadow-indigo-200/50">
            <p className="text-indigo-300 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">Personnel IN</p>
            <p className="text-2xl md:text-4xl font-black truncate">{computedEntries.filter(e => e.status !== SecurityStatus.OUT && e.category === SecurityCategory.PERSON).length}</p>
          </div>
          <div className="bg-white border border-gray-100 p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm">
            <p className="text-gray-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">Material Transit</p>
            <p className="text-2xl md:text-4xl font-black text-gray-900 truncate">{computedEntries.filter(e => e.status !== SecurityStatus.OUT && e.category === SecurityCategory.MATERIAL).length}</p>
          </div>
          <div className="bg-white border border-gray-100 p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm">
            <p className="text-gray-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">Total Logs Today</p>
            <p className="text-2xl md:text-4xl font-black text-gray-900 truncate">{computedEntries.filter(e => new Date(e.inTime).toDateString() === new Date().toDateString()).length}</p>
          </div>
          <div className="bg-red-50 border border-red-100 p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm">
            <p className="text-red-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">Overstay Alerts</p>
            <p className="text-2xl md:text-4xl font-black text-red-600 truncate">{computedEntries.filter(e => e.status === SecurityStatus.OVERSTAY).length}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-gray-100 gap-4 md:gap-6">
          <div className="flex space-x-1 md:space-x-2 overflow-x-auto no-scrollbar py-1">
            {(['today', 'active', 'pending'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {tab === 'today' ? "Today" : tab === 'active' ? 'Active' : 'Pending'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 xl:flex flex-wrap gap-3 md:gap-4 items-center">
            <select 
              className="bg-gray-50 border-none rounded-xl md:rounded-2xl px-3 md:px-4 py-3 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500 w-full xl:w-auto"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {Object.values(SecurityCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              className="bg-gray-50 border-none rounded-xl md:rounded-2xl px-3 md:px-4 py-3 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500 w-full xl:w-auto"
              value={filterSubType}
              onChange={e => setFilterSubType(e.target.value)}
            >
              <option value="All">All Types</option>
              {Object.values(SecuritySubType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <button 
              onClick={() => {
                resetForm();
                setIsEntryModalOpen(true);
              }}
              className="bg-indigo-900 hover:bg-black text-white px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 md:space-x-3 transition-all w-full xl:w-auto"
            >
              <i className="fas fa-plus"></i>
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl md:rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-4 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile</th>
                  <th className="px-4 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Segment</th>
                  <th className="px-4 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                  <th className="px-4 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                  <th className="px-4 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 md:px-8 py-4 md:py-6 text-right text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEntries.map(entry => (
                  <tr 
                    key={entry.id} 
                    onClick={() => setSelectedEntry(entry)}
                    className={`cursor-pointer hover:bg-indigo-50/20 transition-all ${entry.status === SecurityStatus.OVERSTAY ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="flex-shrink-0">
                          {entry.photoUrl ? (
                            <img 
                              src={entry.photoUrl} 
                              alt="" 
                              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover shadow-sm hover:scale-105 transition-transform" 
                              onClick={(e) => { e.stopPropagation(); setFullSizePhotoUrl(entry.photoUrl!); }}
                            />
                          ) : (
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-base md:text-lg font-black ${
                              entry.category === SecurityCategory.PERSON ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              <i className={`fas ${entry.category === SecurityCategory.PERSON ? 'fa-user' : 'fa-box-open'}`}></i>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-black text-gray-900 leading-none mb-1 truncate">{entry.name}</p>
                          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate max-w-[120px]" title={entry.reason}>
                            {entry.reason || '--'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-tight bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                        {entry.subType}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      {entry.vehiclePresence ? (
                        <code className="text-[10px] md:text-xs font-black px-2 py-1 bg-white border border-gray-100 rounded-md text-indigo-600 whitespace-nowrap">
                          {entry.vehicleNumber}
                        </code>
                      ) : (
                        <span className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">None</span>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                      <div className="text-[9px] md:text-[10px] font-black space-y-1">
                        <p className="text-emerald-600"><span className="text-gray-400 mr-2">IN:</span> {new Date(entry.inTime).toLocaleTimeString()}</p>
                        <p className="text-red-400">
                          <span className="text-gray-400 mr-2">OUT:</span> 
                          {entry.outTime ? new Date(entry.outTime).toLocaleTimeString() : 'PENDING'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse ${
                          entry.status === SecurityStatus.OUT ? 'bg-gray-300 animate-none' : 
                          entry.status === SecurityStatus.OVERSTAY ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                        }`}></span>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                          entry.status === SecurityStatus.OUT ? 'text-gray-400' : 
                          entry.status === SecurityStatus.OVERSTAY ? 'text-red-600' : 'text-indigo-600'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                      {entry.status !== SecurityStatus.OUT && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkExit(entry.id);
                          }}
                          className="bg-white hover:bg-red-600 hover:text-white text-gray-400 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-gray-100 shadow-sm transition-all text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                        >
                          Log Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 md:py-24 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <i className="fas fa-folder-open text-4xl md:text-6xl mb-4 text-gray-300"></i>
                        <p className="text-sm md:text-xl font-black text-gray-400 uppercase tracking-widest">No Logs Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Initialize Entry Modal */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 overflow-y-auto bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl md:rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up my-auto">
            <div className="bg-indigo-900 p-6 md:p-8 flex justify-between items-center text-white">
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Security Protocol</h3>
                <p className="text-[8px] md:text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Registry Control</p>
              </div>
              <button onClick={() => setIsEntryModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto max-h-[80vh] md:max-h-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <div className="flex space-x-2">
                    {Object.values(SecurityCategory).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`flex-1 py-3 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                          formData.category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                  <select 
                    className={inputClasses}
                    value={formData.subType}
                    onChange={e => {
                      const val = e.target.value as SecuritySubType;
                      setFormData({ ...formData, subType: val, name: '', staffId: '', phoneNumber: '', vehicleNumber: '', reason: '' });
                    }}
                  >
                    {Object.values(SecuritySubType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              {/* Photo Section */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px]">
                {formData.photoUrl && !isCameraActive ? (
                  <div className="relative w-full h-40 md:h-48 group">
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-lg" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg transition-opacity"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ) : isCameraActive ? (
                  <div className="relative w-full aspect-video md:aspect-auto md:h-64 flex flex-col items-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl bg-black" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                      <button type="button" onClick={capturePhoto} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-colors">Capture Snapshot</button>
                      <button type="button" onClick={stopCamera} className="bg-white text-gray-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-gray-100 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex space-x-6">
                      <button type="button" onClick={startCamera} className="flex flex-col items-center group">
                        <div className="bg-white p-4 rounded-full text-indigo-500 mb-2 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><i className="fas fa-camera text-xl"></i></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Capture</span>
                      </button>
                      <div className="relative flex flex-col items-center group">
                        <div className="bg-white p-4 rounded-full text-indigo-500 mb-2 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><i className="fas fa-upload text-xl"></i></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Upload</span>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {formData.subType === SecuritySubType.STAFF ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Personnel</label>
                    <select 
                      required
                      className={inputClasses}
                      value={formData.staffId}
                      onChange={e => handleStaffSelect(e.target.value)}
                    >
                      <option value="">-- SELECT STAFF --</option>
                      {users.filter(u => u.isActive).map(u => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number (Auto-fill)</label>
                    <input 
                      required
                      className={inputClasses}
                      placeholder="CONTACT NUMBER"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Name</label>
                    <input 
                      required
                      className={inputClasses}
                      placeholder="FULL NAME"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <input 
                      required
                      className={inputClasses}
                      placeholder="CONTACT NUMBER"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Purpose</label>
                    <input 
                      required
                      className={inputClasses}
                      placeholder="PURPOSE OF ENTRY"
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-end">
                <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs font-black text-gray-700">Vehicle Presence</p>
                    <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-tight">Requirement</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.vehiclePresence} onChange={e => setFormData({ ...formData, vehiclePresence: e.target.checked })} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${formData.vehiclePresence ? 'text-gray-400' : 'text-gray-100'}`}>License ID</label>
                  <input required={formData.vehiclePresence} disabled={!formData.vehiclePresence} className={`${inputClasses} ${!formData.vehiclePresence ? 'opacity-30' : ''}`} placeholder="E.G. ABC-123" value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Arrival Time</label><input type="datetime-local" className={inputClasses} value={formData.inTime} onChange={e => setFormData({ ...formData, inTime: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Departure</label><input type="datetime-local" className={inputClasses} value={formData.expectedOutTime} onChange={e => setFormData({ ...formData, expectedOutTime: e.target.value })} /></div>
              </div>

              <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-4 pt-4 border-t border-gray-50">
                <button type="button" onClick={() => setIsEntryModalOpen(false)} className="px-6 md:px-8 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Discard</button>
                <button type="submit" className="bg-indigo-900 hover:bg-black text-white px-8 md:px-12 py-3 md:py-5 rounded-xl md:rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all transform hover:-translate-y-1">Establish Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entry Details Viewer Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl md:rounded-[40px] w-full max-w-4xl overflow-hidden shadow-2xl animate-scale-up my-auto">
            <div className="bg-indigo-900 p-6 md:p-8 flex justify-between items-start text-white relative">
              <div className="flex space-x-4 md:space-x-6">
                {selectedEntry.photoUrl ? (
                  <img src={selectedEntry.photoUrl} className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-3xl object-cover border-4 border-white/10 shadow-lg cursor-zoom-in hover:scale-105 transition-transform" alt="" onClick={() => setFullSizePhotoUrl(selectedEntry.photoUrl!)} />
                ) : (
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-white/10 flex items-center justify-center text-4xl border-4 border-white/10"><i className={`fas ${selectedEntry.category === SecurityCategory.PERSON ? 'fa-user' : 'fa-box-open'}`}></i></div>
                )}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-indigo-600 px-3 py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest">{selectedEntry.subType}</span>
                    <span className={`px-3 py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest ${selectedEntry.status === SecurityStatus.OUT ? 'bg-gray-600' : selectedEntry.status === SecurityStatus.OVERSTAY ? 'bg-red-600' : 'bg-emerald-600'}`}>{selectedEntry.status}</span>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black tracking-tight">{selectedEntry.name}</h3>
                  <p className="text-indigo-300 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Registry Log: #{selectedEntry.id.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><i className="fas fa-times"></i></button>
            </div>

            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-h-[60vh] md:max-h-none overflow-y-auto">
              <div className="space-y-6 md:col-span-2">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Telemetry Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Arrival Time</p><p className="text-xs md:text-sm font-black text-gray-900">{new Date(selectedEntry.inTime).toLocaleString()}</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Departure</p><p className="text-xs md:text-sm font-black text-gray-900">{selectedEntry.expectedOutTime ? new Date(selectedEntry.expectedOutTime).toLocaleString() : 'N/A'}</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Exit Time</p><p className="text-xs md:text-sm font-black text-red-600">{selectedEntry.outTime ? new Date(selectedEntry.outTime).toLocaleString() : 'PENDING EXIT'}</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle License</p><p className="text-xs md:text-sm font-black text-indigo-600">{selectedEntry.vehiclePresence ? selectedEntry.vehicleNumber : 'NO VEHICLE'}</p></div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 col-span-2"><p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Verified Contact</p><p className="text-xs md:text-sm font-black text-gray-900">{selectedEntry.phoneNumber || 'NOT PROVIDED'}</p></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Contextual Data</h4>
                  <div className="space-y-4">
                    <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2">Purpose for Factory Access</p><p className="text-sm font-medium text-indigo-900 leading-relaxed">{selectedEntry.reason || 'No specific purpose documented.'}</p></div>
                    {selectedEntry.remarks && <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Remarks</p><p className="text-sm font-medium text-gray-600 leading-relaxed">{selectedEntry.remarks}</p></div>}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Administrative Trail</h4>
                  <div className="bg-gray-900 p-6 rounded-3xl text-white space-y-4 shadow-xl">
                    <div><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Logged By</p><p className="text-xs font-black">{selectedEntry.createdByName}</p><p className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">Terminal ID: {selectedEntry.createdBy}</p></div>
                    <div className="pt-4 border-t border-white/10"><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Encryption Hash</p><code className="text-[8px] block truncate text-gray-500">{selectedEntry.id}-AES256-PROTO</code></div>
                  </div>
                </div>
                {selectedEntry.status !== SecurityStatus.OUT && <button onClick={() => handleMarkExit(selectedEntry.id)} className="w-full bg-red-600 hover:bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center space-x-3"><i className="fas fa-sign-out-alt"></i><span>Execute Gate Release</span></button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {fullSizePhotoUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setFullSizePhotoUrl(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all" onClick={() => setFullSizePhotoUrl(null)}><i className="fas fa-times text-2xl"></i></button>
          <img src={fullSizePhotoUrl} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain animate-scale-up" alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style>{`
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.2s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </Layout>
  );
};
