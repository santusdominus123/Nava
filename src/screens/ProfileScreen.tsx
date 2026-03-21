import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { typography } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }: any) {
  const {
    theme,
    userName,
    setUserName,
    darkMode,
    toggleDarkMode,
    savedVerses,
    removeVerse,
    clearChat,
    signOut,
    language,
    changeLanguage,
    premiumStatus,
    currentStreak,
  } = useApp();
  const insets = useSafeAreaInsets();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  // Group Settings Helpers
  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>
      {title.toUpperCase()}
    </Text>
  );

  const SettingsRow = ({
    icon,
    color,
    title,
    subtitle,
    value,
    onPress,
    isSwitch,
    switchValue,
    onSwitchChange,
    destructive,
    last,
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
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.text.light} />
        )}
      </View>
    </TouchableOpacity>
  );

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingName(false);
  };

  const confirmClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to permanently delete all interactions with Bible AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            clearChat();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      ]
    );
  };

  const demoAlert = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} will be available in the next major update.`);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
          },
        },
      ]
    );
  };

  const handleReplayOnboarding = async () => {
    await AsyncStorage.setItem('hasFinishedOnboarding', JSON.stringify(false));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Onboarding Reset', 'Sign out and sign back in to see the onboarding experience again.');
  };

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
        {/* Profile Card (iOS Apple ID style) */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setEditingName(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradient.primary as any}
            style={styles.avatarWrap}
          >
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>

          <View style={styles.profileTextWrap}>
            <Text style={[styles.profileName, { color: theme.text.primary }]}>{userName}</Text>
            <Text style={[styles.profileSub, { color: theme.text.secondary }]}>Personal Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.text.light} />
        </TouchableOpacity>

        <SectionHeader title="Preferences" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="moon"
            color="#5A8DEE"
            title="Appearance"
            subtitle="Light, Dark, or System"
            isSwitch
            switchValue={darkMode}
            onSwitchChange={toggleDarkMode}
          />
          <SettingsRow
            icon="notifications"
            color="#FF3B30"
            title="Notifications"
            isSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
          />
          <SettingsRow
            icon="alarm"
            color="#34C759"
            title="Daily Devotional Reminder"
            value="8:00 AM"
            isSwitch
            switchValue={dailyReminder}
            onSwitchChange={setDailyReminder}
          />
          <SettingsRow
            icon="text"
            color="#007AFF"
            title="Text Size"
            value="Default"
            onPress={() => demoAlert('Typography settings')}
            last
          />
        </View>

        <SectionHeader title="Data & Privacy" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="bookmarks"
            color="#FF9500"
            title="Saved Verses"
            value={savedVerses.length.toString()}
            onPress={() => demoAlert('Saved Verses Manager')}
          />
          <SettingsRow
            icon="cloud-download"
            color="#5856D6"
            title="Export Data"
            onPress={() => demoAlert('Data export')}
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

        <SectionHeader title="About" />
        <View style={[styles.groupContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="star"
            color="#FFCC00"
            title="Rate the App"
            onPress={() => demoAlert('App Store redirect')}
          />
          <SettingsRow
            icon="help-buoy"
            color="#34C759"
            title="Help & Support"
            onPress={() => demoAlert('Support center')}
          />
          <SettingsRow
            icon="document-text"
            color="#8E8E93"
            title="Privacy Policy"
            onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
          />
          <SettingsRow
            icon="document"
            color="#8E8E93"
            title="Terms of Service"
            onPress={() => navigation.navigate('Legal', { type: 'terms' })}
          />
          <SettingsRow
            icon="information-circle"
            color="#8E8E93"
            title="App Version"
            value="1.0.0 (Portfolio)"
            last
          />
        </View>

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
            last
          />
        </View>

        {/* Footer Brand */}
        <View style={styles.footer}>
          <Ionicons name="sparkles" size={24} color={theme.border} />
          <Text style={[styles.footerText, { color: theme.text.light }]}>
            Crafted for reflection & peace.
          </Text>
        </View>
      </ScrollView>

      {/* Name Edit Modal */}
      <Modal visible={editingName} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
              <TouchableOpacity
                style={styles.modalBtnSpace}
                onPress={() => setEditingName(false)}
              >
                <Text style={[styles.modalBtnCancel, { color: theme.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSave, { backgroundColor: theme.primary }]}
                onPress={handleSaveName}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  content: {
    padding: 20,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
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
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    marginBottom: 4,
  },
  profileSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
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
  settingTextContent: {
    flex: 1,
  },
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

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 8,
  },

  // Editor Modal
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
});
