/** Máquina de estados pura de la tarjeta de audio: transiciones sin React. */
import { describe, expect, it } from "vitest";
import {
  audioRecallReducer,
  type AudioRecallAction,
  gradeOf,
  initialAudioRecallState,
  playbackRateFor,
  stepsFor,
  type AudioRecallState,
} from "@/components/practice/audio-recall-state";

const card = { kind: "audio-recall", front: "Listen and write what you hear.", back: "She goes to school every morning" } as const;

const reduce = (s: AudioRecallState, ...actions: AudioRecallAction[]) =>
  actions.reduce(audioRecallReducer.bind(null, card), s);

describe("estado inicial", () => {
  it("con clip arranca en listen con tres pasos", () => {
    const s = initialAudioRecallState(true);
    expect(s.step).toBe("listen");
    expect(s.rate).toBe(1);
    expect(s.result).toBeNull();
    expect(stepsFor(true)).toEqual(["listen", "write", "read"]);
  });

  it("sin clip arranca en write con dos pasos", () => {
    expect(initialAudioRecallState(false).step).toBe("write");
    expect(stepsFor(false)).toEqual(["write", "read"]);
  });
});

describe("transiciones", () => {
  const inicio = initialAudioRecallState(true);

  it("listen → write", () => {
    expect(reduce(inicio, { type: "goWrite" }).step).toBe("write");
  });

  it("cambia la velocidad sin cambiar de paso", () => {
    const s = reduce(inicio, { type: "rate", rate: 0.75 });
    expect(s.rate).toBe(0.75);
    expect(s.step).toBe("listen");
  });

  it("enviar con texto vacío no evalúa", () => {
    const s = reduce(inicio, { type: "goWrite" }, { type: "typed", text: "   " }, { type: "submit" });
    expect(s.result).toBeNull();
  });

  it("enviar evalúa con checkRecall y deja visible el objetivo", () => {
    const mal = reduce(inicio, { type: "goWrite" }, { type: "typed", text: "she go to school" }, { type: "submit" });
    expect(mal.result).toEqual({ verdict: "wrong", expected: card.back });
    const bien = reduce(inicio, { type: "goWrite" }, { type: "typed", text: card.back }, { type: "submit" });
    expect(bien.result?.verdict).toBe("correct");
  });

  it("no se puede pasar a read sin enviar; sí tras enviar", () => {
    const w = reduce(inicio, { type: "goWrite" });
    expect(reduce(w, { type: "goRead" }).step).toBe("write");
    const enviado = reduce(w, { type: "typed", text: card.back }, { type: "submit" });
    expect(reduce(enviado, { type: "goRead" }).step).toBe("read");
  });

  it("tras enviar el texto ya no se edita ni se reenvía", () => {
    const enviado = reduce(inicio, { type: "goWrite" }, { type: "typed", text: "she go" }, { type: "submit" });
    expect(reduce(enviado, { type: "typed", text: "otra" }).typed).toBe("she go");
  });

  it("grabación: start marca recording y stop guarda el intento", () => {
    const rec = reduce(inicio, { type: "recordStarted" });
    expect(rec.recording).toBe(true);
    const fin = reduce(rec, { type: "recordStopped", url: "blob:x" });
    expect(fin.recording).toBe(false);
    expect(fin.attemptUrl).toBe("blob:x");
  });
});

describe("playbackRateFor", () => {
  it("Listen y Write respetan la velocidad elegida", () => {
    expect(playbackRateFor("listen", 0.75)).toBe(0.75);
    expect(playbackRateFor("write", 0.75)).toBe(0.75);
  });
  it("la comparación A/B (Read aloud) siempre va a 1x, aunque se eligiera 0.75x", () => {
    expect(playbackRateFor("read", 0.75)).toBe(1);
    expect(playbackRateFor("read", 1)).toBe(1);
  });
});

describe("gradeOf", () => {
  const con = (verdict: "correct" | "near" | "wrong"): AudioRecallState => ({
    ...initialAudioRecallState(true),
    result: { verdict, expected: card.back },
  });

  it("correct y near cuentan como acierto; wrong no", () => {
    expect(gradeOf(con("correct"))).toEqual({ correct: true, verdict: "correct" });
    expect(gradeOf(con("near"))).toEqual({ correct: true, verdict: "near" });
    expect(gradeOf(con("wrong"))).toEqual({ correct: false, verdict: "wrong" });
  });

  it("sin dictado enviado no hay calificación", () => {
    expect(gradeOf(initialAudioRecallState(true))).toBeNull();
  });
});
