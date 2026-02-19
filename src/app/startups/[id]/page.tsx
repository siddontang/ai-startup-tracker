'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Person { id: number; name: string; role: string; linkedin: string; github: string; twitter: string; email: string; }
interface Content { id: number; content_type: string; title: string; url: string; summary: string; relevance_to_tidb: string; published_at: string; }
interface Product { id: number; name: string; url: string; description: string; category: string; }
interface Startup {
  id: number; name: string; website: string; region: string; country: string; vertical: string;
  product: string; stage: string; funding_amount: string; needs_database: number; pain_points: string;
  relevance_score: number; outreach_status: string; tech_stack: string;
  linkedin: string; github: string; twitter: string; blog: string;
  investors: string; persons: Person[]; content: Content[]; products: Product[];
}

const SocialLink = ({ href, label }: { href: string; label: string }) =>
  href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm bg-gray-800 px-3 py-1 rounded-full">{label}</a> : null;

export default function StartupDetail() {
  const { id } = useParams();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/startups/${id}`).then(r => r.json()).then(setStartup).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!startup) return <div className="text-center py-20 text-red-400">Startup not found</div>;

  const techStack = startup.tech_stack ? (typeof startup.tech_stack === 'string' ? startup.tech_stack.split(',') : []) : [];

  return (
    <div className="space-y-8">
      <Link href="/startups" className="text-gray-400 hover:text-white text-sm">← Back to Startups</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{startup.name}</h1>
          <p className="text-gray-400 mt-1">{startup.region} · {startup.country} · {startup.vertical}</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">Relevance: {startup.relevance_score}</span>
          {startup.outreach_status && <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">{startup.outreach_status}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">About</h2>
            {startup.product && <p className="text-gray-300">{startup.product}</p>}
            {startup.pain_points && <div><h3 className="text-sm text-gray-400 mb-1">Pain Points</h3><p className="text-gray-300">{startup.pain_points}</p></div>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Stage:</span> <span className="ml-2">{startup.stage || '-'}</span></div>
              <div><span className="text-gray-400">Funding:</span> <span className="ml-2">{startup.funding_amount || '-'}</span></div>
              <div><span className="text-gray-400">Needs DB:</span> <span className="ml-2">{startup.needs_database ? 'Yes' : 'No'}</span></div>
            </div>
            {startup.website && <a href={startup.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm block">{startup.website}</a>}
          </div>

          {/* Tech Stack */}
          {techStack.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {techStack.map(t => <span key={t} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">{t.trim()}</span>)}
              </div>
            </div>
          )}

          {/* Investors */}
          {startup.investors && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">🏦 Investors</h2>
              <div className="flex flex-wrap gap-2">
                {startup.investors.split(',').map((inv: string, i: number) => (
                  <span key={i} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">{inv.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {startup.products?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">🛠️ Products</h2>
              <div className="space-y-3">
                {startup.products.map(p => (
                  <div key={p.id} className="border-b border-gray-800/50 pb-3 last:border-0">
                    <div className="flex items-center gap-2">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium">{p.name}</a>
                      {p.category && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{p.category}</span>}
                    </div>
                    {p.description && <p className="text-gray-300 text-sm mt-1">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest News & Content */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3">📰 Latest News & Updates</h2>
            {startup.content?.length > 0 ? (
              <div className="space-y-4">
                {startup.content.map(c => (
                  <div key={c.id} className="border-b border-gray-800/50 pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 shrink-0 ${
                        c.content_type === 'funding' ? 'bg-green-500/20 text-green-400' :
                        c.content_type === 'launch' ? 'bg-blue-500/20 text-blue-400' :
                        c.content_type === 'partnership' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>{c.content_type}</span>
                      <div>
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium">{c.title}</a>
                        {c.published_at && <p className="text-gray-500 text-xs mt-0.5">{new Date(c.published_at).toLocaleDateString()}</p>}
                        {c.summary && <p className="text-gray-300 text-sm mt-1">{c.summary}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No news collected yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Social */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3">Links</h2>
            <div className="flex flex-wrap gap-2">
              <SocialLink href={startup.linkedin} label="LinkedIn" />
              <SocialLink href={startup.github} label="GitHub" />
              <SocialLink href={startup.twitter} label="Twitter" />
              <SocialLink href={startup.blog} label="Blog" />
            </div>
          </div>

          {/* Key Persons */}
          {startup.persons?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">Key People</h2>
              <div className="space-y-3">
                {startup.persons.map(p => (
                  <div key={p.id} className="border-b border-gray-800/50 pb-3 last:border-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-gray-400 text-sm">{p.role}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <SocialLink href={p.linkedin} label="LinkedIn" />
                      <SocialLink href={p.github} label="GitHub" />
                      <SocialLink href={p.twitter} label="Twitter" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
