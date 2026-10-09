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
  "challenges",
] as const;

export type PracticeTabValue = (typeof PRACTICE_TABS)[number];

export interface PracticeTarget {
  tab: PracticeTabValue;
  unit: number | undefined;
}

function isTab(value: string): value is PracticeTabValue {
  return (PRACTICE_TABS as readonly string[]).includes(value);
}

/** Unidad numérica de un parámetro de la URL; `null`/no entero cae a `undefined`. */
export function parsePracticeUnit(raw: string | null): number | undefined {
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function practiceTargetFromSearch(params: URLSearchParams): PracticeTarget {
  const requested = params.get("tab") ?? "";
  const tab: PracticeTabValue = isTab(requested) ? requested : "exercises";
  const unit = parsePracticeUnit(params.get("unit"));
  return { tab, unit };
}

/**
 * H6 (#199): cada pestaña dejó de ser un `<TabsContent>` y es una ruta propia
 * bajo /practice. Esta es la única tabla de mapeo tab → ruta.
 */
const PRACTICE_ROUTE: Record<PracticeTabValue, string> = {
  exercises: "/practice/exercises",
  srs: "/practice/review",
  pronunciation: "/practice/pronunciation",
  plan: "/practice/plan",
  challenges: "/practice/challenges",
};

/** Destino de una pestaña como ruta propia, con los parámetros que traiga. */
export function practiceHrefFor(
  tab: PracticeTabValue,
  query: Record<string, string | number | undefined> = {},
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return `${PRACTICE_ROUTE[tab]}/${qs ? `?${qs}` : ""}`;
}

/**
 * Compatibilidad con enlaces viejos guardados (todos anotados, marcadores):
 * `/practice?tab=X` ya no existe como pestaña, así que se resuelve a la ruta
 * nueva conservando el resto de los parámetros (`unit`, `exercise`, `contrast`, `level`).
 * Devuelve `null` cuando no hay nada que redirigir.
 */
export function legacyPracticeRedirect(search: URLSearchParams): string | null {
  if (!search.has("tab")) return null;
  const target = practiceTargetFromSearch(search);
  const query: Record<string, string> = {};
  for (const [key, value] of search.entries()) {
    if (key === "tab" || key === "unit") continue;
    query[key] = value;
  }
  if (target.unit !== undefined) query.unit = String(target.unit);
  return practiceHrefFor(target.tab, query);
}
