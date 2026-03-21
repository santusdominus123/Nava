import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_LIMIT = 5;
const PREMIUM_LIMIT = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check premium status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user_id)
      .single();

    const isPremium = profile?.is_premium || false;
    const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;

    // Count today's messages
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('role', 'user')
      .gte('created_at', todayStart.toISOString());

    const used = count || 0;
    const remaining = Math.max(0, limit - used);
    const allowed = remaining > 0;

    // Log rate limit check
    await supabase.from('rate_limit_logs').insert({
      user_id,
      endpoint: 'ai_chat',
      allowed,
    });

    return new Response(
      JSON.stringify({ allowed, remaining, limit, used, isPremium }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
