import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, MapPin, CheckCircle2, CalendarClock, MailWarning } from 'lucide-react';
import { db } from '../services/mockDb';
import { Event, Member, AttendanceRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ type: 'service' });

  // Role check: Only admin and secretary can manage events
  const canEdit = user?.role === 'admin' || user?.role === 'secretary';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [e, m, a] = await Promise.all([
      db.getEvents(),
      db.getMembers(),
      db.getAttendance()
    ]);
    setEvents(e);
    setMembers(m);
    setAttendance(a);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;
    
    await db.addEvent({
      id: `e${Date.now()}`,
      name: newEvent.name,
      date: newEvent.date,
      type: newEvent.type as any,
      status: 'upcoming'
    });
    
    loadData();
    setShowForm(false);
    setNewEvent({ type: 'service' });
  };

  const handleNotifyAbsentees = (event: Event) => {
    // 1. Get IDs of members who attended this event
    const eventAttendance = attendance.filter(a => a.eventId === event.id);
    const attendeeIds = new Set(eventAttendance.map(a => a.memberId));
    
    // 2. Find active members who are NOT in the attendee list
    const absentMembers = members.filter(m => m.status === 'active' && !attendeeIds.has(m.id));
    
    if (absentMembers.length === 0) {
      alert(`Great news! All active members attended '${event.name}'.`);
      return;
    }

    // 3. Mock sending report
    const message = `
      [MOCK SMS/EMAIL SENT]
      
      To: Admin / Designated Staff
      Subject: Absentee Report for ${event.name}
      
      Total Absent: ${absentMembers.length}
      
      Names:
      ${absentMembers.map(m => `- ${m.firstName} ${m.lastName}`).join('\n')}
      
      Notifications have been queued for these members.
    `;
    
    alert(message);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Events Schedule</h2>
          <p className="text-slate-500">Manage church services and gatherings.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Schedule Event
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4">New Event Details</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Sunday Service" 
                className="w-full px-3 py-2 border rounded-lg"
                value={newEvent.name || ''}
                onChange={e => setNewEvent({...newEvent, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
              <input 
                required
                type="datetime-local" 
                className="w-full px-3 py-2 border rounded-lg"
                value={newEvent.date || ''}
                onChange={e => setNewEvent({...newEvent, date: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg"
                value={newEvent.type}
                onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
              >
                <option value="service">Service</option>
                <option value="youth">Youth</option>
                <option value="outreach">Outreach</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <button type="submit" className="bg-slate-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-800">
              Save Event
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => {
          const isPast = new Date(event.date) < new Date();
          return (
            <div 
              key={event.id} 
              className={`relative rounded-xl p-6 transition-all flex flex-col h-full ${
                isPast 
                  ? 'bg-slate-50 border border-slate-200' 
                  : 'bg-white border-l-4 border-l-indigo-500 shadow-lg shadow-indigo-100 ring-1 ring-slate-100'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${isPast ? 'bg-slate-200' : 'bg-indigo-100'}`}>
                  <Calendar className={`w-6 h-6 ${isPast ? 'text-slate-500' : 'text-indigo-600'}`} />
                </div>
                {isPast ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-200 text-slate-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700 shadow-sm">
                    <CalendarClock className="w-3 h-3" />
                    Upcoming
                  </span>
                )}
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${isPast ? 'text-slate-600' : 'text-slate-900'}`}>{event.name}</h3>
              
              <div className={`space-y-2 text-sm ${isPast ? 'text-slate-400' : 'text-slate-600'} flex-1`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(event.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Main Sanctuary
                </div>
              </div>

              {/* Action Buttons for Completed Events */}
              {isPast && canEdit && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => handleNotifyAbsentees(event)}
                    className="w-full py-2 px-3 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center justify-center gap-2 transition-colors border border-amber-200 font-medium"
                  >
                    <MailWarning className="w-4 h-4" />
                    Notify Absentees
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Events;