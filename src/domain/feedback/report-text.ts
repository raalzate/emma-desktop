/** Plantillas del reporte de feedback + comentario por carácter de situación (verbatim). */

/** Carácter (tono/urgencia) de una variante de situación — dispara el comentario. */
export const SituationCharacter = {
  INCIDENT: "incident",
  ONBOARDING: "onboarding",
  CONFLICT: "conflict",
  ROUTINE: "routine",
} as const;

export type SituationCharacter = (typeof SituationCharacter)[keyof typeof SituationCharacter];

export const NO_ERRORS_TEMPLATE =
  "## Simulación completada — ¡buen trabajo!\n\n" +
  "Completaste el escenario **{scenario}** en {turns} turnos sin desviaciones " +
  "gramaticales capturadas. Buen desempeño — no se necesita lección esta vez.";

export const HEADER_TEMPLATE =
  "## Revisión de código lingüística — {scenario}\n\n" +
  "**Turnos:** {turns}    **Capturas silenciosas:** {count}\n\n";

export const TABLE_HEADER = "| # | Tipo | Lo que dijiste | Sugerido |\n|---|---|---|---|\n";
export const PATTERN_HEADER = "\n### Patrones recurrentes\n";
export const LESSON_HEADER = "\n### Lección de práctica\n";

export const CHARACTER_COMMENTARY: Record<SituationCharacter, string> = {
  incident:
    "**Dimensión de la situación — confianza bajo urgencia:** los incidentes ponen a " +
    "prueba si te mantienes directo y tranquilizas a la sala mientras haces triage. " +
    "Cuidado con los rodeos y los preámbulos largos.",
  onboarding:
    "**Dimensión de la situación — claridad y calibración de jerga:** los contextos de " +
    "onboarding premian glosarios explícitos de terminología y verificar que se entendió.",
  conflict:
    "**Dimensión de la situación — encuadre diplomático:** los momentos de conflicto " +
    "premian los suavizantes, reconocer la otra parte, y reencuadrar el desacuerdo " +
    "como un intercambio de intereses.",
  routine:
    "**Dimensión de la situación — concisión y estructura:** las actualizaciones de " +
    "rutina premian andamiajes breves y predecibles (hecho / siguiente / bloqueos).",
};
