/**
 * La escena se cuenta ANTES de que la persona hable.
 *
 * El defecto: la narración se tecleaba y, a la vez, el kickoff ya estaba
 * generando, así que el indicador de "escribiendo…" (y después la primera
 * burbuja) aparecían por debajo del texto todavía a medias. Se leían dos cosas
 * encima, y el efecto de entrar caminando a la escena se perdía.
 *
 * Lee el fuente como texto porque no hay render de componentes en el proyecto
 * (misma técnica que `andamiaje-espanol.test.ts`): lo que se fija es el cableado
 * del gate, que es justo lo que alguien podría quitar sin darse cuenta.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const leer = (relativo: string) =>
  fs.readFileSync(path.join(process.cwd(), "src/components/chat", relativo), "utf8");

describe("la narración de escena precede a la conversación", () => {
  it("la narración avisa cuando termina", () => {
    const src = leer("scene-narration.tsx");
    expect(src, "SceneNarration debe aceptar onDone").toMatch(/onDone/);
  });

  it("la lista de mensajes espera ese aviso antes de pintar burbujas o typing", () => {
    const src = leer("message-list.tsx");
    // Hay un estado que recuerda si la narración terminó…
    expect(src).toMatch(/narrationDone/);
    // …y tanto los mensajes como el indicador de escritura cuelgan de él.
    expect(src, "los mensajes deben esperar a la narración").toMatch(
      /narrationDone\s*&&\s*messages\.map/,
    );
    expect(src, "el indicador de escritura debe esperar a la narración").toMatch(
      /narrationDone\s*&&\s*typing\s*&&/,
    );
  });

  it("una conversación reabierta del histórico no queda escondida esperando el tecleo", () => {
    const src = leer("scene-narration.tsx");
    // Sin animación el hook ya nace `done`: el aviso tiene que dispararse igual.
    expect(src).toMatch(/useEffect/);
    expect(src).toMatch(/\bdone\b/);
  });
});
