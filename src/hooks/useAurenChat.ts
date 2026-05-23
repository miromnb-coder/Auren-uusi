import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import type { AurenMessage } from '../components/AurenMessageList';
import { pickAurenImageAttachment, type AurenImageAttachment } from '../lib/aurenAttachments';
import {
  cancelCurrentAurenResponse,
  generateAurenThinkingTimeline,
  sendAurenChatMessage,
  sendAurenChatMessageStream,
  type AurenThinkingStep,
} from '../lib/aurenAiClient';
import {
  createAurenConversation,
  createConversationTitle,
  deleteAurenConversation,
  listAurenConversations,
  loadAurenMessages,
  saveAurenMessage,
  updateAurenConversationTitle,
  type AurenConversation,
  type AurenProject,
} from '../lib/aurenConversations';
import {
  createAurenCreditSpendKey,
  estimateAurenCreditCost,
  isAurenOutOfCreditsError,
  spendAurenCredits,
} from '../lib/aurenCredits';
import { aurenHaptics } from '../lib/aurenHaptics';

const THINKING_STEP_DELAYS = [1450, 1900, 2400, 3000, 3600];

type AurenChatScreenMode = 'chat' | 'conversationSearch' | 'projects' | 'projectDetail';

type UseAurenChatOptions = {
  userId: string;
  activeProject: AurenProject | null;
  inProjectDetail: boolean;
  setActiveScreen: (screen: AurenChatScreenMode) => void;
  setActiveProject: (project: AurenProject | null) => void;
  setInputFocused: (focused: boolean) => void;
  refreshCreditSummary: () => Promise<unknown>;
};

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

function createCreditBlockedMessage(error: unknown) {
  if (isAurenOutOfCreditsError(error) && error instanceof Error) {
    return error.message;
  }

  if (error instanceof Error) {
    return `I could not check your credits right now.\n\n${error.message}`;
  }

  return 'I could not check your credits right now.';
}

export function useAurenChat({
  userId,
  activeProject,
  inProjectDetail,
  setActiveScreen,
  setActiveProject,
  setInputFocused,
  refreshCreditSummary,
}: UseAurenChatOptions) {
  const [draft, setDraft] = useState('');
  const [selectedImages, setSelectedImages] = useState<AurenImageAttachment[]>([]);
  const [messages, setMessages] = useState<AurenMessage[]>([]);
  const [conversations, setConversations] = useState<AurenConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [assistantGenerating, setAssistantGenerating] = useState(false);
  const [thinkingTimeline, setThinkingTimeline] = useState<AurenThinkingStep[]>([]);
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const thinkingRunRef = useRef(0);
  const sendInFlightRef = useRef(false);

  const hasMessages = messages.length > 0;
  const hasSelectedImages = selectedImages.length > 0;
  const isAssistantBusy = assistantThinking || assistantGenerating;
  const currentThinkingLines = thinkingTimeline[thinkingStepIndex]?.lines ?? [];

  async function refreshConversations() {
    const next = await listAurenConversations(userId);
    setConversations(next);
    return next;
  }

  function clearThinkingTimeline() {
    setAssistantThinking(false);
    setThinkingTimeline([]);
    setThinkingStepIndex(0);
  }

  function stopThinkingTimeline() {
    thinkingRunRef.current += 1;
    sendInFlightRef.current = false;
    cancelCurrentAurenResponse();
    clearThinkingTimeline();
    setAssistantGenerating(false);
  }

  function hideThinkingForRun(runId: number) {
    if (thinkingRunRef.current === runId) {
      clearThinkingTimeline();
    }
  }

  function handleStopGenerating() {
    if (!isAssistantBusy) return;
    void aurenHaptics.selection();
    thinkingRunRef.current += 1;
    sendInFlightRef.current = false;
    cancelCurrentAurenResponse();
    clearThinkingTimeline();
    setAssistantGenerating(false);
  }

  function resetChatSurface() {
    stopThinkingTimeline();
    setActiveConversationId(null);
    setMessages([]);
    setDraft('');
    setSelectedImages([]);
    setInputFocused(false);
  }

  function startNewChat() {
    void aurenHaptics.selection();
    resetChatSurface();
  }

  async function handleSelectConversation(conversationId: string) {
    void aurenHaptics.selection();
    Keyboard.dismiss();
    setActiveScreen('chat');
    setActiveProject(null);

    if (conversationId === activeConversationId) return;

    stopThinkingTimeline();
    setActiveConversationId(conversationId);
    setDraft('');
    setSelectedImages([]);

    try {
      setMessages(await loadAurenMessages(conversationId));
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

  async function handleRenameConversation(conversation: AurenConversation, title: string) {
    try {
      const renamedConversation = await updateAurenConversationTitle(conversation.id, title);
      setConversations((items) => items.map((item) => (item.id === renamedConversation.id ? renamedConversation : item)));
      void aurenHaptics.success();
    } catch (error) {
      console.log('Auren conversation rename error:', error);
      void aurenHaptics.warning();
      throw error;
    }
  }

  async function handleDeleteConversation(conversation: AurenConversation) {
    const previousConversations = conversations;
    setConversations((items) => items.filter((item) => item.id !== conversation.id));

    if (conversation.id === activeConversationId) {
      resetChatSurface();
      setActiveScreen('chat');
    }

    try {
      await deleteAurenConversation(conversation.id);
      void aurenHaptics.success();
    } catch (error) {
      console.log('Auren conversation delete error:', error);
      void aurenHaptics.warning();
      setConversations(previousConversations);
      throw error;
    }
  }

  async function handleAddImage() {
    const attachment = await pickAurenImageAttachment();
    if (!attachment) return;

    void aurenHaptics.selection();
    if (!inProjectDetail) setActiveScreen('chat');
    setSelectedImages([attachment]);
    setInputFocused(true);
  }

  async function handlePickImageFromSheet() {
    await handleAddImage();
  }

  function handleRemoveAttachment(id: string) {
    void aurenHaptics.selection();
    setSelectedImages((items) => items.filter((image) => image.id !== id));
  }

  function usePlusPrompt(prompt: string) {
    void aurenHaptics.selection();
    if (!inProjectDetail) setActiveScreen('chat');
    setDraft(prompt);
    setInputFocused(true);
  }

  function useProjectPrompt(prompt: string) {
    void aurenHaptics.selection();
    Keyboard.dismiss();
    setDraft(prompt);
    setInputFocused(true);
  }

  async function handleSend() {
    const text = draft.trim();
    if (sendInFlightRef.current || isAssistantBusy) return;
    if (!text && !hasSelectedImages) {
      void aurenHaptics.warning();
      return;
    }

    sendInFlightRef.current = true;

    const imagesForSend = selectedImages;
    const content = text || 'Please explain this image.';
    const creditCost = estimateAurenCreditCost({ hasImages: imagesForSend.length > 0, inProject: inProjectDetail });
    const creditReason = imagesForSend.length > 0 ? 'image_message' : inProjectDetail ? 'project_message' : 'chat_message';
    const creditSpendPayload = {
      amount: creditCost,
      reason: creditReason,
      conversationId: activeConversationId,
      projectId: inProjectDetail ? activeProject?.id ?? null : null,
      idempotencyKey: createAurenCreditSpendKey(creditReason),
      metadata: {
        hasImages: imagesForSend.length > 0,
        inProject: inProjectDetail,
        messageLength: content.length,
      },
    };

    try {
      await spendAurenCredits(creditSpendPayload);
      await refreshCreditSummary();
    } catch (creditError) {
      console.log('Auren credit spend error:', creditError);
      void aurenHaptics.warning();
      await refreshCreditSummary();
      setMessages((items) => [
        ...items,
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          content: createCreditBlockedMessage(creditError),
        },
      ]);
      sendInFlightRef.current = false;
      return;
    }

    void aurenHaptics.sendMessage();
    if (!inProjectDetail) setActiveScreen('chat');

    const runId = thinkingRunRef.current + 1;
    thinkingRunRef.current = runId;

    const optimisticUserMessage: AurenMessage = { id: createMessageId('user'), role: 'user', content, images: imagesForSend };
    const nextMessages = [...messages, optimisticUserMessage];

    setMessages(nextMessages);
    setDraft('');
    setSelectedImages([]);
    setAssistantThinking(true);
    setAssistantGenerating(false);
    setThinkingTimeline([]);
    setThinkingStepIndex(0);
    Keyboard.dismiss();

    generateAurenThinkingTimeline({ message: content, hasImages: imagesForSend.length > 0 })
      .then((timeline) => {
        if (thinkingRunRef.current === runId && timeline.length > 0) {
          setThinkingTimeline(timeline);
          setThinkingStepIndex(0);
        }
      })
      .catch((error) => console.log('Auren thinking timeline error:', error));

    let conversationIdForSave = activeConversationId;

    try {
      if (!conversationIdForSave) {
        const created = await createAurenConversation(userId, createConversationTitle(content));
        conversationIdForSave = created.id;
        setActiveConversationId(created.id);
        setConversations((items) => [created, ...items.filter((item) => item.id !== created.id)]);
      }

      if (thinkingRunRef.current !== runId) return;

      const creditSpendForAi = { ...creditSpendPayload, conversationId: conversationIdForSave };
      const savedUserMessage = await saveAurenMessage({
        conversationId: conversationIdForSave,
        userId,
        role: 'user',
        content,
        images: imagesForSend,
      });

      if (thinkingRunRef.current !== runId) return;

      setMessages((items) =>
        items.map((item) => (item.id === optimisticUserMessage.id ? { ...savedUserMessage, images: imagesForSend } : item)),
      );

      const assistantMessage: AurenMessage = { id: createMessageId('assistant'), role: 'assistant', content: '' };
      setMessages((items) => [...items, assistantMessage]);
      setAssistantGenerating(true);

      let answer = '';
      let streamedAnswer = '';

      try {
        answer = await sendAurenChatMessageStream(nextMessages, {
          images: imagesForSend,
          creditSpend: creditSpendForAi,
          onChunk: (chunk) => {
            if (thinkingRunRef.current !== runId) return;
            streamedAnswer += chunk;
            hideThinkingForRun(runId);
            setMessages((items) =>
              items.map((item) => (item.id === assistantMessage.id ? { ...item, content: `${item.content}${chunk}` } : item)),
            );
          },
        });
      } catch (streamError) {
        console.log('Auren stream error:', streamError);
        if (thinkingRunRef.current !== runId) return;

        try {
          answer = await sendAurenChatMessage(nextMessages, { images: imagesForSend, creditSpend: creditSpendForAi });
        } catch (error) {
          console.log('Auren AI error:', error);
          answer = streamedAnswer.trim() || createFallbackAurenResponse(content);
        }
      }

      if (thinkingRunRef.current !== runId) {
        setAssistantGenerating(false);
        if (!streamedAnswer.trim()) {
          setMessages((items) => items.filter((item) => item.id !== assistantMessage.id));
        }
        return;
      }

      answer = answer.trim() || streamedAnswer.trim();
      setAssistantGenerating(false);
      hideThinkingForRun(runId);
      void aurenHaptics.answerComplete();
      setMessages((items) => items.map((item) => (item.id === assistantMessage.id ? { ...item, content: answer } : item)));

      const savedAssistantMessage = await saveAurenMessage({
        conversationId: conversationIdForSave,
        userId,
        role: 'assistant',
        content: answer,
      });

      if (thinkingRunRef.current !== runId) return;

      setMessages((items) => items.map((item) => (item.id === assistantMessage.id ? savedAssistantMessage : item)));
      await refreshConversations();
      await refreshCreditSummary();
    } catch (error) {
      console.log('Auren conversation save error:', error);
      void aurenHaptics.warning();
      setAssistantGenerating(false);
      hideThinkingForRun(runId);
      setMessages((items) => [
        ...items,
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          content: createDebugAurenResponse(error),
        },
      ]);
    } finally {
      sendInFlightRef.current = false;
      if (thinkingRunRef.current === runId) {
        clearThinkingTimeline();
        setAssistantGenerating(false);
      }
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoadingConversations(true);

    listAurenConversations(userId)
      .then((items) => {
        if (mounted) setConversations(items);
      })
      .catch((error) => console.log('Auren conversations load error:', error))
      .finally(() => {
        if (mounted) setLoadingConversations(false);
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
    const timeoutId = setTimeout(() => setThinkingStepIndex((index) => Math.min(index + 1, thinkingTimeline.length - 1)), delay);

    return () => clearTimeout(timeoutId);
  }, [assistantThinking, thinkingStepIndex, thinkingTimeline.length]);

  return {
    activeConversationId,
    assistantThinking,
    assistantGenerating,
    conversations,
    currentThinkingLines,
    draft,
    hasMessages,
    hasSelectedImages,
    isAssistantBusy,
    loadingConversations,
    messages,
    selectedImages,
    handleAddImage,
    handleDeleteConversation,
    handlePickImageFromSheet,
    handleRemoveAttachment,
    handleRenameConversation,
    handleSelectConversation,
    handleSend,
    handleStopGenerating,
    refreshConversations,
    resetChatSurface,
    setDraft,
    setMessages,
    setSelectedImages,
    startNewChat,
    stopThinkingTimeline,
    usePlusPrompt,
    useProjectPrompt,
  };
}
