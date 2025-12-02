
import React, { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, MoreVertical, X, Filter, Trash2, Power, History, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { db } from '../services/mockDb';
import { Member, Event, AttendanceRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Members: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'last_service' | 'never'>('all');

  // Modals
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [historyMember, setHistoryMember] = useState<Member | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const canEdit = user?.role === 'admin' || user?.role === 'secretary';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [m, e, a] = await Promise.all([
      db.getMembers(),
      db.getEvents(),
      db.getAttendance()
    ]);
    setMembers(m);
    setEvents(e);
    setAttendance(a);
  };

  const filteredMembers = members.filter(m => {
    // 1. Search Text
    const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Status Filter
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    // 3. Attendance Filter
    let matchesAttendance = true;
    if (attendanceFilter === 'never') {
      const hasAnyAttendance = attendance.some(a => a.memberId === m.id);
      matchesAttendance = !hasAnyAttendance;
    } else if (attendanceFilter === 'last_service') {
      // Find the most recent 'completed' service
      const lastService = events
        .filter(e => e.type === 'service' && e.status === 'completed')
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (lastService) {
        matchesAttendance = attendance.some(a => a.memberId === m.id && a.eventId === lastService.id);
      } else {
        matchesAttendance = false; // No last service exists
      }
    }

    return matchesSearch && matchesStatus && matchesAttendance;
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const member: Member = {
      id: `m${Date.now()}`,
      ...newMember,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    await db.addMember(member);
    loadData();
    setIsModalOpen(false);
    setNewMember({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const handleStatusToggle = async (member: Member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    // Optimistic update
    setMembers(members.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
    await db.updateMember(member.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (deleteMemberTarget) {
        await db.deleteMember(deleteMemberTarget.id);
        loadData();
        setDeleteMemberTarget(null);
    }
  };

  const getMemberHistory = (memberId: string) => {
      const records = attendance.filter(a => a.memberId === memberId);
      return records.map(r => {
          const event = events.find(e => e.id === r.eventId);
          return { ...r, event };
      }).filter(item => item.event !== undefined)
      .sort((a, b) => new Date(b.event!.date).getTime() - new Date(a.event!.date).getTime());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-900">Members</h2>
        {canEdit && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          
          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
            </div>
            
             {/* Attendance Filter Dropdown */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value as any)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-slate-700"
                >
                    <option value="all">All History</option>
                    <option value="last_service">Attended Last Service</option>
                    <option value="never">Never Attended</option>
                </select>
            </div>
          </div>
          
          {/* Segmented Control for Status Filter */}
          <div className="flex bg-slate-200/60 p-1 rounded-lg">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
                  statusFilter === status 
                    ? 'bg-white text-blue-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 hidden md:table-cell">Contact</th>
                <th className="px-6 py-4 hidden sm:table-cell">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setHistoryMember(member)}>
                    <div className="font-semibold text-slate-900">{member.firstName} {member.lastName}</div>
                    <div className="text-slate-500 text-xs sm:hidden">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" /> {member.email || <span className="text-slate-400 italic">No email</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3" /> {member.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                        member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {member.status}
                        </span>
                        {/* Quick Toggle Switch */}
                        {canEdit && (
                             <button
                                onClick={() => handleStatusToggle(member)}
                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${member.status === 'active' ? 'bg-blue-600' : 'bg-slate-300'}`}
                                title="Toggle Status"
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${member.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => setHistoryMember(member)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View History"
                        >
                            <History className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setSelectedMember(member)}
                            className="text-blue-700 hover:text-blue-900 font-medium text-sm px-2"
                        >
                            QR
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => setDeleteMemberTarget(member)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Member"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No members found matching your search or filter.
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Member ID</h3>
              <div className="p-4 bg-white border-2 border-slate-100 rounded-xl inline-block shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedMember.id}`} 
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div>
                <p className="font-semibold text-lg">{selectedMember.firstName} {selectedMember.lastName}</p>
                <p className="text-slate-500 font-mono text-sm">{selectedMember.id}</p>
              </div>
              <button 
                className="w-full py-2.5 rounded-lg bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors"
                onClick={() => window.print()}
              >
                Print Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-4 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Attendance History</h3>
                        <p className="text-sm text-slate-500">{historyMember.firstName} {historyMember.lastName}</p>
                    </div>
                    <button onClick={() => setHistoryMember(null)}><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    {getMemberHistory(historyMember.id).length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                            No attendance history recorded.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {getMemberHistory(historyMember.id).map((record) => (
                                <div key={record.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-900">{record.event?.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(record.event!.date).toLocaleDateString()}
                                            <span className="text-slate-300">|</span>
                                            {new Date(record.event!.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${record.event?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {record.event?.status}
                                        </span>
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteMemberTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-100 animate-in bounce-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Member?</h3>
                    <p className="text-slate-500 mb-6">
                        You are about to permanently delete <strong className="text-slate-800">{deleteMemberTarget.firstName} {deleteMemberTarget.lastName}</strong>.
                        <br/><br/>
                        <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            This cannot be undone.
                        </span>
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setDeleteMemberTarget(null)}
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

      {/* Add Member Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add New Member</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={newMember.firstName} onChange={e => setNewMember({...newMember, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={newMember.lastName} onChange={e => setNewMember({...newMember, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newMember.email} 
                  onChange={e => setNewMember({...newMember, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 mt-4">Create Member</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
