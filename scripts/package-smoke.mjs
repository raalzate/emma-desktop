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
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

for (const ruta of ['build/main.js', 'build/out/index.html']) {
  if (!existsSync(ruta)) {
    console.error(`SMOKE ROJO — falta ${ruta}: corré \`pnpm build\` antes.`);
    process.exit(1);
  }
}

const electron = require('electron'); // exporta la ruta del binario
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
