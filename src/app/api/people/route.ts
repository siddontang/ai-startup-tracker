import { query } from '@/lib/db';
import { getCached, setCache } from '@/lib/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const search = params.get('search') || '';
    const sort = params.get('sort') || 'name';
    const order = params.get('order') === 'DESC' ? 'DESC' : 'ASC';
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '50')));
    const offset = (page - 1) * limit;

    const refresh = params.get('refresh') === 'true';
    const cacheKey = `people:${params.toString()}`;
    if (!refresh) {
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    const allowedSorts: Record<string, string> = {
      name: 'kp.name',
      role: 'kp.role',
      company: 'kp.startup_name',
    };
    const sortCol = allowedSorts[sort] || 'kp.name';

    let where = '';
    const vals: unknown[] = [];
    if (search) {
      where = 'WHERE (LOWER(kp.name) LIKE LOWER(?) OR LOWER(kp.role) LIKE LOWER(?) OR LOWER(kp.startup_name) LIKE LOWER(?))';
      const s = `%${search}%`;
      vals.push(s, s, s);
    }

    const countSql = `SELECT COUNT(*) as count FROM key_persons kp ${where}`;
    const [countRow] = await query<{ count: number }>(countSql, vals);

    const dataSql = `SELECT kp.id, kp.name, kp.role, kp.startup_name, kp.linkedin, kp.github, kp.twitter, kp.email,
      s.id as startup_id
      FROM key_persons kp
      LEFT JOIN ai_startups s ON LOWER(s.name) = LOWER(kp.startup_name)
      ${where}
      ORDER BY ${sortCol} ${order}
      LIMIT ${limit} OFFSET ${offset}`;

    const data = await query(dataSql, vals);

    const result = { data, total: countRow.count };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('People API error:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}
