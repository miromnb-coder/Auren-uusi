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

// Groq access can differ by account/model. Try the most likely available vision models in order.
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
        maxTokens: 800,
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

    const answer = await callGroqChat({
      apiKey: groqApiKey,
      model: selectedTextModel,
      temperature: selectedTextModel === TEXT_FAST_MODEL ? 0.35 : 0.45,
      maxTokens: hasImages ? 850 : 650,
      messages: buildFinalMessages(messages, imageAnalysis),
    });

    return jsonResponse({
      answer,
      model: selectedTextModel,
      routing: {
        textModel: selectedTextModel,
        visionModel: usedVisionModel,
        hasImages,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown function error';
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
