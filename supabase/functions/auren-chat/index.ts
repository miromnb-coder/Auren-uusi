type AurenChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const AUREN_SYSTEM_PROMPT = `You are Auren, a calm and intelligent personal study assistant.

Your job:
- help the student understand school topics clearly
- explain step by step
- keep answers focused and not overwhelming
- ask short follow-up questions when useful
- suggest the next study move
- use a calm, premium, encouraging tone

Language:
- Always respond in the same language the student uses.
- If the student writes Finnish, answer in Finnish.
- If the student writes English, answer in English.

Style:
- Be clear, practical, and friendly.
- Prefer short sections and simple explanations.
- Do not sound like a generic chatbot. Sound like Auren.`;

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
    const groqModel = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

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
        model: groqModel,
        temperature: 0.55,
        max_tokens: 700,
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
      return jsonResponse({ error: 'Groq request failed', detail: errorText }, 502);
    }

    const data = await groqResponse.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return jsonResponse({ error: 'Groq returned an empty answer' }, 502);
    }

    return jsonResponse({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown function error';
    return jsonResponse({ error: message }, 500);
  }
});
