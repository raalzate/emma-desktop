/**
 * Parsers lenientes de la salida `KEY: value` del modelo pequeño → objetos valor.
 *
 * Cada llamada de sección devuelve texto suelto y con deriva de formato (el
 * modelo local pone las claves en negrita, omite prefijos, se salta el separador
 * `::`). Estos parsers son deliberadamente tolerantes; el renderizado vive en
 * teaching-markdown.ts. Reflejan la leniencia del original en Python 1:1.
 */

import type {
  GrammarStructure,
  PronunciationRow,
  ReplySuggestion,
} from "@/domain/english-teacher/teaching-models";

// Marcadores de lista que el modelo puede emitir en vez de `REPLY:`; separadores de nota.
const LIST_MARKER = /^\s*(?:[-*•]|\d+[.)])\s+/;
const NOTE_SEPARATORS = ["::", " — ", " - "];

const MAX_GRAMMAR_POINTS = 4;
const MAX_PHONETIC_ROWS = 10; // una fila por frase — cubre el mensaje entero
const GRAMMAR_FIELDS: Array<[string, keyof GrammarStructure]> = [
  ["PATTERN", "pattern"],
  ["EXAMPLE", "example"],
  ["WHY", "explanation"],
];
// El modelo etiqueta cada bloque de gramática con un header Markdown
// (**Imperative**, **Structure 1: Imperative**) mucho más a menudo que el
// prefijo `STRUCTURE:` pedido, así que aceptamos todas esas formas.
const BOLD_HEADER = /^(?:\*{1,2}\s*(.+?)\s*\*{1,2}|#{1,4}\s+(.+))$/;
const STRUCTURE_HEADER = /^structure\s*\d*\s*:\s*(.+)$/i;
const NON_LABELS = ["PATTERN", "EXAMPLE", "WHY", "STRUCTURE", "TIP", "PHRASE"];

// splitlines() de Python: rompe en \r\n, \r y \n.
const splitLines = (raw: string): string[] => raw.split(/\r\n|\r|\n/);
const stripEnds = (s: string, chars: RegExp): string => s.replace(chars, "");
const startsWithAny = (s: string, prefixes: string[]): boolean =>
  prefixes.some((p) => s.startsWith(p));

/** Texto tras `KEY:`, tolerando viñetas/negrita/marcas de header Markdown. */
function after(line: string, key: string): string {
  const stripped = line.trim().replace(/^[*#> ]+/, "").trim();
  if (stripped.toUpperCase().startsWith(`${key}:`)) {
    return stripEnds(stripped.slice(key.length + 1).trim(), /^[*#]+|[*#]+$/g).trim();
  }
  return "";
}

/** Header de bloque de gramática: `STRUCTURE[ N]: x` o un header Markdown `**x**`. */
function structureLabel(line: string): string {
  const bold = BOLD_HEADER.exec(line.trim());
  const inner = bold
    ? (bold[1] ?? bold[2] ?? "").trim()
    : line.trim().replace(/^[*#> ]+/, "").trim();
  const numbered = STRUCTURE_HEADER.exec(inner);
  if (numbered) {
    return stripEnds(numbered[1].trim(), /^[*#]+|[*#]+$/g).trim();
  }
  if (bold && !startsWithAny(inner.toUpperCase(), NON_LABELS)) {
    return stripEnds(inner, /^[*#]+|[*#]+$/g).trim();
  }
  return "";
}

function applyGrammarField(point: GrammarStructure, line: string): void {
  for (const [key, attr] of GRAMMAR_FIELDS) {
    const value = after(line, key);
    if (value) {
      point[attr] = value;
    }
  }
}

/** Divide la salida de gramática en bloques (STRUCTURE: o headers Markdown). */
export function parseGrammarPoints(raw: string): GrammarStructure[] {
  const points: GrammarStructure[] = [];
  let current: GrammarStructure | null = null;
  for (const line of splitLines(raw)) {
    const label = structureLabel(line);
    if (label) {
      current = { label, pattern: "", example: "", explanation: "" };
      points.push(current);
    } else if (current !== null) {
      applyGrammarField(current, line);
    }
  }
  return points.filter((p) => p.label).slice(0, MAX_GRAMMAR_POINTS);
}

function splitReply(body: string): ReplySuggestion | null {
  for (const sep of NOTE_SEPARATORS) {
    const idx = body.indexOf(sep);
    if (idx !== -1) {
      const english = body.slice(0, idx).trim();
      const note = body.slice(idx + sep.length).trim();
      return english ? { english, note } : null;
    }
  }
  const t = body.trim();
  return t ? { english: t, note: "" } : null;
}

export function parseReplies(raw: string): ReplySuggestion[] {
  // Leniente: prefiere líneas REPLY:, si no cae a líneas con viñeta/numeradas —
  // el modelo pequeño a menudo omite el prefijo o el separador de nota `::`.
  const tagged: ReplySuggestion[] = [];
  const loose: ReplySuggestion[] = [];
  for (const line of splitLines(raw)) {
    const stripped = line.trim();
    const isTagged = stripped.toUpperCase().startsWith("REPLY:");
    if (!isTagged && !LIST_MARKER.test(stripped)) {
      continue;
    }
    const body = isTagged
      ? stripped.slice("REPLY:".length)
      : stripped.replace(LIST_MARKER, "");
    const reply = splitReply(body.trim());
    if (reply) {
      (isTagged ? tagged : loose).push(reply);
    }
  }
  return (tagged.length ? tagged : loose).slice(0, 3);
}

/** Quita markdown/pipes/corchetes de placeholder para que el valor sea seguro en celda. */
function cleanCell(value: string): string {
  return stripEnds(value.trim(), /^[*`<>]+|[*`<>]+$/g).replace(/\|/g, "/").trim();
}

/** Parsea líneas `frase | suena-como | traducción`; leniente ante un campo ausente. */
export function parsePhonetics(raw: string): PronunciationRow[] {
  const entries: PronunciationRow[] = [];
  for (const line of splitLines(raw)) {
    const cells = [...line.split("|").map(cleanCell), "", "", ""];
    const word = cells[0].replace(/^[-*•0-9. ]+/, "").trim();
    if (!word || startsWithAny(word.toUpperCase(), ["WORD", "INGL", "PRON", "IPA"])) {
      continue;
    }
    const sounds = cells[1];
    const translation = cells[2];
    if (sounds || translation) {
      entries.push({ word, sounds, translation });
    }
  }
  return entries.slice(0, MAX_PHONETIC_ROWS);
}
