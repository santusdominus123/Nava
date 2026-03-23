'use client';

import { useState } from 'react';
import { Send, CheckCircle, AlertTriangle, Users, User } from 'lucide-react';

export default function SendNotification() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          targetUserId: targetMode === 'specific' ? targetUserId.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', message: `Notification sent to ${data.sent} device(s)` });
        setTitle('');
        setBody('');
        setTargetUserId('');
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send notification' });
      }
    } catch {
      setResult({ type: 'error', message: 'Network error' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Send className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-bold text-white">Send Push Notification</h2>
      </div>
      <p className="text-xs text-gray-500 mb-5">Send a push notification to users via Expo Push API</p>

      {/* Target mode */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTargetMode('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            targetMode === 'all' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'glass-card text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> All Users
        </button>
        <button
          onClick={() => setTargetMode('specific')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            targetMode === 'specific' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' : 'glass-card text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Specific User
        </button>
      </div>

      {targetMode === 'specific' && (
        <input
          type="text"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          placeholder="User ID (UUID)"
          className="w-full px-4 py-3 mb-4 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600 font-mono"
        />
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Notification title"
        className="w-full px-4 py-3 mb-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Notification body message..."
        rows={3}
        className="w-full px-4 py-3 mb-4 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600 resize-none"
      />

      {/* Preview */}
      {(title || body) && (
        <div className="mb-4 p-4 rounded-xl bg-dark-700/30 border border-dark-600">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Preview</p>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{title || 'Title'}</p>
              <p className="text-gray-400 text-xs mt-0.5">{body || 'Body message'}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
          result.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {result.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {result.message}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !title.trim() || !body.trim()}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all"
      >
        <Send className="w-4 h-4" />
        {sending ? 'Sending...' : `Send to ${targetMode === 'all' ? 'All Users' : 'User'}`}
      </button>
    </div>
  );
}
