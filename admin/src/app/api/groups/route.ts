import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  if (groupId) {
    // Get group details with members and messages
    const [{ data: group }, { data: members }, { data: messages }] = await Promise.all([
      supabase.from('prayer_groups').select('*').eq('id', groupId).single(),
      supabase.from('prayer_group_members').select('*').eq('group_id', groupId).order('joined_at', { ascending: false }),
      supabase.from('group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: false }).limit(50),
    ]);

    // Enrich members with profile info
    const enrichedMembers = await Promise.all(
      (members || []).map(async (m: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', m.user_id)
          .single();
        return { ...m, profile };
      })
    );

    return NextResponse.json({ group, members: enrichedMembers, messages: messages || [] });
  }

  // List all groups with member counts
  const { data: groups } = await supabase
    .from('prayer_groups')
    .select('*')
    .order('created_at', { ascending: false });

  const enrichedGroups = await Promise.all(
    (groups || []).map(async (g: any) => {
      const { count } = await supabase
        .from('prayer_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', g.id);
      const { count: msgCount } = await supabase
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', g.id);
      return { ...g, member_count: count || 0, message_count: msgCount || 0 };
    })
  );

  return NextResponse.json({ groups: enrichedGroups });
}

export async function PATCH(request: Request) {
  const { action, groupId, userId, role } = await request.json();

  if (action === 'kick') {
    const { error } = await supabase
      .from('prayer_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Update member count
    const { count } = await supabase
      .from('prayer_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);
    await supabase.from('prayer_groups').update({ member_count: count || 0 }).eq('id', groupId);
  }

  if (action === 'set_role') {
    const { error } = await supabase
      .from('prayer_group_members')
      .update({ role: role || 'member' })
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === 'delete_group') {
    await supabase.from('prayer_group_members').delete().eq('group_id', groupId);
    await supabase.from('group_messages').delete().eq('group_id', groupId);
    await supabase.from('prayer_groups').delete().eq('id', groupId);
  }

  return NextResponse.json({ success: true });
}
