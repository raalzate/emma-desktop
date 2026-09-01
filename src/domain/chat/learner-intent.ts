/**
 * Qué está haciendo el aprendiz con su mensaje: jugar la escena, saludar, o
 * salirse a preguntar por el idioma.
 *
 * El "why" (incidente): el checklist de escena consumía CUALQUIER mensaje con
 * dos palabras de contenido. Escribir "what does blocker mean?" cubría el
 * objetivo, guardaba esa frase como HECHO del aprendiz y al turno siguiente el
 * prompt afirmaba `You already know — blockers: "what does blocker mean?"`. La
 * persona daba por dicho algo que nunca se dijo y la escena avanzaba sola.
 * Distinguir la intención ANTES de tocar el estado corta eso de raíz.
 *
 * Dominio puro: sólo texto, sin IO ni LLM (una clasificación que depende del
 * modelo pequeño sería otra fuente de ruido, no un freno).
 */

/** Qué hace el mensaje del aprendiz dentro de la conversación. */
export type LearnerIntent = "in-scene" | "greeting" | "meta";

/** El mensaje ARRANCA saludando (turno social, no respuesta al objetivo). */
const OPENING_GREETING =
  /^\s*(?:hey|hi|hello|good\s+(?:morning|afternoon|evening)|morning|afternoon|evening)\b/i;

/**
 * Un saludo es SÓLO social si no trae trabajo detrás: "Hi Sofía, I shipped the
 * API" saluda y contesta, y eso sí cubre el objetivo.
 */
const GREETING_ONLY_TAIL =
  /^(?:[a-záéíóúñü'’,!.\s]{0,40})?(?:how are you|how'?s it going|how are things)?[?!.\s]*$/i;

/**
 * Pedidos de ayuda con el IDIOMA o con el ejercicio. Anclados a fórmulas que en
 * una conversación de trabajo no aparecen: "what does X mean", "how do you say".
 * Deliberadamente estrechos — "I don't understand the ticket" es un problema
 * real del trabajo y debe seguir siendo contenido de escena.
 */
const META_MARKERS: RegExp[] = [
  /\bwhat (?:does|do) .{0,40}\bmean\b/i,
  /\bhow (?:do|would) (?:i|you) say\b/i,
  /\bcan you (?:repeat|say that again|speak slower|explain that)\b/i,
  /\b(?:say|repeat) that again\b/i,
  /\bi don'?t (?:understand|get it)\s*[.!?]?$/i,
  /\bi don'?t know (?:what|how) to (?:say|answer|write|reply)\b/i,
  /\bwhat should i (?:say|answer|write|reply)\b/i,
  /\b(?:in|into) spanish\b/i,
  /\btranslate\b/i,
  /\bsorry,?\s*(?:what|again)\b\s*[?]?$/i,
];

/**
 * Marcas de que el aprendiz dejó el inglés (salirse del idioma es salirse de la
 * escena). Se buscan PALABRAS españolas, no tildes sueltas: los nombres de las
 * protopersonas las llevan y "Hi Sofía" no es escribir en español.
 */
const SPANISH_MARKERS =
  /[¿¡]|\b(?:que|qué|como|cómo|porque|porqué|pero|entonces|estoy|tengo|puedo|quiero|hola|gracias|ayuda|significa|entiendo|entender|perdón|disculpa|no\s+sé)\b/i;

/** ¿El mensaje es sólo un saludo, sin trabajo detrás? */
function isGreetingOnly(message: string): boolean {
  if (!OPENING_GREETING.test(message)) return false;
  const tail = message.replace(OPENING_GREETING, "");
  return GREETING_ONLY_TAIL.test(tail.trim());
}

export function classifyLearnerIntent(message: string): LearnerIntent {
  const clean = message.trim();
  if (clean === "") return "meta";
  if (META_MARKERS.some((marker) => marker.test(clean))) return "meta";
  if (SPANISH_MARKERS.test(clean)) return "meta";
  if (isGreetingOnly(clean)) return "greeting";
  return "in-scene";
}

/** ¿Este mensaje puede cubrir un objetivo del checklist de escena? */
export function isSceneContribution(message: string): boolean {
  return classifyLearnerIntent(message) === "in-scene";
}

/**
 * Directiva de reparación EN PERSONAJE: la persona no explica gramática (eso lo
 * hace Emma al final, en la lección) — reformula lo suyo más simple y devuelve
 * la palabra. Así el aprendiz recibe ayuda sin que se rompa la ficción.
 */
export const REPAIR_CUE =
  "They did not follow you, or slipped out of English. Say the same thing again " +
  'in simpler words and hand them an easy way in — like "Sorry, let me put it ' +
  'another way: what are you picking up today?" Do not teach grammar and do not ' +
  "switch language: you are a colleague, not a teacher.";

/** Directiva del turno social: se devuelve el saludo antes de entrar en materia. */
export const GREETING_CUE =
  "They just greeted you. Greet them back warmly by name in one short line, " +
  "then open the scene with your first question.";
