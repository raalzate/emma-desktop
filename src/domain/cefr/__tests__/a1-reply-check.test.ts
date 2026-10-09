import { describe, it, expect } from "vitest";
import { checkA1Reply } from "../a1-reply-check";

describe("a1-reply-check — ¿la respuesta de la persona es apta para un A1?", () => {
  it("acepta una línea corta, en presente y con una pregunta", () => {
    const r = checkA1Reply("Nice, the login works now. What do you do today?");
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
    expect(r.metrics.sentences).toBe(2);
  });

  it("rechaza respuestas vacías", () => {
    expect(checkA1Reply("   ").violations).toContain("empty");
  });

  it("rechaza más de tres oraciones", () => {
    const r = checkA1Reply("Hi. I am Ana. I am a tester. I like tea. Do you like tea?");
    expect(r.violations).toContain("too-many-sentences");
  });

  it("rechaza una oración de más de 15 palabras", () => {
    const r = checkA1Reply(
      "I was thinking that maybe we could talk about the release plan for the new mobile app next week.",
    );
    expect(r.violations).toContain("sentence-too-long");
    expect(r.metrics.maxWordsPerSentence).toBeGreaterThan(15);
  });

  it("detecta español aunque no tenga tildes", () => {
    expect(checkA1Reply("Hola, no entiendo bien. Puedes repetir?").violations).toContain(
      "not-english",
    );
    expect(checkA1Reply("¿Qué haces hoy?").violations).toContain("not-english");
  });

  it("no confunde palabras inglesas con español", () => {
    expect(checkA1Reply("No problem. Do you use Java or Go?").ok).toBe(true);
  });

  it("detecta escrituras no latinas", () => {
    expect(checkA1Reply("Good morning. 你好").violations).toContain("not-english");
  });

  it("detecta modismos y phrasal verbs que un A1 no entiende", () => {
    const r = checkA1Reply("Let's circle back on that. Can you figure out the bug?");
    expect(r.violations).toContain("idiom-or-phrasal");
    expect(r.metrics.idioms).toEqual(["circle back", "figure out"]);
  });

  it("detecta la fuga de identidad de IA", () => {
    expect(checkA1Reply("As an AI, I can help you.").violations).toContain("identity-leak");
  });

  it("detecta cuando corrige el inglés del aprendiz", () => {
    expect(
      checkA1Reply('You should say "I worked", not "I working". What did you do?').violations,
    ).toContain("corrects-learner");
  });
});
