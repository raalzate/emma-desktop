import { describe, it, expect } from "vitest";
import { errorsPerTurn } from "../session-metric";

describe("errorsPerTurn", () => {
  it("calcula errores divididos por turnos", () => {
    expect(errorsPerTurn({ turns: 10, errors: 4 })).toBe(0.4);
  });

  it("devuelve 0 cuando no hubo turnos", () => {
    expect(errorsPerTurn({ turns: 0, errors: 5 })).toBe(0);
  });

  it("devuelve 0 cuando no hubo errores", () => {
    expect(errorsPerTurn({ turns: 8, errors: 0 })).toBe(0);
  });
});
