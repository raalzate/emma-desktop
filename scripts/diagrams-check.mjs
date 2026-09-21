#!/usr/bin/env node
/**
 * ¿Los diagramas de arquitectura siguen hablando del código que existe?
 *
 *   node scripts/diagrams-check.mjs              # señal del gate
 *   node scripts/diagrams-check.mjs --dir <ruta> # contra otro árbol (self-test)
 *
 * Los diagramas viven en Processflow Architect, que es una app fuera del repo: nadie
 * los mira cuando se renombra una función, y un diagrama viejo miente con la misma
 * confianza con la que un diagrama nuevo dice la verdad. El 2026-09-15 pasó exactamente
 * eso: tres de cuatro vistas BPMN describían secuencias que el código no ejecuta, y una
 * modelaba dos casos de uso que ningún componente llama.
 *
 * El freno: cada vista deja una INSTANTÁNEA en `docs/diagramas/*.json` donde cada elemento
 * lleva su `codigo`: el ancla `ruta/al/archivo.ts:símbolo` que sostiene lo que la caja
 * afirma. Este script verifica que la ruta exista y que el símbolo siga apareciendo ahí.
 * Si alguien renombra, mueve o borra lo que un diagrama dibuja, la señal se pone roja y
 * obliga a actualizar la vista en la misma entrega — que es lo único que mantiene
 * sincronizados un dibujo y un repo.
 *
 * El ancla vive SÓLO acá, nunca en el lienzo: una caja que dice «src/lib/ai/router.ts» no
 * le sirve a quien lee el proceso. En la app cada elemento se lee en lenguaje de producto
 * («Propone 3 respuestas»), y el puente entre las dos caras es el `id` del elemento.
 *
 * Por qué símbolo y no número de línea: la línea se corre en cada edición y un freno que
 * da rojo sin que nada se rompa termina desactivado. El símbolo sólo cambia cuando cambia
 * de verdad lo que el diagrama afirma.
 *
 * **No toca la red ni la app.** Es sistema de archivos contra `diagrams` del config.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const config = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, ".claude", "harness.config.json"), "utf8"),
);
const reglas = config.diagrams ?? {};

const dirFlag = process.argv.indexOf("--dir");
const raiz = dirFlag !== -1 ? path.resolve(process.argv[dirFlag + 1]) : REPO_ROOT;

if (!reglas.dir) {
  console.log("diagrams-check: omitido (el config no declara `diagrams.dir`).");
  process.exit(0);
}

const dirInstantaneas = path.join(raiz, reglas.dir);
if (!fs.existsSync(dirInstantaneas)) {
  console.error(
    `diagrams-check: el config declara instantáneas en \`${reglas.dir}/\`, pero el directorio no existe.\n` +
      "O se crea con la instantánea de cada vista, o `diagrams.dir` está mintiendo.",
  );
  process.exit(1);
}

const camposVista = ["vista", "notacion", "revisado", "elementos"];
const problemas = [];
const archivos = fs
  .readdirSync(dirInstantaneas)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (!archivos.length) {
  console.error(`diagrams-check: \`${reglas.dir}/\` no tiene ninguna instantánea .json.`);
  process.exit(1);
}

/** Cada elemento ancla en `ruta:símbolo`; sin ancla no hay nada que contrastar. */
function revisarElemento(archivo, elemento) {
  const etiqueta = `${archivo} → ${elemento.nombre ?? elemento.id ?? "(sin nombre)"}`;
  if (!elemento.id || !elemento.nombre || !elemento.tipo) {
    problemas.push(`${etiqueta}: le falta id, nombre o tipo.`);
    return;
  }
  if (!elemento.descripcion) {
    problemas.push(
      `${etiqueta}: sin \`descripcion\`. La caja tiene que decir qué pasa en el producto, no sólo nombrar algo.`,
    );
  }
  if (/(^|[\s(])(src|main|scripts)\//.test(`${elemento.nombre} ${elemento.descripcion ?? ""}`)) {
    problemas.push(
      `${etiqueta}: el nombre o la descripción nombran una ruta del repo. Lo que se lee en el lienzo va en lenguaje de producto; el ancla al código es \`codigo\`.`,
    );
  }
  const cita = elemento.codigo;
  if (!cita) {
    problemas.push(
      `${etiqueta}: sin \`codigo\`. Un elemento sin ancla no se puede contrastar con nada.`,
    );
    return;
  }
  const corte = cita.lastIndexOf(":");
  if (corte === -1) {
    problemas.push(`${etiqueta}: el ancla \`${cita}\` no tiene la forma \`ruta:símbolo\`.`);
    return;
  }
  const ruta = cita.slice(0, corte);
  const simbolo = cita.slice(corte + 1);
  const abs = path.join(raiz, ruta);
  if (!fs.existsSync(abs)) {
    problemas.push(
      `${etiqueta}: ancla en \`${ruta}\`, que ya no existe. El diagrama quedó describiendo algo que se borró o se movió.`,
    );
    return;
  }
  const contenido = fs.readFileSync(abs, "utf8");
  const escapado = simbolo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`(^|[^\\w$])${escapado}([^\\w$]|$)`).test(contenido)) {
    problemas.push(
      `${etiqueta}: \`${ruta}\` ya no contiene \`${simbolo}\`. O se renombró en el código y el diagrama no se actualizó, o el diagrama nunca fue cierto.`,
    );
  }
}

for (const archivo of archivos) {
  let vista;
  try {
    vista = JSON.parse(fs.readFileSync(path.join(dirInstantaneas, archivo), "utf8"));
  } catch (err) {
    problemas.push(`${archivo}: no es JSON válido (${err.message}).`);
    continue;
  }
  const faltantes = camposVista.filter((c) => !vista[c]);
  if (faltantes.length) {
    problemas.push(`${archivo}: le faltan los campos ${faltantes.join(", ")}.`);
    continue;
  }
  if (!Array.isArray(vista.elementos) || !vista.elementos.length) {
    problemas.push(`${archivo}: \`elementos\` vacío — una vista sin elementos no documenta nada.`);
    continue;
  }
  for (const elemento of vista.elementos) revisarElemento(archivo, elemento);
}

if (problemas.length) {
  console.error(
    `diagrams-check: ${problemas.length} problema(s) de diagramas:\n` +
      problemas.map((p) => `  - ${p}`).join("\n") +
      `\n\nArreglo: actualizá la vista en Processflow Architect (skill \`disenar-diagrama\`,\n` +
      `\`export_as_view\` con \`replace: true\`) y volvé a escribir su instantánea en \`${reglas.dir}/\`.\n` +
      "Un diagrama que describe código que ya no existe es peor que no tener diagrama.",
  );
  process.exit(1);
}

const total = archivos.reduce((n, a) => {
  const v = JSON.parse(fs.readFileSync(path.join(dirInstantaneas, a), "utf8"));
  return n + v.elementos.length;
}, 0);
console.log(
  `diagrams-check: OK — ${archivos.length} vista(s), ${total} elemento(s); cada caja habla en lenguaje de producto y su ancla apunta a código que existe.`,
);
