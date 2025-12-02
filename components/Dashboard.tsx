import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, CalendarCheck, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
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

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    const result = await generateMinistryInsight(members, events, attendance);
    setInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Ministry Dashboard</h2>
        <p className="text-slate-500 mt-1">Overview of church health and engagement.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Members</p>
            <p className="text-2xl font-bold text-slate-900">{totalMembers}</p>
            <p className="text-xs text-green-600 font-medium">{activeMembers} Active</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <CalendarCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Events Hosted</p>
            <p className="text-2xl font-bold text-slate-900">{events.length}</p>
            <p className="text-xs text-slate-400">This Year</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg. Attendance</p>
            <p className="text-2xl font-bold text-slate-900">
              {chartData.length > 0 
                ? Math.round(chartData.reduce((acc, curr) => acc + curr.attendees, 0) / chartData.length) 
                : 0}
            </p>
            <p className="text-xs text-slate-400">Per Event</p>
          </div>
        </div>
      </div>

      {/* AI Insight Section */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-2">Pastor's Insight (AI)</h3>
              {insight ? (
                <p className="text-white/90 leading-relaxed animate-fade-in">"{insight}"</p>
              ) : (
                <p className="text-white/70 text-sm">Generate a ministry health analysis based on your data.</p>
              )}
            </div>
          </div>
          <button 
            onClick={handleGetInsight}
            disabled={loadingInsight}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loadingInsight && <Loader2 className="w-4 h-4 animate-spin" />}
            {insight ? 'Regenerate' : 'Analyze Data'}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
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
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="attendees" 
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAttendees)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Event Types Breakdown</h3>
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
              <Bar dataKey="attendees" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;