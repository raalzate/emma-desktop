/**
 * Renderiza las secciones parseadas al Markdown final del ayudante de inglés.
 *
 * Formato puro sobre los objetos valor de teaching-models; el parseo vive en
 * teaching-parsers. La pronunciación es una tabla de solo texto (no hay audio).
 */

import type {
  GrammarStructure,
  PronunciationRow,
  ReplySuggestion,
} from "@/domain/english-teacher/teaching-models";

function phoneticsMd(entries: PronunciationRow[]): string {
  if (entries.length === 0) {
    return "";
  }
  const rows = ["| Inglés | Pronunciación | Traducción |", "| --- | --- | --- |"];
  for (const e of entries) {
    rows.push(`| ${e.word} | ${e.sounds} | ${e.translation} |`);
  }
  return rows.join("\n");
}

function grammarPointMd(point: GrammarStructure): string {
  // Compacto: label + pattern en una línea, el ejemplo justo debajo, y solo la
  // explicación lleva línea en blanco (para que no la absorba la cita).
  let head = `**${point.label}**`;
  if (point.pattern) {
    head += ` — \`${point.pattern}\``;
  }
  const top = [head];
  if (point.example) {
    top.push(`> ${point.example}`);
  }
  const body = top.join("\n");
  return point.explanation ? `${body}\n\n${point.explanation}` : body;
}

function grammarMd(points: GrammarStructure[]): string {
  return points
    .filter((p) => p.label)
    .map(grammarPointMd)
    .join("\n\n");
}

function repliesMd(replies: ReplySuggestion[]): string {
  return replies
    .map((r) => (r.note ? `- **${r.english}** — ${r.note}` : `- **${r.english}**`))
    .join("\n");
}

/** Ensambla el Markdown final del ayudante a partir de las secciones parseadas. */
export function assembleTeaching(sections: {
  phonetics: PronunciationRow[];
  grammar: GrammarStructure[];
  replies: ReplySuggestion[];
}): string {
  const blocks: Array<[string, string]> = [
    ["### 🗣️ Pronunciation", phoneticsMd(sections.phonetics)],
    ["### 📐 Grammar", grammarMd(sections.grammar)],
    ["### 💡 Reply suggestions", repliesMd(sections.replies)],
  ];
  return blocks
    .filter(([, body]) => body)
    .map(([title, body]) => `${title}\n\n${body}`)
    .join("\n\n");
}
