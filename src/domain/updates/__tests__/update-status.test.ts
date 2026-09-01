import { describe, expect, it } from "vitest";
import { parseUpdateStatus } from "../update-status";

describe("parseUpdateStatus — lo que llega por IPC es entrada externa", () => {
  it("acepta cada estado del contrato", () => {
    expect(parseUpdateStatus({ state: "checking" })).toEqual({ state: "checking" });
    expect(parseUpdateStatus({ state: "none", version: "0.2.0" })).toEqual({
      state: "none",
      version: "0.2.0",
    });
    expect(parseUpdateStatus({ state: "available", version: "0.3.0", action: "manual" })).toEqual({
      state: "available",
      version: "0.3.0",
      action: "manual",
    });
    expect(parseUpdateStatus({ state: "downloading", percent: 41 })).toEqual({
      state: "downloading",
      percent: 41,
    });
    expect(parseUpdateStatus({ state: "ready", version: "0.3.0" })).toEqual({
      state: "ready",
      version: "0.3.0",
    });
    expect(parseUpdateStatus({ state: "error" })).toEqual({ state: "error" });
  });

  it("rechaza basura sin lanzar: la UI la ignora", () => {
    for (const v of [null, "checking", {}, { state: "explode" }, { state: "downloading" }]) {
      expect(parseUpdateStatus(v), JSON.stringify(v)).toBeNull();
    }
  });

  it("una acción desconocida degrada a manual (avisar nunca rompe)", () => {
    expect(parseUpdateStatus({ state: "available", version: "0.3.0", action: "warp" })).toEqual({
      state: "available",
      version: "0.3.0",
      action: "manual",
    });
  });
});
