import { describe, it, expect } from "vitest";
import { stripRepeatedGreeting } from "../greeting-guard";

describe("greeting-guard — la persona saluda UNA sola vez (BUG-001)", () => {
  it("elimina el resaludo al inicio cuando la escena ya empezó", () => {
    expect(
      stripRepeatedGreeting("Hello! I'm ready to hear about your progress.", true),
    ).toBe("I'm ready to hear about your progress.");
    expect(
      stripRepeatedGreeting("Hey Raul, good morning! What's blocking you?", true),
    ).toBe("What's blocking you?");
  });

  it("no toca la respuesta si es el primer turno de la persona", () => {
    expect(stripRepeatedGreeting("Hello! Ready for standup?", false)).toBe(
      "Hello! Ready for standup?",
    );
  });

  it("no toca respuestas sin saludo aunque la escena ya empezó", () => {
    expect(stripRepeatedGreeting("Good call. What's next for today?", true)).toBe(
      "Good call. What's next for today?",
    );
  });

  it("si TODA la respuesta era saludo devuelve cadena vacía (el caller decide)", () => {
    expect(stripRepeatedGreeting("Hello! Good morning!", true)).toBe("");
  });
});
