import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface VerseCardProps {
  reference: string;
  text: string;
  gradientColors?: readonly string[];
  compact?: boolean;
}

export default function VerseCard({ reference, text, gradientColors = ['#1C3D5A', '#2A5A7A', '#3A7A9A'], compact = false }: VerseCardProps) {
  return (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={styles.watermark}>
        <Text style={styles.watermarkQuote}>"</Text>
      </View>
      <Text style={[styles.reference, compact && styles.referenceCompact]}>{reference}</Text>
      <View style={styles.divider} />
      <Text style={[styles.verseText, compact && styles.verseTextCompact]}>{text}</Text>
      <Text style={styles.branding}>Bible Guide AI</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardCompact: {
    padding: 20,
    borderRadius: 18,
  },
  watermark: {
    position: 'absolute',
    top: 10,
    left: 20,
  },
  watermarkQuote: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 100,
    color: 'rgba(255,255,255,0.06)',
  },
  reference: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 16,
  },
  referenceCompact: {
    fontSize: 12,
    marginBottom: 10,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 16,
    borderRadius: 1,
  },
  verseText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 32,
    fontStyle: 'italic',
  },
  verseTextCompact: {
    fontSize: 16,
    lineHeight: 26,
  },
  branding: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 20,
    letterSpacing: 2,
  },
});
