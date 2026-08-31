#!/usr/bin/env node
/**
 * Espejo en GitHub de la ruta Sofka: los artefactos VIVEN en `specs/` (decisión
 * `tracker.artifactsIn: "repo"`, la verifica artifacts-check); las issues son lo
 * que un archivo no da — asignables, con estado propio y visibles sin clonar.
 *
 * Forma en GitHub (una feature = un árbol de issues):
 *
 *   #N  [sdd] <feature> — <título>     ← issue MADRE: spec en el cuerpo
 *    ├─ #N+1  <feature> · T1 — <tarea> ← un issue por TAREA (asignable, cerrable)
 *    └─ …                                 labels: sdd:feature | sdd:task · feature:<nombre>
 *
 * Subcomandos:
 *
 *   node scripts/sdd-github.mjs new <specs/<feature>/spec.md>       abre la issue madre
 *   node scripts/sdd-github.mjs tasks <issue> <specs/<feature>/tasks.md>  issues de tarea
 *   node scripts/sdd-github.mjs status                              qué hay abierto, por feature
 *   node scripts/sdd-github.mjs mirror-docs [--apply]               espeja gotchas y ADRs (no borra archivos)
 *
 * Todo subcomando toca la red (`gh`): esto NO es una señal del gate. La config
 * vive en `.claude/harness.config.json` → `sdd.github`.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const config = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ".claude", "harness.config.json"), "utf8"));
const gh = config.sdd.github;

const abs = (p) => path.join(REPO_ROOT, p);
const leer = (p) => fs.readFileSync(abs(p), "utf8");

/** `gh` con el repo fijado: nunca depende de en qué directorio se lo llame. */
const ghCli = (args, opciones = {}) =>
  execFileSync("gh", [...args, "--repo", gh.repo], { cwd: REPO_ROOT, encoding: "utf8", ...opciones }).trim();

// ── Lectura de los artefactos ────────────────────────────────────────────────

/** Título de un artefacto: su primer `# …`, sin prefijos tipo `spec · onboarding — `. */
function tituloDe(md, fallback) {
  const h1 = md.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!h1) return fallback;
  return h1.replace(/^\w+\s*·\s*[\w-]+\s*[—-]\s*/, "").trim() || fallback;
}

/**
 * Tareas de un `tasks.md`. Acepta las dos formas que produce el flujo Sofka:
 * filas `| T1 | descripción | requisitos | verificación |` o ítems de checklist
 * `- [ ] T001 descripción`. El checkbox es la única fuente de si está hecha.
 */
function parseTasks(md) {
  const hechas = new Set();
  for (const m of md.matchAll(/\[([ xX])\]\s*(T\d+)/g)) {
    if (m[1].toLowerCase() === "x") hechas.add(m[2]);
  }
  const tareas = [];
  for (const linea of md.split("\n")) {
    if (/^\|\s*T\d+\s*\|/.test(linea)) {
      const celdas = linea.split("|").slice(1, -1).map((c) => c.trim());
      const [id, descripcion, requisitos = "", verificacion = ""] = celdas;
      tareas.push({ id, descripcion, requisitos, verificacion, hecha: hechas.has(id) });
    }
  }
  if (tareas.length) return tareas;
  // Forma checklist: `- [ ] T001 [P] descripción` (sin tabla).
  for (const m of md.matchAll(/^[-*]\s*\[([ xX])\]\s*(T\d+)\s*(?:\[P\]\s*)?(.+)$/gm)) {
    tareas.push({ id: m[2], descripcion: m[3].trim(), requisitos: "", verificacion: "", hecha: m[1].toLowerCase() === "x" });
  }
  return tareas;
}

const RECORTE = 240;
const recorta = (s) => (s.length <= RECORTE ? s : `${s.slice(0, RECORTE - 1)}…`);

/** Los dos labels base. Sin ellos `issue create --label` falla entero, no avisa y no crea. */
function asegurarLabelsBase() {
  asegurarLabel(gh.featureLabel, "Feature de la ruta Sofka (spec en el cuerpo; el archivo manda en specs/)");
  asegurarLabel(gh.taskLabel, "Tarea de una feature Sofka");
}

/**
 * Los labels de un issue, ya creado. Se lee de la API porque NO se puede confiar en
 * `--label` ni en el código de salida: si la cuenta activa de `gh` no tiene permiso de
 * triage, GitHub descarta los labels y crea el issue igual, y `gh issue edit` imprime
 * «failed to update 1 issue» **saliendo 0**. Lo único que dice la verdad es releer.
 */
function labelsDe(numero) {
  try {
    return ghCli(["issue", "view", numero, "--json", "labels", "--jq", ".labels[].name"])
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Exige que el issue quede con `esperados`. Reintenta una vez con `issue edit` y, si
 * tampoco entran, MUERE con la causa y el remedio: un issue sin label es un issue que
 * nadie encuentra, y pasar en verde sin el label es el peor de los resultados.
 */
function exigirLabels(urlONumero, esperados) {
  const numero = String(urlONumero).split("/").pop();
  const faltan = () => esperados.filter((l) => !labelsDe(numero).includes(l));

  if (!faltan().length) return;
  try {
    ghCli(["issue", "edit", numero, "--add-label", faltan().join(",")], { stdio: "pipe" });
  } catch {
    /* el diagnóstico real lo da la relectura de abajo, no esta excepción */
  }
  const restan = faltan();
  if (!restan.length) return;

  const cuenta = (() => {
    try {
      return execFileSync("gh", ["api", "user", "--jq", ".login"], { encoding: "utf8" }).trim();
    } catch {
      return "(desconocida)";
    }
  })();
  console.error(
    [
      `El issue #${numero} quedó SIN los labels ${restan.map((l) => `\`${l}\``).join(", ")}.`,
      "",
      `Causa habitual: la cuenta activa de \`gh\` (${cuenta}) no tiene permiso de triage/write en ${gh.repo},`,
      "así que GitHub descarta los labels y crea el issue igual, sin fallar.",
      "",
      `Remedio: \`gh auth status\` para ver las cuentas, \`gh auth switch -u <dueño>\` y después`,
      `\`gh issue edit ${numero} --repo ${gh.repo} --add-label ${restan.join(",")}\`.`,
    ].join("\n"),
  );
  process.exit(1);
}

/** Crea el label si falta. `gh label create` falla si ya existe: eso no es un error. */
function asegurarLabel(nombre, descripcion) {
  try {
    ghCli(["label", "create", nombre, "--description", descripcion, "--color", gh.labelColor], { stdio: "pipe" });
  } catch {
    /* ya existía */
  }
}

// ── new · tasks · status ─────────────────────────────────────────────────────

/** Features ya espejadas en el repo, según las etiquetas `feature:<nombre>`. */
function featuresUsadas() {
  try {
    const salida = ghCli(["label", "list", "--limit", "200", "--json", "name", "--jq", ".[].name"]);
    return salida
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.startsWith(gh.featureLabelPrefix))
      .map((n) => n.slice(gh.featureLabelPrefix.length));
  } catch {
    // Sin red no se puede comprobar; el freno de labels de después igual muerde.
    return [];
  }
}

function nuevaFeature(archivo) {
  const md = fs.readFileSync(archivo, "utf8");
  asegurarLabelsBase();

  // El nombre de la feature es el directorio bajo specs/: `specs/<feature>/spec.md`.
  const feature = path.basename(path.dirname(path.resolve(archivo)));
  if (!feature || feature === "specs" || feature === ".") {
    console.error("El spec tiene que vivir en `specs/<feature>/spec.md`: el nombre del directorio es el nombre de la feature.");
    process.exit(1);
  }

  // Una feature no puede nacer con un nombre ya usado: la etiqueta `feature:<nombre>`
  // agrupa el árbol de issues, y dos features compartiéndola dejan un tablero enredado.
  const usadas = featuresUsadas();
  if (usadas.includes(feature)) {
    console.error(
      [
        `La feature \`${feature}\` ya está espejada: existe la etiqueta \`${gh.featureLabelPrefix}${feature}\` en ${gh.repo}.`,
        `Usadas: ${usadas.sort().join(", ")}.`,
        "Si es la misma feature, trabajá sobre su issue madre; si es otra, renombrá el directorio en specs/.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const labelFeature = `${gh.featureLabelPrefix}${feature}`;
  asegurarLabel(labelFeature, `Feature Sofka ${feature} (specs/${feature}/)`);
  const titulo = `[sdd] ${feature} — ${tituloDe(md, feature)}`;
  const url = ghCli([
    "issue",
    "create",
    "--title",
    titulo,
    "--body",
    [`Espejo de \`specs/${feature}/spec.md\` (el archivo manda y viaja con el clon).`, "", md].join("\n"),
    "--label",
    [gh.featureLabel, labelFeature].join(","),
  ]);
  exigirLabels(url, [gh.featureLabel, labelFeature]);
  console.log(url);
}

function tareasDesde(issueMadre, archivo) {
  const md = fs.readFileSync(archivo, "utf8");
  const tareas = parseTasks(md);
  if (!tareas.length) {
    console.error(`No encontré filas \`| T1 | … |\` ni ítems \`- [ ] T1 …\` en ${archivo}.`);
    process.exit(1);
  }
  asegurarLabelsBase();
  const etiquetas = ghCli(["issue", "view", issueMadre, "--json", "labels", "--jq", ".labels[].name"]).split("\n");
  const labelFeature = etiquetas.find((l) => l.startsWith(gh.featureLabelPrefix));
  const hijos = [];
  for (const t of tareas) {
    const url = ghCli([
      "issue",
      "create",
      "--title",
      `${labelFeature ? `${labelFeature.replace(gh.featureLabelPrefix, "")} · ` : ""}${t.id} — ${recorta(t.descripcion)}`,
      "--body",
      [`Tarea de #${issueMadre}.`, "", t.descripcion, "", `- **Requisitos:** ${t.requisitos || "—"}`, `- **Verificación:** ${t.verificacion || "—"}`].join("\n"),
      "--label",
      [gh.taskLabel, labelFeature].filter(Boolean).join(","),
    ]);
    exigirLabels(url, [gh.taskLabel, labelFeature].filter(Boolean));
    hijos.push({ ...t, numero: url.split("/").pop() });
  }
  ghCli([
    "issue",
    "comment",
    issueMadre,
    "--body",
    ["## Tareas", "", ...hijos.map((h) => `- [ ] #${h.numero} — ${h.id}`)].join("\n"),
  ]);
  console.log(`${hijos.length} tarea(s) creadas y enlazadas a #${issueMadre}.`);
}

function status() {
  const salida = ghCli([
    "issue",
    "list",
    "--label",
    gh.featureLabel,
    "--state",
    "all",
    "--json",
    "number,title,state,labels",
    "--limit",
    "100",
  ]);
  const features = JSON.parse(salida);
  if (!features.length) {
    console.log(`No hay issues con la etiqueta \`${gh.featureLabel}\` en ${gh.repo}.`);
    return;
  }
  for (const f of features.sort((a, b) => a.number - b.number)) {
    const labelFeature = f.labels.map((l) => l.name).find((n) => n.startsWith(gh.featureLabelPrefix));
    const abiertas = labelFeature
      ? JSON.parse(ghCli(["issue", "list", "--label", `${gh.taskLabel},${labelFeature}`, "--state", "open", "--json", "number", "--limit", "200"])).length
      : 0;
    const todas = labelFeature
      ? JSON.parse(ghCli(["issue", "list", "--label", `${gh.taskLabel},${labelFeature}`, "--state", "all", "--json", "number", "--limit", "200"])).length
      : 0;
    console.log(`#${f.number} [${f.state}] ${f.title} — tareas: ${todas - abiertas}/${todas} cerradas`);
  }
}

// ── mirror-docs (gotchas y ADRs a issues) ────────────────────────────────────

/**
 * Espeja a issues los registros que ya viven en el repo: los incidentes de
 * `docs/gotchas.md` (config.incidents) y las decisiones de `sdd.github.decisionsDir`
 * si el directorio existe.
 *
 * Espeja, no muda: los archivos son MECANISMO — la regla INCIDENTE del lint exige
 * cada gotcha con sus líneas obligatorias, así que tienen que viajar con el clon.
 * Lo que se gana en GitHub es lo que un archivo no da: buscable desde afuera,
 * comentable y enlazable desde un commit o un PR. Cada entrada queda con su
 * `Issue: #N`, y esa línea es lo que hace el comando idempotente.
 *
 * Nacen CERRADAS: son registro de algo que ya pasó, no trabajo pendiente.
 */
function mirrorDocs({ apply }) {
  const gotchasFile = config.incidents.file;
  const md = leer(gotchasFile);
  const heading = config.incidents.heading;
  const partes = md.split(new RegExp(`(?=^${heading})`, "m"));
  const pendientes = partes.filter((b) => b.startsWith(heading) && !/^Issue:\s*#\d+/m.test(b));

  const adrDir = gh.decisionsDir;
  const adrs = fs.existsSync(abs(adrDir))
    ? fs.readdirSync(abs(adrDir)).filter((f) => f.endsWith(".md")).filter((f) => !/^Issue:\s*#\d+/m.test(leer(`${adrDir}/${f}`)))
    : [];

  if (!apply) {
    console.log(`DRY-RUN — se espejarían a ${gh.repo}:`);
    console.log(`  ${pendientes.length} gotcha(s) sin issue de ${partes.filter((b) => b.startsWith(heading)).length} en ${gotchasFile}`);
    console.log(`  ${adrs.length} ADR(s) sin issue en ${adrDir}`);
    console.log("Los archivos NO se borran: son el mecanismo (regla INCIDENTE). Se les agrega la línea `Issue: #N`.");
    return;
  }

  asegurarLabel(gh.gotchaLabel, `Incidente registrado en ${gotchasFile}`);
  asegurarLabel(gh.adrLabel, `Decisión de arquitectura (${adrDir}/)`);

  let nuevoMd = md;
  for (const bloque of pendientes) {
    const titulo = bloque.split("\n")[0].replace(heading, "").replace(/^:\s*/, "").trim();
    const cuerpo = [
      `Registrado en \`${gotchasFile}\` (el archivo es el mecanismo: la regla INCIDENTE del lint exige sus líneas obligatorias).`,
      "",
      bloque.trim(),
    ].join("\n");
    const url = ghCli(["issue", "create", "--title", `[gotcha] ${recorta(titulo)}`, "--body", cuerpo, "--label", gh.gotchaLabel]);
    exigirLabels(url, [gh.gotchaLabel]);
    const numero = url.split("/").pop();
    ghCli(["issue", "close", numero, "--reason", "completed"]);
    // La línea va justo después del encabezado: queda visible al leer el gotcha.
    const lineas = bloque.split("\n");
    lineas.splice(1, 0, "", `Issue: #${numero}`);
    nuevoMd = nuevoMd.replace(bloque, lineas.join("\n"));
    console.log(`· #${numero} [gotcha] ${titulo}`);
  }
  if (pendientes.length) fs.writeFileSync(abs(gotchasFile), nuevoMd);

  for (const archivo of adrs) {
    const ruta = `${adrDir}/${archivo}`;
    const contenido = leer(ruta);
    const titulo = tituloDe(contenido, archivo.replace(/\.md$/, ""));
    const cuerpo = [`Decisión versionada en \`${ruta}\`: el archivo manda y viaja con el clon.`, "", contenido].join("\n");
    const url = ghCli(["issue", "create", "--title", `[adr] ${recorta(titulo)}`, "--body", cuerpo, "--label", gh.adrLabel]);
    exigirLabels(url, [gh.adrLabel]);
    const numero = url.split("/").pop();
    ghCli(["issue", "close", numero, "--reason", "completed"]);
    const lineas = contenido.split("\n");
    const iH1 = lineas.findIndex((l) => l.startsWith("# "));
    lineas.splice(iH1 + 1, 0, "", `Issue: #${numero}`);
    fs.writeFileSync(abs(ruta), lineas.join("\n"));
    console.log(`· #${numero} [adr] ${titulo}`);
  }
}

// ── Ejecución ────────────────────────────────────────────────────────────────

const [subcomando, ...resto] = process.argv.slice(2);
switch (subcomando) {
  case "new":
    if (!resto[0]) {
      console.error("Uso: node scripts/sdd-github.mjs new <specs/<feature>/spec.md>");
      process.exit(1);
    }
    nuevaFeature(resto[0]);
    break;
  case "tasks":
    if (!resto[1]) {
      console.error("Uso: node scripts/sdd-github.mjs tasks <issue-madre> <specs/<feature>/tasks.md>");
      process.exit(1);
    }
    tareasDesde(resto[0].replace(/^#/, ""), resto[1]);
    break;
  case "mirror-docs":
    mirrorDocs({ apply: resto.includes("--apply") });
    break;
  case "status":
    status();
    break;
  default:
    console.error("Subcomandos: new <spec.md> · tasks <issue> <tasks.md> · status · mirror-docs [--apply]");
    process.exit(1);
}
