import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Image, Share, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';
import { createGroupInviteLink } from '../utils/deepLinking';

interface GroupData {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  invite_code: string;
  member_count: number;
  created_by: string;
  is_public: boolean;
  created_at: string;
}

interface MemberData {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles: { name: string; avatar_url?: string } | null;
}

export default function GroupSettingsScreen({ route, navigation }: any) {
  const { groupId, groupColor } = route.params;
  const { theme, session, darkMode } = useApp();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [copied, setCopied] = useState(false);

  const userId = session?.user?.id;
  const color = groupColor || theme.primary;
  const isAdmin = members.some(m => m.user_id === userId && m.role === 'admin');
  const isCreator = group?.created_by === userId;
  const myMembership = members.find(m => m.user_id === userId);

  const fetchData = useCallback(async () => {
    try {
      const [groupRes, membersRes] = await Promise.all([
        supabase.from('prayer_groups').select('*').eq('id', groupId).single(),
        supabase.from('prayer_group_members').select('*, profiles(name, avatar_url)').eq('group_id', groupId).order('joined_at', { ascending: true }),
      ]);
      if (groupRes.data) {
        setGroup(groupRes.data);
        setEditName(groupRes.data.name);
        setEditDesc(groupRes.data.description || '');
      }
      if (membersRes.data) setMembers(membersRes.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveEdit = async () => {
    if (!editName.trim() || !group) return;
    setSaving(true);
    try {
      await supabase.from('prayer_groups').update({
        name: editName.trim(),
        description: editDesc.trim(),
      }).eq('id', groupId);
      setGroup({ ...group, name: editName.trim(), description: editDesc.trim() });
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    if (!isAdmin) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() || 'jpg';
      const fileName = `${groupId}/avatar_${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('group-avatars').upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('group-avatars').getPublicUrl(fileName);
      await supabase.from('prayer_groups').update({ avatar_url: urlData.publicUrl }).eq('id', groupId);
      setGroup(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : prev);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const copyInviteLink = async () => {
    if (!group?.invite_code) return;
    const link = createGroupInviteLink(group.invite_code);
    await Clipboard.setStringAsync(link);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInviteLink = async () => {
    if (!group?.invite_code) return;
    const link = createGroupInviteLink(group.invite_code);
    try {
      await Share.share({
        message: `Join "${group.name}" on Nava!\n${link}`,
      });
    } catch {}
  };

  const removeMember = (member: MemberData) => {
    const memberName = member.profiles?.name || 'this member';
    Alert.alert('Remove Member', `Remove ${memberName} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await supabase.from('prayer_group_members').delete().eq('id', member.id);
            setMembers(prev => prev.filter(m => m.id !== member.id));
            setGroup(prev => prev ? { ...prev, member_count: Math.max(prev.member_count - 1, 0) } : prev);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const promoteMember = (member: MemberData) => {
    const memberName = member.profiles?.name || 'this member';
    Alert.alert('Make Admin', `Make ${memberName} an admin?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          try {
            await supabase.from('prayer_group_members').update({ role: 'admin' }).eq('id', member.id);
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: 'admin' } : m));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Failed to update role');
          }
        },
      },
    ]);
  };

  const leaveGroup = () => {
    const adminCount = members.filter(m => m.role === 'admin').length;
    const isLastAdmin = isAdmin && adminCount === 1 && members.length > 1;

    Alert.alert(
      'Leave Group',
      isLastAdmin
        ? 'You are the only admin. Please promote another member to admin before leaving, or the group will have no admin.'
        : 'Are you sure you want to leave this group?',
      isLastAdmin
        ? [{ text: 'OK' }]
        : [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave', style: 'destructive', onPress: async () => {
              try {
                if (myMembership) {
                  await supabase.from('prayer_group_members').delete().eq('id', myMembership.id);
                }
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.popToTop();
              } catch {
                Alert.alert('Error', 'Failed to leave group');
              }
            },
          },
        ],
    );
  };

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={{ marginTop: 100 }} color={color} size="large" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[s.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[s.sectionTitle, { color: theme.text.primary }]}>Group not found</Text>
      </View>
    );
  }

  const inviteLink = createGroupInviteLink(group.invite_code);

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 4, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text.primary }]}>Group Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={color} />}
      >
        {/* Group Info Card */}
        <View style={[s.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity onPress={pickAvatar} disabled={!isAdmin || uploadingAvatar} activeOpacity={0.7}>
            {group.avatar_url ? (
              <Image source={{ uri: group.avatar_url }} style={[s.avatarLarge, { borderColor: `${color}30` }]} />
            ) : (
              <View style={[s.avatarLarge, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={color} />
                ) : (
                  <Text style={[s.avatarInitial, { color }]}>{group.name[0]?.toUpperCase()}</Text>
                )}
              </View>
            )}
            {isAdmin && !uploadingAvatar && (
              <View style={[s.cameraIcon, { backgroundColor: color }]}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          {editing ? (
            <View style={s.editSection}>
              <TextInput
                style={[s.editInput, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Group name"
                placeholderTextColor={theme.text.light}
              />
              <TextInput
                style={[s.editInput, s.editInputLarge, { color: theme.text.primary, borderColor: theme.border, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Description (optional)"
                placeholderTextColor={theme.text.light}
                multiline
                textAlignVertical="top"
              />
              <View style={s.editActions}>
                <TouchableOpacity style={[s.editBtn, { borderColor: theme.border }]} onPress={() => { setEditing(false); setEditName(group.name); setEditDesc(group.description || ''); }}>
                  <Text style={[s.editBtnText, { color: theme.text.secondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.editBtn, { backgroundColor: color }]} onPress={saveEdit} disabled={saving}>
                  {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={[s.editBtnText, { color: '#FFF' }]}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[s.groupName, { color: theme.text.primary }]}>{group.name}</Text>
              {group.description ? <Text style={[s.groupDesc, { color: theme.text.secondary }]}>{group.description}</Text> : null}
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Ionicons name="people" size={14} color={theme.text.light} />
                  <Text style={[s.metaText, { color: theme.text.light }]}>{group.member_count} members</Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={theme.text.light} />
                  <Text style={[s.metaText, { color: theme.text.light }]}>Created {new Date(group.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              {isAdmin && (
                <TouchableOpacity style={[s.editGroupBtn, { borderColor: color }]} onPress={() => setEditing(true)}>
                  <Ionicons name="create-outline" size={16} color={color} />
                  <Text style={[s.editGroupBtnText, { color }]}>Edit Group Info</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Invite Link */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: theme.text.primary }]}>Invite Link</Text>
          <View style={[s.inviteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[s.linkBox, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}>
              <Ionicons name="link" size={16} color={color} />
              <Text style={[s.linkText, { color: theme.text.secondary }]} numberOfLines={1}>{inviteLink}</Text>
            </View>
            <View style={s.inviteActions}>
              <TouchableOpacity style={[s.inviteBtn, { backgroundColor: copied ? '#4CAF50' : `${color}12` }]} onPress={copyInviteLink} activeOpacity={0.7}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? '#FFF' : color} />
                <Text style={[s.inviteBtnText, { color: copied ? '#FFF' : color }]}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.inviteBtn, { backgroundColor: color }]} onPress={shareInviteLink} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={18} color="#FFF" />
                <Text style={[s.inviteBtnText, { color: '#FFF' }]}>Share</Text>
              </TouchableOpacity>
            </View>
            <Text style={[s.inviteHint, { color: theme.text.light }]}>
              Anyone with this link can join the group
            </Text>
          </View>
        </View>

        {/* Members */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.text.primary }]}>Members</Text>
            <Text style={[s.sectionCount, { color: theme.text.light }]}>{members.length}</Text>
          </View>
          <View style={[s.membersCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {members.map((member, idx) => {
              const name = member.profiles?.name || 'Anonymous';
              const init = name[0].toUpperCase();
              const isSelf = member.user_id === userId;
              const memberIsAdmin = member.role === 'admin';

              return (
                <View key={member.id} style={[s.memberRow, idx < members.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
                  {member.profiles?.avatar_url ? (
                    <Image source={{ uri: member.profiles.avatar_url }} style={s.memberAvatar} />
                  ) : (
                    <View style={[s.memberAvatar, { backgroundColor: `${color}15` }]}>
                      <Text style={[s.memberAvatarText, { color }]}>{init}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={s.memberNameRow}>
                      <Text style={[s.memberName, { color: theme.text.primary }]}>
                        {name}{isSelf ? ' (You)' : ''}
                      </Text>
                      {memberIsAdmin && (
                        <View style={[s.roleBadge, { backgroundColor: `${color}15` }]}>
                          <Ionicons name="shield-checkmark" size={10} color={color} />
                          <Text style={[s.roleText, { color }]}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[s.memberJoined, { color: theme.text.light }]}>
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {isAdmin && !isSelf && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(name, 'Choose an action', [
                          { text: 'Cancel', style: 'cancel' },
                          ...(!memberIsAdmin ? [{ text: 'Make Admin', onPress: () => promoteMember(member) }] : []),
                          { text: 'Remove', style: 'destructive' as const, onPress: () => removeMember(member) },
                        ]);
                      }}
                      style={s.memberAction}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color={theme.text.light} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={s.section}>
          <TouchableOpacity style={[s.dangerBtn, { borderColor: '#E5393520' }]} onPress={leaveGroup} activeOpacity={0.7}>
            <Ionicons name="exit-outline" size={20} color="#E53935" />
            <Text style={s.dangerBtnText}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },

  infoCard: { margin: 16, borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center' },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, marginBottom: 16 },
  avatarInitial: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32 },
  cameraIcon: { position: 'absolute', bottom: 14, right: -4, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  groupName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, textAlign: 'center', marginBottom: 4 },
  groupDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  editGroupBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  editGroupBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  editSection: { width: '100%', marginTop: 8 },
  editInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontFamily: 'Inter_400Regular', fontSize: 15, marginBottom: 10 },
  editInputLarge: { height: 80, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  editBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 10 },
  sectionCount: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 10 },

  inviteCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginBottom: 12 },
  linkText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  inviteActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  inviteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  inviteBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  inviteHint: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', marginTop: 4 },

  membersCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  memberJoined: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  memberAction: { padding: 8 },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
  dangerBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#E53935' },
});
