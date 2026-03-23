'use client';

import { useEffect, useState } from 'react';
import { Trash2, MessageSquare, Heart, Users, AlertTriangle, CheckCircle, Eye, EyeOff, RefreshCw, Search, MessageCircle, Pin, PinOff } from 'lucide-react';

type Tab = 'posts' | 'prayers' | 'groups' | 'comments';

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    setLoading(true);
    const res = await fetch('/api/content');
    const data = await res.json();
    setPosts(data.posts || []);
    setPrayers(data.prayers || []);
    setGroups(data.groups || []);
    setComments(data.comments || []);
    setLoading(false);
  }

  async function deleteItem(table: string, id: string) {
    setDeleting(id);
    await fetch('/api/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });
    // Optimistic remove
    if (table === 'community_posts') setPosts(p => p.filter(x => x.id !== id));
    if (table === 'prayer_requests') setPrayers(p => p.filter(x => x.id !== id));
    if (table === 'prayer_groups') setGroups(g => g.filter(x => x.id !== id));
    if (table === 'post_comments') setComments(c => c.filter(x => x.id !== id));
    setDeleting(null);
  }

  async function togglePin(postId: string, currentlyPinned: boolean) {
    setDeleting(postId);
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, action: currentlyPinned ? 'unpin' : 'pin' }),
    });
    setPosts(p => p.map(x => x.id === postId ? { ...x, is_pinned: !currentlyPinned } : x));
    setDeleting(null);
  }

  const tabs: { key: Tab; label: string; icon: any; count: number; color: string }[] = [
    { key: 'posts', label: 'Posts', icon: MessageSquare, count: posts.length, color: 'blue' },
    { key: 'prayers', label: 'Prayers', icon: Heart, count: prayers.length, color: 'rose' },
    { key: 'groups', label: 'Groups', icon: Users, count: groups.length, color: 'emerald' },
    { key: 'comments', label: 'Comments', icon: MessageCircle, count: comments.length, color: 'violet' },
  ];

  const filteredPosts = posts
    .filter(p => !search || (p.content || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
  const filteredPrayers = prayers.filter(p => !search || (p.title || '').toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter(g => !search || (g.name || '').toLowerCase().includes(search.toLowerCase()));
  const filteredComments = comments.filter(c => !search || (c.content || '').toLowerCase().includes(search.toLowerCase()));

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Moderation</h1>
          <p className="text-gray-400 mt-1">Review and manage community-generated content</p>
        </div>
        <button onClick={fetchContent} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-xs text-gray-400 font-medium">Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? `bg-${t.color}-500/15 text-${t.color}-400 border border-${t.color}-500/20`
                : 'glass-card text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              tab === t.key ? 'bg-white/10' : 'bg-dark-700'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card rounded-xl text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none border-0"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5">
              <div className="h-3 w-20 rounded shimmer mb-3" />
              <div className="h-4 w-3/4 rounded shimmer mb-2" />
              <div className="h-3 w-1/2 rounded shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Posts */}
          {tab === 'posts' && filteredPosts.map((post) => (
            <div key={post.id} className={`glass-card rounded-xl p-5 card-hover transition-all ${deleting === post.id ? 'opacity-50 scale-98' : ''} ${post.is_pinned ? 'ring-1 ring-amber-500/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2.5">
                    {post.is_pinned && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400 flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      post.post_type === 'testimony' ? 'bg-emerald-500/15 text-emerald-400' :
                      post.post_type === 'verse_share' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-violet-500/15 text-violet-400'
                    }`}>{post.post_type}</span>
                    <span className="text-[11px] text-gray-500">{timeAgo(post.created_at)}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{post.content}</p>
                  {post.verse_reference && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-blue-400 text-xs font-medium">{post.verse_reference}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Heart className="w-3 h-3" /> {post.likes_count || 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePin(post.id, !!post.is_pinned)}
                    className={`p-2.5 rounded-xl transition-all ${post.is_pinned ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'}`}
                    title={post.is_pinned ? 'Unpin post' : 'Pin to top'}
                  >
                    {post.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteItem('community_posts', post.id)}
                    className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Prayers */}
          {tab === 'prayers' && filteredPrayers.map((prayer) => (
            <div key={prayer.id} className={`glass-card rounded-xl p-5 card-hover transition-all ${deleting === prayer.id ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2.5">
                    {prayer.is_answered && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase">
                        <CheckCircle className="w-3 h-3" /> Answered
                      </span>
                    )}
                    {prayer.is_anonymous && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-500/15 text-gray-400 text-[10px] font-bold uppercase">
                        <EyeOff className="w-3 h-3" /> Anonymous
                      </span>
                    )}
                    <span className="text-[11px] text-gray-500">{timeAgo(prayer.created_at)}</span>
                  </div>
                  <p className="text-white text-sm font-semibold">{prayer.title}</p>
                  <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{prayer.description}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs text-rose-400 font-medium">{prayer.prayer_count || 0} people praying</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteItem('prayer_requests', prayer.id)}
                  className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Groups */}
          {tab === 'groups' && filteredGroups.map((group) => (
            <div key={group.id} className={`glass-card rounded-xl p-5 card-hover transition-all ${deleting === group.id ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      {(group.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{group.name}</p>
                      <p className="text-[11px] text-gray-500">{timeAgo(group.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{group.description}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">{group.member_count || 0} members</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteItem('prayer_groups', group.id)}
                  className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Comments */}
          {tab === 'comments' && filteredComments.map((comment) => (
            <div key={comment.id} className={`glass-card rounded-xl p-5 card-hover transition-all ${deleting === comment.id ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-violet-500/15 text-violet-400">Comment</span>
                    <span className="text-[11px] text-gray-500">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{comment.content}</p>
                  <p className="text-[11px] text-gray-600 font-mono mt-2">User: {comment.user_id?.slice(0, 16)}... | Post: {comment.post_id?.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => deleteItem('post_comments', comment.id)}
                  className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Empty states */}
          {((tab === 'posts' && filteredPosts.length === 0) ||
            (tab === 'prayers' && filteredPrayers.length === 0) ||
            (tab === 'groups' && filteredGroups.length === 0) ||
            (tab === 'comments' && filteredComments.length === 0)) && (
            <div className="glass-card rounded-2xl text-center py-16">
              {tab === 'posts' && <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />}
              {tab === 'prayers' && <Heart className="w-10 h-10 text-gray-600 mx-auto mb-3" />}
              {tab === 'groups' && <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />}
              {tab === 'comments' && <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />}
              <p className="text-gray-500 text-sm font-medium">No {tab} found</p>
              <p className="text-gray-600 text-xs mt-1">
                {search ? 'Try a different search term' : 'Content will appear here when users create it'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
