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
    const topLeads = await query(
      'SELECT id, name, country, vertical, relevance_score, funding_amount FROM ai_startups WHERE relevance_score >= 8 ORDER BY relevance_score DESC, funding_amount DESC LIMIT 10'
    );
    const [needsDbCount] = await query<{ count: number }>('SELECT COUNT(*) as count FROM ai_startups WHERE needs_database = 1');
    const [totalPersons] = await query<{ count: number }>('SELECT COUNT(*) as count FROM key_persons');

    return NextResponse.json({
      totalStartups: total.count,
      regions,
      avgRelevance: Math.round((avg.avg || 0) * 10) / 10,
      verticals,
      stages,
      topLeads,
      needsDatabase: needsDbCount.count,
      totalPersons: totalPersons.count,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
