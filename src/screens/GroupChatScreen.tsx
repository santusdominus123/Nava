import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';

interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  user_name?: string;
  content?: string;
  image_url?: string;
  created_at: string;
}

function isAudioUrl(url?: string): boolean {
  if (!url) return false;
  return url.endsWith('.m4a') || url.endsWith('.mp4') || url.endsWith('.caf') || url.includes('voice-notes');
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

function formatDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Audio message player component
function AudioPlayer({
  uri,
  isMe,
  color,
  theme,
}: {
  uri: string;
  isMe: boolean;
  color: string;
  theme: any;
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      if (status.didJustFinish) {
        setPlaying(false);
        setPosition(0);
      }
    }
  };

  const togglePlayback = async () => {
    try {
      if (sound) {
        if (playing) {
          await sound.pauseAsync();
          setPlaying(false);
        } else {
          // If finished, replay from start
          if (position >= duration && duration > 0) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          setPlaying(true);
        }
      } else {
        setLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setPlaying(true);
        setLoading(false);
      }
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Could not play audio');
    }
  };

  const progress = duration > 0 ? position / duration : 0;
  const textColor = isMe ? 'rgba(255,255,255,0.9)' : theme.text.secondary;
  const barBg = isMe ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)';
  const barFill = isMe ? 'rgba(255,255,255,0.8)' : color;

  return (
    <View style={audioStyles.container}>
      <TouchableOpacity onPress={togglePlayback} style={audioStyles.playBtn} activeOpacity={0.7}>
        {loading ? (
          <ActivityIndicator size="small" color={isMe ? '#FFF' : color} />
        ) : (
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={20}
            color={isMe ? '#FFF' : color}
          />
        )}
      </TouchableOpacity>
      <View style={audioStyles.waveformArea}>
        <View style={[audioStyles.progressBar, { backgroundColor: barBg }]}>
          <View style={[audioStyles.progressFill, { backgroundColor: barFill, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[audioStyles.durationText, { color: textColor }]}>
          {duration > 0 ? formatDuration(playing ? position : duration) : '0:00'}
        </Text>
      </View>
    </View>
  );
}

const audioStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
    paddingVertical: 4,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  waveformArea: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  durationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});

export default function GroupChatScreen({ route, navigation }: any) {
  const { groupId, groupName, groupColor } = route.params;
  const { theme, session, userName, darkMode } = useApp();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = session?.user?.id;
  const color = groupColor || theme.primary;

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(200);
      setMessages(data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMessages();
    // Subscribe to new messages
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as GroupMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const sendMessage = async (content?: string, imageUrl?: string) => {
    if (!userId) return;
    if (!content?.trim() && !imageUrl) return;

    const tempMsg: GroupMessage = {
      id: Date.now().toString(),
      group_id: groupId,
      user_id: userId,
      user_name: userName,
      content: content?.trim(),
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await supabase.from('group_messages').insert({
        group_id: groupId,
        user_id: userId,
        user_name: userName,
        content: content?.trim() || null,
        image_url: imageUrl || null,
      });
    } catch {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    setSending(true);
    sendMessage(text.trim()).finally(() => setSending(false));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() || 'jpg';
      const fileName = `${groupId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      await sendMessage(undefined, urlData.publicUrl);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  // === VOICE RECORDING ===
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow microphone access to send voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) return;

      // Don't send very short recordings (less than 1 second)
      if (recordingDuration < 1) {
        setRecordingDuration(0);
        return;
      }

      setUploading(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const fileName = `${groupId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.m4a`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, blob, { contentType: 'audio/m4a', upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(fileName);

      await sendMessage(undefined, urlData.publicUrl);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not send voice note');
    } finally {
      setUploading(false);
      setRecordingDuration(0);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    setRecordingDuration(0);

    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch {}
  };

  const renderMessage = ({ item, index }: { item: GroupMessage; index: number }) => {
    const isMe = item.user_id === userId;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showName = !isMe && prevMsg?.user_id !== item.user_id;
    const init = (item.user_name || 'A')[0].toUpperCase();
    const isAudio = isAudioUrl(item.image_url);

    return (
      <View style={[st.msgRow, isMe && st.msgRowMe]}>
        {!isMe && (
          <View style={st.msgAvatarWrap}>
            {showName ? (
              <View style={[st.msgAvatar, { backgroundColor: `${color}20` }]}>
                <Text style={[st.msgAvatarText, { color }]}>{init}</Text>
              </View>
            ) : <View style={st.msgAvatarSpacer} />}
          </View>
        )}
        <View style={[
          st.bubble,
          isMe
            ? [st.bubbleMe, { backgroundColor: color }]
            : [st.bubbleOther, { backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#F0F2F5' }],
        ]}>
          {showName && (
            <Text style={[st.bubbleName, { color }]}>{item.user_name || 'Anonymous'}</Text>
          )}
          {item.image_url && !isAudio && (
            <Image source={{ uri: item.image_url }} style={st.msgImage} resizeMode="cover" />
          )}
          {item.image_url && isAudio && (
            <AudioPlayer uri={item.image_url} isMe={isMe} color={color} theme={theme} />
          )}
          {item.content ? (
            <Text style={[st.bubbleText, { color: isMe ? '#FFF' : theme.text.primary }]}>
              {item.content}
            </Text>
          ) : null}
          <Text style={[st.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : theme.text.light }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const showMicButton = !text.trim() && !isRecording;
  const showSendButton = text.trim().length > 0;

  return (
    <View style={[st.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 4, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
          onPress={() => navigation.navigate('GroupSettings', { groupId, groupName, groupColor: color })}
          activeOpacity={0.7}
        >
          <View style={[st.headerIcon, { backgroundColor: `${color}15` }]}>
            <Text style={[st.headerInitial, { color }]}>{(groupName || 'G')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.headerTitle, { color: theme.text.primary }]} numberOfLines={1}>{groupName}</Text>
            <Text style={[st.headerSub, { color: theme.text.light }]}>Tap for group info</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupSettings', { groupId, groupName, groupColor: color })}
          style={{ padding: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={color} size="large" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[st.msgList, { paddingBottom: 10 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.text.light} />
              <Text style={[st.emptyTitle, { color: theme.text.primary }]}>No messages yet</Text>
              <Text style={[st.emptySub, { color: theme.text.secondary }]}>Start the conversation!</Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View style={[st.inputBar, { paddingBottom: insets.bottom + 8, backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {isRecording ? (
            // Recording UI
            <View style={st.recordingBar}>
              <TouchableOpacity onPress={cancelRecording} style={st.cancelRecordBtn} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={28} color="#E53935" />
              </TouchableOpacity>
              <View style={st.recordingIndicator}>
                <View style={[st.recordingDot, { backgroundColor: '#E53935' }]} />
                <Text style={[st.recordingTime, { color: theme.text.primary }]}>
                  {formatDuration(recordingDuration * 1000)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={stopRecordingAndSend}
                activeOpacity={0.7}
                style={[st.sendBtn, { backgroundColor: color }]}
              >
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            // Normal input UI
            <>
              <TouchableOpacity onPress={pickImage} style={st.imgBtn} activeOpacity={0.7} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator size="small" color={color} />
                ) : (
                  <Ionicons name="image-outline" size={24} color={color} />
                )}
              </TouchableOpacity>
              <TextInput
                style={[st.textInput, {
                  color: theme.text.primary,
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#F0F2F5',
                }]}
                placeholder="Type a message..."
                placeholderTextColor={theme.text.light}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={2000}
              />
              {showSendButton ? (
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={sending}
                  activeOpacity={0.7}
                  style={[st.sendBtn, { backgroundColor: color }]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFF" />
                  )}
                </TouchableOpacity>
              ) : showMicButton ? (
                <TouchableOpacity
                  onPress={startRecording}
                  activeOpacity={0.7}
                  style={[st.sendBtn, { backgroundColor: color }]}
                  disabled={uploading}
                >
                  <Ionicons name="mic" size={20} color="#FFF" />
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, paddingHorizontal: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 4 },
  headerIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerInitial: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },

  // Messages
  msgList: { paddingHorizontal: 12, paddingTop: 12 },
  msgRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatarWrap: { width: 32, marginRight: 6 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  msgAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  msgAvatarSpacer: { width: 28 },

  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 2 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  bubbleName: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginBottom: 2 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4, textAlign: 'right' },

  msgImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },

  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingTop: 10, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  imgBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 15, maxHeight: 100, minHeight: 40 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Recording
  recordingBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelRecordBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingTime: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 100, gap: 8 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginTop: 8 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14 },
});
