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
