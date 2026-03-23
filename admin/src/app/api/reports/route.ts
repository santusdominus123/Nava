import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: reports } = await supabase
    .from('post_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // Enrich with content previews
  const enriched = await Promise.all(
    (reports || []).map(async (r: any) => {
      let contentPreview = '';
      if (r.post_id) {
        const { data } = await supabase.from('community_posts').select('content').eq('id', r.post_id).single();
        contentPreview = data?.content?.slice(0, 100) || '[Deleted]';
      } else if (r.prayer_id) {
        const { data } = await supabase.from('prayer_requests').select('content').eq('id', r.prayer_id).single();
        contentPreview = data?.content?.slice(0, 100) || '[Deleted]';
      }
      return { ...r, content_preview: contentPreview };
    })
  );

  return NextResponse.json({ reports: enriched });
}

export async function PATCH(request: Request) {
  const { id, status, deleteContent, post_id, prayer_id } = await request.json();

  // Update report status
  const { error } = await supabase.from('post_reports').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optionally delete the reported content
  if (deleteContent) {
    if (post_id) await supabase.from('community_posts').delete().eq('id', post_id);
    if (prayer_id) await supabase.from('prayer_requests').delete().eq('id', prayer_id);
  }

  return NextResponse.json({ success: true });
}
