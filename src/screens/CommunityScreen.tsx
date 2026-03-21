import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

type Tab = 'Feed' | 'Prayers' | 'Groups';
type PostType = 'reflection' | 'testimony' | 'verse_share';

interface CommunityPost {
  id: string;
  user_id: string;
  user_name?: string;
  content: string;
  verse_reference?: string;
  verse_text?: string;
  post_type: PostType;
  like_count: number;
  created_at: string;
}

interface PrayerRequest {
  id: string;
  user_id: string;
  user_name?: string;
  content: string;
  prayer_count: number;
  is_answered: boolean;
  is_anonymous: boolean;
  created_at: string;
}

interface PrayerGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_public: boolean;
  created_at: string;
}

const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string; icon: string }> = {
  reflection: { label: 'Reflection', color: '#5A8DEE', icon: 'bulb-outline' },
  testimony: { label: 'Testimony', color: '#C9A227', icon: 'star-outline' },
  verse_share: { label: 'Verse', color: '#4CAF50', icon: 'book-outline' },
};

const GROUP_COLORS = ['#5A8DEE', '#C9A227', '#4CAF50', '#E53935', '#8B5CF6', '#F97316'];

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return date.toLocaleDateString();
}

export default function CommunityScreen({ navigation }: any) {
  const { theme, session, darkMode } = useApp();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Tab>('Feed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [groups, setGroups] = useState<PrayerGroup[]>([]);

  // Liked / prayed / joined tracking
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [prayedRequestIds, setPrayedRequestIds] = useState<Set<string>>(new Set());
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // New post form
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVerse, setNewPostVerse] = useState('');
  const [newPostType, setNewPostType] = useState<PostType>('reflection');
  const [submitting, setSubmitting] = useState(false);

  // New prayer form
  const [newPrayerContent, setNewPrayerContent] = useState('');
  const [newPrayerAnonymous, setNewPrayerAnonymous] = useState(true);

  // New group form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch data based on active tab
  const fetchData = useCallback(async (tab?: Tab) => {
    const currentTab = tab || activeTab;
    setError(null);
    try {
      if (currentTab === 'Feed') {
        const { data, error: fetchErr } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (fetchErr) throw fetchErr;
        setPosts(data || []);

        if (session?.user?.id) {
          const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', session.user.id);
          if (likes) {
            setLikedPostIds(new Set(likes.map((l: any) => l.post_id)));
          }
        }
      } else if (currentTab === 'Prayers') {
        const { data, error: fetchErr } = await supabase
          .from('prayer_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (fetchErr) throw fetchErr;
        setPrayers(data || []);

        if (session?.user?.id) {
          const { data: prayed } = await supabase
            .from('prayer_request_prayers')
            .select('prayer_request_id')
            .eq('user_id', session.user.id);
          if (prayed) {
            setPrayedRequestIds(new Set(prayed.map((p: any) => p.prayer_request_id)));
          }
        }
      } else if (currentTab === 'Groups') {
        const { data, error: fetchErr } = await supabase
          .from('prayer_groups')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        if (fetchErr) throw fetchErr;
        setGroups(data || []);

        if (session?.user?.id) {
          const { data: memberships } = await supabase
            .from('prayer_group_members')
            .select('group_id')
            .eq('user_id', session.user.id);
          if (memberships) {
            setJoinedGroupIds(new Set(memberships.map((m: any) => m.group_id)));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, session]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  // === Actions ===

  const toggleLike = async (postId: string) => {
    if (!session?.user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isLiked = likedPostIds.has(postId);
    // Optimistic update
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, like_count: p.like_count + (isLiked ? -1 : 1) }
          : p
      )
    );

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: session.user.id });
      }
    } catch {
      // Revert on failure
      fetchData();
    }
  };

  const prayForRequest = async (requestId: string) => {
    if (!session?.user?.id || prayedRequestIds.has(requestId)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Optimistic
    setPrayedRequestIds((prev) => new Set(prev).add(requestId));
    setPrayers((prev) =>
      prev.map((p) =>
        p.id === requestId ? { ...p, prayer_count: p.prayer_count + 1 } : p
      )
    );

    try {
      await supabase
        .from('prayer_request_prayers')
        .insert({ prayer_request_id: requestId, user_id: session.user.id });
    } catch {
      fetchData();
    }
  };

  const toggleJoinGroup = async (groupId: string) => {
    if (!session?.user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isJoined = joinedGroupIds.has(groupId);
    setJoinedGroupIds((prev) => {
      const next = new Set(prev);
      if (isJoined) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, member_count: g.member_count + (isJoined ? -1 : 1) }
          : g
      )
    );

    try {
      if (isJoined) {
        await supabase
          .from('prayer_group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('prayer_group_members')
          .insert({ group_id: groupId, user_id: session.user.id });
      }
    } catch {
      fetchData();
    }
  };

  // === Submissions ===

  const submitPost = async () => {
    if (!session?.user?.id || !newPostContent.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('community_posts').insert({
        user_id: session.user.id,
        content: newPostContent.trim(),
        verse_reference: newPostVerse.trim() || null,
        post_type: newPostType,
      });
      setNewPostContent('');
      setNewPostVerse('');
      setNewPostType('reflection');
      setShowPostModal(false);
      fetchData();
    } catch {
      setError('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPrayer = async () => {
    if (!session?.user?.id || !newPrayerContent.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('prayer_requests').insert({
        user_id: session.user.id,
        content: newPrayerContent.trim(),
        is_anonymous: newPrayerAnonymous,
      });
      setNewPrayerContent('');
      setNewPrayerAnonymous(true);
      setShowPrayerModal(false);
      fetchData();
    } catch {
      setError('Failed to submit prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  const submitGroup = async () => {
    if (!session?.user?.id || !newGroupName.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('prayer_groups').insert({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        created_by: session.user.id,
        is_public: true,
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setShowGroupModal(false);
      fetchData();
    } catch {
      setError('Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const openFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();

    if (activeTab === 'Feed') setShowPostModal(true);
    else if (activeTab === 'Prayers') setShowPrayerModal(true);
    else setShowGroupModal(true);
  };

  // === Render Items ===

  const renderPostItem = ({ item }: { item: CommunityPost }) => {
    const config = POST_TYPE_CONFIG[item.post_type] || POST_TYPE_CONFIG.reflection;
    const isLiked = likedPostIds.has(item.id);
    const initial = (item.user_name || 'A')[0].toUpperCase();

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: `${config.color}18` }]}>
              <Text style={[styles.avatarText, { color: config.color }]}>{initial}</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.userName, { color: theme.text.primary }]}>
                {item.user_name || 'Anonymous'}
              </Text>
              <Text style={[styles.timestamp, { color: theme.text.light }]}>
                {getRelativeTime(item.created_at)}
              </Text>
            </View>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${config.color}14` }]}>
            <Ionicons name={config.icon as any} size={12} color={config.color} />
            <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <Text style={[styles.postContent, { color: theme.text.primary }]}>{item.content}</Text>

        {item.verse_reference ? (
          <LinearGradient
            colors={theme.gradient.prayer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.verseCard}
          >
            <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.verseRef}>{item.verse_reference}</Text>
            {item.verse_text ? (
              <Text style={styles.verseText}>{item.verse_text}</Text>
            ) : null}
          </LinearGradient>
        ) : null}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => toggleLike(item.id)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#E53935' : theme.text.light}
            />
            <Text
              style={[
                styles.likeCount,
                { color: isLiked ? '#E53935' : theme.text.light },
              ]}
            >
              {item.like_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPrayerItem = ({ item }: { item: PrayerRequest }) => {
    const hasPrayed = prayedRequestIds.has(item.id);
    const initial = (item.is_anonymous ? 'A' : (item.user_name || 'A')[0]).toUpperCase();

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: `${theme.accent}18` }]}>
              <Text style={[styles.avatarText, { color: theme.accent }]}>{initial}</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.userName, { color: theme.text.primary }]}>
                {item.is_anonymous ? 'Anonymous' : item.user_name || 'Anonymous'}
              </Text>
              <Text style={[styles.timestamp, { color: theme.text.light }]}>
                {getRelativeTime(item.created_at)}
              </Text>
            </View>
          </View>
          {item.is_answered ? (
            <View style={[styles.answeredBadge, { backgroundColor: `${theme.success}14` }]}>
              <Ionicons name="checkmark-circle" size={14} color={theme.success} />
              <Text style={[styles.answeredText, { color: theme.success }]}>Answered</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.postContent, { color: theme.text.primary }]}>{item.content}</Text>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[
              styles.prayBtn,
              {
                backgroundColor: hasPrayed ? `${theme.accent}14` : 'transparent',
                borderColor: hasPrayed ? theme.accent : theme.border,
              },
            ]}
            onPress={() => prayForRequest(item.id)}
            disabled={hasPrayed}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasPrayed ? 'hand-left' : 'hand-left-outline'}
              size={16}
              color={hasPrayed ? theme.accent : theme.text.secondary}
            />
            <Text
              style={[
                styles.prayBtnText,
                { color: hasPrayed ? theme.accent : theme.text.secondary },
              ]}
            >
              {hasPrayed ? 'Prayed' : 'I prayed for this'}
            </Text>
            <Text
              style={[
                styles.prayCount,
                { color: hasPrayed ? theme.accent : theme.text.light },
              ]}
            >
              {item.prayer_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderGroupItem = ({ item, index }: { item: PrayerGroup; index: number }) => {
    const isJoined = joinedGroupIds.has(item.id);
    const accentColor = GROUP_COLORS[index % GROUP_COLORS.length];
    const initial = item.name[0]?.toUpperCase() || 'G';

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.groupRow}>
          <View style={[styles.groupAccent, { backgroundColor: `${accentColor}18` }]}>
            <Text style={[styles.groupAccentLetter, { color: accentColor }]}>{initial}</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: theme.text.primary }]}>{item.name}</Text>
            {item.description ? (
              <Text
                style={[styles.groupDesc, { color: theme.text.secondary }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
            <View style={styles.memberRow}>
              <Ionicons name="people-outline" size={14} color={theme.text.light} />
              <Text style={[styles.memberCount, { color: theme.text.light }]}>
                {item.member_count} {item.member_count === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.joinBtn,
              {
                backgroundColor: isJoined ? `${theme.accent}14` : theme.accent,
              },
            ]}
            onPress={() => toggleJoinGroup(item.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.joinBtnText,
                { color: isJoined ? theme.accent : '#FFFFFF' },
              ]}
            >
              {isJoined ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    const messages: Record<Tab, { icon: string; title: string; sub: string }> = {
      Feed: {
        icon: 'chatbubbles-outline',
        title: 'No posts yet',
        sub: 'Be the first to share a reflection or testimony with the community.',
      },
      Prayers: {
        icon: 'hand-left-outline',
        title: 'No prayer requests',
        sub: 'Share what is on your heart and let others lift you up in prayer.',
      },
      Groups: {
        icon: 'people-outline',
        title: 'No groups yet',
        sub: 'Create a prayer group and invite others to join.',
      },
    };
    const msg = messages[activeTab];
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: `${theme.accent}10` }]}>
          <Ionicons name={msg.icon as any} size={36} color={theme.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>{msg.title}</Text>
        <Text style={[styles.emptySub, { color: theme.text.secondary }]}>{msg.sub}</Text>
      </View>
    );
  };

  // === Modal Renders ===

  const renderPostModal = () => (
    <Modal visible={showPostModal} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>New Post</Text>
            <TouchableOpacity
              onPress={() => setShowPostModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.typeSelector}>
            {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map((type) => {
              const cfg = POST_TYPE_CONFIG[type];
              const isActive = newPostType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isActive ? `${cfg.color}18` : 'transparent',
                      borderColor: isActive ? cfg.color : theme.border,
                    },
                  ]}
                  onPress={() => setNewPostType(type)}
                >
                  <Ionicons name={cfg.icon as any} size={14} color={isActive ? cfg.color : theme.text.light} />
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: isActive ? cfg.color : theme.text.secondary },
                    ]}
                  >
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={[
              styles.modalInput,
              styles.modalInputLarge,
              {
                color: theme.text.primary,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: theme.border,
              },
            ]}
            placeholder="Share your thoughts with the community..."
            placeholderTextColor={theme.text.light}
            multiline
            value={newPostContent}
            onChangeText={setNewPostContent}
            textAlignVertical="top"
          />

          <TextInput
            style={[
              styles.modalInput,
              {
                color: theme.text.primary,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: theme.border,
              },
            ]}
            placeholder="Verse reference (optional, e.g. John 3:16)"
            placeholderTextColor={theme.text.light}
            value={newPostVerse}
            onChangeText={setNewPostVerse}
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: newPostContent.trim() ? theme.accent : theme.border,
              },
            ]}
            onPress={submitPost}
            disabled={!newPostContent.trim() || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderPrayerModal = () => (
    <Modal visible={showPrayerModal} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Prayer Request</Text>
            <TouchableOpacity
              onPress={() => setShowPrayerModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.modalInput,
              styles.modalInputLarge,
              {
                color: theme.text.primary,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: theme.border,
              },
            ]}
            placeholder="Share your prayer request..."
            placeholderTextColor={theme.text.light}
            multiline
            value={newPrayerContent}
            onChangeText={setNewPrayerContent}
            textAlignVertical="top"
          />

          <View style={styles.anonymousRow}>
            <View style={styles.anonymousLabel}>
              <Ionicons name="eye-off-outline" size={18} color={theme.text.secondary} />
              <Text style={[styles.anonymousText, { color: theme.text.secondary }]}>
                Post anonymously
              </Text>
            </View>
            <Switch
              value={newPrayerAnonymous}
              onValueChange={setNewPrayerAnonymous}
              trackColor={{ false: theme.border, true: `${theme.accent}60` }}
              thumbColor={newPrayerAnonymous ? theme.accent : theme.text.light}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: newPrayerContent.trim() ? theme.accent : theme.border,
              },
            ]}
            onPress={submitPrayer}
            disabled={!newPrayerContent.trim() || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderGroupModal = () => (
    <Modal visible={showGroupModal} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>New Group</Text>
            <TouchableOpacity
              onPress={() => setShowGroupModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.modalInput,
              {
                color: theme.text.primary,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: theme.border,
              },
            ]}
            placeholder="Group name"
            placeholderTextColor={theme.text.light}
            value={newGroupName}
            onChangeText={setNewGroupName}
          />

          <TextInput
            style={[
              styles.modalInput,
              styles.modalInputMedium,
              {
                color: theme.text.primary,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: theme.border,
              },
            ]}
            placeholder="Description (optional)"
            placeholderTextColor={theme.text.light}
            multiline
            value={newGroupDesc}
            onChangeText={setNewGroupDesc}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: newGroupName.trim() ? theme.accent : theme.border,
              },
            ]}
            onPress={submitGroup}
            disabled={!newGroupName.trim() || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Create Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // === Main Layout ===

  const tabs: Tab[] = ['Feed', 'Prayers', 'Groups'];

  const currentData =
    activeTab === 'Feed' ? posts : activeTab === 'Prayers' ? prayers : groups;

  const renderItem =
    activeTab === 'Feed'
      ? renderPostItem
      : activeTab === 'Prayers'
        ? renderPrayerItem
        : renderGroupItem;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top, opacity: fadeAnim },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <View />
        </View>
        <Text style={[styles.headerLabel, { color: theme.text.light }]}>COMMUNITY</Text>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Walk together</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabPill,
                  isActive && {
                    backgroundColor: theme.card,
                    shadowColor: theme.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 3,
                  },
                ]}
                onPress={() => switchTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? theme.text.primary : theme.text.light },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity onPress={() => fetchData()}>
            <Text style={[styles.retryText, { color: theme.accent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={currentData as any[]}
          renderItem={renderItem as any}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        />
      )}

      {/* FAB */}
      {session?.user ? (
        <Animated.View
          style={[
            styles.fabWrap,
            { bottom: insets.bottom + 90, transform: [{ scale: fabScale }] },
          ]}
        >
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.accent }]}
            onPress={openFab}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {/* Modals */}
      {renderPostModal()}
      {renderPrayerModal()}
      {renderGroupModal()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    letterSpacing: -1,
  },

  // Tabs
  tabRow: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },

  // Cards
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  headerTextWrap: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  timestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  postContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 14,
  },
  verseCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 6,
  },
  verseRef: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  verseText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },

  // Prayer items
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  prayBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  prayCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    marginLeft: 8,
  },
  answeredText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },

  // Group items
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAccent: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groupAccentLetter: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  groupDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  joinBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  joinBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },

  // Empty & Loading
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 24,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: 14,
  },
  modalInputLarge: {
    minHeight: 120,
    paddingTop: 14,
  },
  modalInputMedium: {
    minHeight: 80,
    paddingTop: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  typeChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  anonymousRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  anonymousLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anonymousText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  submitBtn: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
