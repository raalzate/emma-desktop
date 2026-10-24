#!/usr/bin/env node
// Smoke de la voz en la app EMPAQUETADA (#269): toma la salida de
// `electron-builder --dir` y comprueba lo que sólo existe en un instalador real:
//   1. onnxruntime-node quedó FUERA del asar (app.asar.unpacked) y trae SÓLO los
//      binarios de esta plataforma;
//   2. la app empaquetada, lanzada con EMMA_VOICE_SMOKE=1, levanta el
//      utilityProcess de voz desde el asar y sintetiza una frase (ver
//      main/services/tts-native/smoke.ts).
// Lo corre el workflow `voice-smoke`; NO es señal del gate (necesita empaquetar).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const PLATFORM_DIR = { darwin: 'darwin', win32: 'win32', linux: 'linux' }[process.platform];

const rojo = (msg) => {
  console.error(`VOZ EMPAQUETADA ROJA — ${msg}`);
  process.exit(1);
};

/** Ejecutable de la app que dejó `electron-builder --dir`. */
function packagedBinary() {
  if (!existsSync(DIST)) return null;
  for (const dir of readdirSync(DIST)) {
    const base = path.join(DIST, dir);
    if (process.platform === 'darwin' && dir.startsWith('mac')) {
      const app = readdirSync(base).find((f) => f.endsWith('.app'));
      if (app) return { bin: path.join(base, app, 'Contents', 'MacOS', app.replace(/\.app$/, '')), resources: path.join(base, app, 'Contents', 'Resources') };
    }
    if (process.platform === 'win32' && dir === 'win-unpacked') {
      const exe = readdirSync(base).find((f) => f.endsWith('.exe') && !/uninstall/i.test(f));
      if (exe) return { bin: path.join(base, exe), resources: path.join(base, 'resources') };
    }
    if (process.platform === 'linux' && dir === 'linux-unpacked') {
      const exe = readdirSync(base).find((f) => !f.includes('.') && statSync(path.join(base, f)).isFile() && f !== 'chrome-sandbox' && f !== 'chrome_crashpad_handler');
      if (exe) return { bin: path.join(base, exe), resources: path.join(base, 'resources') };
    }
  }
  return null;
}

/** Busca el directorio `onnxruntime-node/bin/napi-v3` dentro del unpacked (layout de pnpm incluido). */
function findNapiDir(root, depth = 0) {
  if (depth > 8 || !existsSync(root)) return null;
  const candidate = path.join(root, 'onnxruntime-node', 'bin', 'napi-v3');
  if (existsSync(candidate)) return candidate;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const found = findNapiDir(path.join(root, entry.name), depth + 1);
    if (found) return found;
  }
  return null;
}

const app = packagedBinary();
if (!app || !existsSync(app.bin)) rojo(`no encontré la app empaquetada en ${DIST}/ (corré \`electron-builder --dir\` antes).`);

const napi = findNapiDir(path.join(app.resources, 'app.asar.unpacked'));
if (!napi) rojo('onnxruntime-node no está en app.asar.unpacked: el binario nativo quedó dentro del asar.');
const platforms = readdirSync(napi);
if (!platforms.includes(PLATFORM_DIR)) rojo(`faltan los binarios de ${PLATFORM_DIR} (hay: ${platforms.join(', ')}).`);
const ajenos = platforms.filter((p) => p !== PLATFORM_DIR);
if (ajenos.length) rojo(`el instalador lleva binarios de otras plataformas: ${ajenos.join(', ')}.`);
console.log(`unpacked OK — onnxruntime-node sólo con ${PLATFORM_DIR}`);

const sinDisplay = process.platform === 'linux' && !process.env.DISPLAY;
const cmd = sinDisplay ? 'xvfb-run' : app.bin;
const args = sinDisplay ? ['-a', app.bin, '--no-sandbox'] : ['--no-sandbox'];
const r = spawnSync(cmd, args, {
  stdio: 'inherit',
  timeout: 15 * 60_000,
  env: { ...process.env, EMMA_VOICE_SMOKE: '1' },
});
if (r.error?.code === 'ETIMEDOUT' || r.signal) rojo('la app empaquetada no respondió en 15 min.');
if (r.status !== 0) rojo('la app empaquetada no sintetizó (ver VOZ NATIVA ROJA arriba).');
console.log('VOZ EMPAQUETADA VERDE — el instalador real habla con el motor nativo.');
