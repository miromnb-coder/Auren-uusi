import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { AurenImageAttachment } from '../lib/aurenAttachments';
import { colors, shadows } from '../theme';
import { AurenAttachmentTray } from './AurenAttachmentTray';

const COMPOSER_ICON_COLOR = colors.icon;
const DISABLED_ICON_COLOR = colors.mutedSoft;
const MIN_INPUT_HEIGHT = 22;
const MAX_INPUT_HEIGHT = 110;

type AurenComposerProps = {
  value: string;
  attachments?: AurenImageAttachment[];
  onChangeText: (value: string) => void;
  onAddImage?: () => void;
  onRemoveAttachment?: (id: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSend?: () => void;
  onHeightChange?: (height: number) => void;
};

export function AurenComposer({
  value,
  attachments = [],
  onChangeText,
  onAddImage,
  onRemoveAttachment,
  onFocus,
  onBlur,
  onSend,
  onHeightChange,
}: AurenComposerProps) {
  const canSend = value.trim().length > 0;
  const inputHeight = Math.min(Math.max(MIN_INPUT_HEIGHT, value.split('\n').length * 22), MAX_INPUT_HEIGHT);
  const inputCanScroll = inputHeight >= MAX_INPUT_HEIGHT;

  function handleSend() {
    if (!canSend) return;
    onSend?.();
  }

  return (
    <View
      style={styles.composer}
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
    >
      <AurenAttachmentTray
        attachments={attachments}
        onRemoveAttachment={(id) => onRemoveAttachment?.(id)}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        multiline
        scrollEnabled={inputCanScroll}
        textAlignVertical="top"
        placeholder={attachments.length > 0 ? 'Ask Auren about this image' : 'Ask anything about your studies'}
        placeholderTextColor={colors.mutedSoft}
        style={[styles.input, { height: inputHeight }]}
      />

      <View style={styles.controlsRow}>
        <View style={styles.leftControls}>
          <ComposerButton accessibilityLabel="Add image" onPress={onAddImage} active={attachments.length > 0}>
            <Ionicons name="add-outline" size={27} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Open controls">
            <Ionicons name="options-outline" size={23} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
        </View>

        <View style={styles.rightControls}>
          <ComposerButton accessibilityLabel="Open chat mode">
            <Ionicons name="chatbubble-outline" size={24} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Use voice">
            <Ionicons name="mic-outline" size={25} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>
          <ComposerButton accessibilityLabel="Send message" disabled={!canSend} onPress={handleSend} filled={canSend}>
            <Ionicons name="arrow-up-outline" size={25} color={canSend ? '#ffffff' : DISABLED_ICON_COLOR} />
          </ComposerButton>
        </View>
      </View>
    </View>
  );
}

type ComposerButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  filled?: boolean;
  active?: boolean;
  onPress?: () => void;
  children: ReactNode;
};

function ComposerButton({ accessibilityLabel, disabled = false, filled = false, active = false, onPress, children }: ComposerButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, filled && styles.buttonFilled, active && styles.buttonActive, disabled && styles.buttonDisabled]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  composer: {
    minHeight: 116,
    borderRadius: 34,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#fbfbfa',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
    ...shadows.soft,
  },
  input: {
    padding: 0,
    margin: 0,
    color: colors.text,
    fontSize: 17.5,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '500',
  },
  controlsRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftControls: {
    flexDirection: 'row',
    gap: 10,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.052)',
  },
  buttonActive: {
    backgroundColor: 'rgba(17,24,39,0.045)',
    borderColor: 'rgba(17,24,39,0.09)',
  },
  buttonFilled: {
    backgroundColor: colors.icon,
    borderColor: colors.icon,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
});
