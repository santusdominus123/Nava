import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Get activity from multiple sources for richer heatmap
  const [{ data: events }, { data: posts }, { data: chats }] = await Promise.all([
    supabase.from('analytics_events').select('created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('community_posts').select('created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('chat_messages').select('created_at').gte('created_at', thirtyDaysAgo),
  ]);

  // Build heatmap: 7 days x 24 hours
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const allDates = [
    ...(events || []).map(e => e.created_at),
    ...(posts || []).map(p => p.created_at),
    ...(chats || []).map(c => c.created_at),
  ];

  allDates.forEach(dateStr => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0=Sun, 6=Sat
    const hour = d.getHours();
    heatmap[day][hour]++;
  });

  // Daily activity trend (last 30 days)
  const dailyTrend: Record<string, number> = {};
  allDates.forEach(dateStr => {
    const day = new Date(dateStr).toISOString().split('T')[0];
    dailyTrend[day] = (dailyTrend[day] || 0) + 1;
  });

  // Top active hours
  const hourTotals = new Array(24).fill(0);
  heatmap.forEach(day => day.forEach((count, hour) => { hourTotals[hour] += count; }));

  return NextResponse.json({
    heatmap,
    totalEvents: allDates.length,
    dailyTrend,
    hourTotals,
    peakHour: hourTotals.indexOf(Math.max(...hourTotals)),
    peakDay: heatmap.map((day, i) => ({ day: i, total: day.reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)[0]?.day ?? 0,
  });
}
