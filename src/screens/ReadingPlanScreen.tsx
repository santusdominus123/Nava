import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  cover_color: string;
  total_days: number;
  is_premium: boolean;
  created_at: string;
}

interface PlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  verse_reference: string;
  verse_text: string;
  reflection: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
}

export default function ReadingPlanScreen({ navigation }: any) {
  const { theme, session } = useApp();
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentDayContent, setCurrentDayContent] = useState<PlanDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      fetchPlanDays(selectedPlan.id);
      if (session?.user?.id) {
        fetchUserProgress(selectedPlan.id);
      }
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (planDays.length > 0 && userProgress) {
      const day = planDays.find((d) => d.day_number === userProgress.current_day);
      setCurrentDayContent(day || planDays[0]);
    } else if (planDays.length > 0) {
      setCurrentDayContent(planDays[0]);
    }
  }, [planDays, userProgress]);

  useEffect(() => {
    if (currentDayContent && session?.user?.id) {
      logStreak();
    }
  }, [currentDayContent]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reading_plans')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDays = async (planId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reading_plan_days')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number', { ascending: true });

      if (error) throw error;
      setPlanDays(data || []);
    } catch (err) {
      console.error('Error fetching plan days:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_reading_plans')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('plan_id', planId)
        .maybeSingle();

      if (error) throw error;
      setUserProgress(data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const startPlan = async (planId: string) => {
    if (!session?.user?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { data, error } = await supabase
        .from('user_reading_plans')
        .insert({
          user_id: session.user.id,
          plan_id: planId,
          current_day: 1,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setUserProgress(data);
    } catch (err) {
      console.error('Error starting plan:', err);
    }
  };

  const advanceDay = async (planId: string) => {
    if (!session?.user?.id || !userProgress) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const plan = selectedPlan || plans.find((p) => p.id === planId);
      const totalDays = plan?.total_days || planDays.length;
      const isLastDay = userProgress.current_day >= totalDays;

      const updateData: any = isLastDay
        ? { completed_at: new Date().toISOString() }
        : { current_day: userProgress.current_day + 1 };

      const { data, error } = await supabase
        .from('user_reading_plans')
        .update(updateData)
        .eq('id', userProgress.id)
        .select()
        .single();

      if (error) throw error;
      setUserProgress(data);

      if (isLastDay) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Error advancing day:', err);
    }
  };

  const goToPreviousDay = () => {
    if (!currentDayContent || currentDayContent.day_number <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevDay = planDays.find((d) => d.day_number === currentDayContent.day_number - 1);
    if (prevDay) setCurrentDayContent(prevDay);
  };

  const goToNextDay = async () => {
    if (!currentDayContent || !selectedPlan) return;
    const totalDays = selectedPlan.total_days || planDays.length;

    if (currentDayContent.day_number >= totalDays) {
      await advanceDay(selectedPlan.id);
      return;
    }

    if (userProgress && currentDayContent.day_number >= userProgress.current_day) {
      await advanceDay(selectedPlan.id);
    }

    const nextDay = planDays.find((d) => d.day_number === currentDayContent.day_number + 1);
    if (nextDay) setCurrentDayContent(nextDay);
  };

  const logStreak = async () => {
    if (!session?.user?.id) return;
    try {
      await supabase.from('user_streaks').upsert(
        {
          user_id: session.user.id,
          date: new Date().toISOString().split('T')[0],
          activity_type: 'reading_plan',
        },
        { onConflict: 'user_id,date,activity_type' }
      );
    } catch (err) {
      console.error('Error logging streak:', err);
    }
  };

  const handleBackFromReader = () => {
    setSelectedPlan(null);
    setPlanDays([]);
    setUserProgress(null);
    setCurrentDayContent(null);
    fetchPlans();
  };

  // ─── Plan Day Reader View ─────────────────────────────────────────────
  if (selectedPlan && currentDayContent) {
    const totalDays = selectedPlan.total_days || planDays.length;
    const isLastDay = currentDayContent.day_number >= totalDays;
    const isCompleted = !!userProgress?.completed_at;

    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.readerHeader}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleBackFromReader}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.readerHeaderCenter}>
            <Text
              style={[styles.readerPlanTitle, { color: theme.text.secondary }]}
              numberOfLines={1}
            >
              {selectedPlan.title}
            </Text>
            <Text style={[styles.readerDayIndicator, { color: theme.text.light }]}>
              Day {currentDayContent.day_number} of {totalDays}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Dots */}
        <View style={styles.progressDotsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.progressDotsScroll}>
            {planDays.map((day) => {
              const isCurrent = day.day_number === currentDayContent.day_number;
              const isRead = userProgress ? day.day_number <= userProgress.current_day : false;
              return (
                <TouchableOpacity
                  key={day.id}
                  onPress={() => {
                    if (isRead || day.day_number === 1) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentDayContent(day);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: isCurrent
                          ? theme.primary
                          : isRead
                          ? theme.secondary
                          : theme.border,
                      },
                      isCurrent && styles.progressDotActive,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.readerContent}
          contentContainerStyle={styles.readerContentInner}
          showsVerticalScrollIndicator={false}
        >
          {/* Day Title */}
          <Text style={[styles.dayTitle, { color: theme.text.primary }]}>
            {currentDayContent.title}
          </Text>

          {/* Verse Reference Pill */}
          <View style={styles.versePillContainer}>
            <LinearGradient
              colors={theme.gradient.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.versePill}
            >
              <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.versePillText}>{currentDayContent.verse_reference}</Text>
            </LinearGradient>
          </View>

          {/* Verse Text */}
          <View style={[styles.verseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.verseQuoteMark}>"</Text>
            <Text style={[styles.verseText, { color: theme.text.primary }]}>
              {currentDayContent.verse_text}
            </Text>
          </View>

          {/* Reflection */}
          <View style={[styles.reflectionSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.reflectionHeader}>
              <LinearGradient
                colors={['#C9A22725', '#C9A22710']}
                style={styles.reflectionIconWrap}
              >
                <Ionicons name="bulb-outline" size={18} color={theme.secondary} />
              </LinearGradient>
              <Text style={[styles.reflectionLabel, { color: theme.text.primary }]}>
                Reflection
              </Text>
            </View>
            <Text style={[styles.reflectionText, { color: theme.text.secondary }]}>
              {currentDayContent.reflection}
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View
          style={[
            styles.bottomNav,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + 12,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View style={styles.bottomNavInner}>
            {currentDayContent.day_number > 1 && (
              <TouchableOpacity
                style={[styles.navBtnSecondary, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={goToPreviousDay}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color={theme.text.secondary} />
                <Text style={[styles.navBtnSecondaryText, { color: theme.text.secondary }]}>
                  Previous
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.navBtnPrimary,
                currentDayContent.day_number <= 1 && { flex: 1 },
              ]}
              onPress={goToNextDay}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradient.primary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.navBtnPrimaryGradient}
              >
                <Text style={styles.navBtnPrimaryText}>
                  {isCompleted
                    ? 'Plan Completed'
                    : isLastDay
                    ? 'Complete Plan'
                    : 'Next Day'}
                </Text>
                {!isCompleted && (
                  <Ionicons
                    name={isLastDay ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Plan List View ───────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Reading Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text.light }]}>
            Loading plans...
          </Text>
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={56} color={theme.text.light} />
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
            No Reading Plans Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Check back soon for curated Bible reading plans.
          </Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              theme={theme}
              userProgress={null}
              session={session}
              onSelect={() => setSelectedPlan(item)}
              onStart={() => {
                setSelectedPlan(item);
                startPlan(item.id);
              }}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Plan Card Component ──────────────────────────────────────────────
function PlanCard({
  plan,
  theme,
  userProgress,
  session,
  onSelect,
  onStart,
}: {
  plan: ReadingPlan;
  theme: any;
  userProgress: UserProgress | null;
  session: any;
  onSelect: () => void;
  onStart: () => void;
}) {
  const [progress, setProgress] = useState<UserProgress | null>(userProgress);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadProgress();
    }
  }, [session]);

  const loadProgress = async () => {
    try {
      setLoadingProgress(true);
      const { data, error } = await supabase
        .from('user_reading_plans')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('plan_id', plan.id)
        .maybeSingle();

      if (!error) setProgress(data);
    } catch {
      // Silently fail
    } finally {
      setLoadingProgress(false);
    }
  };

  const hasStarted = !!progress && !progress.completed_at;
  const isCompleted = !!progress?.completed_at;
  const progressFraction = progress
    ? progress.current_day / (plan.total_days || 1)
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.primary,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (hasStarted || isCompleted) {
          onSelect();
        } else {
          onSelect();
        }
      }}
      activeOpacity={0.8}
    >
      {/* Color Accent Strip */}
      <View
        style={[
          styles.accentStrip,
          { backgroundColor: plan.cover_color || theme.primary },
        ]}
      />

      <View style={styles.planCardContent}>
        <View style={styles.planCardHeader}>
          <View style={styles.planCardTitleWrap}>
            <Text
              style={[styles.planCardTitle, { color: theme.text.primary }]}
              numberOfLines={2}
            >
              {plan.title}
            </Text>
            {plan.is_premium && (
              <View style={[styles.premiumBadge, { backgroundColor: theme.secondary + '20' }]}>
                <Ionicons name="lock-closed" size={12} color={theme.secondary} />
                <Text style={[styles.premiumLabel, { color: theme.secondary }]}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={[styles.planDuration, { color: theme.text.light }]}>
            {plan.total_days} days
          </Text>
        </View>

        <Text
          style={[styles.planCardDescription, { color: theme.text.secondary }]}
          numberOfLines={2}
        >
          {plan.description}
        </Text>

        {/* Progress or Start */}
        {loadingProgress ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 14 }} />
        ) : hasStarted ? (
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: theme.text.secondary }]}>
                Day {progress!.current_day} of {plan.total_days}
              </Text>
              <Text style={[styles.progressPercent, { color: theme.primary }]}>
                {Math.round(progressFraction * 100)}%
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${Math.min(progressFraction * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.continueBtn, { borderColor: theme.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.continueBtnText, { color: theme.primary }]}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
        ) : isCompleted ? (
          <View style={styles.completedSection}>
            <Ionicons name="checkmark-circle" size={18} color={theme.success || '#4CAF50'} />
            <Text style={[styles.completedText, { color: theme.success || '#4CAF50' }]}>
              Completed
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onStart();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.gradient.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtnGradient}
            >
              <Text style={styles.startBtnText}>Start Plan</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 12,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Plan List
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Plan Card
  planCard: {
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  accentStrip: {
    width: 5,
  },
  planCardContent: {
    flex: 1,
    padding: 20,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planCardTitleWrap: {
    flex: 1,
    marginRight: 12,
  },
  planCardTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
  },
  planDuration: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  premiumLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    marginLeft: 4,
  },
  planCardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  // Progress
  progressSection: {
    marginTop: 14,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  progressPercent: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  continueBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginRight: 6,
  },

  // Completed
  completedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  completedText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginLeft: 6,
  },

  // Start Button
  startBtn: {
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  startBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },

  // ─── Reader View ───────────────────────────────────────────────
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  readerHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  readerPlanTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  readerDayIndicator: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },

  // Progress Dots
  progressDotsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  progressDotsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    width: 24,
    borderRadius: 4,
  },

  // Reader Content
  readerContent: {
    flex: 1,
  },
  readerContentInner: {
    padding: 24,
  },
  dayTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 16,
  },

  // Verse Pill
  versePillContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  versePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  versePillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Verse Card
  verseCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    position: 'relative',
  },
  verseQuoteMark: {
    position: 'absolute',
    top: 4,
    left: 14,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 50,
    color: 'rgba(28, 61, 90, 0.06)',
  },
  verseText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 30,
  },

  // Reflection
  reflectionSection: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  reflectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reflectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginLeft: 10,
  },
  reflectionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 26,
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  bottomNavInner: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  navBtnSecondaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  navBtnPrimary: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1C3D5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navBtnPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  navBtnPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
