import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { typography } from '../theme/typography';
import { getTodayDevotional } from '../data/devotionals';
import { speakDevotional, stopSpeaking, isCurrentlySpeaking, pauseSpeaking, resumeSpeaking, isCurrentlyPaused } from '../services/audioService';
import { trackScreenView, trackEvent, AnalyticsEvents } from '../services/analytics';

export default function DevotionalScreen({ navigation }: any) {
  const { theme, saveVerse, isVerseSaved, logActivity } = useApp();
  const devotional = getTodayDevotional();
  const [saved, setSaved] = useState(isVerseSaved(devotional.verse.reference));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Log devotional activity on screen open
  React.useEffect(() => {
    logActivity('devotional');
    trackScreenView('Devotional');
    return () => { stopSpeaking(); };
  }, []);

  const handlePlayAudio = async () => {
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
      devotional.verse.reference,
      devotional.verse.text,
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
    if (!saved) {
      saveVerse(devotional.verse);
      setSaved(true);
      Alert.alert('Saved', 'Verse has been saved to your collection.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${devotional.verse.reference}\n\n"${devotional.verse.text}"\n\n${devotional.reflection}\n\n— Bible Guide AI`,
      });
    } catch {}
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Date Badge */}
      <View style={styles.dateBadgeWrap}>
        <View style={[styles.dateBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="calendar-outline" size={14} color={theme.secondary} />
          <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 6 }]}>
            Today's Devotional
          </Text>
        </View>
      </View>

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
          {devotional.verse.reference}
        </Text>
        <View style={styles.divider} />
        <View style={styles.quoteWrap}>
          <Text style={styles.bigQuote}>"</Text>
          <Text style={[typography.verse, { color: 'rgba(255,255,255,0.92)' }]}>
            {devotional.verse.text}
          </Text>
        </View>
      </LinearGradient>

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
          {devotional.reflection}
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
          {devotional.prayer}
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
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
