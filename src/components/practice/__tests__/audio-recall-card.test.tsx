/**
 * H2 — tarjeta de repaso en modo audio: Listen → Write → Read aloud en una
 * sola vista. El texto objetivo NO está en el DOM hasta enviar el dictado
 * (FR-012); el A/B expone referencia e intento (FR-014).
 * Se prueba la vista pura por paso (renderToStaticMarkup) con adaptadores falsos.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AudioRecallCard,
  AudioRecallView,
  type AudioRecallViewState,
  type ClipPlayer,
  type ClipRecorder,
} from "@/components/practice/audio-recall-card";
import type { SrsCard } from "@/domain/srs/srs-card";

const OBJETIVO = "She goes to school every morning";

const card = { id: "audio-abc", kind: "audio-recall", front: "Listen and write what you hear.", back: OBJETIVO } as SrsCard;

const noop = () => {};
const player: ClipPlayer = { play: noop, stop: noop };
const recorder: ClipRecorder = {
  start: async () => {},
  stop: async () => ({ url: "blob:intento" }),
};

const base: AudioRecallViewState = {
  step: "listen",
  rate: 1,
  typed: "",
  result: null,
  recording: false,
  attemptUrl: null,
};

function vista(state: Partial<AudioRecallViewState> = {}, extra: { clipUrl?: string | null } = {}): string {
  return renderToStaticMarkup(
    <AudioRecallView
      card={card}
      clipUrl={extra.clipUrl === undefined ? "file:///clip.webm" : extra.clipUrl}
      state={{ ...base, ...state }}
      handlers={{
        onReplay: noop,
        onRate: noop,
        onGoWrite: noop,
        onTyped: noop,
        onSubmit: noop,
        onGoRead: noop,
        onRecord: noop,
        onStopRecord: noop,
        onPlayReference: noop,
        onPlayAttempt: noop,
        onFinish: noop,
      }}
    />,
  );
}

describe("AudioRecallCard — stepper", () => {
  it("muestra los tres pasos en la misma vista y marca el actual con aria-current", () => {
    const html = vista({ step: "write" });
    for (const paso of ["Listen", "Write", "Read aloud"]) expect(html).toContain(paso);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="step"[^>]*><span[^>]*>\d\.<\/span><span>Write/);
  });

  it("anuncia el progreso en una región aria-live polite", () => {
    expect(vista()).toMatch(/aria-live="polite"/);
    expect(vista({ step: "write" })).toContain("Step 2 of 3");
  });
});

describe("AudioRecallCard — paso Listen", () => {
  it("ofrece reproducir, repetir y velocidad 1x / 0.75x", () => {
    const html = vista({ step: "listen" });
    expect(html).toContain("Play again");
    expect(html).toContain("1x");
    expect(html).toContain("0.75x");
  });

  it("la velocidad activa queda marcada con aria-pressed", () => {
    expect(vista({ rate: 0.75 })).toMatch(/aria-pressed="true"[^>]*>[^<]*0\.75x|0\.75x[^]*?aria-pressed="true"/);
  });

  it("el texto objetivo no está en el DOM", () => {
    expect(vista({ step: "listen" })).not.toContain(OBJETIVO);
  });
});

describe("AudioRecallCard — paso Write", () => {
  it("antes de enviar no hay texto objetivo ni en el DOM ni en atributos", () => {
    const html = vista({ step: "write", typed: "she go to school" });
    expect(html).not.toContain(OBJETIVO);
    expect(html).not.toContain("goes to school");
    expect(html).toContain('aria-label="Your dictation"');
  });

  it("enviar queda deshabilitado con el campo vacío", () => {
    expect(vista({ step: "write", typed: "  " })).toMatch(/<button[^>]*disabled=""[^>]*>\s*Check/);
  });

  it("tras enviar con error muestra el texto objetivo, el diff y el veredicto en texto", () => {
    const html = vista({ step: "write", typed: "she go to school", result: { verdict: "wrong", expected: OBJETIVO } });
    expect(html).toContain("goes");
    expect(html).toContain("Not yet");
    expect(html).toContain("rounded bg-scaffold-hard-bg");
    expect(html).toContain("Read aloud");
  });

  it("tras acertar anuncia Correct", () => {
    const html = vista({ step: "write", typed: OBJETIVO, result: { verdict: "correct", expected: OBJETIVO } });
    expect(html).toContain("Correct");
    expect(html).toContain(OBJETIVO);
  });

  it("casi correcto anuncia Almost", () => {
    const html = vista({ step: "write", typed: "She goes to schol every morning", result: { verdict: "near", expected: OBJETIVO } });
    expect(html).toContain("Almost");
  });
});

describe("AudioRecallCard — paso Read aloud", () => {
  const result = { verdict: "correct" as const, expected: OBJETIVO };

  it("muestra el texto a leer y el botón de grabar", () => {
    const html = vista({ step: "read", result });
    expect(html).toContain(OBJETIVO);
    expect(html).toContain("Record");
  });

  it("mientras graba ofrece detener", () => {
    expect(vista({ step: "read", result, recording: true })).toContain("Stop");
  });

  it("sin intento no hay reproductor A/B de tu voz; con intento expone Reference y You", () => {
    const sin = vista({ step: "read", result });
    expect(sin).not.toContain("Play you");
    const con = vista({ step: "read", result, attemptUrl: "blob:intento" });
    expect(con).toContain("Play reference");
    expect(con).toContain("Play you");
  });

  it("permite terminar y calificar", () => {
    expect(vista({ step: "read", result })).toContain("Finish");
  });
});

describe("AudioRecallCard — accesibilidad y copy", () => {
  const estados: Partial<AudioRecallViewState>[] = [
    { step: "listen" },
    { step: "write", typed: "x" },
    { step: "write", typed: "x", result: { verdict: "wrong", expected: OBJETIVO } },
    { step: "read", result: { verdict: "correct", expected: OBJETIVO } },
    { step: "read", result: { verdict: "correct", expected: OBJETIVO }, recording: true, attemptUrl: "blob:x" },
  ];

  it("todo botón tiene title y aria-label en español", () => {
    for (const e of estados) {
      const botones = [...vista(e).matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
      expect(botones.length).toBeGreaterThan(0);
      for (const b of botones) {
        expect(b, b).toMatch(/title="[^"]+"/);
        expect(b, b).toMatch(/aria-label="[^"]+"/);
      }
    }
  });

  it("los tooltips están en español", () => {
    const titulos = [...vista({ step: "listen" }).matchAll(/title="([^"]+)"/g)].map((m) => m[1]);
    expect(titulos.some((t) => /[áéíóúñ]|Reproduce|Vuelve|Pasa|Velocidad/.test(t))).toBe(true);
  });
});

describe("AudioRecallCard — degradado sin clip", () => {
  it("sin clip muestra la consigna de texto con pista y salta Listen", () => {
    const html = vista({ step: "write" }, { clipUrl: null });
    expect(html).toContain("Write this sentence from memory");
    expect(html).toContain("S__ g___ t_ s_____ e____ m______");
    expect(html).not.toContain(OBJETIVO);
    expect(html).not.toContain("Play again");
  });

  it("sin clip el stepper sólo tiene Write y Read aloud", () => {
    const html = vista({ step: "write" }, { clipUrl: null });
    expect(html).not.toContain(">Listen<");
    expect(html).toContain("Step 1 of 2");
  });
});

describe("AudioRecallCard — contenedor", () => {
  it("el contenedor arranca en Listen con clip y en Write sin él", () => {
    const con = renderToStaticMarkup(<AudioRecallCard card={card} clipUrl="file:///c.webm" player={player} recorder={recorder} onGrade={noop} />);
    expect(con).toContain("Play again");
    expect(con).not.toContain(OBJETIVO);
    const sin = renderToStaticMarkup(<AudioRecallCard card={card} clipUrl={null} player={player} recorder={recorder} onGrade={noop} />);
    expect(sin).toContain("Write this sentence from memory");
  });
});
