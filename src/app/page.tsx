'use client';

function normalizeStage(stage: string | null | undefined): string {
  const raw = (stage || '').trim();
  if (!raw) return 'Unknown';

  const s = raw.toLowerCase().replace(/[_\s]+/g, ' ').trim();
  if (['n/a', 'na', 'n.a.', 'unknown', 'unknown stage', '-', '—', ''].includes(s)) return 'Unknown';
  if (['acquired', 'acquisition'].includes(s)) return 'Acquired';
  if (['public', 'ipo', 'listed'].includes(s)) return 'Public';
  if (['growth', 'growth stage', 'series c', 'series d', 'series d+', 'c', 'd', 'd+'].includes(s)) return 'Growth+';
  if (['seed', 'seed stage', 'pre-seed', 'pre seed', 'preseed', 'seed/pre-seed', 'pre-seed/seed', 'pre seed/seed'].includes(s)) return 'Seed';

  const seriesMatch = s.match(/^series\s*([a-d])(\+)?$/i) || s.match(/^([a-d])(\+)?$/i);
  if (seriesMatch) {
    const letter = seriesMatch[1].toUpperCase();
    if (letter === 'A' || letter === 'B') return `Series ${letter}`;
    return 'Growth+';
  }

  return 'Unknown';
}

function normalizeVertical(vertical: string | null | undefined): string {
  const raw = (vertical || '').trim();
  if (!raw) return 'Other';

  const s = raw.toLowerCase().replace(/[_\s]+/g, ' ').trim();
  if (['llm-infra', 'llm infra', 'foundation model infra', 'model infra'].includes(s)) return 'LLM Infrastructure';
  if (['ai infrastructure', 'infrastructure ai', 'infra', 'ai infra'].includes(s)) return 'AI Infrastructure';
  if (['agents', 'agent', 'agentic ai', 'agentic'].includes(s)) return 'Agents';
  if (['ai/ml', 'ml', 'machine learning', 'artificial intelligence'].includes(s)) return 'AI/ML';
  if (['enterprise ai', 'enterprise automation ai', 'enterprise agent'].includes(s)) return 'Enterprise AI';
  if (['ai application - horizontal', 'horizontal ai', 'ai apps', 'application ai'].includes(s)) return 'AI Applications';
  if (['dev-tools', 'developer tools', 'ai developer tools', 'coding'].includes(s)) return 'Developer Tools';
  if (['data-platform', 'data platform', 'rag', 'retrieval', 'search'].includes(s)) return 'Data Platforms';
  if (['cv', 'computer vision', 'vision', 'video ai'].includes(s)) return 'Computer Vision';
  if (['nlp', 'language', 'text ai'].includes(s)) return 'NLP';
  if (['fintech', 'healthcare', 'edtech', 'legaltech', 'ecommerce', 'retail', 'sales', 'marketing'].includes(s)) return 'AI Applications';
  if (['other', 'misc', 'general'].includes(s)) return 'Other';

  return raw
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatFunding(amount: string): string {
  const n = Number(amount);
  if (!n || isNaN(n)) return amount;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}
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
  needsDatabase: number;
  totalPersons: number;
  totalNews: number;
  topFunded: { id: number; name: string; country: string; vertical: string; funding_amount: string; stage: string }[];
  apacCount: number;
  totalVCs: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#a78bfa', '#60a5fa', '#818cf8', '#c084fc', '#93c5fd'];
const STAGE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#f59e0b', '#ef4444', '#f97316', '#eab308', '#22d3ee'];

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stats?refresh=true&_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!stats) return <div className="text-center py-20 text-red-400">Failed to load stats</div>;

  const dbPercent = stats.totalStartups ? Math.round((stats.needsDatabase / stats.totalStartups) * 100) : 0;

  return (
    <div className="space-y-8 mt-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Startups', value: stats.totalStartups, href: '/startups' },
          { label: 'Regions Covered', value: stats.regions.length, href: '/startups' },
          { label: 'Key People', value: stats.totalPersons, href: '/people' },
          { label: 'Top VCs', value: stats.totalVCs, href: '/vcs' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 transition cursor-pointer">
            <p className="text-gray-400 text-xs">{s.label}</p>
            <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Startups by Region</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(() => {
              // Dynamically show enough regions so "Others" stays small
              const cutoff = 10;
              const top = stats.regions.slice(0, cutoff);
              const others = stats.regions.slice(cutoff);
              if (others.length > 0) {
                const otherCount = others.reduce((sum: number, r: { count: number }) => sum + r.count, 0);
                return [...top, { region: 'Others', count: otherCount }];
              }
              return top;
            })()}>
              <XAxis dataKey="region" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" height={50} />              <YAxis stroke="#9ca3af" fontSize={12} />
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
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.stages} layout="vertical">
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis type="category" dataKey="stage" stroke="#9ca3af" fontSize={11} width={80} interval={0} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={(_: unknown, index: number) => { const stage = stats.stages[index]?.stage; if (stage) router.push(`/startups?stage=${encodeURIComponent(stage)}`); }}>
                {stats.stages.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Funded */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">💰 Top Funded Startups</h2>
          <div className="space-y-2">
            {stats.topFunded.map((s, i) => (
              <Link key={s.id} href={`/startups/${s.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition group">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-5">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium group-hover:text-blue-400 transition">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.country} · {normalizeVertical(s.vertical)} · {normalizeStage(s.stage)}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-400">{formatFunding(s.funding_amount)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
