/**
 * Corta el reporte de cierre en las partes que la UI renderiza distinto.
 *
 * El "why": la lección de Emma viaja DENTRO del markdown del reporte
 * (`composeSessionSummary`), así que el diálogo la pintaba como texto plano y el
 * audio quedaba arriba, lejos de lo que se escucha. Para leerla en karaoke hay
 * que sacarla del markdown y renderizarla como transcripción (#171). Dominio
 * puro: sólo texto.
 */

/**
 * Encabezado exacto de la sección de lección en el reporte. El segundo es el
 * encabezado anterior (Artículo 9 v1.6.0 pasó la UI a inglés): las lecciones
 * ya guardadas en el histórico lo conservan y deben seguir cortándose bien.
 */
const LESSON_HEADINGS = ["### 📚 Emma's lesson", "### 📚 Lección de Emma"] as const;

function findLessonHeading(report: string): { start: number; heading: string } | null {
  for (const heading of LESSON_HEADINGS) {
    const start = report.indexOf(heading);
    if (start >= 0) return { start, heading };
  }
  return null;
}

export interface ReportParts {
  /** Markdown previo a la lección (encabezado y correcciones). */
  before: string;
  /** Markdown posterior a la lección (siguiente paso). Vacío si no había lección. */
  after: string;
}

/**
 * Quita la sección de lección del reporte. Sin esa sección, el reporte se
 * devuelve intacto: el diálogo entonces no muestra bloque de lección.
 */
export function splitReportAtLesson(report: string): ReportParts {
  const found = findLessonHeading(report);
  if (!found) return { before: report, after: "" };
  const { start, heading } = found;
  const rest = report.slice(start + heading.length);
  // La lección termina donde empieza la siguiente sección de nivel 3.
  const nextHeading = rest.indexOf("\n### ");
  return {
    before: report.slice(0, start).trimEnd(),
    after: nextHeading < 0 ? "" : rest.slice(nextHeading + 1).trimEnd(),
  };
}
