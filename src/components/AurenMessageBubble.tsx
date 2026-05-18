import { StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme';
import type { AurenMessage } from './AurenMessageList';

type AurenMessageBubbleProps = {
  message: AurenMessage;
};

export function AurenMessageBubble({ message }: AurenMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser ? <Text style={styles.assistantLabel}>Auren</Text> : null}
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 14,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 13,
  },
  userBubble: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    ...shadows.tiny,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.04)',
  },
  assistantLabel: {
    marginBottom: 6,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  messageText: {
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.18,
  },
  userText: {
    color: colors.text,
    fontWeight: '500',
  },
  assistantText: {
    color: colors.text,
    fontWeight: '450',
  },
});
