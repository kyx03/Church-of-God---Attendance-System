
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Events from './components/Events';
import Kiosk from './components/Kiosk';
import Reports from './components/Reports';
import CheckInPage from './components/CheckInPage';
import { User, Lock, Loader2, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/mockDb';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [slogan, setSlogan] = useState('Puelay');

  useEffect(() => {
    db.getSettings().then(s => setSlogan(s.slogan));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 animate-gradient bg-[length:200%_200%]"></div>
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
         <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-8 border border-white/20 ring-1 ring-white/30">
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-gradient-to-br from-white to-blue-50 rounded-2xl mb-6 shadow-xl shadow-blue-900/10 transform hover:scale-110 transition-transform duration-500 ring-1 ring-blue-100/50">
             <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-sm" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-12 h-12 text-blue-900" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>';
                  }}
             />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 leading-tight">
            Church of God <span className="text-blue-600 font-bold block text-lg mt-1">{slogan}</span>
          </h1>
          <p className="text-slate-400 font-bold tracking-[0.2em] uppercase text-xs">Attendance Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-3 animate-in shake shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="group space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 group-focus-within:text-blue-600 transition-colors">Username</label>
            <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02] group-focus-within:-translate-y-1">
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
              <input 
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 font-medium placeholder:text-slate-400 shadow-inner focus:shadow-xl relative z-0"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="group space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 group-focus-within:text-blue-600 transition-colors">Password</label>
            <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02] group-focus-within:-translate-y-1">
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 font-medium placeholder:text-slate-400 shadow-inner focus:shadow-xl relative z-0"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-800 hover:to-indigo-800 transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 duration-200 mt-2"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center mb-4 uppercase tracking-widest font-bold">Quick Login (Testing Only)</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <button onClick={() => fillDemo('admin', 'password')} className="p-3 text-blue-800 bg-blue-50 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-blue-200 rounded-xl text-center font-semibold transition-all duration-300 group">
               <span className="block group-hover:-translate-y-0.5 transition-transform">Admin</span>
               <span className="block text-[10px] font-normal text-blue-500 opacity-70 group-hover:opacity-100">Full Access</span>
            </button>
            <button onClick={() => fillDemo('volunteer', 'password')} className="p-3 text-blue-800 bg-blue-50 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-blue-200 rounded-xl text-center font-semibold transition-all duration-300 group">
               <span className="block group-hover:-translate-y-0.5 transition-transform">Volunteer</span>
               <span className="block text-[10px] font-normal text-blue-500 opacity-70 group-hover:opacity-100">Scan Only</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
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
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-gradient {
            animation: gradient 15s ease infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Allow access to check-in page even without login
  if (!user) {
    // Check if current path matches checkin
    if (window.location.hash.startsWith('#/checkin/')) {
       // Simple wrapper for unauthenticated access to checkin
       return (
         <Router>
           <Routes>
              <Route path="/checkin/:eventId" element={<CheckInPage />} />
              <Route path="*" element={<LoginScreen />} />
           </Routes>
         </Router>
       );
    }
    return <LoginScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/checkin/:eventId" element={<CheckInPage />} />
        {/* Main Routes wrapped in Layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={user.role === 'volunteer' ? <Navigate to="/events" replace /> : <Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/events" element={<Events />} />
              <Route path="/kiosk" element={<Kiosk />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
