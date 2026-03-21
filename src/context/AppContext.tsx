import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedVerse, Verse, ChatMessage, PremiumStatus, StreakDay } from '../types';
import { colors, darkColors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { Language, setLanguage as setI18nLanguage, getLanguage } from '../services/i18n';

interface AppState {
  savedVerses: SavedVerse[];
  chatHistory: ChatMessage[];
  darkMode: boolean;
  userName: string;
  theme: typeof colors;
  saveVerse: (verse: Verse) => void;
  removeVerse: (id: string) => void;
  isVerseSaved: (reference: string) => boolean;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  toggleDarkMode: () => void;
  setUserName: (name: string) => void;
  hasFinishedOnboarding: boolean;
  completeOnboarding: () => void;
  session: Session | null;
  signOut: () => Promise<void>;
  // New: Premium
  premiumStatus: PremiumStatus;
  refreshPremium: () => Promise<void>;
  // New: Streaks
  weeklyStreaks: StreakDay[];
  currentStreak: number;
  logActivity: (type: 'devotional' | 'prayer' | 'chat' | 'reading_plan') => Promise<void>;
  refreshStreaks: () => Promise<void>;
  // New: Language
  language: Language;
  changeLanguage: (lang: Language) => void;
  // New: Sync
  isSyncing: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserNameState] = useState('Friend');
  const [hasFinishedOnboarding, setHasFinishedOnboarding] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({ isPremium: false, plan: null, expiresAt: null });
  const [weeklyStreaks, setWeeklyStreaks] = useState<StreakDay[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [language, setLanguageState] = useState<Language>('en');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync with Supabase when session changes
  useEffect(() => {
    if (session?.user) {
      syncFromSupabase();
    }
  }, [session?.user?.id]);

  const loadData = async () => {
    try {
      const [verses, mode, name, onboarding, lang] = await Promise.all([
        AsyncStorage.getItem('savedVerses'),
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('hasFinishedOnboarding'),
        AsyncStorage.getItem('language'),
      ]);
      if (verses) setSavedVerses(JSON.parse(verses));
      if (mode) setDarkMode(JSON.parse(mode));
      if (name) setUserNameState(name);
      if (onboarding) setHasFinishedOnboarding(JSON.parse(onboarding));
      if (lang) {
        setLanguageState(lang as Language);
        setI18nLanguage(lang as Language);
      }
    } catch { }
  };

  const syncFromSupabase = async () => {
    if (!session?.user) return;
    setIsSyncing(true);
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.name) setUserNameState(profile.name);
        if (profile.dark_mode !== undefined) setDarkMode(profile.dark_mode);
        if (profile.has_finished_onboarding !== undefined) setHasFinishedOnboarding(profile.has_finished_onboarding);
        setPremiumStatus({
          isPremium: profile.is_premium && (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date()),
          plan: profile.premium_plan,
          expiresAt: profile.premium_expires_at ? new Date(profile.premium_expires_at) : null,
        });
      }

      // Fetch saved verses
      const { data: dbVerses } = await supabase
        .from('saved_verses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('saved_at', { ascending: false });

      if (dbVerses && dbVerses.length > 0) {
        const mapped: SavedVerse[] = dbVerses.map((v: any) => ({
          id: v.id,
          verse: { reference: v.reference, text: v.text },
          savedAt: new Date(v.saved_at),
        }));
        setSavedVerses(mapped);
        await AsyncStorage.setItem('savedVerses', JSON.stringify(mapped));
      }

      // Fetch streaks
      await refreshStreaksInternal(session.user.id);

    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncProfileToSupabase = async (data: Record<string, any>) => {
    if (!session?.user) return;
    try {
      await supabase.from('profiles').upsert({ id: session.user.id, ...data, updated_at: new Date().toISOString() });
    } catch (error) {
      console.error('Profile sync error:', error);
    }
  };

  const saveVerse = async (verse: Verse) => {
    const newSaved: SavedVerse = {
      id: Date.now().toString(),
      verse,
      savedAt: new Date(),
    };
    const updated = [newSaved, ...savedVerses];
    setSavedVerses(updated);
    await AsyncStorage.setItem('savedVerses', JSON.stringify(updated));

    if (session?.user) {
      try {
        await supabase.from('saved_verses').insert({
          user_id: session.user.id,
          reference: verse.reference,
          text: verse.text,
        });
      } catch (error) {
        console.error('Save verse sync error:', error);
      }
    }
  };

  const removeVerse = async (id: string) => {
    const verseToRemove = savedVerses.find((v) => v.id === id);
    const updated = savedVerses.filter((v) => v.id !== id);
    setSavedVerses(updated);
    await AsyncStorage.setItem('savedVerses', JSON.stringify(updated));

    if (session?.user && verseToRemove) {
      try {
        await supabase
          .from('saved_verses')
          .delete()
          .eq('user_id', session.user.id)
          .eq('reference', verseToRemove.verse.reference);
      } catch (error) {
        console.error('Remove verse sync error:', error);
      }
    }
  };

  const isVerseSaved = (reference: string) =>
    savedVerses.some((v) => v.verse.reference === reference);

  const addChatMessage = async (message: ChatMessage) => {
    setChatHistory((prev) => [...prev, message]);

    if (session?.user) {
      try {
        await supabase.from('chat_messages').insert({
          user_id: session.user.id,
          role: message.role,
          content: message.content,
        });
      } catch (error) {
        console.error('Chat sync error:', error);
      }
    }
  };

  const clearChat = async () => {
    setChatHistory([]);
    if (session?.user) {
      try {
        await supabase.from('chat_messages').delete().eq('user_id', session.user.id);
      } catch (error) {
        console.error('Clear chat sync error:', error);
      }
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
    syncProfileToSupabase({ dark_mode: newMode });
  };

  const setUserName = async (name: string) => {
    setUserNameState(name);
    await AsyncStorage.setItem('userName', name);
    syncProfileToSupabase({ name });
  };

  const completeOnboarding = async () => {
    setHasFinishedOnboarding(true);
    await AsyncStorage.setItem('hasFinishedOnboarding', JSON.stringify(true));
    syncProfileToSupabase({ has_finished_onboarding: true });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Premium
  const refreshPremium = async () => {
    if (!session?.user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, premium_plan, premium_expires_at')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        const isExpired = profile.premium_expires_at && new Date(profile.premium_expires_at) < new Date();
        if (isExpired) {
          await supabase.from('profiles').update({ is_premium: false, premium_plan: null, premium_expires_at: null }).eq('id', session.user.id);
          setPremiumStatus({ isPremium: false, plan: null, expiresAt: null });
        } else {
          setPremiumStatus({
            isPremium: profile.is_premium,
            plan: profile.premium_plan,
            expiresAt: profile.premium_expires_at ? new Date(profile.premium_expires_at) : null,
          });
        }
      }
    } catch (error) {
      console.error('Premium check error:', error);
    }
  };

  // Streaks
  const refreshStreaksInternal = async (userId: string) => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const { data: streaks } = await supabase
        .from('user_streaks')
        .select('date, activity_type')
        .eq('user_id', userId)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);

      if (streaks) {
        setWeeklyStreaks(streaks as StreakDay[]);
      }

      // Calculate current streak
      const { data: allStreaks } = await supabase
        .from('user_streaks')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(60);

      if (allStreaks && allStreaks.length > 0) {
        const uniqueDates = [...new Set(allStreaks.map((s: any) => s.date))].sort().reverse();
        let streak = 0;
        const todayStr = today.toISOString().split('T')[0];

        for (let i = 0; i < uniqueDates.length; i++) {
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          const expectedStr = expectedDate.toISOString().split('T')[0];

          if (uniqueDates[i] === expectedStr) {
            streak++;
          } else if (i === 0 && uniqueDates[0] !== todayStr) {
            // Allow yesterday as first day
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (uniqueDates[0] === yesterday.toISOString().split('T')[0]) {
              streak++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        setCurrentStreak(streak);
      }
    } catch (error) {
      console.error('Streak fetch error:', error);
    }
  };

  const refreshStreaks = async () => {
    if (session?.user) {
      await refreshStreaksInternal(session.user.id);
    }
  };

  const logActivity = async (type: 'devotional' | 'prayer' | 'chat' | 'reading_plan') => {
    if (!session?.user) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase.from('user_streaks').upsert(
        { user_id: session.user.id, date: todayStr, activity_type: type },
        { onConflict: 'user_id,date,activity_type' }
      );
      await refreshStreaksInternal(session.user.id);
    } catch (error) {
      console.error('Log activity error:', error);
    }
  };

  // Language
  const changeLanguage = async (lang: Language) => {
    setLanguageState(lang);
    setI18nLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const theme = (darkMode ? darkColors : colors) as typeof colors;

  return (
    <AppContext.Provider
      value={{
        savedVerses,
        chatHistory,
        darkMode,
        userName,
        theme,
        saveVerse,
        removeVerse,
        isVerseSaved,
        addChatMessage,
        clearChat,
        toggleDarkMode,
        setUserName,
        hasFinishedOnboarding,
        completeOnboarding,
        session,
        signOut,
        premiumStatus,
        refreshPremium,
        weeklyStreaks,
        currentStreak,
        logActivity,
        refreshStreaks,
        language,
        changeLanguage,
        isSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
