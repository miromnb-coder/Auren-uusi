import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ImageAttachment = { mimeType?: string; base64?: string; dataUrl?: string; url?: string };
type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
};

const TEXT_FAST_MODEL = 'openai/gpt-oss-20b';
const TEXT_SMART_MODEL = 'openai/gpt-oss-120b';
const ANSWER_MAX_TOKENS = 2200;
const ANSWER_WITH_IMAGE_MAX_TOKENS = 2600;
const VISION_MAX_TOKENS = 1200;
const VISION_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.2-90b-vision-preview',
  'llama-3.2-11b-vision-preview',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const AUREN_SYSTEM_PROMPT = `You are Auren, a calm premium study assistant for a mobile app.
Always answer in the user's language.
Choose the answer format naturally based on the request.
Do not use one fixed template.
Use short paragraphs for simple questions, numbered steps for plans or methods, and bullets only when they improve clarity.
Never use markdown tables.
For long or complete requests, give a useful full answer with short sections instead of stopping early.
For normal questions, stay concise.
Sound calm, clear, warm, and intelligent.`;

const VISION_SYSTEM_PROMPT = `You are Auren's vision layer. Extract visible text, tasks, equations, diagrams, and important details. Be concise and accurate.`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ChatMessage>;
  return (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string' && item.content.trim().length > 0;
}

function isValidImage(value: unknown): value is ImageAttachment {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ImageAttachment>;
  return typeof item.dataUrl === 'string' || typeof item.url === 'string' || typeof item.base64 === 'string';
}

function toImageUrl(image: ImageAttachment) {
  if (image.dataUrl?.startsWith('data:image/')) return image.dataUrl;
  if (image.url?.startsWith('http://') || image.url?.startsWith('https://')) return image.url;
  if (image.base64) {
    const mimeType = image.mimeType?.startsWith('image/') ? image.mimeType : 'image/jpeg';
    return `data:${mimeType};base64,${image.base64}`;
  }
  return null;
}

function latestUserText(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? '';
}

function selectTextModel(body: Record<string, unknown>, hasImages: boolean) {
  if (hasImages) return TEXT_SMART_MODEL;
  if (body.modelMode === 'fast' || body.task === 'fast') return TEXT_FAST_MODEL;
  return TEXT_SMART_MODEL;
}

async function callGroq(params: { apiKey: string; model: string; messages: GroqMessage[]; temperature: number; maxTokens: number }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: params.model, temperature: params.temperature, max_tokens: params.maxTokens, messages: params.messages }),
  });

  if (!response.ok) throw new Error(`Groq request failed for ${params.model}: ${await response.text()}`);
  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error(`Groq returned an empty answer for ${params.model}`);
  return answer;
}

async function analyzeImages(apiKey: string, images: ImageAttachment[], userText: string) {
  const imageContent = images
    .slice(0, 3)
    .map(toImageUrl)
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ type: 'image_url' as const, image_url: { url } }));

  if (imageContent.length === 0) return null;
  const prompt = userText ? `The student wrote: ${userText}\n\nAnalyze the image for Auren.` : 'Analyze the image for Auren.';
  const errors: string[] = [];

  for (const model of VISION_MODELS) {
    try {
      return await callGroq({
        apiKey,
        model,
        temperature: 0.2,
        maxTokens: VISION_MAX_TOKENS,
        messages: [
          { role: 'system', content: VISION_SYSTEM_PROMPT },
          { role: 'user', content: [{ type: 'text', text: prompt }, ...imageContent] },
        ],
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(`All vision models failed:\n${errors.join('\n\n')}`);
}

function buildMessages(messages: ChatMessage[], imageAnalysis: string | null): GroqMessage[] {
  const finalMessages: GroqMessage[] = messages.map((message) => ({ role: message.role, content: message.content.trim() }));
  const system = imageAnalysis
    ? `${AUREN_SYSTEM_PROMPT}\n\nUse this image analysis as visual context:\n${imageAnalysis}`
    : AUREN_SYSTEM_PROMPT;
  return [{ role: 'system', content: system }, ...finalMessages];
}

async function streamGroqText(params: { apiKey: string; model: string; messages: GroqMessage[]; temperature: number; maxTokens: number }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: params.model, temperature: params.temperature, max_tokens: params.maxTokens, stream: true, messages: params.messages }),
  });

  if (!response.ok) throw new Error(`Groq stream failed for ${params.model}: ${await response.text()}`);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content;
              if (typeof content === 'string' && content.length > 0) controller.enqueue(encoder.encode(content));
            } catch {
              // Ignore malformed stream chunks.
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let selectedTextModel = TEXT_SMART_MODEL;

  try {
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) return jsonResponse({ error: 'Missing GROQ_API_KEY secret' }, 500);

    const body = await request.json();
    const messages = (Array.isArray(body?.messages) ? body.messages : []).filter(isValidMessage).slice(-16);
    const images = (Array.isArray(body?.images) ? body.images : []).filter(isValidImage).slice(0, 3);
    const hasImages = images.length > 0;

    if (messages.length === 0) return jsonResponse({ error: 'No valid messages provided' }, 400);

    selectedTextModel = selectTextModel(body, hasImages);
    const imageAnalysis = hasImages ? await analyzeImages(apiKey, images, latestUserText(messages)) : null;

    return await streamGroqText({
      apiKey,
      model: selectedTextModel,
      temperature: selectedTextModel === TEXT_FAST_MODEL ? 0.45 : 0.62,
      maxTokens: hasImages ? ANSWER_WITH_IMAGE_MAX_TOKENS : ANSWER_MAX_TOKENS,
      messages: buildMessages(messages, imageAnalysis),
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown stream function error',
        model: selectedTextModel,
      },
      500,
    );
  }
});
