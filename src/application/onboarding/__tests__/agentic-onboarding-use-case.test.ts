import { describe, it, expect, vi } from "vitest";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import type { OnboardingIo, OnboardingRepository } from "@/domain/onboarding/i-onboarding-repository";
import { emptyProfile } from "@/domain/profile/user-profile";
import { INSTANT_GREETING } from "@/domain/onboarding/agentic-onboarding";
import { runAgenticOnboarding } from "../agentic-onboarding-use-case";

function makeRepo(overrides: Partial<OnboardingRepository> = {}) {
  const saved: Array<{ step: string; value: string | number }> = [];
  const state = { completed: false };
  const repo: OnboardingRepository = {
    getStatus: async () => null,
    createEmpty: async () => emptyProfile("local"),
    saveStep: async (step, value) => {
      saved.push({ step, value });
    },
    markCompleted: async () => {
      state.completed = true;
    },
    ...overrides,
  };
  return { repo, saved, state };
}

function makeIo(answers: string[]) {
  const asked: string[] = [];
  const notified: string[] = [];
  let i = 0;
  const io: OnboardingIo = {
    ask: async (prompt) => {
      asked.push(prompt);
      const answer = answers[i] ?? answers[answers.length - 1] ?? "";
      i += 1;
      return answer;
    },
    notify: (m) => {
      notified.push(m);
    },
  };
  return { io, asked, notified };
}

/** Un "turno" (no-warmup) es cualquier llamada cuyo prompt contenga "Known so far". */
const isTurnCall = (args: LlmGenerateArgs) => args.prompt.includes("Known so far");

describe("runAgenticOnboarding — saludo instantáneo", () => {
  it("muestra el saludo fijo sin invocar el LLM para generarlo", async () => {
    const calls: LlmGenerateArgs[] = [];
    const llm: LlmGenerate = async (args) => {
      calls.push(args);
      return isTurnCall(args)
        ? 'Nice!\nDATA: {"name":"Ada","role":"Dev","techStack":"Go","skills":"testing"}'
        : "warmup";
    };
    const { repo } = makeRepo();
    const { io, asked } = makeIo(["Ada, backend dev, Go, testing"]);

    await runAgenticOnboarding({ llm, io, repo });

    expect(asked[0]).toBe(INSTANT_GREETING);
    // el saludo no depende de ninguna llamada llm (solo hubo warmup + 1 turno)
    expect(calls.filter(isTurnCall)).toHaveLength(1);
  });

  it("personaliza el saludo si el perfil ya tiene nombre (retomar)", async () => {
    const llm: LlmGenerate = async () => 'All set!\nDATA: {}';
    const existing = { ...emptyProfile("local"), name: "Ada", role: "Dev", techStack: "Go", skills: "testing" };
    const { repo } = makeRepo({ getStatus: async () => existing });
    const { io, asked } = makeIo(["hi"]);

    await runAgenticOnboarding({ llm, io, repo });

    expect(asked[0]).toMatch(/Welcome back, Ada/);
  });
});

describe("runAgenticOnboarding — una sola llamada LLM por turno de usuario", () => {
  it("hace exactamente una llamada llm por respuesta del usuario", async () => {
    const calls: LlmGenerateArgs[] = [];
    const llm: LlmGenerate = async (args) => {
      calls.push(args);
      if (!isTurnCall(args)) return "warmup";
      const turn = calls.filter(isTurnCall).length;
      if (turn === 1) return 'Nice to meet you!\nDATA: {"name":"Ada"}';
      if (turn === 2) return "Cool role!\nDATA: {\"role\":\"Dev\"}";
      return 'Great!\nDATA: {"techStack":"Go","skills":"testing"}';
    };
    const { repo } = makeRepo();
    const { io, asked } = makeIo(["Ada", "backend dev", "Go and testing"]);

    await runAgenticOnboarding({ llm, io, repo });

    expect(calls.filter(isTurnCall)).toHaveLength(3);
    expect(asked).toHaveLength(3); // saludo + 2 preguntas de seguimiento (el 3er turno completa y cierra)
  });

  it("captura varios campos en una sola respuesta y no vuelve a preguntarlos", async () => {
    const promptsSeenAfterMulti: string[] = [];
    const llm: LlmGenerate = async (args) => {
      if (!isTurnCall(args)) return "warmup";
      if (!promptsSeenAfterMulti.length) {
        promptsSeenAfterMulti.push(args.prompt);
        return 'Great, thanks!\nDATA: {"name":"Ada","role":"Dev","techStack":"Go","skills":"testing"}';
      }
      promptsSeenAfterMulti.push(args.prompt);
      return "All good!\nDATA: {}";
    };
    const { repo, saved } = makeRepo();
    const { io } = makeIo(["Ada, backend dev, Go, testing"]);

    const res = await runAgenticOnboarding({ llm, io, repo });

    expect(res.completed).toBe(true);
    expect(res.context).toMatchObject({ name: "Ada", role: "Dev", techStack: "Go", skills: "Testing" });
    expect(saved.map((s) => s.step).sort()).toEqual(["name", "role", "skills", "tech_stack"]);
  });
});

describe("runAgenticOnboarding — normalización antes de persistir", () => {
  it("normaliza el texto coloquial del techStack antes de guardarlo", async () => {
    const llm: LlmGenerate = async (args) => {
      if (!isTurnCall(args)) return "warmup";
      return 'Got it!\nDATA: {"name":"Ada","role":"Dev","techStack":"pues trabajo con python y esas cosas, tambien aws","skills":"testing"}';
    };
    const { repo, saved } = makeRepo();
    const { io } = makeIo(["python and aws"]);

    const res = await runAgenticOnboarding({ llm, io, repo });

    expect(res.context.techStack).toBe("Python, AWS");
    expect(saved.find((s) => s.step === "tech_stack")?.value).toBe("Python, AWS");
  });
});

describe("runAgenticOnboarding — robustez ante parseo fallido", () => {
  it("un turno sin línea DATA no persiste nada y sigue preguntando", async () => {
    let turn = 0;
    const llm: LlmGenerate = async (args) => {
      if (!isTurnCall(args)) return "warmup";
      turn += 1;
      if (turn === 1) return "Just chatting, no data at all.";
      return 'Nice!\nDATA: {"name":"Ada","role":"Dev","techStack":"Go","skills":"testing"}';
    };
    const { repo, saved } = makeRepo();
    const { io, asked } = makeIo(["hello", "Ada, dev, Go, testing"]);

    const res = await runAgenticOnboarding({ llm, io, repo });

    expect(asked).toHaveLength(2); // saludo + 1 pregunta (el 2do turno completa y cierra)
    expect(res.completed).toBe(true);
    expect(saved.map((s) => s.step).sort()).toEqual(["name", "role", "skills", "tech_stack"]);
  });

  it("no falla si createEmpty rechaza (se ignora)", async () => {
    const llm: LlmGenerate = async (args) =>
      isTurnCall(args) ? 'Ok!\nDATA: {"name":"Ada","role":"Dev","techStack":"Go","skills":"testing"}' : "warmup";
    const { repo } = makeRepo({
      createEmpty: async () => {
        throw new Error("db down");
      },
    });
    const { io } = makeIo(["Ada, Dev, Go, x"]);
    await expect(runAgenticOnboarding({ llm, io, repo })).resolves.toMatchObject({ completed: true });
  });

  it("respeta maxTurns como tope de seguridad", async () => {
    const llm: LlmGenerate = async (args) => (isTurnCall(args) ? 'Hi!\nDATA: {"name":"Ada"}' : "warmup");
    const { repo, saved, state } = makeRepo();
    const { io, asked } = makeIo(["Ada"]);

    const res = await runAgenticOnboarding({ llm, io, repo, maxTurns: 3 });

    expect(asked).toHaveLength(4); // saludo + 3 turnos (nunca se completa)
    expect(saved).toEqual([{ step: "name", value: "Ada" }]);
    expect(state.completed).toBe(true);
    expect(res.completed).toBe(true);
  });
});

describe("runAgenticOnboarding — cierre", () => {
  it("notifica un resumen sintetizado y marca el onboarding completo", async () => {
    const llm: LlmGenerate = async (args) =>
      isTurnCall(args)
        ? 'Awesome!\nDATA: {"name":"Ada","role":"Dev","techStack":"Go","skills":"testing"}'
        : "warmup";
    const { repo, state } = makeRepo();
    const { io, notified } = makeIo(["Ada, Dev, Go, testing"]);

    await runAgenticOnboarding({ llm, io, repo });

    expect(state.completed).toBe(true);
    expect(notified).toHaveLength(1);
    expect(notified[0]).toMatch(/first real workplace scenario/i);
  });

  it("reporta progreso empezando en (0, total) y terminando en (4, total)", async () => {
    const llm: LlmGenerate = async (args) =>
      isTurnCall(args)
        ? 'Nice!\nDATA: {"name":"Ada","role":"Dev","techStack":"Go","skills":"testing"}'
        : "warmup";
    const { repo } = makeRepo();
    const { io } = makeIo(["Ada, Dev, Go, testing"]);
    const progress: Array<[number, number]> = [];

    await runAgenticOnboarding({ llm, io, repo, onProgress: (c, t) => progress.push([c, t]) });

    expect(progress[0]).toEqual([0, 4]);
    expect(progress[progress.length - 1]).toEqual([4, 4]);
  });
});

describe("runAgenticOnboarding — warmup en segundo plano", () => {
  it("dispara una llamada de precarga sin bloquear el saludo inicial", async () => {
    const warmupCalls: LlmGenerateArgs[] = [];
    const holder: { resolveWarmup: (() => void) | null } = { resolveWarmup: null };
    const llm: LlmGenerate = async (args) => {
      if (isTurnCall(args)) return 'Ok!\nDATA: {"name":"Ada","role":"Dev","techStack":"Go","skills":"testing"}';
      warmupCalls.push(args);
      return new Promise<string>((resolve) => {
        holder.resolveWarmup = () => resolve("warm");
      });
    };
    const { repo } = makeRepo();
    const { io, asked } = makeIo(["Ada, Dev, Go, x"]);

    const promise = runAgenticOnboarding({ llm, io, repo });
    await vi.waitFor(() => expect(asked[0]).toBe(INSTANT_GREETING));
    expect(warmupCalls).toHaveLength(1);
    holder.resolveWarmup?.();
    await promise;
  });
});
