import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SetupCheckReport, type SetupCheckReportProps } from "@/components/setup/setup-check-report";
import { RemediationButton } from "@/components/setup/remediation-button";
import { diagnoseSetup } from "@/domain/setup/diagnose-setup";
import type { SetupDiagnosis } from "@/domain/setup/diagnose-setup";
import { REMEDIATIONS } from "@/domain/setup/setup-remediation";

const noop = () => {};
const handlers = {
  onContinue: noop, onContinueAnyway: noop, onRunAgain: noop,
  onRetest: noop, onSwitchToLocal: noop, onOpenSettingsTab: noop, onCloudReady: noop,
};

const verde = (): SetupDiagnosis =>
  diagnoseSetup({
    os: "mac",
    voice: { status: "ok", ms: 400, engine: "wasm" },
    ai: { status: "ok", ms: 900, mode: "local", online: true, readiness: "ok", localModelAvailable: true },
    mic: { status: "granted", devices: 1 },
  });

const conAdvertencia = (): SetupDiagnosis =>
  diagnoseSetup({
    os: "mac",
    voice: { status: "ok", ms: 3000, engine: "wasm" },
    ai: { status: "ok", ms: 900, mode: "local", online: true, readiness: "ok", localModelAvailable: true },
    mic: { status: "denied", devices: 0 },
  });

const bloqueado = (): SetupDiagnosis =>
  diagnoseSetup({
    os: "mac",
    voice: { status: "ok", ms: 400, engine: "wasm" },
    ai: { status: "error", mode: "local", online: true, readiness: "no-model", localModelAvailable: false },
    mic: { status: "granted", devices: 1 },
  });

function render(p: Partial<SetupCheckReportProps>): string {
  return renderToStaticMarkup(
    createElement(SetupCheckReport, { diagnosis: null, running: false, ...handlers, ...p }),
  );
}

describe("SetupCheckReport", () => {
  it("running: anuncia el progreso en una región aria-live y no ofrece continuar", () => {
    const html = render({ running: true });
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Checking");
    expect(html).not.toContain("Continue");
  });

  it("done verde: estado en texto con ms y velocidad, y botón Continue", () => {
    const html = render({ diagnosis: verde() });
    expect(html).toContain("Voice");
    expect(html).toContain("400 ms");
    expect(html).toContain("Fast");
    expect(html).toContain("Microphone");
    expect(html).toContain(">Continue<");
    expect(html).not.toContain("Continue anyway");
    expect(html).toContain('aria-live="polite"');
  });

  it("clasifica slow y very-slow con texto, no sólo color", () => {
    const html = render({ diagnosis: conAdvertencia() });
    expect(html).toContain("3000 ms");
    expect(html).toContain("Slow");
    const muy = diagnoseSetup({ os: "mac", voice: { status: "ok", ms: 9000, engine: "wasm" } });
    expect(render({ diagnosis: muy })).toContain("Very slow");
  });

  it("advertencia: muestra causa, remediación del catálogo y Continue anyway", () => {
    const html = render({ diagnosis: conAdvertencia() });
    expect(html).toContain("Microphone access is denied.");
    expect(html).toContain(REMEDIATIONS["mic-denied"][0].label);
    expect(html).toContain("Continue anyway");
    expect(html).toContain("Run again");
  });

  it("bloqueante: oculta Continue anyway y Continue, deja Run again", () => {
    const html = render({ diagnosis: bloqueado() });
    expect(html).not.toContain("Continue anyway");
    expect(html).not.toContain(">Continue<");
    expect(html).toContain("Run again");
    expect(html).toContain("Needs attention");
  });

  it("cada sonda ofrece retest con tooltip en español", () => {
    const html = render({ diagnosis: verde() });
    expect(html.match(/Test again/g)?.length).toBe(3);
    expect(html).toContain("Repite sólo la prueba de voz.");
  });

  it("todo botón lleva title en español", () => {
    const html = render({ diagnosis: conAdvertencia() });
    const botones = html.match(/<button\b[^>]*>/g) ?? [];
    expect(botones.length).toBeGreaterThan(0);
    for (const b of botones) expect(b).toMatch(/title="[^"]+"/);
  });

  it("retest en curso deshabilita la acción y lo anuncia", () => {
    const html = render({ diagnosis: verde(), retesting: "voice" });
    expect(html).toContain("Checking");
    expect(html).toContain("disabled");
  });

  it("carga en frío: muestra «first load» informativo y no la marca como lenta", () => {
    const d = diagnoseSetup({
      os: "mac",
      voice: { status: "ok", ms: 400, engine: "wasm" },
      ai: { status: "ok", ms: 900, loadMs: 17000, mode: "local", online: true, readiness: "ok", localModelAvailable: true },
      mic: { status: "granted", devices: 1 },
    });
    const html = render({ diagnosis: d });
    expect(html).toContain("first load 17 s");
    expect(html).toContain("900 ms");
    expect(html).toContain("Fast");
    expect(html).not.toContain("smaller local model");
  });
});

describe("RemediationButton", () => {
  const props = { onRetest: noop, onSwitchToLocal: noop, onOpenSettingsTab: noop, onCloudReady: noop };
  const r = (rem: (typeof REMEDIATIONS)["no-webgpu"][number], extra = {}) =>
    renderToStaticMarkup(createElement(RemediationButton, { remediation: rem, ...props, ...extra }));

  it("usa label en inglés y tooltip en español del catálogo", () => {
    const rem = REMEDIATIONS["no-webgpu"][0];
    const html = r(rem);
    expect(html).toContain(rem.label);
    expect(html).toContain(`title="${rem.tooltipEs}"`);
  });

  it("pasos por SO: botón con aria-expanded y lista al abrir", () => {
    const rem = REMEDIATIONS["mic-denied"][0];
    expect(r(rem)).toContain('aria-expanded="false"');
    const abierto = r(rem, { initiallyOpen: true });
    expect(abierto).toContain('aria-expanded="true"');
    expect(abierto).toContain("<ol");
    expect(abierto).toContain("Turn on EMMA in the list.");
  });
});
