import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [startup] = await query('SELECT * FROM ai_startups WHERE id = ?', [id]);
    if (!startup) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const name = (startup as Record<string, unknown>).name as string;
    const persons = await query('SELECT * FROM key_persons WHERE startup_name = ?', [name]);
    const content = await query('SELECT * FROM company_content WHERE startup_name = ? ORDER BY published_at DESC', [name]);
    const products = await query('SELECT * FROM ai_products WHERE company = ?', [name]);

    return NextResponse.json({ ...startup, persons, content, products });
  } catch (error) {
    console.error('Startup detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500 });
  }
}
