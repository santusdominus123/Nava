import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isOffline, processSyncQueue, getSyncQueueSize } from '../services/offlineCache';
import { supabase } from '../utils/supabase';

interface NetworkState {
  isConnected: boolean;
  syncQueueSize: number;
}

const NetworkContext = createContext<NetworkState>({ isConnected: true, syncQueueSize: 0 });

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const check = async () => {
      const offline = await isOffline();
      const wasOffline = !isConnected;
      setIsConnected(!offline);

      // Came back online — process sync queue
      if (wasOffline && !offline) {
        setDismissed(false);
        const result = await processSyncQueue(supabase);
        if (result.processed > 0) {
          console.log(`Synced ${result.processed} queued actions`);
        }
      }

      const qSize = await getSyncQueueSize();
      setSyncQueueSize(qSize);
    };

    check();
    interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Animate banner
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: !isConnected && !dismissed ? 0 : -60,
      useNativeDriver: true,
    }).start();
  }, [isConnected, dismissed]);

  return (
    <NetworkContext.Provider value={{ isConnected, syncQueueSize }}>
      {children}
      <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.bannerInner}>
          <Ionicons name="cloud-offline-outline" size={18} color="#FFF" />
          <Text style={styles.bannerText}>
            You're offline{syncQueueSize > 0 ? ` · ${syncQueueSize} pending` : ''}
          </Text>
          <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </NetworkContext.Provider>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  bannerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
