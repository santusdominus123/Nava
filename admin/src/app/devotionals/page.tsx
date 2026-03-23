'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Sun, Plus, Trash2, Edit3, RefreshCw, Search, X, Calendar, Save } from 'lucide-react';

type Tab = 'devotionals' | 'verses';

interface Devotional {
  id: string;
  title: string;
  verse_reference: string;
  content: string;
  reflection: string;
  prayer: string;
  active_date: string;
  created_at: string;
}

interface VerseOfDay {
  id: string;
  reference: string;
  text: string;
  date: string;
  created_at: string;
}

export default function DevotionalsPage() {
  const [tab, setTab] = useState<Tab>('devotionals');
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [verses, setVerses] = useState<VerseOfDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '', verse_reference: '', content: '', reflection: '', prayer: '', active_date: '',
    reference: '', text: '', date: '',
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch('/api/devotionals');
    const data = await res.json();
    setDevotionals(data.devotionals || []);
    setVerses(data.verses || []);
    setLoading(false);
  }

  function openCreate() {
    setEditingItem(null);
    const today = new Date().toISOString().split('T')[0];
    setForm({ title: '', verse_reference: '', content: '', reflection: '', prayer: '', active_date: today, reference: '', text: '', date: today });
    setShowModal(true);
  }

  function openEdit(item: any) {
    setEditingItem(item);
    if (tab === 'devotionals') {
      setForm({ ...form, title: item.title, verse_reference: item.verse_reference, content: item.content, reflection: item.reflection || '', prayer: item.prayer || '', active_date: item.active_date });
    } else {
      setForm({ ...form, reference: item.reference, text: item.text, date: item.date });
    }
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const table = tab === 'devotionals' ? 'daily_devotionals' : 'verse_of_day';

    const payload = tab === 'devotionals'
      ? { title: form.title, verse_reference: form.verse_reference, content: form.content, reflection: form.reflection, prayer: form.prayer, active_date: form.active_date }
      : { reference: form.reference, text: form.text, date: form.date };

    if (editingItem) {
      await fetch('/api/devotionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id: editingItem.id, data: payload }),
      });
    } else {
      await fetch('/api/devotionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, data: payload }),
      });
    }

    setShowModal(false);
    setSaving(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const table = tab === 'devotionals' ? 'daily_devotionals' : 'verse_of_day';
    await fetch('/api/devotionals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });
    if (tab === 'devotionals') setDevotionals(d => d.filter(x => x.id !== id));
    else setVerses(v => v.filter(x => x.id !== id));
  }

  const filteredDevotionals = devotionals.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.verse_reference.toLowerCase().includes(search.toLowerCase()));
  const filteredVerses = verses.filter(v => !search || v.reference.toLowerCase().includes(search.toLowerCase()) || v.text.toLowerCase().includes(search.toLowerCase()));

  const tabs: { key: Tab; label: string; icon: any; count: number; color: string }[] = [
    { key: 'devotionals', label: 'Daily Devotionals', icon: BookOpen, count: devotionals.length, color: 'blue' },
    { key: 'verses', label: 'Verse of Day', icon: Sun, count: verses.length, color: 'amber' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Devotional Content</h1>
          <p className="text-gray-400 mt-1">Manage daily devotionals and verse of the day</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? `bg-${t.color}-500/15 text-${t.color}-400 border border-${t.color}-500/20` : 'glass-card text-gray-400 hover:text-white'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab === t.key ? 'bg-white/10' : 'bg-dark-700'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder={`Search ${tab}...`} value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card rounded-xl text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none border-0" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5"><div className="h-3 w-20 rounded shimmer mb-3" /><div className="h-4 w-3/4 rounded shimmer mb-2" /><div className="h-3 w-1/2 rounded shimmer" /></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Devotionals */}
          {tab === 'devotionals' && filteredDevotionals.map((item) => (
            <div key={item.id} className="glass-card rounded-xl p-5 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {item.active_date}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-400 text-[10px] font-bold">{item.verse_reference}</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{item.content}</p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}

          {/* Verses */}
          {tab === 'verses' && filteredVerses.map((item) => (
            <div key={item.id} className="glass-card rounded-xl p-5 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {item.date}
                    </span>
                    <span className="text-white font-semibold text-sm">{item.reference}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed italic">&ldquo;{item.text}&rdquo;</p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty */}
          {((tab === 'devotionals' && filteredDevotionals.length === 0) || (tab === 'verses' && filteredVerses.length === 0)) && (
            <div className="glass-card rounded-2xl text-center py-16">
              {tab === 'devotionals' ? <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" /> : <Sun className="w-10 h-10 text-gray-600 mx-auto mb-3" />}
              <p className="text-gray-500 text-sm font-medium">No {tab === 'devotionals' ? 'devotionals' : 'verses'} found</p>
              <p className="text-gray-600 text-xs mt-1">{search ? 'Try a different search' : 'Click "Add New" to create one'}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editingItem ? 'Edit' : 'Create'} {tab === 'devotionals' ? 'Devotional' : 'Verse of Day'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            {tab === 'devotionals' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Devotional title"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Verse Reference</label>
                    <input value={form.verse_reference} onChange={(e) => setForm({ ...form, verse_reference: e.target.value })} placeholder="e.g. John 3:16"
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Active Date</label>
                    <input type="date" value={form.active_date} onChange={(e) => setForm({ ...form, active_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Content</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Main devotional content..."
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Reflection</label>
                  <textarea value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} rows={3} placeholder="Reflection questions..."
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Prayer</label>
                  <textarea value={form.prayer} onChange={(e) => setForm({ ...form, prayer: e.target.value })} rows={3} placeholder="Closing prayer..."
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600 resize-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Verse Reference</label>
                  <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. Philippians 4:13"
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Verse Text</label>
                  <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4} placeholder="The full verse text..."
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder-gray-600 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600 text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-dark-700">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-gray-400 text-sm font-medium hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl px-6 py-2.5 flex items-center gap-2 text-sm font-semibold transition-all">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
