import { describe, it, expect, vi } from "vitest";
import { createChunkedPlayer, type PlayerAudio } from "../chunked-player";
import type { SpeechChunk } from "@/domain/tts/speech-chunks";
import type { Speech } from "../speech-chain";

class FakeAudio implements PlayerAudio {
  currentTime = 0;
  onended: (() => void) | null = null;
  ontimeupdate: (() => void) | null = null;
  playing = false;
  constructor(readonly url: string) {}
  async play() {
    this.playing = true;
  }
  pause() {
    this.playing = false;
  }
  tick(t: number) {
    this.currentTime = t;
    this.ontimeupdate?.();
  }
  end() {
    this.playing = false;
    this.onended?.();
  }
}

const chunks: SpeechChunk[] = [
  { text: "Tell me about your day.", wordStart: 0, wordCount: 5 },
  { text: "What did you do at work?", wordStart: 5, wordCount: 6 },
];

/** Speech de n palabras de 1 s cada una: dura n segundos. */
function speechOf(url: string, words: number): Speech {
  return { audioUrl: url, timings: Array.from({ length: words }, (_, i) => ({ word: `w${i}`, start: i, end: i + 1 })) };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
}

function setup() {
  const jobs = new Map<string, ReturnType<typeof deferred<Speech>>>();
  const synthesize = vi.fn((text: string) => {
    const d = deferred<Speech>();
    jobs.set(text, d);
    return d.promise;
  });
  const audios: FakeAudio[] = [];
  const events = { onTime: vi.fn(), onStop: vi.fn(), onBuffering: vi.fn() };
  const player = createChunkedPlayer({
    chunks,
    synthesize,
    createAudio: (url) => {
      const a = new FakeAudio(url);
      audios.push(a);
      return a;
    },
    ...events,
  });
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { player, jobs, synthesize, audios, events, flush };
}

describe("createChunkedPlayer", () => {
  it("sintetiza el primer trozo y solo después pide el siguiente", async () => {
    const { player, jobs, synthesize, flush } = setup();
    const ready = player.ready();
    expect(synthesize).toHaveBeenCalledTimes(1);
    expect(synthesize).toHaveBeenLastCalledWith(chunks[0].text);
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await flush();
    expect(synthesize).toHaveBeenCalledTimes(2);
    expect(synthesize).toHaveBeenLastCalledWith(chunks[1].text);
  });

  it("ready rechaza si el primer trozo falla (el llamador cae a Web Speech)", async () => {
    const { player, jobs } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.reject(new Error("sin voz"));
    await expect(ready).rejects.toThrow("sin voz");
  });

  it("junta los timings de los trozos desplazados por la duración acumulada", async () => {
    const { player, jobs, flush } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await flush();
    jobs.get(chunks[1].text)!.resolve(speechOf("b", 6));
    await flush();
    const t = player.timings();
    expect(t).toHaveLength(11);
    expect(t[4].end).toBe(5);
    expect(t[5]).toMatchObject({ start: 5, end: 6 }); // primera palabra del 2.º trozo
    expect(t[10].end).toBe(11);
  });

  it("reproduce el primer trozo y encadena el segundo cuando termina", async () => {
    const { player, jobs, audios, flush, events } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await flush();
    jobs.get(chunks[1].text)!.resolve(speechOf("b", 6));
    await flush();
    await player.playFrom(0, null);
    expect(audios[0].playing).toBe(true);
    audios[0].tick(2);
    expect(events.onTime).toHaveBeenLastCalledWith(2);
    audios[0].end();
    await flush();
    expect(audios[1].playing).toBe(true);
    audios[1].tick(1.5);
    expect(events.onTime).toHaveBeenLastCalledWith(6.5); // offset 5 + 1.5
    audios[1].end();
    expect(events.onStop).toHaveBeenCalledOnce();
  });

  it("si el segundo trozo aún no está, avisa buffering y arranca cuando llega", async () => {
    const { player, jobs, audios, flush, events } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await player.playFrom(0, null);
    audios[0].end();
    expect(events.onBuffering).toHaveBeenLastCalledWith(true);
    expect(events.onStop).not.toHaveBeenCalled();
    jobs.get(chunks[1].text)!.resolve(speechOf("b", 6));
    await flush();
    expect(events.onBuffering).toHaveBeenLastCalledWith(false);
    expect(audios[1].playing).toBe(true);
  });

  it("saltar a un tiempo del segundo trozo pausa el primero y posiciona el segundo", async () => {
    const { player, jobs, audios, flush } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await flush();
    jobs.get(chunks[1].text)!.resolve(speechOf("b", 6));
    await flush();
    await player.playFrom(0, null);
    await player.playFrom(7, null);
    expect(audios[0].playing).toBe(false);
    expect(audios[1].playing).toBe(true);
    expect(audios[1].currentTime).toBe(2); // 7 - offset 5
  });

  it("reproducir una oración se detiene al llegar a su frontera", async () => {
    const { player, jobs, audios, events } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await player.playFrom(1, 3);
    audios[0].tick(2.9);
    expect(audios[0].playing).toBe(true);
    audios[0].tick(3);
    expect(audios[0].playing).toBe(false);
    expect(events.onStop).toHaveBeenCalledOnce();
  });

  it("untilWord espera a que los timings cubran la palabra", async () => {
    const { player, jobs } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await expect(player.untilWord(4)).resolves.toBeUndefined();
    let cubierta = false;
    const espera = player.untilWord(8).then(() => (cubierta = true));
    await new Promise((r) => setTimeout(r, 0));
    expect(cubierta).toBe(false);
    jobs.get(chunks[1].text)!.resolve(speechOf("b", 6));
    await espera;
    expect(cubierta).toBe(true);
  });

  it("si un trozo posterior falla, untilWord rechaza y la reproducción termina tras el último bueno", async () => {
    const { player, jobs, audios, flush, events } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await player.playFrom(0, null);
    const espera = player.untilWord(8);
    jobs.get(chunks[1].text)!.reject(new Error("motor caído"));
    await expect(espera).rejects.toThrow("motor caído");
    audios[0].end();
    await flush();
    expect(events.onStop).toHaveBeenCalledOnce();
  });

  it("dispose pausa el audio y descarta lo que llegue después", async () => {
    const { player, jobs, audios, flush } = setup();
    const ready = player.ready();
    jobs.get(chunks[0].text)!.resolve(speechOf("a", 5));
    await ready;
    await player.playFrom(0, null);
    player.dispose();
    expect(audios[0].playing).toBe(false);
    jobs.get(chunks[1].text)!.resolve(speechOf("b", 6));
    await flush();
    expect(audios).toHaveLength(1);
  });
});
