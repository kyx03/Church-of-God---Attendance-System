
export type Role = 'admin' | 'volunteer' | 'secretary';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive';
  ministry?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO date string
  location?: string;
  type: 'service' | 'youth' | 'outreach' | 'meeting';
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  cancellationReason?: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  memberId: string;
  timestamp: string;
  method: 'qr' | 'manual';
}

export interface AnalyticsSummary {
  totalMembers: number;
  averageAttendance: number;
  lastServiceAttendance: number;
  growthRate: number;
}

export interface AppSettings {
  slogan: string;
}
