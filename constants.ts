
import { Member, Event, AttendanceRecord, User } from './types';

// In a real app, passwords would never be stored here. 
// This is solely for the mock authentication flow in the browser preview.
export const MOCK_USERS: (User & { password: string })[] = [
  { id: 'u2', name: 'Sarah Admin', username: 'admin', role: 'admin', password: 'password' },
  { id: 'u4', name: 'Mike Vol', username: 'volunteer', role: 'volunteer', password: 'password' },
];

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '555-0101', joinDate: '2023-01-15', status: 'active' },
  { id: 'm2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '555-0102', joinDate: '2023-02-20', status: 'active' },
  { id: 'm3', firstName: 'Robert', lastName: 'Johnson', email: 'bob@example.com', phone: '555-0103', joinDate: '2022-11-05', status: 'inactive' },
  { id: 'm4', firstName: 'Mary', lastName: 'Williams', email: 'mary@example.com', phone: '555-0104', joinDate: '2023-06-10', status: 'active' },
  { id: 'm5', firstName: 'David', lastName: 'Brown', email: 'david@example.com', phone: '555-0105', joinDate: '2024-01-01', status: 'active' },
];

export const MOCK_EVENTS: Event[] = [
  { id: 'e1', name: 'Sunday Service', date: '2024-05-05T09:00:00', type: 'service', status: 'completed' },
  { id: 'e2', name: 'Midweek Bible Study', date: '2024-05-08T19:00:00', type: 'meeting', status: 'completed' },
  { id: 'e3', name: 'Sunday Service', date: '2024-05-12T09:00:00', type: 'service', status: 'completed' },
  { id: 'e4', name: 'Youth Night', date: '2024-05-17T18:00:00', type: 'youth', status: 'upcoming' },
  { id: 'e5', name: 'Sunday Service', date: '2024-05-19T09:00:00', type: 'service', status: 'upcoming' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', eventId: 'e1', memberId: 'm1', timestamp: '2024-05-05T08:55:00', method: 'qr' },
  { id: 'a2', eventId: 'e1', memberId: 'm2', timestamp: '2024-05-05T09:05:00', method: 'qr' },
  { id: 'a3', eventId: 'e3', memberId: 'm1', timestamp: '2024-05-12T08:50:00', method: 'qr' },
  { id: 'a4', eventId: 'e3', memberId: 'm4', timestamp: '2024-05-12T09:00:00', method: 'manual' },
  { id: 'a5', eventId: 'e3', memberId: 'm5', timestamp: '2024-05-12T09:10:00', method: 'qr' },
];
