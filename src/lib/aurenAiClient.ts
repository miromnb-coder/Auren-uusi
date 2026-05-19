import type { AurenMessage } from '../components/AurenMessageList';
import type { AurenImageAttachment } from './aurenAttachments';

const DEFAULT_SUPABASE_PROJECT_REF = 'rssoaopfutmphxekagha';
const DEFAULT_SUPABASE_FUNCTION_URL = `https://${DEFAULT_SUPABASE_PROJECT_REF}.supabase.co/functions/v1/auren-chat`;

// This is the public Supabase anon JWT. It is safe to use in the client app.
// The newer sb_publishable key is not accepted by Edge Function verify_jwt as a Bearer JWT.
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzc29hb3BmdXRtcGh4ZWthZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDUyMDQsImV4cCI6MjA5NDY4MTIwNH0._uzi7q5nCff4vE0uo20RmVBrSH4aKvZK_a2IW8exfVg';

const SUPABASE_FUNCTION_URL =
  process.env.EXPO_PUBLIC_AUREN_CHAT_FUNCTION_URL ?? DEFAULT_SUPABASE_FUNCTION_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;

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

type GenerateAurenThinkingTimelineInput = {
  message: string;
  hasImages?: boolean;
};

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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      modelMode: options.modelMode,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      images: options.images?.map((image) => ({
        mimeType: image.mimeType,
        base64: image.base64,
      })),
    }),
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
