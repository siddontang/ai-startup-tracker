import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { startup_id, startup_name } = await request.json();
    if (!startup_id) return NextResponse.json({ error: 'Missing startup_id' }, { status: 400 });

    // Insert a ticket to trigger review
    await query(
      'INSERT INTO feedback_tickets (type, startup_name, startup_id, subject, details, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['correction', startup_name || null, startup_id, 'User flagged for review', 'User reported this company may have incorrect info. Please verify and fix all fields.', 'pending']
    );

    return NextResponse.json({ success: true, message: 'Flagged for review! We\'ll verify and update this company\'s info.' });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
