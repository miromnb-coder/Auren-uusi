import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { AurenImageAttachment } from '../lib/aurenAttachments';
import { colors, shadows } from '../theme';
import { AurenAttachmentTray } from './AurenAttachmentTray';

const COMPOSER_ICON_COLOR = colors.icon;
const DISABLED_ICON_COLOR = colors.mutedSoft;
const INPUT_LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = INPUT_LINE_HEIGHT;
const MAX_INPUT_HEIGHT = 118;
const ESTIMATED_CHARACTER_WIDTH = 8.4;

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

function estimateWrappedInputHeight(text: string, inputWidth: number) {
  if (!text.trim()) {
    return MIN_INPUT_HEIGHT;
  }

  if (inputWidth <= 0) {
    return Math.max(MIN_INPUT_HEIGHT, text.split('\n').length * INPUT_LINE_HEIGHT);
  }

  const charactersPerLine = Math.max(10, Math.floor(inputWidth / ESTIMATED_CHARACTER_WIDTH));
  const estimatedLines = text
    .split('\n')
    .reduce((lineCount, line) => lineCount + Math.max(1, Math.ceil(line.length / charactersPerLine)), 0);

  return Math.max(MIN_INPUT_HEIGHT, estimatedLines * INPUT_LINE_HEIGHT);
}

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
  const [measuredContentHeight, setMeasuredContentHeight] = useState(MIN_INPUT_HEIGHT);
  const [inputWidth, setInputWidth] = useState(0);
  const canSend = value.trim().length > 0 || attachments.length > 0;
  const estimatedInputHeight = useMemo(
    () => estimateWrappedInputHeight(value, inputWidth),
    [inputWidth, value],
  );
  const rawInputHeight = Math.max(MIN_INPUT_HEIGHT, measuredContentHeight, estimatedInputHeight);
  const inputHeight = Math.min(rawInputHeight, MAX_INPUT_HEIGHT);
  const inputCanScroll = rawInputHeight > MAX_INPUT_HEIGHT;

  useEffect(() => {
    if (value.length === 0) {
      setMeasuredContentHeight(MIN_INPUT_HEIGHT);
    }
  }, [value.length]);

  function handleSend() {
    if (!canSend) return;
    onSend?.();
  }

  function handleContentSizeChange(height: number) {
    const nextHeight = Math.max(MIN_INPUT_HEIGHT, Math.ceil(height));

    setMeasuredContentHeight((currentHeight) => {
      if (Math.abs(currentHeight - nextHeight) < 1) {
        return currentHeight;
      }

      return nextHeight;
    });
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
        onLayout={(event) => setInputWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(event) => handleContentSizeChange(event.nativeEvent.contentSize.height)}
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
    lineHeight: INPUT_LINE_HEIGHT,
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
