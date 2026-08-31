/**
 * STT local con Whisper vía `@huggingface/transformers` (transformers.js) —
 * reemplaza a faster-whisper. Corre en el renderer (WASM/WebGPU); el modelo se
 * descarga y cachea la 1ª vez. Implementa el puerto `Transcribe` del dominio.
 *
 * El import es dinámico para no cargar el runtime pesado hasta el primer uso.
 */

let pipelinePromise: Promise<any> | null = null;

const MODEL_ID = "Xenova/whisper-base"; // equivalente al "base" de faster-whisper

async function getPipeline(): Promise<any> {
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = (async () => {
    const { pipeline } = await import("@huggingface/transformers");
    return pipeline("automatic-speech-recognition", MODEL_ID);
  })();
  pipelinePromise.catch(() => {
    pipelinePromise = null;
  });
  return pipelinePromise;
}

/**
 * Transcribe audio PCM mono float32 a 16 kHz (inglés). Implementa
 * `Transcribe = (audio) => Promise<string>` del dominio de audio.
 */
export async function transcribe(audio: Float32Array | number[]): Promise<string> {
  const asr = await getPipeline();
  const input = audio instanceof Float32Array ? audio : Float32Array.from(audio);
  const result = await asr(input, { language: "english", task: "transcribe" });
  return (result?.text ?? "").trim();
}
