/**
 * Precálculo de la escena desde el mapa (T14 de #323).
 *
 * El "why": medido en el banco, la escena tardaba ~25 s en dejar pulsar
 * «I'm ready» porque generaba hechos y narrativa en serie al abrirse. Mientras
 * el aprendiz mira el mapa, el motor está ocioso: se elige la situación de la
 * escena recomendada y se generan sus hechos en segundo plano (cede ante
 * cualquier generación interactiva). El chat los toma al abrirla. Un
 * precálculo preemptado resuelve null y el chat genera de nuevo.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { getScenario } from "@/domain/scenarios/scenario-catalog";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { SceneFacts } from "@/application/scene/create-scene-contract-use-case";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { chooseSituation } from "./situation-rotation";

/** Más viejo que esto, el caso ya no es «el que se preparó» para esta visita. */
const MAX_AGE_MS = 30 * 60_000;

export interface PrefetchedScene {
  situation: SituationVariant;
  /** null ⇒ la generación falló o fue preemptada: el chat genera de nuevo. */
  facts: Promise<SceneFacts | null>;
  at: number;
}

const cache = new Map<string, PrefetchedScene>();

export function prefetchScene(
  runtime: Pick<EmmaRuntime, "sceneFacts">,
  args: { scenarioType: string; level: CefrLevel; techStack?: string },
  now: number = Date.now(),
): void {
  const existing = cache.get(args.scenarioType);
  if (existing && now - existing.at < MAX_AGE_MS) return;
  const scenario = getScenario(args.scenarioType);
  if (!scenario) return;
  const situation = chooseSituation(args.scenarioType, args.level, args.techStack ?? "");
  if (!situation) return;
  const facts = runtime
    .sceneFacts({ scenario, situation, techStack: args.techStack, priority: "background" })
    .then((f) => (f.generated ? f : null))
    .catch(() => null);
  cache.set(args.scenarioType, { situation, facts, at: now });
}

/** Toma (y consume) el precálculo de la escena, si sigue vigente. */
export function takePrefetchedScene(scenarioType: string, now: number = Date.now()): PrefetchedScene | undefined {
  const entry = cache.get(scenarioType);
  cache.delete(scenarioType);
  if (!entry || now - entry.at >= MAX_AGE_MS) return undefined;
  return entry;
}

/** Sólo para pruebas. */
export function clearPrefetch(): void {
  cache.clear();
}
