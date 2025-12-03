
import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, MapPin, CheckCircle2, CalendarClock, MailWarning, Trash2, XCircle, QrCode, X, ChevronDown, Users, AlertTriangle, MessageSquare, Mail, Smartphone, Send, ArrowLeft, Filter, MoreHorizontal, ChevronRight, Check, Edit2, PlayCircle, ChevronLeft } from 'lucide-react';
import { db } from '../services/mockDb';
import { Event, Member, AttendanceRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 6;

const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Event Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ type: 'service' });
  const [isCustomType, setIsCustomType] = useState(false);

  // UI State
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [checkInQrEvent, setCheckInQrEvent] = useState<Event | null>(null);
  const [viewAttendeesEvent, setViewAttendeesEvent] = useState<Event | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<Event | null>(null);

  // Notification State
  const [notifyState, setNotifyState] = useState<{
    isOpen: boolean;
    step: 'range' | 'method' | 'compose';
    mode: 'single' | 'batch';
    method: 'email' | 'sms';
    event: Event | null;
    startDate: string;
    endDate: string;
    message: string;
    absenteeCount: number;
  }>({
    isOpen: false,
    step: 'method',
    mode: 'single',
    method: 'email',
    event: null,
    startDate: '',
    endDate: '',
    message: '',
    absenteeCount: 0
  });

  const canEdit = user?.role === 'admin' || user?.role === 'secretary';

  useEffect(() => {
    loadData();
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown-container')) {
        setActiveStatusId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const sortedEvents = [...events].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = sortedEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAddModal = () => {
    setEditingId(null);
    setNewEvent({ type: 'service' });
    setIsCustomType(false);
    setShowForm(true);
  };

  const openEditModal = (event: Event) => {
      setEditingId(event.id);
      setNewEvent({ ...event });
      setIsCustomType(!['service', 'youth', 'outreach', 'meeting'].includes(event.type));
      setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;
    
    if (editingId) {
        await db.updateEvent(editingId, {
            name: newEvent.name,
            date: newEvent.date,
            location: newEvent.location || 'Main Sanctuary',
            type: newEvent.type as any,
        });
    } else {
        await db.addEvent({
            id: `e${Date.now()}`,
            name: newEvent.name,
            date: newEvent.date,
            location: newEvent.location || 'Main Sanctuary', 
            type: newEvent.type as any,
            status: 'upcoming'
        });
    }
    
    loadData();
    setShowForm(false);
    setNewEvent({ type: 'service' });
    setEditingId(null);
    setIsCustomType(false);
  };

  const handleDelete = async () => {
    if (deleteEventTarget) {
        await db.deleteEvent(deleteEventTarget.id);
        loadData();
        setDeleteEventTarget(null);
        if (paginatedEvents.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }
  };

  const handleStatusUpdate = async (eventId: string, newStatus: string) => {
      let updates: any = { status: newStatus };
      if (newStatus === 'cancelled') {
        const reason = prompt("Please provide a reason for cancellation:");
        if (reason) {
          updates.cancellationReason = reason;
        } else {
            return; 
        }
      }
      await db.updateEvent(eventId, updates);
      setEvents(events.map(e => e.id === eventId ? { ...e, ...updates } : e));
      setActiveStatusId(null);
  };

  const openNotifyModal = (event: Event) => {
    const eventAttendance = attendance.filter(a => a.eventId === event.id);
    const attendeeIds = new Set(eventAttendance.map(a => a.memberId));
    const absentMembers = members.filter(m => m.status === 'active' && !attendeeIds.has(m.id));
    
    if (absentMembers.length === 0) {
      alert(`Great news! All active members attended '${event.name}'.`);
      return;
    }

    setNotifyState({
      isOpen: true,
      step: 'method',
      mode: 'single',
      method: 'email',
      event: event,
      startDate: '',
      endDate: '',
      message: '',
      absenteeCount: absentMembers.length
    });
  };

  const openBatchNotifyModal = () => {
      setNotifyState({
          isOpen: true,
          step: 'range',
          mode: 'batch',
          method: 'email',
          event: null,
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          message: '',
          absenteeCount: 0
      });
  };

  const calculateBatchAbsentees = () => {
      const start = new Date(notifyState.startDate);
      const end = new Date(notifyState.endDate);
      end.setHours(23, 59, 59);

      const eventsInRange = events.filter(e => {
          const d = new Date(e.date);
          return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
      });

      if (eventsInRange.length === 0) {
          alert("No events found in this date range.");
          return;
      }
      const rangeEventIds = eventsInRange.map(e => e.id);
      const attendeesInRange = new Set(
          attendance
            .filter(a => rangeEventIds.includes(a.eventId))
            .map(a => a.memberId)
      );

      const absentMembers = members.filter(m => m.status === 'active' && !attendeesInRange.has(m.id));

      setNotifyState(prev => ({
          ...prev,
          absenteeCount: absentMembers.length,
          step: 'method'
      }));
  };

  const handleMethodSelect = (method: 'email' | 'sms') => {
    let defaultMsg = '';

    if (notifyState.mode === 'single') {
        defaultMsg = method === 'email' 
        ? `Dear Member,\n\nWe missed you at our ${notifyState.event?.name} today. We hope everything is well with you and your family.\n\nBlessings,\nChurch Team`
        : `Hi! We missed you at ${notifyState.event?.name} today. Hope you are doing well!`;
    } else {
        defaultMsg = method === 'email'
        ? `Dear Member,\n\nWe noticed you haven't been able to join us for our recent services. We wanted to reach out and check in on you.\n\nBlessings,\nChurch Team`
        : `Hi! We've missed seeing you at church recently. Hope you are doing well!`;
    }

    setNotifyState(prev => ({
      ...prev,
      step: 'compose',
      method,
      message: defaultMsg
    }));
  };

  const handleSendNotification = () => {
    alert(`Successfully sent ${notifyState.method.toUpperCase()} to ${notifyState.absenteeCount} members.`);
    setNotifyState(prev => ({ ...prev, isOpen: false }));
  };

  const getStatusStyles = (status: string, isPast: boolean) => {
    if (status === 'cancelled') return 'bg-red-50 border-red-200 border-l-red-500 opacity-90';
    if (status === 'completed' || isPast) return 'bg-slate-50 border-slate-200 border-l-slate-400';
    if (status === 'in-progress') return 'bg-green-50 border-green-200 border-l-green-500 shadow-lg shadow-green-100 ring-1 ring-green-100';
    return 'bg-white shadow-lg shadow-blue-100 ring-1 ring-slate-100 border-l-blue-600';
  };

  const getStatusBadge = (status: string, isPast: boolean) => {
    if (status === 'cancelled') return <span className="flex items-center gap-1 text-red-700 font-bold"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
    if (status === 'completed' || isPast) return <span className="flex items-center gap-1 text-slate-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
    if (status === 'in-progress') return <span className="flex items-center gap-1 text-green-700 font-bold animate-pulse"><PlayCircle className="w-3.5 h-3.5" /> In Progress</span>;
    return <span className="flex items-center gap-1 text-blue-700 font-bold"><CalendarClock className="w-3.5 h-3.5" /> Upcoming</span>;
  };

  const getEventAttendees = (eventId: string) => {
      const records = attendance.filter(a => a.eventId === eventId);
      return records.map(record => {
          const member = members.find(m => m.id === record.memberId);
          return { ...record, member };
      }).filter(item => item.member !== undefined);
  };

  const getQrLink = (eventId: string) => {
    const baseUrl = window.location.origin + window.location.pathname; 
    const checkInUrl = `${baseUrl}#/checkin/${eventId}`;
    return encodeURIComponent(checkInUrl);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Events Schedule</h2>
          <p className="text-slate-500">Manage church services and gatherings.</p>
        </div>
        {canEdit && (
          <div className="flex w-full md:w-auto gap-2">
              <button 
                onClick={openBatchNotifyModal}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-slate-50 transition-colors flex-1 md:flex-none justify-center"
              >
                <MailWarning className="w-4 h-4" />
                Batch Absentee Check
              </button>
              <button 
                onClick={openAddModal}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-800 transition-colors flex-1 md:flex-none justify-center"
              >
                <Plus className="w-5 h-5" />
                Schedule Event
              </button>
          </div>
        )}
      </div>

      {showForm && canEdit && (
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden animate-in slide-in-from-top-4">
          <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white">
             <h3 className="font-bold flex items-center gap-2 text-lg"><Calendar className="w-5 h-5" /> {editingId ? 'Edit Event' : 'Schedule New Event'}</h3>
             <button onClick={() => setShowForm(false)} className="text-blue-200 hover:text-white bg-blue-800 hover:bg-blue-700 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">Title of Event <span className="text-red-500">*</span></label>
                        <input required type="text" placeholder="e.g. Sunday Morning Worship" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 shadow-sm" value={newEvent.name || ''} onChange={e => setNewEvent({...newEvent, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">Event Type</label>
                        {isCustomType ? (
                            <div className="flex gap-2">
                                <input autoFocus type="text" placeholder="Enter custom type..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-sm" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} />
                                <button type="button" onClick={() => setIsCustomType(false)} className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div className="relative">
                                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white text-slate-900 shadow-sm appearance-none" value={newEvent.type} onChange={e => {
                                        if (e.target.value === 'custom') { setIsCustomType(true); setNewEvent({...newEvent, type: '' as any}); } else { setNewEvent({...newEvent, type: e.target.value as any}); }
                                    }}>
                                    <option value="service">Service</option>
                                    <option value="youth">Youth</option>
                                    <option value="outreach">Outreach</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="custom">Other / Custom...</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">Date & Time <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 pointer-events-none z-10"><Calendar className="w-5 h-5" /></div>
                            <input required type="datetime-local" className="w-full pl-14 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 shadow-sm relative z-0 font-medium" value={newEvent.date || ''} onChange={e => setNewEvent({...newEvent, date: e.target.value})} style={{ colorScheme: 'light' }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">Location <span className="text-blue-500 text-xs font-normal">(Optional)</span></label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text" placeholder="e.g. Main Sanctuary" className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 shadow-sm" value={newEvent.location || ''} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                        </div>
                    </div>
                 </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />{editingId ? 'Save Changes' : 'Create Event'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEvents.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No events scheduled.</p>
                {canEdit && <p className="text-sm text-slate-400">Click "Schedule Event" to get started.</p>}
            </div>
        ) : paginatedEvents.map(event => {
          const isPast = new Date(event.date) < new Date();
          const cardStyle = getStatusStyles(event.status, isPast);
          const attendeesCount = attendance.filter(a => a.eventId === event.id).length;
          
          return (
            <div key={event.id} className={`relative rounded-xl p-6 transition-all flex flex-col h-full border-l-4 group ${cardStyle}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-white/60 border border-slate-200 shadow-sm">
                  <Calendar className="w-6 h-6 text-slate-700" />
                </div>
                
                <div className="flex items-center gap-2">
                    {canEdit ? (
                        <div className="relative status-dropdown-container">
                            <button onClick={() => setActiveStatusId(activeStatusId === event.id ? null : event.id)} className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all ${activeStatusId === event.id ? 'ring-2 ring-blue-200 bg-white border-blue-200' : 'border-transparent hover:bg-white/50 hover:border-slate-200'}`}>
                                {getStatusBadge(event.status, isPast)}
                                <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
                            </button>
                            {activeStatusId === event.id && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 mb-1">Set Status</div>
                                    {['upcoming', 'in-progress', 'completed', 'cancelled'].map(s => (
                                        <button key={s} onClick={() => handleStatusUpdate(event.id, s)} className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg flex items-center justify-between ${event.status === s ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                            {s} {event.status === s && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 rounded-full bg-white/50 border border-slate-100">{getStatusBadge(event.status, isPast)}</div>
                    )}
                    
                    {canEdit && (
                      <div className="flex items-center gap-1">
                         <button onClick={() => openEditModal(event)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 transition-colors rounded-lg" title="Edit Event"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteEventTarget(event)} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 transition-colors rounded-lg" title="Delete Event"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-slate-900 line-clamp-2">{event.name}</h3>
              <div className="mb-4">
                 <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider bg-slate-100/80 px-2 py-1 rounded border border-slate-200">{event.type}</span>
              </div>
              
              {event.status === 'cancelled' && event.cancellationReason && (
                 <div className="mb-4 p-3 bg-red-50 rounded-lg text-xs text-red-800 border border-red-100">
                    <span className="font-bold block mb-1">Cancellation Reason:</span> {event.cancellationReason}
                 </div>
              )}

              <div className="space-y-3 text-sm text-slate-600 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 shrink-0"><Clock className="w-4 h-4" /></div>
                  <div>
                    <p className="font-semibold text-slate-900">{new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xs text-slate-500">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 shrink-0"><MapPin className="w-4 h-4" /></div>
                  <span className="font-medium">{event.location || 'Main Sanctuary'}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/50 flex items-center justify-between text-sm">
                 <button onClick={() => setViewAttendeesEvent(event)} className="flex items-center gap-2 text-slate-600 hover:text-blue-700 font-medium transition-colors group/attendees">
                    <div className="flex -space-x-2">
                         {[...Array(Math.min(3, attendeesCount))].map((_, i) => (
                             <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500"><Users className="w-3 h-3" /></div>
                         ))}
                         {attendeesCount > 3 && (
                             <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-blue-600">+{attendeesCount - 3}</div>
                         )}
                    </div>
                    <span className="group-hover/attendees:underline">{attendeesCount} Attended</span>
                 </button>
              </div>

              <div className="mt-4 space-y-2">
                {(!isPast && event.status !== 'cancelled') && (
                    <button onClick={() => setCheckInQrEvent(event)} className="w-full py-2.5 px-3 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 font-bold hover:shadow-lg hover:-translate-y-0.5"><QrCode className="w-4 h-4" /> Self Check-in QR</button>
                )}
                {(isPast && canEdit && event.status !== 'cancelled') && (
                  <button onClick={() => openNotifyModal(event)} className="w-full py-2.5 px-3 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center justify-center gap-2 transition-colors border border-amber-200 font-bold"><MailWarning className="w-4 h-4" /> Notify Absentees</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

       {/* Pagination Controls */}
       {sortedEvents.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center items-center mt-8 gap-4">
              <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                  <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
              <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                  <ChevronRight className="w-5 h-5" />
              </button>
          </div>
       )}

       {/* Modals... (QR, Attendees, Delete, Notify are same as before) */}
       {checkInQrEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setCheckInQrEvent(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Self Check-In</h3>
              <p className="text-sm text-slate-500">Scan this code to open the <br/><strong className="text-slate-800">Check-In Page</strong> for <span className="font-semibold text-slate-900">{checkInQrEvent.name}</span></p>
              <div className="p-4 bg-white border-2 border-slate-100 rounded-xl inline-block shadow-inner">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${getQrLink(checkInQrEvent.id)}`} alt="Event Check-in QR" className="w-56 h-56" />
              </div>
              <p className="text-xs text-slate-400">Attendees can scan to self-register.</p>
              <button className="w-full py-2.5 rounded-lg bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors" onClick={() => window.print()}>Print Event Code</button>
            </div>
          </div>
        </div>
      )}

      {viewAttendeesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div><h3 className="text-xl font-bold text-slate-900">Event Attendance</h3><p className="text-sm text-slate-500">{viewAttendeesEvent.name}</p></div>
                    <button onClick={() => setViewAttendeesEvent(null)}><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    {getEventAttendees(viewAttendeesEvent.id).length === 0 ? <div className="p-10 text-center text-slate-400">No attendees recorded yet.</div> : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 sticky top-0"><tr><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Time</th><th className="px-6 py-3 font-medium text-right">Method</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {getEventAttendees(viewAttendeesEvent.id).map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 font-medium text-slate-900">{record.member?.firstName} {record.member?.lastName}</td>
                                        <td className="px-6 py-3 text-slate-500">{new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="px-6 py-3 text-right"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold capitalize ${record.method === 'qr' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{record.method}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-right"><span className="text-sm text-slate-500 font-medium">Total: {getEventAttendees(viewAttendeesEvent.id).length}</span></div>
            </div>
        </div>
      )}

      {deleteEventTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-100 animate-in bounce-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Event?</h3>
                    <p className="text-slate-500 mb-6">You are about to permanently delete <strong className="text-slate-800">{deleteEventTarget.name}</strong>.<br/><br/><span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3 inline mr-1" /> This will also delete all attendance records.</span></p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteEventTarget(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-600/20">Confirm Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {notifyState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-0 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 {notifyState.step !== 'range' && notifyState.step !== (notifyState.mode === 'single' ? 'method' : 'range') ? (
                   <button onClick={() => setNotifyState(prev => ({ ...prev, step: prev.step === 'compose' ? 'method' : 'range' }))} className="p-1 rounded-full hover:bg-slate-200"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                 ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><MailWarning className="w-4 h-4 text-amber-600" /></div>
                 )}
                 <div><h3 className="font-bold text-slate-900">Notify Absentees</h3><p className="text-xs text-slate-500">{notifyState.mode === 'single' ? notifyState.event?.name : 'Batch Check'}</p></div>
              </div>
              <button onClick={() => setNotifyState(prev => ({ ...prev, isOpen: false }))}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6">
              {notifyState.step === 'range' && (
                  <div className="space-y-4">
                      <p className="text-slate-600 text-sm">Select a date range to identify members who have <strong>not attended any events</strong> during this period.</p>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs font-bold text-slate-500 uppercase">Start Date</label><input type="date" className="w-full mt-1 p-2 border rounded-lg text-sm bg-white text-slate-900" value={notifyState.startDate} onChange={e => setNotifyState(prev => ({ ...prev, startDate: e.target.value }))} /></div>
                          <div><label className="text-xs font-bold text-slate-500 uppercase">End Date</label><input type="date" className="w-full mt-1 p-2 border rounded-lg text-sm bg-white text-slate-900" value={notifyState.endDate} onChange={e => setNotifyState(prev => ({ ...prev, endDate: e.target.value }))} /></div>
                      </div>
                      <button onClick={calculateBatchAbsentees} className="w-full py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors mt-2">Identify Absentees</button>
                  </div>
              )}
              {notifyState.step === 'method' && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <p className="text-slate-600 text-sm mb-4">There are <strong className="text-slate-900">{notifyState.absenteeCount} active members</strong> who {notifyState.mode === 'single' ? 'missed this event' : 'have not attended any events in this range'}. How would you like to contact them?</p>
                  <button onClick={() => handleMethodSelect('email')} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group text-left">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors"><Mail className="w-6 h-6" /></div>
                    <div><h4 className="font-bold text-slate-900 group-hover:text-blue-900">Send Email</h4><p className="text-xs text-slate-500">Best for newsletters and detailed updates.</p></div>
                  </button>
                  <button onClick={() => handleMethodSelect('sms')} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all group text-left">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-200 transition-colors"><Smartphone className="w-6 h-6" /></div>
                    <div><h4 className="font-bold text-slate-900 group-hover:text-green-900">Send SMS</h4><p className="text-xs text-slate-500">High open rates, best for short check-ins.</p></div>
                  </button>
                </div>
              )} 
              {notifyState.step === 'compose' && (
                <div className="flex flex-col h-full animate-in slide-in-from-right-4">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Compose {notifyState.method === 'email' ? 'Email' : 'SMS'} Message</label>
                    <p className="text-xs text-slate-500 mb-3">This message will be sent individually to {notifyState.absenteeCount} recipients.</p>
                    <textarea className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed bg-white text-slate-900" value={notifyState.message} onChange={(e) => setNotifyState(prev => ({ ...prev, message: e.target.value }))} placeholder="Write your message here..." />
                  </div>
                  <button onClick={handleSendNotification} className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${notifyState.method === 'email' ? 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/20' : 'bg-green-600 hover:bg-green-500 shadow-green-600/20'}`}><Send className="w-4 h-4" />Send {notifyState.method === 'email' ? 'Emails' : 'Messages'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
