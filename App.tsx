
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Events from './components/Events';
import Kiosk from './components/Kiosk';
import Reports from './components/Reports';
import { User, Lock, Loader2, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
         <div className="absolute top-[30%] left-[20%] w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[60px] animate-bounce duration-[10000ms]"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-50 to-white rounded-full mb-4 shadow-lg shadow-blue-900/10 transform hover:scale-105 transition-transform duration-300 ring-1 ring-blue-100">
             <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-12 h-12 text-blue-900" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>';
                  }}
             />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Church of God</h1>
          <p className="text-blue-600 font-bold tracking-widest uppercase text-xs mt-2">Ministry Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1 group-focus-within:text-blue-600 transition-colors">Username</label>
            <div className="relative transform transition-all duration-200 group-focus-within:scale-[1.01]">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50/50 focus:bg-white text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1 group-focus-within:text-blue-600 transition-colors">Password</label>
            <div className="relative transform transition-all duration-200 group-focus-within:scale-[1.01]">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50/50 focus:bg-white text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center mb-4 uppercase tracking-wider font-bold">Quick Login (Testing)</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <button onClick={() => fillDemo('pastor', 'password')} className="p-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-center font-semibold transition-colors border border-blue-100">
               Pastor
               <span className="block text-[10px] font-normal text-blue-500">View Analytics</span>
            </button>
            <button onClick={() => fillDemo('admin', 'password')} className="p-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-center font-semibold transition-colors border border-blue-100">
               Admin
               <span className="block text-[10px] font-normal text-blue-500">Full Access</span>
            </button>
            <button onClick={() => fillDemo('secretary', 'password')} className="p-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-center font-semibold transition-colors border border-blue-100">
               Secretary
               <span className="block text-[10px] font-normal text-blue-500">Manage Events</span>
            </button>
            <button onClick={() => fillDemo('volunteer', 'password')} className="p-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-center font-semibold transition-colors border border-blue-100">
               Volunteer
               <span className="block text-[10px] font-normal text-blue-500">Scan Only</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Main Routes wrapped in Layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
