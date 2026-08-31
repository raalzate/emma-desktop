import { describe, it, expect } from 'vitest';
import path from 'path';
import { rendererOutDir, assetsDir } from '../paths';

// Layout compilado (tsconfig.electron.json: rootDir "./", outDir "./build"):
// main/config.ts → build/main/config.js, así que en runtime __dirname es
// <raíz>/build/main. El export de Next lo deja `move-out` en <raíz>/build/out.
// El release v0.1.0 salió con ventana blanca porque electron-serve apuntaba a
// build/main/out (join(__dirname, 'out')): estos tests fijan la resolución real.
const compiledDir = path.join(path.sep, 'app', 'build', 'main');

describe('rendererOutDir', () => {
  it('resuelve build/out (destino de move-out), no build/main/out', () => {
    expect(rendererOutDir(compiledDir)).toBe(path.join(path.sep, 'app', 'build', 'out'));
  });
});

describe('assetsDir', () => {
  it('resuelve assets/ en la raíz (empaquetada o del repo)', () => {
    expect(assetsDir(compiledDir)).toBe(path.join(path.sep, 'app', 'assets'));
  });
});
