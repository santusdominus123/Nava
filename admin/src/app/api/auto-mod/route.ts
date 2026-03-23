import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: words } = await supabase
    .from('banned_words')
    .select('*')
    .order('created_at', { ascending: false });

  // Get flagged posts
  const { data: flagged } = await supabase
    .from('community_posts')
    .select('*')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ words: words || [], flagged: flagged || [] });
}

export async function POST(request: Request) {
  const { word, severity } = await request.json();
  if (!word?.trim()) return NextResponse.json({ error: 'Word required' }, { status: 400 });

  const { error } = await supabase
    .from('banned_words')
    .insert({ word: word.trim().toLowerCase(), severity: severity || 'medium' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Scan existing posts for this word
  const { data: posts } = await supabase
    .from('community_posts')
    .select('id, content')
    .ilike('content', `%${word.trim()}%`);

  if (posts && posts.length > 0) {
    for (const post of posts) {
      await supabase
        .from('community_posts')
        .update({ is_flagged: true, flag_reason: `Contains banned word: "${word.trim()}"` })
        .eq('id', post.id);
    }
  }

  return NextResponse.json({ success: true, flaggedCount: posts?.length || 0 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const { error } = await supabase.from('banned_words').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const { postId, action } = await request.json();

  if (action === 'unflag') {
    await supabase
      .from('community_posts')
      .update({ is_flagged: false, flag_reason: null })
      .eq('id', postId);
  } else if (action === 'delete') {
    await supabase.from('community_posts').delete().eq('id', postId);
  }

  return NextResponse.json({ success: true });
}
