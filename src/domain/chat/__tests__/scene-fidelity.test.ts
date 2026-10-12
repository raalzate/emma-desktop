import { describe, it, expect } from "vitest";
import {
  buildFidelityPrompt,
  parseFidelity,
  detectTimeDrift,
} from "../scene-fidelity";
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

describe("buildFidelityPrompt", () => {
  const prompt = buildFidelityPrompt({
    facts: FACTS,
    personaName: "Sofía Torres",
    personaRole: "Scrum Master",
    situationTitle: "Failed merge",
    reply: "Let me teach you some grammar.",
  });

  it("incluye hechos, persona, situación y la línea candidata", () => {
    expect(prompt).toContain(FACTS);
    expect(prompt).toContain("Sofía Torres");
    expect(prompt).toContain("Scrum Master");
    expect(prompt).toContain("Failed merge");
    expect(prompt).toContain("Let me teach you some grammar.");
  });

  it("pide JSON con los cuatro tipos de problema", () => {
    expect(prompt).toContain('"inScene"');
    for (const issue of ["contradicts-facts", "wrong-role", "other-scene", "breaks-fiction"]) {
      expect(prompt).toContain(issue);
    }
  });
});

describe("parseFidelity", () => {
  it("lee un veredicto de rechazo", () => {
    expect(parseFidelity('{"inScene":false,"issue":"wrong-role"}')).toEqual({
      inScene: false,
      issue: "wrong-role",
      source: "judge",
    });
  });

  it("lee un veredicto de aceptación envuelto en texto", () => {
    expect(parseFidelity('Sure: {"inScene":true,"issue":null} done')).toEqual({
      inScene: true,
      issue: null,
      source: "judge",
    });
  });

  it.each([
    ["vacío", ""],
    ["texto sin JSON", "I think it is fine"],
    ["JSON roto", '{"inScene":'],
    ["inScene no booleano", '{"inScene":"no","issue":null}'],
  ])("falla abierto con salida inválida: %s", (_n, raw) => {
    expect(parseFidelity(raw)).toEqual({ inScene: true, issue: null, source: "fail-open" });
  });

  it("un rechazo con issue desconocido cae a breaks-fiction", () => {
    expect(parseFidelity('{"inScene":false,"issue":"zzz"}')).toEqual({
      inScene: false,
      issue: "breaks-fiction",
      source: "judge",
    });
  });

  it("inScene true descarta cualquier issue", () => {
    expect(parseFidelity('{"inScene":true,"issue":"wrong-role"}')).toEqual({
      inScene: true,
      issue: null,
      source: "judge",
    });
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
