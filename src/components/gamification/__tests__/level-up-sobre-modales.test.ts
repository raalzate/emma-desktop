/**
 * La tarjeta «Level up!» salta al cerrar una escena, ENCIMA del diálogo de la
 * lección. Ese diálogo es un modal de Radix: apaga los clics del `body` y
 * atrapa el foco. Un `div` fijo hecho a mano quedaba visible pero muerto
 * («Keep going» no respondía y la app se bloqueaba). La tarjeta tiene que ser
 * a su vez un Dialog de Radix para apilarse como la capa interactiva superior.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync(
  path.join(process.cwd(), 'src/components/gamification/celebration-layer.tsx'),
  'utf8',
);
const tarjeta = src.slice(src.indexOf('function LevelUpCard'), src.indexOf('export function CelebrationLayerView'));

describe('tarjeta Level up sobre otros modales', () => {
  it('es un Dialog de Radix (Root + Content), no un div con role="dialog" hecho a mano', () => {
    expect(src).toMatch(/from "@radix-ui\/react-dialog"/);
    expect(tarjeta).toMatch(/DialogPrimitive\.Root/);
    expect(tarjeta).toMatch(/DialogPrimitive\.Content/);
    expect(tarjeta).not.toMatch(/role="dialog"/);
  });

  it('tiene título accesible para Radix', () => {
    expect(tarjeta).toMatch(/DialogPrimitive\.Title/);
  });
});
