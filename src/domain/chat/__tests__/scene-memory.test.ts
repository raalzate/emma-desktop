import { describe, expect, it } from "vitest";
import { openQuestionOf, sceneEntities, renderSceneMemory } from "../scene-memory";
import type { ChatTurn } from "../simulation-session";

const turno = (role: ChatTurn["role"], content: string): ChatTurn => ({ role, content });

describe("sceneEntities", () => {
  it("recoge los tickets nombrados en la escena", () => {
    const entidades = sceneEntities([
      turno("assistant", "Did you land PROJ-421 yesterday?"),
      turno("user", "Yes, PROJ-421 is merged. ABC-7 is still open."),
    ]);
    expect(entidades).toContain("PROJ-421");
    expect(entidades).toContain("ABC-7");
  });

  it("recoge nombres propios que no abren la oración", () => {
    const entidades = sceneEntities([turno("user", "I paired with Marta on the migration.")]);
    expect(entidades).toContain("Marta");
  });

  it("no toma la primera palabra de la oración por un nombre propio", () => {
    expect(sceneEntities([turno("user", "Yesterday I shipped the API.")])).not.toContain(
      "Yesterday",
    );
  });

  it("no repite una entidad nombrada varias veces", () => {
    const entidades = sceneEntities([
      turno("user", "PROJ-421 is done."),
      turno("assistant", "Good, PROJ-421 unblocks the mobile team."),
    ]);
    expect(entidades.filter((e) => e === "PROJ-421")).toHaveLength(1);
  });

  it("acota la lista: el prompt no puede crecer con la escena", () => {
    const largo = Array.from({ length: 30 }, (_, i) => turno("user", `Ticket AB-${i} is open.`));
    expect(sceneEntities(largo).length).toBeLessThanOrEqual(8);
  });

  it("conserva las entidades MÁS RECIENTES cuando hay que recortar", () => {
    const largo = Array.from({ length: 30 }, (_, i) => turno("user", `Ticket AB-${i} is open.`));
    expect(sceneEntities(largo)).toContain("AB-29");
  });
});

describe("openQuestionOf", () => {
  it("devuelve la pregunta con la que la persona cerró su último turno", () => {
    expect(
      openQuestionOf([
        turno("user", "I finished the API."),
        turno("assistant", "Nice. What's on your plate today?"),
      ]),
    ).toBe("What's on your plate today?");
  });

  it("no hay pregunta abierta si el último turno es del aprendiz", () => {
    expect(
      openQuestionOf([turno("assistant", "What's next?"), turno("user", "Reviews.")]),
    ).toBeNull();
  });

  it("no hay pregunta abierta si la persona no preguntó nada", () => {
    expect(openQuestionOf([turno("assistant", "Sounds good, thanks.")])).toBeNull();
  });
});

describe("renderSceneMemory", () => {
  it("rinde una sola línea compacta con lo concreto de la escena", () => {
    const texto = renderSceneMemory({
      entities: ["PROJ-421", "Marta"],
      openQuestion: "What's blocking you?",
    });
    expect(texto).toContain("PROJ-421, Marta");
    expect(texto).toContain("What's blocking you?");
    expect(texto.split("\n")).toHaveLength(2);
  });

  it("sin nada que recordar no ocupa contexto", () => {
    expect(renderSceneMemory({ entities: [], openQuestion: null })).toBe("");
  });
});

describe("memoria sin empujar a re-preguntar (T12 de #323)", () => {
  // «You are waiting on their answer to: X» viajaba justo cuando el mensaje
  // nuevo ERA esa respuesta: el modelo pequeño volvía a preguntarla.
  it("la pregunta pendiente se presenta como ya contestada por el mensaje nuevo", () => {
    const texto = renderSceneMemory({ entities: [], openQuestion: "What did you do yesterday?" });
    expect(texto).not.toMatch(/waiting on their answer/i);
    expect(texto).toMatch(/new message is their answer/i);
    expect(texto).toMatch(/do not ask it again/i);
  });
});

describe("lo que dijo el aprendiz (T12 de #323)", () => {
  it("guarda las afirmaciones sustantivas que ya salieron de la ventana reciente", async () => {
    const { buildSceneMemory } = await import("../scene-memory");
    const historia: ChatTurn[] = [
      turno("assistant", "What did you do yesterday?"),
      turno("user", "Yesterday I finished the login page and the Lambda integration."),
      turno("assistant", "Nice. And today?"),
      turno("user", "Today I will write the payment API tests."),
      turno("assistant", "Any blockers?"),
      turno("user", "Yes."),
      turno("assistant", "What is it?"),
      turno("user", "The API contract is late."),
      turno("assistant", "Okay."),
    ];
    const memoria = buildSceneMemory(historia);
    expect(memoria.learnerFacts).toEqual([
      "Yesterday I finished the login page and the Lambda integration.",
      "Today I will write the payment API tests.",
    ]);
    expect(renderSceneMemory(memoria)).toMatch(/THE LEARNER ALREADY TOLD YOU: .*login page.*payment API tests/);
  });

  it("no guarda respuestas mínimas ni repite lo que sigue en la ventana reciente", async () => {
    const { buildSceneMemory } = await import("../scene-memory");
    const corta: ChatTurn[] = [turno("assistant", "Hi?"), turno("user", "Hi."), turno("assistant", "Ready?")];
    expect(buildSceneMemory(corta).learnerFacts).toEqual([]);
  });
});
