import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { title, body, targetUserId } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  let query = supabase.from('push_tokens').select('token');
  if (targetUserId) query = query.eq('user_id', targetUserId);
  const { data: tokens } = await query;

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ error: 'No push tokens found' }, { status: 404 });
  }

  const messages = tokens.map((t: any) => ({
    to: t.token,
    sound: 'default',
    title,
    body,
    data: { type: 'admin_notification' },
  }));

  // Send in batches of 100 (Expo limit)
  const batches = [];
  for (let i = 0; i < messages.length; i += 100) {
    batches.push(messages.slice(i, i + 100));
  }

  let totalSent = 0;
  const errors: string[] = [];

  for (const batch of batches) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      const result = await response.json();
      totalSent += batch.length;
      if (result.errors) errors.push(...result.errors);
    } catch (error: any) {
      errors.push(error.message);
    }
  }

  return NextResponse.json({
    success: true,
    sent: totalSent,
    total_tokens: tokens.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
