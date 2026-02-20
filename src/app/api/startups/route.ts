import { query } from '@/lib/db';
import { getCached, setCache } from '@/lib/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const refresh = searchParams.get('refresh') === 'true';
    const cacheKey = `startups:${searchParams.toString()}`;
    if (!refresh) {
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);
    }
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || '';
    const vertical = searchParams.get('vertical') || '';
    const needsDb = searchParams.get('needs_database');
    const sort = searchParams.get('sort') || 'discovered_at';
    const order = searchParams.get('order') || 'DESC';
    const stage = searchParams.get('stage') || '';
    const minRelevance = searchParams.get('min_relevance');
    const maxRelevance = searchParams.get('max_relevance');

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) { const s = search.toLowerCase(); conditions.push('(LOWER(s.name) LIKE ? OR LOWER(s.product) LIKE ? OR LOWER(s.country) LIKE ? OR LOWER(s.vertical) LIKE ?)'); params.push(`%${s}%`, `%${s}%`, `%${s}%`, `%${s}%`); }
    if (region) { conditions.push('s.region = ?'); params.push(region); }
    if (vertical) { conditions.push('s.vertical = ?'); params.push(vertical); }
    if (stage) { conditions.push('s.stage = ?'); params.push(stage); }
    if (needsDb === 'true') { conditions.push('s.needs_database = 1'); }
    if (minRelevance) { conditions.push('s.relevance_score >= ?'); params.push(Number(minRelevance)); }
    if (maxRelevance) { conditions.push('s.relevance_score <= ?'); params.push(Number(maxRelevance)); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const allowedSorts: Record<string, string> = {
      'name': 's.name',
      'region': 's.region',
      'vertical': 's.vertical',
      'relevance_score': 's.relevance_score',
      'stage': 's.stage',
      'discovered_at': 's.discovered_at',
      'funding_amount': 's.funding_amount',
      'latest_news': 'latest_news_at',
      'updated_at': 's.updated_at',
    };
    const sortCol = allowedSorts[sort] || 's.discovered_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const [countResult] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM ai_startups s ${where}`, params
    );

    const rows = await query(
      `SELECT s.*, MAX(c.published_at) as latest_news_at
       FROM ai_startups s
       LEFT JOIN company_content c ON s.name = c.startup_name
       ${where}
       GROUP BY s.id
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const result = { data: rows, total: countResult.count, page, limit };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Startups error:', error);
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 });
  }
}
