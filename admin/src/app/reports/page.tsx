'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, Trash2, RefreshCw, Clock, XCircle } from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'resolved' | 'dismissed';

const REASON_COLORS: Record<string, string> = {
  'Inappropriate content': 'text-red-400 bg-red-500/10',
  'Spam': 'text-amber-400 bg-amber-500/10',
  'Harassment': 'text-rose-400 bg-rose-500/10',
  'Other': 'text-gray-400 bg-gray-500/10',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    const res = await fetch('/api/reports');
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  async function handleAction(report: any, action: 'dismiss' | 'remove') {
    setProcessing(report.id);
    await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: report.id,
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        deleteContent: action === 'remove',
        post_id: report.post_id,
        prayer_id: report.prayer_id,
      }),
    });
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' } : r));
    setProcessing(null);
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const pending = reports.filter(r => r.status === 'pending').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Reports</h1>
          <p className="text-gray-400 mt-1">Review and moderate flagged content</p>
        </div>
        <button onClick={fetchReports} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="text-xs text-gray-500 font-medium uppercase">Total</span></div>
          <p className="text-2xl font-bold text-white">{reports.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-red-400" /><span className="text-xs text-gray-500 font-medium uppercase">Pending</span></div>
          <p className={`text-2xl font-bold ${pending > 0 ? 'text-red-400' : 'text-white'}`}>{pending}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-xs text-gray-500 font-medium uppercase">Resolved</span></div>
          <p className="text-2xl font-bold text-white">{resolved}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'resolved', 'dismissed'] as FilterStatus[]).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === s ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'glass-card text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="glass-card rounded-xl p-5"><div className="h-4 w-1/3 rounded shimmer mb-2" /><div className="h-3 w-2/3 rounded shimmer" /></div>))}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16">
          <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No {filter !== 'all' ? filter : ''} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <div key={report.id} className={`glass-card rounded-xl p-5 card-hover transition-all ${processing === report.id ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${REASON_COLORS[report.reason] || REASON_COLORS['Other']}`}>{report.reason}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${report.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>{report.status}</span>
                    <span className="text-[11px] text-gray-500">{timeAgo(report.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-1">{report.content_preview || '[No content]'}</p>
                  <p className="text-[11px] text-gray-600 font-mono">Reporter: {report.reporter_id?.slice(0, 16)}...</p>
                </div>
                {report.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleAction(report, 'dismiss')} className="p-2 rounded-lg hover:bg-gray-500/10 text-gray-500 hover:text-gray-300 transition-all" title="Dismiss">
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleAction(report, 'remove')} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all" title="Remove content">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
