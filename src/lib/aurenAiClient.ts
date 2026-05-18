import type { AurenMessage } from '../components/AurenMessageList';

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
};

export async function sendAurenChatMessage(messages: AurenMessage[]) {
  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
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
