#!/usr/bin/env node
// Smoke de la voz nativa (#269): lanza Electron con una entrada mínima que corre
// el host de Kokoro en un utilityProcess y sintetiza una frase real. Prueba que
// onnxruntime-node arranca en la plataforma del runner (Windows, macOS, Linux).
// Requiere `pnpm build` (o `tsc -p tsconfig.electron.json`) y red la primera vez
// (descarga ~326 MB a EMMA_KOKORO_CACHE si está, o a userData). NO es señal del
// gate: lo corren el workflow `voice-smoke` y el de release.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ENTRY = 'build/main/services/tts-native/smoke.js';

if (!existsSync(ENTRY)) {
  console.error(`VOZ NATIVA ROJA — falta ${ENTRY}: corré \`pnpm build\` antes.`);
  process.exit(1);
}

const electron = require('electron');
const TIMEOUT_MS = 15 * 60_000; // la primera vez incluye la descarga del modelo

const sinDisplay = process.platform === 'linux' && !process.env.DISPLAY;
const cmd = sinDisplay ? 'xvfb-run' : electron;
const args = sinDisplay ? ['-a', electron, ENTRY, '--no-sandbox'] : [ENTRY, '--no-sandbox'];

const r = spawnSync(cmd, args, { stdio: 'inherit', timeout: TIMEOUT_MS });
if (r.error?.code === 'ETIMEDOUT' || r.signal) {
  console.error(`VOZ NATIVA ROJA — sin respuesta en ${TIMEOUT_MS / 60_000} min.`);
  process.exit(1);
}
process.exit(r.status ?? 1);
