
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../services/mockDb';
import { Event, Member } from '../types';

const CheckInPage: React.FC = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!eventId) return;
      try {
        const [allEvents, allMembers] = await Promise.all([
          db.getEvents(),
          db.getMembers()
        ]);
        const foundEvent = allEvents.find(e => e.id === eventId);
        setEvent(foundEvent || null);
        setMembers(allMembers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [eventId]);

  const handleCheckIn = async () => {
    if (!event) return;
    setStatus('idle');
    
    // Find member by Phone or Name (simple loose match for demo)
    const normalizedInput = inputValue.toLowerCase().trim();
    const member = members.find(m => 
      m.phone.replace(/\D/g, '') === normalizedInput.replace(/\D/g, '') ||
      m.email.toLowerCase() === normalizedInput ||
      `${m.firstName} ${m.lastName}`.toLowerCase() === normalizedInput
    );

    if (member) {
      try {
        await db.markAttendance({
          id: `att_self_${Date.now()}`,
          eventId: event.id,
          memberId: member.id,
          timestamp: new Date().toISOString(),
          method: 'manual' // Self-check-in counts as manual/app entry
        });
        setStatus('success');
        setMsg(`Welcome, ${member.firstName}! You are checked in.`);
        setInputValue('');
      } catch (e) {
        setStatus('error');
        setMsg('System error. Please try again.');
      }
    } else {
      setStatus('error');
      setMsg('Member not found. Please verify your phone number or email.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-900"/></div>;

  if (!event) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Event not found or expired.</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
       <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-900 p-6 text-center">
             <div className="bg-white p-3 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-xl font-bold text-white mb-1">Self Check-In</h1>
             <p className="text-blue-200 text-sm">{event.name}</p>
          </div>

          <div className="p-8">
             {status === 'success' ? (
               <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Success!</h3>
                    <p className="text-slate-600">{msg}</p>
                  </div>
                  <button onClick={() => setStatus('idle')} className="text-blue-600 font-medium hover:underline text-sm mt-4">Check in another person</button>
               </div>
             ) : (
               <div className="space-y-6">
                 {status === 'error' && (
                   <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" />
                     {msg}
                   </div>
                 )}
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Identify Yourself</label>
                   <input 
                     type="text" 
                     placeholder="Enter Phone Number, Email, or Full Name"
                     className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg bg-white text-slate-900"
                     value={inputValue}
                     onChange={e => setInputValue(e.target.value)}
                   />
                   <p className="text-xs text-slate-400 mt-2">Enter the details you registered with.</p>
                 </div>
                 <button 
                   onClick={handleCheckIn}
                   disabled={!inputValue.trim()}
                   className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Check In Now
                 </button>
               </div>
             )}
          </div>
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
             <p className="text-xs text-slate-400">Church of God Attendance System</p>
          </div>
       </div>
    </div>
  );
};

export default CheckInPage;
