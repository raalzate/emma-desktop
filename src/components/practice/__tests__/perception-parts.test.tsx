/**
 * Piezas del laboratorio de pares mínimos (#357, T1–T4).
 */
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttemptButton, MaskedSentence, RevealedWord, RoundSummary } from "@/components/practice/perception-parts";

describe("MaskedSentence (T1)", () => {
  it("oculta la palabra objetivo antes de responder", () => {
    const html = renderToStaticMarkup(<MaskedSentence sentence="Wait a bit." word="bit" />);
    expect(html).toContain('data-testid="masked-word"');
    expect(html).not.toMatch(/\bbit\b/);
    expect(html).toContain("Wait a ");
  });
});

describe("RevealedWord (T1)", () => {
  it("al responder muestra la palabra con su IPA", () => {
    const html = renderToStaticMarkup(<RevealedWord sentence="Wait a bit." word="bit" ipa="/bɪt/" />);
    expect(html).toContain("<strong");
    expect(html).toContain("/bɪt/");
  });
});

describe("AttemptButton (T2)", () => {
  const props = { idleLabel: "Say it", title: "Graba la oración", onClick: vi.fn() };
  it("en reposo invita a grabar, sin emoji duplicado", () => {
    const html = renderToStaticMarkup(<AttemptButton state="idle" {...props} />);
    expect(html).toContain("Say it");
    expect(html).not.toContain("🎙");
  });
  it("grabando ofrece detener y comprobar", () => {
    expect(renderToStaticMarkup(<AttemptButton state="recording" {...props} />)).toContain("Stop and check");
  });
  it("procesando muestra spinner y «Checking…», deshabilitado", () => {
    const html = renderToStaticMarkup(<AttemptButton state="transcribing" {...props} />);
    expect(html).toContain("Checking…");
    expect(html).toContain("animate-spin");
    expect(html).toMatch(/disabled=""/);
  });
});

describe("RoundSummary (T4)", () => {
  it("muestra el resultado legible y las acciones siguientes", () => {
    const html = renderToStaticMarkup(
      <RoundSummary
        score={{ correct: 7, total: 10, weakPairs: ["ship / sheep"] }}
        onRetry={vi.fn()}
        onNextSound={vi.fn()}
        onShadowing={vi.fn()}
      />,
    );
    expect(html).toContain("70%");
    expect(html).toContain("Good — a few sounds to reinforce");
    expect(html).toContain("ship / sheep");
    for (const action of ["Practice again", "Next sound", "Go to shadowing"]) expect(html).toContain(action);
    expect((html.match(/title="/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});

describe("ejercicios: Next espera a Explain with Emma (#357)", () => {
  it("el Next del drill se deshabilita mientras Emma explica", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/components/practice/exercise-drill.tsx", "utf8");
    expect(src).toMatch(/onClick=\{next\} disabled=\{explaining\}/);
    expect(src).toMatch(/onBusyChange=\{setExplaining\}/);
  });
});
