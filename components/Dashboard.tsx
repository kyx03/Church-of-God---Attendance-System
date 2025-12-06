
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, CalendarCheck, TrendingUp, Sparkles, Loader2, Calendar } from 'lucide-react';
import { db } from '../services/mockDb';
import { Member, Event, AttendanceRecord } from '../types';
import { generateMinistryInsight } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    Promise.all([db.getMembers(), db.getEvents(), db.getAttendance()])
      .then(([m, e, a]) => {
        setMembers(m);
        setEvents(e);
        setAttendance(a);
      });
  }, []);

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  
  // Prepare chart data
  const chartData = events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(event => {
      const count = attendance.filter(a => a.eventId === event.id).length;
      return {
        name: new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        attendees: count,
        type: event.type
      };
    });

  // Recent Events Data (Last 5)
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    const result = await generateMinistryInsight(members, events, attendance);
    setInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header with fixed height h-24 */}
      <div className="md:h-24 sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 shadow-sm flex items-center shrink-0 py-4 md:py-0">
         <div className="max-w-7xl mx-auto w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Ministry Dashboard</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Overview of church health and engagement.</p>
         </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-8 h-8 text-blue-900" />
            </div>
            <div>
                <p className="text-xs md:text-sm font-medium text-slate-500">Total Members</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900">{totalMembers}</p>
                <p className="text-[10px] md:text-xs text-blue-600 font-medium">{activeMembers} Active</p>
            </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
                <CalendarCheck className="w-8 h-8 text-red-600" />
            </div>
            <div>
                <p className="text-xs md:text-sm font-medium text-slate-500">Events Hosted</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900">{events.length}</p>
                <p className="text-[10px] md:text-xs text-slate-400">This Year</p>
            </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
                <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
                <p className="text-xs md:text-sm font-medium text-slate-500">Avg. Attendance</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900">
                {chartData.length > 0 
                    ? Math.round(chartData.reduce((acc, curr) => acc + curr.attendees, 0) / chartData.length) 
                    : 0}
                </p>
                <p className="text-[10px] md:text-xs text-slate-400">Per Event</p>
            </div>
            </div>
        </div>

        {/* AI Insight Section */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
            <div className="flex items-start justify-between">
            <div className="flex gap-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="max-w-2xl">
                <h3 className="text-base md:text-lg font-semibold mb-2">Pastor's Insight (AI)</h3>
                {insight ? (
                    <p className="text-sm md:text-base text-white/90 leading-relaxed animate-fade-in">"{insight}"</p>
                ) : (
                    <p className="text-xs md:text-sm text-white/70">Generate a ministry health analysis based on your data.</p>
                )}
                </div>
            </div>
            <button 
                onClick={handleGetInsight}
                disabled={loadingInsight}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
                {loadingInsight && <Loader2 className="w-4 h-4 animate-spin" />}
                {insight ? 'Regenerate' : 'Analyze Data'}
            </button>
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">Attendance Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="attendees" 
                    stroke="#1e3a8a" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAttendees)" 
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">Event Types Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="attendees" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Events Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900">Recent Events Log</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                    <th className="px-6 py-4">Event Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Attendance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {recentEvents.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No events recorded yet.</td>
                        </tr>
                    ) : (
                        recentEvents.map(event => {
                        const count = attendance.filter(a => a.eventId === event.id).length;
                        return (
                            <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-900">{event.name}</td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(event.date).toLocaleDateString()} 
                                    <span className="text-slate-300 mx-2">|</span>
                                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="capitalize px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                                        {event.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                        event.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        event.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {event.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">{count}</span>
                                </td>
                            </tr>
                        )
                        })
                    )}
                </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
