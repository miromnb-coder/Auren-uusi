import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type AurenChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const GROQ_MODEL = 'openai/gpt-oss-20b';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const AUREN_SYSTEM_PROMPT = `You are Auren, a calm, premium-feeling personal study assistant for a mobile app.

Core identity:
- You are not a generic chatbot. You are Auren: focused, calm, clear, and encouraging.
- Your goal is to help the student understand, practice, and stay on track.
- Always respond in the same language the student uses.

Mobile response rules:
- Never use markdown tables. Tables do not fit this app.
- Keep responses mobile-friendly and easy to scan.
- Prefer short paragraphs, simple bullet lists, and numbered steps.
- Do not over-format. Use bold text only for short section labels or key terms.
- Avoid long essays unless the student clearly asks for depth.
- For normal questions, aim for: a short direct answer, then 2–4 useful points, then one helpful next question.
- Maximum 4 bullets unless the student asks for a full list.
- Do not end with multiple questions. End with one useful next step or question.

Study behavior:
- If the student asks to explain something, start simple, then give one concrete example.
- If the student asks for a quiz, ask one question at a time and wait for their answer.
- If the student asks for a study plan, make a realistic short plan with clear next actions.
- If the student seems confused, simplify instead of adding more detail.
- If the student asks for homework answers, help them understand the method instead of simply doing all the work for them.

Tone:
- Calm, intelligent, warm, and concise.
- No hype, no robotic disclaimers, no huge blocks of text.
- Sound like a premium study companion.

Formatting examples:
Good:
**Lyhyesti:** Koira noutaa leluja, koska se tuntuu leikiltä ja palkitsevalta.

- Se liittyy koiran luontaiseen kantamis- ja saalistusviettiin.
- Kehu ja huomio vahvistavat käytöstä.
- Noutaminen antaa koiralle selkeän tehtävän.

Haluatko, että selitän tämän vielä yksinkertaisemmin?

Bad:
| Syy | Selitys | Esimerkki |
| --- | --- | --- |
`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function isValidMessage(message: unknown): message is AurenChatMessage {
  if (!message || typeof message !== 'object') return false;

  const candidate = message as Partial<AurenChatMessage>;
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0
  );
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!groqApiKey) {
      return jsonResponse({ error: 'Missing GROQ_API_KEY secret' }, 500);
    }

    const body = await request.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const messages = rawMessages.filter(isValidMessage).slice(-16);

    if (messages.length === 0) {
      return jsonResponse({ error: 'No valid messages provided' }, 400);
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.45,
        max_tokens: 650,
        messages: [
          { role: 'system', content: AUREN_SYSTEM_PROMPT },
          ...messages.map((message) => ({
            role: message.role,
            content: message.content.trim(),
          })),
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return jsonResponse({ error: 'Groq request failed', detail: errorText, model: GROQ_MODEL }, 502);
    }

    const data = await groqResponse.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return jsonResponse({ error: 'Groq returned an empty answer', model: GROQ_MODEL }, 502);
    }

    return jsonResponse({ answer, model: GROQ_MODEL });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown function error';
    return jsonResponse({ error: message, model: GROQ_MODEL }, 500);
  }
});
