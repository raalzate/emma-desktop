import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SetupHistory } from "@/components/setup/setup-history";
import { diagnoseSetup } from "@/domain/setup/diagnose-setup";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";

const rec = (at: number, trigger: SetupCheckRecord["trigger"]): SetupCheckRecord => ({
  version: 1, at, trigger, acknowledged: false,
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
});
