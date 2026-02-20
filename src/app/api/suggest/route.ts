import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { type, startup_name, startup_id, subject, details, website } = await request.json();
    const ticketType = type || 'suggest';

    if (ticketType === 'suggest' && (!subject || subject.trim().length < 2)) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    if ((ticketType === 'correction' || ticketType === 'feedback') && (!details || details.trim().length < 2)) {
      return NextResponse.json({ error: 'Please describe the issue' }, { status: 400 });
    }

    // For suggestions, check if company already exists
    if (ticketType === 'suggest') {
      const existing = await query('SELECT id, name FROM ai_startups WHERE LOWER(name) = LOWER(?)', [subject.trim()]);
      if (existing.length > 0) {
        return NextResponse.json({ exists: true, message: `${existing[0].name} is already in our database!` });
      }
    }

    await query(
      'INSERT INTO feedback_tickets (type, startup_name, startup_id, subject, details, website, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ticketType, startup_name?.trim() || null, startup_id || null, subject?.trim() || null, details?.trim() || null, website?.trim() || null, 'pending']
    );

    const messages: Record<string, string> = {
      suggest: 'Thank you! We\'ll review and add this company soon.',
      correction: 'Thanks for the correction! We\'ll fix it shortly.',
      feedback: 'Feedback received! Thanks for helping us improve.',
    };

    return NextResponse.json({ success: true, message: messages[ticketType] || messages.feedback });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
