/**
 * Motor Kokoro NATIVO: el mismo modelo corre en un utilityProcess del main con
 * onnxruntime-node (multihilo), ~13 veces más rápido que el WASM de un hilo del
 * Worker (#269). El renderer sólo pide por IPC y recibe un WAV. Si el puente no
 * existe o el motor no arranca, la carga rechaza y entra el Worker WASM.
 */

import type { KokoroEngine } from "./kokoro-tts";

export interface NativeTtsBridge {
  ttsNativeWarm?(): Promise<void>;
  ttsNativeGenerate?(text: string, voice: string): Promise<{ wav: Uint8Array; duration: number }>;
}

type Loader = () => Promise<KokoroEngine>;

export function createNativeEngineLoader(bridge: () => NativeTtsBridge | undefined): Loader {
  return async () => {
    const api = bridge();
    if (!api?.ttsNativeWarm || !api.ttsNativeGenerate) throw new Error("Sin voz nativa en este entorno");
    const generate = api.ttsNativeGenerate.bind(api);
    await api.ttsNativeWarm();
    return {
      async generate(text, { voice }) {
        const { wav, duration } = await generate(text, voice);
        return { duration, toBlob: () => new Blob([new Uint8Array(wav)], { type: "audio/wav" }) };
      },
    };
  };
}

/** Prueba el primer motor; si no carga, el segundo. */
export function preferFirstLoader(first: Loader, second: Loader): Loader {
  return () => first().catch(() => second());
}
