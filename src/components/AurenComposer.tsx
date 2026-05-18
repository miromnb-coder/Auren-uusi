import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme';

const COMPOSER_ICON_COLOR = colors.icon;
const DISABLED_ICON_COLOR = colors.mutedSoft;

export function AurenComposer() {
  return (
    <View style={styles.composer}>
      <Text style={styles.placeholder}>Ask anything about your studies</Text>

      <View style={styles.controlsRow}>
        <View style={styles.leftControls}>
          <ComposerButton accessibilityLabel="Add content">
            <Ionicons name="add-outline" size={31} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Open controls">
            <Ionicons name="options-outline" size={27} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
        </View>

        <View style={styles.rightControls}>
          <ComposerButton accessibilityLabel="Open chat mode">
            <Ionicons name="chatbubble-outline" size={27} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Use voice">
            <Ionicons name="mic-outline" size={29} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Send message" disabled>
            <Ionicons name="arrow-up-outline" size={29} color={DISABLED_ICON_COLOR} />
          </ComposerButton>
        </View>
      </View>
    </View>
  );
}

type ComposerButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  children: ReactNode;
};

function ComposerButton({ accessibilityLabel, disabled = false, children }: ComposerButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  composer: {
    minHeight: 142,
    borderRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
    ...shadows.soft,
  },
  placeholder: {
    color: colors.mutedSoft,
    fontSize: 18.5,
    lineHeight: 24,
    letterSpacing: -0.25,
    fontWeight: '500',
  },
  controlsRow: {
    marginTop: 27,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
});
