/**
 * El remedio «reply-in-cloud» (#348, T4): si ya hay llave, activa el ajuste sin
 * pedir nada; si no, abre la configuración rápida en modo «sólo respuestas»,
 * que guarda la llave SIN pasar toda la IA a remoto.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";

const button = fs.readFileSync("src/components/setup/remediation-button.tsx", "utf8");
const quick = fs.readFileSync("src/components/settings/cloud-quick-setup.tsx", "utf8");

describe("remedio respuestas en la nube", () => {
  it("el botón maneja reply-in-cloud", () => {
    expect(button).toMatch(/case "reply-in-cloud":/);
    expect(button).toMatch(/scope="replies"/);
  });

  it("la configuración rápida en modo replies no cambia el modo a remoto", () => {
    expect(quick).toMatch(/scope === "replies"/);
    expect(quick).toMatch(/replyInCloud: true/);
  });
});
