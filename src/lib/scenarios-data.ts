/**
 * Catálogo completo de escenarios: 39 en total (17 básicos + 15 avanzados +
 * 7 del currículo "English for Software Engineers").
 *
 * El "why": el dataset se parte en módulos temáticos (mismo criterio que el
 * seed Python) para que ningún archivo crezca sin control; aquí se reensambla en
 * el mismo orden que SEED_BASICS + SEED_ADVANCED + SCENARIOS_CURRICULUM.
 */

import type { Scenario } from "@/domain/scenarios/scenario";
import { SCENARIOS_ADVANCED } from "@/lib/scenarios-data-advanced";
import { SCENARIOS_BASICS } from "@/lib/scenarios-data-basics";
import { SCENARIOS_CURRICULUM } from "@/lib/scenarios-data-curriculum";

export const ALL_SCENARIOS: Scenario[] = [
  ...SCENARIOS_BASICS,
  ...SCENARIOS_ADVANCED,
  ...SCENARIOS_CURRICULUM,
];
