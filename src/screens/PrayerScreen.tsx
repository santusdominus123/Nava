import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Modal, KeyboardAvoidingView, Platform, FlatList, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';
import { prayerCategories } from '../data/prayers';
import { PrayerCategory } from '../types';

const { width, height } = Dimensions.get('window');

// Delicate, minimalist colors matching the new elegant outline icons
const categoryColors: Record<string, string> = {
  gratitude: '#C9A227',    // Soft Gold
  healing: '#4CAF50',      // Soft Green
  guidance: '#5A8DEE',     // Soft Blue
  strength: '#E53935',     // Soft Red/Coral
  forgiveness: '#8B5CF6',  // Soft Purple
};

interface JournalEntry {
  id: string;
  category: string;
  content: string;
  is_answered: boolean;
  created_at: string;
}

export default function PrayerScreen({ navigation }: any) {
  const { theme, session, userName } = useApp();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Prayer journal
  const [showJournal, setShowJournal] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalText, setJournalText] = useState('');
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [prayerCount, setPrayerCount] = useState(0);

  const userId = session?.user?.id;

  // Advanced Animations for minimalist feel
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Concentric Breathing Rings
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0.2)).current;
  const ring2Opacity = useRef(Animated.multiply(ringOpacity, 1.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 15,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, selectedCategory]);

  // Elegant Breathing Animation
  useEffect(() => {
    if (isActive && !completed) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1Scale, { toValue: 1.4, duration: 4000, useNativeDriver: true }),
            Animated.timing(ring2Scale, { toValue: 1.2, duration: 4000, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.6, duration: 4000, useNativeDriver: true }),
          ]),
          Animated.delay(1000),
          Animated.parallel([
            Animated.timing(ring1Scale, { toValue: 1, duration: 4000, useNativeDriver: true }),
            Animated.timing(ring2Scale, { toValue: 0.8, duration: 4000, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.2, duration: 4000, useNativeDriver: true }),
          ]),
          Animated.delay(1000),
        ])
      ).start();
    } else {
      ring1Scale.stopAnimation();
      ring2Scale.stopAnimation();
      ringOpacity.stopAnimation();
      Animated.spring(ring1Scale, { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(ring2Scale, { toValue: 0.8, useNativeDriver: true }).start();
    }
  }, [isActive, completed]);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t === 1) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsActive(false);
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  // Refs to avoid stale closures in PanResponder
  const stateRef = useRef({ currentStep, selectedCategory });
  useEffect(() => {
    stateRef.current = { currentStep, selectedCategory };
  }, [currentStep, selectedCategory]);

  // Fetch prayer journal + count
  useEffect(() => {
    if (!userId) return;
    supabase.from('prayer_journal').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setJournalEntries(data); });
    supabase.from('prayer_journal').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      .then(({ count }) => { if (count != null) setPrayerCount(count); });
  }, [userId]);

  const openJournal = async () => {
    setShowJournal(true);
    setLoadingJournal(true);
    try {
      const { data } = await supabase.from('prayer_journal').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      if (data) setJournalEntries(data);
    } catch {} finally { setLoadingJournal(false); }
  };

  const saveJournalEntry = async () => {
    if (!userId || !journalText.trim() || !selectedCategory) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      category: selectedCategory.id,
      content: journalText.trim(),
      is_answered: false,
      created_at: new Date().toISOString(),
    };
    setJournalEntries(prev => [entry, ...prev]);
    setJournalText('');
    setPrayerCount(prev => prev + 1);
    try {
      await supabase.from('prayer_journal').insert({ user_id: userId, category: selectedCategory.id, content: journalText.trim() });
    } catch {}
  };

  const toggleAnswered = async (entryId: string) => {
    const entry = journalEntries.find(e => e.id === entryId);
    if (!entry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJournalEntries(prev => prev.map(e => e.id === entryId ? { ...e, is_answered: !e.is_answered } : e));
    try { await supabase.from('prayer_journal').update({ is_answered: !entry.is_answered }).eq('id', entryId); } catch {}
  };

  // Log completed prayer to activity + streaks + check achievements
  const logPrayerCompletion = async () => {
    if (!userId) return;
    try {
      // Log activity
      await supabase.from('activity_feed').insert({
        user_id: userId, user_name: userName,
        action: 'completed_prayer', detail: selectedCategory?.name || 'Prayer',
        entity_type: 'prayer', entity_id: selectedCategory?.id,
      });
      // Log streak
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('user_streaks').upsert({ user_id: userId, date: today, activity_type: 'prayer' }, { onConflict: 'user_id,date,activity_type' });
      // Check first_prayer achievement
      const { data: existing } = await supabase.from('user_achievements').select('id').eq('user_id', userId).eq('badge_key', 'first_prayer').maybeSingle();
      if (!existing) {
        await supabase.from('user_achievements').insert({ user_id: userId, badge_key: 'first_prayer' });
      }
    } catch {}
  };

  const selectCategory = (cat: PrayerCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    setCurrentStep(0);
    setCompleted(false);
    setTimer(cat.steps[0].duration);
    setIsActive(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
  };

  const nextStep = () => {
    const state = stateRef.current;
    if (!state.selectedCategory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (state.currentStep < state.selectedCategory.steps.length - 1) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      const next = state.currentStep + 1;
      setCurrentStep(next);
      setTimer(state.selectedCategory.steps[next].duration);
      setIsActive(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCompleted(true);
    }
  };

  const prevStep = () => {
    const state = stateRef.current;
    if (!state.selectedCategory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fadeAnim.setValue(0);
    slideAnim.setValue(-20);
    const prev = state.currentStep - 1;
    setCurrentStep(prev);
    setTimer(state.selectedCategory.steps[prev].duration);
    setIsActive(false);
  };

  // Swiping Gestures handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const state = stateRef.current;
        if (gestureState.dx > 60 && state.currentStep > 0) {
          prevStep();
        } else if (gestureState.dx < -60) {
          nextStep();
        }
      },
    })
  ).current;

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(null);
    setCurrentStep(0);
    setCompleted(false);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Stage 1: Category Selection (Ultra Minimalist)
  if (!selectedCategory) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.minimalHeader}>
          {/* FIX: Functional back button for the tab layout */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={styles.globalBackBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // FIX: larger touch area
            >
              <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
            </TouchableOpacity>
            <View />
          </View>
          <Text style={[styles.dateText, { color: theme.text.light }]}>GUIDED PRAYER</Text>
          <Text style={[styles.pageTitle, { color: theme.text.primary }]}>Find your peace</Text>
        </View>

        {/* Prayer stats + journal button */}
        <View style={[styles.statsBar, { paddingHorizontal: 24 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.text.primary }]}>{prayerCount}</Text>
            <Text style={[styles.statLabel, { color: theme.text.light }]}>Prayers</Text>
          </View>
          <TouchableOpacity style={[styles.journalBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={openJournal}>
            <Ionicons name="journal-outline" size={18} color={theme.primary} />
            <Text style={[styles.journalBtnText, { color: theme.primary }]}>My Journal</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]} // FIX: accommodate tab bar
          showsVerticalScrollIndicator={false}
        >
          {prayerCategories.map((cat, index) => {
            const color = categoryColors[cat.id] || theme.accent;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.cleanCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => selectCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: `${color}10` }]}>
                    <Ionicons name={cat.icon as any} size={22} color={color} />
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={theme.text.light} />
                </View>

                <View style={styles.cardTextWrap}>
                  <Text style={[styles.cardTitle, { color: theme.text.primary }]}>{cat.name}</Text>
                  <Text style={[styles.cardDesc, { color: theme.text.secondary }]}>{cat.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Log prayer completion when completed
  const loggedRef = useRef(false);
  useEffect(() => {
    if (completed && !loggedRef.current) {
      loggedRef.current = true;
      logPrayerCompletion();
    }
    if (!completed) loggedRef.current = false;
  }, [completed]);

  // Stage 3: Completed (Calm & Serene)
  if (completed) {

    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <Animated.View style={[styles.completedContent, { opacity: fadeAnim }]}>
          <View style={styles.completedIconWrapper}>
            <Ionicons name="leaf-outline" size={48} color={theme.text.primary} />
          </View>
          <Text style={[styles.completedTitle, { color: theme.text.primary }]}>
            Amen.
          </Text>
          <Text style={[styles.completedSub, { color: theme.text.secondary }]}>
            Your heart is heard. May peace guard your mind today.
          </Text>

          {/* Save to journal prompt */}
          <View style={[styles.journalPrompt, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.journalInput, { color: theme.text.primary }]}
              placeholder="Write a prayer note to remember..."
              placeholderTextColor={theme.text.light}
              value={journalText}
              onChangeText={setJournalText}
              multiline
            />
            {journalText.trim() ? (
              <TouchableOpacity onPress={saveJournalEntry} style={[styles.journalSaveBtn, { backgroundColor: categoryColors[selectedCategory?.id || ''] || theme.primary }]}>
                <Ionicons name="bookmark" size={16} color="#FFF" />
                <Text style={styles.journalSaveBtnText}>Save to Journal</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.returnBtn, { backgroundColor: theme.text.primary }]}
            onPress={reset}
            activeOpacity={0.8}
          >
            <Text style={[styles.returnBtnText, { color: theme.background }]}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Stage 2: The Prayer Experience (Zen/Headspace Vibe)
  const step = selectedCategory.steps[currentStep];
  const color = categoryColors[selectedCategory.id] || theme.accent;
  const isDarkBg = theme.background === '#0D1117';

  const activeBgColor = isDarkBg ? '#090B10' : '#F4F7F6';
  const activeTextColor = isDarkBg ? '#FFFFFF' : '#1C3D5A';
  const activeSubTextColor = isDarkBg ? 'rgba(255,255,255,0.6)' : 'rgba(28, 61, 90, 0.6)';

  return (
    <View style={[styles.container, { backgroundColor: activeBgColor, paddingTop: insets.top, paddingBottom: insets.bottom }]} {...panResponder.panHandlers}>

      {/* Delicate Breathing Rings */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: color,
              opacity: ringOpacity,
              transform: [{ scale: ring1Scale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: color,
              opacity: ring2Opacity,
              transform: [{ scale: ring2Scale }],
            },
          ]}
        />
      </View>

      {/* Header */}
      <View style={styles.experienceHeader}>
        <TouchableOpacity
          onPress={reset}
          style={styles.closeBtn}
          activeOpacity={0.6}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // FIX: Ensure button is easy to hit
        >
          <Ionicons name="close" size={28} color={activeTextColor} />
        </TouchableOpacity>
        <Text style={[styles.headerCatName, { color: activeSubTextColor }]}>
          {selectedCategory.name.toUpperCase()}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Delicate Progress Indicator */}
      <View style={styles.progressRow}>
        {selectedCategory.steps.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              {
                backgroundColor: idx === currentStep ? color : (isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                width: idx === currentStep ? 24 : 6
              }
            ]}
          />
        ))}
      </View>

      {/* Main Content */}
      <Animated.View style={[styles.experienceContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.stepTitle, { color: activeTextColor }]}>{step.title}</Text>
        <Text style={[styles.stepInstruction, { color: activeSubTextColor }]}>{step.instruction}</Text>
      </Animated.View>

      {/* Minimal Timer & Controls */}
      <View style={[styles.controlsSection, { paddingBottom: 60 }]}>
        <View style={styles.timerDisplayWrap}>
          <Text style={[styles.timerDisplay, { color: activeTextColor }]}>
            {formatTime(timer)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.minimalBtn, { opacity: currentStep > 0 ? 1 : 0.2 }]}
            onPress={prevStep}
            disabled={currentStep === 0}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="play-back" size={24} color={activeTextColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.minimalPlayBtn, { backgroundColor: activeTextColor }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (timer === 0 && !isActive) setTimer(step.duration);
              setIsActive(!isActive);
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isActive ? 'pause' : 'play'}
              size={28}
              color={activeBgColor}
              style={{ marginLeft: isActive ? 0 : 3 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.minimalBtn}
            onPress={nextStep}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="play-forward" size={24} color={activeTextColor} />
          </TouchableOpacity>
        </View>

        {/* Mock Audio Player Timeline */}
        <View style={styles.audioTimelineWrap}>
          <Text style={[styles.timelineTime, { color: activeSubTextColor }]}>{formatTime(step.duration - timer)}</Text>
          <View style={[styles.timelineTrack, { backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.timelineFill, { backgroundColor: activeTextColor, width: `${((step.duration - timer) / step.duration) * 100}%` }]} />
            <View style={[styles.timelineKnob, { backgroundColor: activeTextColor, left: `${((step.duration - timer) / step.duration) * 100}%` }]} />
          </View>
          <Text style={[styles.timelineTime, { color: activeSubTextColor }]}>-{formatTime(timer)}</Text>
        </View>

        <Text style={[styles.swipeHint, { color: activeSubTextColor }]}>Audio Guided Reflection • Swipe to navigate</Text>
      </View>

      {/* Prayer Journal Modal */}
      <Modal visible={showJournal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Prayer Journal</Text>
              <TouchableOpacity onPress={() => setShowJournal(false)}>
                <Ionicons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
            {loadingJournal ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={[styles.cardDesc, { color: theme.text.light }]}>Loading...</Text>
              </View>
            ) : journalEntries.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="journal-outline" size={40} color={theme.text.light} />
                <Text style={[styles.cardDesc, { color: theme.text.light, marginTop: 12 }]}>No journal entries yet</Text>
                <Text style={[styles.cardDesc, { color: theme.text.light }]}>Complete a prayer to save your first note</Text>
              </View>
            ) : (
              <FlatList
                data={journalEntries}
                keyExtractor={item => item.id}
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const catColor = categoryColors[item.category] || theme.primary;
                  return (
                    <View style={[styles.journalEntry, { borderBottomColor: theme.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.journalDot, { backgroundColor: catColor }]} />
                          <Text style={[styles.journalCategory, { color: catColor }]}>{item.category}</Text>
                        </View>
                        <TouchableOpacity onPress={() => toggleAnswered(item.id)}>
                          <Ionicons
                            name={item.is_answered ? 'checkmark-circle' : 'checkmark-circle-outline'}
                            size={20}
                            color={item.is_answered ? '#4CAF50' : theme.text.light}
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.journalContent, { color: theme.text.primary }]}>{item.content}</Text>
                      <Text style={[styles.journalDate, { color: theme.text.light }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                        {item.is_answered ? ' • Answered' : ''}
                      </Text>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Selection Screen
  minimalHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  globalBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
  },
  dateText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  pageTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    letterSpacing: -1,
  },
  listContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  cleanCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextWrap: {
    marginTop: 4,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },

  // Completed Screen
  completedContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completedIconWrapper: {
    marginBottom: 32,
    opacity: 0.8,
  },
  completedTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 42,
    marginBottom: 16,
  },
  completedSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
  },
  returnBtn: {
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 30,
  },
  returnBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },

  // Interactive Experience Screen (Zen)
  ring: {
    position: 'absolute',
    top: height * 0.25 - width * 0.4,
    left: width * 0.5 - width * 0.4,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    borderWidth: 1,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCatName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    zIndex: 10,
  },
  progressDot: {
    height: 3,
    borderRadius: 1.5,
  },
  experienceContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  stepTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 24,
  },
  stepInstruction: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 28,
  },
  controlsSection: {
    alignItems: 'center',
    zIndex: 10,
  },
  timerDisplayWrap: {
    marginBottom: 40,
  },
  timerDisplay: {
    fontFamily: 'Inter_300Light',
    fontSize: 56,
    letterSpacing: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  minimalBtn: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalPlayBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  swipeHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 24,
    opacity: 0.5,
  },
  audioTimelineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 32,
    gap: 12,
  },
  timelineTime: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    width: 32,
    textAlign: 'center',
  },
  timelineTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    justifyContent: 'center',
  },
  timelineFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    left: 0,
  },
  timelineKnob: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },

  // Stats bar
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statNum: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  journalBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  journalBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // Journal prompt on completion
  journalPrompt: { width: '80%', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, marginTop: 16 },
  journalInput: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, minHeight: 60, textAlignVertical: 'top' },
  journalSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  journalSaveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22 },

  // Journal entries
  journalEntry: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  journalDot: { width: 8, height: 8, borderRadius: 4 },
  journalCategory: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'capitalize' },
  journalContent: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  journalDate: { fontFamily: 'Inter_400Regular', fontSize: 11 },
});
