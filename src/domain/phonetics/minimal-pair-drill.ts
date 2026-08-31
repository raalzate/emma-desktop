/**
 * Protocolo perceptivo de pares mínimos (§1.3 del libro): entrena la
 * distinción de pares (sordera fonológica, Best & Tyler). Se presenta UNA
 * palabra del par (por TTS en la UI) y el aprendiz decide cuál oyó.
 * Dominio puro: sin IO; la aleatoriedad se controla con un PRNG determinista.
 */
import type { MinimalPair, SoundContrast } from "@/domain/phonetics/phonetics";

/** Un ítem de percepción: una palabra sonará (prompt) y dos opciones para elegir. */
export interface PerceptionItem {
  prompt: string;
  options: [string, string];
  answerIndex: 0 | 1;
}

export interface PerceptionScore {
  total: number;
  correct: number;
  weakPairs: string[];
}

/** PRNG mulberry32: determinista y rápido, suficiente para barajar/elegir en el dominio. */
export function mulberry(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un par es pronunciable si ambos campos tienen al menos una letra y no son símbolos IPA (empiezan por "/"). */
function esPronunciable(pair: MinimalPair): boolean {
  const tieneLetras = (texto: string) => /[a-zA-Z]/.test(texto);
  const esIpa = (texto: string) => texto.trim().startsWith("/");
  return (
    !esIpa(pair.a) &&
    !esIpa(pair.b) &&
    tieneLetras(pair.a) &&
    tieneLetras(pair.b)
  );
}

/** Construye una ronda de percepción cíclica y determinista a partir de un contraste. */
export function buildPerceptionRound(
  contrast: SoundContrast,
  size: number,
  seed: number,
): PerceptionItem[] {
  if (size <= 0) {
    throw new Error("size debe ser mayor que cero");
  }
  const pares = contrast.pairs.filter(esPronunciable);
  if (pares.length === 0) {
    throw new Error("el contraste no tiene pares pronunciables");
  }

  const random = mulberry(seed);
  const items: PerceptionItem[] = [];
  for (let i = 0; i < size; i += 1) {
    const par = pares[i % pares.length];
    const answerIndex: 0 | 1 = random() < 0.5 ? 0 : 1;
    const opciones: [string, string] = [par.a, par.b];
    items.push({
      prompt: opciones[answerIndex],
      options: opciones,
      answerIndex,
    });
  }
  return items;
}

/** Verifica si el índice elegido por el aprendiz coincide con la palabra que sonó. */
export function checkPerception(item: PerceptionItem, chosenIndex: number): boolean {
  return chosenIndex === item.answerIndex;
}

/** Puntúa una ronda completa y reporta los prompts fallados (pares débiles). */
export function scoreRound(
  items: PerceptionItem[],
  answers: number[],
): PerceptionScore {
  if (items.length !== answers.length) {
    throw new Error("items y answers deben tener la misma longitud");
  }
  const weakPairs: string[] = [];
  let correct = 0;
  for (let i = 0; i < items.length; i += 1) {
    if (checkPerception(items[i], answers[i])) {
      correct += 1;
    } else {
      weakPairs.push(items[i].prompt);
    }
  }
  return { total: items.length, correct, weakPairs };
}
