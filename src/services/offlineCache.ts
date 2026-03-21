import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_KEYS = {
  DEVOTIONALS: '@cache_devotionals',
  READING_PLANS: '@cache_reading_plans',
  SAVED_VERSES: '@cache_saved_verses',
  USER_PROFILE: '@cache_user_profile',
  SYNC_QUEUE: '@cache_sync_queue',
  CACHE_TIMESTAMPS: '@cache_timestamps',
} as const;

const EXPIRY = {
  DEVOTIONALS: 24 * 60 * 60 * 1000, // 24 hours
  READING_PLANS: 24 * 60 * 60 * 1000,
  SAVED_VERSES: 2 * 60 * 60 * 1000, // 2 hours
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
};

interface SyncAction {
  id: string;
  type: 'save_verse' | 'add_note' | 'log_streak' | 'send_prayer';
  payload: any;
  createdAt: string;
}

// --- Cache helpers ---

async function getTimestamps(): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMPS);
  return raw ? JSON.parse(raw) : {};
}

async function setTimestamp(key: string): Promise<void> {
  const ts = await getTimestamps();
  ts[key] = Date.now();
  await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMPS, JSON.stringify(ts));
}

async function isExpired(key: string, maxAge: number): Promise<boolean> {
  const ts = await getTimestamps();
  if (!ts[key]) return true;
  return Date.now() - ts[key] > maxAge;
}

// --- Devotionals ---

export async function cacheDevotionals(devotionals: any[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.DEVOTIONALS, JSON.stringify(devotionals));
  await setTimestamp(CACHE_KEYS.DEVOTIONALS);
}

export async function getCachedDevotionals(): Promise<any[] | null> {
  if (await isExpired(CACHE_KEYS.DEVOTIONALS, EXPIRY.DEVOTIONALS)) return null;
  const raw = await AsyncStorage.getItem(CACHE_KEYS.DEVOTIONALS);
  return raw ? JSON.parse(raw) : null;
}

// --- Reading Plans ---

export async function cacheReadingPlans(plans: any[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.READING_PLANS, JSON.stringify(plans));
  await setTimestamp(CACHE_KEYS.READING_PLANS);
}

export async function getCachedReadingPlans(): Promise<any[] | null> {
  if (await isExpired(CACHE_KEYS.READING_PLANS, EXPIRY.READING_PLANS)) return null;
  const raw = await AsyncStorage.getItem(CACHE_KEYS.READING_PLANS);
  return raw ? JSON.parse(raw) : null;
}

// --- Saved Verses ---

export async function cacheSavedVerses(verses: any[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.SAVED_VERSES, JSON.stringify(verses));
  await setTimestamp(CACHE_KEYS.SAVED_VERSES);
}

export async function getCachedSavedVerses(): Promise<any[] | null> {
  if (await isExpired(CACHE_KEYS.SAVED_VERSES, EXPIRY.SAVED_VERSES)) return null;
  const raw = await AsyncStorage.getItem(CACHE_KEYS.SAVED_VERSES);
  return raw ? JSON.parse(raw) : null;
}

// --- User Profile ---

export async function cacheUserProfile(profile: any): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(profile));
  await setTimestamp(CACHE_KEYS.USER_PROFILE);
}

export async function getCachedUserProfile(): Promise<any | null> {
  if (await isExpired(CACHE_KEYS.USER_PROFILE, EXPIRY.USER_PROFILE)) return null;
  const raw = await AsyncStorage.getItem(CACHE_KEYS.USER_PROFILE);
  return raw ? JSON.parse(raw) : null;
}

// --- Sync Queue ---

export async function addToSyncQueue(action: Omit<SyncAction, 'id' | 'createdAt'>): Promise<void> {
  const queue = await getSyncQueue();
  queue.push({
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

async function getSyncQueue(): Promise<SyncAction[]> {
  const raw = await AsyncStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
  return raw ? JSON.parse(raw) : [];
}

export async function getSyncQueueSize(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}

export async function processSyncQueue(supabase: any): Promise<{ processed: number; failed: number }> {
  const queue = await getSyncQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const remaining: SyncAction[] = [];

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'save_verse':
          await supabase.from('saved_verses').upsert(action.payload);
          break;
        case 'add_note':
          await supabase.from('verse_notes').upsert(action.payload);
          break;
        case 'log_streak':
          await supabase.from('user_streaks').upsert(action.payload);
          break;
        case 'send_prayer':
          await supabase.from('prayer_requests').insert(action.payload);
          break;
      }
      processed++;
    } catch {
      failed++;
      remaining.push(action);
    }
  }

  await AsyncStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(remaining));
  return { processed, failed };
}

// --- Clear all ---

export async function clearCache(): Promise<void> {
  const keys = Object.values(CACHE_KEYS);
  await AsyncStorage.multiRemove(keys);
}

// --- Network check (simple) ---

export async function isOffline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://www.google.com/generate_204', { signal: controller.signal });
    clearTimeout(timeout);
    return false;
  } catch {
    return true;
  }
}
