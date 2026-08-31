/**
 * El ciclo de siete pasos de cada unidad (0.3 del libro): cada paso activa un
 * mecanismo neurolingüístico distinto (Knowles, Krashen, Schmidt, Lewis,
 * Ericsson, Swain). El orden y los minutos son parte del diseño pedagógico:
 * ni 15 min (insuficiente) ni 120 (la atención se degrada).
 */

export type UnitStep =
  | "scenario"
  | "input"
  | "notice"
  | "sound"
  | "chunks"
  | "practice"
  | "challenge";

export interface UnitStepDefinition {
  readonly step: UnitStep;
  readonly name: string;
  readonly purpose: string;
  readonly minutes: number;
}

export const SEVEN_STEP_CYCLE: readonly UnitStepDefinition[] = [
  {
    step: "scenario",
    name: "Scenario",
    purpose: "Activa relevancia y esquemas previos (Knowles)",
    minutes: 2,
  },
  {
    step: "input",
    name: "Input",
    purpose: "Expone a lengua natural en contexto (Krashen)",
    minutes: 6,
  },
  {
    step: "notice",
    name: "Notice",
    purpose: "Hace consciente la forma (noticing hypothesis, Schmidt)",
    minutes: 8,
  },
  {
    step: "sound",
    name: "Sound",
    purpose: "Entrena percepción y producción fonológica",
    minutes: 5,
  },
  {
    step: "chunks",
    name: "Chunks",
    purpose: "Instala bloques recuperables enteros (Lewis)",
    minutes: 5,
  },
  {
    step: "practice",
    name: "Practice",
    purpose: "Práctica deliberada con feedback (Ericsson)",
    minutes: 8,
  },
  {
    step: "challenge",
    name: "Challenge",
    purpose: "Output forzado con resultado real (Swain)",
    minutes: 6,
  },
] as const;

const FIRST_HALF_STEPS = 4;

/**
 * Divide el ciclo en las dos sesiones del plan 0.4: lunes/jueves cubren los
 * pasos 1-4 (scenario..sound); martes/viernes cubren 5-7 (chunks..challenge).
 */
export function stepsForSessionHalf(half: 1 | 2): readonly UnitStepDefinition[] {
  if (half === 1) return SEVEN_STEP_CYCLE.slice(0, FIRST_HALF_STEPS);
  return SEVEN_STEP_CYCLE.slice(FIRST_HALF_STEPS);
}
