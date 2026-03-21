import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabase';

const HIGHLIGHT_COLORS = ['#C9A227', '#5A8DEE', '#4CAF50', '#E53935', '#8B5CF6'];

interface VerseNote {
  id: string;
  user_id: string;
  verse_reference: string;
  verse_text: string;
  note: string;
  highlight_color: string;
  created_at: string;
  updated_at?: string;
}

export async function addVerseNote(
  userId: string,
  verseReference: string,
  verseText: string,
  note: string,
  highlightColor: string = '#C9A227'
) {
  const { data, error } = await supabase.from('verse_notes').insert({
    user_id: userId,
    verse_reference: verseReference,
    verse_text: verseText,
    note,
    highlight_color: highlightColor,
  });

  if (error) throw error;
  return data;
}

function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
}

export default function VerseNotesScreen({ navigation }: any) {
  const { theme, session } = useApp();
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<VerseNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('verse_notes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openEditModal = (note: VerseNote) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingNote(note);
    setNoteText(note.note);
    setSelectedColor(note.highlight_color);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
    setNoteText('');
    setSelectedColor(HIGHLIGHT_COLORS[0]);
  };

  const saveNote = async () => {
    if (!editingNote || !session?.user?.id) return;
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error } = await supabase
        .from('verse_notes')
        .upsert({
          id: editingNote.id,
          user_id: session.user.id,
          verse_reference: editingNote.verse_reference,
          verse_text: editingNote.verse_text,
          note: noteText,
          highlight_color: selectedColor,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchNotes();
      closeModal();
    } catch (err) {
      console.error('Error saving note:', err);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = (noteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('verse_notes')
                .delete()
                .eq('id', noteId);

              if (error) throw error;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await fetchNotes();
            } catch (err) {
              console.error('Error deleting note:', err);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(theme, insets);

  const renderNoteCard = ({ item }: { item: VerseNote }) => (
    <View style={[styles.noteCard, { borderLeftColor: item.highlight_color }]}>
      <View style={styles.noteCardHeader}>
        <View style={[styles.verseBadge, { backgroundColor: item.highlight_color + '20' }]}>
          <Text style={[styles.verseBadgeText, { color: item.highlight_color }]}>
            {item.verse_reference}
          </Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={18} color={theme.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteNote(item.id)}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.verseText} numberOfLines={2}>
        {item.verse_text}
      </Text>

      {item.note ? (
        <Text style={styles.noteTextContent} numberOfLines={3}>
          {item.note}
        </Text>
      ) : null}

      <Text style={styles.dateText}>{formatRelativeDate(item.created_at)}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={64} color={theme.text.light} />
      </View>
      <Text style={styles.emptyTitle}>No Notes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start highlighting verses to see them here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradient.warm}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Notes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Edit Note Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'Add Note'}
            </Text>

            {/* Verse Reference Badge */}
            {editingNote && (
              <View
                style={[
                  styles.modalVerseBadge,
                  { backgroundColor: selectedColor + '20' },
                ]}
              >
                <Text style={[styles.modalVerseBadgeText, { color: selectedColor }]}>
                  {editingNote.verse_reference}
                </Text>
              </View>
            )}

            {/* Verse Text */}
            {editingNote && (
              <Text style={styles.modalVerseText} numberOfLines={3}>
                {editingNote.verse_text}
              </Text>
            )}

            {/* Color Picker */}
            <View style={styles.colorPickerRow}>
              {HIGHLIGHT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedColor(color);
                  }}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorCircleSelected,
                    selectedColor === color && { borderColor: color },
                  ]}
                />
              ))}
            </View>

            {/* Note Input */}
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write your thoughts..."
              placeholderTextColor={theme.text.light}
              multiline
              textAlignVertical="top"
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveNote}
                style={[styles.saveButton, { backgroundColor: theme.secondary }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function createStyles(theme: any, insets: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + 8,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: theme.text.primary,
    },
    headerSpacer: {
      width: 40,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // List
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: insets.bottom + 20,
      flexGrow: 1,
    },

    // Note Card
    noteCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      borderLeftWidth: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    },
    noteCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    verseBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
    },
    verseBadgeText: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
    },
    noteActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionButton: {
      padding: 4,
    },
    verseText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      fontStyle: 'italic',
      color: theme.text.secondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    noteTextContent: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: theme.text.primary,
      lineHeight: 21,
      marginBottom: 8,
    },
    dateText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: theme.text.light,
      marginTop: 4,
    },

    // Empty State
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingTop: 60,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 22,
      fontFamily: 'PlayfairDisplay_600SemiBold',
      color: theme.text.primary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: theme.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    modalCard: {
      width: '88%',
      maxHeight: '80%',
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 22,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: theme.text.primary,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalVerseBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 12,
    },
    modalVerseBadgeText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    modalVerseText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      fontStyle: 'italic',
      color: theme.text.secondary,
      lineHeight: 20,
      marginBottom: 18,
    },

    // Color Picker
    colorPickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 18,
    },
    colorCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    colorCircleSelected: {
      borderWidth: 3,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
      transform: [{ scale: 1.15 }],
    },

    // Note Input
    noteInput: {
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 16,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: theme.text.primary,
      minHeight: 120,
      maxHeight: 200,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },

    // Buttons
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.background,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelButtonText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: theme.text.secondary,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: '#FFFFFF',
    },
  });
}
