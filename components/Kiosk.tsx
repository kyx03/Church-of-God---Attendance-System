
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Camera, QrCode, CheckCircle, AlertCircle, LogOut, Calendar, PlayCircle, Clock, X, ChevronLeft, ChevronRight, Search, Keyboard } from 'lucide-react';
import { db } from '../services/mockDb';
import { Event } from '../types';

const ITEMS_PER_PAGE = 9;

const Kiosk: React.FC = () => {
  const [step, setStep] = useState<'select' | 'active'>('select');
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<{status: 'success' | 'error' | 'idle', message: string}>({ status: 'idle', message: '' });
  const [manualId, setManualId] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeCheckInterval = useRef<any>(null);

  useEffect(() => {
    db.getEvents().then(allEvents => {
      // Filter out completed and cancelled events
      const validEvents = allEvents
        .filter(e => e.status !== 'completed' && e.status !== 'cancelled')
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(validEvents);
    });
    // Cleanup on unmount
    return () => {
        stopCamera();
        if (timeCheckInterval.current) clearInterval(timeCheckInterval.current);
    };
  }, []);

  // Time check logic
  useEffect(() => {
      if (step === 'active' && activeEvent) {
          // Check every minute
          timeCheckInterval.current = setInterval(() => {
              const startTime = new Date(activeEvent.date).getTime();
              const now = Date.now();
              // Assume default duration is 90 minutes (5400000 ms)
              const duration = 90 * 60 * 1000; 
              
              if (now > startTime + duration) {
                  setShowTimeWarning(true);
              }
          }, 60000); 
      }
      return () => {
          if (timeCheckInterval.current) clearInterval(timeCheckInterval.current);
      }
  }, [step, activeEvent]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredEvents = events.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const selectEvent = async (event: Event) => {
      // Mark event as in-progress automatically
      await db.updateEvent(event.id, { status: 'in-progress' });
      setActiveEvent({ ...event, status: 'in-progress' });
      setStep('active');
      enterKioskMode();
  };

  const enterKioskMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request denied or not supported.", e);
    }
    startCamera();
  };

  const exitKioskMode = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    setStep('select');
    setActiveEvent(null);
    stopCamera();
    setShowTimeWarning(false);
  };

  const markEventCompleted = async () => {
      if (activeEvent) {
          await db.updateEvent(activeEvent.id, { status: 'completed' });
          exitKioskMode();
          // Refresh list
          const allEvents = await db.getEvents();
          setEvents(allEvents.filter(e => e.status !== 'completed' && e.status !== 'cancelled').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
  };

  const extendTime = async () => {
      // Simply hide warning and assume extended for session
      setShowTimeWarning(false);
      if (timeCheckInterval.current) clearInterval(timeCheckInterval.current);
  };

  const startCamera = async () => {
    setScanResult({ status: 'idle', message: '' });
    if (streamRef.current) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available.");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setScanResult({ status: 'error', message: "Camera access required." });
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  };

  const processAttendance = useCallback(async (memberId: string) => {
    if (!activeEvent) return;

    try {
      const members = await db.getMembers();
      const member = members.find(m => m.id === memberId);
      
      if (member) {
        await db.markAttendance({
          id: `att${Date.now()}`,
          eventId: activeEvent.id,
          memberId: member.id,
          timestamp: new Date().toISOString(),
          method: 'qr'
        });
        setScanResult({ status: 'success', message: `Welcome, ${member.firstName}!` });
      } else {
        setScanResult({ status: 'error', message: 'Member ID not found.' });
      }
    } catch (e) {
      setScanResult({ status: 'error', message: 'System error.' });
    }

    setTimeout(() => setScanResult({ status: 'idle', message: '' }), 3000);
  }, [activeEvent]);

  const simulateScan = () => {
    // For demo, assume we have members with these IDs
    processAttendance('AB12C3'); 
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(manualId) {
        processAttendance(manualId.toUpperCase());
        setManualId('');
    }
  };

  if (step === 'select') {
    return (
      <div className="flex flex-col h-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 shadow-sm">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">Kiosk Setup</h2>
                    <p className="text-slate-500">Select an event to start attendance tracking.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search events..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedEvents.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No upcoming events found.</p>
                        {searchTerm && <p className="text-sm text-slate-400 mt-1">Try adjusting your search.</p>}
                        {!searchTerm && <p className="text-sm text-slate-400">Please schedule an event first.</p>}
                    </div>
                ) : paginatedEvents.map(event => (
                    <button 
                        key={event.id}
                        onClick={() => selectEvent(event)}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group relative overflow-hidden h-full flex flex-col justify-between"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">{event.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 shrink-0" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${event.status === 'in-progress' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                {event.status === 'in-progress' ? 'Resuming' : 'Start'}
                            </span>
                            <PlayCircle className="w-8 h-8 text-slate-200 group-hover:text-blue-600 transition-colors" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Pagination */}
            {filteredEvents.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center items-center mt-8 gap-4">
                  <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                      <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
                  <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                      <ChevronRight className="w-5 h-5" />
                  </button>
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-900 text-white">
      {/* Background Copy */}
      <div className="absolute inset-0 overflow-hidden z-0">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 animate-gradient bg-[length:200%_200%]"></div>
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
         <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>
      
       {/* Floating Geometric Shapes & Particles (Glassmorphism) - Copy from Login */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-24 h-24 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md animate-float animation-delay-0 rotate-12 shadow-2xl shadow-blue-500/10"></div>
          <div className="absolute bottom-[20%] right-[10%] w-40 h-40 border border-white/5 rounded-full bg-blue-500/5 backdrop-blur-xl animate-float animation-delay-2000 shadow-2xl shadow-purple-500/10"></div>
          <div className="absolute top-[25%] right-[20%] w-16 h-16 border border-white/10 rounded-2xl bg-indigo-500/10 backdrop-blur-md animate-float-slow animation-delay-4000 rotate-45"></div>
          <div className="absolute bottom-[30%] left-[15%] w-20 h-20 border border-white/10 rounded-full bg-emerald-500/5 backdrop-blur-sm animate-float animation-delay-1000"></div>

          {/* Floating Particles */}
          {[...Array(15)].map((_, i) => (
            <div 
                key={i}
                className="absolute bg-white/20 rounded-full animate-pulse"
                style={{
                    width: Math.random() * 4 + 2 + 'px',
                    height: Math.random() * 4 + 2 + 'px',
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                    animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
                    animationDelay: `-${Math.random() * 10}s`,
                    opacity: Math.random() * 0.5 + 0.1
                }}
            ></div>
          ))}
      </div>

      {/* Time Warning Modal */}
      {showTimeWarning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Event Finished?</h3>
                  <p className="text-slate-500 mb-6">
                      The scheduled time for <strong>{activeEvent?.name}</strong> has passed. 
                      Would you like to mark it as completed or keep the kiosk running?
                  </p>
                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={markEventCompleted}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                          <CheckCircle className="w-5 h-5" />
                          Yes, Mark as Completed
                      </button>
                      <button 
                          onClick={extendTime}
                          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                      >
                          Extend Time (Keep Open)
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-20">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md">Church of God</h1>
          <p className="text-slate-200 text-sm flex items-center gap-2 font-medium drop-shadow">
            {activeEvent ? (
                <>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse box-shadow-glow"></span>
                    Check-in: {activeEvent.name}
                </>
            ) : 'No Active Event'}
          </p>
        </div>
        <button 
          onClick={exitKioskMode} 
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-lg transition-colors backdrop-blur-md border border-red-500/30 shadow-lg"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Exit Kiosk</span>
        </button>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-6 animate-in zoom-in duration-300 relative z-10">
        <div className="relative aspect-square bg-black/40 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl ring-1 ring-white/10">
          {cameraActive ? (
            <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute top-8 left-0 right-0 text-center z-20 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-md text-white px-6 py-2 rounded-full inline-block font-medium border border-white/20 shadow-lg text-sm md:text-base">
                        Position QR code in the frame
                    </div>
                </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 p-6 text-center">
                <Camera className="w-16 h-16 opacity-50" />
                <p className="text-red-300 font-medium">{scanResult.status === 'error' ? scanResult.message : 'Starting Camera...'}</p>
                {scanResult.status === 'error' && (
                    <button onClick={startCamera} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg">
                        Retry Camera
                    </button>
                )}
             </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-white/30 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                {cameraActive && <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 opacity-60 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-[scan_2s_linear_infinite]"></div>}
            </div>
          </div>
          
          {scanResult.status !== 'idle' && scanResult.status !== 'error' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 z-10">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              <h2 className="text-2xl font-bold mb-2">Checked In!</h2>
              <p className="text-lg text-slate-300">{scanResult.message}</p>
            </div>
          )}
        </div>

        {/* Instruction Box (New) */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center shadow-lg transform transition-all hover:bg-white/15">
            <p className="text-sm font-bold text-blue-100 mb-2 uppercase tracking-wider">How to Check In</p>
            <div className="flex justify-center gap-6 text-xs text-slate-200 font-medium">
               <span className="flex items-center gap-1.5"><QrCode className="w-4 h-4 text-blue-300" /> Scan QR Code</span>
               <span className="flex items-center text-white/40">|</span>
               <span className="flex items-center gap-1.5"><Keyboard className="w-4 h-4 text-blue-300" /> Type ID Below</span>
            </div>
        </div>

        <div className="flex gap-4">
            <button 
                onClick={simulateScan} 
                className="flex-1 py-3.5 bg-slate-800/80 backdrop-blur-sm text-slate-300 rounded-xl font-bold text-lg hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/10 shadow-lg"
            >
                <QrCode className="w-5 h-5" />
                <span className="text-sm">Simulate</span>
            </button>
        </div>

        <form onSubmit={handleManualSubmit} className="relative">
            <input 
                type="text" 
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder="Or enter Member ID manually..." 
                className="w-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-white placeholder-slate-400 rounded-xl py-3.5 px-6 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono tracking-wider shadow-xl transition-all focus:bg-slate-800"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-700/80 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
            </button>
        </form>
      </div>
       <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-gradient {
            animation: gradient 15s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 9s ease-in-out infinite;
        }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default Kiosk;
