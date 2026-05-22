import type { AurenMessage } from '../components/AurenMessageList';
import type { AurenImageAttachment } from './aurenAttachments';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

const SUPABASE_FUNCTION_URL =
  process.env.EXPO_PUBLIC_AUREN_CHAT_FUNCTION_URL ?? `${SUPABASE_URL}/functions/v1/auren-chat`;
const SUPABASE_STREAM_FUNCTION_URL =
  process.env.EXPO_PUBLIC_AUREN_CHAT_STREAM_FUNCTION_URL ?? `${SUPABASE_URL}/functions/v1/auren-chat-stream`;

export type AurenThinkingStep = {
  lines: string[];
};

type AurenChatResponse = {
  answer?: string;
  error?: string;
  detail?: string;
  model?: string;
  routing?: {
    textModel?: string;
    visionModel?: string | null;
    hasImages?: boolean;
  };
};

type SendAurenChatMessageOptions = {
  images?: AurenImageAttachment[];
  modelMode?: 'fast' | 'smart';
};

type SendAurenChatMessageStreamOptions = SendAurenChatMessageOptions & {
  onChunk: (chunk: string) => void;
};

type GenerateAurenThinkingTimelineInput = {
  message: string;
  hasImages?: boolean;
};

type GenerateAurenConversationTitleInput = {
  userMessage: string;
  assistantAnswer: string;
  fallbackTitle?: string;
};

function createRequestBody(messages: AurenMessage[], options: SendAurenChatMessageOptions = {}) {
  return JSON.stringify({
    modelMode: options.modelMode,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    images: options.images?.map((image) => ({
      mimeType: image.mimeType,
      base64: image.base64,
    })),
  });
}

function createHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
  };
}

async function parseErrorResponse(response: Response) {
  const rawText = await response.text().catch(() => '');

  try {
    const data = JSON.parse(rawText) as AurenChatResponse;
    return createDebugErrorMessage(response, data);
  } catch {
    return `HTTP ${response.status}${rawText ? `\n${rawText}` : ''}`;
  }
}

function createDebugErrorMessage(response: Response, data: AurenChatResponse) {
  const details = [
    `HTTP ${response.status}`,
    data.error ? `Error: ${data.error}` : null,
    data.detail ? `Detail: ${data.detail}` : null,
    data.model ? `Model: ${data.model}` : null,
    data.routing?.textModel ? `Text model: ${data.routing.textModel}` : null,
    data.routing?.visionModel ? `Vision model: ${data.routing.visionModel}` : null,
    typeof data.routing?.hasImages === 'boolean' ? `Has images: ${data.routing.hasImages}` : null,
  ].filter(Boolean);

  return details.join('\n');
}

function cleanThinkingLine(line: unknown) {
  if (typeof line !== 'string') {
    return '';
  }

  return line
    .replace(/^[-•*\d.)\s]+/, '')
    .replace(/^['"“”]+|['"“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 92);
}

function cleanConversationTitle(value: unknown, fallbackTitle = 'New chat') {
  if (typeof value !== 'string') {
    return fallbackTitle;
  }

  const cleaned = value
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*(title|otsikko)\s*[:：-]\s*/i, '')
    .replace(/^['"“”]+|['"“”]+$/g, '')
    .replace(/[.!?。！？]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return fallbackTitle;
  }

  const firstLine = cleaned.split(/\r?\n/)[0]?.trim() || cleaned;

  if (firstLine.length <= 42) {
    return firstLine;
  }

  return `${firstLine.slice(0, 39).trim()}...`;
}

function parseJsonObject(value: string) {
  const withoutFence = value.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const match = withoutFence.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function parseAurenThinkingTimeline(answer: string): AurenThinkingStep[] {
  const parsed = parseJsonObject(answer) as { updates?: { lines?: unknown[] }[] } | null;

  if (!parsed || !Array.isArray(parsed.updates)) {
    return [];
  }

  return parsed.updates
    .map((update) => {
      const lines = Array.isArray(update.lines)
        ? update.lines.map(cleanThinkingLine).filter(Boolean).slice(0, 3)
        : [];

      return { lines };
    })
    .filter((update) => update.lines.length > 0)
    .slice(0, 6);
}

export async function sendAurenChatMessage(
  messages: AurenMessage[],
  options: SendAurenChatMessageOptions = {},
) {
  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: createHeaders(),
    body: createRequestBody(messages, options),
  });

  const data = (await response.json().catch(() => ({}))) as AurenChatResponse;

  if (!response.ok) {
    throw new Error(createDebugErrorMessage(response, data));
  }

  if (!data.answer?.trim()) {
    throw new Error('Auren AI returned an empty answer');
  }

  return data.answer.trim();
}

export async function sendAurenChatMessageStream(
  messages: AurenMessage[],
  options: SendAurenChatMessageStreamOptions,
) {
  const response = await fetch(SUPABASE_STREAM_FUNCTION_URL, {
    method: 'POST',
    headers: createHeaders(),
    body: createRequestBody(messages, options),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const reader = response.body?.getReader?.();

  if (!reader) {
    const fallbackAnswer = await sendAurenChatMessage(messages, options);
    options.onChunk(fallbackAnswer);
    return fallbackAnswer;
  }

  const decoder = new TextDecoder();
  let fullAnswer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });

    if (chunk.length > 0) {
      fullAnswer += chunk;
      options.onChunk(chunk);
    }
  }

  const finalTail = decoder.decode();
  if (finalTail.length > 0) {
    fullAnswer += finalTail;
    options.onChunk(finalTail);
  }

  if (!fullAnswer.trim()) {
    throw new Error('Auren AI stream returned an empty answer');
  }

  return fullAnswer.trim();
}

export async function generateAurenConversationTitle({
  userMessage,
  assistantAnswer,
  fallbackTitle = 'New chat',
}: GenerateAurenConversationTitleInput) {
  const prompt = [
    'Create a short sidebar title for this Auren conversation.',
    'Use the same language as the user message when clear.',
    'Maximum 4 words when possible.',
    'No punctuation. No quotes. No markdown.',
    'Return only the title.',
    '',
    `User message: ${userMessage.trim()}`,
    `Assistant answer: ${assistantAnswer.trim().slice(0, 900)}`,
  ].join('\n');

  const answer = await sendAurenChatMessage(
    [
      {
        id: `title-${Date.now()}`,
        role: 'user',
        content: prompt,
      },
    ],
    { modelMode: 'fast' },
  );

  return cleanConversationTitle(answer, fallbackTitle);
}

export async function generateAurenThinkingTimeline({
  message,
  hasImages = false,
}: GenerateAurenThinkingTimelineInput) {
  const cleanMessage = message.trim() || (hasImages ? 'The user sent an image.' : 'The user sent a short message.');

  const prompt = [
    'You create public thinking-status updates for Auren, a calm personal study assistant UI.',
    'Generate dynamic status updates for the loading bubble while Auren prepares the final answer.',
    'Do not answer the user. Do not reveal hidden chain-of-thought or private reasoning.',
    'Only describe visible work at a high level, like understanding, organizing, comparing, planning, checking clarity.',
    'Make the text specific to the user request. Do not use generic repeated loading phrases.',
    'Use the same language as the user message when clear.',
    'Return valid JSON only with this exact schema:',
    '{"updates":[{"lines":["line 1"]},{"lines":["line 1","line 2"]}]}',
    'Rules:',
    '- Create 3 to 6 updates.',
    '- Each update has 1 to 3 short lines.',
    '- Each line should be natural, calm, and under 70 characters when possible.',
    '- No markdown, no bullets, no numbering, no emojis.',
    `Has image attachment: ${hasImages ? 'yes' : 'no'}`,
    `User message: ${cleanMessage}`,
  ].join('\n');

  const answer = await sendAurenChatMessage(
    [
      {
        id: `thinking-${Date.now()}`,
        role: 'user',
        content: prompt,
      },
    ],
    { modelMode: 'fast' },
  );

  return parseAurenThinkingTimeline(answer);
}
