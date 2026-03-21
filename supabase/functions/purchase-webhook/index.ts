import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Validate webhook authorization
    const authHeader = req.headers.get('authorization');
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const event = body.event;
    const appUserId = event?.app_user_id;
    const eventType = event?.type;
    const productId = event?.product_id;
    const expiresAt = event?.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    if (!appUserId || !eventType) {
      return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let updateData: Record<string, any> = {};

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        updateData = {
          is_premium: true,
          premium_plan: productId || 'monthly',
          premium_expires_at: expiresAt,
        };
        break;

      case 'CANCELLATION':
        // Premium stays active until expiration
        updateData = {
          premium_plan: productId ? `${productId}_cancelled` : 'cancelled',
          premium_expires_at: expiresAt,
        };
        break;

      case 'EXPIRATION':
        updateData = {
          is_premium: false,
          premium_plan: null,
          premium_expires_at: null,
        };
        break;

      case 'BILLING_ISSUE':
        console.warn(`Billing issue for user ${appUserId}`);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Update profile
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', appUserId);

      if (error) throw error;
    }

    // Log to analytics
    await supabase.from('analytics_events').insert({
      user_id: appUserId,
      event_name: `purchase_${eventType.toLowerCase()}`,
      event_data: { product_id: productId, expires_at: expiresAt },
    });

    return new Response(JSON.stringify({ success: true, event: eventType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
