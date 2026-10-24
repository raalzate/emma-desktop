// =============================================================================
// Smoke de la voz nativa: lanza el host real en un utilityProcess y sintetiza
// una frase. Falla si no hay audio o si va groseramente lento (RTF ≥ 3: p. ej.
// onnxruntime cayó a un hilo). Las VMs de CI son más lentas que un equipo real:
// entre 1 y 3 sólo avisa. Dos entradas: `smoke-entry.ts` (compilado, sin
// empaquetar) y `main.ts` con EMMA_VOICE_SMOKE=1 (la app EMPAQUETADA: prueba
// asar, asarUnpack y los binarios de la plataforma).
// =============================================================================

import { app } from 'electron';
import { generateNativeTts, warmNativeTts } from './index';

const WARMUP = 'Hello there.';
const PHRASE = 'Hi! I am Emma, your English tutor.';
// El runner macOS de GitHub midió hasta 1,88 con la sesión caliente (un Mac real: 0,24).
const RTF_FAIL = 3;

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

/** Corre el smoke y cierra la app con 0 (verde) o 1 (rojo). */
export function runVoiceSmokeAndExit(): Promise<void> {
  return run().then(
    () => app.exit(0),
    (error: unknown) => {
      console.error(`VOZ NATIVA ROJA — ${error instanceof Error ? error.message : String(error)}`);
      app.exit(1);
    },
  );
}
