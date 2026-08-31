/**
 * Saneado de la salida cruda del modelo local (Gemma/LiteRT).
 *
 * El modelo pequeño degenera: repite tokens en bucle (p.ej. "**[다음]**
 * **[다음]**…"), filtra marcadores de plantilla ("**[Your Name]**") y escupe
 * scripts no latinos (hangul/CJK) que no corresponden a un tutor de inglés. Este
 * módulo limpia esas patologías en la FUENTE, para que la burbuja, el TTS, el
 * karaoke y Teach me reciban texto natural. No reescribe contenido legítimo:
 * sólo elimina artefactos de degeneración.
 */

// Placeholders de plantilla que el modelo copia del prompt: [Your Name], [다음], etc.
const TEMPLATE_PLACEHOLDER = /\*{0,2}\[[^\]\n]{0,40}\]\*{0,2}/g;
// Escrituras no latinas: CJK/Hangul/kana + cirílico, hebreo, árabe, devanagari
// y tailandés (visto en producción, BUG-001). Un tutor de inglés nunca las emite.
const NON_LATIN_SOURCE =
  "[\\u0400-\\u04FF\\u0590-\\u05FF\\u0600-\\u06FF\\u0900-\\u097F\\u0E00-\\u0E7F\\u3000-\\u9FFF\\uAC00-\\uD7AF\\uFF00-\\uFFEF]+";
const NON_LATIN_SCRIPT = new RegExp(NON_LATIN_SOURCE, "g");

/** ¿Contiene el texto alguna escritura no latina? (señal para la compuerta de streaming) */
export function hasNonLatinScript(text: string): boolean {
  return new RegExp(NON_LATIN_SOURCE).test(text);
}

// Marcadores de idioma extranjero que NO cubre el filtro de runas: vietnamita
// usa escritura latina con diacríticos propios (đ, ơ, ư, ă + Latin Extended
// Additional). Un solo carácter de estos delata la oración completa.
const FOREIGN_MARKER = new RegExp(
  NON_LATIN_SOURCE.slice(0, -2) + "\\u0102\\u0103\\u01A0\\u01A1\\u01AF\\u01B0\\u0110\\u0111\\u1E00-\\u1EFF]",
);

/**
 * Elimina ORACIONES completas con marcadores extranjeros: extirpar solo las
 * runas dejaría escombros ("b n ang nói v…"). Se conservan las oraciones
 * inglesas/españolas alrededor.
 */
function dropForeignSentences(text: string): string {
  return text
    .split(/(?<=[.!?…])\s+|\n/)
    .filter((s) => !FOREIGN_MARKER.test(s))
    .join(" ");
}
// Marcadores de énfasis Markdown que la burbuja de voz mostraría crudos.
const MARKDOWN_EMPHASIS = /(\*\*|__|\*|_|`)/g;

/** Colapsa una misma palabra/segmento repetido en cadena (bucle de degeneración). */
function collapseRepeats(text: string): string {
  const tokens = text.split(/(\s+)/);
  const out: string[] = [];
  let last = "";
  let streak = 0;
  for (const tok of tokens) {
    if (tok.trim() === "") {
      out.push(tok);
      continue;
    }
    if (tok === last) {
      streak++;
      if (streak >= 2) continue; // 3ª repetición consecutiva en adelante → descarta
    } else {
      streak = 0;
      last = tok;
    }
    out.push(tok);
  }
  return out.join("");
}

/** Limpia la salida cruda del LLM de artefactos de degeneración del modelo local. */
export function sanitizeReply(raw: string): string {
  const cleaned = dropForeignSentences(raw)
    .replace(TEMPLATE_PLACEHOLDER, " ")
    .replace(NON_LATIN_SCRIPT, " ")
    .replace(MARKDOWN_EMPHASIS, "")
    .replace(/-{3,}/g, " ") // separadores "---" que el modelo intercala
    // Paréntesis vacíos o con solo puntuación: "( .)", "()" — artefacto del modelo.
    .replace(/\(\s*[.,;:!?…]*\s*\)/g, " ")
    // Puntuación huérfana que queda al extirpar texto no latino (" . Ok" → " Ok").
    .replace(/(^|\s)[.!?,;:…]+(?=\s|$)/g, "$1")
    // Comillas huérfanas al inicio ("'' bạn…" → tras el drop queda "'' ").
    .replace(/^\s*['’"“”`]{2,}\s*/, "")
    // Etiqueta de hablante copiada del transcript ("You:", "Sofía Torres:").
    .replace(/^\s*(?:You|Learner|Emma|[A-ZÁÉÍÓÚÑ][\wáéíóúñü']+ [A-ZÁÉÍÓÚÑ][\wáéíóúñü']+):\s+/, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  return collapseRepeats(cleaned).trim();
}
