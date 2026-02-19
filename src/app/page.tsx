'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalStartups: number;
  regions: { region: string; count: number }[];
  avgRelevance: number;
  newThisWeek: number;
  verticals: { vertical: string; count: number }[];
  recent: { id: number; name: string; region: string; vertical: string; relevance_score: number; discovered_at: string }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#a78bfa', '#60a5fa', '#818cf8', '#c084fc', '#93c5fd'];

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!stats) return <div className="text-center py-20 text-red-400">Failed to load stats</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Startups', value: stats.totalStartups, color: 'blue' },
          { label: 'Regions', value: stats.regions.length, color: 'purple' },
          { label: 'Avg Relevance', value: stats.avgRelevance, color: 'indigo' },
          { label: 'New This Week', value: stats.newThisWeek, color: 'violet' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">{s.label}</p>
            <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Startups by Region</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.regions}>
              <XAxis dataKey="region" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={(_: unknown, index: number) => { const region = stats.regions[index]?.region; if (region) router.push(`/startups?region=${encodeURIComponent(region)}`); }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Startups by Vertical</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.verticals.slice(0, 8)} dataKey="count" nameKey="vertical" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`} labelLine={false} fontSize={11} className="cursor-pointer" onClick={(_: unknown, index: number) => { const vertical = stats.verticals[index]?.vertical; if (vertical) router.push(`/startups?vertical=${encodeURIComponent(vertical)}`); }}>
                {stats.verticals.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Additions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-2">Name</th><th className="text-left py-2">Region</th><th className="text-left py-2">Vertical</th><th className="text-left py-2">Relevance</th><th className="text-left py-2">Added</th>
            </tr></thead>
            <tbody>
              {stats.recent.map(s => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                  <td className="py-2"><Link href={`/startups/${s.id}`} className="text-blue-400 hover:underline">{s.name}</Link></td>
                  <td className="py-2">{s.region}</td>
                  <td className="py-2">{s.vertical}</td>
                  <td className="py-2"><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">{s.relevance_score}</span></td>
                  <td className="py-2 text-gray-400">{s.discovered_at ? new Date(s.discovered_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
