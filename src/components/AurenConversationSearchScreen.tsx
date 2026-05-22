import { ChevronLeft, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AurenConversation } from '../lib/aurenConversations';
import { colors } from '../theme';

type AurenConversationSearchScreenProps = {
  visible: boolean;
  conversations: AurenConversation[];
  loading?: boolean;
  onBack: () => void;
  onSelectConversation: (conversationId: string) => void;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatConversationDate(conversation: AurenConversation) {
  const rawDate = conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt;
  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function AurenConversationSearchScreen({
  visible,
  conversations,
  loading = false,
  onBack,
  onSelectConversation,
}: AurenConversationSearchScreenProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => conversation.title.toLowerCase().includes(normalizedQuery));
  }, [conversations, normalizedQuery]);

  function selectConversation(conversationId: string) {
    Keyboard.dismiss();
    onSelectConversation(conversationId);
  }

  if (!visible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to menu"
        >
          <ChevronLeft size={38} color={colors.text} strokeWidth={2.25} />
        </Pressable>

        <Text style={styles.headerTitle}>Search chats</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchRow}>
        <Search size={34} color={colors.icon} strokeWidth={1.95} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          placeholder="Search chats"
          placeholderTextColor="rgba(104,103,117,0.76)"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.divider} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        <Text style={styles.sectionTitle}>{normalizedQuery ? 'Results' : 'Recent'}</Text>

        {loading ? (
          <Text style={styles.emptyText}>Loading chats...</Text>
        ) : filteredConversations.length > 0 ? (
          <View style={styles.rows}>
            {filteredConversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                onPress={() => selectConversation(conversation.id)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {conversation.title}
                </Text>
                <Text style={styles.rowDate} numberOfLines={1}>
                  {formatConversationDate(conversation)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No chats found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: colors.background,
  },
  header: {
    height: 74,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 56,
    height: 56,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 20.2,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.22,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 56,
  },
  searchRow: {
    minHeight: 68,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 21.5,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: -0.26,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 22,
    backgroundColor: 'rgba(17,24,39,0.13)',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 36,
    paddingTop: 30,
    paddingBottom: 36,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  rows: {
    marginTop: 24,
    gap: 24,
  },
  row: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  rowPressed: {
    opacity: 0.55,
  },
  rowTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 19.5,
    lineHeight: 25,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  rowDate: {
    flexShrink: 0,
    minWidth: 66,
    color: colors.muted,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.16,
    textAlign: 'right',
  },
  emptyText: {
    marginTop: 24,
    color: colors.muted,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.14,
  },
  pressed: {
    opacity: 0.58,
  },
});
