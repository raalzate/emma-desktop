import { describe, it, expect } from "vitest";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import { buildLesson } from "../build-lesson-use-case";
import type { SilentError } from "@/domain/chat/silent-error";

const errors: SilentError[] = [
  {
    label: "grammar",
    original: "I am working on it today.",
    corrected: "I'm working on it today.",
    turn: 3,
  } as unknown as SilentError,
];

function fakeLlm(reply: string): { llm: LlmGenerate; calls: LlmGenerateArgs[] } {
  const calls: LlmGenerateArgs[] = [];
  const llm: LlmGenerate = async (args) => {
    calls.push(args);
    return reply;
  };
  return { llm, calls };
}

describe("buildLesson — la lección real de Emma (BUG-001)", () => {
  it("pide la lección EN INGLÉS hablado con los errores y el nivel del aprendiz", async () => {
    const { llm, calls } = fakeLlm(
      "Spoken English loves contractions. You said 'I am working' — it sounds stiff; " +
        "in a standup say \"I'm working on it\". Challenge: repeat your last three lines using contractions.",
    );
    const lesson = await buildLesson({ llm, errors, level: "B1" });
    expect(lesson).toContain("contractions");
    expect(calls[0].system).toMatch(/ENGLISH/);
    expect(calls[0].prompt).toContain("I am working on it today.");
    expect(calls[0].prompt).toContain("B1");
  });

  it("devuelve null si la salida es basura (vacía, larguísima o no latina)", async () => {
    expect(await buildLesson({ llm: fakeLlm("").llm, errors, level: "B1" })).toBeNull();
    expect(
      await buildLesson({ llm: fakeLlm("ถ้าคุณต้องการให้ฉันช่วย").llm, errors, level: "B1" }),
    ).toBeNull();
    expect(
      await buildLesson({ llm: fakeLlm("x".repeat(2000)).llm, errors, level: "B1" }),
    ).toBeNull();
  });

  it("devuelve null si el LLM lanza error (el resumen usa el fallback)", async () => {
    const llm: LlmGenerate = async () => {
      throw new Error("down");
    };
    expect(await buildLesson({ llm, errors, level: "B1" })).toBeNull();
  });

  it("sin errores significativos no llama al LLM", async () => {
    const { llm, calls } = fakeLlm("no debería llamarse");
    const lesson = await buildLesson({ llm, errors: [], level: "B1" });
    expect(lesson).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

describe("buildLesson — foco de la unidad del libro (trampas + errores comunes)", () => {
  it("con scenarioType añade las trampas de la unidad de la sesión al prompt", async () => {
    const { llm, calls } = fakeLlm("Lesson text long enough to pass validation checks here.");
    await buildLesson({ llm, errors, level: "A1", scenarioType: "daily_standup" });
    // Unidad 4 (A1, daily_standup) trae la trampa "I'm not agree." -> "I don't agree / I disagree.".
    expect(calls[0].prompt).toContain("I'm not agree.");
  });

  it("añade hasta 3 COMMON_ERRORS relevantes por texto a los errores de la sesión", async () => {
    const sessionErrors = [
      {
        label: "grammar",
        original: "It's depending on the config.",
        corrected: "It depends on the config.",
      },
    ] as unknown as SilentError[];
    const { llm, calls } = fakeLlm("Lesson text long enough to pass validation checks here.");
    await buildLesson({ llm, errors: sessionErrors, level: "B1" });
    expect(calls[0].prompt).toContain("It's depending on the config.");
  });

  it("sin scenarioType y sin match de COMMON_ERRORS no añade el bloque de refuerzo", async () => {
    const noMatchErrors = [
      { label: "grammar", original: "zzz qqq.", corrected: "www rrr." },
    ] as unknown as SilentError[];
    const { llm, calls } = fakeLlm("Lesson text long enough to pass validation checks here.");
    await buildLesson({ llm, errors: noMatchErrors, level: "B1" });
    expect(calls[0].prompt).not.toMatch(/Related traps/);
  });
});
