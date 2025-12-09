
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, QrCode, LogOut, BarChart3, Settings, X, Save, Edit2, Menu, UserPlus, Monitor, Upload, Moon, Sun, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/mockDb';
import { AppSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  /* START OF SETTINGS CHANGES */
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', password: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    churchName: 'Church of God',
    churchBranch: 'Puelay',
    churchLogo: '/logo.png',
    theme: 'light'
  });
  
  // Temp state for modal form
  const [tempSettings, setTempSettings] = useState<AppSettings>(appSettings);

  useEffect(() => {
    db.getSettings().then(s => {
        // Merge with defaults in case DB has old structure
        const merged = { 
            churchName: s.churchName || 'Church of God',
            churchBranch: s.churchBranch || s.slogan || 'Puelay',
            churchLogo: s.churchLogo || '/logo.png',
            theme: s.theme || 'light',
            slogan: s.slogan // Keep for legacy
        };
        setAppSettings(merged);
        setTempSettings(merged);
        
        // Apply Theme on load
        if (merged.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
  }, []);

  const openSettingsModal = () => {
      setTempSettings(appSettings);
      setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      await db.updateSettings(tempSettings);
      setAppSettings(tempSettings);
      
      // Apply Theme Immediately
      if (tempSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      
      setShowSettingsModal(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File is too large. Please select an image under 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTempSettings(prev => ({ ...prev, churchLogo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTheme = () => {
    setTempSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };
  /* END OF SETTINGS CHANGES */

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
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/members', label: 'Members', icon: Users, roles: ['admin'] },
    { path: '/guests', label: 'Guests', icon: UserPlus, roles: ['admin', 'volunteer'] },
    { path: '/events', label: 'Events', icon: Calendar, roles: ['admin', 'volunteer'] },
    { path: '/kiosk', label: 'Kiosk Mode', icon: QrCode, roles: ['admin', 'volunteer'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on Print */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-blue-900 dark:bg-slate-950 text-white flex flex-col shadow-xl 
        transform transition-transform duration-300 ease-in-out print:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header aligned with h-24 */}
        <div className="md:h-24 p-6 border-b border-blue-800 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {/* START OF SETTINGS CHANGES - Dynamic Logo */}
            <div className="p-1 bg-white rounded-lg h-12 w-12 flex items-center justify-center overflow-hidden flex-shrink-0">
               <img src={appSettings.churchLogo} alt="Logo" className="w-full h-full object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} 
               />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate">{appSettings.churchName}</h1>
              {/* Removed slogan update pencil here per request */}
              <div className="flex items-center gap-1 group">
                <p className="text-xs text-blue-200 truncate">{appSettings.churchBranch}</p>
              </div>
            </div>
            {/* END OF SETTINGS CHANGES */}
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
                    : 'text-blue-100 hover:bg-blue-800 dark:hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800 dark:border-slate-800 bg-blue-950 dark:bg-slate-950 shrink-0">
          <button 
            onClick={openProfile}
            className="flex items-center gap-3 mb-2 px-2 w-full hover:bg-blue-900 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-800 dark:bg-slate-800 flex items-center justify-center text-sm font-bold border border-blue-700 dark:border-slate-700">
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
          
          {/* START OF SETTINGS CHANGES - System Settings Button */}
          {user.role === 'admin' && (
            <button
                onClick={openSettingsModal}
                className="flex items-center gap-3 mb-2 px-4 py-2 w-full text-blue-200 hover:text-white hover:bg-blue-900 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
            >
                <Monitor className="w-4 h-4" />
                Site Settings
            </button>
          )}
          {/* END OF SETTINGS CHANGES */}

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
        <div className="md:hidden bg-blue-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between shadow-md z-20 print:hidden">
            <div className="flex items-center gap-3 min-w-0">
                 {/* START OF SETTINGS CHANGES - Dynamic Logo/Name */}
                 <img src={appSettings.churchLogo} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain bg-white rounded-md p-0.5 flex-shrink-0" />
                 <div className="min-w-0 flex items-center gap-2">
                    <span className="font-bold truncate text-sm sm:text-base">{appSettings.churchName} <span className="text-blue-200 font-normal text-xs sm:text-sm">{appSettings.churchBranch}</span></span>
                 </div>
                 {/* END OF SETTINGS CHANGES */}
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="flex-shrink-0 ml-2">
                <Menu className="w-6 h-6" />
            </button>
        </div>

        {/* Removed padding here to allow sticky headers to span full width */}
        <main className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 print:p-0 print:overflow-visible scroll-smooth">
          {children}
        </main>
      </div>

      {/* START OF SETTINGS CHANGES - Site Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <button onClick={() => setShowSettingsModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
              <Monitor className="w-5 h-5 text-blue-600" /> System Settings
            </h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Church Name */}
              <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">Church Name</label>
                  <input 
                    value={tempSettings.churchName}
                    onChange={e => setTempSettings({...tempSettings, churchName: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Church of God"
                  />
              </div>

              {/* Church Branch */}
              <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">Church Branch</label>
                  <input 
                    value={tempSettings.churchBranch}
                    onChange={e => setTempSettings({...tempSettings, churchBranch: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Main Branch"
                  />
              </div>

              {/* Logo Upload */}
              <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wider">Church Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                      {tempSettings.churchLogo ? (
                        <img src={tempSettings.churchLogo} alt="Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mb-1"
                      >
                        <Upload className="w-4 h-4" /> Click to Upload
                      </button>
                      <p className="text-[10px] text-slate-400 leading-tight">Recommended: Square PNG with transparent background. Max 2MB.</p>
                    </div>
                  </div>
              </div>

              {/* Theme Toggle Button */}
              <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wider">Appearance</label>
                  <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600 relative">
                      {/* Sliding Background */}
                      <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-600 rounded-md shadow-sm transition-all duration-300 ease-in-out ${tempSettings.theme === 'dark' ? 'translate-x-[100%] left-[2px]' : 'translate-x-0 left-1'}`}
                      ></div>
                      
                      <button 
                        type="button"
                        onClick={() => setTempSettings(s => ({ ...s, theme: 'light' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold relative z-10 transition-colors ${tempSettings.theme === 'light' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        <Sun className="w-4 h-4" /> Light
                      </button>
                      <button 
                        type="button"
                        onClick={() => setTempSettings(s => ({ ...s, theme: 'dark' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold relative z-10 transition-colors ${tempSettings.theme === 'dark' ? 'text-blue-300 dark:text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        <Moon className="w-4 h-4" /> Dark
                      </button>
                  </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]">
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END OF SETTINGS CHANGES */}

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
