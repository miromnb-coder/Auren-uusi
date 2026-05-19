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
