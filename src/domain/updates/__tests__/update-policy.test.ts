import { describe, expect, it } from "vitest";
import { compareVersions, isValidVersion, resolveUpdateAction } from "../update-policy";

describe("isValidVersion — guarda de borde sobre lo que llega del feed", () => {
  it("acepta semver x.y.z simple", () => {
    expect(isValidVersion("0.2.0")).toBe(true);
    expect(isValidVersion("10.20.30")).toBe(true);
  });

  it("rechaza lo malformado sin lanzar", () => {
    for (const v of ["", "abc", "1.2", "1.2.3.4", "v1.2.3", "1.2.x", null, undefined]) {
      expect(isValidVersion(v as never), String(v)).toBe(false);
    }
  });
});

describe("compareVersions", () => {
  it("ordena numéricamente, no lexicográficamente", () => {
    expect(compareVersions("0.10.0", "0.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "0.99.99")).toBeGreaterThan(0);
  });

  it("igualdad y menor", () => {
    expect(compareVersions("0.2.0", "0.2.0")).toBe(0);
    expect(compareVersions("0.1.9", "0.2.0")).toBeLessThan(0);
  });
});

describe("resolveUpdateAction — la decisión es dominio puro", () => {
  const base = { current: "0.2.0", latest: "0.3.0", platform: "win32" as const, signed: false };

  it("en Windows y Linux la acción es auto-instalar", () => {
    expect(resolveUpdateAction(base)).toBe("auto");
    expect(resolveUpdateAction({ ...base, platform: "linux" })).toBe("auto");
  });

  it("en macOS con firma ad-hoc sólo se ofrece descarga manual", () => {
    // Squirrel.Mac se niega a aplicar updates sin firma válida: intentar
    // auto-instalar en Mac ad-hoc termina en error críptico para el usuario.
    expect(resolveUpdateAction({ ...base, platform: "darwin" })).toBe("manual");
  });

  it("en macOS FIRMADO la acción pasa a auto sin reescribir nada", () => {
    expect(resolveUpdateAction({ ...base, platform: "darwin", signed: true })).toBe("auto");
  });

  it("al día o versión menor: none", () => {
    expect(resolveUpdateAction({ ...base, latest: "0.2.0" })).toBe("none");
    expect(resolveUpdateAction({ ...base, latest: "0.1.9" })).toBe("none");
  });

  it("una versión malformada del feed se trata como none, jamás lanza", () => {
    expect(resolveUpdateAction({ ...base, latest: "banana" })).toBe("none");
    expect(resolveUpdateAction({ ...base, current: "" })).toBe("none");
  });

  it("una plataforma desconocida cae a manual: avisar nunca rompe", () => {
    expect(
      resolveUpdateAction({ ...base, platform: "freebsd" as never }),
    ).toBe("manual");
  });
});
