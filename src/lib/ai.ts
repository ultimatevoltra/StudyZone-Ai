// Free AI via Pollinations.ai — no API key required.
//
// Pollinations' legacy anonymous endpoint (text.pollinations.ai) currently serves
// a single free model: `openai` / `openai-fast` / `gpt-oss` (GPT-OSS 20B, a
// *reasoning* model). The old brand names ("llama", "mistral") were removed and
// return 404. Verified behaviour of this model:
//   - non-streaming responses put the real answer in `message.content`
//   - streaming responses expose the model's internal `delta.reasoning` instead
//     of the visible answer, which is NOT what we want to show users.
//
// To stay keyless AND reliable we therefore:
//   1. map every UI "brand" to the working free model by default,
//   2. request non-streaming (correct `message.content`), and
//   3. reveal the answer progressively so the UI still feels like live streaming,
//   4. allow an advanced override via localStorage key "studyzone_model".

export const AI_BASE = "https://text.pollinations.ai/openai";

type Lang = "en" | "bn";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  lang?: Lang;
  modelId?: string;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
  maxTokens?: number;
}

const MODEL_MAP: Record<string, string> = {
  llama3: "openai",
  mistral: "openai",
  gemma: "openai",
  openai: "openai",
};

const readStoredModel = (): string | null => {
  try {
    return localStorage.getItem("studyzone_model");
  } catch {
    return null;
  }
};

export function resolveModel(modelId: string): string {
  return (
    readStoredModel() ??
    MODEL_MAP[modelId] ??
    MODEL_MAP[modelId.toLowerCase()] ??
    modelId ??
    "openai"
  );
}

function buildSystemPrompt(lang: Lang): string {
  const langInstr =
    lang === "bn"
      ? "ALWAYS respond in Bengali (বাংলা) using proper Bengali script. Answer the user's question directly — do not show reasoning or chain-of-thought."
      : "Always answer the user's question directly and clearly. Never include internal reasoning or chain-of-thought in your reply.";

  return `You are StudyZone AI, a brilliant and friendly educational assistant that helps students with any academic subject — science, math, history, literature, programming, languages, and more.\n\n${langInstr}\n\nGuidelines:\n- Give clear, well-structured answers with headings, bullet points, and code blocks when helpful.\n- Use markdown formatting (bold, italic, lists, code fences).\n- For math problems, show step-by-step working.\n- For code questions, provide working examples.\n- Be encouraging and supportive.\n- Keep answers thorough but not unnecessarily verbose.`;
}

function textFromChoice(choice: any): string {
  const m = choice?.message;
  if (m?.content) return String(m.content);
  const delta = choice?.delta;
  if (delta?.content) return String(delta.content);
  if (choice?.text) return String(choice.text);
  return "";
}

async function nonStreamRequest(
  messages: AIMessage[],
  model: string,
  signal?: AbortSignal,
  maxTokens = 2048
): Promise<string> {
  const response = await fetch(AI_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({ model, messages, stream: false, max_tokens: maxTokens }),
  });
  if (!response.ok) throw new Error(`AI API error: ${response.status}`);
  const data = await response.json();
  return textFromChoice(data.choices?.[0]) ?? "";
}

async function reveal(text: string, onChunk: (s: string) => void, signal?: AbortSignal) {
  if (!onChunk) return;
  const step = 6;
  let i = 0;
  while (i < text.length) {
    if (signal?.aborted) break;
    const next = Math.min(i + step, text.length);
    onChunk(text.slice(i, next));
    i = next;
    await new Promise((r) => setTimeout(r, 12));
  }
}

export async function chat(
  messages: AIMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const { lang = "en", modelId = "openai", onChunk, signal, maxTokens = 2048 } = options;
  const model = resolveModel(modelId);
  const systemMsg: AIMessage = { role: "system", content: buildSystemPrompt(lang) };
  const fullMessages = [systemMsg, ...messages];

  let answer = "";
  try {
    answer = await nonStreamRequest(fullMessages, model, signal, maxTokens);
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    answer = await nonStreamRequest(fullMessages, model, signal, maxTokens);
  }

  if (!answer.trim()) {
    const fallback =
      lang === "bn"
        ? "দুঃখিত, এই মুহূর্তে কোনো উত্তর পেতে পারিনি। একটু পরে আবার চেষ্টা করুন।"
        : "Sorry, I couldn't get a response right now. Please try again in a moment.";
    answer = fallback;
  }

  await reveal(answer, onChunk as (s: string) => void, signal);
  return answer;
}

export async function streamChat(
  messages: AIMessage[],
  modelId: string,
  lang: Lang,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  return chat(messages, { lang, modelId, onChunk, signal });
}

export async function translateText(
  text: string,
  targetLang: Lang,
  signal?: AbortSignal
): Promise<string> {
  const langLabel = targetLang === "bn" ? "Bengali (বাংলা)" : "English";
  const prompt = `Translate the following text to ${langLabel}. Preserve all markdown formatting (bold, italic, headings, code blocks, bullet points). Return ONLY the translated text, nothing else.\n\n${text}`;

  const model = resolveModel("openai");
  const response = await fetch(AI_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) throw new Error("Translation failed");
  const data = await response.json();
  return textFromChoice(data.choices?.[0]) || text;
}
