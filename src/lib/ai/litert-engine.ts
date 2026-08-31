/**
 * @fileOverview Motor de IA local LiteRT-LM en el RENDERER (WebGPU).
 *
 * Reemplaza al runtime ONNX (onnxruntime-node) que NO podía generar gemma-4 en
 * CPU. `@litert-lm/core` corre el modelo en WebGPU (Chromium del renderer de
 * Electron). El `.litertlm` se sirve localmente vía el protocolo `litert-model://`
 * (registrado en main, lee de userData/models/litert) → carga offline, con Range.
 *
 * El paquete carga WASM de forma dinámica; lo importamos por CDN con
 * `webpackIgnore` para que webpack/Next NO intente bundlearlo (rompería).
 */

// Mensaje de chat para LiteRT.
export type LitertRole = "system" | "user" | "assistant";
export interface LitertMessage {
  role: LitertRole;
  content: string;
}

/**
 * Muestreo estocástico: el greedy puro hace que el modelo pequeño caiga en
 * bucles de repetición ("**[다음]** **[다음]**…"). top-k/p lo evita; la
 * temperatura baja (BUG-001) mejora la adherencia al personaje del escenario.
 */
export const LITERT_SAMPLER_PARAMS = { k: 40, p: 0.95, temperature: 0.6 } as const;

let libPromise: Promise<any> | null = null;
let enginePromise: Promise<any> | null = null;
let currentModelFile = "";
let logFilterInstalled = false;

/**
 * El runtime WASM de LiteRT escribe logs informativos (p.ej.
 * "INFO: [environment.cc:30] Creating LiteRT environment") a `console.error`,
 * y el overlay de Next-dev los muestra como "Console Error". Filtramos esos logs
 * benignos (INFO/WARNING del C++) conservando los errores reales.
 */
function installLitertLogFilter(): void {
  if (logFilterInstalled || typeof window === "undefined" || typeof console === "undefined") return;
  logFilterInstalled = true;
  // Benigno = log informativo del runtime C++: prefijo INFO/WARNING o un tag de
  // archivo fuente "[algo.cc:NN]". Los errores reales (ERROR:, excepciones JS) pasan.
  const benign = /^\s*(INFO|WARNING|VERBOSE)[:\s]|\[[\w.\/-]+\.cc(:\d+)?\]/i;
  const wrap =
    (orig: (...a: any[]) => void) =>
    (...args: any[]) => {
      const first = typeof args[0] === "string" ? args[0] : "";
      if (benign.test(first)) return; // log informativo del WASM → ignorar
      orig(...args);
    };
  console.error = wrap(console.error.bind(console));
  console.warn = wrap(console.warn.bind(console));
}

// Instalar el filtro AL IMPORTAR el módulo (antes de crear el engine), para que
// los logs del WASM nunca disparen el overlay de error de Next-dev.
installLitertLogFilter();

/** Carga el paquete @litert-lm/core (CDN, sin bundling). */
function loadLib(): Promise<any> {
  installLitertLogFilter();
  if (!libPromise) {
    // @ts-ignore — módulo remoto (CDN) sin tipos; webpackIgnore evita que webpack lo bundlee.
    libPromise = import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@litert-lm/core@0.13.1/+esm") as Promise<any>;
  }
  return libPromise;
}

/** Libera el engine actual (p.ej. al cambiar maxTokens en Ajustes → se recrea al usar). */
export function resetLitertEngine(): void {
  const prev = enginePromise;
  enginePromise = null;
  currentModelFile = "";
  prev?.then((e) => e?.delete?.()).catch(() => {});
}

/** ¿Hay WebGPU disponible en este renderer? (LiteRT lo requiere) */
export async function webgpuAvailable(): Promise<boolean> {
  try {
    const gpu = (navigator as any).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

/**
 * Engine singleton para el modelo dado. El `.litertlm` se sirve por el protocolo
 * local `litert-model://m/<archivo>`. Crear el engine carga el modelo (varios
 * segundos). Se recrea si cambia el archivo de modelo.
 */
export async function getEngine(modelFile: string): Promise<any> {
  if (enginePromise && currentModelFile === modelFile) return enginePromise;
  // Modelo distinto → libera el anterior (un solo modelo en memoria).
  if (enginePromise && currentModelFile !== modelFile) {
    const prev = enginePromise;
    enginePromise = null;
    prev.then((e) => e?.delete?.()).catch(() => {});
  }
  currentModelFile = modelFile;
  enginePromise = (async () => {
    const lib = await loadLib();
    // maxNumTokens = ventana de contexto+salida, configurable en Ajustes.
    const { getGenerationConfig } = await import("@/lib/ai-config");
    const maxNumTokens = Math.max(512, getGenerationConfig().maxTokens || 4096);
    return lib.Engine.create({
      model: `litert-model://m/${modelFile}`,
      mainExecutorSettings: { maxNumTokens },
    });
  })();
  // Si falla, permite reintentar la próxima vez.
  enginePromise.catch(() => {
    enginePromise = null;
  });
  return enginePromise;
}

/**
 * Conversación LiteRT reutilizable. El `system` se prefilla UNA sola vez (queda en
 * el KV-cache de la conversación); cada `send` sólo agrega el nuevo turno de
 * usuario y encadena su historia interna. Reutilizarla entre turnos (p.ej. el
 * bucle ReAct del agente) evita re-procesar el system+contexto en cada turno —
 * que es el mayor costo de prefill con el modelo local en WebGPU.
 */
export interface LitertConversation {
  send(userText: string, onToken?: (chunk: string) => void): Promise<string>;
  /** Libera el KV-cache de la conversación en la GPU. Idempotente. */
  close(): void;
}

/**
 * Crea una conversación reutilizable sobre el engine (singleton) del modelo. Pasa
 * `system` para fijar la persona/contexto como preface una sola vez.
 */
export async function createLitertConversation(
  modelFile: string,
  system?: string
): Promise<LitertConversation> {
  const engine = await getEngine(modelFile);
  const conversation = await engine.createConversation({
    ...(system ? { preface: { messages: [{ role: "system", content: system }] } } : {}),
    sessionConfig: { samplerParams: LITERT_SAMPLER_PARAMS },
  });
  return {
    async send(userText, onToken) {
      let full = "";
      const stream = conversation.sendMessageStreaming(userText);
      for await (const chunk of stream) {
        for (const item of chunk?.content ?? []) {
          if (item?.type === "text" && item.text) {
            full += item.text;
            onToken?.(item.text);
          }
        }
        // Cortacircuitos: si el modelo degenera en un bucle, aborta ya (no esperes
        // al tope de 60s ni sigas quemando tokens en basura repetida).
        if (isDegenerating(full)) break;
      }
      return full.trim();
    },
    close() {
      try {
        if (typeof conversation?.delete === "function") conversation.delete();
        else conversation?.close?.();
      } catch {
        /* liberar es best-effort */
      }
    },
  };
}

/**
 * Detecta degeneración por repetición en la salida en curso: cuando la cola del
 * texto es el mismo segmento corto repetido muchas veces (patología típica del
 * modelo local pequeño). Sólo mira la cola para ser barato en cada chunk.
 */
function isDegenerating(text: string): boolean {
  if (text.length < 60) return false;
  const tail = text.slice(-200);
  const tokens = tail.split(/\s+/).filter(Boolean);
  if (tokens.length < 8) return false;
  const last = tokens[tokens.length - 1];
  let repeats = 0;
  for (let i = tokens.length - 1; i >= 0 && tokens[i] === last; i--) repeats++;
  return repeats >= 6; // mismo token ≥6 veces seguidas → bucle
}

/**
 * Genera una respuesta (streaming) para un turno de chat SUELTO. `messages` debe
 * traer el system (si lo hay) como preface y el último mensaje de usuario como
 * prompt. Para varios turnos encadenados usa `createLitertConversation` y reutiliza
 * la conversación (evita re-prefill del system en cada turno).
 */
export async function litertGenerate(
  modelFile: string,
  messages: LitertMessage[],
  onToken?: (chunk: string) => void
): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content;
  const turns = messages.filter((m) => m.role !== "system");
  const lastUser = [...turns].reverse().find((m) => m.role === "user")?.content ?? "";

  const convo = await createLitertConversation(modelFile, system);
  try {
    return await convo.send(lastUser, onToken);
  } finally {
    // BUG-001: sin liberar, cada turno deja su KV-cache vivo en la GPU y el
    // motor degenera progresivamente hasta colapsar a los pocos turnos.
    convo.close();
  }
}
