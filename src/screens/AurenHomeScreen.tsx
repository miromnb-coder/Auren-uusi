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
import { sendAurenChatMessage } from '../lib/aurenAiClient';
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
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [composerHeight, setComposerHeight] = useState(116);
  const [composerBottomInset, setComposerBottomInset] = useState(CLOSED_COMPOSER_BOTTOM);
  const composerBottom = useRef(new Animated.Value(CLOSED_COMPOSER_BOTTOM)).current;
  const quickActionsProgress = useRef(new Animated.Value(1)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;

  const hasMessages = messages.length > 0;
  const hasSelectedImages = selectedImages.length > 0;
  const quickActionsOpacity = quickActionsProgress;
  const quickActionsTranslateY = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });
  const quickActionsScale = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const startContentOpacity = quickActionsProgress;
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

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setDraft('');
    setSelectedImages([]);
    setAssistantThinking(false);
    setSidebarOpen(false);
  }

  async function handleSelectConversation(conversationId: string) {
    Keyboard.dismiss();
    setSidebarOpen(false);

    if (conversationId === activeConversationId) {
      return;
    }

    setActiveConversationId(conversationId);
    setDraft('');
    setSelectedImages([]);
    setAssistantThinking(false);

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
    setAssistantThinking(true);
    Keyboard.dismiss();

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

      let answer: string;
      try {
        answer = await sendAurenChatMessage(nextMessages, { images: imagesForSend });
      } catch (error) {
        console.log('Auren AI error:', error);
        answer = SHOW_AI_DEBUG_ERRORS ? createDebugAurenResponse(error) : createFallbackAurenResponse(messageContent);
      }

      const optimisticAssistantMessage: AurenMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: answer,
      };

      setMessages((currentMessages) => [...currentMessages, optimisticAssistantMessage]);

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

      const fallbackMessage: AurenMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: createDebugAurenResponse(error),
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
