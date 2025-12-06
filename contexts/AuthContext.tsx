
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: { name?: string; username?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize user state from localStorage to persist login across reloads
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('church_app_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to restore session", e);
      return null;
    }
  });

  const login = async (username: string, password: string) => {
    try {
      const userData = await db.login(username, password);
      if (userData) {
        setUser(userData);
        localStorage.setItem('church_app_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('church_app_user');
  };

  const updateProfile = async (updates: { name?: string; username?: string; password?: string }) => {
    if (!user) return;
    const updatedUser = await db.updateUser(user.id, updates);
    if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('church_app_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
