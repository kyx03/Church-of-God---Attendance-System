
import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, MapPin, CheckCircle2, CalendarClock, MailWarning, Trash2, XCircle, QrCode, X, ChevronDown, Users, AlertTriangle } from 'lucide-react';
import { db } from '../services/mockDb';
import { Event, Member, AttendanceRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // New Event Form State
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ type: 'service' });
  const [isCustomType, setIsCustomType] = useState(false);

  // Modal States
  const [checkInQrEvent, setCheckInQrEvent] = useState<Event | null>(null);
  const [viewAttendeesEvent, setViewAttendeesEvent] = useState<Event | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<Event | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'secretary';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const [e, m, a] = await Promise.all([
        db.getEvents(),
        db.getMembers(),
        db.getAttendance()
        ]);
        setEvents(e);
        setMembers(m);
        setAttendance(a);
    } catch (err) {
        console.error("Failed to load events data", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;
    
    await db.addEvent({
      id: `e${Date.now()}`,
      name: newEvent.name,
      date: newEvent.date,
      location: newEvent.location,
      type: newEvent.type as any,
      status: 'upcoming'
    });
    
    loadData();
    setShowForm(false);
    setNewEvent({ type: 'service' });
    setIsCustomType(false);
  };

  const handleDelete = async () => {
    if (deleteEventTarget) {
        await db.deleteEvent(deleteEventTarget.id);
        loadData();
        setDeleteEventTarget(null);
    }
  };

  const handleStatusUpdate = async (eventId: string, newStatus: string) => {
      await db.updateEvent(eventId, { status: newStatus as any });
      // Optimistic update locally
      setEvents(events.map(e => e.id === eventId ? { ...e, status: newStatus as any } : e));
  };

  const handleNotifyAbsentees = (event: Event) => {
    const eventAttendance = attendance.filter(a => a.eventId === event.id);
    const attendeeIds = new Set(eventAttendance.map(a => a.memberId));
    const absentMembers = members.filter(m => m.status === 'active' && !attendeeIds.has(m.id));
    
    if (absentMembers.length === 0) {
      alert(`Great news! All active members attended '${event.name}'.`);
      return;
    }

    alert(`Notification sent to admin for ${absentMembers.length} absentees.`);
  };

  const getStatusStyles = (status: string, isPast: boolean) => {
    if (status === 'cancelled') return 'bg-red-50 border-red-200 border-l-red-500 opacity-80';
    if (status === 'completed' || isPast) return 'bg-slate-50 border-slate-200 border-l-slate-400';
    return 'bg-white shadow-lg shadow-blue-100 ring-1 ring-slate-100 border-l-blue-600';
  };

  const getStatusBadge = (status: string, isPast: boolean) => {
    if (status === 'cancelled') return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Cancelled</span>;
    if (status === 'completed' || isPast) return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-200 text-slate-600"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
    return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800 shadow-sm"><CalendarClock className="w-3 h-3" /> Upcoming</span>;
  };

  // Helper to filter attendance for a specific event
  const getEventAttendees = (eventId: string) => {
      const records = attendance.filter(a => a.eventId === eventId);
      return records.map(record => {
          const member = members.find(m => m.id === record.memberId);
          return { ...record, member };
      }).filter(item => item.member !== undefined);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Events Schedule</h2>
          <p className="text-slate-500">Manage church services and gatherings.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-800 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Schedule Event
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden animate-in slide-in-from-top-4">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
             <h3 className="font-bold text-blue-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Create New Event
             </h3>
             <button onClick={() => setShowForm(false)} className="text-blue-400 hover:text-blue-600">
                <X className="w-5 h-5" />
             </button>
          </div>
          <form onSubmit={handleCreate} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 {/* Event Name */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Event Name</label>
                    <input 
                        required
                        type="text" 
                        placeholder="e.g. Sunday Morning Worship" 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={newEvent.name || ''}
                        onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                    />
                 </div>

                 {/* Date & Time */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Date & Time</label>
                    <input 
                        required
                        type="datetime-local" 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={newEvent.date || ''}
                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    />
                 </div>

                 {/* Location */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="e.g. Main Sanctuary" 
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={newEvent.location || ''}
                            onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                        />
                    </div>
                 </div>

                 {/* Type Selector */}
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Event Type</label>
                    {isCustomType ? (
                        <div className="flex gap-2">
                            <input 
                                autoFocus
                                type="text"
                                placeholder="Enter custom type..."
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={newEvent.type}
                                onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                            />
                            <button 
                                type="button" 
                                onClick={() => setIsCustomType(false)} 
                                className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <select 
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={newEvent.type}
                            onChange={e => {
                                if (e.target.value === 'custom') {
                                    setIsCustomType(true);
                                    setNewEvent({...newEvent, type: '' as any});
                                } else {
                                    setNewEvent({...newEvent, type: e.target.value as any});
                                }
                            }}
                        >
                            <option value="service">Service</option>
                            <option value="youth">Youth</option>
                            <option value="outreach">Outreach</option>
                            <option value="meeting">Meeting</option>
                            <option value="custom">Other / Custom...</option>
                        </select>
                    )}
                 </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
                >
                    Create Event
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No events scheduled.</p>
                {canEdit && <p className="text-sm text-slate-400">Click "Schedule Event" to get started.</p>}
            </div>
        ) : events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => {
          const isPast = new Date(event.date) < new Date();
          const cardStyle = getStatusStyles(event.status, isPast);
          
          return (
            <div 
              key={event.id} 
              className={`relative rounded-xl p-6 transition-all flex flex-col h-full border-l-4 group ${cardStyle}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-white/60 border border-slate-200 shadow-sm">
                  <Calendar className="w-6 h-6 text-slate-700" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    {/* Status Dropdown for Admins */}
                    {canEdit ? (
                        <div className="relative group/status">
                            <button className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full hover:ring-2 hover:ring-slate-200 transition-all">
                                {getStatusBadge(event.status, isPast)}
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 p-1 hidden group-hover/status:block z-10">
                                {['upcoming', 'completed', 'cancelled'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusUpdate(event.id, s)}
                                        className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase rounded hover:bg-slate-50 ${event.status === s ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        getStatusBadge(event.status, isPast)
                    )}
                    
                    {canEdit && (
                        <button 
                            onClick={() => setDeleteEventTarget(event)} 
                            className="text-slate-300 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Event"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-slate-900">{event.name}</h3>
              <div className="mb-3">
                 <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider bg-slate-100/80 px-2 py-1 rounded border border-slate-200">
                    {event.type}
                 </span>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {new Date(event.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {event.location || 'Main Sanctuary'}
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-sm">
                 <button 
                    onClick={() => setViewAttendeesEvent(event)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-blue-700 font-medium transition-colors"
                 >
                    <Users className="w-4 h-4" />
                    <span>{attendance.filter(a => a.eventId === event.id).length} Attended</span>
                 </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/50 space-y-2">
                {(!isPast && event.status !== 'cancelled') && (
                    <button 
                        onClick={() => setCheckInQrEvent(event)}
                        className="w-full py-2.5 px-3 text-sm text-blue-700 bg-blue-50/50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-2 transition-all border border-blue-200/50 font-bold hover:shadow-sm"
                    >
                        <QrCode className="w-4 h-4" />
                        Self Check-in QR
                    </button>
                )}
                {(isPast && canEdit) && (
                  <button 
                    onClick={() => handleNotifyAbsentees(event)}
                    className="w-full py-2 px-3 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center justify-center gap-2 transition-colors border border-amber-200 font-medium"
                  >
                    <MailWarning className="w-4 h-4" />
                    Notify Absentees
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

       {/* Self Check-in QR Modal */}
       {checkInQrEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setCheckInQrEvent(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Self Check-In</h3>
              <p className="text-sm text-slate-500">Scan this code to mark attendance for <br/><span className="font-semibold text-slate-900">{checkInQrEvent.name}</span></p>
              
              <div className="p-4 bg-white border-2 border-slate-100 rounded-xl inline-block shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://puelay-app.com/checkin/${checkInQrEvent.id}`)}`} 
                  alt="Event Check-in QR"
                  className="w-56 h-56"
                />
              </div>
              <p className="text-xs text-slate-400">Display this at the entrance.</p>
              <button 
                className="w-full py-2.5 rounded-lg bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors"
                onClick={() => window.print()}
              >
                Print Event Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Attendees Modal */}
      {viewAttendeesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Event Attendance</h3>
                        <p className="text-sm text-slate-500">{viewAttendeesEvent.name}</p>
                    </div>
                    <button onClick={() => setViewAttendeesEvent(null)}><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                
                <div className="p-0 overflow-y-auto flex-1">
                    {getEventAttendees(viewAttendeesEvent.id).length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                            No attendees recorded yet.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Name</th>
                                    <th className="px-6 py-3 font-medium">Time</th>
                                    <th className="px-6 py-3 font-medium text-right">Method</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {getEventAttendees(viewAttendeesEvent.id).map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 font-medium text-slate-900">
                                            {record.member?.firstName} {record.member?.lastName}
                                        </td>
                                        <td className="px-6 py-3 text-slate-500">
                                            {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold capitalize ${record.method === 'qr' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {record.method}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-right">
                    <span className="text-sm text-slate-500 font-medium">
                        Total: {getEventAttendees(viewAttendeesEvent.id).length}
                    </span>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteEventTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-100 animate-in bounce-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Event?</h3>
                    <p className="text-slate-500 mb-6">
                        You are about to permanently delete <strong className="text-slate-800">{deleteEventTarget.name}</strong>.
                        <br/><br/>
                        <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            This will also delete all attendance records.
                        </span>
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setDeleteEventTarget(null)}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-600/20"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Events;
