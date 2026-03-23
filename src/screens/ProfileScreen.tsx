import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
  Linking,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleDailyReminder, cancelAllReminders } from '../services/pushNotifications';
import { clearCache, getSyncQueueSize } from '../services/offlineCache';
import { supabase } from '../utils/supabase';

export default function ProfileScreen({ navigation }: any) {
  const {
    theme,
    userName,
    setUserName,
    darkMode,
    toggleDarkMode,
    savedVerses,
    chatHistory,
    clearChat,
    signOut,
    language,
    changeLanguage,
    premiumStatus,
    currentStreak,
    weeklyStreaks,
    session,
  } = useApp();
  const insets = useSafeAreaInsets();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderHour, setReminderHour] = useState(8);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [notif, reminder, hour] = await Promise.all([
        AsyncStorage.getItem('notificationsEnabled'),
        AsyncStorage.getItem('dailyReminder'),
        AsyncStorage.getItem('reminderHour'),
      ]);
      if (notif !== null) setNotificationsEnabled(JSON.parse(notif));
      if (reminder !== null) setDailyReminder(JSON.parse(reminder));
      if (hour !== null) setReminderHour(JSON.parse(hour));

      const syncCount = await getSyncQueueSize();
      setPendingSyncCount(syncCount);

      if (session?.user?.created_at) {
        setMemberSince(new Date(session.user.created_at).toLocaleDateString('en', {
          year: 'numeric', month: 'long', day: 'numeric',
        }));
      }

      // Fetch avatar
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    } catch {}
  };

  // Helpers
  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>
      {title.toUpperCase()}
    </Text>
  );

  const SettingsRow = ({
    icon, color, title, subtitle, value, onPress, isSwitch,
    switchValue, onSwitchChange, destructive, last, badge,
  }: any) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { borderBottomColor: theme.border },
        last && { borderBottomWidth: 0 },
      ]}
      onPress={() => {
        if (isSwitch && onSwitchChange) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSwitchChange(!switchValue);
        } else if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      activeOpacity={isSwitch ? 1 : 0.6}
      disabled={!onPress && !isSwitch}
    >
      <View style={styles.settingRowLeft}>
        <View style={[styles.iconBox, { backgroundColor: destructive ? theme.error + '20' : color + '20' }]}>
          <Ionicons name={icon} size={20} color={destructive ? theme.error : color} />
        </View>
        <View style={styles.settingTextContent}>
          <Text style={[styles.settingTitle, { color: destructive ? theme.error : theme.text.primary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRowRight}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {value && <Text style={[styles.settingValue, { color: theme.text.light }]}>{value}</Text>}
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSwitchChange(val);
            }}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={'#FFFFFF'}
          />
        ) : !isSwitch && onPress ? (
          <Ionicons name="chevron-forward" size={20} color={theme.text.light} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  // Handlers
  const handleSaveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingName(false);
  };

  const handleChangeAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;
      if (!session?.user?.id) return;

      const uri = result.assets[0].uri;
      const ext = (uri.split('.').pop()?.toLowerCase()) || 'jpg';
      const fileName = `${session.user.id}/avatar.${ext}`;

      // React Native compatible upload using FormData
      const formData = new FormData();
      formData.append('', {
        uri: uri,
        name: `avatar.${ext}`,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, formData, {
          contentType: 'multipart/form-data',
          upsert: true,
        });

      if (uploadError) {
        Alert.alert('Error', 'Failed to upload avatar');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      setAvatarUrl(publicUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Analytics
      try {
        await supabase.from('analytics_events').insert({
          user_id: session.user.id, event_name: 'avatar_changed',
          event_data: {}, screen_name: 'ProfileScreen', platform: Platform.OS,
        });
      } catch {}
    } catch {
      Alert.alert('Error', 'Failed to update avatar');
    }
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(val));
    if (!val) {
      await cancelAllReminders();
    }
  };

  const handleToggleReminder = async (val: boolean) => {
    setDailyReminder(val);
    await AsyncStorage.setItem('dailyReminder', JSON.stringify(val));
    if (val) {
      await scheduleDailyReminder(reminderHour, 0);
    } else {
      await cancelAllReminders();
    }
  };

  const handleSetReminderHour = async (hour: number) => {
    setReminderHour(hour);
    setShowReminderPicker(false);
    await AsyncStorage.setItem('reminderHour', JSON.stringify(hour));
    if (dailyReminder) {
      await scheduleDailyReminder(hour, 0);
    }
    // Update profile on Supabase
    if (session?.user?.id) {
      await supabase.from('profiles').update({ reminder_hour: hour }).eq('id', session.user.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleChangeLanguage = async (lang: 'en' | 'id' | 'ar') => {
    changeLanguage(lang);
    setShowLanguagePicker(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmClearChat = () => {
    Alert.alert('Clear Chat History', 'Permanently delete all conversations with Bible AI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearChat();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will remove cached devotionals and reading plans. Data will re-download when online.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCache();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Done', 'Cache cleared successfully.');
        },
      },
    ]);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out Nava — an AI-powered Bible study companion! https://nava.app',
        title: 'Share Nava',
      });
    } catch {}
  };

  const handleExportData = async () => {
    try {
      const data = {
        profile: { name: userName, language, streak: currentStreak },
        savedVerses: savedVerses.map(v => ({ reference: v.verse.reference, text: v.verse.text })),
        chatMessages: chatHistory.length,
        exportDate: new Date().toISOString(),
      };
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Nava Data Export',
      });
    } catch {}
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await signOut();
        },
      },
    ]);
  };

  const handleReplayOnboarding = async () => {
    await AsyncStorage.setItem('hasFinishedOnboarding', JSON.stringify(false));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Onboarding Reset', 'Sign out and sign back in to see the onboarding again.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Please email support@nava.app to request account deletion.');
          },
        },
      ]
    );
  };

  const languageLabel: Record<string, string> = {
    en: 'English',
    id: 'Bahasa Indonesia',
    ar: 'العربية',
  };

  const reminderLabels = [
    { hour: 5, label: '5:00 AM' },
    { hour: 6, label: '6:00 AM' },
    { hour: 7, label: '7:00 AM' },
    { hour: 8, label: '8:00 AM' },
    { hour: 9, label: '9:00 AM' },
    { hour: 10, label: '10:00 AM' },
    { hour: 18, label: '6:00 PM' },
    { hour: 19, label: '7:00 PM' },
    { hour: 20, label: '8:00 PM' },
    { hour: 21, label: '9:00 PM' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setEditingName(true)}
          activeOpacity={0.8}
        >
          <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8} style={{ position: 'relative' }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatarWrap, { overflow: 'hidden' }]} />
            ) : (
              <LinearGradient colors={theme.gradient.primary as any} style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileTextWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.profileName, { color: theme.text.primary }]}>{userName}</Text>
              {premiumStatus.isPremium && (
                <LinearGradient
                  colors={['#C9A227', '#E8D48B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumBadge}
                >
                  <Ionicons name="diamond" size={10} color="#FFF" />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={[styles.profileSub, { color: theme.text.secondary }]}>
              {session?.user?.email || 'Personal Account'}
            </Text>
            {memberSince ? (
              <Text style={[styles.profileMeta, { color: theme.text.light }]}>
                Member since {memberSince}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.text.light} />
        </TouchableOpacity>

        {/* Streak & Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9500' }]}>{currentStreak}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Day Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{savedVerses.length}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Saved Verses</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{chatHistory.filter(m => m.role === 'user').length}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Questions</Text>
            </View>
          </View>
          {/* Weekly Streak Dots */}
          <View style={styles.weekRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const active = weeklyStreaks && weeklyStreaks[i] != null;
              return (
                <View key={i} style={styles.weekDayWrap}>
                  <View style={[
                    styles.weekDot,
                    { backgroundColor: active ? '#FF9500' : theme.border },
                  ]}>
                    {active && <Ionicons name="checkmark" size={10} color="#FFF" />}
                  </View>
                  <Text style={[styles.weekDayLabel, { color: theme.text.light }]}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Premium */}
        {!premiumStatus.isPremium && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Premium')}
          >
            <LinearGradient
              colors={['#1C3D5A', '#2A5A8A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.premiumCard, { borderColor: '#C9A22740' }]}
            >
              <View style={styles.premiumCardLeft}>
                <Ionicons name="diamond" size={24} color="#C9A227" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumSub}>Unlimited AI chat, exclusive features</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#C9A227" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Preferences */}
        <SectionHeader title="Preferences" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="moon"
            color="#5A8DEE"
            title="Dark Mode"
            subtitle={darkMode ? 'Dark theme active' : 'Light theme active'}
            isSwitch
            switchValue={darkMode}
            onSwitchChange={toggleDarkMode}
          />
          <SettingsRow
            icon="globe"
            color="#007AFF"
            title="Language"
            value={languageLabel[language] || 'English'}
            onPress={() => setShowLanguagePicker(true)}
          />
          <SettingsRow
            icon="text"
            color="#5856D6"
            title="Font Size"
            value="Default"
            onPress={() => Alert.alert('Font Size', 'Choose your preferred text size.', [
              { text: 'Small', onPress: () => {} },
              { text: 'Default', onPress: () => {} },
              { text: 'Large', onPress: () => {} },
            ])}
            last
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="notifications"
            color="#FF3B30"
            title="Push Notifications"
            subtitle="Receive app notifications"
            isSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={handleToggleNotifications}
          />
          <SettingsRow
            icon="alarm"
            color="#34C759"
            title="Daily Devotional Reminder"
            isSwitch
            switchValue={dailyReminder}
            onSwitchChange={handleToggleReminder}
          />
          {dailyReminder && (
            <SettingsRow
              icon="time"
              color="#FF9500"
              title="Reminder Time"
              value={`${reminderHour > 12 ? reminderHour - 12 : reminderHour}:00 ${reminderHour >= 12 ? 'PM' : 'AM'}`}
              onPress={() => setShowReminderPicker(true)}
              last
            />
          )}
        </View>

        {/* Data & Privacy */}
        <SectionHeader title="Data & Privacy" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="bookmarks"
            color="#FF9500"
            title="Saved Verses"
            value={savedVerses.length.toString()}
            onPress={() => navigation.navigate('VerseNotes')}
          />
          <SettingsRow
            icon="chatbubbles"
            color="#8B5CF6"
            title="Chat History"
            value={`${chatHistory.length} messages`}
            onPress={confirmClearChat}
          />
          <SettingsRow
            icon="cloud-download"
            color="#5856D6"
            title="Export My Data"
            subtitle="Share your saved data as JSON"
            onPress={handleExportData}
          />
          <SettingsRow
            icon="server"
            color="#007AFF"
            title="Clear Cache"
            subtitle="Remove cached offline data"
            onPress={handleClearCache}
            badge={pendingSyncCount > 0 ? `${pendingSyncCount} pending` : undefined}
          />
          <SettingsRow
            icon="trash-bin"
            color="#FF3B30"
            title="Clear Chat History"
            destructive
            onPress={confirmClearChat}
            last
          />
        </View>

        {/* About & Legal */}
        <SectionHeader title="About" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="share-social"
            color="#34C759"
            title="Share Nava"
            subtitle="Invite friends to the app"
            onPress={handleShareApp}
          />
          <SettingsRow
            icon="star"
            color="#FFCC00"
            title="Rate on App Store"
            onPress={() => {
              Linking.openURL('https://apps.apple.com/app/nava/id0000000000');
            }}
          />
          <SettingsRow
            icon="help-buoy"
            color="#34C759"
            title="Help & Support"
            onPress={() => Linking.openURL('mailto:support@nava.app')}
          />
          <SettingsRow
            icon="shield-checkmark"
            color="#007AFF"
            title="Privacy Policy"
            onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
          />
          <SettingsRow
            icon="document-text"
            color="#8E8E93"
            title="Terms of Service"
            onPress={() => navigation.navigate('Legal', { type: 'terms' })}
          />
          <SettingsRow
            icon="information-circle"
            color="#8E8E93"
            title="App Version"
            value="1.0.0 (Build 1)"
            last
          />
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="refresh"
            color="#007AFF"
            title="Replay Onboarding"
            subtitle="View the welcome walkthrough again"
            onPress={handleReplayOnboarding}
          />
          <SettingsRow
            icon="log-out"
            color="#FF3B30"
            title="Sign Out"
            destructive
            onPress={handleSignOut}
          />
          <SettingsRow
            icon="close-circle"
            color="#FF3B30"
            title="Delete Account"
            subtitle="Permanently remove your account"
            destructive
            onPress={handleDeleteAccount}
            last
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text.light }]}>Nava v1.0.0</Text>
          <Text style={[styles.footerTextSm, { color: theme.text.light }]}>
            Crafted for reflection & peace
          </Text>
        </View>
      </ScrollView>

      {/* Name Edit Modal */}
      <Modal visible={editingName} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Edit Profile Name</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text.primary, borderColor: theme.primary, backgroundColor: theme.background }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor={theme.text.light}
              autoFocus
              selectionColor={theme.primary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSpace} onPress={() => setEditingName(false)}>
                <Text style={[styles.modalBtnCancel, { color: theme.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: theme.primary }]} onPress={handleSaveName}>
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Language Picker Modal */}
      <Modal visible={showLanguagePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLanguagePicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Select Language</Text>
            {([
              { code: 'en', label: 'English', flag: '🇺🇸' },
              { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
              { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
            ] as const).map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  { borderColor: language === lang.code ? theme.primary : theme.border },
                  language === lang.code && { backgroundColor: theme.primary + '15' },
                ]}
                onPress={() => handleChangeLanguage(lang.code)}
              >
                <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: theme.text.primary }]}>{lang.label}</Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reminder Time Picker Modal */}
      <Modal visible={showReminderPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReminderPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Reminder Time</Text>
            <View style={styles.timeGrid}>
              {reminderLabels.map((item) => (
                <TouchableOpacity
                  key={item.hour}
                  style={[
                    styles.timeOption,
                    { borderColor: reminderHour === item.hour ? theme.primary : theme.border },
                    reminderHour === item.hour && { backgroundColor: theme.primary + '15' },
                  ]}
                  onPress={() => handleSetReminderHour(item.hour)}
                >
                  <Text style={[
                    styles.timeLabel,
                    { color: reminderHour === item.hour ? theme.primary : theme.text.primary },
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 34,
    letterSpacing: -0.5,
  },
  content: { padding: 20 },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 28,
    color: '#FFF',
  },
  profileTextWrap: { flex: 1 },
  profileName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
  },
  profileSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  profileMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  premiumBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#FFF',
    letterSpacing: 1,
  },

  // Stats Card
  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: { width: 1, height: 40 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  weekDayWrap: { alignItems: 'center', gap: 4 },
  weekDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },

  // Premium CTA
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
  },
  premiumCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  premiumTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
  premiumSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // Groups
  sectionHeader: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 16,
  },
  groupContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContent: { flex: 1 },
  settingTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  settingSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#FFF',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
  footerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  footerTextSm: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtnSpace: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  modalBtnSave: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnSaveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFF',
  },

  // Language Picker
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 12,
  },
  langLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    flex: 1,
  },

  // Time Picker
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: '28%',
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  avatarEditBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: '#5A8DEE',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
