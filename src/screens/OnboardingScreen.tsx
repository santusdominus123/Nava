import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';

const { width, height } = Dimensions.get('window');

// --- Slide Data ---

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  gradientColors: [string, string];
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'book',
    title: 'Welcome to\nBible Guide AI',
    subtitle: 'Your personal companion for daily scripture, prayer, and spiritual growth',
    gradientColors: ['#1C3D5A', '#2A5478'],
  },
  {
    id: '2',
    icon: 'sparkles',
    title: 'AI-Powered\nGuidance',
    subtitle: 'Ask any question about the Bible and receive thoughtful, scripture-based answers',
    gradientColors: ['#3D2C6B', '#5A3F9E'],
  },
  {
    id: '3',
    icon: 'sunny',
    title: 'Build Spiritual\nHabits',
    subtitle: 'Daily devotionals, guided prayers, and reading plans to deepen your faith',
    gradientColors: ['#6B4F1D', '#8B6A2F'],
  },
  {
    id: '4',
    icon: 'people',
    title: 'Grow Together',
    subtitle: 'Share prayer requests, join prayer groups, and encourage one another',
    gradientColors: ['#1D4B3A', '#2D6B52'],
  },
];

// --- Interest Data ---

interface Interest {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const interests: Interest[] = [
  { id: 'prayer', label: 'Prayer', icon: 'hand-left', color: '#8B5CF6' },
  { id: 'bible_study', label: 'Bible Study', icon: 'book', color: '#5A8DEE' },
  { id: 'devotionals', label: 'Devotionals', icon: 'sunny', color: '#C9A227' },
  { id: 'community', label: 'Community', icon: 'people', color: '#4CAF50' },
  { id: 'meditation', label: 'Meditation', icon: 'leaf', color: '#1C3D5A' },
];

// --- Hour Options ---

const hourOptions = [
  { label: '6 AM', value: 6 },
  { label: '7 AM', value: 7 },
  { label: '8 AM', value: 8 },
  { label: '9 AM', value: 9 },
  { label: '10 AM', value: 10 },
];

const periodOptions = [
  { label: 'Morning', value: 'morning' },
  { label: 'Evening', value: 'evening' },
];

// --- Component ---

export default function OnboardingScreen() {
  const { theme, completeOnboarding, setUserName, session } = useApp();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [step, setStep] = useState<'slides' | 'interests' | 'personalize'>('slides');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedPeriod, setSelectedPeriod] = useState('morning');

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUpAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Pre-fill name from session
  useEffect(() => {
    if (session?.user?.user_metadata?.full_name) {
      setName(session.user.user_metadata.full_name);
    }
  }, [session]);

  // --- Transitions ---

  const transitionToStep = (nextStep: 'slides' | 'interests' | 'personalize') => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      slideUpAnim.setValue(0);
      contentScale.setValue(0.95);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // --- Handlers ---

  const handleSlideNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlideIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentSlideIndex + 1, animated: true });
    } else {
      transitionToStep('interests');
    }
  };

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleInterestsContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Save interests to Supabase
    if (session?.user && selectedInterests.length > 0) {
      const rows = selectedInterests.map((interest) => ({
        user_id: session.user.id,
        interest,
      }));
      supabase.from('user_interests').upsert(rows).then(() => {});
    }
    transitionToStep('personalize');
  };

  const handleGetStarted = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const trimmedName = name.trim();
    if (trimmedName) {
      setUserName(trimmedName);
    }

    // Calculate actual reminder hour based on period
    const reminderHour = selectedPeriod === 'evening' ? selectedHour + 12 : selectedHour;

    // Save reminder_hour to profiles
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ reminder_hour: reminderHour })
        .eq('id', session.user.id);
    }

    completeOnboarding();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // --- Progress Dots ---

  const totalSteps = slides.length + 2;
  const currentProgress =
    step === 'slides'
      ? currentSlideIndex
      : step === 'interests'
      ? slides.length
      : slides.length + 1;

  const renderProgressDots = () => (
    <View style={[styles.progressContainer, { paddingTop: insets.top + 16 }]}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isActive = i === currentProgress;
        const isPast = i < currentProgress;
        return (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: isActive
                  ? theme.primary
                  : isPast
                  ? theme.primary + '80'
                  : theme.text.light + '30',
                width: isActive ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );

  // --- Slide Renderer ---

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, -40],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slideContainer}>
        <LinearGradient
          colors={[item.gradientColors[0] + '15', item.gradientColors[1] + '08']}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.gradientColors[0] + '18' },
            ]}
          >
            <View
              style={[
                styles.iconInner,
                { backgroundColor: item.gradientColors[0] + '25' },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={64}
                color={item.gradientColors[1]}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.slideTitle, { color: theme.text.primary }]}>
            {item.title}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.slideSubtitle, { color: theme.text.secondary }]}>
            {item.subtitle}
          </Text>
        </Animated.View>
      </View>
    );
  };

  // --- Interest Picker ---

  const renderInterestPicker = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideUpAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
            { scale: contentScale },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.background, theme.card + '40']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.stepScrollContent,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.stepTitle, { color: theme.text.primary }]}>
          What interests{'\n'}you most?
        </Text>
        <Text style={[styles.stepSubtitle, { color: theme.text.secondary }]}>
          Select the areas you'd like to explore
        </Text>

        <View style={styles.interestGrid}>
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestCard,
                  {
                    backgroundColor: isSelected
                      ? interest.color + '20'
                      : theme.card,
                    borderColor: isSelected
                      ? interest.color
                      : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => toggleInterest(interest.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.interestIconWrap,
                    {
                      backgroundColor: isSelected
                        ? interest.color + '30'
                        : interest.color + '15',
                    },
                  ]}
                >
                  <Ionicons
                    name={interest.icon}
                    size={28}
                    color={interest.color}
                  />
                </View>
                <Text
                  style={[
                    styles.interestLabel,
                    {
                      color: isSelected
                        ? interest.color
                        : theme.text.primary,
                      fontFamily: isSelected
                        ? 'Inter_600SemiBold'
                        : 'Inter_500Medium',
                    },
                  ]}
                >
                  {interest.label}
                </Text>
                {isSelected && (
                  <View
                    style={[
                      styles.interestCheck,
                      { backgroundColor: interest.color },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          onPress={handleInterestsContinue}
          activeOpacity={0.8}
          disabled={selectedInterests.length === 0}
        >
          <LinearGradient
            colors={
              selectedInterests.length > 0
                ? (theme.gradient?.primary as any) || ['#C9A227', '#E8C547']
                : [theme.text.light + '40', theme.text.light + '20']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // --- Personalize Step ---

  const renderPersonalizeStep = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideUpAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
            { scale: contentScale },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.background, theme.card + '40']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.stepScrollContent,
            { paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.stepTitle, { color: theme.text.primary }]}>
            Let's personalize
          </Text>
          <Text style={[styles.stepSubtitle, { color: theme.text.secondary }]}>
            Set up your name and daily reminder
          </Text>

          {/* Name Input */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
              Your Name
            </Text>
            <View
              style={[
                styles.nameInputWrap,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.text.light}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={[styles.nameInput, { color: theme.text.primary }]}
                placeholder="Enter your name"
                placeholderTextColor={theme.text.light}
                value={name}
                onChangeText={setName}
                selectionColor={theme.primary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Reminder Time */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
              Daily Reminder
            </Text>
            <Text
              style={[styles.sectionHint, { color: theme.text.light }]}
            >
              When would you like to be reminded?
            </Text>

            {/* Period Buttons */}
            <View style={styles.periodRow}>
              {periodOptions.map((period) => {
                const isActive = selectedPeriod === period.value;
                return (
                  <TouchableOpacity
                    key={period.value}
                    style={[
                      styles.periodButton,
                      {
                        backgroundColor: isActive
                          ? theme.primary + '20'
                          : theme.card,
                        borderColor: isActive ? theme.primary : theme.border,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedPeriod(period.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        period.value === 'morning' ? 'sunny-outline' : 'moon-outline'
                      }
                      size={18}
                      color={isActive ? theme.primary : theme.text.secondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.periodButtonText,
                        {
                          color: isActive ? theme.primary : theme.text.primary,
                          fontFamily: isActive
                            ? 'Inter_600SemiBold'
                            : 'Inter_500Medium',
                        },
                      ]}
                    >
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hour Buttons */}
            <View style={styles.hourRow}>
              {hourOptions.map((hour) => {
                const isActive = selectedHour === hour.value;
                return (
                  <TouchableOpacity
                    key={hour.value}
                    style={[
                      styles.hourButton,
                      {
                        backgroundColor: isActive
                          ? theme.primary
                          : theme.card,
                        borderColor: isActive ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedHour(hour.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.hourButtonText,
                        {
                          color: isActive ? '#FFFFFF' : theme.text.primary,
                          fontFamily: isActive
                            ? 'Inter_700Bold'
                            : 'Inter_500Medium',
                        },
                      ]}
                    >
                      {hour.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Get Started Button */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.8}>
          <LinearGradient
            colors={(theme.gradient?.primary as any) || ['#C9A227', '#E8C547']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Get Started</Text>
            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // --- Main Render ---

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Progress Dots */}
      {renderProgressDots()}

      {step === 'slides' && (
        <Animated.View style={[styles.slidesWrapper, { opacity: fadeAnim }]}>
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />

          {/* Slide Footer */}
          <View style={[styles.slideFooter, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity onPress={handleSlideNext} activeOpacity={0.8}>
              <LinearGradient
                colors={(theme.gradient?.primary as any) || ['#C9A227', '#E8C547']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>
                  {currentSlideIndex === slides.length - 1 ? 'Continue' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            {currentSlideIndex < slides.length - 1 && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  Haptics.selectionAsync();
                  transitionToStep('interests');
                }}
                activeOpacity={0.6}
              >
                <Text style={[styles.skipText, { color: theme.text.light }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {step === 'interests' && renderInterestPicker()}
      {step === 'personalize' && renderPersonalizeStep()}
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  slidesWrapper: {
    flex: 1,
  },
  slideContainer: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  slideSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  slideFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 32,
    width: width - 64,
    shadowColor: '#1C3D5A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
    marginRight: 8,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },

  // --- Step Screens ---
  stepContainer: {
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: 28,
    paddingBottom: 140,
  },
  stepTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 12,
  },
  stepSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },

  // --- Interest Grid ---
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  interestCard: {
    width: (width - 56 - 14) / 2,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  interestIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestLabel: {
    fontSize: 15,
  },
  interestCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Personalize ---
  sectionBlock: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  nameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  nameInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  periodButtonText: {
    fontSize: 15,
  },
  hourRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  hourButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: (width - 56 - 40) / 5,
    alignItems: 'center',
  },
  hourButtonText: {
    fontSize: 14,
  },

  // --- Bottom Action ---
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingTop: 12,
  },
});
