'use client';

import { useState } from 'react';

export default function SuggestWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!name.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, website, notes }),
      });
      const data = await res.json();
      if (data.exists || data.duplicate) {
        setMessage(data.message);
        setStatus('success');
      } else if (data.success) {
        setMessage(data.message);
        setStatus('success');
        setName(''); setWebsite(''); setNotes('');
      } else {
        setMessage(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setMessage('Failed to submit. Please try again.');
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110"
        title="Suggest a startup"
      >
        {open ? '✕' : '💡'}
      </button>

      {/* Popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-5 space-y-3 animate-in">
          <h3 className="text-lg font-semibold text-white">🚀 Suggest a Startup</h3>
          <p className="text-gray-400 text-xs">Can&apos;t find a company? Let us know and we&apos;ll add it!</p>
          
          <input
            placeholder="Company name *"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            placeholder="Website (optional)"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
          />
          
          <button
            onClick={submit}
            disabled={!name.trim() || status === 'loading'}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit'}
          </button>

          {status === 'success' && <p className="text-green-400 text-xs text-center">{message}</p>}
          {status === 'error' && <p className="text-red-400 text-xs text-center">{message}</p>}
        </div>
      )}
    </>
  );
}
