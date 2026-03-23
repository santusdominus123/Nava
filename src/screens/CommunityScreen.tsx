import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, RefreshControl, KeyboardAvoidingView,
  Platform, Animated, Switch, Alert, ScrollView, Pressable,
  Image, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';

type Tab = 'Feed' | 'Prayers' | 'Groups';
type PostType = 'reflection' | 'testimony' | 'verse_share';
type SortMode = 'recent' | 'trending';

const REACTION_EMOJIS = ['❤️', '🙏', '🔥', '👏', '💡', '😢'];
const REPORT_REASONS = ['Inappropriate content', 'Spam', 'Harassment', 'Other'];

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name?: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction: string;
}

interface CommunityPost {
  id: string;
  user_id: string;
  user_name?: string;
  avatar_url?: string;
  content: string;
  verse_reference?: string;
  verse_text?: string;
  post_type: PostType;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

interface PrayerRequest {
  id: string;
  user_id: string;
  user_name?: string;
  avatar_url?: string;
  content: string;
  prayer_count: number;
  is_answered: boolean;
  is_anonymous: boolean;
  status?: string;
  testimony?: string;
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString();
}

// Reaction picker popup component
function ReactionPicker({
  visible, onSelect, onClose, theme,
}: {
  visible: boolean; onSelect: (emoji: string) => void; onClose: () => void; theme: any;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 400, friction: 15, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          s.reactionPicker,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {REACTION_EMOJIS.map((emoji) => (
          <TouchableOpacity key={emoji} onPress={() => onSelect(emoji)} style={s.reactionPickerItem} activeOpacity={0.6}>
            <Text style={s.reactionPickerEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
}

export default function CommunityScreen() {
  const { theme, session, darkMode, userName } = useApp();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Analytics helper
  const logEvent = async (eventName: string, eventData?: Record<string, any>) => {
    if (!userId) return;
    try {
      await supabase.from('analytics_events').insert({
        user_id: userId, event_name: eventName, event_data: eventData || {},
        screen_name: 'CommunityScreen', platform: Platform.OS,
      });
    } catch {}
  };

  const [activeTab, setActiveTab] = useState<Tab>('Feed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [groups, setGroups] = useState<PrayerGroup[]>([]);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Reactions state
  const [postReactions, setPostReactions] = useState<Record<string, PostReaction[]>>({});
  const [activePickerPostId, setActivePickerPostId] = useState<string | null>(null);

  // Sort mode
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTestimonyModal, setShowTestimonyModal] = useState(false);

  // Forms
  const [newContent, setNewContent] = useState('');
  const [newVerse, setNewVerse] = useState('');
  const [newPostType, setNewPostType] = useState<PostType>('reflection');
  const [newPrayerAnon, setNewPrayerAnon] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [postImageUri, setPostImageUri] = useState<string | null>(null);

  // Comments
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Report state
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportTargetType, setReportTargetType] = useState<'post' | 'prayer'>('post');
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);

  // Testimony state
  const [testimonyPrayerId, setTestimonyPrayerId] = useState<string | null>(null);
  const [testimonyText, setTestimonyText] = useState('');

  const fabScale = useRef(new Animated.Value(1)).current;

  const userId = session?.user?.id;

  // === REALTIME SUBSCRIPTIONS ===
  useEffect(() => {
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
        if (activeTab === 'Feed') {
          const newPost = payload.new as CommunityPost;
          if (newPost.user_id !== userId) {
            setPosts(prev => [{ ...newPost, like_count: 0, comment_count: 0 }, ...prev]);
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prayer_requests' }, (payload) => {
        if (activeTab === 'Prayers') {
          const newPrayer = payload.new as PrayerRequest;
          if (newPrayer.user_id !== userId) {
            setPrayers(prev => [{ ...newPrayer, prayer_count: 0, is_answered: false }, ...prev]);
          }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, (payload) => {
        const old = payload.old as any;
        setPosts(prev => prev.filter(p => p.id !== old.id));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'prayer_requests' }, (payload) => {
        const old = payload.old as any;
        setPrayers(prev => prev.filter(p => p.id !== old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab, userId]);

  // === FETCH ===
  const fetchReactions = useCallback(async (postIds: string[]) => {
    if (postIds.length === 0) return;
    try {
      const { data } = await supabase
        .from('post_reactions')
        .select('*')
        .in('post_id', postIds);
      if (data) {
        const grouped: Record<string, PostReaction[]> = {};
        data.forEach((r: PostReaction) => {
          if (!grouped[r.post_id]) grouped[r.post_id] = [];
          grouped[r.post_id].push(r);
        });
        setPostReactions(grouped);
      }
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'Feed') {
        let query = supabase.from('community_posts').select('*').neq('is_flagged', true);
        if (sortMode === 'trending') {
          query = query.order('is_pinned', { ascending: false }).order('like_count', { ascending: false }).limit(50);
        } else {
          query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50);
        }
        const { data } = await query;
        setPosts(data || []);
        if (data && data.length > 0) {
          fetchReactions(data.map((p: any) => p.id));
        }
        if (userId) {
          const [likesRes, bookmarksRes] = await Promise.all([
            supabase.from('post_likes').select('post_id').eq('user_id', userId),
            supabase.from('post_bookmarks').select('post_id').eq('user_id', userId),
          ]);
          if (likesRes.data) setLikedIds(new Set(likesRes.data.map((l: any) => l.post_id)));
          if (bookmarksRes.data) setBookmarkedIds(new Set(bookmarksRes.data.map((b: any) => b.post_id)));
        }
      } else if (activeTab === 'Prayers') {
        const { data } = await supabase
          .from('prayer_requests').select('*')
          .order('created_at', { ascending: false }).limit(50);
        setPrayers(data || []);
        if (userId) {
          const { data: prayed } = await supabase
            .from('prayer_request_prayers').select('prayer_request_id').eq('user_id', userId);
          if (prayed) setPrayedIds(new Set(prayed.map((p: any) => p.prayer_request_id)));
        }
      } else {
        const { data } = await supabase
          .from('prayer_groups').select('*').eq('is_public', true)
          .order('member_count', { ascending: false });
        setGroups(data || []);
        if (userId) {
          const { data: joined } = await supabase
            .from('prayer_group_members').select('group_id').eq('user_id', userId);
          if (joined) setJoinedIds(new Set(joined.map((m: any) => m.group_id)));
        }
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, userId, sortMode]);

  useEffect(() => { setLoading(true); fetchData(); }, [activeTab, sortMode]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // === REACTIONS ===
  const toggleReaction = async (postId: string, emoji: string) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivePickerPostId(null);

    const currentReactions = postReactions[postId] || [];
    const existingReaction = currentReactions.find(
      (r) => r.user_id === userId && r.reaction === emoji
    );

    if (existingReaction) {
      setPostReactions((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((r) => r.id !== existingReaction.id),
      }));
      try {
        await supabase.from('post_reactions').delete()
          .eq('post_id', postId).eq('user_id', userId).eq('reaction', emoji);
      } catch { fetchReactions([postId]); }
    } else {
      const tempReaction: PostReaction = {
        id: Date.now().toString(), post_id: postId, user_id: userId, reaction: emoji,
      };
      setPostReactions((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), tempReaction],
      }));
      try {
        await supabase.from('post_reactions').insert({
          post_id: postId, user_id: userId, reaction: emoji,
        });
      } catch { fetchReactions([postId]); }
    }
  };

  const openReactionPicker = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePickerPostId(postId);
  };

  // === COMMENTS ===
  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    setShowCommentsModal(true);
    setLoadingComments(true);
    setNewComment('');
    try {
      const { data } = await supabase
        .from('post_comments').select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      setComments(data || []);
    } catch {} finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!userId || !newComment.trim() || !selectedPostId) return;
    const text = newComment.trim();
    setNewComment('');
    const tempComment: Comment = {
      id: Date.now().toString(),
      post_id: selectedPostId,
      user_id: userId,
      user_name: userName,
      content: text,
      created_at: new Date().toISOString(),
    };
    setComments(prev => [...prev, tempComment]);
    setPosts(prev => prev.map(p => p.id === selectedPostId ? { ...p, comment_count: p.comment_count + 1 } : p));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await supabase.from('post_comments').insert({
        post_id: selectedPostId, user_id: userId, user_name: userName, content: text,
      });
      logEvent('comment_created', { post_id: selectedPostId });
      // Activity feed logging
      await supabase.from('activity_feed').insert({
        user_id: userId, action: 'commented',
        description: 'Commented on a community post',
        metadata: { post_id: selectedPostId },
      });
    } catch {}
  };

  const deleteComment = async (commentId: string, commentUserId: string) => {
    if (commentUserId !== userId) return;
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setComments(prev => prev.filter(c => c.id !== commentId));
          if (selectedPostId) {
            setPosts(prev => prev.map(p => p.id === selectedPostId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p));
          }
          try {
            await supabase.from('post_comments').delete().eq('id', commentId);
          } catch {}
        },
      },
    ]);
  };

  // === ACTIONS ===
  const toggleLike = async (postId: string) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isLiked = likedIds.has(postId);
    setLikedIds(prev => { const n = new Set(prev); isLiked ? n.delete(postId) : n.add(postId); return n; });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count + (isLiked ? -1 : 1) } : p));
    try {
      if (isLiked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      else { await supabase.from('post_likes').insert({ post_id: postId, user_id: userId }); logEvent('post_liked', { post_id: postId }); }
    } catch { fetchData(); }
  };

  const toggleBookmark = async (postId: string) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isBookmarked = bookmarkedIds.has(postId);
    setBookmarkedIds(prev => { const n = new Set(prev); isBookmarked ? n.delete(postId) : n.add(postId); return n; });
    try {
      if (isBookmarked) await supabase.from('post_bookmarks').delete().eq('post_id', postId).eq('user_id', userId);
      else { await supabase.from('post_bookmarks').insert({ post_id: postId, user_id: userId }); logEvent('post_bookmarked', { post_id: postId }); }
    } catch { fetchData(); }
  };

  const sharePost = async (post: CommunityPost) => {
    try {
      let message = post.content;
      if (post.verse_reference) message += `\n\n📖 ${post.verse_reference}`;
      message += '\n\n— Shared from Nava';
      await Share.share({ message, title: 'Share Post' });
      logEvent('post_shared');
    } catch {}
  };

  const prayFor = async (id: string) => {
    if (!userId || prayedIds.has(id)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPrayedIds(prev => new Set(prev).add(id));
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayer_count: p.prayer_count + 1 } : p));
    try {
      await supabase.from('prayer_request_prayers').insert({ prayer_request_id: id, user_id: userId });
      logEvent('prayed_for_request', { prayer_id: id });
      // Activity feed
      await supabase.from('activity_feed').insert({
        user_id: userId, action: 'prayed_for',
        description: 'Prayed for a community prayer request',
        metadata: { prayer_id: id },
      });
    } catch { fetchData(); }
  };

  const toggleJoin = async (groupId: string) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isJoined = joinedIds.has(groupId);
    setJoinedIds(prev => { const n = new Set(prev); isJoined ? n.delete(groupId) : n.add(groupId); return n; });
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: g.member_count + (isJoined ? -1 : 1) } : g));
    try {
      if (isJoined) await supabase.from('prayer_group_members').delete().eq('group_id', groupId).eq('user_id', userId);
      else await supabase.from('prayer_group_members').insert({ group_id: groupId, user_id: userId });
    } catch { fetchData(); }
  };

  // === DELETE / EDIT ===
  const showPostOptions = (post: CommunityPost) => {
    if (!userId) return;
    const isOwner = post.user_id === userId;

    const options: { text: string; onPress: () => void; style?: 'destructive' | 'cancel' }[] = [];

    if (isOwner) {
      options.push({
        text: 'Edit Post',
        onPress: () => {
          setEditingPostId(post.id);
          setEditContent(post.content);
        },
      });
      options.push({
        text: 'Delete Post',
        style: 'destructive',
        onPress: () => confirmDeletePost(post.id),
      });
    }
    options.push({
      text: 'Report',
      onPress: () => {
        setReportTargetId(post.id);
        setReportTargetType('post');
        setSelectedReportReason(null);
        setShowReportModal(true);
      },
    });
    options.push({ text: 'Cancel', style: 'cancel', onPress: () => {} });

    Alert.alert('Post Options', undefined, options);
  };

  const confirmDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setPosts(prev => prev.filter(p => p.id !== postId));
          try {
            await supabase.from('community_posts').delete().eq('id', postId);
          } catch {}
        },
      },
    ]);
  };

  const saveEditPost = async () => {
    if (!editingPostId || !editContent.trim()) return;
    setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, content: editContent.trim() } : p));
    setEditingPostId(null);
    try {
      await supabase.from('community_posts').update({ content: editContent.trim() }).eq('id', editingPostId);
    } catch {}
  };

  const showPrayerOptions = (prayer: PrayerRequest) => {
    if (!userId) return;
    const isOwner = prayer.user_id === userId;

    const options: { text: string; onPress: () => void; style?: 'destructive' | 'cancel' }[] = [];

    if (isOwner) {
      options.push({
        text: 'Update Status',
        onPress: () => {
          setTestimonyPrayerId(prayer.id);
          setTestimonyText(prayer.testimony || '');
          setShowTestimonyModal(true);
        },
      });
      options.push({
        text: 'Delete Prayer Request',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Prayer Request', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete', style: 'destructive',
              onPress: async () => {
                setPrayers(prev => prev.filter(p => p.id !== prayer.id));
                try { await supabase.from('prayer_requests').delete().eq('id', prayer.id); } catch {}
              },
            },
          ]);
        },
      });
    }
    options.push({
      text: 'Report',
      onPress: () => {
        setReportTargetId(prayer.id);
        setReportTargetType('prayer');
        setSelectedReportReason(null);
        setShowReportModal(true);
      },
    });
    options.push({ text: 'Cancel', style: 'cancel', onPress: () => {} });

    Alert.alert('Prayer Options', undefined, options);
  };

  // === REPORT ===
  const submitReport = async () => {
    if (!userId || !reportTargetId || !selectedReportReason) return;
    setSubmitting(true);
    try {
      await supabase.from('post_reports').insert({
        [reportTargetType === 'post' ? 'post_id' : 'prayer_id']: reportTargetId,
        reporter_id: userId,
        reason: selectedReportReason,
      });
      setShowReportModal(false);
      logEvent('content_reported', { reason: selectedReportReason });
      Alert.alert('Report Submitted', 'Thank you. Our team will review this content.');
    } catch {} finally { setSubmitting(false); }
  };

  // === TESTIMONY / PRAYER UPDATE ===
  const submitTestimony = async () => {
    if (!testimonyPrayerId) return;
    setSubmitting(true);
    try {
      await supabase.from('prayer_requests')
        .update({ status: 'answered', is_answered: true, testimony: testimonyText.trim() || null })
        .eq('id', testimonyPrayerId);
      setPrayers(prev => prev.map(p => p.id === testimonyPrayerId
        ? { ...p, is_answered: true, status: 'answered', testimony: testimonyText.trim() || undefined }
        : p
      ));
      setShowTestimonyModal(false);
      logEvent('prayer_answered', { prayer_id: testimonyPrayerId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {} finally { setSubmitting(false); }
  };

  // === IMAGE PICKER ===
  const pickPostImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setPostImageUri(result.assets[0].uri);
      }
    } catch {}
  };

  const uploadPostImage = async (): Promise<string | null> => {
    if (!postImageUri || !userId) return null;
    try {
      const ext = postImageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${ext}`;

      // React Native compatible upload using FormData
      const formData = new FormData();
      formData.append('', {
        uri: postImageUri,
        name: fileName,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      } as any);

      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, formData, { contentType: `multipart/form-data`, upsert: true });

      if (error) {
        console.log('Upload error:', error.message);
        return null;
      }

      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e) {
      console.log('Upload exception:', e);
      return null;
    }
  };

  // === SUBMISSIONS ===
  const submitPost = async () => {
    if (!userId || !newContent.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (postImageUri) {
        imageUrl = await uploadPostImage();
      }

      // Auto-mod: check banned words
      let isFlagged = false;
      let flagReason: string | null = null;
      try {
        const { data: bannedWords } = await supabase.from('banned_words').select('word');
        if (bannedWords) {
          const contentLower = newContent.trim().toLowerCase();
          const matched = bannedWords.find((bw: any) => contentLower.includes(bw.word.toLowerCase()));
          if (matched) {
            isFlagged = true;
            flagReason = `Contains banned word: "${matched.word}"`;
          }
        }
      } catch {}

      const { data } = await supabase.from('community_posts').insert({
        user_id: userId, user_name: userName,
        content: newContent.trim(),
        verse_reference: newVerse.trim() || null,
        post_type: newPostType,
        image_url: imageUrl,
        is_flagged: isFlagged,
        flag_reason: flagReason,
      }).select().single();

      if (data) {
        setPosts(prev => [{ ...data, like_count: 0, comment_count: 0 }, ...prev]);
      }

      setNewContent(''); setNewVerse(''); setPostImageUri(null); setShowPostModal(false);

      // Badge auto-unlock: first_post
      await supabase.from('user_achievements').upsert(
        { user_id: userId, badge_key: 'first_post' },
        { onConflict: 'user_id,badge_key' }
      );
      logEvent('post_created', { post_type: newPostType, has_image: !!imageUrl });

      // Activity feed logging
      await supabase.from('activity_feed').insert({
        user_id: userId, action: 'created_post',
        description: `Shared a ${newPostType} in the community`,
        metadata: data ? { post_id: data.id } : {},
      });
    } catch {} finally { setSubmitting(false); }
  };

  const submitPrayer = async () => {
    if (!userId || !newContent.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await supabase.from('prayer_requests').insert({
        user_id: userId,
        user_name: newPrayerAnon ? null : userName,
        content: newContent.trim(),
        is_anonymous: newPrayerAnon,
      }).select().single();

      if (data) {
        setPrayers(prev => [{ ...data, prayer_count: 0, is_answered: false }, ...prev]);
      }

      setNewContent(''); setShowPrayerModal(false);
      logEvent('prayer_request_created', { is_anonymous: newPrayerAnon });

      // Activity feed logging
      await supabase.from('activity_feed').insert({
        user_id: userId, action: 'prayer_request',
        description: 'Shared a prayer request',
        metadata: data ? { prayer_id: data.id } : {},
      });
    } catch {} finally { setSubmitting(false); }
  };

  const submitGroup = async () => {
    if (!userId || !newGroupName.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await supabase.from('prayer_groups').insert({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        created_by: userId, is_public: true,
      }).select().single();
      if (data) {
        await supabase.from('prayer_group_members').insert({ group_id: data.id, user_id: userId, role: 'admin' });
      }
      setNewGroupName(''); setNewGroupDesc(''); setShowGroupModal(false);
      fetchData();

      // Badge auto-unlock: group_creator
      await supabase.from('user_achievements').upsert(
        { user_id: userId, badge_key: 'group_creator' },
        { onConflict: 'user_id,badge_key' }
      );
      logEvent('group_created', { name: newGroupName });

      // Activity feed
      await supabase.from('activity_feed').insert({
        user_id: userId, action: 'created_group',
        description: `Created the group "${newGroupName.trim()}"`,
        metadata: data ? { group_id: data.id } : {},
      });
    } catch {} finally { setSubmitting(false); }
  };

  const openFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    setNewContent('');
    setPostImageUri(null);
    if (activeTab === 'Feed') setShowPostModal(true);
    else if (activeTab === 'Prayers') setShowPrayerModal(true);
    else setShowGroupModal(true);
  };

  // === RENDER: Avatar helper ===
  const renderAvatar = (name?: string, avatarUrl?: string, color?: string, size = 36) => {
    const init = (name || 'A')[0].toUpperCase();
    const bgColor = color || theme.primary;
    const radius = size <= 36 ? 12 : 16;

    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: radius, backgroundColor: `${bgColor}15` }}
        />
      );
    }
    return (
      <View style={[s.avatar, { backgroundColor: `${bgColor}15`, width: size, height: size, borderRadius: radius }]}>
        <Text style={[s.avatarText, { color: bgColor, fontSize: size * 0.38 }]}>{init}</Text>
      </View>
    );
  };

  // === RENDER: Reaction bar below a post ===
  const renderReactionBar = (postId: string) => {
    const reactions = postReactions[postId] || [];
    if (reactions.length === 0) return null;

    const grouped: Record<string, { count: number; userReacted: boolean }> = {};
    reactions.forEach((r) => {
      if (!grouped[r.reaction]) grouped[r.reaction] = { count: 0, userReacted: false };
      grouped[r.reaction].count++;
      if (r.user_id === userId) grouped[r.reaction].userReacted = true;
    });

    return (
      <View style={s.reactionBar}>
        {Object.entries(grouped).map(([emoji, info]) => (
          <TouchableOpacity
            key={emoji}
            style={[
              s.reactionChip,
              {
                backgroundColor: info.userReacted
                  ? `${theme.primary}18`
                  : darkMode ? 'rgba(255,255,255,0.06)' : '#F0F2F5',
                borderColor: info.userReacted ? theme.primary : 'transparent',
              },
            ]}
            onPress={() => toggleReaction(postId, emoji)}
            activeOpacity={0.7}
          >
            <Text style={s.reactionChipEmoji}>{emoji}</Text>
            <Text style={[s.reactionChipCount, { color: info.userReacted ? theme.primary : theme.text.secondary }]}>
              {info.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // === RENDER ITEMS ===
  const renderPost = ({ item }: { item: CommunityPost }) => {
    const cfg = POST_TYPE_CONFIG[item.post_type] || POST_TYPE_CONFIG.reflection;
    const liked = likedIds.has(item.id);
    const bookmarked = bookmarkedIds.has(item.id);
    const pickerOpen = activePickerPostId === item.id;
    const isEditing = editingPostId === item.id;

    return (
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.cardHeader}>
          <View style={s.avatarRow}>
            {renderAvatar(item.user_name, item.avatar_url, cfg.color)}
            <View>
              <Text style={[s.nameText, { color: theme.text.primary }]}>{item.user_name || 'Anonymous'}</Text>
              <Text style={[s.timeText, { color: theme.text.light }]}>{timeAgo(item.created_at)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.typeBadge, { backgroundColor: `${cfg.color}12` }]}>
              <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
              <Text style={[s.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <TouchableOpacity onPress={() => showPostOptions(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.text.light} />
            </TouchableOpacity>
          </View>
        </View>

        {isEditing ? (
          <View style={{ marginBottom: 10 }}>
            <TextInput
              style={[s.editInput, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setEditingPostId(null)} style={s.editCancelBtn}>
                <Text style={{ color: theme.text.secondary, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEditPost} style={[s.editSaveBtn, { backgroundColor: theme.primary }]}>
                <Text style={{ color: '#FFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[s.content, { color: theme.text.primary }]}>{item.content}</Text>
        )}

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={s.postImage} resizeMode="cover" />
        )}

        {item.verse_reference && (
          <LinearGradient colors={theme.gradient.prayer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.verseCard}>
            <Ionicons name="book-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={s.verseRef}>{item.verse_reference}</Text>
          </LinearGradient>
        )}

        {renderReactionBar(item.id)}

        <View style={s.footer}>
          <View style={{ position: 'relative' }}>
            <ReactionPicker
              visible={pickerOpen}
              onSelect={(emoji) => toggleReaction(item.id, emoji)}
              onClose={() => setActivePickerPostId(null)}
              theme={theme}
            />
            <TouchableOpacity
              style={s.footerBtn}
              onPress={() => toggleLike(item.id)}
              onLongPress={() => openReactionPicker(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#E53935' : theme.text.light} />
              <Text style={[s.footerCount, { color: liked ? '#E53935' : theme.text.light }]}>{item.like_count}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.footerBtn} onPress={() => openComments(item.id)} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={16} color={theme.text.light} />
            <Text style={[s.footerCount, { color: theme.text.light }]}>{item.comment_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.footerBtn} onPress={() => toggleBookmark(item.id)} activeOpacity={0.7}>
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={16} color={bookmarked ? theme.primary : theme.text.light} />
          </TouchableOpacity>
          <TouchableOpacity style={s.footerBtn} onPress={() => sharePost(item)} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={16} color={theme.text.light} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPrayer = ({ item }: { item: PrayerRequest }) => {
    const prayed = prayedIds.has(item.id);
    const isOwner = item.user_id === userId;
    return (
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={s.cardHeader}>
          <View style={s.avatarRow}>
            {renderAvatar(
              item.is_anonymous ? 'A' : item.user_name,
              item.is_anonymous ? undefined : item.avatar_url,
              theme.accent
            )}
            <View>
              <Text style={[s.nameText, { color: theme.text.primary }]}>
                {item.is_anonymous ? 'Anonymous' : item.user_name || 'Anonymous'}
              </Text>
              <Text style={[s.timeText, { color: theme.text.light }]}>{timeAgo(item.created_at)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {item.is_answered && (
              <View style={[s.typeBadge, { backgroundColor: '#4CAF5012' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                <Text style={[s.typeBadgeText, { color: '#4CAF50' }]}>Answered</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => showPrayerOptions(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.text.light} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[s.content, { color: theme.text.primary }]}>{item.content}</Text>

        {/* Testimony display */}
        {item.testimony && (
          <View style={[s.testimonyCard, { backgroundColor: darkMode ? 'rgba(76,175,80,0.08)' : '#E8F5E9', borderColor: '#4CAF5030' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="sparkles" size={14} color="#4CAF50" />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#4CAF50' }}>Testimony</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: theme.text.primary }}>
              {item.testimony}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[s.prayBtn, { flex: 1, borderColor: prayed ? theme.accent : theme.border, backgroundColor: prayed ? `${theme.accent}10` : 'transparent' }]}
            onPress={() => prayFor(item.id)} disabled={prayed} activeOpacity={0.7}
          >
            <Ionicons name={prayed ? 'hand-left' : 'hand-left-outline'} size={14} color={prayed ? theme.accent : theme.text.secondary} />
            <Text style={[s.prayBtnText, { color: prayed ? theme.accent : theme.text.secondary }]}>
              {prayed ? 'Prayed' : 'I prayed for this'}
            </Text>
            <Text style={[s.footerCount, { color: theme.text.light }]}>{item.prayer_count}</Text>
          </TouchableOpacity>
          {isOwner && !item.is_answered && (
            <TouchableOpacity
              style={[s.updateBtn, { borderColor: '#4CAF5040', backgroundColor: '#4CAF5008' }]}
              onPress={() => {
                setTestimonyPrayerId(item.id);
                setTestimonyText('');
                setShowTestimonyModal(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={14} color="#4CAF50" />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#4CAF50' }}>Answered</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const openGroupChat = async (group: PrayerGroup, color: string) => {
    if (userId && !joinedIds.has(group.id)) {
      setJoinedIds(prev => new Set(prev).add(group.id));
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, member_count: g.member_count + 1 } : g));
      try {
        await supabase.from('prayer_group_members').insert({ group_id: group.id, user_id: userId });
      } catch {}
    }
    navigation.navigate('GroupChat', { groupId: group.id, groupName: group.name, groupColor: color });
  };

  const renderGroup = ({ item, index }: { item: PrayerGroup; index: number }) => {
    const joined = joinedIds.has(item.id);
    const color = GROUP_COLORS[index % GROUP_COLORS.length];
    return (
      <TouchableOpacity
        style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => openGroupChat(item, color)}
        activeOpacity={0.7}
      >
        <View style={s.groupRow}>
          <View style={[s.groupIcon, { backgroundColor: `${color}15` }]}>
            <Text style={[s.groupInitial, { color }]}>{item.name[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.nameText, { color: theme.text.primary }]}>{item.name}</Text>
            {item.description ? <Text style={[s.timeText, { color: theme.text.secondary }]} numberOfLines={2}>{item.description}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="people-outline" size={12} color={theme.text.light} />
              <Text style={[s.timeText, { color: theme.text.light }]}>{item.member_count} members</Text>
            </View>
          </View>
          {joined ? (
            <View style={[s.joinBtn, { backgroundColor: `${color}15` }]}>
              <Ionicons name="chatbubble-ellipses" size={16} color={color} />
            </View>
          ) : (
            <View style={[s.joinBtn, { backgroundColor: color }]}>
              <Text style={[s.joinBtnText, { color: '#FFF' }]}>Join</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const emptyInfo: Record<Tab, { icon: any; title: string; sub: string }> = {
    Feed: { icon: 'chatbubbles-outline', title: 'No posts yet', sub: 'Share your first reflection!' },
    Prayers: { icon: 'hand-left-outline', title: 'No prayer requests', sub: 'Share what\'s on your heart.' },
    Groups: { icon: 'people-outline', title: 'No groups yet', sub: 'Create a prayer group!' },
  };

  const renderEmpty = () => {
    const info = emptyInfo[activeTab];
    return (
      <View style={s.empty}>
        <Ionicons name={info.icon} size={40} color={theme.text.light} />
        <Text style={[s.emptyTitle, { color: theme.text.primary }]}>{info.title}</Text>
        <Text style={[s.emptySub, { color: theme.text.secondary }]}>{info.sub}</Text>
      </View>
    );
  };

  // === MODAL: Create post/prayer/group ===
  const renderCreateModal = (type: 'post' | 'prayer' | 'group', visible: boolean, close: () => void, submit: () => void) => (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: theme.card }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: theme.text.primary }]}>
              {type === 'post' ? 'New Post' : type === 'prayer' ? 'Prayer Request' : 'New Group'}
            </Text>
            <TouchableOpacity onPress={close}><Ionicons name="close" size={24} color={theme.text.secondary} /></TouchableOpacity>
          </View>

          {type === 'post' && (
            <View style={s.typeRow}>
              {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map(t => {
                const c = POST_TYPE_CONFIG[t];
                const active = newPostType === t;
                return (
                  <TouchableOpacity key={t} style={[s.typeChip, { borderColor: active ? c.color : theme.border, backgroundColor: active ? `${c.color}12` : 'transparent' }]} onPress={() => setNewPostType(t)}>
                    <Ionicons name={c.icon as any} size={12} color={active ? c.color : theme.text.light} />
                    <Text style={[s.typeChipText, { color: active ? c.color : theme.text.secondary }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {type === 'group' ? (
            <>
              <TextInput style={[s.input, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
                placeholder="Group name" placeholderTextColor={theme.text.light} value={newGroupName} onChangeText={setNewGroupName} />
              <TextInput style={[s.input, s.inputLarge, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
                placeholder="Description (optional)" placeholderTextColor={theme.text.light} value={newGroupDesc} onChangeText={setNewGroupDesc} multiline textAlignVertical="top" />
            </>
          ) : (
            <>
              <TextInput style={[s.input, s.inputLarge, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
                placeholder={type === 'post' ? 'Share your thoughts...' : 'What would you like prayer for?'}
                placeholderTextColor={theme.text.light} value={newContent} onChangeText={setNewContent} multiline textAlignVertical="top" />
              {type === 'post' && (
                <>
                  <TextInput style={[s.input, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
                    placeholder="Verse reference (optional)" placeholderTextColor={theme.text.light} value={newVerse} onChangeText={setNewVerse} />
                  {/* Image picker */}
                  <TouchableOpacity style={[s.imagePickerBtn, { borderColor: theme.border }]} onPress={pickPostImage}>
                    <Ionicons name="image-outline" size={20} color={theme.text.secondary} />
                    <Text style={[s.imagePickerText, { color: theme.text.secondary }]}>
                      {postImageUri ? 'Image selected' : 'Add image (optional)'}
                    </Text>
                    {postImageUri && (
                      <TouchableOpacity onPress={() => setPostImageUri(null)}>
                        <Ionicons name="close-circle" size={20} color={theme.text.light} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  {postImageUri && (
                    <Image source={{ uri: postImageUri }} style={s.imagePreview} resizeMode="cover" />
                  )}
                </>
              )}
              {type === 'prayer' && (
                <View style={s.anonRow}>
                  <Text style={[s.anonLabel, { color: theme.text.secondary }]}>Post anonymously</Text>
                  <Switch value={newPrayerAnon} onValueChange={setNewPrayerAnon} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFF" />
                </View>
              )}
            </>
          )}

          <TouchableOpacity style={[s.submitBtn, { backgroundColor: theme.primary }]} onPress={submit} disabled={submitting} activeOpacity={0.8}>
            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : (
              <Text style={s.submitBtnText}>{type === 'group' ? 'Create Group' : 'Post'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // === COMMENTS MODAL ===
  const renderCommentsModal = () => (
    <Modal visible={showCommentsModal} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
        <View style={[s.modalContent, s.commentsModal, { backgroundColor: theme.card }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: theme.text.primary }]}>Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentsModal(false)}><Ionicons name="close" size={24} color={theme.text.secondary} /></TouchableOpacity>
          </View>

          {loadingComments ? (
            <ActivityIndicator style={{ marginVertical: 40 }} color={theme.primary} />
          ) : comments.length === 0 ? (
            <View style={s.emptyComments}>
              <Ionicons name="chatbubble-outline" size={32} color={theme.text.light} />
              <Text style={[s.emptySub, { color: theme.text.secondary, marginTop: 8 }]}>No comments yet. Be the first!</Text>
            </View>
          ) : (
            <ScrollView style={s.commentsList} showsVerticalScrollIndicator={false}>
              {comments.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.commentItem, { borderBottomColor: theme.border }]}
                  onLongPress={() => deleteComment(c.id, c.user_id)}
                  activeOpacity={0.8}
                >
                  {renderAvatar(c.user_name, c.avatar_url, theme.primary, 30)}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[s.commentName, { color: theme.text.primary }]}>{c.user_name || 'Anonymous'}</Text>
                      <Text style={[s.commentTime, { color: theme.text.light }]}>{timeAgo(c.created_at)}</Text>
                      {c.user_id === userId && (
                        <Ionicons name="trash-outline" size={12} color={theme.text.light} style={{ marginLeft: 'auto' }} />
                      )}
                    </View>
                    <Text style={[s.commentText, { color: theme.text.secondary }]}>{c.content}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={[s.commentInputRow, { borderTopColor: theme.border }]}>
            <TextInput
              style={[s.commentInput, { color: theme.text.primary, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA', borderColor: theme.border }]}
              placeholder="Write a comment..."
              placeholderTextColor={theme.text.light}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={submitComment}
              disabled={!newComment.trim()}
              activeOpacity={0.7}
              style={[s.commentSendBtn, { backgroundColor: newComment.trim() ? theme.primary : theme.border }]}
            >
              <Ionicons name="send" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // === REPORT MODAL ===
  const renderReportModal = () => (
    <Modal visible={showReportModal} animationType="fade" transparent>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowReportModal(false)}>
        <View style={[s.modalContent, { backgroundColor: theme.card }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: theme.text.primary }]}>Report Content</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.text.secondary, marginBottom: 16 }}>
            Select a reason for reporting this content:
          </Text>
          {REPORT_REASONS.map(reason => (
            <TouchableOpacity
              key={reason}
              style={[
                s.reportReasonBtn,
                {
                  borderColor: selectedReportReason === reason ? theme.primary : theme.border,
                  backgroundColor: selectedReportReason === reason ? `${theme.primary}10` : 'transparent',
                },
              ]}
              onPress={() => setSelectedReportReason(reason)}
            >
              <Ionicons
                name={selectedReportReason === reason ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={selectedReportReason === reason ? theme.primary : theme.text.light}
              />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: theme.text.primary }}>{reason}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: selectedReportReason ? theme.primary : theme.border, marginTop: 16 }]}
            onPress={submitReport}
            disabled={!selectedReportReason || submitting}
            activeOpacity={0.8}
          >
            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : (
              <Text style={s.submitBtnText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // === TESTIMONY MODAL ===
  const renderTestimonyModal = () => (
    <Modal visible={showTestimonyModal} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: theme.card }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: theme.text.primary }]}>Mark as Answered</Text>
            <TouchableOpacity onPress={() => setShowTestimonyModal(false)}>
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.text.secondary, marginBottom: 12 }}>
            Share your testimony about how this prayer was answered (optional):
          </Text>
          <TextInput
            style={[s.input, s.inputLarge, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
            placeholder="Share your testimony..."
            placeholderTextColor={theme.text.light}
            value={testimonyText}
            onChangeText={setTestimonyText}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: '#4CAF50' }]}
            onPress={submitTestimony}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : (
              <Text style={s.submitBtnText}>Mark as Answered</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={[s.headerLabel, { color: theme.text.light }]}>COMMUNITY</Text>
          <Text style={[s.headerTitle, { color: theme.text.primary }]}>Walk together</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { borderColor: theme.border }]}>
        {(['Feed', 'Prayers', 'Groups'] as Tab[]).map(tab => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && [s.tabActive, { borderBottomColor: theme.primary }]]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab); }}>
            <Text style={[s.tabText, { color: activeTab === tab ? theme.primary : theme.text.light }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort toggle for Feed */}
      {activeTab === 'Feed' && (
        <View style={[s.sortBar, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={[s.sortOption, sortMode === 'recent' && { backgroundColor: `${theme.primary}12` }]}
            onPress={() => setSortMode('recent')}
          >
            <Ionicons name="time-outline" size={14} color={sortMode === 'recent' ? theme.primary : theme.text.light} />
            <Text style={[s.sortOptionText, { color: sortMode === 'recent' ? theme.primary : theme.text.light }]}>Recent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.sortOption, sortMode === 'trending' && { backgroundColor: `${theme.primary}12` }]}
            onPress={() => setSortMode('trending')}
          >
            <Ionicons name="trending-up" size={14} color={sortMode === 'trending' ? theme.primary : theme.text.light} />
            <Text style={[s.sortOptionText, { color: sortMode === 'trending' ? theme.primary : theme.text.light }]}>Trending</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={theme.primary} size="large" />
      ) : (
        <FlatList
          data={activeTab === 'Feed' ? posts : activeTab === 'Prayers' ? prayers : groups}
          renderItem={activeTab === 'Feed' ? renderPost : activeTab === 'Prayers' ? renderPrayer : renderGroup as any}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {userId && (
        <Animated.View style={[s.fab, { transform: [{ scale: fabScale }], bottom: insets.bottom + 90 }]}>
          <TouchableOpacity onPress={openFab} activeOpacity={0.85}>
            <LinearGradient colors={[theme.primary, '#2A5A8A']} style={s.fabInner}>
              <Ionicons name="add" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modals */}
      {renderCreateModal('post', showPostModal, () => setShowPostModal(false), submitPost)}
      {renderCreateModal('prayer', showPrayerModal, () => setShowPrayerModal(false), submitPrayer)}
      {renderCreateModal('group', showGroupModal, () => setShowGroupModal(false), submitGroup)}
      {renderCommentsModal()}
      {renderReportModal()}
      {renderTestimonyModal()}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 2 },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, marginTop: 2 },

  tabBar: { flexDirection: 'row', marginHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // Sort bar
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortOptionText: { fontFamily: 'Inter_500Medium', fontSize: 13 },

  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold' },
  nameText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  timeText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  content: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, marginBottom: 10 },

  // Post image
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },

  verseCard: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  verseRef: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.9)' },

  // Reaction picker
  reactionPicker: {
    position: 'absolute', bottom: '100%', left: -10, flexDirection: 'row',
    borderRadius: 24, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    zIndex: 100, marginBottom: 8,
  },
  reactionPickerItem: { paddingHorizontal: 6, paddingVertical: 4 },
  reactionPickerEmoji: { fontSize: 24 },

  reactionBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  reactionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
  },
  reactionChipEmoji: { fontSize: 14 },
  reactionChipCount: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  footer: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(150,150,150,0.15)' },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerCount: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // Edit inline
  editInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', fontSize: 15, marginBottom: 8, minHeight: 60 },
  editCancelBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  editSaveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },

  prayBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  prayBtnText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1 },

  // Update / testimony
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  testimonyCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },

  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  groupInitial: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  joinBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 8 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', maxWidth: 250 },

  fab: { position: 'absolute', right: 20, zIndex: 50 },
  fabInner: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22 },

  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  typeChipText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontFamily: 'Inter_400Regular', fontSize: 15, marginBottom: 12 },
  inputLarge: { height: 120, textAlignVertical: 'top' },

  // Image picker
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, borderStyle: 'dashed' },
  imagePickerText: { fontFamily: 'Inter_500Medium', fontSize: 14, flex: 1 },
  imagePreview: { width: '100%', height: 150, borderRadius: 12, marginBottom: 12 },

  anonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  anonLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },

  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFF' },

  // Report
  reportReasonBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },

  // Comments
  commentsModal: { maxHeight: '70%' },
  commentsList: { maxHeight: 300, marginBottom: 8 },
  emptyComments: { alignItems: 'center', paddingVertical: 40 },
  commentItem: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  commentName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  commentTime: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  commentText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 2 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 14, maxHeight: 80 },
  commentSendBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
});
