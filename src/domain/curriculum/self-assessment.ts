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
  a1(1, "Presentarme: nombre, rol, empresa, stack, años de experiencia."),
  a1(2, "Describir mi jornada habitual con presente simple."),
  a1(3, "Describir mi entorno técnico con there is / there are."),
  a1(4, "Decir en qué estoy trabajando ahora mismo (presente continuo)."),
  a1(5, "Pedir algo con cortesía (Could you...?, Would you mind...?)."),
  a1(6, "Contar qué hice ayer en pasado simple, con 20 verbos irregulares."),
  a1(7, "Hacer y responder preguntas wh- sobre trabajo."),
  a1(8, "Pronunciar -ed con sus tres formas correctamente."),
  a1(9, "Deletrear mi nombre y un correo electrónico en voz alta."),

  a2(1, "Dar un stand-up de 30 segundos sin preparación."),
  a2(2, "Comparar dos tecnologías con comparativos y grados de diferencia."),
  a2(3, "Dar una estimación con la incertidumbre calibrada."),
  a2(4, "Usar going to / will / presente continuo con el matiz correcto."),
  a2(5, "Elegir entre pasado simple y presente perfecto sin pensarlo."),
  a2(6, "Usar for / since / yet / already / just correctamente."),
  a2(7, "Escribir instrucciones claras en imperativo."),
  a2(8, "Narrar un bug con pasado simple + pasado continuo."),
  a2(9, "Entender una conversación entre dos nativos sobre un tema técnico conocido."),

  b1(1, "Dejar comentarios de code review que no ofenden."),
  b1(2, "Recibir crítica y discrepar sin ponerme a la defensiva."),
  b1(3, "Usar el pasado perfecto para ordenar sucesos en un postmortem."),
  b1(4, "Encadenar causa y consecuencia con because of, due to, therefore, despite."),
  b1(5, "Discutir un diseño con condicionales tipo 1 y 2."),
  b1(6, "Usar la pasiva cuando conviene y la activa por defecto."),
  b1(7, "Reportar lo que dijo otra persona con el retroceso de tiempos correcto."),
  b1(8, "Sobrevivir una reunión de 30 minutos: intervenir, discrepar, pedir aclaración."),
  b1(9, "Describir un sistema con relativas y cláusulas de participio."),
  b1(10, "Escribir una descripción de PR completa que no necesite preguntas de vuelta."),

  b2(1, "Hacer un análisis contrafactual con tercer condicional y mixtos, en voz alta y con fluidez."),
  b2(2, "Escribir un postmortem sin culpables que suene neutral a un nativo."),
  b2(3, "Calibrar el grado de certeza de cada afirmación de un RFC."),
  b2(4, "Usar cleft sentences e inversión para mover el foco de forma deliberada."),
  b2(5, "Responder cinco preguntas de comportamiento con STAR en menos de 90 s cada una."),
  b2(6, "Programar en directo hablando sin silencios de más de tres segundos."),
  b2(7, "Recorrer una ronda de system design de 40 minutos en inglés."),
  b2(8, "Negociar una oferta: anclar, conceder condicionalmente, usar palancas alternativas."),
  b2(9, "Negociar alcance sin usar la palabra no."),
  b2(10, "Dar feedback correctivo con SBI sin adjetivos de carácter."),
  b2(11, "Delegar transfiriendo contexto y decisión, no tareas."),
  b2(12, "Dar una charla de 20 minutos con signposting y sobrevivir al Q&A."),
  b2(13, "Escribir email, ADR, PR, informe de incidente y mensaje de Slack en el registro correcto de cada uno."),
  b2(14, "Entender una conversación rápida entre dos nativos sobre un tema que no domino."),
  b2(15, 'Decir "I don\'t know" con soltura y sin disculparme.'),
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
