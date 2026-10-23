// =============================================================================
// Proceso utilitario de voz (utilityProcess de Electron): Kokoro-82M con
// onnxruntime-node en CPU, multihilo. Medido el 2026-10-23: ~0,25 s de cómputo
// por s de audio contra ~3,4 del WASM de un hilo en el renderer (#269). Vive
// aparte del main para que un crash nativo no tumbe la app. El modelo se
// descarga una vez a `EMMA_KOKORO_CACHE` (userData/models/kokoro).
// =============================================================================

import { parseHostRequest, type HostResponse } from './protocol';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

interface Engine {
  generate(text: string, voice: string): Promise<{ wav: Uint8Array<ArrayBuffer>; duration: number }>;
}

interface RawAudioLike {
  audio: Float32Array;
  sampling_rate: number;
  toWav(): ArrayBuffer;
}

interface KokoroLike {
  generate(text: string, options: { voice: string }): Promise<RawAudioLike>;
}

// `require` de los builds CJS (sin sus tipos, que arrastran lib DOM): así el
// `env` que se configura es la misma instancia de transformers que usa kokoro-js.
async function loadEngine(): Promise<Engine> {
  const { env } = require('@huggingface/transformers') as { env: { cacheDir: string } };
  if (process.env.EMMA_KOKORO_CACHE) env.cacheDir = process.env.EMMA_KOKORO_CACHE;
  const { KokoroTTS } = require('kokoro-js') as {
    KokoroTTS: { from_pretrained(id: string, o: { dtype: string; device: string }): Promise<KokoroLike> };
  };
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'fp32', device: 'cpu' });
  return {
    async generate(text, voice) {
      const raw = await tts.generate(text, { voice });
      return { wav: new Uint8Array(raw.toWav()), duration: raw.audio.length / raw.sampling_rate };
    },
  };
}

let engine: Promise<Engine> | null = null;
const getEngine = () => {
  engine ??= loadEngine().catch((error) => {
    engine = null; // la próxima petición reintenta
    throw error;
  });
  return engine;
};

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

interface ParentPort {
  on(event: 'message', cb: (event: { data: unknown }) => void): void;
  postMessage(message: HostResponse): void;
}

const port = (process as unknown as { parentPort: ParentPort }).parentPort;

port.on('message', async ({ data }) => {
  const request = parseHostRequest(data);
  if (!request) return;
  try {
    const e = await getEngine();
    if (request.type === 'load') return port.postMessage({ type: 'ready', id: request.id });
    const speech = await e.generate(request.text, request.voice);
    port.postMessage({ type: 'audio', id: request.id, ...speech });
  } catch (error) {
    port.postMessage({ type: 'error', id: request.id, message: messageOf(error) });
  }
});
