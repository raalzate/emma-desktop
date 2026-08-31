import { describe, it, expect } from "vitest";
import { nextLevel, isCefrLevel, INITIAL_LEVEL, CEFR_LADDER } from "../cefr-ladder";

describe("cefr-ladder", () => {
  it("empieza en A1", () => {
    expect(INITIAL_LEVEL).toBe("A1");
    expect(CEFR_LADDER[0]).toBe("A1");
  });
  it("sube al siguiente nivel", () => {
    expect(nextLevel("A1")).toBe("A2");
    expect(nextLevel("B2")).toBe("C1");
  });
  it("no sube por encima de C1", () => {
    expect(nextLevel("C1")).toBeNull();
  });
  it("rechaza niveles desconocidos", () => {
    expect(nextLevel("Z9")).toBeNull();
    expect(isCefrLevel("B1")).toBe(true);
    expect(isCefrLevel("zz")).toBe(false);
  });
});
