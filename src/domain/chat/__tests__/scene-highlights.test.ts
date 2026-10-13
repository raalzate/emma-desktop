import { describe, expect, it } from "vitest";
import { highlightScenePhrases } from "../scene-highlights";

const ESCENA =
  "You stand up with Sofía Torres to start the daily standup for sprint 14. " +
  "You must quickly check in with your squad of five to ensure everyone commits to their tasks " +
  "before the 2 PM stakeholder demo. You need to explain how the failed Java service merge " +
  "for the Atlas Checkout API is blocking the core demo functionality and what you will do to fix it.";

const claves = (text: string, names: string[] = []) =>
  highlightScenePhrases(text, names)
    .filter((s) => s.key)
    .map((s) => s.text);

describe("highlightScenePhrases", () => {
  it("resalta personas, horas, números con contexto y nombres propios de la escena", () => {
    expect(claves(ESCENA, ["Sofía Torres"])).toEqual([
      "Sofía Torres",
      "sprint 14",
      "2 PM",
      "Java",
      "Atlas Checkout API",
    ]);
  });

  it("los segmentos reconstruyen el texto original sin perder ni duplicar nada", () => {
    const segmentos = highlightScenePhrases(ESCENA, ["Sofía Torres"]);
    expect(segmentos.map((s) => s.text).join("")).toBe(ESCENA);
  });

  it("no resalta la palabra capitalizada que sólo abre la oración", () => {
    expect(claves("You walk in. The room is quiet.")).toEqual([]);
  });

  it("resalta duraciones y horas con minutos", () => {
    expect(claves("Standup happens 90 minutes before the 10:30 am review.")).toEqual([
      "90 minutes",
      "10:30 am",
    ]);
  });

  it("no toma una preposición como contexto del número", () => {
    expect(claves("Meet her at 3 near the door.")).toEqual([]);
  });

  it("resalta el nombre dado aunque abra la oración", () => {
    expect(claves("Sofía Torres waves at you.", ["Sofía Torres"])).toEqual(["Sofía Torres"]);
  });

  it("resalta nombres de tecnología con punto (Node.js) completos, sin comerse el punto final", () => {
    expect(claves("You learn the legacy Node.js codebase and ship it by 5 PM.")).toEqual([
      "Node.js",
      "5 PM",
    ]);
    expect(claves("The team uses Vue.js and ASP.NET daily.")).toEqual(["Vue.js", "ASP.NET"]);
    expect(claves("We meet at 3 p.m. sharp.")).toEqual(["3 p.m."]);
  });

  it("texto vacío ⇒ sin segmentos", () => {
    expect(highlightScenePhrases("", [])).toEqual([]);
  });
});
