import { query } from '@/lib/db';
import { getCached, setCache } from '@/lib/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || '';
    const refresh = req.nextUrl.searchParams.get('refresh') === 'true';
    const cacheKey = `vcs:${search}`;
    if (!refresh) {
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    const rows = await query<{ id: number; name: string; investors: string }>(
      'SELECT id, name, investors FROM ai_startups WHERE investors IS NOT NULL AND investors != \'\''
    );

    const vcMap = new Map<string, { name: string; companies: { id: number; name: string }[] }>();

    for (const row of rows) {
      const investors = row.investors.split(',').map(s => s.trim()).filter(Boolean);
      for (const inv of investors) {
        const key = inv.toLowerCase();
        if (!vcMap.has(key)) {
          vcMap.set(key, { name: inv, companies: [] });
        }
        vcMap.get(key)!.companies.push({ id: row.id, name: row.name });
      }
    }

    let vcs = Array.from(vcMap.values()).map(v => ({
      name: v.name,
      count: v.companies.length,
      companies: v.companies,
    }));

    if (search) {
      const s = search.toLowerCase();
      vcs = vcs.filter(v => v.name.toLowerCase().includes(s));
    }

    vcs.sort((a, b) => b.count - a.count);

    const result = { data: vcs, total: vcs.length };
    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('VCs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch VCs' }, { status: 500 });
  }
}
