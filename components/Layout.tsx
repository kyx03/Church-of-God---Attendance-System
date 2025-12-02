
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, QrCode, LogOut, BarChart3, Settings, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', password: '' });

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

  // Define menu items based on roles
  const menuItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['admin', 'pastor'] 
    },
    { 
      path: '/members', 
      label: 'Members', 
      icon: Users, 
      roles: ['admin', 'secretary'] 
    },
    { 
      path: '/events', 
      label: 'Events', 
      icon: Calendar, 
      roles: ['admin', 'secretary', 'pastor'] 
    },
    { 
      path: '/kiosk', 
      label: 'Kiosk Mode', 
      icon: QrCode, 
      roles: ['admin', 'volunteer', 'secretary'] 
    },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: BarChart3, 
      roles: ['admin', 'pastor', 'secretary'] 
    },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Church of God</h1>
              <p className="text-xs text-slate-400">Ministry Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <button 
            onClick={openProfile}
            className="flex items-center gap-3 mb-4 px-2 w-full hover:bg-slate-800 p-2 rounded-lg transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <div className="flex items-center gap-2">
                 <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                 <Settings className="w-3 h-3 text-slate-600" />
              </div>
            </div>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                  className="w-full px-3 py-2 border rounded-lg" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input 
                  type="text"
                  required
                  value={editForm.username}
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editForm.password}
                  onChange={e => setEditForm({...editForm, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" 
                />
                <p className="text-xs text-slate-500 mt-1">Optional. Enter a new password to change it.</p>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2">
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
