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

describe("repeatsOwnQuestion (T13 de #323)", () => {
  it("detecta que la persona repite una pregunta de sus dos últimas líneas", async () => {
    const { repeatsOwnQuestion } = await import("../repetition-guard");
    const previous = ["Hi Raul. What are you working on today?", "Nice, which part of the login page took you the longest?"];
    expect(repeatsOwnQuestion("Yes, the demo is at 2 PM. Nice, which part of the login page took you the longest?", previous)).toBe(true);
    expect(repeatsOwnQuestion("Got it. Who owns the API contract?", previous)).toBe(false);
    expect(repeatsOwnQuestion("Sounds good, thanks.", previous)).toBe(false);
  });

  it("sólo mira las dos últimas líneas de la persona", async () => {
    const { repeatsOwnQuestion } = await import("../repetition-guard");
    const previous = ["What did you do yesterday?", "Okay.", "Nice."];
    expect(repeatsOwnQuestion("And what did you do yesterday?", previous)).toBe(false);
  });
});

describe("stripRepeatedQuestions (T13 de #323)", () => {
  it("quita sólo la pregunta repetida y conserva el resto", async () => {
    const { stripRepeatedQuestions } = await import("../repetition-guard");
    const previous = ["I am good, thanks! What are you working on today, Raul?"];
    expect(
      stripRepeatedQuestions("I am good, thanks! I am busy with the demo prep. What are you working on today, Raul?", previous),
    ).toBe("I am good, thanks! I am busy with the demo prep.");
  });

  it("si sólo quedaba la pregunta repetida, devuelve vacío", async () => {
    const { stripRepeatedQuestions } = await import("../repetition-guard");
    expect(stripRepeatedQuestions("What are you working on today, Raul?", ["What are you working on today, Raul?"])).toBe("");
  });

  it("sin repetición devuelve la línea tal cual", async () => {
    const { stripRepeatedQuestions } = await import("../repetition-guard");
    expect(stripRepeatedQuestions("Nice. Who owns it?", ["What did you do?"])).toBe("Nice. Who owns it?");
  });
});
