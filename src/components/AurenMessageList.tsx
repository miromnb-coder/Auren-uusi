import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
};

export function AurenMessageList({ messages, thinking = false }: AurenMessageListProps) {
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [messages.length, thinking]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
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
    paddingBottom: 190,
  },
  messagesStack: {
    width: '100%',
  },
});
