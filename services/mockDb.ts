
import { Member, Event, AttendanceRecord, User, AppSettings } from '../types';

const API_URL = 'http://localhost:5000/api';

const fetchJson = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
  } catch (err) {
    console.error(`Fetch error for ${endpoint}:`, err);
    throw err;
  }
};

export const db = {
  // --- Auth & Users ---
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const user = await fetchJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      return user;
    } catch {
      return null;
    }
  },

  updateUser: async (id: string, updates: { name?: string; username?: string; password?: string }) => {
    return fetchJson(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  // --- Settings ---
  getSettings: async (): Promise<AppSettings> => {
    try {
        return await fetchJson('/settings');
    } catch {
        return { slogan: 'Puelay' };
    }
  },
  updateSettings: async (newSettings: Partial<AppSettings>) => {
    return fetchJson('/settings', { method: 'PUT', body: JSON.stringify(newSettings) });
  },

  // --- Members ---
  getMembers: () => fetchJson('/members'),
  addMember: (member: Member) => fetchJson('/members', { method: 'POST', body: JSON.stringify(member) }),
  updateMember: (id: string, updates: Partial<Member>) => fetchJson(`/members/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteMember: (id: string) => fetchJson(`/members/${id}`, { method: 'DELETE' }),

  // --- Events ---
  getEvents: () => fetchJson('/events'),
  addEvent: (event: Event) => fetchJson('/events', { method: 'POST', body: JSON.stringify(event) }),
  updateEvent: (id: string, updates: Partial<Event>) => fetchJson(`/events/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteEvent: (id: string) => fetchJson(`/events/${id}`, { method: 'DELETE' }),

  // --- Attendance ---
  getAttendance: () => fetchJson('/attendance'),
  markAttendance: (record: AttendanceRecord) => fetchJson('/attendance', { method: 'POST', body: JSON.stringify(record) }),
};
