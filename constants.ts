
import { Member, Event, AttendanceRecord, User } from './types';

// In a real app, passwords would never be stored here. 
// This is solely for the mock authentication flow in the browser preview.
export const MOCK_USERS: (User & { password: string })[] = [
  { id: 'u2', name: 'Sarah Admin', username: 'admin', role: 'admin', password: 'password' },
  { id: 'u4', name: 'Mike Vol', username: 'volunteer', role: 'volunteer', password: 'password' },
];

export const MOCK_MEMBERS: Member[] = [
  { id: 'AB12C3', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '555-0101', joinDate: '2023-01-15', status: 'active', ministry: "Men's Ministry" },
  { id: 'XY98Z7', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '555-0102', joinDate: '2023-02-20', status: 'active', ministry: "Ladies' Ministry" },
  { id: 'MN45P6', firstName: 'Robert', lastName: 'Johnson', email: 'bob@example.com', phone: '555-0103', joinDate: '2022-11-05', status: 'inactive', ministry: 'None' },
  { id: 'TR33Q2', firstName: 'Mary', lastName: 'Williams', email: 'mary@example.com', phone: '555-0104', joinDate: '2023-06-10', status: 'active', ministry: 'Music Ministry' },
  { id: 'JK88L9', firstName: 'David', lastName: 'Brown', email: 'david@example.com', phone: '555-0105', joinDate: '2024-01-01', status: 'active', ministry: "Children's Ministry" },
  // Extra Dummy Data for Pagination
  { id: 'GH77K1', firstName: 'Sarah', lastName: 'Davis', email: 'sarah@example.com', phone: '555-0106', joinDate: '2024-02-01', status: 'active', ministry: "Ladies' Ministry" },
  { id: 'WE22R4', firstName: 'Michael', lastName: 'Miller', email: 'mike@example.com', phone: '555-0107', joinDate: '2024-02-15', status: 'active', ministry: "Men's Ministry" },
  { id: 'PL99O0', firstName: 'Jessica', lastName: 'Wilson', email: 'jess@example.com', phone: '555-0108', joinDate: '2024-03-01', status: 'inactive', ministry: 'None' },
  { id: 'QA11S2', firstName: 'Daniel', lastName: 'Moore', email: 'dan@example.com', phone: '555-0109', joinDate: '2024-03-10', status: 'active', ministry: "Music Ministry" },
  { id: 'ZX44C5', firstName: 'Emily', lastName: 'Taylor', email: 'emily@example.com', phone: '555-0110', joinDate: '2024-03-20', status: 'active', ministry: "Children's Ministry" },
  { id: 'VB66N7', firstName: 'James', lastName: 'Anderson', email: 'james@example.com', phone: '555-0111', joinDate: '2024-04-01', status: 'active', ministry: "Men's Ministry" },
  { id: 'UY88H3', firstName: 'Linda', lastName: 'Thomas', email: 'linda@example.com', phone: '555-0112', joinDate: '2024-04-15', status: 'active', ministry: "Ladies' Ministry" },
];

export const MOCK_EVENTS: Event[] = [
  { id: 'e1', name: 'Sunday Service', date: '2024-05-05T09:00:00', type: 'service', status: 'completed' },
  { id: 'e2', name: 'Midweek Bible Study', date: '2024-05-08T19:00:00', type: 'meeting', status: 'completed' },
  { id: 'e3', name: 'Sunday Service', date: '2024-05-12T09:00:00', type: 'service', status: 'completed' },
  { id: 'e4', name: 'Youth Night', date: '2024-05-17T18:00:00', type: 'youth', status: 'upcoming' },
  { id: 'e5', name: 'Sunday Service', date: '2024-05-19T09:00:00', type: 'service', status: 'upcoming' },
  // Extra Dummy Events for Pagination
  { id: 'e6', name: 'Worship Night', date: '2024-05-24T19:00:00', type: 'service', status: 'upcoming' },
  { id: 'e7', name: 'Sunday Service', date: '2024-05-26T09:00:00', type: 'service', status: 'upcoming' },
  { id: 'e8', name: 'Leaders Meeting', date: '2024-05-28T18:00:00', type: 'meeting', status: 'upcoming' },
  { id: 'e9', name: 'Community Outreach', date: '2024-06-01T10:00:00', type: 'outreach', status: 'upcoming' },
  { id: 'e10', name: 'Sunday Service', date: '2024-06-02T09:00:00', type: 'service', status: 'upcoming' },
  { id: 'e11', name: 'Bible Study', date: '2024-06-05T19:00:00', type: 'meeting', status: 'upcoming' },
  { id: 'e12', name: 'Youth Camp', date: '2024-06-10T08:00:00', type: 'youth', status: 'upcoming' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', eventId: 'e1', memberId: 'AB12C3', timestamp: '2024-05-05T08:55:00', method: 'qr' },
  { id: 'a2', eventId: 'e1', memberId: 'XY98Z7', timestamp: '2024-05-05T09:05:00', method: 'qr' },
  { id: 'a3', eventId: 'e3', memberId: 'AB12C3', timestamp: '2024-05-12T08:50:00', method: 'qr' },
  { id: 'a4', eventId: 'e3', memberId: 'TR33Q2', timestamp: '2024-05-12T09:00:00', method: 'manual' },
  { id: 'a5', eventId: 'e3', memberId: 'JK88L9', timestamp: '2024-05-12T09:10:00', method: 'qr' },
];
