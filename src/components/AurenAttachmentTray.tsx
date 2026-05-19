import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { AurenImageAttachment } from '../lib/aurenAttachments';
import { colors, shadows } from '../theme';

type AurenAttachmentTrayProps = {
  attachments: AurenImageAttachment[];
  onRemoveAttachment: (id: string) => void;
};

export function AurenAttachmentTray({ attachments, onRemoveAttachment }: AurenAttachmentTrayProps) {
  if (attachments.length === 0) return null;

  return (
    <View style={styles.tray}>
      {attachments.map((attachment) => (
        <View key={attachment.id} style={styles.previewWrap}>
          <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
          <Pressable
            onPress={() => onRemoveAttachment(attachment.id)}
            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Remove image"
          >
            <Ionicons name="close-outline" size={18} color="#ffffff" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  previewWrap: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    overflow: 'hidden',
    ...shadows.tiny,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,17,19,0.72)',
  },
  pressed: {
    opacity: 0.7,
  },
});
