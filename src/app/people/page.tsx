'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Person {
  id: number; name: string; role: string; startup_name: string; startup_id: number | null;
  linkedin: string; github: string; twitter: string; email: string;
}

const SocialLink = ({ href, label }: { href: string; label: string }) =>
  href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm bg-gray-800 px-3 py-1 rounded-full">{label}</a> : null;

function PeopleContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sort', sort);
    params.set('order', order);
    params.set('page', String(page));
    const res = await fetch(`/api/people?${params}`);
    const json = await res.json();
    setData(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [search, sort, order, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSort = (col: string) => {
    if (sort === col) setOrder(o => o === 'ASC' ? 'DESC' : 'ASC');
    else { setSort(col); setOrder('ASC'); }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => sort === col ? <span>{order === 'ASC' ? ' ↑' : ' ↓'}</span> : null;

  return (
    <div className="space-y-6 mt-6">
      <h1 className="text-3xl font-bold">People</h1>

      <div className="flex flex-wrap gap-3">
        <input placeholder="Search by name, role, or company..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-80" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-gray-800">
                {[['name','Name'],['role','Role'],['company','Company']].map(([col, label]) => (
                  <th key={col} className="text-left py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort(col)}>
                    {label}<SortIcon col={col} />
                  </th>
                ))}
                <th className="text-left py-3 px-4">Links</th>
              </tr></thead>
              <tbody>
                {data.map(p => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-gray-400">{p.role}</td>
                    <td className="py-3 px-4">
                      {p.startup_id ? (
                        <Link href={`/startups/${p.startup_id}`} className="text-blue-400 hover:underline">{p.startup_name}</Link>
                      ) : (
                        <span className="text-gray-400">{p.startup_name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <SocialLink href={p.linkedin} label="LinkedIn" />
                        <SocialLink href={p.twitter} label="Twitter" />
                        <SocialLink href={p.github} label="GitHub" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

export default function PeoplePage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}><PeopleContent /></Suspense>;
}
