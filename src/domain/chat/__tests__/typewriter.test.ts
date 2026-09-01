import { describe, expect, it } from "vitest";
import { revealedChars, typingDurationMs } from "../typewriter";

describe("revealedChars", () => {
  it("no revela nada antes de empezar", () => {
    expect(revealedChars(0, 10, 45)).toBe(0);
    expect(revealedChars(-100, 10, 45)).toBe(0);
  });

  it("revela en proporción al tiempo transcurrido", () => {
    expect(revealedChars(1000, 100, 45)).toBe(45);
    expect(revealedChars(2000, 100, 45)).toBe(90);
  });

  it("nunca pasa del largo del texto aunque siga corriendo el reloj", () => {
    expect(revealedChars(60_000, 10, 45)).toBe(10);
  });

  it("con texto vacío no hay nada que revelar", () => {
    expect(revealedChars(1000, 0, 45)).toBe(0);
  });

  it("a velocidad cero revela todo de golpe (movimiento reducido)", () => {
    expect(revealedChars(1, 42, 0)).toBe(42);
  });
});

describe("typingDurationMs", () => {
  it("es el largo del texto sobre la velocidad", () => {
    expect(typingDurationMs("x".repeat(45), 45)).toBe(1000);
  });

  it("un texto vacío no toma tiempo", () => {
    expect(typingDurationMs("", 45)).toBe(0);
  });

  it("a velocidad cero no hay espera", () => {
    expect(typingDurationMs("hola", 0)).toBe(0);
  });
});
