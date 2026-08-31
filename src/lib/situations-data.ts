/**
 * Catálogo completo de variantes de situación: 148 en total (124 del seed
 * original + 24 del currículo "English for Software Engineers").
 *
 * El "why": una fila por variante, cargada verbatim desde data/situations/*.json.
 * Se parte en básicos/avanzados/currículo (mismo criterio que los escenarios) y
 * se reensambla aquí para que el resto del código consuma una sola lista.
 */

import type { SituationVariant } from "@/domain/situations/situation-variant";
import { SITUATIONS_ADVANCED } from "@/lib/situations-data-advanced";
import { SITUATIONS_BASICS } from "@/lib/situations-data-basics";
import { SITUATIONS_CURRICULUM } from "@/lib/situations-data-curriculum";

export const ALL_SITUATIONS: SituationVariant[] = [
  ...SITUATIONS_BASICS,
  ...SITUATIONS_ADVANCED,
  ...SITUATIONS_CURRICULUM,
];
