import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { typography } from '../theme/typography';
import { sendChatMessage } from '../services/chatService';
import { sendStreamingChatMessage } from '../services/streamingChat';
import { trackEvent, AnalyticsEvents } from '../services/analytics';
import { ChatMessage } from '../types';

export default function ChatScreen() {
  const { theme, chatHistory, addChatMessage, logActivity, premiumStatus, session } = useApp();
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLimitReached, setChatLimitReached] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const AI_DAILY_LIMIT_FREE = 5;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Check rate limit for free users
    if (!premiumStatus.isPremium && session?.user) {
      const todayMessages = chatHistory.filter(m => m.role === 'user').length;
      if (todayMessages >= AI_DAILY_LIMIT_FREE) {
        setChatLimitReached(true);
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addChatMessage(userMessage);
    setInput('');
    setLoading(true);

    // Log chat activity for streaks
    logActivity('chat');
    trackEvent(AnalyticsEvents.CHAT_MESSAGE_SENT, { messageLength: text.length });

    try {
      setStreamingText('');
      const streamingId = (Date.now() + 1).toString();

      await sendStreamingChatMessage(
        text,
        chatHistory,
        (_chunk, fullText) => {
          setStreamingText(fullText);
        },
        (fullText) => {
          setStreamingText('');
          const aiMessage: ChatMessage = {
            id: streamingId,
            role: 'assistant',
            content: fullText,
            timestamp: new Date(),
          };
          addChatMessage(aiMessage);
          setLoading(false);
        },
        (error) => {
          setStreamingText('');
          const errorMessage: ChatMessage = {
            id: streamingId,
            role: 'assistant',
            content: error || 'I apologize, but I am unable to respond right now. Please try again later.',
            timestamp: new Date(),
          };
          addChatMessage(errorMessage);
          setLoading(false);
        },
      );
    } catch {
      setStreamingText('');
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I am unable to respond right now. Please try again later.',
        timestamp: new Date(),
      };
      addChatMessage(errorMessage);
      setLoading(false);
    }
  };

  const suggestions = [
    { text: 'Explain Psalm 23', icon: 'book-outline' as const },
    { text: 'What does the Bible say about love?', icon: 'heart-outline' as const },
    { text: 'How should I pray?', icon: 'hand-left-outline' as const },
    { text: 'Tell me about faith', icon: 'sparkles-outline' as const },
  ];

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubbleWrap : styles.aiBubbleWrap,
        ]}
      >
        {isUser ? (
          <LinearGradient
            colors={[...theme.gradient.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.userBubble]}
          >
            <Text style={[typography.body, { color: '#FFFFFF' }]}>
              {item.content}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.aiBubble, { backgroundColor: theme.card }]}>
            <View style={styles.aiHeader}>
              <LinearGradient
                colors={['#C9A22730', '#C9A22710']}
                style={styles.aiAvatarSmall}
              >
                <Ionicons name="sparkles" size={12} color="#C9A227" />
              </LinearGradient>
              <Text style={[typography.caption, { color: theme.secondary, marginLeft: 6, fontFamily: 'Inter_600SemiBold' }]}>
                Bible AI
              </Text>
            </View>
            <Text style={[typography.body, { color: theme.text.primary, lineHeight: 26 }]}>
              {item.content}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <LinearGradient
        colors={[...theme.gradient.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubble-ellipses" size={20} color="rgba(255,255,255,0.9)" />
        </View>
        <View>
          <Text style={[typography.label, { color: '#FFFFFF', fontSize: 16 }]}>
            Bible AI Assistant
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Ask anything about scripture
          </Text>
        </View>
      </LinearGradient>

      {chatHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '10' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={44} color={theme.primary} />
          </View>
          <Text style={[typography.h3, { color: theme.text.primary, marginTop: 20 }]}>
            Ask anything about the Bible
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: theme.text.secondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
            ]}
          >
            I can help you understand scripture,{'\n'}explore themes, and answer questions.
          </Text>
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.text}
                style={[styles.suggestionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setInput(s.text)}
                activeOpacity={0.7}
              >
                <Ionicons name={s.icon} size={16} color={theme.primary} />
                <Text style={[typography.bodySmall, { color: theme.text.primary, marginLeft: 8, flex: 1 }]}>
                  {s.text}
                </Text>
                <Ionicons name="arrow-forward-outline" size={14} color={theme.text.light} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatHistory}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
        />
      )}

      {loading && streamingText ? (
        <View style={[styles.streamingBubble, { backgroundColor: theme.card }]}>
          <View style={styles.aiHeader}>
            <LinearGradient colors={['#C9A22730', '#C9A22710']} style={styles.aiAvatarSmall}>
              <Ionicons name="sparkles" size={12} color="#C9A227" />
            </LinearGradient>
            <Text style={[typography.caption, { color: theme.secondary, marginLeft: 6, fontFamily: 'Inter_600SemiBold' }]}>
              Bible AI
            </Text>
          </View>
          <Text style={[typography.body, { color: theme.text.primary, lineHeight: 26 }]}>
            {streamingText}
            <Text style={{ color: theme.primary }}>|</Text>
          </Text>
        </View>
      ) : loading ? (
        <View style={[styles.typingIndicator, { backgroundColor: theme.card }]}>
          <View style={styles.typingDots}>
            <ActivityIndicator size="small" color={theme.secondary} />
          </View>
          <Text style={[typography.caption, { color: theme.text.secondary, marginLeft: 8 }]}>
            Bible AI is thinking...
          </Text>
        </View>
      ) : null}

      {/* Rate Limit Banner */}
      {chatLimitReached && (
        <View style={[styles.rateLimitBanner, { backgroundColor: theme.secondary + '15', borderColor: theme.secondary + '30' }]}>
          <Ionicons name="lock-closed" size={16} color={theme.secondary} />
          <Text style={[styles.rateLimitText, { color: theme.text.primary }]}>
            Daily limit reached ({AI_DAILY_LIMIT_FREE} messages).
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
            <Text style={[styles.rateLimitLink, { color: theme.secondary }]}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text.primary }]}
            placeholder="Ask a question..."
            placeholderTextColor={theme.text.light}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={input.trim() ? [...theme.gradient.primary] : [theme.text.light + '30', theme.text.light + '20']}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#FFFFFF' : theme.text.light} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: { padding: 16, paddingBottom: 8 },
  messageBubble: {
    marginBottom: 16,
  },
  userBubbleWrap: {
    alignItems: 'flex-end',
  },
  aiBubbleWrap: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestions: {
    marginTop: 28,
    width: '100%',
    gap: 10,
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  streamingBubble: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    maxWidth: '82%',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  typingDots: {},
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rateLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  rateLimitText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    flex: 1,
  },
  rateLimitLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
});
