import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
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

    if (search) { const s = search.toLowerCase(); conditions.push('(LOWER(name) LIKE ? OR LOWER(product) LIKE ? OR LOWER(country) LIKE ? OR LOWER(vertical) LIKE ?)'); params.push(`%${s}%`, `%${s}%`, `%${s}%`, `%${s}%`); }
    if (region) { conditions.push('region = ?'); params.push(region); }
    if (vertical) { conditions.push('vertical = ?'); params.push(vertical); }
    if (stage) { conditions.push('stage = ?'); params.push(stage); }
    if (needsDb === 'true') { conditions.push('needs_database = 1'); }
    if (minRelevance) { conditions.push('relevance_score >= ?'); params.push(Number(minRelevance)); }
    if (maxRelevance) { conditions.push('relevance_score <= ?'); params.push(Number(maxRelevance)); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const allowedSorts = ['name', 'region', 'vertical', 'relevance_score', 'stage', 'discovered_at'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'discovered_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const [countResult] = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ai_startups ${where}`, params);
    const rows = await query(
      `SELECT * FROM ai_startups ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: rows, total: countResult.count, page, limit });
  } catch (error) {
    console.error('Startups error:', error);
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 });
  }
}
