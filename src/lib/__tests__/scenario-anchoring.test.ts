/**
 * Las sugerencias de respuesta se anclan al escenario vía `sessionFocusHint`
 * (suggest-replies-use-case): unidad del libro + banco de frases. Si el anclaje
 * se rompe devuelve "" en silencio y las 3 sugerencias salen genéricas —
 * idénticas escena tras escena. Estas pruebas son la red: el fallo aparece aquí
 * y no en la UI, donde solo se nota como "siempre sugiere lo mismo".
 *
 * Que un escenario no tenga situación NO es un fallo: el banco de frases cubre
 * 7 situaciones y el resto de escenas se ancla solo con la unidad.
 */

import { describe, it, expect } from "vitest";

import { unitForSession } from "@/domain/curriculum/unit-catalog";
import { situationForScenario } from "@/domain/curriculum/scenario-situation-map";
import { phrasesForSituation } from "@/domain/reference/phrase-bank-catalog";
import { ALL_SCENARIOS } from "@/lib/scenarios-data";
import { CEFR_LADDER } from "@/domain/cefr/cefr-ladder";

const CATALOGO = ALL_SCENARIOS.map((s) => s.scenarioType);

describe("anclaje de escenarios al material del libro", () => {
  it("todo escenario del catálogo resuelve unidad en todos los niveles CEFR", () => {
    const huerfanos = ALL_SCENARIOS.flatMap((s) =>
      CEFR_LADDER.filter((level) => !unitForSession(s.scenarioType, level)).map(
        (level) => `${s.scenarioType} @ ${level}`,
      ),
    );
    expect(huerfanos).toEqual([]);
  });

  it("la situación que resuelve un escenario siempre trae frases del banco", () => {
    const vacias = CATALOGO.filter((tipo) => {
      const situacion = situationForScenario(tipo);
      return situacion !== undefined && phrasesForSituation(situacion).length === 0;
    });
    expect(vacias).toEqual([]);
  });

  it("el banco de frases sigue alcanzando a una parte real del catálogo", () => {
    // Si un rename de escenario deja el mapa desactualizado, este número cae
    // sin que nada más falle.
    const conSituacion = CATALOGO.filter((tipo) => situationForScenario(tipo) !== undefined);
    expect(conSituacion.length).toBeGreaterThanOrEqual(CATALOGO.length / 3);
  });
});
