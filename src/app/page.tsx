'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalStartups: number;
  regions: { region: string; count: number }[];
  avgRelevance: number;
  verticals: { vertical: string; count: number }[];
  stages: { stage: string; count: number }[];
  topLeads: { id: number; name: string; country: string; vertical: string; relevance_score: number; funding_amount: string }[];
  needsDatabase: number;
  totalPersons: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#a78bfa', '#60a5fa', '#818cf8', '#c084fc', '#93c5fd'];
const STAGE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#f59e0b'];

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!stats) return <div className="text-center py-20 text-red-400">Failed to load stats</div>;

  const dbPercent = stats.totalStartups ? Math.round((stats.needsDatabase / stats.totalStartups) * 100) : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Startups', value: stats.totalStartups },
          { label: 'Key People Tracked', value: stats.totalPersons },
          { label: 'Need Database', value: `${stats.needsDatabase} (${dbPercent}%)` },
          { label: 'Avg Relevance', value: stats.avgRelevance },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">{s.label}</p>
            <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Startups by Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.stages} layout="vertical">
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis type="category" dataKey="stage" stroke="#9ca3af" fontSize={12} width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={(_: unknown, index: number) => { const stage = stats.stages[index]?.stage; if (stage) router.push(`/startups?sort=stage&search=${encodeURIComponent(stage)}`); }}>
                {stats.stages.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Leads */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">🔥 Top Leads for TiDB</h2>
          <div className="space-y-2">
            {stats.topLeads.map(s => (
              <Link key={s.id} href={`/startups/${s.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition group">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">{s.relevance_score}</span>
                  <div>
                    <p className="text-sm font-medium group-hover:text-blue-400 transition">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.country} · {s.vertical}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{s.funding_amount}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
