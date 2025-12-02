import React, { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, MoreVertical, X, Filter } from 'lucide-react';
import { db } from '../services/mockDb';
import { Member } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Members: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const canEdit = user?.role === 'admin' || user?.role === 'secretary';

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = () => {
    db.getMembers().then(setMembers);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
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
    loadMembers();
    setIsModalOpen(false);
    setNewMember({ firstName: '', lastName: '', email: '', phone: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-900">Members</h2>
        {canEdit && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          {/* Segmented Control for Status Filter */}
          <div className="flex bg-slate-200/60 p-1 rounded-lg self-start md:self-auto">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
                  statusFilter === status 
                    ? 'bg-white text-indigo-700 shadow-sm' 
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
                  <td className="px-6 py-4">
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
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                      member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedMember(member)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      View QR
                    </button>
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
                className="w-full py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                onClick={() => window.print()}
              >
                Print Card
              </button>
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
                  <input required className="w-full px-3 py-2 border rounded-lg" value={newMember.firstName} onChange={e => setNewMember({...newMember, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input required className="w-full px-3 py-2 border rounded-lg" value={newMember.lastName} onChange={e => setNewMember({...newMember, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border rounded-lg" 
                  value={newMember.email} 
                  onChange={e => setNewMember({...newMember, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-lg" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 mt-4">Create Member</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;