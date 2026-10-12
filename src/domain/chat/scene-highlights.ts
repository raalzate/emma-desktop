/**
 * Frases clave de la escena: lo que el aprendiz tiene que retener de un vistazo
 * (con quién habla, a qué hora, qué sistema falló). Determinista, así sirve
 * también para escenas viejas del histórico que no traen marcas del LLM.
 */

export interface SceneSegment {
  text: string;
  key: boolean;
}

interface Span {
  start: number;
  end: number;
}

const TIME = /\b\d{1,2}(?::\d{2})?\s?(?:[ap]\.?m\.?)(?![\p{L}])/giu;
const DURATION = /\b\d+\s(?:minutes?|hours?|days?|weeks?|months?|people|members)\b/gi;
const LABELED_NUMBER = /\b([A-Za-z]+)\s(\d+)\b/g;
const PROPER_NOUN = /\p{Lu}[\p{L}'’-]*(?:\s\p{Lu}[\p{L}'’-]*)*/gu;

/** Palabras que no son contexto del número ("at 3" no dice nada). */
const FUNCTION_WORDS = new Set(
  "at by in on for of to the a an about around before after until from with and or is are was".split(" "),
);

function matches(re: RegExp, text: string): Span[] {
  return [...text.matchAll(re)].map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length }));
}

function nameSpans(text: string, names: string[]): Span[] {
  return names
    .filter((n) => n.trim())
    .flatMap((n) => {
      const out: Span[] = [];
      for (let i = text.indexOf(n); i !== -1; i = text.indexOf(n, i + n.length)) out.push({ start: i, end: i + n.length });
      return out;
    });
}

const overlaps = (a: Span, b: Span) => a.start < b.end && b.start < a.end;

/** "sprint 14", "gate 12": el número con su etiqueta, salvo si ya es hora o duración. */
function labeledNumbers(text: string, measures: Span[]): Span[] {
  return [...text.matchAll(LABELED_NUMBER)]
    .filter((m) => !FUNCTION_WORDS.has(m[1].toLowerCase()))
    .map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length }))
    .filter((s) => !measures.some((t) => overlaps(s, t)));
}

function startsSentence(text: string, at: number): boolean {
  return /(^|[.!?:—])$/.test(text.slice(0, at).trimEnd());
}

/** Nombres propios en mitad de la oración; la mayúscula que abre la oración no cuenta. */
function properNouns(text: string): Span[] {
  return [...text.matchAll(PROPER_NOUN)].flatMap((m) => {
    let start = m.index ?? 0;
    let word = m[0];
    if (startsSentence(text, start)) {
      const space = word.indexOf(" ");
      if (space === -1) return [];
      start += space + 1;
      word = word.slice(space + 1);
    }
    if (word === "I") return [];
    return [{ start, end: start + word.length }];
  });
}

/** Une solapes: gana el tramo que empieza antes (y, a igual inicio, el más largo). */
function merge(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Span[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.start < last.end) last.end = Math.max(last.end, s.end);
    else out.push({ ...s });
  }
  return out;
}

/** Horas del texto normalizadas ("2 PM" y "2:00pm" son la misma: "2:00pm"). */
export function extractTimes(text: string): string[] {
  return [...text.matchAll(TIME)].map((m) => {
    const compact = m[0].toLowerCase().replace(/[\s.]/g, "");
    const [, hour, minutes = "00", meridiem] = compact.match(/^(\d{1,2})(?::(\d{2}))?([ap]m)$/) ?? [];
    return `${hour}:${minutes}${meridiem}`;
  });
}

/** Parte *text* en segmentos; los `key` son las frases a resaltar. */
export function highlightScenePhrases(text: string, names: string[]): SceneSegment[] {
  if (!text) return [];
  const measures = [...matches(TIME, text), ...matches(DURATION, text)];
  const spans = merge([
    ...nameSpans(text, names),
    ...measures,
    ...labeledNumbers(text, measures),
    ...properNouns(text),
  ]);
  const out: SceneSegment[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start > cursor) out.push({ text: text.slice(cursor, s.start), key: false });
    out.push({ text: text.slice(s.start, s.end), key: true });
    cursor = s.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), key: false });
  return out;
}
