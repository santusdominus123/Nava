import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [{ data: devotionals }, { data: verses }] = await Promise.all([
    supabase.from('daily_devotionals').select('*').order('active_date', { ascending: false }).limit(100),
    supabase.from('verse_of_day').select('*').order('date', { ascending: false }).limit(100),
  ]);

  return NextResponse.json({
    devotionals: devotionals || [],
    verses: verses || [],
  });
}

export async function POST(request: Request) {
  const { table, data } = await request.json();
  const allowed = ['daily_devotionals', 'verse_of_day'];
  if (!allowed.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const { data: result, error } = await supabase.from(table).insert(data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: result });
}

export async function PATCH(request: Request) {
  const { table, id, data } = await request.json();
  const allowed = ['daily_devotionals', 'verse_of_day'];
  if (!allowed.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const { error } = await supabase.from(table).update(data).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { table, id } = await request.json();
  const allowed = ['daily_devotionals', 'verse_of_day'];
  if (!allowed.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
