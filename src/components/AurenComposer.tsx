import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows, spacing } from '../theme';

export function AurenComposer() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.composer}>
        <Text style={styles.placeholder}>Ask Auren about school...</Text>

        <View style={styles.controlsRow}>
          <View style={styles.leftControls}>
            <ComposerButton label="+" accessibilityLabel="Add content" />
            <ComposerButton label="≡" accessibilityLabel="Open tools" />
          </View>

          <View style={styles.rightControls}>
            <ComposerButton label="○" accessibilityLabel="Open chat mode" />
            <ComposerButton label="⌁" accessibilityLabel="Use voice" />
            <ComposerButton label="↑" accessibilityLabel="Send message" disabled />
          </View>
        </View>
      </View>
    </View>
  );
}

type ComposerButtonProps = {
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
};

function ComposerButton({ label, accessibilityLabel, disabled = false }: ComposerButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 18,
  },
  composer: {
    minHeight: 142,
    borderRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  placeholder: {
    color: colors.mutedSoft,
    fontSize: 18,
  },
  controlsRow: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftControls: {
    flexDirection: 'row',
    gap: 12,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.icon,
    fontSize: 24,
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: colors.mutedSoft,
  },
});
