import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SetupHistory } from "@/components/setup/setup-history";
import { diagnoseSetup } from "@/domain/setup/diagnose-setup";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";

const rec = (
  at: number,
  trigger: SetupCheckRecord["trigger"],
  measurements?: SetupCheckRecord["measurements"],
): SetupCheckRecord => ({
  version: 1, at, trigger, acknowledged: false, measurements,
  diagnosis: diagnoseSetup({
    os: "mac",
    voice: { status: "ok", ms: 400, engine: "wasm" },
    ai: { status: "ok", ms: 900, mode: "local", online: true, readiness: "ok", localModelAvailable: true },
    mic: { status: "granted", devices: 1 },
  }),
});

describe("SetupHistory", () => {
  it("sin corridas lo dice", () => {
    expect(renderToStaticMarkup(createElement(SetupHistory, { records: [] }))).toContain("No checks yet");
  });
  it("lista cada corrida con su origen y los ms por sonda", () => {
    const html = renderToStaticMarkup(createElement(SetupHistory, { records: [rec(1, "settings"), rec(2, "first-run")] }));
    expect(html).toContain("Manual");
    expect(html).toContain("First run");
    expect(html).toContain("400 ms");
    expect(html).toContain("900 ms");
  });

  it("el micrófono muestra su estado (granted / denied / no device), no «n/a»", () => {
    const con = (mic: "granted" | "denied" | "no-device") => ({
      version: 1, at: 1, trigger: "settings", acknowledged: false,
      diagnosis: diagnoseSetup({
        os: "mac",
        voice: { status: "ok", ms: 400, engine: "wasm" },
        ai: { status: "ok", ms: 900, mode: "local", online: true, readiness: "ok", localModelAvailable: true },
        mic: { status: mic, devices: mic === "no-device" ? 0 : 1 },
      }),
    }) as SetupCheckRecord;
    const html = (m: "granted" | "denied" | "no-device") =>
      renderToStaticMarkup(createElement(SetupHistory, { records: [con(m)] }));
    expect(html("granted")).toContain("Mic granted");
    expect(html("denied")).toContain("Mic denied");
    expect(html("no-device")).toContain("Mic no device");
    expect(html("granted")).not.toContain("n/a");
  });

  it("muestra el motor de voz y el modo, readiness, conexión y carga de la IA", () => {
    const m = { voiceEngine: "wasm", ai: { mode: "local", readiness: "ok", online: true, loadMs: 17000 } } as const;
    const html = renderToStaticMarkup(createElement(SetupHistory, { records: [rec(1, "settings", m)] }));
    expect(html).toContain("wasm");
    expect(html).toContain("local");
    expect(html).toContain("online");
    expect(html).toContain("first load 17 s");
  });

  it("offline y sin carga: lo dice y omite «first load»", () => {
    const m = { ai: { mode: "hybrid", readiness: "ok", online: false } } as const;
    const html = renderToStaticMarkup(createElement(SetupHistory, { records: [rec(1, "settings", m)] }));
    expect(html).toContain("hybrid");
    expect(html).toContain("offline");
    expect(html).not.toContain("first load");
  });

  it("un registro viejo sin mediciones se sigue listando", () => {
    const html = renderToStaticMarkup(createElement(SetupHistory, { records: [rec(1, "first-run")] }));
    expect(html).toContain("First run");
  });
});
