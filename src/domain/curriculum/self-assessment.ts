/**
 * Checklists de autoevaluación A1→B2 (Apéndice H). Solo cuentan las cosas que
 * el alumno puede hacer sin preparar, en tiempo real. La certificación B2 no
 * se basa solo en el nivel superior: exige tener cerradas las bases (A1-B1),
 * porque las lagunas de base se arrastran en vez de compensarse.
 */

export type CefrCheckLevel = "A1" | "A2" | "B1" | "B2";

export interface CanDoDescriptor {
  readonly id: string;
  readonly level: CefrCheckLevel;
  readonly text: string;
}

const a1 = (n: number, text: string): CanDoDescriptor => ({ id: `A1-${n}`, level: "A1", text });
const a2 = (n: number, text: string): CanDoDescriptor => ({ id: `A2-${n}`, level: "A2", text });
const b1 = (n: number, text: string): CanDoDescriptor => ({ id: `B1-${n}`, level: "B1", text });
const b2 = (n: number, text: string): CanDoDescriptor => ({ id: `B2-${n}`, level: "B2", text });

export const SELF_ASSESSMENT_CHECKLISTS: readonly CanDoDescriptor[] = [
  a1(1, "Introduce myself: name, role, company, stack, years of experience."),
  a1(2, "Describe my typical workday using the present simple."),
  a1(3, "Describe my technical environment with there is / there are."),
  a1(4, "Say what I am working on right now (present continuous)."),
  a1(5, "Ask for something politely (Could you...?, Would you mind...?)."),
  a1(6, "Tell what I did yesterday in the past simple, with 20 irregular verbs."),
  a1(7, "Ask and answer wh- questions about work."),
  a1(8, "Pronounce -ed correctly in its three forms."),
  a1(9, "Spell my name and an email address out loud."),

  a2(1, "Give a 30-second stand-up without preparation."),
  a2(2, "Compare two technologies using comparatives and degrees of difference."),
  a2(3, "Give an estimate with calibrated uncertainty."),
  a2(4, "Use going to / will / present continuous with the right nuance."),
  a2(5, "Choose between past simple and present perfect without thinking."),
  a2(6, "Use for / since / yet / already / just correctly."),
  a2(7, "Write clear instructions in the imperative."),
  a2(8, "Narrate a bug with past simple + past continuous."),
  a2(9, "Understand a conversation between two native speakers on a familiar technical topic."),

  b1(1, "Leave code review comments that do not offend."),
  b1(2, "Take criticism and disagree without getting defensive."),
  b1(3, "Use the past perfect to order events in a postmortem."),
  b1(4, "Link cause and consequence with because of, due to, therefore, despite."),
  b1(5, "Discuss a design using first and second conditionals."),
  b1(6, "Use the passive when it helps and the active by default."),
  b1(7, "Report what someone else said with the correct tense backshift."),
  b1(8, "Survive a 30-minute meeting: speak up, disagree, ask for clarification."),
  b1(9, "Describe a system with relative and participle clauses."),
  b1(10, "Write a complete PR description that needs no follow-up questions."),

  b2(1, "Do a counterfactual analysis with third and mixed conditionals, out loud and fluently."),
  b2(2, "Write a blameless postmortem that sounds neutral to a native speaker."),
  b2(3, "Calibrate the degree of certainty of every claim in an RFC."),
  b2(4, "Use cleft sentences and inversion to shift focus deliberately."),
  b2(5, "Answer five behavioral questions with STAR in under 90 s each."),
  b2(6, "Live-code while talking, with no silences longer than three seconds."),
  b2(7, "Get through a 40-minute system design round in English."),
  b2(8, "Negotiate an offer: anchor, concede conditionally, use alternative levers."),
  b2(9, "Negotiate scope without using the word no."),
  b2(10, "Give corrective feedback with SBI and no character adjectives."),
  b2(11, "Delegate by transferring context and decisions, not tasks."),
  b2(12, "Give a 20-minute talk with signposting and survive the Q&A."),
  b2(13, "Write an email, ADR, PR, incident report and Slack message, each in its proper register."),
  b2(14, "Understand a fast conversation between two native speakers on a topic I do not master."),
  b2(15, "Say \"I don't know\" with ease and without apologizing."),
] as const;

const B2_MIN_DESCRIPTORS = 13;

/** Normaliza la entrada (Set o array) de ids marcados a un Set para búsquedas O(1). */
function toCheckedSet(checked: Set<string> | string[]): Set<string> {
  return checked instanceof Set ? checked : new Set(checked);
}

function idsForLevel(level: CefrCheckLevel): readonly string[] {
  return SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === level).map((d) => d.id);
}

/** Ítems marcados vs. total de un nivel, para mostrar progreso en la UI. */
export function checklistProgress(
  level: CefrCheckLevel,
  checked: Set<string> | string[],
): { done: number; total: number } {
  const checkedSet = toCheckedSet(checked);
  const ids = idsForLevel(level);
  const done = ids.filter((id) => checkedSet.has(id)).length;
  return { done, total: ids.length };
}

/**
 * Regla del Apéndice H: certifica B2 quien marca al menos 13 de los 15
 * descriptores de B2 Y el 100% de A1+A2+B1 (las bases no se compensan).
 */
export function certifiesB2(checked: Set<string> | string[]): boolean {
  const checkedSet = toCheckedSet(checked);
  const basesComplete = (["A1", "A2", "B1"] as const).every(
    (level) => checklistProgress(level, checkedSet).done === idsForLevel(level).length,
  );
  if (!basesComplete) return false;

  const b2Progress = checklistProgress("B2", checkedSet);
  return b2Progress.done >= B2_MIN_DESCRIPTORS;
}
