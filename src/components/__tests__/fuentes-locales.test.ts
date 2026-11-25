/**
 * Fuentes locales (incidente 2026-11-25): el build de producción descargaba las
 * fuentes de Google en CI (`next/font/google`) y se cayó en macOS, Linux y
 * Windows con «An error occurred in `next/font`. Cannot read properties of null
 * (reading '1')» — en el release de v0.12.0 y en tres PR seguidos, sin cambio
 * de código. Las fuentes viven en el repo y el build no toca la red.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";

const layout = fs.readFileSync("src/app/layout.tsx", "utf8");

describe("fuentes sin red en el build", () => {
  it("layout no usa next/font/google", () => {
    expect(layout).not.toMatch(/next\/font\/google/);
    expect(layout).toMatch(/next\/font\/local/);
  });

  it("cada archivo de fuente referenciado existe en el repo", () => {
    const files = [...layout.matchAll(/path: "\.\/(fonts\/[^"]+\.woff2)"/g)].map((m) => m[1]);
    expect(files.length).toBeGreaterThanOrEqual(4);
    for (const f of files) expect(fs.existsSync(`src/app/${f}`), f).toBe(true);
  });
});
