// =============================================================================
// IA remota — la parte PURA de hablar con cada proveedor: armar la petición,
// leer la respuesta, traducir el estado HTTP a un mensaje legible, reintentar lo
// transitorio y validar lo que entra por IPC. Sin `fetch` ni Electron: lo usa
// ai-remote.ts, que pone la red y las llaves cifradas.
// =============================================================================

import { z } from 'zod';

export const REMOTE_PROVIDERS = ['gemini', 'openai', 'anthropic'] as const;
export type RemoteProvider = (typeof REMOTE_PROVIDERS)[number];

export interface HttpRequest {
  url: string;
  init: RequestInit;
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const ANTHROPIC_VERSION = '2023-06-01';

const providerSchema = z.enum(REMOTE_PROVIDERS);

// El modelo va dentro de la ruta de Gemini: sólo caracteres de un id de modelo.
const modelSchema = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);

const remoteGenerateArgsSchema = z.object({
  provider: providerSchema,
  model: modelSchema,
  prompt: z.string(),
  system: z.string().optional(),
});

export type RemoteGenerateArgs = z.infer<typeof remoteGenerateArgsSchema>;

export function parseRemoteGenerateArgs(raw: unknown): RemoteGenerateArgs {
  return remoteGenerateArgsSchema.parse(raw);
}

export function parseKeySetArgs(provider: unknown, key: unknown): { provider: RemoteProvider; key: string } {
  return { provider: providerSchema.parse(provider), key: z.string().max(500).parse(key).trim() };
}

function authHeaders(provider: RemoteProvider, key: string): Record<string, string> {
  if (provider === 'gemini') return { 'x-goog-api-key': key };
  if (provider === 'openai') return { authorization: `Bearer ${key}` };
  return { 'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION };
}

function generateBody(provider: RemoteProvider, model: string, prompt: string, system?: string): unknown {
  if (provider === 'gemini') {
    return {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    };
  }
  if (provider === 'openai') {
    return {
      model,
      messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt }],
    };
  }
  return { model, max_tokens: 1024, ...(system ? { system } : {}), messages: [{ role: 'user', content: prompt }] };
}

const GENERATE_URL: Record<RemoteProvider, (model: string) => string> = {
  gemini: (model) => `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`,
  openai: () => 'https://api.openai.com/v1/chat/completions',
  anthropic: () => 'https://api.anthropic.com/v1/messages',
};

const VERIFY_URL: Record<RemoteProvider, string> = {
  gemini: GEMINI_BASE,
  openai: 'https://api.openai.com/v1/models',
  anthropic: 'https://api.anthropic.com/v1/models',
};

export function buildGenerateRequest(
  provider: RemoteProvider,
  key: string,
  model: string,
  prompt: string,
  system?: string
): HttpRequest {
  return {
    url: GENERATE_URL[provider](model),
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders(provider, key) },
      body: JSON.stringify(generateBody(provider, model, prompt, system)),
    },
  };
}

/** Listar modelos valida la llave sin gastar cuota de generación. */
export function buildVerifyRequest(provider: RemoteProvider, key: string): HttpRequest {
  return { url: VERIFY_URL[provider], init: { method: 'GET', headers: authHeaders(provider, key) } };
}

/** Navega un JSON desconocido sin `any`: `at(d, 'choices', 0, 'message')`. */
function at(value: unknown, ...path: (string | number)[]): unknown {
  return path.reduce<unknown>(
    (node, step) => (node !== null && typeof node === 'object' ? (node as Record<string | number, unknown>)[step] : undefined),
    value
  );
}

const joinTexts = (parts: unknown): string =>
  Array.isArray(parts) ? parts.map((p) => (typeof at(p, 'text') === 'string' ? (at(p, 'text') as string) : '')).join('') : '';

export function parseGenerateResponse(provider: RemoteProvider, data: unknown): string {
  if (provider === 'gemini') return joinTexts(at(data, 'candidates', 0, 'content', 'parts')).trim();
  if (provider === 'openai') {
    const content = at(data, 'choices', 0, 'message', 'content');
    return typeof content === 'string' ? content.trim() : '';
  }
  return joinTexts(at(data, 'content')).trim();
}

const LABEL: Record<RemoteProvider, string> = { gemini: 'Gemini', openai: 'OpenAI', anthropic: 'Anthropic' };

const looksLikeBadKey = (status: number, body: string) =>
  status === 401 || status === 403 || (status === 400 && /API_KEY_INVALID|API key not valid/i.test(body));

/** Mensaje para la persona (UI en inglés, Artículo 9). */
export function describeRemoteError(provider: RemoteProvider, status: number, body = ''): string {
  const name = LABEL[provider];
  if (looksLikeBadKey(status, body)) return `${name} rejected the API key. Check it in Settings or paste a new one.`;
  if (status === 429) {
    const lite = provider === 'gemini' ? ' Try the gemini-2.5-flash-lite model, which has a larger free quota, or' : '';
    return `${name} usage limit reached (free tier quota).${lite} wait a minute and try again.`;
  }
  if (status >= 500) return `${name} is temporarily unavailable. Please try again in a moment.`;
  return `${name} error ${status}.`;
}

export class RemoteHttpError extends Error {
  constructor(readonly status: number, readonly body: string) {
    super(`HTTP ${status}`);
  }
}

const isTransient = (err: unknown) =>
  err instanceof RemoteHttpError && (err.status === 429 || err.status >= 500);

export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Reintenta sólo lo transitorio (429/5xx), con espera que se duplica. */
export async function withRetry<T>(fn: () => Promise<T>, { attempts, baseDelayMs, sleep = realSleep }: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransient(err) || i === attempts - 1) break;
      await sleep(baseDelayMs * 2 ** i);
    }
  }
  throw lastError;
}
