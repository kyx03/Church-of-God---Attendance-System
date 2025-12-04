import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Mail, Phone, MoreVertical, X, Filter, Trash2, Power, History, Calendar, CheckCircle2, AlertTriangle, Check, Upload, FileUp, Edit2, ChevronDown, Users, Printer, CheckSquare, Square, ChevronLeft, ChevronRight, Ban, Activity } from 'lucide-react';
import { db } from '../services/mockDb';
import { Member, Event, AttendanceRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

const PREDEFINED_MINISTRIES = [
  "Children's Ministry",
  "Ladies' Ministry",
  "Men's Ministry",
  "Music Ministry",
  "None"
];

const ITEMS_PER_PAGE = 5;

const Members: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [slogan, setSlogan] = useState('Puelay'); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'last_service' | 'last_30_days' | 'last_90_days' | 'never'>('all');
  const [ministryFilter, setMinistryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [historyMember, setHistoryMember] = useState<Member | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<{
    id: string;
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string;
    ministry: string;
  }>({ id: '', firstName: '', lastName: '', email: '', phone: '', ministry: 'None' });
  
  const [isCustomMinistry, setIsCustomMinistry] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'secretary';

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set()); // Clear selection on filter change to avoid confusion
  }, [searchTerm, statusFilter, ministryFilter, attendanceFilter]);

  const loadData = async () => {
    const [m, e, a, s] = await Promise.all([
      db.getMembers(),
      db.getEvents(),
      db.getAttendance(),
      db.getSettings()
    ]);
    setMembers(m);
    setEvents(e);
    setAttendance(a);
    if (s && s.slogan) setSlogan(s.slogan);
  };

  const generateMemberId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term);
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesMinistry = ministryFilter === 'all' || m.ministry === ministryFilter;

    let matchesAttendance = true;
    const memberAttendance = attendance.filter(a => a.memberId === m.id);
    let lastAttendedTime = 0;
    memberAttendance.forEach(a => {
        const evt = events.find(e => e.id === a.eventId);
        const time = evt ? new Date(evt.date).getTime() : new Date(a.timestamp).getTime();
        if (time > lastAttendedTime) lastAttendedTime = time;
    });

    if (attendanceFilter === 'never') {
      matchesAttendance = memberAttendance.length === 0;
    } else if (attendanceFilter === 'last_service') {
      const lastService = events
        .filter(e => e.type === 'service' && e.status === 'completed')
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (lastService) {
        matchesAttendance = attendance.some(a => a.memberId === m.id && a.eventId === lastService.id);
      } else {
        matchesAttendance = false;
      }
    } else if (attendanceFilter === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchesAttendance = lastAttendedTime >= thirtyDaysAgo.getTime();
    } else if (attendanceFilter === 'last_90_days') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        matchesAttendance = lastAttendedTime >= ninetyDaysAgo.getTime();
    }

    return matchesSearch && matchesStatus && matchesAttendance && matchesMinistry;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const uniqueMinistries = Array.from(new Set([
      ...PREDEFINED_MINISTRIES, 
      ...members.map(m => m.ministry || 'None')
  ])).sort();

  // Selection Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const idsOnPage = paginatedMembers.map(m => m.id);
    const allSelected = idsOnPage.every(id => selectedIds.has(id));
    
    const newSet = new Set(selectedIds);
    if (allSelected) {
        idsOnPage.forEach(id => newSet.delete(id));
    } else {
        idsOnPage.forEach(id => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const openAddModal = () => {
    setEditingId(null);
    let newId = generateMemberId();
    while(members.some(m => m.id === newId)) newId = generateMemberId();
    
    setNewMember({ id: newId, firstName: '', lastName: '', email: '', phone: '', ministry: 'None' });
    setIsCustomMinistry(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingId(member.id);
    const ministry = member.ministry || 'None';
    const isCustom = !PREDEFINED_MINISTRIES.includes(ministry);
    
    setNewMember({ 
        id: member.id,
        firstName: member.firstName, 
        lastName: member.lastName, 
        email: member.email, 
        phone: member.phone,
        ministry: ministry
    });
    setIsCustomMinistry(isCustom);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddOrUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const idRegex = /^[A-Z0-9]{6}$/;
    const upperId = newMember.id.toUpperCase();
    
    if (!idRegex.test(upperId)) {
        setFormError("Member ID must be exactly 6 alphanumeric characters (A-Z, 0-9).");
        return;
    }

    const isDuplicate = members.some(m => m.id === upperId && m.id !== editingId);
    if (isDuplicate) {
        setFormError("This Member ID is already assigned to another member.");
        return;
    }
    
    if (editingId) {
        await db.updateMember(editingId, {
            firstName: newMember.firstName,
            lastName: newMember.lastName,
            email: newMember.email,
            phone: newMember.phone,
            ministry: newMember.ministry
        });
        setStatusMsg("Member updated successfully.");
    } else {
        const member: Member = {
            id: upperId,
            firstName: newMember.firstName,
            lastName: newMember.lastName,
            email: newMember.email,
            phone: newMember.phone,
            ministry: newMember.ministry,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        await db.addMember(member);
        setStatusMsg("Member added successfully.");
    }
    
    loadData();
    setIsModalOpen(false);
    setEditingId(null);
    setIsCustomMinistry(false);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleStatusToggle = async (member: Member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
    setStatusMsg(`${member.firstName} is now ${newStatus}.`);
    setTimeout(() => setStatusMsg(null), 3000);
    await db.updateMember(member.id, { status: newStatus });
  };

  const handleBulkStatusUpdate = async (newStatus: 'active' | 'inactive') => {
      // Fix: Explicitly type ids as string array to prevent 'unknown' type errors
      const ids = Array.from(selectedIds) as string[];
      if (ids.length === 0) return;

      if (!confirm(`Are you sure you want to set ${ids.length} members to ${newStatus}?`)) return;

      try {
        // Optimistic Update
        setMembers(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: newStatus } : m));
        // Fix: Explicitly type new Set as Set<string>
        setSelectedIds(new Set<string>()); // Clear selection
        setStatusMsg(`Updated ${ids.length} members to ${newStatus}.`);
        
        // Parallel backend updates
        await Promise.all(ids.map(id => db.updateMember(id, { status: newStatus })));
        
        // Reload to ensure consistency
        await loadData();
      } catch (err: any) {
        console.error("Bulk update failed", err);
        setStatusMsg("Failed to update some members.");
        loadData(); // Revert on error
      }
      
      setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDelete = async () => {
    if (deleteMemberTarget) {
        await db.deleteMember(deleteMemberTarget.id);
        loadData();
        setDeleteMemberTarget(null);
        if (paginatedMembers.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const target = event.target as FileReader;
      const result = target?.result;
      if (typeof result !== 'string') return;
      const text = result as string;

      if (!text) return;

      const lines = text.split('\n');
      let count = 0;
      const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [firstName, lastName, email, phone, ministry] = line.split(',').map(s => s.trim());
        
        if (firstName && lastName) {
          let newId = generateMemberId();
          while(members.some(m => m.id === newId)) newId = generateMemberId();

          await db.addMember({
            id: newId,
            firstName,
            lastName,
            email: email || '',
            phone: phone || '',
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active',
            ministry: ministry || 'None'
          });
          count++;
        }
      }
      
      loadData();
      alert(`Successfully imported ${count} members.`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getMemberHistory = (memberId: string) => {
      const records = attendance.filter(a => a.memberId === memberId);
      return records.map(r => {
          const event = events.find(e => e.id === r.eventId);
          return { ...r, event };
      }).filter(item => item.event !== undefined)
      .sort((a, b) => new Date(b.event!.date).getTime() - new Date(a.event!.date).getTime());
  };

  // --- Printing Logic ---
  const getCardHtml = (member: Member) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${member.id}`;
    return `
      <div class="card">
        <div class="header">
          <img src="/logo.png" class="logo" onerror="this.style.display='none'" />
          <div class="org-title">
            <div class="main-title">Church of God</div>
            <div class="sub-title">${slogan}</div>
          </div>
        </div>
        ${member.ministry && member.ministry !== 'None' ? `<div class="ministry">${member.ministry}</div>` : '<div class="ministry" style="visibility:hidden">-</div>'}
        <div class="qr-container"><img src="${qrUrl}" class="qr-img" /></div>
        <div class="content"><h2 class="name">${member.firstName}<br/>${member.lastName}</h2></div>
        <div class="footer"><div class="id-label">MEMBER ID</div><div class="id-value">${member.id}</div></div>
      </div>
    `;
  };

  const getPrintStyles = (isBulk: boolean) => `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; background: white; -webkit-print-color-adjust: exact; }
    .card { width: 2.3in; height: 3.0in; border: 1px solid #94a3b8; border-radius: 8px; padding: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; background: white; box-sizing: border-box; position: relative; }
    ${isBulk ? `@page { size: 8.5in 13in; margin: 0.5in; } .container { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, 1fr); gap: 0.25in; width: 100%; justify-items: center; } .card { page-break-inside: avoid; }` : `.container { display: flex; justify-content: center; align-items: center; height: 100vh; } .card { border: 2px solid #000; }`}
    .header { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 6px; margin-bottom: 6px; width: 100%; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .logo { width: 24px; height: 24px; object-fit: contain; }
    .org-title { text-align: left; }
    .main-title { font-size: 10px; font-weight: 800; color: #1e3a8a; line-height: 1.1; text-transform: uppercase; }
    .sub-title { font-size: 8px; color: #3b82f6; font-weight: 600; letter-spacing: 0.5px; }
    .ministry { background: #eff6ff; color: #1e40af; padding: 2px 6px; border-radius: 8px; font-size: 8px; font-weight: bold; margin-bottom: 6px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; }
    .qr-container { margin-bottom: 6px; width: 1.1in; height: 1.1in; display: flex; align-items: center; justify-content: center; }
    .qr-img { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; }
    .content { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
    .name { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1; word-wrap: break-word; }
    .footer { width: 100%; background: #0f172a; color: white; padding: 3px 0; border-radius: 4px; margin-top: auto; }
    .id-label { font-size: 6px; opacity: 0.7; letter-spacing: 1px; }
    .id-value { font-family: monospace; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
  `;

  const handlePrint = (member: Member | null = null) => {
    let membersToPrint: Member[] = [];
    let isBulk = false;
    if (member) {
        membersToPrint = [member];
        isBulk = false;
    } else {
        if (selectedIds.size > 0) {
            membersToPrint = members.filter(m => selectedIds.has(m.id));
        } else {
            membersToPrint = filteredMembers;
        }
        if (membersToPrint.length === 0) {
            alert("No members to print.");
            return;
        }
        isBulk = true; 
    }
    const printWindow = window.open('', '_blank', `width=${isBulk ? 1000 : 400},height=${isBulk ? 800 : 600}`);
    if (!printWindow) return;
    const cardsHtml = membersToPrint.map(m => getCardHtml(m)).join('');
    printWindow.document.write(`<html><head><title>Member IDs</title><style>${getPrintStyles(isBulk)}</style></head><body><div class="container">${cardsHtml}</div><script>window.onload=()=>{window.print();}</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full relative">
      {statusMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in">
           <CheckCircle2 className="w-5 h-5 text-green-400" />
           <span className="font-medium text-sm">{statusMsg}</span>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Members</h2>
            {canEdit && (
            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                <button 
                onClick={() => handlePrint(null)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors flex-1 xl:flex-none justify-center whitespace-nowrap shadow-sm text-xs md:text-sm"
                >
                <Printer className="w-4 h-4 md:w-5 md:h-5" />
                <span>{selectedIds.size > 0 ? `Print Selected (${selectedIds.size})` : 'Print All IDs'}</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors flex-1 xl:flex-none justify-center whitespace-nowrap shadow-sm text-xs md:text-sm">
                <FileUp className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Import</span>
                </button>
                <button onClick={openAddModal} className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors flex-1 xl:flex-none justify-center whitespace-nowrap shadow-md shadow-blue-900/10 text-xs md:text-sm">
                <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span>Add Member</span>
                </button>
            </div>
            )}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                    <input 
                    type="text" placeholder="Search name, email, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 text-sm"
                    />
                </div>
                <div className="relative w-full md:w-auto min-w-[180px]">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select value={ministryFilter} onChange={(e) => setMinistryFilter(e.target.value)} className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-slate-900 appearance-none cursor-pointer">
                        <option value="all">All Ministries</option>
                        {uniqueMinistries.filter(m => m !== 'None').map(m => (<option key={m} value={m}>{m}</option>))}
                        <option value="None">None</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative w-full md:w-auto min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value as any)} className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-slate-900 appearance-none cursor-pointer">
                        <option value="all">All History</option>
                        <option value="last_service">Attended Last Service</option>
                        <option value="last_30_days">Attended in Last 30 Days</option>
                        <option value="last_90_days">Attended in Last 90 Days</option>
                        <option value="never">Never Attended</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
            <div className="flex bg-slate-200/60 p-1 rounded-lg shrink-0 w-full lg:w-auto overflow-x-auto">
                {['all', 'active', 'inactive'].map((status) => (
                <button key={status} onClick={() => setStatusFilter(status as any)} className={`flex-1 lg:flex-none px-4 py-1.5 rounded-md text-xs md:text-sm font-medium capitalize transition-all duration-200 whitespace-nowrap ${statusFilter === status ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                    {status}
                </button>
                ))}
            </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && canEdit && (
                <div className="bg-blue-50 px-6 py-2 border-b border-blue-100 flex items-center justify-between animate-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-blue-800">{selectedIds.size} selected</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleBulkStatusUpdate('active')} className="text-xs px-3 py-1.5 bg-white border border-blue-200 rounded text-blue-700 font-semibold hover:bg-blue-100 flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Set Active
                        </button>
                        <button onClick={() => handleBulkStatusUpdate('inactive')} className="text-xs px-3 py-1.5 bg-white border border-blue-200 rounded text-slate-600 font-semibold hover:bg-slate-100 flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Set Inactive
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                    <th className="px-4 py-4 w-10 text-center">
                        <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-blue-600">
                            {paginatedMembers.length > 0 && paginatedMembers.every(m => selectedIds.has(m.id)) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                        </button>
                    </th>
                    <th className="px-6 py-4">Name & ID</th>
                    <th className="px-6 py-4 hidden md:table-cell">Contact</th>
                    <th className="px-6 py-4">Ministry</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {paginatedMembers.map(member => {
                    const isSelected = selectedIds.has(member.id);
                    return (
                    <tr key={member.id} className={`transition-colors ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleSelection(member.id)} className="flex items-center justify-center text-slate-300 hover:text-blue-500">
                            {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                        </button>
                    </td>
                    <td className="px-6 py-4 cursor-pointer group" onClick={() => setHistoryMember(member)}>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{member.firstName} {member.lastName}</div>
                        <div className="text-slate-400 text-xs font-mono mt-0.5">{member.id}</div>
                        <div className="text-slate-500 text-xs sm:hidden mt-1">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-600">
                        <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {member.email || <span className="text-slate-400 italic">No email</span>}</div>
                        <div className="flex items-center gap-2 mt-1"><Phone className="w-3 h-3" /> {member.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                        {member.ministry && member.ministry !== 'None' ? (
                            <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">{member.ministry}</span>
                        ) : <span className="text-slate-400 text-xs italic">None</span>}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{member.status}</span>
                            {canEdit && (
                                <button onClick={() => handleStatusToggle(member)} className={`w-8 h-4 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${member.status === 'active' ? 'bg-blue-600' : 'bg-slate-300'}`} title={`Mark as ${member.status === 'active' ? 'inactive' : 'active'}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${member.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setHistoryMember(member)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View History"><History className="w-4 h-4" /></button>
                            <button onClick={() => setSelectedMember(member)} className="text-blue-700 hover:text-blue-900 font-medium text-xs px-2 py-1 bg-blue-50 rounded border border-blue-100">QR</button>
                            {canEdit && (
                                <>
                                    <button onClick={() => openEditModal(member)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Member"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => setDeleteMemberTarget(member)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Member"><Trash2 className="w-4 h-4" /></button>
                                </>
                            )}
                        </div>
                    </td>
                    </tr>
                )})}
                </tbody>
            </table>
            {filteredMembers.length === 0 && <div className="p-8 text-center text-slate-500">No members found matching your search or filter.</div>}
            </div>

            {/* Pagination Footer */}
            {filteredMembers.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                        Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredMembers.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length} members
                    </span>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let p = i + 1;
                            if (totalPages > 5 && currentPage > 3) {
                                p = currentPage - 2 + i;
                                if (p > totalPages) p = totalPages - (4 - i);
                            }
                            
                            return (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-7 h-7 rounded text-xs font-medium ${currentPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Modals */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setSelectedMember(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Member ID</h3>
              <div className="p-4 bg-white border-2 border-slate-100 rounded-xl inline-block shadow-inner">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedMember.id}`} alt="QR Code" className="w-48 h-48"/>
              </div>
              <div>
                <p className="font-semibold text-lg">{selectedMember.firstName} {selectedMember.lastName}</p>
                 {selectedMember.ministry && selectedMember.ministry !== 'None' && <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-2 border border-indigo-100">{selectedMember.ministry}</span>}
                <p className="text-slate-500 font-mono text-sm tracking-widest">{selectedMember.id}</p>
              </div>
              <button className="w-full py-2.5 rounded-lg bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-2" onClick={() => handlePrint(selectedMember)}><Printer className="w-4 h-4" />Print Card</button>
            </div>
          </div>
        </div>
      )}
      
      {historyMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-4 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div><h3 className="text-xl font-bold text-slate-900">Attendance History</h3><p className="text-sm text-slate-500">{historyMember.firstName} {historyMember.lastName}</p></div>
                    <button onClick={() => setHistoryMember(null)}><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    {getMemberHistory(historyMember.id).length === 0 ? <div className="p-10 text-center text-slate-400">No attendance history recorded.</div> : (
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
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${record.event?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{record.event?.status}</span>
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

      {deleteMemberTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-100 animate-in bounce-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Member?</h3>
                    <p className="text-slate-500 mb-6">You are about to permanently delete <strong className="text-slate-800">{deleteMemberTarget.firstName} {deleteMemberTarget.lastName}</strong>.<br/><br/><span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3 inline mr-1" /> This cannot be undone.</span></p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setDeleteMemberTarget(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-600/20">Confirm Delete</button>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Member' : 'Add New Member'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{formError}</span>
                </div>
            )}
            <form onSubmit={handleAddOrUpdateMember} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Member ID</label>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 font-mono tracking-wider uppercase"
                    value={newMember.id}
                    onChange={e => setNewMember({...newMember, id: e.target.value.toUpperCase()})}
                  />
                  <p className="text-xs text-slate-400 mt-1">Must be 6 alphanumeric characters.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newMember.firstName} onChange={e => setNewMember({...newMember, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newMember.lastName} onChange={e => setNewMember({...newMember, lastName: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ministry Type</label>
                 {isCustomMinistry ? (
                    <div className="flex gap-2">
                        <input autoFocus type="text" placeholder="Enter ministry name..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newMember.ministry} onChange={e => setNewMember({...newMember, ministry: e.target.value})} />
                        <button type="button" onClick={() => { setIsCustomMinistry(false); setNewMember({...newMember, ministry: 'None'}); }} className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <div className="relative">
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 appearance-none" value={newMember.ministry} onChange={e => {
                                if (e.target.value === 'custom') { setIsCustomMinistry(true); setNewMember({...newMember, ministry: ''}); } 
                                else { setNewMember({...newMember, ministry: e.target.value}); }
                            }}>
                            {PREDEFINED_MINISTRIES.map(m => (<option key={m} value={m}>{m}</option>))}
                            <option value="custom">Other / Custom...</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 mt-4">
                  {editingId ? 'Save Changes' : 'Create Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;