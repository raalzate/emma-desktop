/**
 * Las diez reglas del método (0.7) y los cinco errores de método a evitar
 * (0.8), transcritos del libro. Sirven de base para coaching/UI: mensajes de
 * refuerzo o advertencias contextuales sin duplicar el texto en la interfaz.
 */

export interface MethodRule {
  readonly id: number;
  readonly rule: string;
  readonly detail: string;
}

export const METHOD_RULES: readonly MethodRule[] = [
  {
    id: 1,
    rule: "40 minutes a day beat 4 hours on Saturday.",
    detail: "Spacing matters more than total volume.",
  },
  {
    id: 2,
    rule: "Never study a word on its own.",
    detail: "Always in a chunk, always with its collocation.",
  },
  {
    id: 3,
    rule: "If you haven't said it out loud, you don't know it.",
    detail: "Pronunciation is learned with the muscles, not the eyes.",
  },
  {
    id: 4,
    rule: "Translate from Spanish into English, not the other way around.",
    detail:
      "Reverse translation (ES→EN) forces production; direct translation (EN→ES) only checks comprehension.",
  },
  {
    id: 5,
    rule: "Make the mistake out loud.",
    detail: "A silent mistake never gets corrected. Ericsson needs something to correct.",
  },
  {
    id: 6,
    rule: "Write first, speak later.",
    detail:
      "Writing gives you time to process the structure; speaking automates it. In that order, the same sentence.",
  },
  {
    id: 7,
    rule: "No Spanish subtitles.",
    detail: "No subtitles, or English subtitles. Your brain will read and switch off your ears.",
  },
  {
    id: 8,
    rule: "One goal per session.",
    detail: "Cognitive load: you can't attend to pronunciation, grammar and vocabulary at once.",
  },
  {
    id: 9,
    rule: "Discomfort is the sign that it's working.",
    detail: "If the review feels easy, the interval is too short.",
  },
  {
    id: 10,
    rule: "Use English at work today.",
    detail:
      "Switch your IDE language, write your commits in English, comment your code in English, read release notes in English.",
  },
] as const;

export const METHOD_MISTAKES: readonly MethodRule[] = [
  {
    id: 1,
    rule: "Watching shows without structure and calling it study.",
    detail:
      "Input without noticing or output does not produce productive acquisition. Do it as input + task + production.",
  },
  {
    id: 2,
    rule: "Studying vocabulary lists.",
    detail:
      "Words without collocation or context can't be retrieved when speaking. Use chunks in cloze cards.",
  },
  {
    id: 3,
    rule: "Learning grammar for grammar's sake.",
    detail:
      "It produces inert declarative knowledge. Put grammar at the service of a task.",
  },
  {
    id: 4,
    rule: 'Waiting until you "feel ready" to speak.',
    detail: "Fluency doesn't precede use; it follows from it. Speak badly and out loud from day 1.",
  },
  {
    id: 5,
    rule: "Chasing a native accent.",
    detail: "An unreachable, demotivating goal. Chase intelligibility instead.",
  },
] as const;
