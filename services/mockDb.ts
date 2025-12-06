
import { Member, Event, AttendanceRecord, User, AppSettings, Guest } from '../types';
import { MOCK_USERS, MOCK_MEMBERS, MOCK_EVENTS, MOCK_ATTENDANCE } from '../constants';

const API_URL = 'http://localhost:5000/api';

// --- In-Memory Fallback Store ---
let localMembers = [...MOCK_MEMBERS];
let localEvents = [...MOCK_EVENTS];
let localAttendance = [...MOCK_ATTENDANCE];
let localGuests: Guest[] = []; // New separate table for guests
let localSettings: AppSettings = { slogan: 'Puelay' };

const fetchJson = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Try to fetch from real backend
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    // Fallback to mock data if backend is unreachable
    console.warn(`Backend unreachable (${endpoint}). Falling back to mock data.`);
    return handleMockFallback(endpoint, options);
  }
};

const handleMockFallback = async (endpoint: string, options: RequestInit) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 400));
    
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;

    // Auth
    if (endpoint === '/auth/login' && method === 'POST') {
        const user = MOCK_USERS.find(u => u.username === body.username && u.password === body.password);
        if (user) {
            const { password, ...safeUser } = user;
            return safeUser;
        }
        throw new Error('Invalid credentials');
    }

    // Members
    if (endpoint === '/members') {
        if (method === 'GET') return [...localMembers];
        if (method === 'POST') {
            localMembers.push(body);
            return body;
        }
    }
    if (endpoint.startsWith('/members/')) {
        const id = endpoint.split('/').pop();
        if (method === 'PUT') {
            localMembers = localMembers.map(m => m.id === id ? { ...m, ...body } : m);
            return { success: true };
        }
        if (method === 'DELETE') {
            localMembers = localMembers.filter(m => m.id !== id);
            return { success: true };
        }
    }

    // Events
    if (endpoint === '/events') {
        if (method === 'GET') return [...localEvents];
        if (method === 'POST') {
            localEvents.push(body);
            return body;
        }
    }
    if (endpoint.startsWith('/events/')) {
        const id = endpoint.split('/').pop();
        if (method === 'PUT') {
            localEvents = localEvents.map(e => e.id === id ? { ...e, ...body } : e);
            return { success: true };
        }
        if (method === 'DELETE') {
            localEvents = localEvents.filter(e => e.id !== id);
            return { success: true };
        }
    }

    // Guests (New)
    if (endpoint === '/guests') {
        if (method === 'GET') return [...localGuests];
        if (method === 'POST') {
            localGuests.push(body);
            return body;
        }
    }
    if (endpoint.startsWith('/guests/')) {
        const id = endpoint.split('/').pop();
        if (method === 'DELETE') {
            localGuests = localGuests.filter(g => g.id !== id);
            return { success: true };
        }
    }

    // Attendance
    if (endpoint === '/attendance') {
        if (method === 'GET') return [...localAttendance];
        if (method === 'POST') {
            localAttendance.push(body);
            return body;
        }
    }

    // Settings
    if (endpoint === '/settings') {
         if (method === 'GET') return localSettings;
         if (method === 'PUT') {
             localSettings = { ...localSettings, ...body };
             return localSettings;
         }
    }
    
    // Users (Profile Update)
    if (endpoint.startsWith('/users/')) {
         return { ...body };
    }

    // Default return for unhandled mocks to prevent crashes, though ideally shouldn't reach here for known routes
    console.error("Unhandled mock route:", method, endpoint);
    return null;
}

export const db = {
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

  getSettings: async (): Promise<AppSettings> => {
    return fetchJson('/settings');
  },
  updateSettings: async (newSettings: Partial<AppSettings>) => {
    return fetchJson('/settings', { method: 'PUT', body: JSON.stringify(newSettings) });
  },

  getMembers: () => fetchJson('/members'),
  addMember: (member: Member) => fetchJson('/members', { method: 'POST', body: JSON.stringify(member) }),
  updateMember: (id: string, updates: Partial<Member>) => fetchJson(`/members/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteMember: (id: string) => fetchJson(`/members/${id}`, { method: 'DELETE' }),

  getEvents: () => fetchJson('/events'),
  addEvent: (event: Event) => fetchJson('/events', { method: 'POST', body: JSON.stringify(event) }),
  updateEvent: (id: string, updates: Partial<Event>) => fetchJson(`/events/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteEvent: (id: string) => fetchJson(`/events/${id}`, { method: 'DELETE' }),

  // Guest Operations
  getGuests: () => fetchJson('/guests'),
  addGuest: (guest: Guest) => fetchJson('/guests', { method: 'POST', body: JSON.stringify(guest) }),
  deleteGuest: (id: string) => fetchJson(`/guests/${id}`, { method: 'DELETE' }),

  getAttendance: () => fetchJson('/attendance'),
  markAttendance: (record: AttendanceRecord) => fetchJson('/attendance', { method: 'POST', body: JSON.stringify(record) }),
};
