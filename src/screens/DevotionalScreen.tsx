import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { typography } from '../theme/typography';
import { supabase } from '../utils/supabase';
import { speakDevotional, stopSpeaking, isCurrentlySpeaking, pauseSpeaking, resumeSpeaking, isCurrentlyPaused } from '../services/audioService';
import { trackScreenView, trackEvent, AnalyticsEvents } from '../services/analytics';

interface Devotional {
  id: string;
  title: string;
  verse_reference: string;
  verse_text: string;
  reflection: string;
  prayer: string;
  category: string;
  publish_date: string;
  like_count: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const date = new Date(dateStr + 'T00:00:00');
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  if (dateStr === todayStr) return "Today's Devotional";
  if (dateStr === yesterdayStr) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function DevotionalScreen({ navigation }: any) {
  const { theme, saveVerse, isVerseSaved, session, userName } = useApp();
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const devotional = devotionals[activeIndex] ?? null;
  const saved = devotional ? isVerseSaved(devotional.verse_reference) : false;

  // Fetch devotionals from Supabase
  const fetchDevotionals = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Build date range: past 7 days
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      const oldest = dates[dates.length - 1];

      // Fetch devotionals for the past 7 days
      const { data, error } = await supabase
        .from('daily_devotionals')
        .select('*')
        .gte('publish_date', oldest)
        .lte('publish_date', todayStr)
        .order('publish_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setDevotionals(data);
        setActiveIndex(0);
      } else {
        // No devotionals for the past 7 days, get the most recent one
        const { data: fallback, error: fbError } = await supabase
          .from('daily_devotionals')
          .select('*')
          .order('publish_date', { ascending: false })
          .limit(1)
          .single();

        if (fbError) throw fbError;
        if (fallback) {
          setDevotionals([fallback]);
          setActiveIndex(0);
        }
      }
    } catch (err) {
      console.error('Error fetching devotionals:', err);
      Alert.alert('Error', 'Could not load devotional. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if current user already liked the active devotional
  const checkLikeStatus = useCallback(async (devotionalId: string) => {
    if (!session?.user?.id) {
      setLiked(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('devotional_likes')
        .select('id')
        .eq('devotional_id', devotionalId)
        .eq('user_id', session.user.id)
        .maybeSingle();
      setLiked(!!data);
    } catch {
      setLiked(false);
    }
  }, [session?.user?.id]);

  // Log read activity to activity_feed
  const logReadActivity = useCallback(async (dev: Devotional) => {
    if (!session?.user?.id) return;
    try {
      await supabase.from('activity_feed').insert({
        user_id: session.user.id,
        user_name: userName || 'Friend',
        action: 'read_devotional',
        detail: dev.title,
        entity_type: 'devotional',
        entity_id: dev.id,
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  }, [session?.user?.id, userName]);

  useEffect(() => {
    fetchDevotionals();
    trackScreenView('Devotional');
    return () => { stopSpeaking(); };
  }, [fetchDevotionals]);

  // When active devotional changes, check like status and log activity
  useEffect(() => {
    if (devotional) {
      checkLikeStatus(devotional.id);
      logReadActivity(devotional);
    }
  }, [devotional?.id, checkLikeStatus, logReadActivity]);

  const handleLike = async () => {
    if (!devotional) return;
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in to like devotionals.');
      return;
    }
    if (liked) return;

    // Optimistic update
    setLiked(true);
    setDevotionals(prev =>
      prev.map(d =>
        d.id === devotional.id ? { ...d, like_count: (d.like_count || 0) + 1 } : d
      )
    );

    try {
      await supabase.from('devotional_likes').insert({
        devotional_id: devotional.id,
        user_id: session.user.id,
      });

      await supabase
        .from('daily_devotionals')
        .update({ like_count: (devotional.like_count || 0) + 1 })
        .eq('id', devotional.id);
    } catch (err) {
      // Revert on error
      setLiked(false);
      setDevotionals(prev =>
        prev.map(d =>
          d.id === devotional.id ? { ...d, like_count: devotional.like_count } : d
        )
      );
      console.error('Error liking devotional:', err);
    }
  };

  const handlePlayAudio = async () => {
    if (!devotional) return;
    if (isPlaying && !isPaused) {
      await pauseSpeaking();
      setIsPaused(true);
      return;
    }
    if (isPaused) {
      await resumeSpeaking();
      setIsPaused(false);
      return;
    }
    setIsPlaying(true);
    trackEvent(AnalyticsEvents.DEVOTIONAL_VIEWED, { audio: true });
    await speakDevotional(
      devotional.verse_reference,
      devotional.verse_text,
      devotional.reflection,
      devotional.prayer,
      {
        onDone: () => { setIsPlaying(false); setIsPaused(false); },
        onStopped: () => { setIsPlaying(false); setIsPaused(false); },
      }
    );
  };

  const handleStopAudio = async () => {
    await stopSpeaking();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleSave = () => {
    if (!devotional || saved) return;
    saveVerse({ reference: devotional.verse_reference, text: devotional.verse_text });
    Alert.alert('Saved', 'Verse has been saved to your collection.');
  };

  const handleShare = async () => {
    if (!devotional) return;
    try {
      await Share.share({
        message: `${devotional.verse_reference}\n\n"${devotional.verse_text}"\n\n${devotional.reflection}\n\n— Nava`,
      });
    } catch {}
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setActiveIndex(newIndex);
      // Stop audio when swiping to a different devotional
      stopSpeaking();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.secondary} />
        <Text style={[typography.body, { color: theme.text.secondary, marginTop: 16 }]}>
          Loading devotional...
        </Text>
      </View>
    );
  }

  if (!devotional) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="book-outline" size={48} color={theme.text.secondary} />
        <Text style={[typography.h3, { color: theme.text.primary, marginTop: 16 }]}>
          No Devotional Available
        </Text>
        <Text style={[typography.body, { color: theme.text.secondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }]}>
          Check back later for a new daily devotional.
        </Text>
      </View>
    );
  }

  const renderDevotionalItem = ({ item, index }: { item: Devotional; index: number }) => (
    <ScrollView
      style={{ width: SCREEN_WIDTH }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Date Badge */}
      <View style={styles.dateBadgeWrap}>
        <View style={[styles.dateBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="calendar-outline" size={14} color={theme.secondary} />
          <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 6 }]}>
            {formatDateLabel(item.publish_date)}
          </Text>
        </View>
      </View>

      {/* Title */}
      {item.title ? (
        <Text style={[typography.h2, { color: theme.text.primary, textAlign: 'center', marginTop: 8, marginBottom: 4 }]}>
          {item.title}
        </Text>
      ) : null}

      {/* Category */}
      {item.category ? (
        <View style={styles.categoryWrap}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.secondary + '15' }]}>
            <Text style={[typography.caption, { color: theme.secondary }]}>
              {item.category}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Verse Card */}
      <LinearGradient
        colors={[...theme.gradient.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.verseCard}
      >
        <View style={styles.verseIconWrap}>
          <Ionicons name="book-outline" size={24} color="rgba(255,255,255,0.6)" />
        </View>
        <Text style={[typography.h2, { color: '#FFFFFF', marginTop: 16 }]}>
          {item.verse_reference}
        </Text>
        <View style={styles.divider} />
        <View style={styles.quoteWrap}>
          <Text style={styles.bigQuote}>"</Text>
          <Text style={[typography.verse, { color: 'rgba(255,255,255,0.92)' }]}>
            {item.verse_text}
          </Text>
        </View>
      </LinearGradient>

      {/* Like & Share Counts */}
      <View style={styles.socialRow}>
        <TouchableOpacity
          style={[styles.socialBtn, liked && { backgroundColor: theme.secondary + '15' }]}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? theme.secondary : theme.text.secondary}
          />
          <Text style={[typography.label, { color: liked ? theme.secondary : theme.text.secondary, marginLeft: 6 }]}>
            {item.like_count || 0}
          </Text>
        </TouchableOpacity>

        <View style={styles.socialBtn}>
          <Ionicons name="share-social-outline" size={20} color={theme.text.secondary} />
          <Text style={[typography.label, { color: theme.text.secondary, marginLeft: 6 }]}>
            Share
          </Text>
        </View>
      </View>

      {/* Reflection */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={['#C9A22725', '#C9A22710']}
            style={styles.sectionIconWrap}
          >
            <Ionicons name="bulb-outline" size={18} color={theme.secondary} />
          </LinearGradient>
          <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 10 }]}>
            Reflection
          </Text>
        </View>
        <Text style={[typography.body, { color: theme.text.secondary, marginTop: 14, lineHeight: 26 }]}>
          {item.reflection}
        </Text>
      </View>

      {/* Prayer */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={['#5A8DEE25', '#5A8DEE10']}
            style={styles.sectionIconWrap}
          >
            <Ionicons name="hand-left-outline" size={18} color={theme.accent} />
          </LinearGradient>
          <Text style={[typography.h3, { color: theme.text.primary, marginLeft: 10 }]}>
            Prayer
          </Text>
        </View>
        <Text style={[typography.body, { color: theme.text.secondary, marginTop: 14, fontStyle: 'italic', lineHeight: 26 }]}>
          {item.prayer}
        </Text>
      </View>

      {/* Audio Player */}
      <View style={[styles.audioBar, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={handlePlayAudio} activeOpacity={0.7} style={styles.audioBtn}>
          <LinearGradient colors={[...theme.gradient.primary]} style={styles.audioBtnGradient}>
            <Ionicons name={isPlaying && !isPaused ? 'pause' : 'play'} size={22} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.audioInfo}>
          <Text style={[typography.label, { color: theme.text.primary }]}>
            {isPlaying ? (isPaused ? 'Paused' : 'Playing Devotional...') : 'Listen to Devotional'}
          </Text>
          <Text style={[typography.caption, { color: theme.text.secondary }]}>
            Audio read-aloud
          </Text>
        </View>
        {isPlaying && (
          <TouchableOpacity onPress={handleStopAudio} activeOpacity={0.7}>
            <Ionicons name="stop-circle" size={32} color={theme.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Prayer')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[...theme.gradient.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Ionicons name="hand-left" size={20} color="#FFFFFF" />
            <Text style={[typography.button, { color: '#FFFFFF', marginLeft: 10 }]}>
              Start Prayer
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.smallActions}>
          <TouchableOpacity
            style={[
              styles.smallBtn,
              {
                backgroundColor: saved ? theme.secondary + '15' : theme.card,
                borderColor: saved ? theme.secondary + '40' : theme.border,
              },
            ]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? theme.secondary : theme.text.secondary}
            />
            <Text
              style={[
                typography.label,
                {
                  color: saved ? theme.secondary : theme.text.secondary,
                  marginLeft: 6,
                },
              ]}
            >
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={20} color={theme.text.secondary} />
            <Text style={[typography.label, { color: theme.text.secondary, marginLeft: 6 }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Day indicator dots */}
      {devotionals.length > 1 && (
        <View style={styles.dotsContainer}>
          {devotionals.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? theme.secondary : theme.border,
                },
              ]}
            />
          ))}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={devotionals}
        renderItem={renderDevotionalItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 16 },
  dateBadgeWrap: { alignItems: 'center', marginBottom: 4 },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryWrap: { alignItems: 'center', marginTop: 4, marginBottom: 4 },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verseCard: {
    borderRadius: 24,
    padding: 28,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#1C3D5A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  verseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 18,
    borderRadius: 1,
  },
  quoteWrap: {
    position: 'relative',
  },
  bigQuote: {
    position: 'absolute',
    top: -20,
    left: -6,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 50,
    color: 'rgba(255,255,255,0.12)',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    marginBottom: 4,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  section: {
    borderRadius: 20,
    padding: 22,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  audioBtn: {
    marginRight: 14,
  },
  audioBtnGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  actions: { marginTop: 24 },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1C3D5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  smallActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  smallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
