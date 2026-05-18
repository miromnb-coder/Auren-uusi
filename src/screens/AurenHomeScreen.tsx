import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AurenComposer } from '../components/AurenComposer';
import { AurenHeader } from '../components/AurenHeader';
import { AurenMessageList, type AurenMessage } from '../components/AurenMessageList';
import { AurenQuickActions } from '../components/AurenQuickActions';
import { sendAurenChatMessage } from '../lib/aurenAiClient';
import { colors } from '../theme';

const CLOSED_COMPOSER_BOTTOM = 38;
const KEYBOARD_GAP = 34;
const MESSAGE_LIST_BOTTOM_GAP = 24;
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function createMessageId(role: AurenMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createFallbackAurenResponse(message: string) {
  const cleanedMessage = message.trim();

  if (!cleanedMessage) {
    return 'Tell me what you want to study, and I’ll help you start with the simplest next step.';
  }

  return `I’m having trouble connecting to Auren AI right now, but we can still start.\n\nLet’s work on “${cleanedMessage}”. First, tell me what part feels confusing, and I’ll help you break it down.`;
}

export function AurenHomeScreen() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [messages, setMessages] = useState<AurenMessage[]>([]);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [composerHeight, setComposerHeight] = useState(116);
  const [composerBottomInset, setComposerBottomInset] = useState(CLOSED_COMPOSER_BOTTOM);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const quickActionsProgress = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;

  const hasMessages = messages.length > 0;
  const quickActionsOpacity = quickActionsProgress;
  const quickActionsTranslateY = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });
  const quickActionsScale = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const startContentOpacity = quickActionsProgress;
  const messageListBottomInset = useMemo(
    () => composerHeight + composerBottomInset + MESSAGE_LIST_BOTTOM_GAP,
    [composerBottomInset, composerHeight],
  );

  async function handleSend() {
    const nextContent = draft.trim();
    if (!nextContent || assistantThinking) return;

    const userMessage: AurenMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: nextContent,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft('');
    setAssistantThinking(true);
    Keyboard.dismiss();

    try {
      const answer = await sendAurenChatMessage(nextMessages);
      const assistantMessage: AurenMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: answer,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch {
      const fallbackMessage: AurenMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: createFallbackAurenResponse(nextContent),
      };

      setMessages((currentMessages) => [...currentMessages, fallbackMessage]);
    } finally {
      setAssistantThinking(false);
    }
  }

  function dismissKeyboard() {
    Keyboard.dismiss();
  }

  useEffect(() => {
    const toValue = inputFocused || hasMessages ? 0 : 1;
    Animated.parallel([
      Animated.timing(quickActionsProgress, {
        toValue,
        duration: inputFocused || hasMessages ? 180 : 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: inputFocused ? -18 : 0,
        duration: inputFocused ? 220 : 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasMessages, heroTranslateY, inputFocused, quickActionsProgress]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const duration = event.duration ?? 250;
      const keyboardHeight = event.endCoordinates.height;
      const nextBottom = Math.max(
        CLOSED_COMPOSER_BOTTOM,
        keyboardHeight - insets.bottom + KEYBOARD_GAP,
      );

      setComposerBottomInset(nextBottom);
      Animated.timing(composerBottom, {
        toValue: nextBottom,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      const duration = event.duration ?? 220;
      setComposerBottomInset(CLOSED_COMPOSER_BOTTOM);
      Animated.timing(composerBottom, {
        toValue: CLOSED_COMPOSER_BOTTOM,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => setInputFocused(false));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [composerBottom, insets.bottom]);

  return (
    <SafeAreaView style={styles.screen}>
      <AurenHeader />

      {hasMessages || assistantThinking ? (
        <View style={styles.chatContent}>
          <AurenMessageList
            messages={messages}
            thinking={assistantThinking}
            bottomInset={messageListBottomInset}
          />
        </View>
      ) : (
        <Pressable style={styles.content} onPress={dismissKeyboard}>
          <Animated.View
            style={[
              styles.startContent,
              {
                opacity: startContentOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>{'Good evening,\nlet’s study smarter.'}</Text>
              <Text style={styles.heroSubtitle}>{'I’m here to help you focus, learn faster,\nand stay on track.'}</Text>
            </View>

            <Animated.View
              pointerEvents={inputFocused ? 'none' : 'auto'}
              style={[
                styles.actionsWrap,
                {
                  opacity: quickActionsOpacity,
                  transform: [{ translateY: quickActionsTranslateY }, { scale: quickActionsScale }],
                },
              ]}
            >
              <AurenQuickActions />
            </Animated.View>
          </Animated.View>
        </Pressable>
      )}

      <Animated.View style={[styles.composerWrap, { bottom: composerBottom }]}> 
        <AurenComposer
          value={draft}
          onChangeText={setDraft}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onSend={handleSend}
          onHeightChange={setComposerHeight}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 220,
  },
  startContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 104,
  },
  chatContent: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    maxWidth: 370,
  },
  heroTitle: {
    color: '#686775',
    fontSize: 34,
    lineHeight: 40.5,
    letterSpacing: -1.08,
    textAlign: 'center',
    fontFamily: serifFont,
  },
  heroSubtitle: {
    marginTop: 15,
    color: colors.muted,
    fontSize: 15.8,
    lineHeight: 22.5,
    letterSpacing: -0.14,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsWrap: {
    width: '100%',
    marginTop: 42,
  },
  composerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: CLOSED_COMPOSER_BOTTOM,
  },
});
