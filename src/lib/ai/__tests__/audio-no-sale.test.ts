/**
 * FR-019: los audios nunca salen del equipo. Ni el router/proveedores de IA
 * (`src/lib/ai/**`) ni el adaptador de IA remota (`main/services/ai-remote*`)
 * pueden importar nada de audio ni tocar un canal `audio:*`/`audio-*`.
 * La prueba de vida alimenta al detector con un cebo para demostrar que muerde.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function archivosTs(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : archivosTs(rel);
    return /\.tsx?$/.test(e.name) ? [rel] : [];
  });
}

const importaAudio = (src: string) =>
  /(?:from|import)\s*\(?\s*["'][^"']*audio[^"']*["']/i.test(src) || /require\(\s*["'][^"']*audio/i.test(src);

const usaCanalAudio = (src: string) => /["'`]audio[:-][\w:-]*["'`]/i.test(src) || /emmaAPI\.audio/i.test(src);

const violaPrivacidad = (src: string) => importaAudio(src) || usaCanalAudio(src);

const protegidos = [
  ...archivosTs("src/lib/ai"),
  ...fs
    .readdirSync(path.join(ROOT, "main/services"))
    .filter((f) => /^ai-remote.*\.ts$/.test(f))
    .map((f) => path.join("main/services", f)),
];

describe("contrato de privacidad: el audio no sale (FR-019)", () => {
  it("la prueba de vida: el detector muerde un cebo", () => {
    expect(violaPrivacidad(`import { saveClip } from "@/application/audio/save-clip-use-case";`)).toBe(true);
    expect(violaPrivacidad(`import x from "@/domain/audio/audio-clip"`)).toBe(true);
    expect(violaPrivacidad(`ipcRenderer.invoke("audio:save", clip)`)).toBe(true);
    expect(violaPrivacidad(`const c = "audio-save";`)).toBe(true);
    expect(violaPrivacidad(`window.emmaAPI.audioSave(clip)`)).toBe(true);
    expect(violaPrivacidad(`import { generate } from "./llm-adapter";`)).toBe(false);
  });

  it("hay archivos que vigilar (el barrido no es vacío)", () => {
    expect(protegidos.length).toBeGreaterThan(3);
    expect(protegidos.some((f) => f.includes("ai-remote"))).toBe(true);
  });

  it.each(protegidos)("%s no importa audio ni usa canales de audio", (file) => {
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    expect(violaPrivacidad(src)).toBe(false);
  });
});
