
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Calendar, MapPin, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { db } from '../services/mockDb';
import { Event, AppSettings } from '../types';

const GuestRegistration: React.FC = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [slogan, setSlogan] = useState('Puelay');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    homeChurch: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;
      try {
        const [events, settings] = await Promise.all([db.getEvents(), db.getSettings()]);
        const found = events.find(e => e.id === eventId);
        setEvent(found || null);
        setSlogan(settings.slogan);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, phone: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const newId = `g-${Date.now()}`;
      await db.addGuest({
        id: newId,
        eventId: event.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        homeChurch: formData.homeChurch,
        registrationDate: new Date().toISOString()
      });
      setGuestId(newId);
      setSubmitted(true);
    } catch (e) {
      alert("Registration failed. Please try again.");
    }
  };

  const downloadQr = () => {
      // Basic download simulation or instruction
      window.print();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-white"/></div>;

  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Event Not Found</h1>
        <p className="text-slate-500 mt-2">This event link may be invalid or expired.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&display=swap');
            .font-cinzel { font-family: 'Cinzel', serif; }
            .font-lato { font-family: 'Lato', sans-serif; }
        `}</style>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden font-lato">
            <div className="bg-blue-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <img src="/logo.png" className="w-32 h-32 object-contain" />
                </div>
                {/* Decorative Circles */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mb-3 bg-white p-1 rounded-lg shadow-lg" />
                    <h1 className="text-2xl md:text-3xl font-bold font-cinzel tracking-wide">Church of God</h1>
                    <p className="text-blue-200 text-xs uppercase tracking-[0.2em] font-bold mb-6">{slogan}</p>
                    
                    <div className="bg-blue-800/50 backdrop-blur-sm p-4 rounded-xl border border-blue-700/50 w-full">
                        <h2 className="text-xl font-bold text-white mb-1">{event.name}</h2>
                        <div className="flex flex-col gap-1 text-blue-200 text-sm items-center">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(event.date).toLocaleDateString()} &bull; {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            {event.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {submitted ? (
                    <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-cinzel">Registration Complete!</h2>
                        <p className="text-slate-500 mb-6">We look forward to seeing you. Please save your Check-in QR Code.</p>
                        
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block mb-6 shadow-inner">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${guestId}`} 
                                alt="Your QR Code" 
                                className="w-48 h-48 mix-blend-multiply mx-auto"
                            />
                            <p className="text-xs text-slate-400 mt-2 font-mono">{guestId}</p>
                        </div>

                        <div className="space-y-3">
                            <button onClick={downloadQr} className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Save / Print Ticket
                            </button>
                            <button onClick={() => window.location.reload()} className="w-full py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                                Register Another Person
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Guest Registration</h3>
                            <p className="text-sm text-slate-500">Please fill in your details below.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">First Name <span className="text-red-500">*</span></label>
                                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all focus:bg-white" 
                                    value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Last Name <span className="text-red-500">*</span></label>
                                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all focus:bg-white" 
                                    value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email Address</label>
                            <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all focus:bg-white" 
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone Number</label>
                            <input type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all focus:bg-white" 
                                value={formData.phone} onChange={handlePhoneChange} placeholder="09123456789" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Home Church <span className="text-red-500">*</span></label>
                            <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium transition-all focus:bg-white" 
                                placeholder="Your home church name"
                                value={formData.homeChurch} onChange={e => setFormData({...formData, homeChurch: e.target.value})} />
                        </div>

                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-6">
                            <UserPlus className="w-5 h-5" />
                            Complete Registration
                        </button>
                    </form>
                )}
            </div>
            
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium">&copy; {new Date().getFullYear()} Church of God Attendance System</p>
            </div>
        </div>
    </div>
  );
};

export default GuestRegistration;
