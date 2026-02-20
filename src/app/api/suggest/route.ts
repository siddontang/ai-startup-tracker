import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, website, notes } = body;
    
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Check if already exists in startups
    const existing = await query('SELECT id, name FROM ai_startups WHERE LOWER(name) = LOWER(?)', [name.trim()]);
    if (existing.length > 0) {
      return NextResponse.json({ exists: true, message: `${existing[0].name} is already in our database!` });
    }

    // Check if already suggested
    const existingSuggestion = await query('SELECT id FROM startup_suggestions WHERE LOWER(name) = LOWER(?) AND status = ?', [name.trim(), 'pending']);
    if (existingSuggestion.length > 0) {
      return NextResponse.json({ duplicate: true, message: 'This company has already been suggested. We\'ll review it soon!' });
    }

    await query('INSERT INTO startup_suggestions (name, website, notes) VALUES (?, ?, ?)', [name.trim(), website?.trim() || null, notes?.trim() || null]);

    return NextResponse.json({ success: true, message: 'Thank you! We\'ll review and add this company soon.' });
  } catch (error) {
    console.error('Suggest error:', error);
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}
