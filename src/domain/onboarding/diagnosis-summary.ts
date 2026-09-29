/**
 * Agrega las notas de error del onboarding en un diagnóstico amable para el
 * aprendiz (FR-009/010). Determinista.
 */

export const DISPLAY_CAP = 3;

const CATEGORY_LABELS: Record<string, string> = {
  "two failed attempts": "expressing answers clearly",
  "non-numeric value after retry": "numbers and quantities",
  tense_error: "verb tenses",
  article_misuse: "articles (a/an/the)",
  spanish_interference: "direct translations from Spanish",
};

export interface CategoryCount {
  category: string;
  count: number;
}

export interface DiagnosisSummary {
  categories: CategoryCount[];
  totalIssues: number;
}

/** Top categorías por frecuencia desc, desempate alfabético, capado. */
export function summarize(notes: string[], cap: number = DISPLAY_CAP): DiagnosisSummary {
  const counts = new Map<string, number>();
  for (const note of notes) counts.set(note, (counts.get(note) ?? 0) + 1);
  const ordered = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const categories = ordered.slice(0, cap).map(([category, count]) => ({ category, count }));
  return { categories, totalIssues: notes.length };
}

/** Etiqueta humana para una categoría — nunca una clave técnica (FR-009). */
export function friendlyLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replaceAll("_", " ");
}
