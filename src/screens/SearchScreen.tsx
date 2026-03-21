import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { typography } from '../theme/typography';
import { searchVerses } from '../data/verses';
import { Verse } from '../types';

export default function SearchScreen() {
  const { theme, saveVerse, isVerseSaved } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Verse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim().length > 0) {
      setResults(searchVerses(text));
      setHasSearched(true);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const handleSave = (verse: Verse) => {
    if (!isVerseSaved(verse.reference)) {
      saveVerse(verse);
      Alert.alert('Saved', `${verse.reference} has been saved.`);
    }
  };

  const renderVerse = ({ item }: { item: Verse }) => {
    const saved = isVerseSaved(item.reference);
    return (
      <View style={[styles.verseCard, { backgroundColor: theme.card }]}>
        <View style={styles.verseHeader}>
          <View style={[styles.verseRefBadge, { backgroundColor: theme.primary + '10' }]}>
            <Ionicons name="book-outline" size={14} color={theme.primary} />
            <Text style={[typography.label, { color: theme.primary, marginLeft: 6 }]}>
              {item.reference}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleSave(item)}
            style={[styles.bookmarkBtn, { backgroundColor: saved ? theme.secondary + '15' : 'transparent' }]}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? theme.secondary : theme.text.light}
            />
          </TouchableOpacity>
        </View>
        <Text style={[typography.body, { color: theme.text.secondary, marginTop: 12, lineHeight: 26 }]}>
          "{item.text}"
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.text.light} />
        <TextInput
          style={[styles.searchInput, { color: theme.text.primary }]}
          placeholder="Search verses (e.g. love, faith, John)"
          placeholderTextColor={theme.text.light}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={20} color={theme.text.light} />
          </TouchableOpacity>
        )}
      </View>

      {!hasSearched ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '10' }]}>
            <Ionicons name="search-outline" size={48} color={theme.primary} />
          </View>
          <Text style={[typography.h3, { color: theme.text.primary, marginTop: 20 }]}>
            Search Bible Verses
          </Text>
          <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 8, textAlign: 'center', lineHeight: 22 }]}>
            Try "love", "faith", "hope", or a book name
          </Text>
          <View style={styles.quickTags}>
            {['Love', 'Faith', 'Hope', 'Peace', 'John'].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.quickTag, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => handleSearch(tag)}
                activeOpacity={0.7}
              >
                <Text style={[typography.caption, { color: theme.primary, fontFamily: 'Inter_600SemiBold' }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.text.light + '15' }]}>
            <Ionicons name="document-text-outline" size={48} color={theme.text.light} />
          </View>
          <Text style={[typography.h3, { color: theme.text.primary, marginTop: 20 }]}>
            No results found
          </Text>
          <Text style={[typography.bodySmall, { color: theme.text.secondary, marginTop: 8 }]}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderVerse}
          keyExtractor={(item) => item.reference}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.resultHeader}>
              <LinearGradient
                colors={[...theme.gradient.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resultBadge}
              >
                <Text style={styles.resultBadgeText}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </Text>
              </LinearGradient>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  clearBtn: { padding: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  resultHeader: { marginBottom: 16 },
  resultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  verseCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verseRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  quickTag: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});
