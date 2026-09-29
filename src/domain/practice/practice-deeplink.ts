/**
 * Deep-link de la ruta Práctica (?tab=&unit=). El "why": «Empezar» en Mis
 * lecciones y las recomendaciones de Emma navegan a /practice con parámetros;
 * la página debe resolverlos igual al montar y cuando cambian ya montada.
 */

export const PRACTICE_TABS = [
  "exercises",
  "srs",
  "pronunciation",
  "plan",
  "self-assessment",
  "challenges",
] as const;

export type PracticeTabValue = (typeof PRACTICE_TABS)[number];

// Alias usado por las recomendaciones para la autoevaluación.
const TAB_ALIASES: Record<string, PracticeTabValue> = { assessment: "self-assessment" };

export interface PracticeTarget {
  tab: PracticeTabValue;
  unit: number | undefined;
}

function isTab(value: string): value is PracticeTabValue {
  return (PRACTICE_TABS as readonly string[]).includes(value);
}

export function practiceTargetFromSearch(params: URLSearchParams): PracticeTarget {
  const requested = params.get("tab") ?? "";
  const aliased = TAB_ALIASES[requested] ?? requested;
  const tab: PracticeTabValue = isTab(aliased) ? aliased : "exercises";
  const rawUnit = params.get("unit");
  const parsed = rawUnit === null ? NaN : Number(rawUnit);
  const unit = Number.isInteger(parsed) ? parsed : undefined;
  return { tab, unit };
}
