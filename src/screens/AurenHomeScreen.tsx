import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AurenComposer } from '../components/AurenComposer';
import { AurenHeader } from '../components/AurenHeader';
import { AurenMessageList, type AurenMessage } from '../components/AurenMessageList';
import { AurenQuickActions } from '../components/AurenQuickActions';
import { AurenSidebar } from '../components/AurenSidebar';
import { pickAurenImageAttachment, type AurenImageAttachment } from '../lib/aurenAttachments';
import {
  generateAurenThinkingTimeline,
  sendAurenChatMessage,
  sendAurenChatMessageStream,
  type AurenThinkingStep,
} from '../lib/aurenAiClient';
import {
  createAurenConversation,
  createConversationTitle,
  listAurenConversations,
  loadAurenMessages,
  saveAurenMessage,
  type AurenConversation,
} from '../lib/aurenConversations';
import { colors } from '../theme';

const CLOSED_COMPOSER_BOTTOM = 38;
const KEYBOARD_GAP = 34;
const MESSAGE_LIST_BOTTOM_GAP = 24;
const THINKING_STEP_DELAYS = [1450, 1900, 2400, 3000, 3600];
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const SHOW_AI_DEBUG_ERRORS = true;

type AurenHomeScreenProps = {
  session: Session;
};

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

function createDebugAurenResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `**Auren AI debug error:**\n\n${message}`;
}

function toTitleCase(value: string) {
  return value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getSessionProfile(session: Session) {
  const metadata = session.user.user_metadata ?? {};
  const metadataName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : typeof metadata.display_name === 'string'
          ? metadata.display_name
          : '';

  const emailName = session.user.email?.split('@')[0] ?? 'Auren user';
  const profileName = metadataName.trim() || toTitleCase(emailName) || 'Auren user';
  const avatarLetter = profileName.trim().charAt(0).toUpperCase() || 'A';

  return { profileName, avatarLetter };
}

export function AurenHomeScreen({ session }: AurenHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = session.user.id;
  const { profileName, avatarLetter } = useMemo(() => getSessionProfile(session), [session]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedImages, setSelectedImages] = useState<AurenImageAttachment[]>([]);
  const [messages, setMessages] = useState<AurenMessage[]>([]);
  const [conversations, setConversations] = useState<AurenConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [thinkingTimeline, setThinkingTimeline] = useState<AurenThinkingStep[]>([]);
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [composerHeight, setComposerHeight] = useState(116);
  const [composerBottomInset, setComposerBottomInset] = useState(CLOSED_COMPOSER_BOTTOM);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const quickActionsProgress = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;
  const thinkingRunRef = useRef(0);

  const hasMessages = messages.length > 0;
  const hasSelectedImages = selectedImages.length > 0;
  const quickActionsOpacity = quickActionsProgress;
  const quickActionsTranslateY = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });
  const quickActionsScale = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const startContentOpacity = quickActionsProgress;
  const currentThinkingLines = thinkingTimeline[thinkingStepIndex]?.lines ?? [];
  const messageListBottomInset = useMemo(
    () => composerHeight + composerBottomInset + MESSAGE_LIST_BOTTOM_GAP,
    [composerBottomInset, composerHeight],
  );

  async function refreshConversations() {
    const nextConversations = await listAurenConversations(userId);
    setConversations(nextConversations);
    return nextConversations;
  }

  function openSidebar() {
    Keyboard.dismiss();
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function stopThinkingTimeline() {
    thinkingRunRef.current += 1;
    setAssistantThinking(false);
    setThinkingTimeline([]);
    setThinkingStepIndex(0);
  }

  function stopThinkingForRun(thinkingRunId: number) {
    if (thinkingRunRef.current !== thinkingRunId) {
      return;
    }

    setAssistantThinking(false);
    setThinkingTimeline([]);
    setThinkingStepIndex(0);
  }

  function startNewChat() {
    stopThinkingTimeline();
    setActiveConversationId(null);
    setMessages([]);
    setDraft('');
    setSelectedImages([]);
    setSidebarOpen(false);
  }

  async function handleSelectConversation(conversationId: string) {
    Keyboard.dismiss();
    setSidebarOpen(false);

    if (conversationId === activeConversationId) {
      return;
    }

    stopThinkingTimeline();
    setActiveConversationId(conversationId);
    setDraft('');
    setSelectedImages([]);

    try {
      const storedMessages = await loadAurenMessages(conversationId);
      setMessages(storedMessages);
    } catch (error) {
      console.log('Auren conversation load error:', error);
      setMessages([
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          content: createDebugAurenResponse(error),
        },
      ]);
    }
  }

  async function handleAddImage() {
    const attachment = await pickAurenImageAttachment();
    if (!attachment) return;
    setSelectedImages([attachment]);
    setInputFocused(true);
  }

  function handleRemoveAttachment(id: string) {
    setSelectedImages((currentImages) => currentImages.filter((image) => image.id !== id));
  }

  async function handleSend() {
    const nextContent = draft.trim();
    if ((!nextContent && !hasSelectedImages) || assistantThinking) return;

    const imagesForSend = selectedImages;
    const messageContent = nextContent || 'Please explain this image.';
    const thinkingRunId = thinkingRunRef.current + 1;
    thinkingRunRef.current = thinkingRunId;

    const optimisticUserMessage: AurenMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: messageContent,
      images: imagesForSend,
    };

    const nextMessages = [...messages, optimisticUserMessage];

    setMessages(nextMessages);
    setDraft('');
    setSelectedImages([]);
    setThinkingTimeline([]);
    setThinkingStepIndex(0);
    setAssistantThinking(true);
    Keyboard.dismiss();

    generateAurenThinkingTimeline({
      message: messageContent,
      hasImages: imagesForSend.length > 0,
    })
      .then((timeline) => {
        if (thinkingRunRef.current !== thinkingRunId || timeline.length === 0) {
          return;
        }

        setThinkingTimeline(timeline);
        setThinkingStepIndex(0);
      })
      .catch((error) => {
        console.log('Auren thinking timeline error:', error);
      });

    let conversationIdForSave = activeConversationId;

    try {
      if (!conversationIdForSave) {
        const createdConversation = await createAurenConversation(userId, createConversationTitle(messageContent));
        conversationIdForSave = createdConversation.id;
        setActiveConversationId(createdConversation.id);
        setConversations((currentConversations) => [
          createdConversation,
          ...currentConversations.filter((conversation) => conversation.id !== createdConversation.id),
        ]);
      }

      const savedUserMessage = await saveAurenMessage({
        conversationId: conversationIdForSave,
        userId,
        role: 'user',
        content: messageContent,
        images: imagesForSend,
      });

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === optimisticUserMessage.id ? { ...savedUserMessage, images: imagesForSend } : message,
        ),
      );

      const optimisticAssistantMessage: AurenMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: '',
      };

      setMessages((currentMessages) => [...currentMessages, optimisticAssistantMessage]);

      let firstChunkReceived = false;
      let answer = '';

      try {
        answer = await sendAurenChatMessageStream(nextMessages, {
          images: imagesForSend,
          onChunk: (chunk) => {
            if (thinkingRunRef.current !== thinkingRunId) {
              return;
            }

            if (!firstChunkReceived) {
              firstChunkReceived = true;
              stopThinkingForRun(thinkingRunId);
            }

            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === optimisticAssistantMessage.id
                  ? { ...message, content: `${message.content}${chunk}` }
                  : message,
              ),
            );
          },
        });

        stopThinkingForRun(thinkingRunId);

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === optimisticAssistantMessage.id ? { ...message, content: answer } : message,
          ),
        );
      } catch (streamError) {
        console.log('Auren stream error:', streamError);

        try {
          answer = await sendAurenChatMessage(nextMessages, { images: imagesForSend });
        } catch (fallbackError) {
          console.log('Auren AI error:', fallbackError);
          answer = SHOW_AI_DEBUG_ERRORS ? createDebugAurenResponse(fallbackError) : createFallbackAurenResponse(messageContent);
        }

        stopThinkingForRun(thinkingRunId);

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === optimisticAssistantMessage.id ? { ...message, content: answer } : message,
          ),
        );
      }

      try {
        const savedAssistantMessage = await saveAurenMessage({
          conversationId: conversationIdForSave,
          userId,
          role: 'assistant',
          content: answer,
        });

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === optimisticAssistantMessage.id ? savedAssistantMessage : message,
          ),
        );
      } catch (error) {
        console.log('Auren assistant message save error:', error);
      }

      await refreshConversations();
    } catch (error) {
      console.log('Auren conversation save error:', error);
      stopThinkingForRun(thinkingRunId);

      const fallbackMessage: AurenMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: createDebugAurenResponse(error),
      };

      setMessages((currentMessages) => [...currentMessages, fallbackMessage]);
    } finally {
      if (thinkingRunRef.current === thinkingRunId) {
        setAssistantThinking(false);
        setThinkingTimeline([]);
        setThinkingStepIndex(0);
      }
    }
  }

  function dismissKeyboard() {
    Keyboard.dismiss();
  }

  useEffect(() => {
    let mounted = true;

    setLoadingConversations(true);
    listAurenConversations(userId)
      .then((nextConversations) => {
        if (mounted) {
          setConversations(nextConversations);
        }
      })
      .catch((error) => {
        console.log('Auren conversations load error:', error);
      })
      .finally(() => {
        if (mounted) {
          setLoadingConversations(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!assistantThinking || thinkingTimeline.length <= 1 || thinkingStepIndex >= thinkingTimeline.length - 1) {
      return undefined;
    }

    const delay = THINKING_STEP_DELAYS[Math.min(thinkingStepIndex, THINKING_STEP_DELAYS.length - 1)];
    const timeoutId = setTimeout(() => {
      setThinkingStepIndex((currentIndex) => Math.min(currentIndex + 1, thinkingTimeline.length - 1));
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [assistantThinking, thinkingStepIndex, thinkingTimeline.length]);

  useEffect(() => {
    const toValue = inputFocused || hasMessages || hasSelectedImages ? 0 : 1;
    Animated.parallel([
      Animated.timing(quickActionsProgress, {
        toValue,
        duration: inputFocused || hasMessages || hasSelectedImages ? 180 : 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: inputFocused || hasSelectedImages ? -18 : 0,
        duration: inputFocused || hasSelectedImages ? 220 : 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasMessages, hasSelectedImages, heroTranslateY, inputFocused, quickActionsProgress]);

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
    <AurenSidebar
      open={sidebarOpen}
      onClose={closeSidebar}
      onNewChat={startNewChat}
      conversations={conversations}
      activeConversationId={activeConversationId}
      profileName={profileName}
      avatarLetter={avatarLetter}
      loadingConversations={loadingConversations}
      onSelectConversation={handleSelectConversation}
    >
      <SafeAreaView style={styles.screen}>
        <AurenHeader onOpenMenu={openSidebar} />

        {hasMessages || assistantThinking ? (
          <View style={styles.chatContent}>
            <AurenMessageList
              messages={messages}
              thinking={assistantThinking}
              thinkingLines={currentThinkingLines}
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
                pointerEvents={inputFocused || hasSelectedImages ? 'none' : 'auto'}
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
            attachments={selectedImages}
            onChangeText={setDraft}
            onAddImage={handleAddImage}
            onRemoveAttachment={handleRemoveAttachment}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onSend={handleSend}
            onHeightChange={setComposerHeight}
          />
        </Animated.View>
      </SafeAreaView>
    </AurenSidebar>
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
