import { query } from '@/lib/db';
import { getCached, setCache } from '@/lib/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get('refresh') === 'true';
    const cacheKey = 'stats';

    if (!refresh) {
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    const [total] = await query<{ count: number }>('SELECT COUNT(*) as count FROM ai_startups');
    const regions = await query<{ region: string; count: number }>(
      'SELECT region, COUNT(*) as count FROM ai_startups GROUP BY region ORDER BY count DESC'
    );
    const [avg] = await query<{ avg: number }>('SELECT AVG(relevance_score) as avg FROM ai_startups');
    const verticals = await query<{ vertical: string; count: number }>(
      'SELECT vertical, COUNT(*) as count FROM ai_startups WHERE vertical IS NOT NULL GROUP BY vertical ORDER BY count DESC'
    );
    const stages = await query<{ stage: string; count: number }>(
      'SELECT stage, COUNT(*) as count FROM ai_startups WHERE stage IS NOT NULL GROUP BY stage ORDER BY count DESC'
    );
    const [needsDbCount] = await query<{ count: number }>('SELECT COUNT(*) as count FROM ai_startups WHERE needs_database = 1');
    const [totalPersons] = await query<{ count: number }>('SELECT COUNT(*) as count FROM key_persons');
    const [totalNews] = await query<{ count: number }>('SELECT COUNT(*) as count FROM company_content');
    const topFunded = await query(
      `SELECT id, name, country, vertical, funding_amount, stage FROM ai_startups 
       WHERE funding_amount IS NOT NULL AND funding_amount != '' AND funding_amount != 'N/A'
       ORDER BY CAST(REGEXP_REPLACE(REPLACE(REPLACE(REPLACE(funding_amount, '$', ''), '+', ''), ',', ''), '[^0-9.]', '') AS DECIMAL(20,2)) DESC
       LIMIT 10`
    );
    const investorRows = await query<{ investors: string }>(
      'SELECT investors FROM ai_startups WHERE investors IS NOT NULL AND investors != \'\''
    );
    const vcSet = new Set<string>();
    for (const row of investorRows) {
      row.investors.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).forEach(v => vcSet.add(v));
    }

    const result = {
      totalStartups: total.count,
      regions,
      avgRelevance: Math.round((avg.avg || 0) * 10) / 10,
      verticals,
      stages,
      needsDatabase: needsDbCount.count,
      totalPersons: totalPersons.count,
      totalNews: totalNews.count,
      topFunded,
      totalVCs: vcSet.size,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
