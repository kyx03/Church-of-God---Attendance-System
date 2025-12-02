
import { MOCK_MEMBERS, MOCK_EVENTS, MOCK_ATTENDANCE, MOCK_USERS } from '../constants';
import { Member, Event, AttendanceRecord, User } from '../types';

// Simple in-memory storage for the session
let members = [...MOCK_MEMBERS];
let events = [...MOCK_EVENTS];
let attendance = [...MOCK_ATTENDANCE];
let users = [...MOCK_USERS];

export const db = {
  // --- Auth & Users ---
  login: (username: string, password: string): Promise<User | null> => {
    // In a real app, this calls the backend API
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return Promise.resolve(null);
    
    // Return user without password
    const { password: _, ...safeUser } = user;
    return Promise.resolve(safeUser);
  },

  updateUser: (id: string, updates: { name?: string; username?: string; password?: string }) => {
    users = users.map(u => {
      if (u.id === id) {
        return { ...u, ...updates };
      }
      return u;
    });
    const updated = users.find(u => u.id === id);
    if(updated) {
        const { password: _, ...safeUser } = updated;
        return Promise.resolve(safeUser);
    }
    return Promise.resolve(null);
  },

  // --- Members ---
  getMembers: () => Promise.resolve(members),
  addMember: (member: Member) => {
    members = [...members, member];
    return Promise.resolve(member);
  },
  updateMember: (id: string, updates: Partial<Member>) => {
    members = members.map(m => m.id === id ? { ...m, ...updates } : m);
    return Promise.resolve();
  },
  deleteMember: (id: string) => {
    members = members.filter(m => m.id !== id);
    return Promise.resolve();
  },

  // --- Events ---
  getEvents: () => Promise.resolve(events),
  addEvent: (event: Event) => {
    events = [...events, event];
    return Promise.resolve(event);
  },

  // --- Attendance ---
  getAttendance: () => Promise.resolve(attendance),
  markAttendance: (record: AttendanceRecord) => {
    // Prevent duplicates
    const exists = attendance.find(a => a.eventId === record.eventId && a.memberId === record.memberId);
    if (!exists) {
      attendance = [...attendance, record];
    }
    return Promise.resolve();
  }
};
