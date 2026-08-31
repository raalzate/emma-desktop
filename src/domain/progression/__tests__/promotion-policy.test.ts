import { describe, it, expect } from "vitest";
import { isPass, isPromotionReady, passBar, PROMOTION_STREAK, MIN_TURNS_TO_COUNT } from "../promotion-policy";

describe("promotion-policy", () => {
  it("usa barras específicas por nivel", () => {
    expect(passBar("A1")).toBe(0.45);
    expect(passBar("C1")).toBe(0.12);
    expect(passBar("desconocido")).toBe(0.25); // fallback B1
  });

  it("no aprueba sesiones por debajo del mínimo de turnos", () => {
    expect(isPass({ turns: MIN_TURNS_TO_COUNT - 1, errors: 0 }, "A1")).toBe(false);
  });

  it("aprueba cuando errores/turno <= barra del nivel", () => {
    expect(isPass({ turns: 10, errors: 4 }, "A1")).toBe(true); // 0.4 <= 0.45
    expect(isPass({ turns: 10, errors: 5 }, "A1")).toBe(false); // 0.5 > 0.45
  });

  it("promueve solo con la racha requerida", () => {
    expect(isPromotionReady(PROMOTION_STREAK - 1)).toBe(false);
    expect(isPromotionReady(PROMOTION_STREAK)).toBe(true);
  });
});
