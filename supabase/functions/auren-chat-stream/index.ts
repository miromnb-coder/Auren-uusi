import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type AurenChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AurenImageAttachment = {
  mimeType?: string;
  base64?: string;
  dataUrl?: string;
  url?: string;
};

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >;
};

type VisionAnalysisResult = {
  analysis: string;
  model: string;
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

const AUREN_SYSTEM_PROMPT = `You are Auren, a calm, premium-feeling personal study assistant for a mobile app.

Core identity:
- You are not a generic chatbot. You are Auren: focused, calm, clear, and encouraging.
- Your goal is to help the student understand, practice, and stay on track.
- Always respond in the same language the student uses.

Most important response rule:
- Do not use one fixed answer template.
- Choose the response shape freely based on the student’s request.
- Some answers should be one short paragraph.
- Some answers should be a few bullets.
- Some answers should be numbered steps.
- Some answers should feel like a mini lesson with an example.
- Some answers should simply answer and stop.
- Some answers should ask one useful follow-up question, but only when it is actually helpful.
- Do not always start with “Kyllä”, “Lyhyesti”, “Tässä”, or the same opening phrase.
- Do not always end with a generic offer like “Miten voisin auttaa?” or “Haluatko että...?”

Mobile response rules:
- Never use markdown tables. Tables do not fit this app.
- Keep responses mobile-friendly and easy to scan.
- Use bullets only when they genuinely make the answer clearer.
- Use numbered steps only when the user asks for a process, plan, method, or sequence.
- Use short paragraphs for simple questions.
- Do not over-format. Use bold text only for short section labels or key terms.
- For normal questions, stay concise.
- If the student asks for a long, full, detailed, complete, deep, or step-by-step answer, you may write a longer answer with multiple short sections.
- For long requested answers, prefer 5–10 short sections or steps instead of one huge block.
- For long requested answers, do not stop too early. Give the useful complete answer.
- End naturally. Sometimes no follow-up question is needed.

Study behavior:
- If the student asks to explain something, start simple, then add detail only if useful.
- If the student asks for a quiz, ask one question at a time and wait for their answer.
- If the student asks for a study plan, make a realistic plan with clear next actions.
- If the student asks for a full study plan, quiz set, or complete package, include enough detail to be useful.
- If the student seems confused, simplify instead of adding more detail.
- If the student asks for homework answers, help them understand the method instead of simply doing all the work for them.
- When useful, include one concrete next action, but do not force it into every response.

Tone:
- Calm, intelligent, warm, and concise.
- No hype, no robotic disclaimers, no unnecessary huge blocks of text.
- Sound like a premium study companion.
- Be natural. Vary rhythm, structure, and length.

Formatting guidance:
Good shapes vary by situation:
1. Simple question: answer directly in 1–3 short paragraphs.
2. Explanation: short explanation plus one example.
3. Plan: numbered steps.
4. Comparison: short sections or bullets, not a table.
5. Quiz: one question at a time.
6. Quick confirmation: one natural sentence may be enough.
7. Full requested package: sections, examples, practice tasks, and a short recap.

Avoid:
- Repeating the same answer pattern every time.
- Turning every response into a bullet list.
- Adding a final question when the answer already feels complete.
- Long generic introductions.
- Markdown tables.`;

const VISION_SYSTEM_PROMPT = `You are the vision layer for Auren, a study assistant.

Your job:
- Read and describe images for a text reasoning model.
- Extract visible text, equations, homework questions, diagrams, tables, and relevant details.
- If the image contains a school task, rewrite the task clearly.
- If something is unclear, say what is unclear instead of guessing.
- Do not solve the task fully unless it is necessary to describe the image.
- Return a concise but complete image analysis in text.`;

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

function isValidImage(image: unknown): image is AurenImageAttachment {
  if (!image || typeof image !== 'object') return false;

  const candidate = image as Partial<AurenImageAttachment>;
  return (
    typeof candidate.dataUrl === 'string' ||
    typeof candidate.url === 'string' ||
    typeof candidate.base64 === 'string'
  );
}

function toImageUrl(image: AurenImageAttachment) {
  if (image.dataUrl?.startsWith('data:image/')) return image.dataUrl;
  if (image.url?.startsWith('http://') || image.url?.startsWith('https://')) return image.url;

  if (image.base64) {
    const mimeType = image.mimeType?.startsWith('image/') ? image.mimeType : 'image/jpeg';
    return `data:${mimeType};base64,${image.base64}`;
  }

  return null;
}

function getLatestUserText(messages: AurenChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? '';
}

function selectTextModel(body: Record<string, unknown>, hasImages: boolean) {
  if (hasImages) return TEXT_SMART_MODEL;
  if (body.modelMode === 'fast' || body.task === 'fast') return TEXT_FAST_MODEL;
  return TEXT_SMART_MODEL;
}

async function callGroqChat(params: {
  apiKey: string;
  model: string;
  messages: GroqMessage[];
  temperature: number;
  maxTokens: number;
}) {
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      messages: params.messages,
    }),
  });

  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();
    throw new Error(`Groq request failed for ${params.model}: ${errorText}`);
  }

  const data = await groqResponse.json();
  const answer = data?.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error(`Groq returned an empty answer for ${params.model}`);
  }

  return answer;
}

async function analyzeImagesWithVisionModel(params: {
  apiKey: string;
  images: AurenImageAttachment[];
  userText: string;
}): Promise<VisionAnalysisResult | null> {
  const imageContent = params.images
    .slice(0, 3)
    .map(toImageUrl)
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ type: 'image_url' as const, image_url: { url } }));

  if (imageContent.length === 0) return null;

  const prompt = params.userText
    ? `The student wrote: ${params.userText}\n\nAnalyze the attached image for Auren.`
    : 'Analyze the attached image for Auren.';

  const errors: string[] = [];

  for (const model of VISION_MODELS) {
    try {
      const analysis = await callGroqChat({
        apiKey: params.apiKey,
        model,
        temperature: 0.2,
        maxTokens: VISION_MAX_TOKENS,
        messages: [
          { role: 'system', content: VISION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContent,
            ],
          },
        ],
      });

      return { analysis, model };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
    }
  }

  throw new Error(`All Groq vision models failed:\n${errors.join('\n\n')}`);
}

function buildFinalMessages(messages: AurenChatMessage[], imageAnalysis: string | null): GroqMessage[] {
  const cleanMessages: GroqMessage[] = messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));

  if (!imageAnalysis) {
    return [
      { role: 'system', content: AUREN_SYSTEM_PROMPT },
      ...cleanMessages,
    ];
  }

  return [
    {
      role: 'system',
      content: `${AUREN_SYSTEM_PROMPT}\n\nThe student attached one or more images. A separate vision model has already analyzed them. Use the analysis below as visual context, but answer as Auren in the same language as the student.\n\nVision analysis:\n${imageAnalysis}`,
    },
    ...cleanMessages,
  ];
}

async function createGroqTextStream(params: {
  apiKey: string;
  model: string;
  messages: GroqMessage[];
  temperature: number;
  maxTokens: number;
}) {
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      stream: true,
      messages: params.messages,
    }),
  });

  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();
    throw new Error(`Groq stream failed for ${params.model}: ${errorText}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqResponse.body?.getReader();

      if (!reader) {
        controller.close();
        return;
      }

      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

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

              if (typeof content === 'string' && content.length > 0) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // Ignore malformed provider chunks and continue streaming.
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
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let selectedTextModel = TEXT_SMART_MODEL;
  let usedVisionModel: string | null = null;

  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!groqApiKey) {
      return jsonResponse({ error: 'Missing GROQ_API_KEY secret' }, 500);
    }

    const body = await request.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const rawImages = Array.isArray(body?.images) ? body.images : [];
    const messages = rawMessages.filter(isValidMessage).slice(-16);
    const images = rawImages.filter(isValidImage).slice(0, 3);
    const hasImages = images.length > 0;

    if (messages.length === 0) {
      return jsonResponse({ error: 'No valid messages provided' }, 400);
    }

    selectedTextModel = selectTextModel(body, hasImages);

    const visionResult = hasImages
      ? await analyzeImagesWithVisionModel({
          apiKey: groqApiKey,
          images,
          userText: getLatestUserText(messages),
        })
      : null;

    const imageAnalysis = visionResult?.analysis ?? null;
    usedVisionModel = visionResult?.model ?? null;

    return await createGroqTextStream({
      apiKey: groqApiKey,
      model: selectedTextModel,
      temperature: selectedTextModel === TEXT_FAST_MODEL ? 0.45 : 0.62,
      maxTokens: hasImages ? ANSWER_WITH_IMAGE_MAX_TOKENS : ANSWER_MAX_TOKENS,
      messages: buildFinalMessages(messages, imageAnalysis),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown stream function error';
    return jsonResponse({
      error: message,
      model: selectedTextModel,
      routing: {
        textModel: selectedTextModel,
        visionModel: usedVisionModel,
      },
    }, 500);
  }
});
