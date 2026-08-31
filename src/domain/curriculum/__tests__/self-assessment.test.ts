import { describe, it, expect } from "vitest";
import {
  SELF_ASSESSMENT_CHECKLISTS,
  certifiesB2,
  checklistProgress,
} from "../self-assessment";

describe("SELF_ASSESSMENT_CHECKLISTS", () => {
  it("tiene 9 descriptores en A1, 9 en A2, 10 en B1 y 15 en B2 (Apéndice H)", () => {
    const byLevel = (level: "A1" | "A2" | "B1" | "B2") =>
      SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === level);

    expect(byLevel("A1")).toHaveLength(9);
    expect(byLevel("A2")).toHaveLength(9);
    expect(byLevel("B1")).toHaveLength(10);
    expect(byLevel("B2")).toHaveLength(15);
  });

  it("cada descriptor tiene un id único y texto no vacío", () => {
    const ids = SELF_ASSESSMENT_CHECKLISTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of SELF_ASSESSMENT_CHECKLISTS) {
      expect(d.text.length).toBeGreaterThan(0);
    }
  });
});

describe("checklistProgress", () => {
  it("cuenta cuántos ítems de un nivel están marcados sobre el total", () => {
    const a1Ids = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "A1").map((d) => d.id);
    const checked = new Set(a1Ids.slice(0, 3));
    expect(checklistProgress("A1", checked)).toEqual({ done: 3, total: 9 });
  });

  it("devuelve done 0 cuando no hay nada marcado", () => {
    expect(checklistProgress("B2", new Set())).toEqual({ done: 0, total: 15 });
  });
});

describe("certifiesB2", () => {
  it("certifica cuando hay 13+ de 15 en B2 y el 100% de A1+A2+B1 marcados", () => {
    const a1 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "A1").map((d) => d.id);
    const a2 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "A2").map((d) => d.id);
    const b1 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "B1").map((d) => d.id);
    const b2 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "B2").map((d) => d.id);

    const checked = new Set([...a1, ...a2, ...b1, ...b2.slice(0, 13)]);
    expect(certifiesB2(checked)).toBe(true);
  });

  it("no certifica si falta un solo ítem de A1/A2/B1 aunque B2 esté completo", () => {
    const a1 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "A1").map((d) => d.id);
    const a2 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "A2").map((d) => d.id);
    const b1 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "B1").map((d) => d.id);
    const b2 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "B2").map((d) => d.id);

    const checked = new Set([...a1.slice(1), ...a2, ...b1, ...b2]);
    expect(certifiesB2(checked)).toBe(false);
  });

  it("no certifica con menos de 13 de 15 en B2 aunque A1-B1 estén completos", () => {
    const a1 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "A1").map((d) => d.id);
    const a2 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "A2").map((d) => d.id);
    const b1 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "B1").map((d) => d.id);
    const b2 = SELF_ASSESSMENT_CHECKLISTS.filter((d) => d.level === "B2").map((d) => d.id);

    const checked = new Set([...a1, ...a2, ...b1, ...b2.slice(0, 12)]);
    expect(certifiesB2(checked)).toBe(false);
  });

  it("acepta un array además de un Set", () => {
    const allIds = SELF_ASSESSMENT_CHECKLISTS.map((d) => d.id);
    expect(certifiesB2(allIds)).toBe(true);
  });
});
