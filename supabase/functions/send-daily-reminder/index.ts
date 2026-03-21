import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const currentHour = now.getUTCHours();

    // Get users whose reminder_hour matches current UTC hour
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, reminder_hour')
      .eq('reminder_enabled', true)
      .eq('reminder_hour', currentHour);

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No users to notify this hour' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds = profiles.map((p) => p.id);

    // Get push tokens for these users
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', userIds);

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No push tokens found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get today's verse
    const verses = [
      { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
      { ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
      { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord.' },
      { ref: 'Romans 8:28', text: 'All things work together for good to those who love God.' },
      { ref: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart.' },
      { ref: 'Isaiah 41:10', text: 'Fear not, for I am with you; be not dismayed.' },
      { ref: 'John 3:16', text: 'For God so loved the world that He gave His only begotten Son.' },
    ];
    const todayVerse = verses[now.getDay()];

    // Send via Expo Push API
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: `📖 ${todayVerse.ref}`,
      body: `${todayVerse.text}\n\nTime for your daily devotional!`,
      data: { screen: 'Devotional' },
    }));

    // Batch send (max 100 per request)
    let sent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (pushRes.ok) {
        sent += batch.length;
      } else {
        console.error('Push API error:', await pushRes.text());
      }
    }

    // Log to analytics
    await supabase.from('analytics_events').insert({
      event_name: 'daily_reminder_sent',
      event_data: { sent, hour: currentHour },
    });

    return new Response(JSON.stringify({ sent, message: `Sent ${sent} notifications` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
