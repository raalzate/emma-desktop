/**
 * Agregador de las 26 unidades del currículo «English for Software Engineers»
 * (A1+A2+B1+B2). Mismo patrón que `src/lib/scenarios-data.ts`: el contenido
 * vive partido por nivel en `curriculum-data/` y aquí se reensambla en orden.
 */

import type { CurriculumUnit } from "@/domain/curriculum/unit";
import { UNITS_A1 } from "@/lib/curriculum-data/units-a1";
import { UNITS_A2 } from "@/lib/curriculum-data/units-a2";
import { UNITS_B1 } from "@/lib/curriculum-data/units-b1";
import { UNITS_B2 } from "@/lib/curriculum-data/units-b2";

export const ALL_UNITS: CurriculumUnit[] = [
  ...UNITS_A1,
  ...UNITS_A2,
  ...UNITS_B1,
  ...UNITS_B2,
];
