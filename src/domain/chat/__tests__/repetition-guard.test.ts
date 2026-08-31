import { describe, it, expect } from "vitest";
import { stripRepeatedOpener } from "../repetition-guard";

describe("repetition-guard — la persona no repite su opener (BUG-001)", () => {
  const previous = ["Great, so far so good! What is the specific task you are working on?"];

  it("elimina el opener idéntico al de un turno anterior de la persona", () => {
    expect(
      stripRepeatedOpener("Great, so far so good! What is the next step?", previous),
    ).toBe("What is the next step?");
  });

  it("elimina el opener que empieza con las mismas 4 palabras aunque no sea idéntico", () => {
    expect(
      stripRepeatedOpener("Great, so far so good then! Any blockers today?", previous),
    ).toBe("Any blockers today?");
  });

  it("no toca una respuesta con opener distinto", () => {
    expect(stripRepeatedOpener("Nice, that unblocks QA. Any blockers?", previous)).toBe(
      "Nice, that unblocks QA. Any blockers?",
    );
  });

  it("sin turnos previos devuelve el texto intacto", () => {
    expect(stripRepeatedOpener("Great, so far so good! Hi!", [])).toBe(
      "Great, so far so good! Hi!",
    );
  });

  it("si toda la respuesta era el opener repetido devuelve cadena vacía", () => {
    expect(stripRepeatedOpener("Great, so far so good!", previous)).toBe("");
  });
});
