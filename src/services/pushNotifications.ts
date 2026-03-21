import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';

/**
 * Registers the device for push notifications and saves the token to Supabase.
 * Returns the push token string, or null if registration fails.
 */
export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications are not supported in the simulator.');
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted.');
      return null;
    }

    // Replace 'your-project-id' with your actual Expo project ID
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id',
    });

    const token = tokenData.data;

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      console.error('Failed to save push token to Supabase:', error);
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Configures the global notification handler so notifications are displayed
 * when the app is in the foreground.
 */
export function setupNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      } as Notifications.NotificationBehavior),
    });
  } catch (error) {
    console.error('Error setting up notification handler:', error);
  }
}

/**
 * Schedules a daily reminder notification at the specified time.
 * Cancels all previously scheduled notifications before scheduling a new one.
 * Returns the scheduled notification identifier.
 */
export async function scheduleDailyReminder(
  hour: number = 8,
  minute: number = 0,
): Promise<string | null> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Devotional',
        body: 'Your daily verse and reflection is waiting for you.',
        data: { screen: 'Devotional' },
      },
      trigger: {
        type: 'daily' as any,
        hour,
        minute,
        repeats: true,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling reminders:', error);
  }
}

/**
 * Sends an immediate local notification.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return null;
  }
}
