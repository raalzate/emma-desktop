// =============================================================================
// Smoke de la voz nativa: entrada de Electron mínima (sin ventana) que lanza el
// host real en un utilityProcess y sintetiza una frase. Falla si no hay audio o
// si va más lento que tiempo real. Lo corre `scripts/voice-smoke.mjs` en CI
// (Windows y macOS): es la prueba de que onnxruntime-node arranca en esa plataforma.
// =============================================================================

import { app } from 'electron';
import { generateNativeTts, warmNativeTts } from './index';

const PHRASE = 'Hi! I am Emma, your English tutor.';

async function run(): Promise<void> {
  let t = Date.now();
  await warmNativeTts();
  const loadMs = Date.now() - t;
  t = Date.now();
  const { wav, duration } = await generateNativeTts(PHRASE, 'af_heart');
  const rtf = (Date.now() - t) / 1000 / duration;
  const summary = `${process.platform}/${process.arch} · carga ${loadMs} ms · ${duration.toFixed(2)} s de audio · RTF ${rtf.toFixed(2)} · ${wav.byteLength} bytes`;
  if (wav.byteLength < 1000 || duration <= 0) throw new Error(`audio vacío (${summary})`);
  if (rtf >= 1) throw new Error(`más lento que tiempo real (${summary})`);
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
