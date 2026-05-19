import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme';
import { AurenMarkdownText } from './AurenMarkdownText';
import type { AurenMessage } from './AurenMessageList';

type AurenMessageBubbleProps = {
  message: AurenMessage;
};

export function AurenMessageBubble({ message }: AurenMessageBubbleProps) {
  const isUser = message.role === 'user';
  const hasAttachments = Boolean(message.images?.length);

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantMessage, hasAttachments && styles.userBubbleWithAttachment]}>
        {!isUser ? <Text style={styles.assistantLabel}>Auren</Text> : null}

        {isUser && hasAttachments ? (
          <View style={styles.attachmentStack}>
            {message.images?.map((attachment) => (
              <Image key={attachment.id} source={{ uri: attachment.uri }} style={styles.attachmentPreview} />
            ))}
          </View>
        ) : null}

        {isUser ? (
          <Text style={[styles.messageText, styles.userText, hasAttachments && styles.userTextAfterAttachment]}>{message.content}</Text>
        ) : (
          <AurenMarkdownText>{message.content}</AurenMarkdownText>
        )}
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
  },
  userBubble: {
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 13,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    ...shadows.tiny,
  },
  userBubbleWithAttachment: {
    maxWidth: '76%',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 13,
  },
  assistantMessage: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  assistantLabel: {
    marginBottom: 6,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  attachmentStack: {
    gap: 8,
  },
  attachmentPreview: {
    width: 226,
    height: 170,
    borderRadius: 18,
    backgroundColor: colors.disabled,
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
  userTextAfterAttachment: {
    marginTop: 10,
    paddingHorizontal: 9,
  },
});
