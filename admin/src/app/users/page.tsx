'use client';

import { useEffect, useState } from 'react';
import { Search, Crown, Download, Filter, UserPlus, Flame, Mail, Calendar } from 'lucide-react';
import DataTable from '@/components/DataTable';

interface User {
  id: string;
  full_name: string;
  email: string;
  is_premium: boolean;
  streak_count: number;
  created_at: string;
}

type FilterType = 'all' | 'premium' | 'free';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function togglePremium(userId: string, current: boolean) {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPremium: !current }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_premium: !current } : u))
    );
  }

  const filtered = users
    .filter((u) =>
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) => filter === 'all' ? true : filter === 'premium' ? u.is_premium : !u.is_premium);

  const premiumCount = users.filter(u => u.is_premium).length;
  const freeCount = users.filter(u => !u.is_premium).length;

  const columns = [
    {
      key: 'full_name',
      label: 'User',
      sortable: true,
      render: (val: string, row: User) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
            row.is_premium ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}>
            {(val || row.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{val || 'Anonymous'}</p>
            <p className="text-[11px] text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'is_premium',
      label: 'Plan',
      sortable: true,
      render: (val: boolean) =>
        val ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-400 text-xs font-semibold">
            <Crown className="w-3 h-3" /> Premium
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-gray-500/10 text-gray-400 text-xs font-medium">Free</span>
        ),
    },
    {
      key: 'streak_count',
      label: 'Streak',
      sortable: true,
      render: (val: number) => (
        <div className="flex items-center gap-1.5">
          <Flame className={`w-3.5 h-3.5 ${val > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
          <span className={`font-bold text-sm ${val > 0 ? 'text-orange-400' : 'text-gray-600'}`}>{val || 0}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (val: string) => (
        <span className="text-gray-400 text-xs font-mono">{new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: any, row: User) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePremium(row.id, row.is_premium);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            row.is_premium
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
          }`}
        >
          {row.is_premium ? 'Revoke' : 'Grant Premium'}
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-gray-400 mt-1">Manage {users.length} registered users</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4 card-hover cursor-pointer" onClick={() => setFilter('all')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">All Users</p>
              <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${filter === 'all' ? 'bg-blue-400' : 'bg-dark-700'}`} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 card-hover cursor-pointer" onClick={() => setFilter('premium')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Premium</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{premiumCount}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${filter === 'premium' ? 'bg-amber-400' : 'bg-dark-700'}`} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 card-hover cursor-pointer" onClick={() => setFilter('free')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Free</p>
              <p className="text-2xl font-bold text-white mt-1">{freeCount}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${filter === 'free' ? 'bg-gray-400' : 'bg-dark-700'}`} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card rounded-xl text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-blue-500/30 focus:outline-none border-0"
        />
        {search && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card rounded-2xl p-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-dark-700/20 last:border-0">
              <div className="w-9 h-9 rounded-xl shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded shimmer" />
                <div className="h-2 w-48 rounded shimmer" />
              </div>
              <div className="h-6 w-16 rounded-lg shimmer" />
              <div className="h-3 w-12 rounded shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  );
}
