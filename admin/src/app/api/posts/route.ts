import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: Request) {
  const { id, action } = await request.json();

  if (action === 'pin') {
    const { error } = await supabase.from('community_posts').update({ is_pinned: true }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === 'unpin') {
    const { error } = await supabase.from('community_posts').update({ is_pinned: false }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
