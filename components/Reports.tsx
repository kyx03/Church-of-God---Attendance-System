
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Member, Event, AttendanceRecord } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, Users, Calendar as CalendarIcon, FileSpreadsheet, QrCode, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

const Reports: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [memberPage, setMemberPage] = useState(1);
  const [attendeePage, setAttendeePage] = useState(1);

  // Date Filter State (Default to current year)
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const [startDate, setStartDate] = useState(startOfYear.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      db.getMembers(),
      db.getEvents(),
      db.getAttendance()
    ]).then(([m, e, a]) => {
      setMembers(m);
      setEvents(e);
      setAttendance(a);
    }).finally(() => setLoading(false));
  }, []);

  // --- Derived Data ---

  // 1. Filtered Events based on Date Range
  const filteredEvents = events.filter(e => {
    const d = new Date(e.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  });

  const filteredEventIds = new Set(filteredEvents.map(e => e.id));
  const filteredAttendance = attendance.filter(a => filteredEventIds.has(a.eventId));

  // 2. Member Status Data (Pie)
  const activeCount = members.filter(m => m.status === 'active').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;
  const memberStatusData = [
    { name: 'Active', value: activeCount, color: '#16a34a' },
    { name: 'Inactive', value: inactiveCount, color: '#94a3b8' },
  ];

  // 3. Event Status Data (Pie)
  const eventStatusData = [
    { name: 'Upcoming', value: filteredEvents.filter(e => e.status === 'upcoming').length, color: '#3b82f6' },
    { name: 'Completed', value: filteredEvents.filter(e => e.status === 'completed').length, color: '#22c55e' },
    { name: 'Cancelled', value: filteredEvents.filter(e => e.status === 'cancelled').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // 4. Attendance by Event Type (Bar)
  const attendanceByTypeData = ['service', 'youth', 'outreach', 'meeting'].map(type => {
    const typeEvents = filteredEvents.filter(e => e.type === type);
    const eventIds = typeEvents.map(e => e.id);
    const count = attendance.filter(a => eventIds.includes(a.eventId)).length;
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      count: count
    };
  });

  // 5. Check-in Methods (Pie)
  const checkInMethodsData = [
      { name: 'QR Scan', value: filteredAttendance.filter(a => a.method === 'qr').length, color: '#8b5cf6' },
      { name: 'Manual', value: filteredAttendance.filter(a => a.method === 'manual').length, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // 6. Top Attendees (Bar) - With Pagination Logic
  const attendanceCounts: Record<string, number> = {};
  filteredAttendance.forEach(a => {
    attendanceCounts[a.memberId] = (attendanceCounts[a.memberId] || 0) + 1;
  });
  
  const allAttendeesData = Object.entries(attendanceCounts)
    .map(([memberId, count]) => {
        const member = members.find(m => m.id === memberId);
        return {
          name: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
          count
        };
    })
    .sort((a, b) => b.count - a.count);

  const totalAttendeePages = Math.ceil(allAttendeesData.length / ITEMS_PER_PAGE);
  const paginatedAttendeesData = allAttendeesData.slice(
      (attendeePage - 1) * ITEMS_PER_PAGE,
      attendeePage * ITEMS_PER_PAGE
  );


  // 7. Member List with Last Attended Date - With Pagination Logic
  const processedMembers = members.map(m => {
    const memberAttendance = attendance.filter(a => a.memberId === m.id);
    let lastAttendedDate: string | null = null;
    let lastAttendedTs = 0;

    if (memberAttendance.length > 0) {
      // Find the latest event date attended
      memberAttendance.forEach(r => {
        const evt = events.find(e => e.id === r.eventId);
        const ts = evt ? new Date(evt.date).getTime() : new Date(r.timestamp).getTime();
        if (ts > lastAttendedTs) {
            lastAttendedTs = ts;
            lastAttendedDate = evt ? evt.date : r.timestamp;
        }
      });
    }
    return { ...m, lastAttended: lastAttendedDate, lastAttendedTs };
  }).sort((a, b) => b.lastAttendedTs - a.lastAttendedTs);

  const totalMemberPages = Math.ceil(processedMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = processedMembers.slice(
      (memberPage - 1) * ITEMS_PER_PAGE,
      memberPage * ITEMS_PER_PAGE
  );


  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Status', 'Join Date', 'Last Attended', 'Email', 'Phone'];
    const rows = processedMembers.map(m => [
        m.firstName,
        m.lastName,
        m.status,
        m.joinDate,
        m.lastAttended ? new Date(m.lastAttended).toLocaleDateString() : 'Never',
        m.email,
        m.phone
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `church_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Reports Center</h2>
          <p className="text-slate-500">Analytics and member insights.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm w-full lg:w-auto">
            <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-500 uppercase">Range</span>
            </div>
            <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="text-sm outline-none bg-transparent text-slate-700 font-medium cursor-pointer flex-1"
                style={{ colorScheme: 'light' }}
            />
            <span className="text-slate-300">–</span>
            <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="text-sm outline-none bg-transparent text-slate-700 font-medium cursor-pointer flex-1"
                style={{ colorScheme: 'light' }}
            />
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
             <button 
                onClick={handlePrint}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
            >
                <Download className="w-4 h-4" />
                Print PDF
            </button>
            <button 
                onClick={handleExportCSV}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm"
            >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
            </button>
        </div>
      </div>

      {/* Row 1: Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Member Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-slate-900 mb-2">Member Status</h3>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={memberStatusData}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                        >
                        {memberStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-center mt-2">
                <div>
                   <span className="block text-2xl font-bold text-green-600">{activeCount}</span>
                   <span className="text-xs text-slate-400 font-bold uppercase">Active</span>
                </div>
                <div>
                   <span className="block text-2xl font-bold text-slate-500">{inactiveCount}</span>
                   <span className="text-xs text-slate-400 font-bold uppercase">Inactive</span>
                </div>
            </div>
        </div>

        {/* Event Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-slate-900 mb-2">Event Status</h3>
            <p className="text-xs text-slate-400 mb-4">In selected range</p>
            <div className="flex-1 min-h-[200px]">
                {eventStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={eventStatusData}
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                            >
                            {eventStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">No events in range</div>
                )}
            </div>
        </div>

        {/* Total Members Card */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 rounded-xl shadow-lg shadow-blue-900/20 text-white flex flex-col justify-between">
             <div>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Total Membership</span>
                </div>
                <p className="text-5xl font-black tracking-tight">{members.length}</p>
             </div>
             <div className="space-y-2">
                 <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                     <p className="text-xs text-blue-200 uppercase font-bold mb-1">New Members (In Range)</p>
                     <p className="text-xl font-bold">
                        {members.filter(m => {
                            const join = new Date(m.joinDate);
                            return join >= new Date(startDate) && join <= new Date(endDate);
                        }).length}
                     </p>
                 </div>
             </div>
        </div>
      </div>

      {/* Row 2: Attendance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance by Event Type */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Attendance by Event Type</h3>
                <p className="text-sm text-slate-500">Total counts for the selected period.</p>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceByTypeData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Check-in Methods & Top Attendees */}
        <div className="space-y-6">
            {/* Check-in Methods */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                     <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-purple-600" />
                        Check-in Methods
                     </h3>
                     <p className="text-xs text-slate-400">QR vs Manual Entry</p>
                </div>
                <div className="h-32 w-32">
                    {checkInMethodsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={checkInMethodsData} innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                                {checkInMethodsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-xs text-slate-300">No Data</div>}
                </div>
            </div>

            {/* Top Attendees */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        Top Attendees
                    </h3>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setAttendeePage(p => Math.max(1, p - 1))}
                            disabled={attendeePage === 1}
                            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </button>
                        <span className="text-xs text-slate-500 font-medium pt-1">
                            {attendeePage}/{totalAttendeePages || 1}
                        </span>
                        <button 
                            onClick={() => setAttendeePage(p => Math.min(totalAttendeePages, p + 1))}
                            disabled={attendeePage === totalAttendeePages || totalAttendeePages === 0}
                            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                 </div>
                 <div className="h-40 flex-1">
                     {paginatedAttendeesData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paginatedAttendeesData} layout="vertical" margin={{top: 0, right: 30, left: 30, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#475569'}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={15} />
                            </BarChart>
                         </ResponsiveContainer>
                     ) : <div className="h-full flex items-center justify-center text-sm text-slate-400">No attendance data available</div>}
                 </div>
            </div>
        </div>
      </div>

      {/* Row 3: Member List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Detailed Member List</h3>
            <span className="text-xs text-slate-400 font-medium bg-slate-200 px-2 py-1 rounded">Sorted by Last Attended</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Join Date</th>
                        <th className="px-6 py-3 text-blue-900 font-semibold bg-blue-50/50">Last Attended</th>
                        <th className="px-6 py-3 text-right">Contact</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {paginatedMembers.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-900">{m.firstName} {m.lastName}</td>
                            <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                    m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {m.status}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-slate-500">{m.joinDate}</td>
                            <td className="px-6 py-3 font-medium bg-blue-50/30 text-slate-700">
                                {m.lastAttended ? (
                                    <span>{new Date(m.lastAttended).toLocaleDateString()}</span>
                                ) : (
                                    <span className="text-slate-400 italic">Never</span>
                                )}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-500">{m.phone}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* Pagination Footer */}
        {processedMembers.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Showing {Math.min((memberPage - 1) * ITEMS_PER_PAGE + 1, processedMembers.length)} to {Math.min(memberPage * ITEMS_PER_PAGE, processedMembers.length)} of {processedMembers.length} members
                </span>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                        disabled={memberPage === 1}
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalMemberPages) }, (_, i) => {
                         let p = i + 1;
                         if (totalMemberPages > 5 && memberPage > 3) {
                             p = memberPage - 2 + i;
                             if (p > totalMemberPages) p = totalMemberPages - (4 - i);
                         }
                         
                         return (
                            <button
                                key={p}
                                onClick={() => setMemberPage(p)}
                                className={`w-7 h-7 rounded text-xs font-medium ${memberPage === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                {p}
                            </button>
                         );
                    })}
                    <button 
                        onClick={() => setMemberPage(p => Math.min(totalMemberPages, p + 1))}
                        disabled={memberPage === totalMemberPages}
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
