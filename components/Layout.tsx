
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, QrCode, LogOut, BarChart3, Settings, X, Save, Edit2, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDb';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSloganModal, setShowSloganModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', password: '' });
  
  // Settings State
  const [slogan, setSlogan] = useState('Puelay');
  const [tempSlogan, setTempSlogan] = useState('');

  useEffect(() => {
    db.getSettings().then(s => setSlogan(s.slogan));
  }, []);

  if (!user) {
    return <>{children}</>;
  }

  const openProfile = () => {
    setEditForm({ name: user.name, username: user.username, password: '' });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    if (editForm.name) updates.name = editForm.name;
    if (editForm.username) updates.username = editForm.username;
    if (editForm.password) updates.password = editForm.password;
    
    await updateProfile(updates);
    setShowProfileModal(false);
    alert('Profile updated successfully!');
  };

  const openSloganEdit = () => {
    setTempSlogan(slogan);
    setShowSloganModal(true);
  };

  const handleUpdateSlogan = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.updateSettings({ slogan: tempSlogan });
    setSlogan(tempSlogan);
    setShowSloganModal(false);
  };

  // Define menu items based on roles
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/members', label: 'Members', icon: Users, roles: ['admin'] },
    { path: '/events', label: 'Events', icon: Calendar, roles: ['admin', 'volunteer'] },
    { path: '/kiosk', label: 'Kiosk Mode', icon: QrCode, roles: ['admin', 'volunteer'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on Print */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-blue-900 text-white flex flex-col shadow-xl 
        transform transition-transform duration-300 ease-in-out print:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-blue-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white rounded-lg h-10 w-10 flex items-center justify-center overflow-hidden flex-shrink-0">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} 
               />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate">Church of God</h1>
              <div className="flex items-center gap-1 group cursor-pointer">
                <p className="text-xs text-blue-200 truncate">{slogan}</p>
                {user.role === 'admin' && (
                  <button onClick={openSloganEdit} className="opacity-70 hover:opacity-100">
                    <Edit2 className="w-3 h-3 text-blue-300 hover:text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' 
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800 bg-blue-950">
          <button 
            onClick={openProfile}
            className="flex items-center gap-3 mb-4 px-2 w-full hover:bg-blue-900 p-2 rounded-lg transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-sm font-bold border border-blue-700">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <div className="flex items-center gap-2">
                 <p className="text-xs text-blue-300 capitalize">{user.role}</p>
                 <Settings className="w-3 h-3 text-blue-400" />
              </div>
            </div>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-300 hover:bg-red-950/30 rounded-lg transition-colors hover:text-red-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden print:overflow-visible print:h-auto">
        {/* Mobile Header - Hidden on Print */}
        <div className="md:hidden bg-blue-900 text-white p-4 flex items-center justify-between shadow-md z-20 print:hidden">
            <div className="flex items-center gap-3 min-w-0">
                 <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain bg-white rounded-md p-0.5 flex-shrink-0" />
                 <div className="min-w-0 flex items-center gap-2">
                    <span className="font-bold truncate text-sm sm:text-base">Church of God <span className="text-blue-200 font-normal">{slogan}</span></span>
                     {user.role === 'admin' && (
                      <button onClick={openSloganEdit} className="p-1 hover:bg-blue-800 rounded-full transition-colors flex-shrink-0">
                        <Edit2 className="w-3 h-3 text-blue-200" />
                      </button>
                    )}
                 </div>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="flex-shrink-0 ml-2">
                <Menu className="w-6 h-6" />
            </button>
        </div>

        {/* Removed padding here to allow sticky headers to span full width */}
        <main className="flex-1 overflow-y-auto w-full bg-slate-50 print:p-0 print:overflow-visible scroll-smooth">
          {children}
        </main>
      </div>

      {/* Slogan Edit Modal */}
      {showSloganModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowSloganModal(false)} className="absolute right-4 top-4 text-slate-400"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold mb-4 text-slate-900">Edit</h3>
            <form onSubmit={handleUpdateSlogan}>
              <input 
                value={tempSlogan}
                onChange={e => setTempSlogan(e.target.value)}
                className="w-full border border-slate-300 p-2 rounded mb-4 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new slogan"
              />
              <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded font-bold">Save</button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Edit Profile</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input 
                  type="text"
                  required
                  value={editForm.username}
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editForm.password}
                  onChange={e => setEditForm({...editForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" 
                />
                <p className="text-xs text-slate-500 mt-1">Optional. Enter a new password to change it.</p>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center justify-center gap-2">
                   <Save className="w-4 h-4" />
                   Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
