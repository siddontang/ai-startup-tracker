'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';

interface VC {
  name: string;
  count: number;
  companies: { id: number; name: string }[];
}

function VCsContent() {
  const [data, setData] = useState<VC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/vcs?${params}`);
    const json = await res.json();
    setData(json.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6 mt-6">
      <h1 className="text-3xl font-bold">VCs & Investors</h1>

      <div className="flex flex-wrap gap-3">
        <input placeholder="Search by VC name..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-80" />
        <span className="text-gray-400 text-sm self-center">{data.length} investors found</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((vc, i) => (
            <div key={vc.name} className={`bg-gray-900 border rounded-xl p-5 ${i < 3 ? 'border-yellow-500/50' : 'border-gray-800'} hover:border-blue-500/50 transition`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg truncate">
                  {i < 3 && <span className="mr-1">{['🥇','🥈','🥉'][i]}</span>}
                  {vc.name}
                </h3>
                <span className="text-sm font-medium bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{vc.count} {vc.count === 1 ? 'investment' : 'investments'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {vc.companies.map(c => (
                  <Link key={c.id} href={`/startups/${c.id}`} className="text-xs text-blue-400 hover:text-blue-300 bg-gray-800 px-2 py-1 rounded-full hover:bg-gray-700 transition">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VCsPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}><VCsContent /></Suspense>;
}
