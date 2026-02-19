import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category') || '';
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (category) { conditions.push('category = ?'); params.push(category); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const rows = await query(`SELECT * FROM ai_products ${where} ORDER BY discovered_at DESC`, params);
    const categories = await query<{ category: string }>('SELECT DISTINCT category FROM ai_products WHERE category IS NOT NULL ORDER BY category');
    return NextResponse.json({ data: rows, categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('Products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
