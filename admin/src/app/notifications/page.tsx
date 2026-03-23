import { supabase } from '@/lib/supabase';
import { Bell, Send, Clock, Users, Smartphone } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SendNotification from './SendNotification';

export const revalidate = 60;

async function getNotifData() {
  const [
    { count: totalTokens },
    { count: remindersEnabled },
    { data: recentTokens },
  ] = await Promise.all([
    supabase.from('push_tokens').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('reminder_enabled', true),
    supabase.from('push_tokens').select('user_id, platform, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  // Group by hour
  const { data: profiles } = await supabase.from('profiles').select('reminder_hour').not('reminder_hour', 'is', null);
  const hourDistribution: number[] = new Array(24).fill(0);
  (profiles || []).forEach((p: any) => {
    if (p.reminder_hour != null) hourDistribution[p.reminder_hour]++;
  });

  return {
    totalTokens: totalTokens ?? 0,
    remindersEnabled: remindersEnabled ?? 0,
    recentTokens: recentTokens ?? [],
    hourDistribution,
  };
}

export default async function NotificationsPage() {
  const data = await getNotifData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
        <p className="text-gray-400 mt-1">Push notification management and scheduling</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatsCard title="Registered Devices" value={data.totalTokens} icon={Smartphone} color="blue" />
        <StatsCard title="Reminders Enabled" value={data.remindersEnabled} icon={Bell} color="green" />
        <StatsCard title="Delivery Rate" value="—" icon={Send} color="purple" change="Connect Expo Push API" changeType="neutral" />
      </div>

      {/* Reminder Hour Distribution */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-white mb-1">Reminder Schedule Distribution</h2>
        <p className="text-xs text-gray-500 mb-5">When users want their daily reminders</p>
        <div className="flex items-end justify-between gap-1 h-32">
          {data.hourDistribution.map((count, hour) => {
            const max = Math.max(...data.hourDistribution, 1);
            const h = Math.max(4, (count / max) * 128);
            return (
              <div key={hour} className="flex flex-col items-center gap-1 flex-1 group">
                <span className="text-[9px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                <div
                  className={`w-full rounded-t transition-all ${count > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-dark-700'}`}
                  style={{ height: h }}
                  title={`${hour}:00 — ${count} users`}
                />
                {hour % 3 === 0 && <span className="text-[8px] text-gray-600 mt-1">{hour}h</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Send Notification */}
      <div className="mb-6">
        <SendNotification />
      </div>

      {/* Recent Registrations */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">Recent Device Registrations</h2>
        <div className="space-y-2">
          {data.recentTokens.map((token: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-300">{token.user_id?.slice(0, 16)}...</p>
                  <p className="text-[10px] text-gray-500">{token.platform || 'Unknown platform'}</p>
                </div>
              </div>
              <span className="text-[11px] text-gray-500">{new Date(token.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {data.recentTokens.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-8">No devices registered yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
