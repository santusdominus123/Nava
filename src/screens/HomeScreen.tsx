import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useApp } from '../context/AppContext';
import { getTodayDevotional } from '../data/devotionals';

const { width, height } = Dimensions.get('window');

// Masterpiece Portfolio UI: Deep Parallax, Sticky Headers, 3D Cards, Glass Overlays
export default function HomeScreen({ navigation }: any) {
  const { theme, userName, savedVerses, chatHistory, darkMode, weeklyStreaks, currentStreak, premiumStatus } = useApp();
  const devotional = getTodayDevotional();
  const today = new Date();
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Advanced Scroll Animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // Staggered Entrance Animations for different sections
  const introAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(introAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(cardsAnim, {
        toValue: 1,
        tension: 10,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Floating AI Bubble
  const [showAIPopup, setShowAIPopup] = useState(false);
  const aiBubbleScale = useRef(new Animated.Value(0)).current;
  const aiPopupOpacity = useRef(new Animated.Value(0)).current;

  const aiGreetings = [
    { title: "Hi! I'm your AI Guide ✨", text: "Tap me to ask any question about the Bible, faith, or prayer." },
    { title: "God loves you! ❤️", text: "Need encouragement today? I'm here to share His word with you." },
    { title: "Feeling lost? 🌟", text: "Let's explore Scripture together. I'll help you find the right verse." },
    { title: "Peace be with you ☘️", text: "Ask me anything — from Bible trivia to deep theological questions!" },
    { title: "You're not alone 🙏", text: "I can guide you through prayer, devotionals, and Scripture study." },
    { title: "Welcome back! ☀️", text: "Ready for today's spiritual journey? Let's dive into God's word." },
    { title: "Be still and know 🕊️", text: "I'm here whenever you need wisdom, comfort, or just a chat." },
  ];
  const [currentGreeting, setCurrentGreeting] = useState(() => aiGreetings[Math.floor(Math.random() * aiGreetings.length)]);

  useEffect(() => {
    const showPopup = () => {
      setCurrentGreeting(aiGreetings[Math.floor(Math.random() * aiGreetings.length)]);
      Animated.spring(aiBubbleScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }).start(() => {
        setShowAIPopup(true);
        Animated.timing(aiPopupOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            Animated.timing(aiPopupOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowAIPopup(false));
          }, 4000);
        });
      });
    };

    // First appearance after 1.5s
    const firstTimer = setTimeout(showPopup, 1500);
    // Then repeat every 20s
    const interval = setInterval(showPopup, 20000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, []);

  // Parallax Header scaling (Slows down and zooms as you scroll down)
  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [0, 0, 40], // Creates a parallax lag effect
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Floating Nav Bar Background
  const navBgOpacity = scrollY.interpolate({
    inputRange: [50, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Animated Components
  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  function getGreeting() {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Dynamic Sticky Blur Nav Bar */}
      <AnimatedBlurView
        intensity={80}
        tint="dark"
        style={[
          styles.stickyNav,
          { opacity: navBgOpacity },
        ]}
      >
        <Text style={[styles.navTitle, { color: '#FFF' }]}>{userName}</Text>
      </AnimatedBlurView>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Cinematic Header Section */}
        <Animated.View
          style={[
            styles.headerWrapper,
            {
              opacity: introAnim,
              transform: [
                { translateY: headerTranslateY },
                {
                  scale: introAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View style={{ opacity: headerOpacity }}>
            {/* Top Row: Date + Settings */}
            <View style={styles.headerTopRow}>
              <View style={styles.badgeWrapper}>
                <View style={[styles.pulseDot, { backgroundColor: theme.secondary }]} />
                <Text style={styles.dateBadgeText}>{formattedDate}</Text>
              </View>
              <TouchableOpacity
                style={styles.proUpgradeBtn}
                onPress={() => navigation.navigate('Premium')}
                activeOpacity={0.8}
              >
                <View style={[styles.proUpgradeIcon, { backgroundColor: 'rgba(201, 162, 39, 0.2)' }]}>
                  <Ionicons name="star" size={14} color="#C9A227" />
                </View>
                <Text style={styles.proUpgradeText}>Upgrade to PRO</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.greetingTitle, { color: theme.text.primary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.nameTitle, { color: theme.text.primary }]}>
              {userName}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Premium Stats Cards */}
        <Animated.View
          style={[
            styles.ribbonContainer,
            {
              opacity: introAnim,
              transform: [
                {
                  translateY: introAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statsCardsRow}>
            {/* Saved Verses Card - Glass */}
            <TouchableOpacity
              style={[styles.miniStatCard, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile')}
            >
              <BlurView intensity={theme.background === '#0D1117' ? 40 : 60} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.miniStatGlass, { backgroundColor: 'transparent' }]}>
                <View style={[styles.miniStatIcon, { backgroundColor: 'rgba(201, 162, 39, 0.15)' }]}>
                  <Ionicons name="bookmark" size={18} color="#C9A227" />
                </View>
                <Text style={[styles.miniStatNumber, { color: theme.text.primary }]}>{savedVerses.length}</Text>
                <Text style={[styles.miniStatLabel, { color: theme.text.light }]}>Saved Verses</Text>
              </BlurView>
              <View style={styles.miniStatAccent} />
              <View style={[styles.glassShine, { top: -20, left: -20 }]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniStatCard, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Chat')}
            >
              <BlurView intensity={theme.background === '#0D1117' ? 40 : 60} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.miniStatGlass, { backgroundColor: 'transparent' }]}>
                <View style={[styles.miniStatIcon, { backgroundColor: 'rgba(90, 141, 238, 0.15)' }]}>
                  <Ionicons name="chatbubbles" size={18} color="#5A8DEE" />
                </View>
                <Text style={[styles.miniStatNumber, { color: theme.text.primary }]}>{chatHistory.length}</Text>
                <Text style={[styles.miniStatLabel, { color: theme.text.light }]}>AI Chats</Text>
              </BlurView>
              <View style={[styles.miniStatAccent, { backgroundColor: '#5A8DEE' }]} />
              <View style={[styles.glassShine, { top: -15, right: -15 }]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileCard, darkMode && { backgroundColor: theme.primary + '15', borderColor: theme.border }]}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <BlurView intensity={40} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={styles.profileCardGlass}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileInitial}>{(userName || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.profileCardName}>{userName || 'You'}</Text>
                <View style={styles.profileOnlineBadge}>
                  <View style={styles.profileOnlineDot} />
                  <Text style={styles.profileOnlineText}>Active</Text>
                </View>
              </BlurView>
              <View style={[styles.glassShine, { bottom: -10, right: -10, backgroundColor: 'rgba(90, 141, 238, 0.15)' }]} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Magazine Style Verse Typography (Staggered scale in) */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: cardsAnim,
              transform: [
                {
                  translateY: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Moment of Reflection
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Devotional')}>
            {/* Creates a pseudo-3D stacked card effect */}
            <View style={[styles.cardStackBack, darkMode && { backgroundColor: theme.primary + '20' }]} />
            <View style={[styles.cardStackMiddle, darkMode && { backgroundColor: theme.primary + '50' }]} />

            <View style={[styles.heroCardBase, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <BlurView intensity={theme.background === '#0D1117' ? 40 : 80} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.heroCardGlass, { backgroundColor: 'transparent' }]}>
                <View style={styles.heroOverlay}>
                  <MaterialCommunityIcons name="format-quote-close" size={32} color={theme.secondary} style={styles.heroIcon} />
                  <Text style={styles.heroVerseText}>
                    "{devotional.verse.text}"
                  </Text>

                  <View style={[styles.heroFooter, darkMode && { borderTopColor: theme.border }]}>
                    <Text style={styles.heroReference}>{devotional.verse.reference}</Text>
                    <TouchableOpacity
                      style={[styles.readBtn, darkMode && { backgroundColor: theme.text.primary }]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.readBtnText, darkMode && { color: theme.background }]}>Reflect</Text>
                      <Ionicons name="arrow-forward" size={14} color={darkMode ? theme.background : "#1C3D5A"} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.glassShine, { top: -20, left: -20, width: 100, height: 100, borderRadius: 50, opacity: 0.5 }]} />
              </BlurView>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Spiritual Rhythm Dashboard */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: cardsAnim,
              transform: [
                {
                  translateY: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Spiritual Rhythm
            </Text>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={12} color="#FF5252" />
              <Text style={styles.streakText}>{currentStreak} Day Streak</Text>
            </View>
          </View>

          <View style={[styles.chartWrapperBase, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
            <BlurView intensity={theme.background === '#0D1117' ? 40 : 80} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.chartWrapperGlass, { backgroundColor: 'transparent' }]}>
              {/* Activity Summary Row */}
              <View style={styles.activitySummary}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: '#C9A227' }]} />
                  <Text style={[styles.activityLabel, { color: theme.text.light }]}>Prayer</Text>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: '#5A8DEE' }]} />
                  <Text style={[styles.activityLabel, { color: theme.text.light }]}>Reading</Text>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: '#7C4DFF' }]} />
                  <Text style={[styles.activityLabel, { color: theme.text.light }]}>Chat</Text>
                </View>
              </View>

              {/* Chart Bars */}
              <View style={styles.chartBars}>
                {dayNames.map((day, index) => {
                  const isToday = index === today.getDay();
                  const isPast = index < today.getDay();

                  // Use real streak data
                  const dayDate = new Date(today);
                  dayDate.setDate(today.getDate() - (today.getDay() - index));
                  const dateStr = dayDate.toISOString().split('T')[0];
                  const dayStreaks = weeklyStreaks.filter(s => s.date === dateStr);
                  const hasPrayer = dayStreaks.some(s => s.activity_type === 'prayer');
                  const hasReading = dayStreaks.some(s => s.activity_type === 'devotional' || s.activity_type === 'reading_plan');
                  const hasChat = dayStreaks.some(s => s.activity_type === 'chat');

                  const prayerH = hasPrayer ? 70 : (isPast ? 5 : 3);
                  const readH = hasReading ? 50 : (isPast ? 3 : 2);
                  const chatH = hasChat ? 35 : (isPast ? 2 : 1);

                  return (
                    <View key={index} style={styles.chartCol}>
                      {isToday && (
                        <Text style={styles.todayLabel}>Today</Text>
                      )}
                      <View style={[styles.barContainer, isToday && styles.barContainerToday]}>
                        <View style={[styles.barSegment, { height: chatH, backgroundColor: '#7C4DFF', borderTopLeftRadius: 4, borderTopRightRadius: 4 }]} />
                        <View style={[styles.barSegment, { height: readH, backgroundColor: '#5A8DEE' }]} />
                        <View style={[styles.barSegment, { height: prayerH, backgroundColor: '#C9A227', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }]} />
                      </View>
                      <Text style={[
                        styles.chartDay,
                        { color: isToday ? theme.text.primary : theme.text.light },
                        isToday && { fontFamily: 'Inter_700Bold' }
                      ]}>
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Stats Footer */}
              <View style={styles.statsFooter}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: theme.text.primary }]}>{savedVerses.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.text.light }]}>Verses Saved</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: theme.text.primary }]}>{chatHistory.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.text.light }]}>Conversations</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: theme.text.primary }]}>{currentStreak}</Text>
                  <Text style={[styles.statLabel, { color: theme.text.light }]}>Day Streak</Text>
                </View>
              </View>
              <View style={[styles.glassShine, { top: -20, right: -20, width: 120, height: 120, borderRadius: 60, opacity: 0.3 }]} />
            </BlurView>
          </View>
        </Animated.View>

        {/* Enhanced Bento Explorer */}
        <Animated.View
          style={[
            styles.section,
            { marginBottom: 100 },
            {
              opacity: cardsAnim,
              transform: [
                {
                  translateY: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text.primary, marginBottom: 16 }]}>
            Tools & Resources
          </Text>

          <View style={styles.bentoGrid}>
            <TouchableOpacity
              style={[styles.bentoBlockBase, styles.bentoAIBase, { width: '100%' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Chat')}
            >
              <BlurView intensity={70} tint="dark" style={styles.bentoAIGlass}>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1544832405-b0dff17e179d?q=80&w=600&auto=format&fit=crop' }}
                  style={StyleSheet.absoluteFillObject}
                  imageStyle={{ opacity: 0.15 }}
                />
                <View style={styles.bentoGlow} />
                <View style={styles.bentoBadge}>
                  <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                  <Text style={styles.bentoBadgeText}>AI Powered</Text>
                </View>
                <Ionicons name="planet" size={36} color="#FFFFFF" style={{ marginBottom: 12 }} />
                <Text style={styles.bentoAITitle}>Bible AI Chat</Text>
                <Text style={styles.bentoAISub}>Ask deeply, learn infinitely. Explore Scripture with intelligent guidance.</Text>
                <View style={[styles.glassShine, { top: -20, left: -20, width: 150, height: 150, borderRadius: 75, opacity: 0.15 }]} />
              </BlurView>
            </TouchableOpacity>

            <View style={styles.bentoRow}>
              <TouchableOpacity
                style={[styles.bentoBlockBase, styles.bentoSmallBase]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Prayer')}
              >
                <View style={[styles.bentoBlockBase, styles.bentoSmallBase, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <BlurView intensity={theme.background === '#0D1117' ? 40 : 80} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.bentoSmallGlass, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.bentoIconWrap, { borderColor: `${theme.accent}30`, backgroundColor: `${theme.accent}08`, borderWidth: 1 }, darkMode && { backgroundColor: theme.primary + '20' }]}>
                      <Ionicons name="water-outline" size={24} color={theme.accent} />
                    </View>
                    <View>
                      <Text style={[styles.bentoTitle, { color: theme.text.primary }]}>Guided Prayer</Text>
                      <Text style={[styles.bentoSub, { color: theme.text.light }]}>Daily prayers & meditations</Text>
                    </View>
                    <View style={[styles.glassShine, { top: -30, right: -30, width: 80, height: 80, borderRadius: 40, opacity: 0.4 }]} />
                  </BlurView>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bentoBlockBase, styles.bentoSmallBase]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Search')}
              >
                <View style={[styles.bentoBlockBase, styles.bentoSmallBase, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <BlurView intensity={theme.background === '#0D1117' ? 40 : 80} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.bentoSmallGlass, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.bentoIconWrap, { borderColor: `${theme.secondary}30`, backgroundColor: `${theme.secondary}08`, borderWidth: 1 }, darkMode && { backgroundColor: theme.secondary + '20' }]}>
                      <Ionicons name="search" size={24} color={theme.secondary} />
                    </View>
                    <View>
                      <Text style={[styles.bentoTitle, { color: theme.text.primary }]}>Search</Text>
                      <Text style={[styles.bentoSub, { color: theme.text.light }]}>Find any verse or topic</Text>
                    </View>
                    <View style={[styles.glassShine, { bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, opacity: 0.4 }]} />
                  </BlurView>
                </View>
              </TouchableOpacity>
            </View>

            {/* Devotional quick card */}
            <TouchableOpacity
              style={[styles.bentoBlockBase, styles.bentoWideBase]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Devotional')}
            >
              <View style={[styles.bentoBlockBase, styles.bentoWideBase, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
                <BlurView intensity={theme.background === '#0D1117' ? 40 : 80} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.bentoWideGlass, { backgroundColor: 'transparent' }]}>
                  <View style={styles.bentoWideContent}>
                    <View style={[styles.bentoIconRing, { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                      <Ionicons name="book-outline" size={24} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={[styles.bentoTitle, { color: '#FFFFFF' }]}>Today's Devotional</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                        Read today's reflection & verse of the day
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.5)" />
                  </View>
                  <View style={[styles.glassShine, { top: -50, right: 30, width: 100, height: 100, borderRadius: 50, opacity: 0.2 }]} />
                </BlurView>
              </View>
            </TouchableOpacity>

            {/* Reading Plans & Notes Row */}
            <View style={styles.bentoRow}>
              <TouchableOpacity
                style={[styles.bentoBlockBase, styles.bentoSmallBase]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ReadingPlan')}
              >
                <View style={[styles.bentoBlockBase, styles.bentoSmallBase, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <BlurView intensity={theme.background === '#0D1117' ? 40 : 80} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.bentoSmallGlass, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.bentoIconWrap, { borderColor: '#8B5CF630', backgroundColor: '#8B5CF608', borderWidth: 1 }, darkMode && { backgroundColor: '#8B5CF620' }]}>
                      <Ionicons name="map-outline" size={24} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text style={[styles.bentoTitle, { color: theme.text.primary }]}>Reading Plans</Text>
                      <Text style={[styles.bentoSub, { color: theme.text.light }]}>Multi-day Bible journeys</Text>
                    </View>
                    <View style={[styles.glassShine, { top: -30, right: -30, width: 80, height: 80, borderRadius: 40, opacity: 0.4 }]} />
                  </BlurView>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bentoBlockBase, styles.bentoSmallBase]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('VerseNotes')}
              >
                <View style={[styles.bentoBlockBase, styles.bentoSmallBase, darkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <BlurView intensity={theme.background === '#0D1117' ? 40 : 80} tint={theme.background === '#0D1117' ? 'dark' : 'light'} style={[styles.bentoSmallGlass, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.bentoIconWrap, { borderColor: '#4CAF5030', backgroundColor: '#4CAF5008', borderWidth: 1 }, darkMode && { backgroundColor: '#4CAF5020' }]}>
                      <Ionicons name="create-outline" size={24} color="#4CAF50" />
                    </View>
                    <View>
                      <Text style={[styles.bentoTitle, { color: theme.text.primary }]}>My Notes</Text>
                      <Text style={[styles.bentoSub, { color: theme.text.light }]}>Verse highlights & notes</Text>
                    </View>
                    <View style={[styles.glassShine, { bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, opacity: 0.4 }]} />
                  </BlurView>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

      </Animated.ScrollView>

      {/* Floating AI Assistant Bubble + Greeting Popup */}
      {showAIPopup && (
        <Animated.View style={[styles.aiPopupBubble, { opacity: aiPopupOpacity }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setShowAIPopup(false);
              navigation.navigate('Chat');
            }}
          >
            <View style={styles.aiPopupContent}>
              <Text style={styles.aiPopupTitle}>{currentGreeting.title}</Text>
              <Text style={styles.aiPopupText}>{currentGreeting.text}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.aiPopupArrow} />
        </Animated.View>
      )}

      <Animated.View style={[styles.aiFAB, { transform: [{ scale: aiBubbleScale }] }]}>
        <TouchableOpacity
          style={styles.aiFABInner}
          activeOpacity={0.85}
          onPress={() => {
            if (showAIPopup) {
              setShowAIPopup(false);
            }
            navigation.navigate('Chat');
          }}
        >
          <MaterialCommunityIcons name="cross" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 24 },

  // Sticky Floating Nav
  stickyNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  navTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Cinematic Header
  headerWrapper: {
    marginBottom: 32,
    zIndex: 1,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 168, 180, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dateBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 1,
    color: '#6B7B8D',
    textTransform: 'uppercase',
  },
  greetingTitle: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    fontSize: 36,
    letterSpacing: -0.5,
    marginBottom: -4,
  },
  nameTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 48,
    letterSpacing: -1,
    lineHeight: 52,
  },

  // Header Top Row
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  proUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.3)',
    gap: 6,
  },
  proUpgradeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proUpgradeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#C9A227',
    letterSpacing: 0.5,
  },

  // Premium Stats Cards
  ribbonContainer: {
    marginBottom: 48,
  },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
  },
  miniStatGlass: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  miniStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniStatNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginBottom: 2,
  },
  miniStatLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniStatAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#C9A227',
  },
  glassShine: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1C3D5A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    backgroundColor: 'rgba(28, 61, 90, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  profileCardGlass: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 61, 90, 0.3)',
  },
  profileAvatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInitial: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  profileCardName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  profileOnlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  profileOnlineText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    marginBottom: 56,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Pseudo-3D Stacked Card
  cardStackBack: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    height: '100%',
    backgroundColor: 'rgba(28, 61, 90, 0.2)',
    borderRadius: 32,
    transform: [{ scale: 0.9 }],
  },
  cardStackMiddle: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: '100%',
    backgroundColor: 'rgba(28, 61, 90, 0.5)',
    borderRadius: 32,
    transform: [{ scale: 0.95 }],
  },
  heroCardBase: {
    borderRadius: 32,
    minHeight: 280,
    shadowColor: '#1C3D5A',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 61, 90, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroCardGlass: {
    flex: 1,
    backgroundColor: 'rgba(28, 61, 90, 0.3)',
  },
  heroOverlay: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  heroIcon: {
    marginBottom: 24,
  },
  heroVerseText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 28,
    lineHeight: 40,
    color: '#FFFFFF',
    marginBottom: 32,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 20,
  },
  heroReference: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 1,
    color: '#C9A227',
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  readBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#1C3D5A',
    textTransform: 'uppercase',
  },

  // Chart - Enhanced
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#FF5252',
  },
  chartWrapperBase: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  chartWrapperGlass: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  activitySummary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 16,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  todayLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: '#C9A227',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  barContainer: {
    height: 100,
    width: 14,
    backgroundColor: 'rgba(156, 168, 180, 0.08)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    marginBottom: 8,
    overflow: 'hidden',
  },
  barContainerToday: {
    width: 18,
    backgroundColor: 'rgba(201, 162, 39, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.15)',
  },
  barSegment: {
    width: '100%',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  chartDay: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 168, 180, 0.12)',
    paddingTop: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 28,
    opacity: 0.3,
  },

  // Bento Explorer - Enhanced
  bentoGrid: {
    gap: 16,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  bentoBlockBase: {
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  bentoAIBase: {
    height: 200,
  },
  bentoAIGlass: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 45, 66, 0.6)',
  },
  bentoGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#5A8DEE',
    opacity: 0.3,
    filter: [{ blur: 40 }] as any,
  },
  bentoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(90, 141, 238, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
    zIndex: 1,
  },
  bentoBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bentoAITitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 6,
    zIndex: 1,
  },
  bentoAISub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    zIndex: 1,
  },
  bentoSmallBase: {
    flex: 1,
    height: 170,
  },
  bentoSmallGlass: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bentoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(90, 141, 238, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bentoIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginTop: 'auto',
  },
  bentoSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  bentoWideBase: {
    width: '100%',
    backgroundColor: 'rgba(28, 61, 90, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bentoWideGlass: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(28, 61, 90, 0.3)',
  },
  bentoWideContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Floating AI Assistant
  aiFAB: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 200,
  },
  aiFABInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5A8DEE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5A8DEE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  aiPopupBubble: {
    position: 'absolute',
    bottom: 94,
    right: 20,
    zIndex: 201,
    maxWidth: 260,
  },
  aiPopupContent: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  aiPopupArrow: {
    alignSelf: 'flex-end',
    marginRight: 24,
    marginTop: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  aiPopupTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#1C3D5A',
    marginBottom: 6,
  },
  aiPopupText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7B8D',
    lineHeight: 18,
  },
});
