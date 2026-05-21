import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { AurenImageAttachment } from '../lib/aurenAttachments';
import { colors, shadows } from '../theme';
import { AurenAttachmentTray } from './AurenAttachmentTray';

const COMPOSER_ICON_COLOR = colors.icon;
const DISABLED_ICON_COLOR = colors.mutedSoft;

const INPUT_LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = INPUT_LINE_HEIGHT;
const MAX_INPUT_HEIGHT = 88;
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
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [measuredContentHeight, setMeasuredContentHeight] = useState(MIN_INPUT_HEIGHT);
  const [inputWidth, setInputWidth] = useState(0);

  const hasText = value.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = hasText || hasAttachments;
  const isActive = focused || hasText || hasAttachments;

  const estimatedInputHeight = useMemo(
    () => estimateWrappedInputHeight(value, inputWidth),
    [inputWidth, value],
  );

  const rawInputHeight = Math.max(MIN_INPUT_HEIGHT, measuredContentHeight, estimatedInputHeight);
  const inputHeight = isActive ? Math.min(rawInputHeight, MAX_INPUT_HEIGHT) : MIN_INPUT_HEIGHT;
  const inputCanScroll = isActive && rawInputHeight > MAX_INPUT_HEIGHT;

  useEffect(() => {
    if (value.length === 0) {
      setMeasuredContentHeight(MIN_INPUT_HEIGHT);
    }
  }, [value.length]);

  function handleFocus() {
    setFocused(true);
    onFocus?.();
  }

  function handleBlur() {
    setFocused(false);
    onBlur?.();
  }

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
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={[styles.composer, isActive ? styles.composerActive : styles.composerIdle]}
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
    >
      {hasAttachments ? (
        <AurenAttachmentTray
          attachments={attachments}
          onRemoveAttachment={(id) => onRemoveAttachment?.(id)}
        />
      ) : null}

      {isActive ? (
        <>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onLayout={(event) => setInputWidth(event.nativeEvent.layout.width)}
            onContentSizeChange={(event) => handleContentSizeChange(event.nativeEvent.contentSize.height)}
            multiline
            scrollEnabled={inputCanScroll}
            textAlignVertical="top"
            placeholder={hasAttachments ? 'Ask Auren about this image' : 'Ask anything about your studies'}
            placeholderTextColor={colors.mutedSoft}
            style={[styles.input, styles.inputActive, { height: inputHeight }]}
          />

          <View style={styles.controlsRow}>
            <View style={styles.leftControls}>
              <ComposerButton accessibilityLabel="Add image" onPress={onAddImage} active={hasAttachments}>
                <Ionicons name="add-outline" size={28} color={COMPOSER_ICON_COLOR} />
              </ComposerButton>
            </View>

            <View style={styles.rightControls}>
              <ComposerButton accessibilityLabel="Use voice">
                <Ionicons name="mic-outline" size={25} color={COMPOSER_ICON_COLOR} />
              </ComposerButton>

              <ComposerButton accessibilityLabel="Send message" disabled={!canSend} onPress={handleSend} filled={canSend}>
                <Ionicons name="arrow-up-outline" size={25} color={canSend ? '#ffffff' : DISABLED_ICON_COLOR} />
              </ComposerButton>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.idleRow}>
          <ComposerButton accessibilityLabel="Add image" onPress={onAddImage} active={hasAttachments} size="idle">
            <Ionicons name="add-outline" size={30} color={COMPOSER_ICON_COLOR} />
          </ComposerButton>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline
            scrollEnabled={false}
            placeholder={hasAttachments ? 'Ask Auren about this image' : 'Ask anything about your studies'}
            placeholderTextColor={colors.mutedSoft}
            style={[styles.input, styles.inputIdle]}
          />

          <Pressable accessibilityRole="button" accessibilityLabel="Use voice" style={styles.voiceIdleButton}>
            <VoiceGlyph />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

type ComposerButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  filled?: boolean;
  active?: boolean;
  size?: 'default' | 'idle';
  onPress?: () => void;
  children: ReactNode;
};

function ComposerButton({
  accessibilityLabel,
  disabled = false,
  filled = false,
  active = false,
  size = 'default',
  onPress,
  children,
}: ComposerButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        size === 'idle' && styles.buttonIdle,
        filled && styles.buttonFilled,
        active && styles.buttonActive,
        disabled && styles.buttonDisabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

function VoiceGlyph() {
  return (
    <View style={styles.voiceGlyph}>
      <View style={[styles.voiceBar, { height: 11 }]} />
      <View style={[styles.voiceBar, { height: 19 }]} />
      <View style={[styles.voiceBar, { height: 27 }]} />
      <View style={[styles.voiceBar, { height: 19 }]} />
      <View style={[styles.voiceBar, { height: 11 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    backgroundColor: '#fbfbfa',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
    ...shadows.soft,
  },

  composerIdle: {
    minHeight: 66,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  composerActive: {
    minHeight: 106,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },

  idleRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
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

  inputIdle: {
    flex: 1,
    height: 26,
    marginHorizontal: 13,
    paddingTop: 1,
  },

  inputActive: {
    width: '100%',
  },

  controlsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
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

  buttonIdle: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    backgroundColor: 'rgba(17,24,39,0.08)',
    borderColor: 'rgba(17,24,39,0.06)',
  },

  voiceIdleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  voiceGlyph: {
    height: 30,
    width: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  voiceBar: {
    width: 3,
    borderRadius: 99,
    backgroundColor: COMPOSER_ICON_COLOR,
  },
});
