import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://ai-startup-tracker-olive.vercel.app';

function escapeXml(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const region = searchParams.get('region') || '';
  const vertical = searchParams.get('vertical') || '';
  const stage = searchParams.get('stage') || '';
  const minRelevance = searchParams.get('min_relevance') || '';
  const needsDb = searchParams.get('needs_database') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (region) { conditions.push('s.region = ?'); params.push(region); }
  if (vertical) { conditions.push('LOWER(s.vertical) = LOWER(?)'); params.push(vertical); }
  if (stage) { conditions.push('s.stage = ?'); params.push(stage); }
  if (minRelevance) { conditions.push('s.relevance_score >= ?'); params.push(Number(minRelevance)); }
  if (needsDb === 'true') { conditions.push('s.needs_database = 1'); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const startups = await query<{
    id: number; name: string; website: string; region: string; country: string;
    vertical: string; product: string; stage: string; funding_amount: string;
    investors: string; relevance_score: number; needs_database: number;
    source: string; discovered_at: string; updated_at: string;
  }>(`SELECT s.* FROM ai_startups s ${where} ORDER BY s.updated_at DESC, s.discovered_at DESC LIMIT ?`, [...params, limit]);

  // Get latest news per startup
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
    const newsSection = news.length > 0
      ? `\n&lt;h3&gt;Latest News&lt;/h3&gt;&lt;ul&gt;${news.slice(0, 3).map(n =>
          `&lt;li&gt;&lt;a href="${escapeXml(n.url || '')}"&gt;${escapeXml(n.title)}&lt;/a&gt; — ${escapeXml(n.summary || '')}&lt;/li&gt;`
        ).join('')}&lt;/ul&gt;`
      : '';

    const meta = [
      s.region && `Region: ${s.region}`,
      s.vertical && `Vertical: ${s.vertical}`,
      s.stage && `Stage: ${s.stage}`,
      s.funding_amount && `Funding: ${s.funding_amount}`,
      s.investors && `Investors: ${s.investors}`,
      `Relevance: ${s.relevance_score}/10`,
      s.needs_database ? 'Needs Database: Yes' : null,
      s.source && `Source: ${s.source}`,
    ].filter(Boolean).join(' | ');

    const pubDate = s.updated_at || s.discovered_at || now;

    return `    <item>
      <title>${escapeXml(s.name)}</title>
      <link>${s.website ? (s.website.startsWith('http') ? escapeXml(s.website) : `https://${escapeXml(s.website)}`) : `${SITE_URL}/startups/${s.id}`}</link>
      <guid isPermaLink="false">${SITE_URL}/startups/${s.id}</guid>
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      <category>${escapeXml(s.vertical || 'AI')}</category>
      <description>${escapeXml(s.product || '')}

${escapeXml(meta)}${newsSection}</description>
      <source url="${SITE_URL}/api/rss">AI Startup Tracker</source>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Startup Tracker — ${filterDesc}</title>
    <link>${SITE_URL}</link>
    <description>AI startups discovery feed. Filter: ${filterDesc}. Updated every 6 hours. Use for investment research, sales pipeline, and market intelligence.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml"/>
    <ttl>360</ttl>
    <docs>
Subscribe to this RSS feed for regular updates to the AI startup list.
Each item includes: company URL, region, vertical, stage, funding, investors, relevance score, and latest news.
Consumers can parse items and conduct deep research per company as needed.

Query parameters for filtering:
- region: country code (US, CN, SG, IN, KR, JP, etc.)
- vertical: AI vertical (agents, llm, coding, healthcare, etc.)
- stage: funding stage (Seed, Series A, Series B, Growth, Public, etc.)
- min_relevance: minimum relevance score 1-10
- needs_database: true/false
- limit: max items (default 50, max 200)

Examples:
- ${SITE_URL}/api/rss?region=SG — Singapore startups
- ${SITE_URL}/api/rss?min_relevance=8 — High relevance for TiDB
- ${SITE_URL}/api/rss?needs_database=true&amp;stage=Series%20A — DB-needing Series A companies
- ${SITE_URL}/api/rss?vertical=agents&amp;region=US — US AI agent startups
    </docs>
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
