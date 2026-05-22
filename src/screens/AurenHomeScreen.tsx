import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AurenComposer } from '../components/AurenComposer';
import { AurenHeader } from '../components/AurenHeader';
import { AurenMessageList, type AurenMessage } from '../components/AurenMessageList';
import { AurenPlusSheet } from '../components/AurenPlusSheet';
import { AurenProjectsScreen } from '../components/AurenProjectsScreen';
import { AurenQuickActions } from '../components/AurenQuickActions';
import { AurenSidebar } from '../components/AurenSidebar';
import { pickAurenImageAttachment, type AurenImageAttachment } from '../lib/aurenAttachments';
import { generateAurenThinkingTimeline, sendAurenChatMessage, sendAurenChatMessageStream, type AurenThinkingStep } from '../lib/aurenAiClient';
import { createAurenConversation, createAurenProject, createConversationTitle, listAurenConversations, loadAurenMessages, saveAurenMessage, type AurenConversation } from '../lib/aurenConversations';
import { aurenHaptics } from '../lib/aurenHaptics';
import { colors } from '../theme';

const CLOSED_COMPOSER_BOTTOM = 38;
const KEYBOARD_GAP = 34;
const MESSAGE_LIST_BOTTOM_GAP = 24;
const THINKING_STEP_DELAYS = [1450, 1900, 2400, 3000, 3600];
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type AurenHomeScreenProps = { session: Session };
type AurenScreenMode = 'chat' | 'projects';
type CreateProjectPayload = { title: string; description: string | null };

function createMessageId(role: AurenMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDebugAurenResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `Auren AI debug error:\n\n${message}`;
}

function createFallbackAurenResponse(message: string) {
  const cleaned = message.trim() || 'this topic';
  return `I cannot connect to Auren AI right now. Tell me what feels confusing about ${cleaned}, and I will help you break it down.`;
}

function toTitleCase(value: string) {
  return value.split(/[._\-\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function getSessionProfile(session: Session) {
  const metadata = session.user.user_metadata ?? {};
  const metadataName = typeof metadata.full_name === 'string' ? metadata.full_name : typeof metadata.name === 'string' ? metadata.name : typeof metadata.display_name === 'string' ? metadata.display_name : '';
  const emailName = session.user.email?.split('@')[0] ?? 'Auren user';
  const profileName = metadataName.trim() || toTitleCase(emailName) || 'Auren user';
  return { profileName, avatarLetter: profileName.trim().charAt(0).toUpperCase() || 'A' };
}

export function AurenHomeScreen({ session }: AurenHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = session.user.id;
  const { profileName, avatarLetter } = useMemo(() => getSessionProfile(session), [session]);
  const [activeScreen, setActiveScreen] = useState<AurenScreenMode>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plusSheetOpen, setPlusSheetOpen] = useState(false);
  const [createProjectSheetOpen, setCreateProjectSheetOpen] = useState(false);
  const [createProjectSubmitting, setCreateProjectSubmitting] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
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
  const currentThinkingLines = thinkingTimeline[thinkingStepIndex]?.lines ?? [];
  const messageListBottomInset = useMemo(() => composerHeight + composerBottomInset + MESSAGE_LIST_BOTTOM_GAP, [composerBottomInset, composerHeight]);
  const sidebarGestureBottomExclusion = useMemo(() => composerHeight + composerBottomInset + 24, [composerBottomInset, composerHeight]);
  const quickActionsTranslateY = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });
  const quickActionsScale = quickActionsProgress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  async function refreshConversations() {
    const next = await listAurenConversations(userId);
    setConversations(next);
    return next;
  }

  function openSidebar() { void aurenHaptics.panelOpen(); Keyboard.dismiss(); setSidebarOpen(true); }
  function closeSidebar() { void aurenHaptics.panelClose(); setSidebarOpen(false); }
  function closePlusSheet() { void aurenHaptics.panelClose(); setPlusSheetOpen(false); }
  function openPlusSheet() { void aurenHaptics.panelOpen(); Keyboard.dismiss(); setPlusSheetOpen(true); }

  function returnFromProjectsToSidebar() {
    void aurenHaptics.panelOpen();
    Keyboard.dismiss();
    setPlusSheetOpen(false);
    setCreateProjectSheetOpen(false);
    setCreateProjectError(null);
    setActiveScreen('chat');
    setSidebarOpen(true);
  }

  function handleSidebarOpen() {
    if (activeScreen === 'projects') returnFromProjectsToSidebar();
    else openSidebar();
  }

  function openProjects() {
    void aurenHaptics.selection();
    Keyboard.dismiss();
    setPlusSheetOpen(false);
    setCreateProjectSheetOpen(false);
    setCreateProjectError(null);
    setSidebarOpen(false);
    setActiveScreen('projects');
  }

  function openCreateProjectSheet() {
    void aurenHaptics.panelOpen();
    Keyboard.dismiss();
    setCreateProjectError(null);
    setCreateProjectSheetOpen(true);
  }

  function closeCreateProjectSheet() {
    void aurenHaptics.panelClose();
    Keyboard.dismiss();
    setCreateProjectError(null);
    setCreateProjectSheetOpen(false);
  }

  async function handleCreateProject(payload: CreateProjectPayload) {
    if (createProjectSubmitting) return;
    setCreateProjectSubmitting(true);
    setCreateProjectError(null);
    try {
      await createAurenProject({ userId, title: payload.title, description: payload.description });
      void aurenHaptics.success();
      setCreateProjectSheetOpen(false);
    } catch (error) {
      console.log('Auren project create error:', error);
      void aurenHaptics.warning();
      setCreateProjectError(error instanceof Error ? error.message : 'Could not create project. Please try again.');
    } finally {
      setCreateProjectSubmitting(false);
    }
  }

  function stopThinkingTimeline() { thinkingRunRef.current += 1; setAssistantThinking(false); setThinkingTimeline([]); setThinkingStepIndex(0); }
  function stopThinkingForRun(runId: number) { if (thinkingRunRef.current === runId) stopThinkingTimeline(); }

  function startNewChat() {
    void aurenHaptics.selection();
    stopThinkingTimeline();
    setActiveScreen('chat');
    setActiveConversationId(null);
    setMessages([]);
    setDraft('');
    setSelectedImages([]);
    setSidebarOpen(false);
    setPlusSheetOpen(false);
    setCreateProjectSheetOpen(false);
    setCreateProjectError(null);
  }

  async function handleSelectConversation(conversationId: string) {
    void aurenHaptics.selection();
    Keyboard.dismiss();
    setActiveScreen('chat');
    setSidebarOpen(false);
    if (conversationId === activeConversationId) return;
    stopThinkingTimeline();
    setActiveConversationId(conversationId);
    setDraft('');
    setSelectedImages([]);
    try { setMessages(await loadAurenMessages(conversationId)); }
    catch (error) { console.log('Auren conversation load error:', error); setMessages([{ id: createMessageId('assistant'), role: 'assistant', content: createDebugAurenResponse(error) }]); }
  }

  async function handleAddImage() {
    const attachment = await pickAurenImageAttachment();
    if (!attachment) return;
    void aurenHaptics.selection();
    setActiveScreen('chat');
    setSelectedImages([attachment]);
    setInputFocused(true);
  }

  async function handlePickImageFromSheet() { setPlusSheetOpen(false); await handleAddImage(); }
  function handleRemoveAttachment(id: string) { void aurenHaptics.selection(); setSelectedImages((items) => items.filter((image) => image.id !== id)); }
  function usePlusPrompt(prompt: string) { void aurenHaptics.selection(); setPlusSheetOpen(false); setActiveScreen('chat'); setDraft(prompt); setInputFocused(true); }

  async function handleSend() {
    const text = draft.trim();
    if (assistantThinking) return;
    if (!text && !hasSelectedImages) { void aurenHaptics.warning(); return; }
    void aurenHaptics.sendMessage();
    setActiveScreen('chat');
    const imagesForSend = selectedImages;
    const content = text || 'Please explain this image.';
    const runId = thinkingRunRef.current + 1;
    thinkingRunRef.current = runId;
    const optimisticUserMessage: AurenMessage = { id: createMessageId('user'), role: 'user', content, images: imagesForSend };
    const nextMessages = [...messages, optimisticUserMessage];
    setMessages(nextMessages);
    setDraft('');
    setSelectedImages([]);
    setAssistantThinking(true);
    setThinkingTimeline([]);
    setThinkingStepIndex(0);
    Keyboard.dismiss();
    generateAurenThinkingTimeline({ message: content, hasImages: imagesForSend.length > 0 }).then((timeline) => {
      if (thinkingRunRef.current === runId && timeline.length > 0) { setThinkingTimeline(timeline); setThinkingStepIndex(0); }
    }).catch((error) => console.log('Auren thinking timeline error:', error));
    let conversationIdForSave = activeConversationId;
    try {
      if (!conversationIdForSave) {
        const created = await createAurenConversation(userId, createConversationTitle(content));
        conversationIdForSave = created.id;
        setActiveConversationId(created.id);
        setConversations((items) => [created, ...items.filter((item) => item.id !== created.id)]);
      }
      const savedUserMessage = await saveAurenMessage({ conversationId: conversationIdForSave, userId, role: 'user', content, images: imagesForSend });
      setMessages((items) => items.map((item) => item.id === optimisticUserMessage.id ? { ...savedUserMessage, images: imagesForSend } : item));
      const assistantMessage: AurenMessage = { id: createMessageId('assistant'), role: 'assistant', content: '' };
      setMessages((items) => [...items, assistantMessage]);
      let answer = '';
      try {
        answer = await sendAurenChatMessageStream(nextMessages, { images: imagesForSend, onChunk: (chunk) => {
          if (thinkingRunRef.current !== runId) return;
          stopThinkingForRun(runId);
          setMessages((items) => items.map((item) => item.id === assistantMessage.id ? { ...item, content: `${item.content}${chunk}` } : item));
        }});
      } catch (streamError) {
        console.log('Auren stream error:', streamError);
        try { answer = await sendAurenChatMessage(nextMessages, { images: imagesForSend }); }
        catch (error) { console.log('Auren AI error:', error); answer = createFallbackAurenResponse(content); }
      }
      stopThinkingForRun(runId);
      void aurenHaptics.answerComplete();
      setMessages((items) => items.map((item) => item.id === assistantMessage.id ? { ...item, content: answer } : item));
      const savedAssistantMessage = await saveAurenMessage({ conversationId: conversationIdForSave, userId, role: 'assistant', content: answer });
      setMessages((items) => items.map((item) => item.id === assistantMessage.id ? savedAssistantMessage : item));
      await refreshConversations();
    } catch (error) {
      console.log('Auren conversation save error:', error);
      void aurenHaptics.warning();
      stopThinkingForRun(runId);
      setMessages((items) => [...items, { id: createMessageId('assistant'), role: 'assistant', content: createDebugAurenResponse(error) }]);
    } finally {
      if (thinkingRunRef.current === runId) stopThinkingTimeline();
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoadingConversations(true);
    listAurenConversations(userId).then((items) => { if (mounted) setConversations(items); }).catch((error) => console.log('Auren conversations load error:', error)).finally(() => { if (mounted) setLoadingConversations(false); });
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!assistantThinking || thinkingTimeline.length <= 1 || thinkingStepIndex >= thinkingTimeline.length - 1) return undefined;
    const delay = THINKING_STEP_DELAYS[Math.min(thinkingStepIndex, THINKING_STEP_DELAYS.length - 1)];
    const timeoutId = setTimeout(() => setThinkingStepIndex((index) => Math.min(index + 1, thinkingTimeline.length - 1)), delay);
    return () => clearTimeout(timeoutId);
  }, [assistantThinking, thinkingStepIndex, thinkingTimeline.length]);

  useEffect(() => {
    const toValue = inputFocused || hasMessages || hasSelectedImages ? 0 : 1;
    Animated.parallel([
      Animated.timing(quickActionsProgress, { toValue, duration: toValue ? 240 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(heroTranslateY, { toValue: inputFocused || hasSelectedImages ? -18 : 0, duration: inputFocused || hasSelectedImages ? 220 : 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [hasMessages, hasSelectedImages, heroTranslateY, inputFocused, quickActionsProgress]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextBottom = Math.max(CLOSED_COMPOSER_BOTTOM, event.endCoordinates.height - insets.bottom + KEYBOARD_GAP);
      setComposerBottomInset(nextBottom);
      Animated.timing(composerBottom, { toValue: nextBottom, duration: event.duration ?? 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      setComposerBottomInset(CLOSED_COMPOSER_BOTTOM);
      Animated.timing(composerBottom, { toValue: CLOSED_COMPOSER_BOTTOM, duration: event.duration ?? 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => setInputFocused(false));
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [composerBottom, insets.bottom]);

  return (
    <AurenSidebar
      open={sidebarOpen}
      onOpen={handleSidebarOpen}
      onClose={closeSidebar}
      onNewChat={startNewChat}
      onProjects={openProjects}
      gesturesEnabled={!plusSheetOpen && !createProjectSheetOpen}
      gestureBottomExclusion={activeScreen === 'chat' ? sidebarGestureBottomExclusion : 0}
      conversations={conversations}
      activeConversationId={activeConversationId}
      profileName={profileName}
      avatarLetter={avatarLetter}
      loadingConversations={loadingConversations}
      onSelectConversation={handleSelectConversation}
    >
      {activeScreen === 'projects' ? (
        <AurenProjectsScreen
          onBack={returnFromProjectsToSidebar}
          createSheetVisible={createProjectSheetOpen}
          createProjectSubmitting={createProjectSubmitting}
          createProjectError={createProjectError}
          onOpenCreateProject={openCreateProjectSheet}
          onCloseCreateProject={closeCreateProjectSheet}
          onSubmitCreateProject={handleCreateProject}
        />
      ) : (
        <SafeAreaView style={styles.screen}>
          <AurenHeader onOpenMenu={openSidebar} />
          {hasMessages || assistantThinking ? (
            <View style={styles.chatContent}>
              <AurenMessageList messages={messages} thinking={assistantThinking} thinkingLines={currentThinkingLines} bottomInset={messageListBottomInset} />
            </View>
          ) : (
            <Pressable style={styles.content} onPress={Keyboard.dismiss}>
              <Animated.View style={[styles.startContent, { opacity: quickActionsProgress, transform: [{ translateY: heroTranslateY }] }]}> 
                <View style={styles.hero}>
                  <Text style={styles.heroTitle}>{'Good evening,\nlet’s study smarter.'}</Text>
                  <Text style={styles.heroSubtitle}>{'I’m here to help you focus, learn faster,\nand stay on track.'}</Text>
                </View>
                <Animated.View pointerEvents={inputFocused || hasSelectedImages ? 'none' : 'auto'} style={[styles.actionsWrap, { opacity: quickActionsProgress, transform: [{ translateY: quickActionsTranslateY }, { scale: quickActionsScale }] }]}>
                  <AurenQuickActions />
                </Animated.View>
              </Animated.View>
            </Pressable>
          )}
          <Animated.View style={[styles.composerWrap, { bottom: composerBottom }]}> 
            <AurenComposer value={draft} attachments={selectedImages} onChangeText={setDraft} onAddImage={openPlusSheet} onRemoveAttachment={handleRemoveAttachment} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} onSend={handleSend} onHeightChange={setComposerHeight} />
          </Animated.View>
          <AurenPlusSheet visible={plusSheetOpen} onClose={closePlusSheet} onCamera={handlePickImageFromSheet} onPhotos={handlePickImageFromSheet} onFiles={closePlusSheet} onCreateFlashcards={() => usePlusPrompt('Create flashcards from ')} onSummarizeNotes={() => usePlusPrompt('Summarize these notes: ')} onExplainTask={() => usePlusPrompt('Explain this task step by step: ')} onExplainFromImage={handlePickImageFromSheet} onStartStudySession={() => usePlusPrompt('Start a focused study session for ')} />
        </SafeAreaView>
      )}
    </AurenSidebar>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 18, paddingBottom: 220 },
  startContent: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 104 },
  chatContent: { flex: 1 },
  hero: { alignItems: 'center', maxWidth: 370 },
  heroTitle: { color: '#686775', fontSize: 34, lineHeight: 40.5, letterSpacing: -1.08, textAlign: 'center', fontFamily: serifFont },
  heroSubtitle: { marginTop: 15, color: colors.muted, fontSize: 15.8, lineHeight: 22.5, letterSpacing: -0.14, textAlign: 'center', fontWeight: '500' },
  actionsWrap: { width: '100%', marginTop: 42 },
  composerWrap: { position: 'absolute', left: 16, right: 16, bottom: CLOSED_COMPOSER_BOTTOM },
});
