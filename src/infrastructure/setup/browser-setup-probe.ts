/**
 * Sonda concreta del chequeo de setup (FR-025..FR-027, FR-033, FR-036): mide voz,
 * IA y micrófono con las MISMAS piezas que usa EMMA en la práctica. Todo el IO
 * entra por `BrowserProbeDeps` para probarla sin navegador; `createDefaultSetupProbe`
 * cablea los concretos. Cada sonda respeta su `AbortSignal` aunque el trabajo
 * subyacente lo ignore, y nunca abre el micrófono ni guarda prompts ni audio.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { DeviceCapacity } from "@/domain/ai/engine-recommendation";
import type { AiProgress, ISetupProbe } from "@/domain/setup/i-setup-probe";
import type { AiProbe, MicProbe, VoiceProbe } from "@/domain/setup/setup-probe-result";
import { PROBE_TIMEOUT_MS } from "@/domain/setup/setup-thresholds";
import { checkAiReadiness, type AiReadiness } from "@/lib/ai/ai-readiness";
import { isLitertEngineLoaded, warmLitertEngine } from "@/lib/ai/litert-engine";
import { getSelectedLitertModelFile } from "@/lib/litert-models";
import { probeDevice } from "@/lib/ai/device-probe";
import { synthesizeSpeech } from "@/infrastructure/tts/neural-speech";
import { ttsAvailable } from "@/infrastructure/tts/web-speech-tts";
import type { KokoroBackend } from "@/infrastructure/tts/kokoro-tts";
import type { MicAccessStatus } from "@/types/emma-api";

/** Frase fija y corta: la misma en cada chequeo para que las ms sean comparables. */
export const SETUP_PHRASE = "Hi, I'm Emma. Let's practice English together.";
const AI_PROMPT = "Reply with the single word OK.";
const AI_MAX_TOKENS = 8;
const MAX_DETAIL = 200;

export interface BrowserProbeDeps {
  now(): number;
  /** Cadena real de voz: resuelve con el motor Kokoro que respondió o rechaza (= Web Speech). */
  synthesize(text: string, budgetMs: number): Promise<{ backend: KokoroBackend }>;
  webSpeechAvailable(): boolean;
  /** Ojo: puede reescribir el modo (#280); se llama antes de probar el prompt. */
  readiness(): Promise<AiReadiness>;
  device(): Promise<DeviceCapacity>;
  online(): boolean;
  localModelAvailable(): Promise<boolean>;
  llm: LlmGenerate;
  /** ¿El motor local ya está en memoria? (si no, la primera inferencia carga el modelo). */
  engineLoaded(): boolean;
  /** Carga el motor local sin inferir; resuelve cuando está listo. */
  warmUp(): Promise<void>;
  micAccessStatus(): Promise<MicAccessStatus>;
  /** Cantidad de entradas de audio (sin abrir el micrófono). */
  audioInputs(): Promise<number>;
}

const ABORTED = Symbol("abortada");

/** Espera `work` o la señal, lo que ocurra primero. */
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T | typeof ABORTED> {
  if (signal.aborted) return Promise.resolve(ABORTED);
  return new Promise((resolve, reject) => {
    const onAbort = () => resolve(ABORTED);
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

const orFallback = async <T>(work: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await work();
  } catch {
    return fallback;
  }
};

/** `performance.now()` trae decimales: los ms se guardan enteros. */
const elapsed = (deps: BrowserProbeDeps, since: number): number => Math.round(deps.now() - since);

const detailOf = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).slice(0, MAX_DETAIL);

const isAbort = (error: unknown): boolean => error instanceof Error && error.name === "AbortError";

async function probeVoice(deps: BrowserProbeDeps, signal: AbortSignal): Promise<VoiceProbe> {
  const started = deps.now();
  try {
    const done = await untilAborted(deps.synthesize(SETUP_PHRASE, PROBE_TIMEOUT_MS.voice), signal);
    if (done === ABORTED) return { status: "timeout", engine: "none" };
    return { status: "ok", engine: done.backend, ms: elapsed(deps, started) };
  } catch (error) {
    // El rechazo de la cadena significa "usa Web Speech" (sin ms: no mide Kokoro).
    if (deps.webSpeechAvailable()) return { status: "ok", engine: "web-speech", detail: detailOf(error) };
    return { status: "error", engine: "none", detail: detailOf(error) };
  }
}

async function aiContext(deps: BrowserProbeDeps, readiness: AiReadiness) {
  const [device, localModelAvailable] = await Promise.all([
    orFallback<DeviceCapacity | undefined>(deps.device, undefined),
    orFallback(deps.localModelAvailable, false),
  ]);
  return {
    mode: readiness.mode,
    online: deps.online(),
    readiness: readiness.reason,
    localModelAvailable,
    device: device && { webgpu: device.webgpu, ramGB: device.ramGB, minRamGB: device.minRamGB },
  };
}

type AiContext = Awaited<ReturnType<typeof aiContext>>;

// Híbrido sin modelo local usa la nube: no hay motor local que cargar.
const needsWarmUp = (deps: BrowserProbeDeps, c: AiContext): boolean =>
  c.mode !== "remote" && c.localModelAvailable && !deps.engineLoaded();

/** Carga el motor aparte de la inferencia. Devuelve loadMs, ABORTED o lanza. */
async function warm(deps: BrowserProbeDeps, signal: AbortSignal): Promise<number | typeof ABORTED> {
  const started = deps.now();
  const done = await untilAborted(deps.warmUp(), signal);
  return done === ABORTED ? ABORTED : elapsed(deps, started);
}

async function probeAi(deps: BrowserProbeDeps, signal: AbortSignal, progress?: AiProgress): Promise<AiProbe> {
  const readiness = await deps.readiness();
  const context = await aiContext(deps, readiness);
  if (!readiness.ready) return { ...context, status: "error", detail: `Engine not ready: ${readiness.reason}` };

  let loadMs: number | undefined;
  if (needsWarmUp(deps, context)) {
    progress?.({ ...context, loadingModel: true });
    try {
      const loaded = await warm(deps, signal);
      if (loaded === ABORTED) return { ...context, status: "timeout", loadingModel: true };
      loadMs = loaded;
    } catch (error) {
      if (isAbort(error) || signal.aborted) return { ...context, status: "timeout", loadingModel: true };
      return { ...context, status: "error", detail: detailOf(error) };
    }
  }
  progress?.({ ...context, loadingModel: false });

  const started = deps.now();
  try {
    const reply = await untilAborted(
      deps.llm({ prompt: AI_PROMPT, maxTokens: AI_MAX_TOKENS, priority: "interactive", signal }),
      signal,
    );
    if (reply === ABORTED) return { ...context, status: "timeout" };
    const ms = elapsed(deps, started);
    // La respuesta del LLM es entrada externa: sólo cuenta un string con contenido.
    const valid = typeof reply === "string" && reply.trim().length > 0;
    return { ...context, status: valid ? "ok" : "empty", ms, ...(loadMs !== undefined && { loadMs }) };
  } catch (error) {
    if (isAbort(error) || signal.aborted) return { ...context, status: "timeout" };
    return { ...context, status: "error", detail: detailOf(error) };
  }
}

function micStatus(access: MicAccessStatus | null, devices: number | null): MicProbe["status"] {
  if (access === "denied" || access === "restricted") return "denied";
  if (devices === 0) return "no-device";
  return access === "granted" ? "granted" : "unknown";
}

async function probeMic(deps: BrowserProbeDeps, signal: AbortSignal): Promise<MicProbe> {
  const work = Promise.all([
    orFallback<MicAccessStatus | null>(deps.micAccessStatus, null),
    orFallback<number | null>(deps.audioInputs, null),
  ]);
  const result = await untilAborted(work, signal);
  if (result === ABORTED) return { status: "timeout", devices: 0 };
  const [access, devices] = result;
  return { status: micStatus(access, devices), devices: devices ?? 0 };
}

export function createBrowserSetupProbe(deps: BrowserProbeDeps): ISetupProbe {
  return {
    probeVoice: (signal) => probeVoice(deps, signal),
    probeAi: (signal, progress) => probeAi(deps, signal, progress),
    probeMic: (signal) => probeMic(deps, signal),
  };
}

const emmaApi = () => (typeof window !== "undefined" ? window.emmaAPI : undefined);

/** Sonda real del navegador/Electron: el LLM llega inyectado (el mismo del runtime). */
export function createDefaultSetupProbe(llm: LlmGenerate): ISetupProbe {
  return createBrowserSetupProbe({
    now: () => performance.now(),
    synthesize: async (text, budgetMs) => {
      const speech = await synthesizeSpeech(text, undefined, undefined, budgetMs);
      URL.revokeObjectURL(speech.audioUrl);
      return { backend: speech.backend };
    },
    webSpeechAvailable: ttsAvailable,
    readiness: checkAiReadiness,
    device: () => probeDevice(),
    online: () => typeof navigator === "undefined" || navigator.onLine,
    localModelAvailable: async () => {
      const api = emmaApi();
      if (!api) return false;
      return (await api.litertModelsList()).models.some((m) => m.downloaded);
    },
    llm,
    engineLoaded: () => isLitertEngineLoaded(getSelectedLitertModelFile()),
    warmUp: () => warmLitertEngine(getSelectedLitertModelFile()),
    micAccessStatus: async () => {
      const api = emmaApi();
      return api ? api.micAccessStatus() : "unknown";
    },
    audioInputs: async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return 0;
      return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput").length;
    },
  });
}
