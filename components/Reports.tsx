
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Member } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Users } from 'lucide-react';

const Reports: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getMembers()
      .then(m => setMembers(m))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = members.filter(m => m.status === 'active').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;
  
  const data = [
    { name: 'Active', value: activeCount, color: '#16a34a' },
    { name: 'Inactive', value: inactiveCount, color: '#94a3b8' },
  ];

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Member Status Report</h2>
          <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
            <Download className="w-4 h-4" />
            Print / Save PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg mb-4">Status Distribution</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-bold uppercase">Active</p>
                    <p className="text-2xl font-bold text-green-700">{activeCount}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 font-bold uppercase">Inactive</p>
                    <p className="text-2xl font-bold text-slate-600">{inactiveCount}</p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
             <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-lg">Total Membership</h3>
             </div>
             <div className="flex-1 flex items-center justify-center">
                 <div className="text-center">
                    <p className="text-6xl font-black text-blue-900">{members.length}</p>
                    <p className="text-slate-400 mt-2">Registered Profiles</p>
                 </div>
             </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-700">Detailed Member List</h3>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Join Date</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {members.map(m => (
                    <tr key={m.id}>
                        <td className="px-6 py-3 font-medium text-slate-900">{m.firstName} {m.lastName}</td>
                        <td className="px-6 py-3">
                             <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {m.status}
                            </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500">{m.joinDate}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
