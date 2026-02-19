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
    const [newThisWeek] = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM ai_startups WHERE discovered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    const verticals = await query<{ vertical: string; count: number }>(
      'SELECT vertical, COUNT(*) as count FROM ai_startups WHERE vertical IS NOT NULL GROUP BY vertical ORDER BY count DESC'
    );
    const recent = await query(
      'SELECT id, name, region, vertical, relevance_score, discovered_at FROM ai_startups ORDER BY discovered_at DESC LIMIT 10'
    );

    return NextResponse.json({
      totalStartups: total.count,
      regions,
      avgRelevance: Math.round((avg.avg || 0) * 10) / 10,
      newThisWeek: newThisWeek.count,
      verticals,
      recent,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
