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
  "## Simulation complete — good job!\n\n" +
  "You completed the **{scenario}** scenario in {turns} turns with no grammar " +
  "slips captured. Nice work — no lesson needed this time.";

export const HEADER_TEMPLATE =
  "## Language code review — {scenario}\n\n" +
  "**Turns:** {turns}    **Silent captures:** {count}\n\n";

export const TABLE_HEADER = "| # | Type | What you said | Suggested |\n|---|---|---|---|\n";
export const PATTERN_HEADER = "\n### Recurring patterns\n";
export const LESSON_HEADER = "\n### Practice lesson\n";

export const CHARACTER_COMMENTARY: Record<SituationCharacter, string> = {
  incident:
    "**Situation dimension — confidence under urgency:** incidents test whether you " +
    "stay direct and reassure the room while you triage. " +
    "Watch out for hedging and long preambles.",
  onboarding:
    "**Situation dimension — clarity and jargon calibration:** onboarding contexts " +
    "reward explicit terminology glossaries and checking for understanding.",
  conflict:
    "**Situation dimension — diplomatic framing:** conflict moments reward " +
    "softeners, acknowledging the other side, and reframing the disagreement " +
    "as a trade-off of interests.",
  routine:
    "**Situation dimension — concision and structure:** routine updates reward " +
    "short, predictable scaffolds (done / next / blockers).",
};
