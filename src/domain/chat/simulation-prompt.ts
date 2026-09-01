/**
 * Ensambla el prompt de sistema de la simulación (portado de
 * src/domain/chat/simulation_prompt.py → build_simulation_prompt).
 *
 * Mismo orden de secciones y mismo texto verbatim que el original. La API nueva
 * recibe objetos de dominio tipados (Scenario/SituationVariant/UserProfile) en
 * vez de dicts sueltos; el mapeo se documenta en cada sección.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import {
  normalizePersonaTuning,
  renderCharacterStyle,
  type PersonaTuning,
} from "@/domain/personas/persona-tuning";
import type { UserProfile } from "@/domain/profile/user-profile";
import { profileBlock } from "@/domain/profile/user-profile";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import { personaFor } from "@/domain/personas/protopersona";
import { maxTurnsFor } from "./simulation-session";
import {
  EMMA_BASE,
  LEARNER_MISSION_INTRO,
  LEVEL_STYLE,
  SCENE_FACTS,
  STYLE_EXAMPLE,
  YOUR_PART_TEMPLATE,
} from "./simulation-prompt-text";

/** Instrucción de complejidad adaptada al nivel CEFR (verbatim + estilo por nivel). */
function cefrInstruction(level: CefrLevel): string {
  const base = `Adapt to user CEFR level ${level}.`;
  const style = LEVEL_STYLE[level];
  return style ? `${base} ${style}` : base;
}

/** Instrucción de objetivos de aprendizaje (máx. 3, como el original). */
function goalsInstruction(goals: readonly string[]): string {
  if (goals.length === 0) return "";
  const top = goals.slice(0, 3).join(", ");
  return `User learning goals: ${top}.`;
}

/**
 * Bloque de protopersona: la IA no es "un Scrum Master" genérico sino UNA
 * persona con nombre, carácter y manías — el corazón del juego de roles.
 */
function personaBlock(scenario: Scenario): string {
  const p = personaFor(scenario.scenarioType, scenario.emmaRole);
  return `YOU ARE THIS PERSON — ${p.name}, ${p.role}. ${p.personaPrompt}`;
}

/**
 * Guarda anti-meta compacta: el modelo pequeño tiende a narrar su proceso
 * ("here is the next step...") o a analizar el wording del aprendiz.
 */
const META_GUARD =
  "META GUARD — output ONLY your spoken line: no lists, labels, [notes], " +
  "(asides) or planning talk. Never comment on their wording: react in " +
  "character to what they meant.";

/**
 * Objetivo explícito de la escena: sin esto, el agente conversa sin rumbo y no
 * "cumple" el escenario. Da la meta y el presupuesto de turnos; el "avanzá
 * ahora hacia X" NO va aquí — llega cada turno en la directiva de escena
 * (domain/chat/turn-directive), y repetirlo en el system era pagar el mismo
 * contexto dos veces con el modelo pequeño.
 */
function sceneGoalBlock(scenario: Scenario): string {
  const budget = maxTurnsFor(scenario.scenarioType);
  return `SCENE GOAL — "${scenario.title}": ${scenario.description} About ${budget} exchanges.`;
}

/**
 * Bloque de situación con roles separados: el framing está redactado en segunda
 * persona AL APRENDIZ (su misión); sin la separación el modelo lee ese "you"
 * como propio e invierte los roles (BUG-001).
 */
function situationBlock(scenario: Scenario, framing: string): string {
  const p = personaFor(scenario.scenarioType, scenario.emmaRole);
  return LEARNER_MISSION_INTRO + `${framing}\n` + YOUR_PART_TEMPLATE(p.name, p.role);
}

/**
 * Ancla corta de personaje para re-fijar la identidad en cada turno de sesión
 * local (el system queda lejos en el KV-cache y el modelo pequeño la diluye).
 */
export function personaAnchor(scenario: Scenario): string {
  const p = personaFor(scenario.scenarioType, scenario.emmaRole);
  return (
    `[stay in character: you are ${p.name}, ${p.role} — a real human colleague; ` +
    "never mention being an AI or a language model]"
  );
}

export interface BuildSimulationPromptArgs {
  scenario: Scenario;
  situation?: SituationVariant | null;
  /** Ajustes de Emma (tutora) — la escena NO los usa; se conservan por firma. */
  settings: ChatSettings;
  profile: UserProfile;
  level: CefrLevel;
  goals?: string[];
  /** Entrega configurable de la protopersona (tono/actitud/estilo). */
  personaTuning?: PersonaTuning;
  /**
   * Hechos FIJOS del contrato de escena (mismo contrato que ve el aprendiz en
   * la antesala). Si vienen, reemplazan al bloque genérico de "inventa
   * detalles": la persona queda amarrada a estos hechos como guardrail.
   */
  sceneFacts?: string;
  /**
   * Bloque "LANGUAGE FOCUS" de la unidad del libro que corresponde a esta
   * sesión (chunks objetivo + trampas a vigilar). Inyección desde fuera —
   * este dominio no conoce el catálogo de unidades (evita acoplar capas).
   */
  languageFocus?: string;
}

/** Prompt de sistema completo para un turno de simulación. */
export function buildSimulationPrompt(args: BuildSimulationPromptArgs): string {
  const { scenario, situation, profile, level, goals, personaTuning, sceneFacts, languageFocus } =
    args;
  const parts: string[] = [];
  // 1. Quién es la persona y su rol en el escenario.
  parts.push(personaBlock(scenario));
  if (scenario.roleSystemPrompt) parts.push(scenario.roleSystemPrompt);
  // 2. El caso: situación activa (misión del aprendiz vs. papel de la IA),
  // objetivo con presupuesto de turnos y hechos concretos.
  if (situation?.framingDescription) {
    parts.push(situationBlock(scenario, situation.framingDescription));
  }
  parts.push(sceneGoalBlock(scenario));
  parts.push(
    sceneFacts
      ? `SCENE FACTS (fixed — never contradict them):\n${sceneFacts}`
      : SCENE_FACTS,
  );
  // 3. Estilo del personaje, perfil del aprendiz, CEFR y objetivos.
  parts.push(renderCharacterStyle(normalizePersonaTuning(personaTuning)));
  parts.push(profileBlock(profile));
  parts.push(cefrInstruction(level));
  const goalsLine = goalsInstruction(goals ?? []);
  if (goalsLine) parts.push(goalsLine);
  // 3b. Foco de la unidad del libro (opcional): objetivos léxicos + trampas.
  if (languageFocus) parts.push(languageFocus);
  // 4. Reglas + ejemplo AL FINAL: el modelo pequeño pesa más lo último que lee.
  parts.push(EMMA_BASE);
  parts.push(META_GUARD);
  parts.push(STYLE_EXAMPLE);
  return parts.join("\n\n");
}
