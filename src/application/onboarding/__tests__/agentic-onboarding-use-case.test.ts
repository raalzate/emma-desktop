import { describe, it, expect, vi } from "vitest";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import type { OnboardingIo, OnboardingRepository } from "@/domain/onboarding/i-onboarding-repository";
import { emptyProfile } from "@/domain/profile/user-profile";
import { INSTANT_GREETING, REQUIRED_FIELDS } from "@/domain/onboarding/agentic-onboarding";
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
  it("un turno sin línea DATA no deja a Emma repitiendo la pregunta: la red la resuelve", async () => {
    // Desde el issue #154: si el turno no emite DATA, el código (no el LLM) usa
    // comprehendStep con la última respuesta del usuario en vez de re-preguntar.
    let turn = 0;
    const llm: LlmGenerate = async (args) => {
      if (!isTurnCall(args)) return "Ada"; // comprehendStep sí logra inferir el nombre
      turn += 1;
      if (turn === 1) return "Just chatting, no data at all.";
      return 'Nice!\nDATA: {"role":"Dev","techStack":"Go","skills":"testing"}';
    };
    const { repo, saved } = makeRepo();
    const { io, asked } = makeIo(["hello", "dev, Go, testing"]);

    const res = await runAgenticOnboarding({ llm, io, repo });

    // el nombre se capturó por la red en el primer turno: nunca se repitió la pregunta
    expect(asked.filter((q) => /name/i.test(q))).toHaveLength(1);
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

  it("respeta maxTurns como tope de seguridad (AC4: cierre honesto)", async () => {
    // Solo captura "name"; con maxTurns=1 el contexto queda incompleto a propósito.
    const llm: LlmGenerate = async (args) => (isTurnCall(args) ? 'Hi!\nDATA: {"name":"Ada"}' : "Ada");
    const { repo, saved, state } = makeRepo();
    const { io, asked } = makeIo(["Ada"]);

    const res = await runAgenticOnboarding({ llm, io, repo, maxTurns: 1 });

    expect(asked).toHaveLength(2); // saludo + 1 turno (tope alcanzado, sigue incompleto)
    expect(saved).toEqual([{ step: "name", value: "Ada" }]);
    // contexto incompleto al agotar maxTurns: NO se marca completado, queda retomable
    expect(state.completed).toBe(false);
    expect(res.completed).toBe(false);
    expect(res.context.name).toBe("Ada");
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

  it("al agotar maxTurns incompleto notifica pausa, no el resumen falso (AC4)", async () => {
    // El modelo solo captura "name": el resumen de cierre inventaría el resto.
    const llm: LlmGenerate = async (args) => (isTurnCall(args) ? 'Hi!\nDATA: {"name":"Ada"}' : "Ada");
    const { repo, state } = makeRepo();
    const { io, notified } = makeIo(["Ada"]);

    await runAgenticOnboarding({ llm, io, repo, maxTurns: 1 });

    expect(state.completed).toBe(false);
    expect(notified).toHaveLength(1);
    expect(notified[0]).not.toMatch(/first real workplace scenario/i);
    expect(notified[0]).toMatch(/pick this up/i);
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

describe("runAgenticOnboarding — red de extracción (AC2)", () => {
  it("si el turno no emite DATA para el campo pedido, cae a comprehendStep y captura el valor", async () => {
    const llm: LlmGenerate = async (args) => {
      // El turno agéntico nunca emite DATA para "name": se apoya en la red de extracción.
      if (isTurnCall(args)) return "Nice to meet you!";
      return "Ada"; // respuesta de comprehendStep (prompt de extracción, no de turno)
    };
    const { repo, saved } = makeRepo();
    const { io, asked } = makeIo(["Ada", "backend dev", "Go and testing"]);

    await runAgenticOnboarding({ llm, io, repo });

    // El nombre quedó capturado por la red, así que Emma no vuelve a preguntarlo.
    expect(saved.some((s) => s.step === "name" && s.value === "Ada")).toBe(true);
    expect(asked.filter((q) => /name/i.test(q))).toHaveLength(1);
  });
});

describe("runAgenticOnboarding — tope por campo (AC3)", () => {
  it("abandona el campo tras 2 intentos en vez de insistir o inventarlo", async () => {
    // Ni el turno emite DATA ni la red logra extraer: el campo es irrecuperable.
    // Guardar el texto crudo sería inventar (es lo que metía basura en skills),
    // así que el campo se abandona y el perfil queda incompleto y retomable.
    const llm: LlmGenerate = async (args) => {
      if (isTurnCall(args)) return "Just chatting, no data at all.";
      throw new Error("extracción caída");
    };
    const { repo, saved, state } = makeRepo();
    const { io, asked } = makeIo(["Ada", "Ada again", "Ada once more"]);

    const res = await runAgenticOnboarding({ llm, io, repo, maxTurns: 6 });

    // El objetivo del prompt cambia de campo: ningún campo se pide 3 veces.
    const goals = asked.length;
    expect(goals).toBeLessThanOrEqual(1 + REQUIRED_FIELDS.length * 2);
    expect(saved).toHaveLength(0); // nada inventado
    expect(state.completed).toBe(false);
    expect(res.completed).toBe(false);
  });

  it("no vuelve a pedir un campo abandonado: el objetivo pasa al siguiente", async () => {
    const goalsSeen: string[] = [];
    const llm: LlmGenerate = async (args) => {
      if (isTurnCall(args)) {
        const goal = /Next detail to learn: ([^.]+)\./.exec(args.prompt)?.[1] ?? "wrap-up";
        goalsSeen.push(goal);
        return "Just chatting.";
      }
      throw new Error("extracción caída");
    };
    const { repo } = makeRepo();
    const { io } = makeIo(["algo", "otra cosa", "y otra"]);

    await runAgenticOnboarding({ llm, io, repo, maxTurns: 6 });

    // name se pide 2 veces y luego el objetivo cambia (no queda clavado).
    expect(goalsSeen.filter((g) => g.includes("first name"))).toHaveLength(2);
    expect(new Set(goalsSeen).size).toBeGreaterThan(1);
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

describe("runAgenticOnboarding — la red no inventa datos", () => {
  it("no rellena skills con la respuesta a otra pregunta (sesión real, #154)", async () => {
    // Reproduce lo visto en la app: el turno captura el rol y la red intentaba
    // meter ese mismo texto en `skills`, cerrando el onboarding sin preguntarlo.
    const llm: LlmGenerate = async (args) => {
      if (!isTurnCall(args)) {
        // extracción estricta: el texto NO trae skills → el modelo dice NONE
        if (args.prompt.includes("Does the following text contain")) return "NONE";
        return "warmup";
      }
      return 'Great!\nDATA: {"name":"Raul","role":"Architect Solution","techStack":"AWS, Microservices"}';
    };
    const { repo, saved, state } = makeRepo();
    const { io, asked, notified } = makeIo(["I am an architect solution"]);

    const res = await runAgenticOnboarding({ llm, io, repo, maxTurns: 2 });

    expect(res.context.skills).toBeUndefined();
    expect(saved.map((s) => s.step)).not.toContain("skills");
    expect(state.completed).toBe(false);
    // sigue preguntando en vez de cerrar con un perfil inventado
    expect(asked.length).toBeGreaterThan(1);
    expect(notified[0]).not.toMatch(/first real workplace scenario/i);
  });

  it("acepta el valor cuando la extracción estricta sí encuentra el dato", async () => {
    const llm: LlmGenerate = async (args) => {
      if (!isTurnCall(args)) {
        if (args.prompt.includes("Does the following text contain")) return "meetings";
        return "warmup";
      }
      return 'Nice!\nDATA: {"name":"Raul","role":"Dev","techStack":"AWS"}';
    };
    const { repo, saved } = makeRepo();
    const { io } = makeIo(["I want to practice meetings"]);

    const res = await runAgenticOnboarding({ llm, io, repo, maxTurns: 2 });

    expect(res.context.skills).toBe("Meetings");
    expect(saved.map((s) => s.step)).toContain("skills");
  });
});
