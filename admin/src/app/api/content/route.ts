import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [{ data: posts }, { data: prayers }, { data: groups }] = await Promise.all([
    supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('prayer_groups').select('*').order('created_at', { ascending: false }).limit(50),
  ]);

  return NextResponse.json({ posts: posts || [], prayers: prayers || [], groups: groups || [] });
}

export async function DELETE(request: Request) {
  const { table, id } = await request.json();

  const allowedTables = ['community_posts', 'prayer_requests', 'prayer_groups'];
  if (!allowedTables.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
