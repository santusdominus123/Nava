import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linkingConfig: LinkingOptions<any> = {
  prefixes: [prefix, 'bibleguideai://', 'https://bibleguideai.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Devotional: 'devotional',
          Prayer: 'prayer',
          Chat: 'chat',
          Profile: 'profile',
        },
      },
      Search: 'search',
      Premium: 'premium',
      ReadingPlan: 'reading-plan/:planId?',
      VerseNotes: 'notes',
      Community: 'community',
      Legal: 'legal/:type',
    },
  },
};

// Generate shareable deep links
export function createVerseLink(reference: string): string {
  return `bibleguideai://search?q=${encodeURIComponent(reference)}`;
}

export function createPlanLink(planId: string): string {
  return `bibleguideai://reading-plan/${planId}`;
}

export function createDevotionalLink(): string {
  return `bibleguideai://devotional`;
}

// Handle incoming deep links
export async function handleDeepLink(url: string): Promise<{ screen: string; params?: Record<string, any> } | null> {
  try {
    const parsed = Linking.parse(url);

    if (parsed.path?.startsWith('search')) {
      return { screen: 'Search', params: { query: parsed.queryParams?.q } };
    }
    if (parsed.path?.startsWith('reading-plan')) {
      const planId = parsed.path.split('/')[1];
      return { screen: 'ReadingPlan', params: { planId } };
    }
    if (parsed.path === 'devotional') {
      return { screen: 'Devotional' };
    }
    if (parsed.path === 'community') {
      return { screen: 'Community' };
    }

    return null;
  } catch {
    return null;
  }
}
