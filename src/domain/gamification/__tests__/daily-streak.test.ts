import { describe, it, expect } from "vitest";
import { streakFrom } from "../daily-streak";

describe("streakFrom", () => {
  it("sin días activos no hay racha", () => {
    expect(streakFrom([], 100)).toEqual({ current: 0, best: 0, activeToday: false });
  });

  it("cuenta días consecutivos hasta hoy", () => {
    expect(streakFrom([98, 99, 100], 100)).toEqual({ current: 3, best: 3, activeToday: true });
  });

  it("la racha sigue viva si ayer se practicó y hoy todavía no", () => {
    expect(streakFrom([98, 99], 100)).toEqual({ current: 2, best: 2, activeToday: false });
  });

  it("se rompe si el último día activo fue antes de ayer", () => {
    expect(streakFrom([97, 98], 100).current).toBe(0);
  });

  it("ignora duplicados y desorden", () => {
    expect(streakFrom([100, 99, 99, 100, 98], 100).current).toBe(3);
  });

  it("recuerda la mejor racha histórica", () => {
    const s = streakFrom([10, 11, 12, 13, 50, 99, 100], 100);
    expect(s.current).toBe(2);
    expect(s.best).toBe(4);
  });

  it("ignora días futuros (reloj adelantado)", () => {
    expect(streakFrom([99, 100, 105], 100).current).toBe(2);
  });
});
