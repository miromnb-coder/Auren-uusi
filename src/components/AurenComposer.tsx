import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme';

export function AurenComposer() {
  return (
    <View style={styles.composer}>
      <Text style={styles.placeholder}>Ask anything about your studies</Text>

      <View style={styles.controlsRow}>
        <View style={styles.leftControls}>
          <ComposerButton accessibilityLabel="Add content">
            <Text style={styles.plusText}>+</Text>
          </ComposerButton>
          <ComposerButton accessibilityLabel="Open controls">
            <SlidersIcon />
          </ComposerButton>
        </View>

        <View style={styles.rightControls}>
          <ComposerButton accessibilityLabel="Open chat mode">
            <ChatIcon />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Use voice">
            <MicIcon />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Send message" disabled>
            <Text style={styles.sendText}>↑</Text>
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

function SlidersIcon() {
  return (
    <View style={styles.slidersIcon}>
      <View style={styles.sliderLine}><View style={[styles.sliderDot, styles.sliderDotLeft]} /></View>
      <View style={styles.sliderLine}><View style={[styles.sliderDot, styles.sliderDotRight]} /></View>
      <View style={styles.sliderLine}><View style={[styles.sliderDot, styles.sliderDotCenter]} /></View>
    </View>
  );
}

function ChatIcon() {
  return (
    <View style={styles.chatIcon}>
      <View style={styles.chatTail} />
    </View>
  );
}

function MicIcon() {
  return (
    <View style={styles.micIcon}>
      <View style={styles.micStem} />
      <View style={styles.micBase} />
    </View>
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
    borderColor: 'rgba(17,24,39,0.035)',
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
    marginTop: 26,
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
  plusText: {
    color: colors.icon,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '300',
  },
  sendText: {
    color: colors.mutedSoft,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '500',
  },
  slidersIcon: {
    width: 25,
    gap: 5,
  },
  sliderLine: {
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.icon,
  },
  sliderDot: {
    position: 'absolute',
    top: -3.5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.8,
    borderColor: colors.icon,
  },
  sliderDotLeft: {
    left: 3,
  },
  sliderDotRight: {
    right: 3,
  },
  sliderDotCenter: {
    left: 9,
  },
  chatIcon: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    borderWidth: 2.4,
    borderColor: colors.icon,
  },
  chatTail: {
    position: 'absolute',
    left: 3,
    bottom: -2,
    width: 9,
    height: 9,
    borderLeftWidth: 2.4,
    borderBottomWidth: 2.4,
    borderColor: colors.icon,
    transform: [{ rotate: '18deg' }],
    backgroundColor: colors.surfaceStrong,
  },
  micIcon: {
    width: 24,
    height: 31,
    alignItems: 'center',
  },
  micStem: {
    width: 13,
    height: 23,
    borderRadius: 7,
    borderWidth: 2.4,
    borderColor: colors.icon,
  },
  micBase: {
    marginTop: -2,
    width: 21,
    height: 10,
    borderBottomWidth: 2.4,
    borderLeftWidth: 2.4,
    borderRightWidth: 2.4,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    borderColor: colors.icon,
  },
});
