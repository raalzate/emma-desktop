// =============================================================================
// Smoke de la voz nativa: entrada de Electron mínima (sin ventana) que lanza el
// host real en un utilityProcess y sintetiza una frase. Falla si no hay audio o
// si va groseramente lento (RTF ≥ 2: p. ej. onnxruntime cayó a un hilo). Las VMs
// de CI son más lentas que un equipo real: entre 1 y 2 sólo avisa. Lo corre `scripts/voice-smoke.mjs` en CI
// (Windows y macOS): es la prueba de que onnxruntime-node arranca en esa plataforma.
// =============================================================================

import { app } from 'electron';
import { generateNativeTts, warmNativeTts } from './index';

const WARMUP = 'Hello there.';
const PHRASE = 'Hi! I am Emma, your English tutor.';
const RTF_FAIL = 2;

async function run(): Promise<void> {
  let t = Date.now();
  await warmNativeTts();
  const loadMs = Date.now() - t;
  await generateNativeTts(WARMUP, 'af_heart'); // la primera inferencia inicializa la sesión
  t = Date.now();
  const { wav, duration } = await generateNativeTts(PHRASE, 'af_heart');
  const rtf = (Date.now() - t) / 1000 / duration;
  const summary = `${process.platform}/${process.arch} · carga ${loadMs} ms · ${duration.toFixed(2)} s de audio · RTF ${rtf.toFixed(2)} · ${wav.byteLength} bytes`;
  if (wav.byteLength < 1000 || duration <= 0) throw new Error(`audio vacío (${summary})`);
  if (rtf >= RTF_FAIL) throw new Error(`demasiado lento (${summary})`);
  if (rtf >= 1) console.warn(`AVISO — más lento que tiempo real en este runner (${summary})`);
  console.log(`VOZ NATIVA VERDE — ${summary}`);
}

app.whenReady().then(() =>
  run().then(
    () => app.exit(0),
    (error: unknown) => {
      console.error(`VOZ NATIVA ROJA — ${error instanceof Error ? error.message : String(error)}`);
      app.exit(1);
    },
  ),
);
