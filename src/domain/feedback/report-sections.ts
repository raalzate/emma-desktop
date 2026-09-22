/**
 * Corta el reporte de cierre en las partes que la UI renderiza distinto.
 *
 * El "why": la lección de Emma viaja DENTRO del markdown del reporte
 * (`composeSessionSummary`), así que el diálogo la pintaba como texto plano y el
 * audio quedaba arriba, lejos de lo que se escucha. Para leerla en karaoke hay
 * que sacarla del markdown y renderizarla como transcripción (#171). Dominio
 * puro: sólo texto.
 */

/** Encabezado exacto de la sección de lección en el reporte. */
const LESSON_HEADING = "### 📚 Lección de Emma";

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
  const start = report.indexOf(LESSON_HEADING);
  if (start < 0) return { before: report, after: "" };
  const rest = report.slice(start + LESSON_HEADING.length);
  // La lección termina donde empieza la siguiente sección de nivel 3.
  const nextHeading = rest.indexOf("\n### ");
  return {
    before: report.slice(0, start).trimEnd(),
    after: nextHeading < 0 ? "" : rest.slice(nextHeading + 1).trimEnd(),
  };
}
