'use client';

import { useState, useEffect } from 'react';

type TicketType = 'suggest' | 'correction' | 'feedback';

interface WidgetContext {
  type?: TicketType;
  name?: string;
  startupName?: string;
  startupId?: number;
}

export default function SuggestWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TicketType>('suggest');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [website, setWebsite] = useState('');
  const [startupName, setStartupName] = useState<string | null>(null);
  const [startupId, setStartupId] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e: CustomEvent<WidgetContext>) => {
      const d = e.detail || {};
      setType(d.type || 'suggest');
      setSubject(d.name || '');
      setStartupName(d.startupName || null);
      setStartupId(d.startupId || null);
      setDetails('');
      setWebsite('');
      setStatus('idle');
      setOpen(true);
    };
    window.addEventListener('suggest-startup', handler as EventListener);
    return () => window.removeEventListener('suggest-startup', handler as EventListener);
  }, []);

  const submit = async () => {
    if (type === 'suggest' && !subject.trim()) return;
    if ((type === 'correction' || type === 'feedback') && !details.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, subject, details, website, startup_name: startupName, startup_id: startupId }),
      });
      const data = await res.json();
      setMessage(data.message || 'Submitted!');
      setStatus(data.error ? 'error' : 'success');
      if (data.success) { setSubject(''); setDetails(''); setWebsite(''); }
    } catch {
      setMessage('Failed to submit.');
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 4000);
  };

  const titles: Record<TicketType, string> = {
    suggest: '🚀 Suggest a Startup',
    correction: '✏️ Report a Correction',
    feedback: '💬 Send Feedback',
  };

  return (
    <>
      <button
        onClick={() => { setType('suggest'); setStartupName(null); setStartupId(null); setOpen(!open); }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110"
        title="Feedback & Suggestions"
      >
        {open ? '✕' : '💡'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">{titles[type]}</h3>
          {startupName && <p className="text-blue-400 text-xs">Re: {startupName}</p>}

          {/* Type selector */}
          <div className="flex gap-1">
            {([['suggest', '🚀 Suggest'], ['correction', '✏️ Fix'], ['feedback', '💬 Feedback']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition ${type === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {type === 'suggest' && (
            <>
              <input placeholder="Company name *" value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              <input placeholder="Website (optional)" value={website} onChange={e => setWebsite(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              <textarea placeholder="Notes (optional)" value={details} onChange={e => setDetails(e.target.value)} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
            </>
          )}

          {type === 'correction' && (
            <>
              <input placeholder="What's wrong? (e.g. wrong HQ, outdated funding)" value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              <textarea placeholder="Correct info *" value={details} onChange={e => setDetails(e.target.value)} rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
            </>
          )}

          {type === 'feedback' && (
            <textarea placeholder="Your feedback *" value={details} onChange={e => setDetails(e.target.value)} rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
          )}

          <button onClick={submit}
            disabled={status === 'loading' || (type === 'suggest' && !subject.trim()) || ((type === 'correction' || type === 'feedback') && !details.trim())}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded-lg text-sm font-medium transition">
            {status === 'loading' ? 'Submitting...' : 'Submit'}
          </button>

          {status === 'success' && <p className="text-green-400 text-xs text-center">{message}</p>}
          {status === 'error' && <p className="text-red-400 text-xs text-center">{message}</p>}
        </div>
      )}
    </>
  );
}
