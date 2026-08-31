import { describe, it, expect } from "vitest";
import { toSpeakable, hasSpeakableContent } from "../speakable-text";

describe("toSpeakable", () => {
  it("elimina emojis pero conserva el texto adyacente", () => {
    expect(toSpeakable("Great job! 😊 Keep going.")).toBe("Great job! Keep going.");
  });

  it("elimina paréntesis conservando el contenido interior", () => {
    expect(toSpeakable("(If you could provide detail)")).toBe(
      "If you could provide detail",
    );
  });

  it("elimina corchetes y llaves conservando el contenido interior", () => {
    expect(toSpeakable("[note] {aside} plain")).toBe("note aside plain");
  });

  it("elimina comillas rectas y tipográficas", () => {
    expect(toSpeakable(`She said "hello" and 'hi' and «bonjour»`)).toBe(
      "She said hello and hi and bonjour",
    );
  });

  it("conserva el apóstrofe interno de contracciones", () => {
    expect(toSpeakable("don't worry, it's fine")).toBe("don't worry, it's fine");
  });

  it("conserva puntuación natural y números", () => {
    expect(toSpeakable("Level 3.5, really? Yes!")).toBe("Level 3.5, really? Yes!");
  });

  it("elimina asteriscos y símbolos decorativos", () => {
    expect(toSpeakable("**Tip:** stay focused # today ~ ok • go")).toBe(
      "Tip: stay focused today ok go",
    );
  });

  it("elimina guiones decorativos sueltos conservando palabras compuestas", () => {
    expect(toSpeakable("well-known idea -- keep it -")).toBe(
      "well-known idea keep it",
    );
  });

  it("colapsa espacios múltiples y espacios antes de puntuación", () => {
    expect(toSpeakable("Hello   ,   world  !")).toBe("Hello, world!");
  });

  it("devuelve cadena vacía cuando el texto es solo emojis", () => {
    expect(toSpeakable("😊😂🎉")).toBe("");
  });
});

describe("hasSpeakableContent", () => {
  it("es false cuando el texto es enteramente simbólico o emoji", () => {
    expect(hasSpeakableContent("😊 -- ** \"\" ()")).toBe(false);
  });

  it("es true cuando queda alguna letra o dígito tras limpiar", () => {
    expect(hasSpeakableContent("😊 3.5 😊")).toBe(true);
  });
});
