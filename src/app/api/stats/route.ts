import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
    const apacCount = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM ai_startups WHERE region IN ('CN','IN','JP','KR','SG','TH','ID','VN','MY','TW','HK','AU','PH')"
    );

    return NextResponse.json({
      totalStartups: total.count,
      regions,
      avgRelevance: Math.round((avg.avg || 0) * 10) / 10,
      verticals,
      stages,
      needsDatabase: needsDbCount.count,
      totalPersons: totalPersons.count,
      totalNews: totalNews.count,
      topFunded,
      apacCount: apacCount[0].count,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
