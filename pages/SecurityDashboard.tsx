
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

const COUNTRY_CODES = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+971', country: 'UAE' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+81', country: 'Japan' },
];

const formatForInput = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const getFutureTime = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export const SecurityDashboard: React.FC = () => {
  const { authState, users } = useAuth();
  const [entries, setEntries] = useState<SecurityEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<SecurityCategory | 'All'>('All');
  const [filterSubType, setFilterSubType] = useState<SecuritySubType | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'today' | 'active' | 'pending'>('today');

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [countryCode, setCountryCode] = useState('+91');
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
    expectedOutTime: getFutureTime(1),
    photoUrl: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('pspms_security_logs');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse security logs", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isCameraModalOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraModalOpen, facingMode]);

  useEffect(() => {
    if (formData.subType === SecuritySubType.STAFF && formData.name.length > 2) {
      const searchName = formData.name.toLowerCase();
      const matchedUser = users.find(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchName)
      );

      if (matchedUser) {
        let strippedPhone = matchedUser.phoneNumber || '';
        const foundCode = COUNTRY_CODES.find(c => strippedPhone.startsWith(c.code));
        if (foundCode) {
          setCountryCode(foundCode.code);
          strippedPhone = strippedPhone.replace(foundCode.code, '').trim();
        }

        setFormData(prev => ({
          ...prev,
          phoneNumber: strippedPhone.slice(0, 10),
          vehicleNumber: matchedUser.vehicleNumber || prev.vehicleNumber,
          vehiclePresence: !!matchedUser.vehicleNumber || prev.vehiclePresence
        }));
        return;
      }
    }
  }, [formData.name, formData.subType, users]);

  const startCamera = async (mode: 'user' | 'environment') => {
    setIsCameraReady(false);
    try {
      const constraints: MediaStreamConstraints = { 
        video: { facingMode: { ideal: mode } }, 
        audio: false 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Camera play failed", e);
        }
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        setHasFlash(!!capabilities.torch);
      }
    } catch (err) {
      console.error("Camera access failed", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsFlashOn(false);
    setIsCameraReady(false);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] } as any);
      setIsFlashOn(!isFlashOn);
    } catch (err) {
      console.error("Flash toggle failed", err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
        setIsCameraModalOpen(false);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const computedEntries = useMemo(() => {
    const now = new Date();
    return entries.map(entry => {
      if (entry.status === SecurityStatus.IN) {
        const inTime = new Date(entry.inTime);
        const diffHours = (now.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        if (diffHours >= OVERSTAY_THRESHOLD_HOURS) return { ...entry, status: SecurityStatus.OVERSTAY };
      }
      return entry;
    });
  }, [entries]);

  const filteredEntries = computedEntries.filter(entry => {
    const entryDate = new Date(entry.inTime).toDateString();
    const today = new Date().toDateString();
    
    if (activeTab === 'today' && entryDate !== today) return false;
    if (activeTab === 'active' && entry.status === SecurityStatus.OUT) return false;
    if (activeTab === 'pending' && entry.status === SecurityStatus.OUT) return false;
    if (filterCategory !== 'All' && entry.category !== filterCategory) return false;
    if (filterSubType !== 'All' && entry.subType !== filterSubType) return false;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
            entry.name.toLowerCase().includes(query) ||
            (entry.vehicleNumber && entry.vehicleNumber.toLowerCase().includes(query))
        );
    }
    return true;
  });

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      const newEntry: SecurityEntry = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        phoneNumber: `${countryCode} ${formData.phoneNumber}`,
        inTime: new Date(formData.inTime).toISOString(),
        status: SecurityStatus.IN,
        createdBy: authState.user?.id || 'sys',
        createdByName: `${authState.user?.firstName} ${authState.user?.lastName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setEntries(prev => {
        const updated = [newEntry, ...prev];
        localStorage.setItem('pspms_security_logs', JSON.stringify(updated));
        return updated;
      });

      setIsSubmitting(false);
      setIsEntryModalOpen(false);
      resetForm();
    }, 150);
  };

  const handleMarkExit = (id: string) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { 
        ...e, 
        status: SecurityStatus.OUT, 
        outTime: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      } : e);
      localStorage.setItem('pspms_security_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const resetForm = () => {
    setCountryCode('+91');
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
      expectedOutTime: getFutureTime(1),
      photoUrl: ''
    });
  };

  const labelClasses = "text-xs font-semibold text-gray-600 mb-1 block";
  const inputClasses = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white text-gray-900 shadow-sm";

  return (
    <Layout title="Security Management">
      <div className="space-y-6">
        {/* Simple Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Personnel IN', val: computedEntries.filter(e => e.status !== SecurityStatus.OUT && e.category === SecurityCategory.PERSON).length, color: 'text-indigo-600' },
            { label: 'Vehicles IN', val: computedEntries.filter(e => e.status !== SecurityStatus.OUT && e.vehiclePresence).length, color: 'text-blue-600' },
            { label: 'Total Logs', val: computedEntries.length, color: 'text-gray-600' },
            { label: 'Overstay Warnings', val: computedEntries.filter(e => e.status === SecurityStatus.OVERSTAY).length, color: 'text-red-600' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto no-scrollbar">
              {(['today', 'active', 'pending'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                    activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { resetForm(); setIsEntryModalOpen(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap"
              >
                <i className="fas fa-plus"></i> New Entry
              </button>
            </div>
        </div>

        {/* Desktop Table View (lg screens and up) */}
        <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Identity</th>
                  <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Type</th>
                  <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Timing</th>
                  <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden cursor-zoom-in"
                          onClick={() => entry.photoUrl && setPreviewImageUrl(entry.photoUrl)}
                        >
                          {entry.photoUrl ? (
                            <img src={entry.photoUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <i className="fas fa-user text-gray-300"></i>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{entry.name}</p>
                          <p className="text-[10px] text-gray-500">{entry.phoneNumber || 'No Contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-600">{entry.subType}</span>
                    </td>
                    <td className="px-6 py-4">
                      {entry.vehiclePresence ? <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{entry.vehicleNumber}</span> : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] leading-tight">
                        <p className="text-green-600">IN: {new Date(entry.inTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        {entry.outTime && <p className="text-red-500">OUT: {new Date(entry.outTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                        entry.status === SecurityStatus.OUT 
                          ? 'bg-gray-50 text-gray-400 border-gray-200' 
                          : entry.status === SecurityStatus.OVERSTAY 
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {entry.status !== SecurityStatus.OUT && (
                        <button onClick={() => handleMarkExit(entry.id)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-xs font-semibold shadow-sm transition-all">
                          Mark Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile & Tablet Card Layout (lg:hidden) */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden"
                    onClick={() => entry.photoUrl && setPreviewImageUrl(entry.photoUrl)}
                  >
                    {entry.photoUrl ? (
                      <img src={entry.photoUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <i className="fas fa-user text-gray-300"></i>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{entry.name}</h4>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{entry.subType}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 pt-4 border-t border-gray-50">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                    entry.status === SecurityStatus.OUT 
                      ? 'bg-gray-50 text-gray-400 border-gray-200' 
                      : entry.status === SecurityStatus.OVERSTAY 
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {entry.status}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle</p>
                  <p className="text-[11px] font-mono font-bold text-gray-700">{entry.vehiclePresence ? entry.vehicleNumber : 'N/A'}</p>
                </div>
              </div>

              {entry.status !== SecurityStatus.OUT && (
                <button 
                  onClick={() => handleMarkExit(entry.id)}
                  className="w-full bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Confirm Exit
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Entry Modal and Camera Modals remain the same ... */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-scale-up border border-gray-200">
            <div className="bg-indigo-700 px-8 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">New Security Registry Entry</h3>
              <button onClick={() => setIsEntryModalOpen(false)} className="hover:opacity-75"><i className="fas fa-times"></i></button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={labelClasses}>Category</label>
                    <select className={inputClasses} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as SecurityCategory})}>
                      <option value={SecurityCategory.PERSON}>Person</option>
                      <option value={SecurityCategory.MATERIAL}>Material</option>
                    </select>
                 </div>
                 <div>
                    <label className={labelClasses}>Entry Type</label>
                    <select className={inputClasses} value={formData.subType} onChange={e => setFormData({...formData, subType: e.target.value as SecuritySubType})}>
                      {Object.values(SecuritySubType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
               </div>
               
               <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center">
                  {formData.photoUrl ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                      <img src={formData.photoUrl} className="w-full h-full object-contain cursor-zoom-in" alt="ID Capture" onClick={() => setPreviewImageUrl(formData.photoUrl)} />
                      <button type="button" onClick={() => setFormData({...formData, photoUrl: ''})} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"><i className="fas fa-trash"></i></button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setIsCameraModalOpen(true)} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-300 rounded-xl hover:bg-indigo-50 transition-all">
                        <i className="fas fa-camera text-xl text-indigo-600"></i>
                        <span className="text-[10px] font-bold uppercase">Camera</span>
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-300 rounded-xl hover:bg-indigo-50 transition-all">
                        <i className="fas fa-upload text-xl text-indigo-600"></i>
                        <span className="text-[10px] font-bold uppercase">Upload</span>
                      </button>
                      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className={labelClasses}>Full Name</label>
                    <input required className={inputClasses} placeholder="Enter name..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                 </div>
                 <div>
                    <label className={labelClasses}>Phone Number</label>
                    <div className="flex gap-2">
                      <select 
                        className="w-24 px-2 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                        ))}
                      </select>
                      <input 
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        className={inputClasses} 
                        placeholder="10 digit number" 
                        value={formData.phoneNumber} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length <= 10) {
                            setFormData({ ...formData, phoneNumber: val });
                          }
                        }} 
                      />
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <span className="text-xs font-semibold flex-grow">Is a vehicle present?</span>
                    <input type="checkbox" checked={formData.vehiclePresence} onChange={e => setFormData({ ...formData, vehiclePresence: e.target.checked })} className="w-5 h-5 accent-indigo-600" />
                 </div>
                 <div>
                    <label className={labelClasses}>Vehicle Number</label>
                    <input 
                      disabled={!formData.vehiclePresence} 
                      className={inputClasses} 
                      placeholder="e.g. MH 12 AB 1234" 
                      value={formData.vehicleNumber} 
                      onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })} 
                    />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div><label className={labelClasses}>Entry Time</label><input type="datetime-local" className={inputClasses} value={formData.inTime} onChange={e => setFormData({ ...formData, inTime: e.target.value })} /></div>
                 <div><label className={labelClasses}>Expected Exit</label><input type="datetime-local" className={inputClasses} value={formData.expectedOutTime} onChange={e => setFormData({ ...formData, expectedOutTime: e.target.value })} /></div>
               </div>

               <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEntryModalOpen(false)} className="px-6 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {isSubmitting ? (
                      <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                    ) : (
                      'Create Entry'
                    )}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
             <div className="flex-grow bg-black relative flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  onLoadedMetadata={() => setIsCameraReady(true)}
                  className={`max-h-[70vh] w-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                />
                {!isCameraReady && <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs uppercase tracking-widest font-bold">Initializing Lens...</div>}
                <div className="absolute inset-0 border-[30px] border-black/20 pointer-events-none"></div>
             </div>
             
             <div className="p-8 flex items-center justify-center bg-white border-t border-gray-100">
                <div className="flex items-center gap-10">
                    <button 
                      type="button"
                      onClick={() => setIsCameraModalOpen(false)} 
                      className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-red-50 text-gray-600 transition-all"
                    >
                      <i className="fas fa-times text-xl"></i>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={capturePhoto} 
                      className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center border-4 border-white shadow-[0_10px_40px_rgba(79,70,229,0.3)] active:scale-90 transition-all"
                    >
                      <i className="fas fa-camera text-2xl"></i>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                      className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 transition-all"
                    >
                      <i className="fas fa-sync text-xl"></i>
                    </button>
                    
                    {hasFlash && (
                      <button 
                        type="button"
                        onClick={toggleFlash} 
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isFlashOn ? 'bg-yellow-400 border-yellow-500 text-white' : 'bg-gray-50 border border-gray-200 text-gray-400'}`}
                      >
                        <i className="fas fa-bolt text-xl"></i>
                      </button>
                    )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm cursor-zoom-out" onClick={() => setPreviewImageUrl(null)}>
            <img src={previewImageUrl} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Preview Fullscreen" />
            <button className="absolute top-6 right-6 text-white text-3xl"><i className="fas fa-times"></i></button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scale-up { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.2s ease-out; }
        
        input[type="datetime-local"] {
          position: relative;
        }
        
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </Layout>
  );
};
