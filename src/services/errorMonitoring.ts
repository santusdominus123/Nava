import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';

// Optional Sentry DSN (set to enable real Sentry)
const SENTRY_DSN = ''; // Set your Sentry DSN here

let currentUserId: string | null = null;
const APP_VERSION = '1.0.0';

export function setErrorUser(userId: string | null) {
  currentUserId = userId;
}

export async function captureError(error: Error, context?: Record<string, any>) {
  try {
    console.error('[ErrorMonitor]', error.message, context);

    // Log to Supabase analytics as error event
    await supabase.from('analytics_events').insert({
      user_id: currentUserId,
      event_name: 'error_captured',
      event_data: {
        message: error.message,
        stack: error.stack?.substring(0, 1000),
        ...context,
      },
      platform: Platform.OS,
      app_version: APP_VERSION,
    });

    // Optional: Send to Sentry
    if (SENTRY_DSN) {
      // Sentry SDK would be initialized here
      // Sentry.captureException(error);
    }
  } catch (e) {
    console.error('Error reporting failed:', e);
  }
}

export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  try {
    await supabase.from('analytics_events').insert({
      user_id: currentUserId,
      event_name: `message_${level}`,
      event_data: { message, ...context },
      platform: Platform.OS,
      app_version: APP_VERSION,
    });
  } catch (e) {
    console.error('Message capture failed:', e);
  }
}

export function setupGlobalErrorHandler() {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    captureError(error, { isFatal, type: 'unhandled' });
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections
  const originalRejectionHandler = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (event: any) => {
    captureError(new Error(`Unhandled Promise Rejection: ${event?.reason}`), { type: 'unhandled_promise' });
    if (originalRejectionHandler) {
      originalRejectionHandler(event);
    }
  };
}
