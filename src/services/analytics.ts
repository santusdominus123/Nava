import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';

let currentUserId: string | null = null;
let sessionId: string = Math.random().toString(36).substring(2, 15);
const APP_VERSION = '1.0.0';

// Optional PostHog integration (set key to enable)
const POSTHOG_API_KEY = ''; // Set your PostHog API key here
const POSTHOG_HOST = 'https://app.posthog.com';

export function setAnalyticsUser(userId: string | null) {
  currentUserId = userId;
  if (userId) {
    trackEvent('user_identified', { userId });
  }
}

export async function trackEvent(eventName: string, eventData: Record<string, any> = {}, screenName?: string) {
  try {
    // Save to Supabase
    await supabase.from('analytics_events').insert({
      user_id: currentUserId,
      event_name: eventName,
      event_data: eventData,
      screen_name: screenName,
      session_id: sessionId,
      platform: Platform.OS,
      app_version: APP_VERSION,
    });

    // Optional PostHog
    if (POSTHOG_API_KEY) {
      fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: POSTHOG_API_KEY,
          event: eventName,
          properties: {
            ...eventData,
            distinct_id: currentUserId || sessionId,
            $screen_name: screenName,
            $os: Platform.OS,
            $app_version: APP_VERSION,
          },
        }),
      }).catch(() => {}); // Fire and forget
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

export async function trackScreenView(screenName: string) {
  return trackEvent('screen_view', {}, screenName);
}

// Pre-defined events
export const AnalyticsEvents = {
  // Auth
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  INTERESTS_SELECTED: 'interests_selected',

  // Content
  VERSE_SAVED: 'verse_saved',
  VERSE_SHARED: 'verse_shared',
  DEVOTIONAL_VIEWED: 'devotional_viewed',
  PRAYER_STARTED: 'prayer_started',
  PRAYER_COMPLETED: 'prayer_completed',

  // AI
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_LIMIT_HIT: 'chat_limit_hit',

  // Premium
  PREMIUM_SCREEN_VIEWED: 'premium_screen_viewed',
  PREMIUM_PURCHASE_STARTED: 'premium_purchase_started',
  PREMIUM_PURCHASE_COMPLETED: 'premium_purchase_completed',

  // Reading Plans
  PLAN_STARTED: 'plan_started',
  PLAN_DAY_COMPLETED: 'plan_day_completed',
  PLAN_COMPLETED: 'plan_completed',

  // Social
  PRAYER_REQUEST_CREATED: 'prayer_request_created',
  PRAYER_REQUEST_PRAYED: 'prayer_request_prayed',
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  POST_CREATED: 'post_created',

  // Engagement
  APP_OPENED: 'app_opened',
  STREAK_ACHIEVED: 'streak_achieved',
  NOTE_CREATED: 'note_created',
} as const;
