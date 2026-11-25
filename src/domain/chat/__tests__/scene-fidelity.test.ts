import { describe, it, expect } from "vitest";
import { detectTimeDrift } from "../scene-fidelity";
import { extractTimes } from "../scene-highlights";

const FACTS =
  "The Java service merge for the Atlas Checkout API failed. Stakeholder demo at 2 PM.";

describe("extractTimes", () => {
  it("normaliza horas con y sin minutos y mayúsculas", () => {
    expect(extractTimes("at 2 PM or 2:00pm, maybe 10:30 a.m.")).toEqual([
      "2:00pm",
      "2:00pm",
      "10:30am",
    ]);
  });

  it("no inventa horas donde no las hay", () => {
    expect(extractTimes("sprint 14 and 3 people")).toEqual([]);
  });
});

describe("detectTimeDrift", () => {
  it("detecta una hora que no está en los hechos", () => {
    expect(detectTimeDrift("The demo is at 4 PM, hurry.", FACTS)).toBe(true);
  });

  it("acepta la hora fijada aunque cambie el formato", () => {
    expect(detectTimeDrift("The demo is at 2:00 pm.", FACTS)).toBe(false);
  });

  it("no hay deriva si la línea no menciona horas", () => {
    expect(detectTimeDrift("Did the merge pass yet?", FACTS)).toBe(false);
  });

  it("no hay deriva si los hechos no fijan horas", () => {
    expect(detectTimeDrift("See you at 4 PM.", "The merge failed.")).toBe(false);
  });
});
