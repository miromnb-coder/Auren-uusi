import { ArrowUp, Mic, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { AurenImageAttachment } from '../lib/aurenAttachments';
import { colors, shadows } from '../theme';
import { AurenAttachmentTray } from './AurenAttachmentTray';

const COMPOSER_ICON_COLOR = 'rgba(15,17,21,0.84)';
const DISABLED_ICON_COLOR = 'rgba(110,113,124,0.42)';
const ICON_STROKE_WIDTH = 1.95;

const INPUT_LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = INPUT_LINE_HEIGHT;
const MAX_INPUT_HEIGHT = 112;
const ESTIMATED_CHARACTER_WIDTH = 8.4;

const IDLE_COMPOSER_HEIGHT = 66;
const ACTIVE_COMPOSER_MIN_HEIGHT = 112;

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
  const transition = useRef(new Animated.Value(0)).current;

  const [focused, setFocused] = useState(false);
  const [forcedActive, setForcedActive] = useState(false);
  const [measuredContentHeight, setMeasuredContentHeight] = useState(MIN_INPUT_HEIGHT);
  const [stableInputHeight, setStableInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [inputWidth, setInputWidth] = useState(0);

  const hasText = value.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = hasText || hasAttachments;
  const isActive = forcedActive || focused || hasText || hasAttachments;

  const estimatedInputHeight = useMemo(
    () => estimateWrappedInputHeight(value, inputWidth),
    [inputWidth, value],
  );

  const rawInputHeight = Math.max(MIN_INPUT_HEIGHT, measuredContentHeight, estimatedInputHeight);
  const targetInputHeight = Math.min(rawInputHeight, MAX_INPUT_HEIGHT);
  const inputHeight = isActive ? stableInputHeight : MIN_INPUT_HEIGHT;
  const inputCanScroll = isActive && rawInputHeight > MAX_INPUT_HEIGHT;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: isActive ? 1 : 0,
      duration: isActive ? 220 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isActive, transition]);

  useEffect(() => {
    if (value.length === 0) {
      setMeasuredContentHeight(MIN_INPUT_HEIGHT);
      setStableInputHeight(MIN_INPUT_HEIGHT);
      return;
    }

    setStableInputHeight((currentHeight) => {
      if (!isActive) {
        return MIN_INPUT_HEIGHT;
      }

      if (targetInputHeight > currentHeight) {
        return targetInputHeight;
      }

      if (currentHeight - targetInputHeight >= INPUT_LINE_HEIGHT) {
        return targetInputHeight;
      }

      return currentHeight;
    });
  }, [isActive, targetInputHeight, value.length]);

  useEffect(() => {
    if (!focused && !hasText && !hasAttachments) {
      setForcedActive(false);
    }
  }, [focused, hasAttachments, hasText]);

  function activateComposer() {
    setForcedActive(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleFocus() {
    setForcedActive(true);
    setFocused(true);
    onFocus?.();
  }

  function handleBlur() {
    setFocused(false);

    if (!hasText && !hasAttachments) {
      setForcedActive(false);
    }

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

  const animatedComposerStyle = {
    minHeight: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [IDLE_COMPOSER_HEIGHT, ACTIVE_COMPOSER_MIN_HEIGHT],
    }),
    borderRadius: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [999, 30],
    }),
    paddingHorizontal: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 16],
    }),
    paddingTop: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 14],
    }),
    paddingBottom: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 12],
    }),
  };

  return (
    <Animated.View
      style={[styles.composer, animatedComposerStyle]}
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
    >
      <Pressable style={styles.composerPressable} onPressIn={activateComposer}>
        {hasAttachments ? (
          <AurenAttachmentTray
            attachments={attachments}
            onRemoveAttachment={(id) => onRemoveAttachment?.(id)}
          />
        ) : null}

        <View style={[styles.inputShell, isActive ? styles.inputShellActive : styles.inputShellIdle]}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPressIn={activateComposer}
            onLayout={(event) => setInputWidth(event.nativeEvent.layout.width)}
            onContentSizeChange={(event) => handleContentSizeChange(event.nativeEvent.contentSize.height)}
            multiline
            scrollEnabled={inputCanScroll}
            textAlignVertical="top"
            placeholder={hasAttachments ? 'Ask Auren about this image' : 'Ask anything about your studies'}
            placeholderTextColor={colors.mutedSoft}
            style={[styles.input, isActive ? styles.inputActive : styles.inputIdle, { height: inputHeight }]}
          />

          {!isActive ? (
            <View style={styles.idleLeftSlot} pointerEvents="box-none">
              <ComposerButton accessibilityLabel="Add image" onPress={onAddImage} active={hasAttachments} size="idle">
                <Plus size={27} color={COMPOSER_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />
              </ComposerButton>
            </View>
          ) : null}
        </View>

        {isActive ? (
          <View style={styles.controlsRow}>
            <View style={styles.leftControls}>
              <ComposerButton accessibilityLabel="Add image" onPress={onAddImage} active={hasAttachments}>
                <Plus size={25} color={COMPOSER_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />
              </ComposerButton>
            </View>

            <View style={styles.rightControls}>
              <ComposerButton accessibilityLabel="Use voice">
                <Mic size={22} color={COMPOSER_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />
              </ComposerButton>

              <ComposerButton
                accessibilityLabel="Send message"
                disabled={!canSend}
                onPress={handleSend}
                filled={canSend}
                send
              >
                <ArrowUp size={23} color={canSend ? '#ffffff' : DISABLED_ICON_COLOR} strokeWidth={2.05} />
              </ComposerButton>
            </View>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

type ComposerButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  filled?: boolean;
  active?: boolean;
  send?: boolean;
  size?: 'default' | 'idle';
  onPress?: () => void;
  children: ReactNode;
};

function ComposerButton({
  accessibilityLabel,
  disabled = false,
  filled = false,
  active = false,
  send = false,
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
      style={({ pressed }) => [
        styles.button,
        size === 'idle' && styles.buttonIdle,
        active && styles.buttonActive,
        send && styles.sendButton,
        filled && styles.buttonFilled,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  composer: {
    backgroundColor: '#fbfbfa',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
    ...shadows.soft,
  },

  composerPressable: {
    flex: 1,
  },

  inputShell: {
    position: 'relative',
    width: '100%',
  },

  inputShellIdle: {
    minHeight: 48,
    justifyContent: 'center',
  },

  inputShellActive: {
    minHeight: MIN_INPUT_HEIGHT,
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
    width: '100%',
    paddingLeft: 66,
    paddingRight: 10,
    paddingTop: 1,
    fontWeight: '400',
  },

  inputActive: {
    width: '100%',
  },

  idleLeftSlot: {
    position: 'absolute',
    left: 0,
    top: -1,
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

  buttonPressed: {
    opacity: 0.62,
    transform: [{ scale: 0.97 }],
  },

  buttonActive: {
    backgroundColor: 'rgba(17,24,39,0.035)',
    borderColor: 'rgba(17,24,39,0.07)',
  },

  sendButton: {
    backgroundColor: 'rgba(17,24,39,0.065)',
    borderColor: 'rgba(17,24,39,0.052)',
  },

  buttonFilled: {
    backgroundColor: '#111111',
    borderColor: '#111111',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  buttonDisabled: {
    backgroundColor: 'rgba(17,24,39,0.06)',
    borderColor: 'rgba(17,24,39,0.045)',
    shadowOpacity: 0,
    elevation: 0,
  },
});
