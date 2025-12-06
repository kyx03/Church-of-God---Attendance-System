
import React, { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, MapPin, X, Trash2, Edit2, Calendar, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { db } from '../services/mockDb';
import { Guest, Event } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 5;

const Guests: React.FC = () => {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [newGuest, setNewGuest] = useState<Partial<Guest>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [deleteGuestTarget, setDeleteGuestTarget] = useState<Guest | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadData = async () => {
    const [g, e] = await Promise.all([db.getGuests(), db.getEvents()]);
    setGuests(g);
    setEvents(e);
  };

  const publicEvents = events.filter(e => e.isPublic);

  const filteredGuests = guests.filter(g => 
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE);
  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getEventName = (eventId: string) => {
    const evt = events.find(e => e.id === eventId);
    return evt ? evt.name : 'Unknown Event';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.eventId || !newGuest.homeChurch) return;

    if (editingGuest) {
      // Mock update
      setStatusMsg("Guest updated successfully (Mock).");
    } else {
      await db.addGuest({
        id: `g-${Date.now()}`,
        eventId: newGuest.eventId!,
        firstName: newGuest.firstName!,
        lastName: newGuest.lastName!,
        email: newGuest.email || '',
        phone: newGuest.phone || '',
        homeChurch: newGuest.homeChurch,
        registrationDate: new Date().toISOString()
      });
      setStatusMsg("Guest added successfully.");
    }
    
    loadData();
    setIsModalOpen(false);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDelete = async () => {
    if (deleteGuestTarget) {
      await db.deleteGuest(deleteGuestTarget.id);
      loadData();
      setDeleteGuestTarget(null);
      setStatusMsg("Guest deleted successfully.");
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const openAddModal = () => {
    setEditingGuest(null);
    setNewGuest({ eventId: publicEvents.length > 0 ? publicEvents[0].id : '' });
    setIsModalOpen(true);
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setNewGuest({ ...guest });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full relative">
        {statusMsg && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-medium text-sm">{statusMsg}</span>
            </div>
        )}

      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Guests</h2>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search guests..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={openAddModal} className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-800 transition-colors shadow-md text-sm whitespace-nowrap">
                <Plus className="w-4 h-4" /> Add Guest
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Guest Name</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Home Church</th>
                            <th className="px-6 py-4">Event Attended</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedGuests.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No guests found.</td></tr>
                        ) : paginatedGuests.map(guest => (
                            <tr key={guest.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900">{guest.firstName} {guest.lastName}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {new Date(guest.registrationDate).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex items-center gap-2 mb-1"><Mail className="w-3 h-3 text-slate-400" /> {guest.email}</div>
                                    <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-slate-400" /> {guest.phone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {guest.homeChurch ? (
                                        <span className="flex items-center gap-1.5 text-slate-700"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {guest.homeChurch}</span>
                                    ) : <span className="text-slate-400 italic">None</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 border border-slate-200">
                                        {getEventName(guest.eventId)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => openEditModal(guest)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => setDeleteGuestTarget(guest)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            {filteredGuests.length > ITEMS_PER_PAGE && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 text-xs">Prev</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 text-xs">Next</button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">{editingGuest ? 'Edit Guest' : 'Add Guest'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name <span className="text-red-500">*</span></label>
                            <input required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newGuest.firstName || ''} onChange={e => setNewGuest({...newGuest, firstName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name <span className="text-red-500">*</span></label>
                            <input required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newGuest.lastName || ''} onChange={e => setNewGuest({...newGuest, lastName: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email <span className="text-slate-400 font-normal lowercase">(optional)</span></label>
                        <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newGuest.email || ''} onChange={e => setNewGuest({...newGuest, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone <span className="text-slate-400 font-normal lowercase">(optional)</span></label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" 
                            value={newGuest.phone || ''} 
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setNewGuest({...newGuest, phone: val});
                            }}
                            placeholder="Numbers only"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Home Church <span className="text-red-500">*</span></label>
                        <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newGuest.homeChurch || ''} onChange={e => setNewGuest({...newGuest, homeChurch: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registered Event <span className="text-red-500">*</span></label>
                        <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newGuest.eventId || ''} onChange={e => setNewGuest({...newGuest, eventId: e.target.value})}>
                            <option value="" disabled>Select Public Event</option>
                            {publicEvents.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 mt-4">Save Guest</button>
                </form>
            </div>
        </div>
      )}

      {deleteGuestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-100 animate-in bounce-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Guest?</h3>
                    <p className="text-slate-500 mb-6">Are you sure you want to remove <strong className="text-slate-800">{deleteGuestTarget.firstName} {deleteGuestTarget.lastName}</strong> from the guest list?</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteGuestTarget(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-600/20">Confirm Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Guests;
