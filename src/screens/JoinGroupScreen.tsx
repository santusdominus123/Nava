import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';

interface GroupPreview {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  member_count: number;
  created_at: string;
}

export default function JoinGroupScreen({ route, navigation }: any) {
  const { inviteCode } = route.params;
  const { theme, session } = useApp();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState('');

  const userId = session?.user?.id;

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('prayer_groups')
          .select('id, name, description, avatar_url, member_count, created_at')
          .eq('invite_code', inviteCode)
          .single();

        if (fetchErr || !data) {
          setError('Group not found or invite link is invalid.');
          return;
        }
        setGroup(data);

        if (userId) {
          const { data: membership } = await supabase
            .from('prayer_group_members')
            .select('id')
            .eq('group_id', data.id)
            .eq('user_id', userId)
            .maybeSingle();
          if (membership) setAlreadyMember(true);
        }
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [inviteCode, userId]);

  const joinGroup = async () => {
    if (!userId || !group) return;
    setJoining(true);
    try {
      await supabase.from('prayer_group_members').insert({
        group_id: group.id,
        user_id: userId,
        role: 'member',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('GroupChat', {
        groupId: group.id,
        groupName: group.name,
        groupColor: theme.primary,
      });
    } catch {
      setError('Failed to join group. Please try again.');
      setJoining(false);
    }
  };

  const openChat = () => {
    if (!group) return;
    navigation.replace('GroupChat', {
      groupId: group.id,
      groupName: group.name,
      groupColor: theme.primary,
    });
  };

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={{ marginTop: 120 }} color={theme.primary} size="large" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[s.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
        <Ionicons name="alert-circle-outline" size={56} color={theme.text.light} />
        <Text style={[s.errorText, { color: theme.text.primary }]}>{error || 'Group not found'}</Text>
        <TouchableOpacity style={[s.backButton, { borderColor: theme.border }]} onPress={() => navigation.goBack()}>
          <Text style={[s.backButtonText, { color: theme.text.secondary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      {/* Close */}
      <TouchableOpacity style={[s.closeBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={24} color={theme.text.secondary} />
      </TouchableOpacity>

      <View style={s.content}>
        <Text style={[s.inviteLabel, { color: theme.text.light }]}>YOU'VE BEEN INVITED TO</Text>

        {/* Group Preview */}
        <View style={[s.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {group.avatar_url ? (
            <Image source={{ uri: group.avatar_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: `${theme.primary}15` }]}>
              <Text style={[s.avatarText, { color: theme.primary }]}>{group.name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={[s.groupName, { color: theme.text.primary }]}>{group.name}</Text>
          {group.description ? (
            <Text style={[s.groupDesc, { color: theme.text.secondary }]}>{group.description}</Text>
          ) : null}
          <View style={s.stats}>
            <View style={s.stat}>
              <Ionicons name="people" size={16} color={theme.text.light} />
              <Text style={[s.statText, { color: theme.text.light }]}>{group.member_count} members</Text>
            </View>
            <View style={s.stat}>
              <Ionicons name="calendar-outline" size={16} color={theme.text.light} />
              <Text style={[s.statText, { color: theme.text.light }]}>
                Created {new Date(group.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Action */}
        {alreadyMember ? (
          <TouchableOpacity onPress={openChat} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.primary, '#2A5A8A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.joinBtn}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
              <Text style={s.joinBtnText}>Open Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={joinGroup} disabled={joining} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.primary, '#2A5A8A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.joinBtn}
            >
              {joining ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="enter-outline" size={20} color="#FFF" />
                  <Text style={s.joinBtnText}>Join Group</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {alreadyMember && (
          <Text style={[s.alreadyText, { color: theme.text.light }]}>You're already a member</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: 'absolute', right: 16, zIndex: 10, padding: 8 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  inviteLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 2, marginBottom: 20 },

  previewCard: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 28, alignItems: 'center', marginBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28 },
  groupName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, textAlign: 'center', marginBottom: 6 },
  groupDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 20 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 28, paddingHorizontal: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  joinBtnText: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFF' },
  alreadyText: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 12 },

  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 18, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  backButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
