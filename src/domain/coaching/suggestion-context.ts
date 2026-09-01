/**
 * El contexto que reciben las sugerencias de respuesta.
 *
 * El "why": las 3 sugerencias se pedían con UNA sola cosa —la última línea del
 * agente, cruda—. Sin saber en qué escena está, con quién habla, qué tema está
 * preguntando la persona ni qué ya contó, el modelo devolvía continuaciones
 * genéricas ("Sure, that sounds good") que no respondían nada. Aquí se arma el
 * contexto completo, acotado para que no crezca con la escena.
 *
 * Dominio puro: sólo texto.
 */

/** Turnos ya dichos por el aprendiz que viajan al prompt (los más recientes). */
const MAX_SAID_SO_FAR = 4;

export interface SuggestionContextArgs {
  /** Lo último que dijo la persona: es lo que hay que responder. */
  lastAgentLine: string;
  personaName?: string;
  personaRole?: string;
  situationTitle?: string;
  /** Lo que el aprendiz ya dijo en esta escena, del más viejo al más nuevo. */
  saidSoFar: readonly string[];
  /** Tema que la persona está preguntando ahora (ítem pendiente del checklist). */
  pendingAsk?: string;
}

export function buildSuggestionContext(args: SuggestionContextArgs): string {
  const { lastAgentLine, personaName, personaRole, situationTitle, saidSoFar, pendingAsk } = args;
  const lines: string[] = [];
  if (personaName) {
    const who = personaRole ? `${personaName}, the ${personaRole}` : personaName;
    lines.push(`The learner is talking with ${who}.`);
  }
  if (situationTitle) lines.push(`Scene: ${situationTitle}.`);
  if (pendingAsk) lines.push(`They are being asked about ${pendingAsk}.`);
  const recent = saidSoFar.slice(-MAX_SAID_SO_FAR);
  if (recent.length > 0) {
    lines.push(`Already said by the learner (do not repeat):\n${recent.map((s) => `- ${s}`).join("\n")}`);
  }
  lines.push(`Agent's last message: ${lastAgentLine}`);
  return lines.join("\n");
}

/** Palabras de contenido (≥4 letras) para medir solapamiento. */
function contentWords(text: string): string[] {
  return text.toLowerCase().match(/[a-záéíóúñ']{4,}/g) ?? [];
}

/** Raíz burda: recorta sufijos flexivos para que "blocking" case con "blocked". */
function stem(word: string): string {
  return word.replace(/(?:ing|ed|es|s)$/u, "");
}

/**
 * Ordena `items` por solapamiento léxico con `query` y devuelve los `k` mejores.
 *
 * Reemplaza al `slice(0, 4)` del catálogo: las frases de ayuda salían siempre
 * las mismas cuatro de la unidad, sin relación con lo que la persona acababa de
 * preguntar. Solapamiento de raíces, no embeddings: es determinista, no cuesta
 * una llamada al modelo y para un banco de frases corto alcanza.
 */
export function rankByRelevance(items: readonly string[], query: string, k: number): string[] {
  if (items.length === 0 || k <= 0) return [];
  const wanted = new Set(contentWords(query).map(stem));
  const scored = items.map((item, index) => {
    const words = contentWords(item).map(stem);
    const hits = words.filter((w) => wanted.has(w)).length;
    return { item, index, score: hits };
  });
  // Empate ⇒ gana el orden del catálogo: sin desempate estable el mismo
  // contexto devolvía frases distintas en cada render.
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, k).map((s) => s.item);
}
