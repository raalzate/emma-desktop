#!/usr/bin/env node
// Smoke de producción: lanza Electron recorriendo el camino EMPAQUETADO
// (EMMA_FORCE_PROD=1 → electron-serve + app://-) y exige que el renderer cargue
// con contenido (sonda EMMA_SMOKE=1 en main/window.ts). Habría atrapado el
// release v0.1.0: electron-serve apuntaba a build/main/out y la app salía blanca.
//
// Requiere `pnpm build` previo y el binario de Electron (postinstall completo);
// el gate lo omite donde no hay binario (skipIfMissing) y el workflow de release
// lo corre en las tres plataformas antes de empaquetar.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

for (const ruta of ['build/main.js', 'build/out/index.html']) {
  if (!existsSync(ruta)) {
    console.error(`SMOKE ROJO — falta ${ruta}: corré \`pnpm build\` antes.`);
    process.exit(1);
  }
}

// require('electron') exporta la ruta del binario, pero TIRA si el postinstall
// nunca corrió. Pasa cuando la cache de pnpm quedó "construida" por un install
// con ELECTRON_SKIP_BINARY_DOWNLOAD=1 (el gate de CI): al restaurarla, pnpm da
// el postinstall por hecho y el binario no está (release v0.1.1, job de Linux).
// Auto-reparación: correr el install.js de Electron y reintentar.
function electronBinary() {
  try {
    const bin = require('electron');
    return typeof bin === 'string' && existsSync(bin) ? bin : null;
  } catch {
    return null;
  }
}

let electron = electronBinary();
if (!electron) {
  console.log('SMOKE — binario de Electron ausente; corriendo node_modules/electron/install.js…');
  const pkgDir = dirname(require.resolve('electron/package.json'));
  spawnSync(process.execPath, ['install.js'], { cwd: pkgDir, stdio: 'inherit' });
  electron = electronBinary();
}
if (!electron) {
  console.error('SMOKE ROJO — no hay binario de Electron y su install.js no lo pudo bajar.');
  process.exit(1);
}

const TIMEOUT_MS = 120_000;

// En CI Linux no hay display: xvfb-run provee uno virtual. --no-sandbox porque
// el sandbox de Chromium no arranca en contenedores sin userns privilegiado.
const sinDisplay = process.platform === 'linux' && !process.env.DISPLAY;
const cmd = sinDisplay ? 'xvfb-run' : electron;
const args = sinDisplay ? ['-a', electron, '.', '--no-sandbox'] : ['.', '--no-sandbox'];

const r = spawnSync(cmd, args, {
  stdio: 'inherit',
  timeout: TIMEOUT_MS,
  env: { ...process.env, EMMA_SMOKE: '1', EMMA_FORCE_PROD: '1' },
});

if (r.error?.code === 'ETIMEDOUT' || r.signal) {
  console.error(`SMOKE ROJO — el renderer no terminó de cargar en ${TIMEOUT_MS / 1000}s (¿app://- sin contenido?).`);
  process.exit(1);
}
if (r.status !== 0) {
  console.error('SMOKE ROJO — la app de producción no cargó (did-fail-load o body vacío).');
  process.exit(1);
}
console.log('SMOKE VERDE — el renderer de producción cargó con contenido.');
