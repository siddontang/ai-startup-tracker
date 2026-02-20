import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || '';

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

    return NextResponse.json({ data: vcs, total: vcs.length });
  } catch (error) {
    console.error('VCs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch VCs' }, { status: 500 });
  }
}
