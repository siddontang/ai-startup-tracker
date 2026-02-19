import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://ai-startup-tracker-olive.vercel.app';

function escapeXml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function stripHtml(s: string): string {
  return (s || '').replace(/<[^>]*>/g, '');
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const region = searchParams.get('region') || '';
  const vertical = searchParams.get('vertical') || '';
  const stage = searchParams.get('stage') || '';
  const minRelevance = searchParams.get('min_relevance') || '';
  const needsDb = searchParams.get('needs_database') || '';
  const sortBy = searchParams.get('sort') || 'latest_news'; // latest_news | updated_at | discovered_at | relevance
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (region) { conditions.push('s.region = ?'); params.push(region); }
  if (vertical) { conditions.push('LOWER(s.vertical) = LOWER(?)'); params.push(vertical); }
  if (stage) { conditions.push('s.stage = ?'); params.push(stage); }
  if (minRelevance) { conditions.push('s.relevance_score >= ?'); params.push(Number(minRelevance)); }
  if (needsDb === 'true') { conditions.push('s.needs_database = 1'); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const sortMap: Record<string, string> = {
    'latest_news': 'latest_news_at DESC, s.updated_at DESC',
    'updated_at': 's.updated_at DESC, s.discovered_at DESC',
    'discovered_at': 's.discovered_at DESC',
    'relevance': 's.relevance_score DESC',
    'name': 's.name ASC',
  };
  const orderClause = sortMap[sortBy] || sortMap['latest_news'];

  const startups = await query<{
    id: number; name: string; website: string; region: string; country: string;
    vertical: string; product: string; stage: string; funding_amount: string;
    investors: string; relevance_score: number; needs_database: number;
    source: string; discovered_at: string; updated_at: string; latest_news_at: string;
  }>(
    `SELECT s.*, MAX(c.published_at) as latest_news_at
     FROM ai_startups s
     LEFT JOIN company_content c ON s.name = c.startup_name
     ${where}
     GROUP BY s.id
     ORDER BY ${orderClause}
     LIMIT ?`,
    [...params, limit]
  );

  // Get news details per startup
  const newsMap = new Map<string, { title: string; url: string; summary: string; published_at: string }[]>();
  if (startups.length > 0) {
    const names = startups.map(s => s.name);
    const placeholders = names.map(() => '?').join(',');
    const news = await query<{ startup_name: string; title: string; url: string; summary: string; published_at: string }>(
      `SELECT startup_name, title, url, summary, published_at FROM company_content WHERE startup_name IN (${placeholders}) ORDER BY published_at DESC`, names
    );
    for (const n of news) {
      if (!newsMap.has(n.startup_name)) newsMap.set(n.startup_name, []);
      newsMap.get(n.startup_name)!.push(n);
    }
  }

  const now = new Date().toUTCString();
  const filterDesc = [region && `region=${region}`, vertical && `vertical=${vertical}`, stage && `stage=${stage}`, minRelevance && `relevance>=${minRelevance}`, needsDb === 'true' && 'needs_database'].filter(Boolean).join(', ') || 'all';

  const items = startups.map(s => {
    const news = newsMap.get(s.name) || [];
    const newsHtml = news.length > 0
      ? `\n&lt;h3&gt;Latest News&lt;/h3&gt;&lt;ul&gt;${news.slice(0, 5).map(n =>
          `&lt;li&gt;&lt;a href="${escapeXml(n.url || '')}"&gt;${escapeXml(n.title)}&lt;/a&gt; — ${escapeXml(stripHtml(n.summary || ''))}&lt;/li&gt;`
        ).join('')}&lt;/ul&gt;`
      : '';

    const meta = [
      s.region && `Region: ${s.region}`,
      s.vertical && `Vertical: ${s.vertical}`,
      s.stage && `Stage: ${s.stage}`,
      s.funding_amount && `Funding: ${s.funding_amount}`,
      s.investors && `Investors: ${s.investors}`,
      s.source && `Source: ${s.source}`,
    ].filter(Boolean).join(' | ');

    // Use latest news date if available, otherwise updated_at
    const pubDate = s.latest_news_at || s.updated_at || s.discovered_at || now;

    return `    <item>
      <title>${escapeXml(s.name)}${s.stage ? ` [${escapeXml(s.stage)}]` : ''}${s.funding_amount ? ` — ${escapeXml(s.funding_amount)}` : ''}</title>
      <link>${SITE_URL}/startups/${s.id}</link>
      <guid isPermaLink="true">${SITE_URL}/startups/${s.id}</guid>
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      <category>${escapeXml(s.vertical || 'AI')}</category>
      <description>${escapeXml(stripHtml(s.product || ''))}

${escapeXml(meta)}${newsHtml}</description>
      <source url="${SITE_URL}/api/rss">AI Startup Tracker</source>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Startup Tracker${filterDesc !== 'all' ? ` — ${filterDesc}` : ''}</title>
    <link>${SITE_URL}</link>
    <description>AI startups discovery feed with ${startups.length} companies. Sorted by ${sortBy}. Updated every 6 hours. Use for investment research, sales pipeline, and market intelligence.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss${searchParams.toString() ? '?' + searchParams.toString() : ''}" rel="self" type="application/rss+xml"/>
    <ttl>360</ttl>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
