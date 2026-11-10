import { describe, expect, it } from "vitest";
import { isTeachableCard, isTypedRecall, checkRecall, presentAudioCard, recallPromptEs } from "../recall-check";
import { audioRecallCardId, buildAudioRecallCard, buildCardsFromErrors } from "../srs-card";

const clip = { id: "emma-abc123", text: "The deploy failed at 3pm.", origin: "emma" as const };

describe("buildAudioRecallCard", () => {
  it("crea una tarjeta audio-recall en caja 1 con el texto objetivo y el clip", () => {
    const card = buildAudioRecallCard(clip, 20_000);
    expect(card).toEqual({
      id: "audio-emma-abc123",
      kind: "audio-recall",
      box: 1,
      lastReviewedDay: 20_000,
      front: "Listen and type what you hear.",
      back: "The deploy failed at 3pm.",
      audioId: "emma-abc123",
      audioOrigin: "emma",
    });
  });

  it("el id es determinista a partir del clip (idempotente)", () => {
    expect(audioRecallCardId("emma-abc123")).toBe("audio-emma-abc123");
    expect(buildAudioRecallCard(clip, 1).id).toBe(buildAudioRecallCard(clip, 99).id);
  });

  it("un clip del aprendiz (o un intento) marca origen learner", () => {
    expect(buildAudioRecallCard({ ...clip, origin: "learner" }, 1).audioOrigin).toBe("learner");
    expect(buildAudioRecallCard({ ...clip, origin: "attempt" }, 1).audioOrigin).toBe("learner");
  });
});

describe("tarjeta audio-recall en el repaso", () => {
  const card = buildAudioRecallCard(clip, 1);

  it("es un recuerdo tipeado (dictado) y siempre enseñable", () => {
    expect(isTypedRecall("audio-recall")).toBe(true);
    expect(isTeachableCard(card)).toBe(true);
  });

  it("se corrige contra el texto objetivo", () => {
    expect(checkRecall(card, "the deploy failed at 3pm")).toBe("correct");
    expect(checkRecall(card, "something else entirely")).toBe("wrong");
  });

  it("tiene consigna en inglés", () => {
    expect(recallPromptEs("audio-recall")).toBe("Listen and type what you hear.");
  });
});

describe("presentAudioCard", () => {
  const card = buildAudioRecallCard(clip, 1);

  it("con clip disponible se presenta en modo audio", () => {
    expect(presentAudioCard(card, true)).toEqual({ mode: "audio" });
  });

  it("sin clip se degrada a tarjeta de texto con consigna de escribir de memoria", () => {
    expect(presentAudioCard(card, false)).toEqual({
      mode: "text",
      front: "Write this sentence from memory:",
      hint: "T__ d_____ f_____ a_ 3___",
    });
  });
});

describe("buildCardsFromErrors con clip del turno", () => {
  const errors = [
    { original: "I go home", corrected: "I went home", turn: 2 },
    { original: "she like it", corrected: "she likes it", turn: 5 },
  ];

  it("adjunta el clip del turno cuando existe y no lo inventa cuando no", () => {
    const cards = buildCardsFromErrors(errors, "s", 1, (turn) => (turn === 2 ? "learner-x-2" : undefined));
    expect(cards[0].audioId).toBe("learner-x-2");
    expect("audioId" in cards[1]).toBe(false);
  });

  it("sin el 4º argumento las tarjetas son idénticas a las de siempre", () => {
    const [card] = buildCardsFromErrors(errors, "s", 1);
    expect(card).toEqual({
      id: "s-0", kind: "sentence-production", box: 1, lastReviewedDay: 1,
      front: 'Write this sentence correctly: "I go home"', back: "I went home",
    });
  });

  it("un error sin turno no consulta el clip", () => {
    const cards = buildCardsFromErrors([{ original: "a b", corrected: "a c" }], "s", 1, () => "nope");
    expect("audioId" in cards[0]).toBe(false);
  });
});
