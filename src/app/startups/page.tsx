'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

function normalizeStage(stage: string | null | undefined): string {
  const raw = (stage || '').trim();
  if (!raw) return 'Unknown';

  const s = raw.toLowerCase().replace(/[_\s]+/g, ' ').trim();
  if (['n/a', 'na', 'n.a.', 'unknown', 'unknown stage', '-', '—', ''].includes(s)) return 'Unknown';
  if (['seed', 'seed stage'].includes(s)) return 'Seed';
  if (['pre-seed', 'pre seed', 'preseed'].includes(s)) return 'Pre-Seed';
  if (['seed/pre-seed', 'pre-seed/seed', 'pre seed/seed'].includes(s)) return 'Seed/Pre-Seed';
  if (['growth', 'growth stage'].includes(s)) return 'Growth';
  if (['public', 'ipo', 'listed'].includes(s)) return 'Public';
  if (['acquired', 'acquisition'].includes(s)) return 'Acquired';

  const seriesMatch = s.match(/^series\s*([a-d])(\+)?$/i) || s.match(/^([a-d])(\+)?$/i);
  if (seriesMatch) return `Series ${seriesMatch[1].toUpperCase()}${seriesMatch[2] || ''}`;

  return raw
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
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
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Startup {
  id: number; name: string; website: string; region: string; country: string; vertical: string;
  product: string; stage: string; funding_amount: string; needs_database: number; latest_news_at: string;
  relevance_score: number; outreach_status: string; discovered_at: string; linkedin: string;
}

function formatFunding(f: string | null): string {
  if (!f) return '—';
  // Already formatted (has $ or M or B)
  if (/[A-Za-z$]/.test(f)) return f;
  const n = parseFloat(f);
  if (isNaN(n)) return f;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function StartupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Startup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [vertical, setVertical] = useState(searchParams.get('vertical') || '');
  const [stage, setStage] = useState(searchParams.get('stage') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest_news');
  const [order, setOrder] = useState(searchParams.get('order') || 'DESC');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [regions, setRegions] = useState<string[]>([]);
  const [verticals, setVerticals] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (region) params.set('region', region);
    if (vertical) params.set('vertical', vertical);
    if (stage) params.set('stage', stage);
    params.set('sort', sort);
    params.set('order', order);
    params.set('page', String(page));
    params.set('_t', String(Date.now()));
    const res = await fetch(`/api/startups?${params}`, { cache: 'no-store' });
    const json = await res.json();
    setData(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [search, region, vertical, stage, sort, order, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch(`/api/stats?refresh=true&_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(stats => {
      setRegions((stats.regions || []).map((r: { region: string }) => r.region));
      setVerticals((stats.verticals || []).map((v: { vertical: string }) => v.vertical));
      setStages((stats.stages || []).map((s: { stage: string }) => s.stage));
    });
  }, []);

  const toggleSort = (col: string) => {
    if (sort === col) setOrder(o => o === 'ASC' ? 'DESC' : 'ASC');
    else { setSort(col); setOrder('DESC'); }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => sort === col ? <span>{order === 'ASC' ? ' ↑' : ' ↓'}</span> : null;

  return (
    <div className="space-y-6 mt-6">
      <h1 className="text-3xl font-bold">Startups</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input placeholder="Search by company name..." value={searchInput} onChange={e => {
            const v = e.target.value;
            setSearchInput(v);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => { setSearch(v); setPage(1); }, 300);
          }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64" />
        <select value={region} onChange={e => { setRegion(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
          <option value="">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={vertical} onChange={e => { setVertical(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
          <option value="">All Verticals</option>
          {verticals.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={stage} onChange={e => { setStage(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
          <option value="">All Stages</option>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-gray-800">
                {[['name','Name'],['region','Region'],['vertical','Vertical'],['stage','Stage'],['funding_amount','Funding'],['linkedin','LinkedIn'],['latest_news','Latest News']].map(([col, label]) => (
                  <th key={col} className="text-left py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort(col)}>
                    {label}<SortIcon col={col} />
                  </th>
                ))}
              </tr></thead>
              <tbody>
                {data.map(s => (
                  <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer" onClick={() => router.push(`/startups/${s.id}`)}>
                    <td className="py-3 px-4"><Link href={`/startups/${s.id}`} className="text-blue-400 hover:underline">{s.name}</Link></td>
                    <td className="py-3 px-4">{s.region}</td>
                    <td className="py-3 px-4">{normalizeVertical(s.vertical)}</td>
                    <td className="py-3 px-4">{normalizeStage(s.stage)}</td>
                    <td className="py-3 px-4 text-gray-400">{formatFunding(s.funding_amount)}</td>
                    <td className="py-3 px-4">{s.linkedin ? <a href={s.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-400 hover:text-blue-300">🔗</a> : <span className="text-gray-600">—</span>}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{s.latest_news_at ? new Date(s.latest_news_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No results - suggest */}
          {data.length === 0 && search && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">No startups found for &quot;{search}&quot;</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('suggest-startup', { detail: { name: search } }))}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                💡 Suggest &quot;{search}&quot; as a new startup
              </button>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Showing {data.length} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">Prev</button>
              <span className="px-3 py-1">Page {page}</span>
              <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function StartupsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}><StartupsContent /></Suspense>;
}
