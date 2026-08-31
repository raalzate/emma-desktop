/**
 * Lo que EMMA sabe de sí misma: una descripción compacta de sus propias
 * dinámicas (para prompts de sistema) y un resumen del TutorContext para
 * bloques de bienvenida/lección post-sesión. Puro, sin IO, determinista.
 */

import type { PracticeRecommendation } from "./practice-recommender";
import type { TutorContext } from "./tutor-context";

/** Descripción en español de las dinámicas disponibles, para prompts del agente. */
export const SYSTEM_MAP_ES = `Soy EMMA, tutora de inglés conversacional. Mis dinámicas:
- Simulación por escenarios con una misión concreta que cumplir en inglés.
- Corrección silenciosa: nunca interrumpo, guardo el error para después.
- "Teach me": explico a demanda un punto de gramática o vocabulario.
- Traducción ES→EN de frases que el aprendiz no sabe decir.
- Chips de respuesta sugerida cuando el aprendiz se traba.
- Lección post-sesión con los errores recogidos durante la práctica.
- Sección Práctica: ejercicios con solucionario por unidad del libro.
- Repaso SRS con el sistema Leitner (5 cajas, falla vuelve a la caja 1).
- Laboratorio de pares mínimos para entrenar contrastes fonéticos.
- Shadowing para practicar ritmo, enlace y entonación.
- Plan de 24 semanas que ordena las 26 unidades del curso.
- Autoevaluación A1→B2 con la regla 13/15 de B2 (bases A1-B1 completas).
- Progreso por número de errores por turno y racha de 3 sin errores.`;

const RECOMMENDATIONS_IN_BRIEFING = 2;

function reasonOf(recommendation: PracticeRecommendation): string {
  return recommendation.reasonEs;
}

/** Frase compacta con la semana, unidad y tarjetas pendientes. */
function progressLine(ctx: TutorContext): string {
  const parts = [`Semana ${ctx.currentWeek} del plan`];
  if (ctx.activeUnit !== null) parts.push(`Unidad ${ctx.activeUnit}`);
  parts.push(`${ctx.pendingSrsCards} tarjetas pendientes`);
  return parts.join(" · ");
}

/** Frase con las categorías de error débiles, si hay alguna. */
function weaknessLine(ctx: TutorContext): string | null {
  if (ctx.weakErrorCategories.length === 0) return null;
  return `débil en ${ctx.weakErrorCategories.join(", ")}`;
}

/** Frase con las razones de las primeras recomendaciones, si hay alguna. */
function recommendationsLine(ctx: TutorContext): string | null {
  if (ctx.recommendations.length === 0) return null;
  return ctx.recommendations.slice(0, RECOMMENDATIONS_IN_BRIEFING).map(reasonOf).join(" · ");
}

/**
 * Bloque en español (≤120 palabras) para prompts de bienvenida/lección:
 * semana, unidad, tarjetas pendientes, categorías débiles y recomendaciones
 * con su razón. Determinista: la misma entrada produce la misma salida.
 */
export function buildTutorBriefing(ctx: TutorContext): string {
  const lines = [progressLine(ctx), weaknessLine(ctx), recommendationsLine(ctx)].filter(
    (line): line is string => line !== null,
  );
  return lines.join(" · ");
}
