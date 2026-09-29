/**
 * Mapeo de niveles de audio a barras para la onda en vivo (waveform). Dominio
 * puro: recibe los datos de frecuencia/tiempo ya leídos del AnalyserNode
 * (0..255, como `getByteFrequencyData`) y devuelve N alturas normalizadas
 * (0..1). Sin Web Audio API ni `requestAnimationFrame` aquí — eso vive en el
 * hook `useAudioLevels` del renderer.
 */

const BYTE_MAX = 255;

/** Agrupa `data` en `bars` cubos y promedia cada uno, normalizado a 0..1. */
export function levelsToBars(data: ArrayLike<number>, bars: number): number[] {
  if (bars <= 0) {
    throw new Error("bars debe ser mayor que cero");
  }
  if (data.length === 0) {
    return new Array(bars).fill(0);
  }

  const result: number[] = [];
  for (let i = 0; i < bars; i += 1) {
    // Reparte las muestras en `bars` cubos aunque haya menos muestras que barras.
    const start = Math.floor((i * data.length) / bars);
    const end = Math.max(start + 1, Math.floor(((i + 1) * data.length) / bars));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < data.length; j += 1) {
      sum += data[j];
      count += 1;
    }
    const average = count > 0 ? sum / count : 0;
    result.push(Math.min(1, Math.max(0, average / BYTE_MAX)));
  }
  return result;
}

/** Barras bajas y parejas: el estado en reposo cuando no hay stream de audio. */
export function idleBars(bars: number): number[] {
  if (bars <= 0) {
    throw new Error("bars debe ser mayor que cero");
  }
  return new Array(bars).fill(0.12);
}
