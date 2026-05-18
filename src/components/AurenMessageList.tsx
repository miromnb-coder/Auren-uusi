import { useEffect, useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AurenMessageBubble } from './AurenMessageBubble';
import { AurenThinkingBubble } from './AurenThinkingBubble';

export type AurenMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AurenMessageListProps = {
  messages: AurenMessage[];
  thinking?: boolean;
  bottomInset?: number;
  onScrollBeginDrag?: () => void;
};

export function AurenMessageList({ messages, thinking = false, bottomInset = 190, onScrollBeginDrag }: AurenMessageListProps) {
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [messages.length, thinking, bottomInset]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      onScrollBeginDrag={onScrollBeginDrag}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.messagesStack}>
        {messages.map((message) => (
          <AurenMessageBubble key={message.id} message={message} />
        ))}
        {thinking ? <AurenThinkingBubble /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 28,
  },
  messagesStack: {
    width: '100%',
  },
});
