import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E8E2D9',
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts
export function CardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton width="100%" height={180} borderRadius={24} />
      <View style={skeletonStyles.cardContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="100%" height={12} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={skeletonStyles.listItem}>
      <Skeleton width={48} height={48} borderRadius={14} />
      <View style={skeletonStyles.listItemText}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function VerseSkeleton() {
  return (
    <View style={skeletonStyles.verse}>
      <Skeleton width={120} height={14} borderRadius={10} />
      <Skeleton width="100%" height={16} style={{ marginTop: 16 }} />
      <Skeleton width="90%" height={16} style={{ marginTop: 8 }} />
      <Skeleton width="70%" height={16} style={{ marginTop: 8 }} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.profile}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width={140} height={18} style={{ marginTop: 12 }} />
      <Skeleton width={100} height={14} style={{ marginTop: 6 }} />
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={skeletonStyles.home}>
      <View style={skeletonStyles.homeHeader}>
        <View>
          <Skeleton width={120} height={12} />
          <Skeleton width={200} height={28} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>
      <Skeleton width="100%" height={48} borderRadius={20} style={{ marginTop: 16 }} />
      <CardSkeleton />
      <View style={skeletonStyles.homeRow}>
        <Skeleton width="48%" height={170} borderRadius={24} />
        <Skeleton width="48%" height={170} borderRadius={24} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: { marginTop: 20 },
  cardContent: { padding: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  listItemText: { flex: 1 },
  verse: { padding: 28, backgroundColor: '#F0EDE8', borderRadius: 24, marginTop: 12 },
  profile: { alignItems: 'center', paddingVertical: 24 },
  home: { padding: 24, paddingTop: 60 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  homeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});
