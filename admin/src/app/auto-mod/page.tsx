'use client';

import { useEffect, useState } from 'react';
import { Shield, Plus, Trash2, AlertTriangle, CheckCircle, XCircle, RefreshCw, Search } from 'lucide-react';

type Severity = 'low' | 'medium' | 'high';

const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'bg-yellow-500/10 text-yellow-400',
  medium: 'bg-orange-500/10 text-orange-400',
  high: 'bg-red-500/10 text-red-400',
};

export default function AutoModPage() {
  const [words, setWords] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [adding, setAdding] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'words' | 'flagged'>('words');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch('/api/auto-mod');
    const data = await res.json();
    setWords(data.words || []);
    setFlagged(data.flagged || []);
    setLoading(false);
  }

  async function addWord() {
    if (!newWord.trim()) return;
    setAdding(true);
    const res = await fetch('/api/auto-mod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: newWord, severity }),
    });
    const data = await res.json();
    if (data.success) {
      setNewWord('');
      fetchData();
      if (data.flaggedCount > 0) {
        alert(`Word added! ${data.flaggedCount} existing post(s) flagged.`);
      }
    }
    setAdding(false);
  }

  async function deleteWord(id: string) {
    setProcessing(id);
    await fetch('/api/auto-mod', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setWords(w => w.filter(x => x.id !== id));
    setProcessing(null);
  }

  async function handleFlagged(postId: string, action: 'unflag' | 'delete') {
    setProcessing(postId);
    await fetch('/api/auto-mod', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action }),
    });
    setFlagged(f => f.filter(x => x.id !== postId));
    setProcessing(null);
  }

  const filteredWords = words.filter(w => !search || w.word.includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Auto-Moderation</h1>
          <p className="text-gray-400 mt-1">Manage banned words and review auto-flagged content</p>
        </div>
        <button onClick={fetchData} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500 font-medium uppercase">Banned Words</span>
          </div>
          <p className="text-2xl font-bold text-white">{words.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-500 font-medium uppercase">Flagged Posts</span>
          </div>
          <p className={`text-2xl font-bold ${flagged.length > 0 ? 'text-amber-400' : 'text-white'}`}>{flagged.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🔴</span>
            <span className="text-xs text-gray-500 font-medium uppercase">High Severity</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{words.filter(w => w.severity === 'high').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('words')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'words' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'glass-card text-gray-400 hover:text-white'}`}>
          <Shield className="w-4 h-4" /> Banned Words
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab === 'words' ? 'bg-white/10' : 'bg-dark-700'}`}>{words.length}</span>
        </button>
        <button onClick={() => setTab('flagged')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'flagged' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'glass-card text-gray-400 hover:text-white'}`}>
          <AlertTriangle className="w-4 h-4" /> Flagged Posts
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab === 'flagged' ? 'bg-white/10' : 'bg-dark-700'}`}>{flagged.length}</span>
        </button>
      </div>

      {tab === 'words' && (
        <>
          {/* Add Word Form */}
          <div className="glass-card rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold text-white mb-3">Add Banned Word</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addWord()}
                placeholder="Enter word or phrase..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-dark-700/50 text-white text-sm placeholder-gray-600 border border-dark-600/30 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              />
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as Severity)}
                className="px-4 py-2.5 rounded-xl bg-dark-700/50 text-white text-sm border border-dark-600/30 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                onClick={addWord}
                disabled={adding || !newWord.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search words..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 glass-card rounded-xl text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none border-0" />
          </div>

          {/* Word List */}
          <div className="space-y-2">
            {filteredWords.map(w => (
              <div key={w.id} className={`glass-card rounded-xl p-4 flex items-center justify-between card-hover transition-all ${processing === w.id ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{w.word}</p>
                    <p className="text-[10px] text-gray-600">Added {new Date(w.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${SEVERITY_COLORS[w.severity as Severity] || SEVERITY_COLORS.medium}`}>
                    {w.severity}
                  </span>
                </div>
                <button onClick={() => deleteWord(w.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filteredWords.length === 0 && !loading && (
              <div className="glass-card rounded-2xl text-center py-16">
                <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">No banned words yet</p>
                <p className="text-gray-600 text-xs mt-1">Add words above to start auto-moderating</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'flagged' && (
        <div className="space-y-3">
          {flagged.map(post => (
            <div key={post.id} className={`glass-card rounded-xl p-5 card-hover transition-all ${processing === post.id ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400">Flagged</span>
                    <span className="text-[11px] text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{post.content}</p>
                  {post.flag_reason && (
                    <p className="text-[11px] text-red-400 bg-red-500/5 rounded-lg px-3 py-1.5 inline-block">{post.flag_reason}</p>
                  )}
                  <p className="text-[10px] text-gray-600 font-mono mt-2">User: {post.user_id?.slice(0, 16)}...</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => handleFlagged(post.id, 'unflag')} className="p-2 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-all" title="Approve (unflag)">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleFlagged(post.id, 'delete')} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all" title="Delete post">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {flagged.length === 0 && !loading && (
            <div className="glass-card rounded-2xl text-center py-16">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">All clear!</p>
              <p className="text-gray-600 text-xs mt-1">No flagged content to review</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
