import type { AurenMessage } from '../components/AurenMessageList';

const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_AUREN_CHAT_FUNCTION_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

type AurenChatResponse = {
  answer?: string;
  error?: string;
  detail?: string;
};

export async function sendAurenChatMessage(messages: AurenMessage[]) {
  if (!SUPABASE_FUNCTION_URL) {
    throw new Error('Missing EXPO_PUBLIC_AUREN_CHAT_FUNCTION_URL');
  }

  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SUPABASE_ANON_KEY ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}),
      ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {}),
    },
    body: JSON.stringify({
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as AurenChatResponse;

  if (!response.ok) {
    throw new Error(data.error ?? 'Auren AI request failed');
  }

  if (!data.answer?.trim()) {
    throw new Error('Auren AI returned an empty answer');
  }

  return data.answer.trim();
}
