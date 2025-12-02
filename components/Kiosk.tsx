import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Minimize, Camera, QrCode, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { db } from '../services/mockDb';
import { Event } from '../types';

const Kiosk: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<{status: 'success' | 'error' | 'idle', message: string}>({ status: 'idle', message: '' });
  const [manualId, setManualId] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup initial event
  useEffect(() => {
    db.getEvents().then(events => {
      // Find the next upcoming event or the most recent one
      const sorted = events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActiveEvent(sorted[0]);
    });
  }, []);

  const enterKioskMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
      startCamera();
    } catch (e) {
      console.error("Fullscreen blocked or not supported", e);
      // Proceed even if fullscreen fails
      setHasStarted(true);
      startCamera();
    }
  };

  const exitKioskMode = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    setHasStarted(false);
    stopCamera();
  };

  const startCamera = async () => {
    setCameraActive(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setScanResult({ status: 'error', message: 'Camera access denied or unavailable.' });
      }
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Mock processing logic
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

    // Reset status after 3 seconds
    setTimeout(() => setScanResult({ status: 'idle', message: '' }), 3000);
  }, [activeEvent]);

  // Simulate a scan for demo purposes
  const simulateScan = () => {
    // Randomly pick a mock member ID
    const randomId = `m${Math.ceil(Math.random() * 5)}`;
    processAttendance(randomId);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(manualId) {
        processAttendance(manualId);
        setManualId('');
    }
  };

  // Landing Screen to Trigger Fullscreen (Browser Policy Requirement)
  // Now embedded within the main layout
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
           <h2 className="text-3xl font-bold text-slate-900">Kiosk Mode</h2>
           <p className="text-slate-500 mt-2">Launch the self-service attendance station.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full flex flex-col items-center">
          <div className="bg-indigo-100 p-4 rounded-full mb-6">
            <QrCode className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Scan</h3>
          <p className="text-slate-500 mb-8 text-center">
            This will launch a full-screen interface for 
            <span className="font-semibold text-slate-900"> {activeEvent?.name || 'the upcoming event'}</span>.
          </p>
          <button 
            onClick={enterKioskMode}
            className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/30"
          >
            <Maximize className="w-5 h-5" />
            Launch Fullscreen
          </button>
        </div>
      </div>
    );
  }

  // Active Kiosk Mode - Fixed Overlay
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-20">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Church of God</h1>
          <p className="text-slate-300 text-sm">
            {activeEvent ? `Check-in: ${activeEvent.name}` : 'No Active Event'}
          </p>
        </div>
        <button 
          onClick={exitKioskMode} 
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg transition-colors backdrop-blur-md border border-red-500/30"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Exit Kiosk</span>
        </button>
      </div>

      {/* Main Scan Area */}
      <div className="w-full max-w-lg flex flex-col gap-6 animate-in zoom-in duration-300 relative z-10">
        
        {/* Camera Viewport */}
        <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 bg-slate-800">
                <Camera className="w-16 h-16 opacity-50" />
                <p>Camera Inactive</p>
             </div>
          )}

          {/* Overlay Box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-white/30 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                {/* Scanning Laser Effect */}
                {cameraActive && <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 opacity-60 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-[scan_2s_linear_infinite]"></div>}
            </div>
          </div>
          
          {/* Result Overlay */}
          {scanResult.status !== 'idle' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 z-10">
              {scanResult.status === 'success' ? (
                 <CheckCircle className="w-20 h-20 text-green-500 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              ) : (
                 <AlertCircle className="w-20 h-20 text-red-500 mb-4" />
              )}
              <h2 className="text-2xl font-bold mb-2">{scanResult.status === 'success' ? 'Checked In!' : 'Error'}</h2>
              <p className="text-lg text-slate-300">{scanResult.message}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-4">
            <button 
                onClick={simulateScan} 
                className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
                <QrCode className="w-5 h-5" />
                Simulate Scan
            </button>
        </div>

        {/* Manual Entry */}
        <form onSubmit={handleManualSubmit} className="relative">
            <input 
                type="text" 
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder="Or enter Member ID manually..." 
                className="w-full bg-slate-800 border-none text-white placeholder-slate-500 rounded-xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white">
                →
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
      `}</style>
    </div>
  );
};

export default Kiosk;