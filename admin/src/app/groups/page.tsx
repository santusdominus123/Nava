'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, Crown, UserX, ArrowLeft, Trash2, RefreshCw, Shield } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [messageTab, setMessageTab] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  async function fetchGroups() {
    setLoading(true);
    const res = await fetch('/api/groups');
    const data = await res.json();
    setGroups(data.groups || []);
    setLoading(false);
  }

  async function openGroup(groupId: string) {
    setSelectedGroup(groupId);
    setDetailLoading(true);
    setMessageTab(false);
    const res = await fetch(`/api/groups?groupId=${groupId}`);
    setGroupDetail(await res.json());
    setDetailLoading(false);
  }

  async function kickMember(userId: string) {
    if (!selectedGroup) return;
    setProcessing(userId);
    await fetch('/api/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kick', groupId: selectedGroup, userId }),
    });
    setGroupDetail((prev: any) => ({
      ...prev,
      members: prev.members.filter((m: any) => m.user_id !== userId),
    }));
    setProcessing(null);
  }

  async function setRole(userId: string, role: string) {
    if (!selectedGroup) return;
    setProcessing(userId);
    await fetch('/api/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_role', groupId: selectedGroup, userId, role }),
    });
    setGroupDetail((prev: any) => ({
      ...prev,
      members: prev.members.map((m: any) => m.user_id === userId ? { ...m, role } : m),
    }));
    setProcessing(null);
  }

  async function deleteGroup(groupId: string) {
    if (!confirm('Delete this group and all its messages? This cannot be undone.')) return;
    setProcessing(groupId);
    await fetch('/api/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_group', groupId }),
    });
    setGroups(g => g.filter(x => x.id !== groupId));
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
      setGroupDetail(null);
    }
    setProcessing(null);
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Group Detail View
  if (selectedGroup && groupDetail) {
    const group = groupDetail.group;
    const members = groupDetail.members || [];
    const messages = groupDetail.messages || [];

    return (
      <div>
        <button onClick={() => { setSelectedGroup(null); setGroupDetail(null); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </button>

        {detailLoading ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <RefreshCw className="w-6 h-6 text-gray-600 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* Group Header */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
                    {(group?.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{group?.name}</h1>
                    <p className="text-gray-400 text-sm mt-1">{group?.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{members.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{messages.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Messages</p>
                  </div>
                  <button onClick={() => deleteGroup(selectedGroup)}
                    className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all" title="Delete group">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setMessageTab(false)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${!messageTab ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'glass-card text-gray-400 hover:text-white'}`}>
                <Users className="w-4 h-4" /> Members
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${!messageTab ? 'bg-white/10' : 'bg-dark-700'}`}>{members.length}</span>
              </button>
              <button onClick={() => setMessageTab(true)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${messageTab ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'glass-card text-gray-400 hover:text-white'}`}>
                <MessageSquare className="w-4 h-4" /> Messages
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${messageTab ? 'bg-white/10' : 'bg-dark-700'}`}>{messages.length}</span>
              </button>
            </div>

            {/* Members */}
            {!messageTab && (
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.user_id} className={`glass-card rounded-xl p-4 flex items-center justify-between card-hover transition-all ${processing === m.user_id ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                        {(m.profile?.full_name || m.profile?.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{m.profile?.full_name || 'Anonymous'}</p>
                          {m.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">{m.profile?.email || m.user_id.slice(0, 20) + '...'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.role !== 'admin' ? (
                        <button onClick={() => setRole(m.user_id, 'admin')}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Make admin">
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => setRole(m.user_id, 'member')}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all" title="Remove admin">
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => kickMember(m.user_id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Kick member">
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="glass-card rounded-2xl text-center py-16">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No members in this group</p>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {messageTab && (
              <div className="space-y-2">
                {messages.map((msg: any, i: number) => (
                  <div key={msg.id || i} className="glass-card rounded-xl p-4 card-hover">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] text-gray-500 font-mono">{msg.user_id?.slice(0, 12)}...</span>
                          <span className="text-[10px] text-gray-600">{timeAgo(msg.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-300">{msg.content || msg.message || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="glass-card rounded-2xl text-center py-16">
                    <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No messages yet</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Groups List View
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Group Management</h1>
          <p className="text-gray-400 mt-1">Manage prayer groups, members, and messages</p>
        </div>
        <button onClick={fetchGroups} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-500 font-medium uppercase">Total Groups</span>
          </div>
          <p className="text-2xl font-bold text-white">{groups.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">👥</span>
            <span className="text-xs text-gray-500 font-medium uppercase">Total Members</span>
          </div>
          <p className="text-2xl font-bold text-white">{groups.reduce((a: number, g: any) => a + (g.member_count || 0), 0)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500 font-medium uppercase">Total Messages</span>
          </div>
          <p className="text-2xl font-bold text-white">{groups.reduce((a: number, g: any) => a + (g.message_count || 0), 0)}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5"><div className="h-4 w-1/3 rounded shimmer mb-2" /><div className="h-3 w-2/3 rounded shimmer" /></div>
        ))}</div>
      ) : groups.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No groups created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group: any) => (
            <div key={group.id}
              onClick={() => openGroup(group.id)}
              className={`glass-card rounded-xl p-5 card-hover cursor-pointer transition-all ${processing === group.id ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                    {(group.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{group.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{group.description || 'No description'}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-dark-700/30">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">{group.member_count} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">{group.message_count} messages</span>
                </div>
                <span className="text-[10px] text-gray-600 ml-auto">{timeAgo(group.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
