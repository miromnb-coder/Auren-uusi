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

  if (isUser) {
    return (
      <View style={[styles.row, styles.userRow]}>
        <View style={styles.userMessageGroup}>
          {hasAttachments ? (
            <View style={styles.attachmentStack}>
              {message.images?.map((attachment) => (
                <Image key={attachment.id} source={{ uri: attachment.uri }} style={styles.attachmentPreview} />
              ))}
            </View>
          ) : null}

          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={[styles.messageText, styles.userText]}>{message.content}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.assistantRow]}>
      <View style={[styles.bubble, styles.assistantMessage]}>
        <Text style={styles.assistantLabel}>Auren</Text>
        <AurenMarkdownText>{message.content}</AurenMarkdownText>
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
  userMessageGroup: {
    maxWidth: '82%',
    alignItems: 'flex-end',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  attachmentPreview: {
    width: 112,
    height: 112,
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
});
