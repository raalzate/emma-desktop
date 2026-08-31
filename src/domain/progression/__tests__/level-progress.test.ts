import { describe, it, expect } from "vitest";
import { buildLevelProgress } from "../level-progress";

describe("buildLevelProgress", () => {
  it("deriva el siguiente nivel desde el escalafón CEFR", () => {
    expect(buildLevelProgress("A1", 1, 3).nextLevel).toBe("A2");
  });

  it("devuelve nextLevel null en el tope del escalafón", () => {
    expect(buildLevelProgress("C1", 1, 3).nextLevel).toBeNull();
  });

  it("devuelve nextLevel null cuando el nivel es desconocido", () => {
    expect(buildLevelProgress("Z9", 1, 3).nextLevel).toBeNull();
  });

  it("conserva passed cuando está dentro del rango", () => {
    const progress = buildLevelProgress("A1", 2, 3);
    expect(progress.passed).toBe(2);
    expect(progress.required).toBe(3);
    expect(progress.level).toBe("A1");
  });

  it("clampa passed al máximo required cuando lo excede", () => {
    expect(buildLevelProgress("A1", 5, 3).passed).toBe(3);
  });

  it("clampa passed a 0 cuando es negativo", () => {
    expect(buildLevelProgress("A1", -2, 3).passed).toBe(0);
  });
});
