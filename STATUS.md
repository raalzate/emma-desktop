# STATUS — estado verificado

Lo imprime el hook `SessionStart`. Sirve para no releer el repo entero para responder
"¿esto anda?". Se actualiza cuando cambia el veredicto, no en cada commit. **Sólo va lo
verificado con un comando**; lo que se supone va en "deuda conocida".

- **Fecha del último gate completo:** 2026-10-12
- **Rama:** `main`
- **Veredicto:** VERDE (`pnpm gate`)
- **Forja:** https://github.com/raalzate/emma-desktop — `main` protegida (PR + check `gate`, aplica a admins)
- **Último release publicado:** v0.9.0 (2026-10-12, marcada Latest, 3 instaladores):
  cierre guiado y niveles propios (#206, PR #214), Teach me en columna lateral, frases
  clave en la franja SCENE (#228, PR #240), «Level up!» interactivo sobre la lección y
  menús nativos en inglés (#239, PR #241), juez de escena (#229, PR #242) y voz neuronal
  local Kokoro (#230, PR #243). Antes: v0.8.1 (2026-10-09, gamificación #216), v0.8.0,
  v0.7.0 y v0.6.0. v0.1.0 quedó retirada de hecho (dmg roto, gotcha 2026-08-31) y v0.1.1
  sigue en BORRADOR. Publicar un borrador sigue siendo gesto del humano.
- **v0.9.1 en preparación (2026-10-12; publicar = gesto del humano):** voz 100 % local.
  Kokoro corre en un Web Worker con WASM fp32 (#245): en WebGPU competía con Gemma
  (2–16 s y un cierre inesperado). Síntesis por oración; main registra
  `render-process-gone` / `child-process-gone`. Verificado en la app real con el perfil del
  usuario y Gemma cargada: Kokoro en 10/10 reproducciones sin cierres, primer sonido
  0,5–8,4 s (mediana ~3 s), 0,25 s con caché. Muestra de voz por protopersona (#246).
  Edge-TTS retirado (#247; 403 de Microsoft desde ~2026-10-10): la cadena es Kokoro ⇒ Web
  Speech y el runtime WASM de onnxruntime va empaquetado en `app://-/ort/` (0 requests a
  jsdelivr verificado por CDP).
- **Deuda de local-first:** el motor de Gemma (`@litert-lm/core`) aún carga desde jsdelivr
  (#248). Kokoro en WASM de un hilo va a RTF 1,6–1,9; con hilos (COOP/COEP) bajaría a ~0,5.
- **Pendiente de #195 y #206:** T7 (#203) y T7 (#213), lienzos de PFA de «Turno de chat»,
  «Voz y pronunciación», «Ruta y progresión» y «Simulación y feedback» (app no
  conectada; las instantáneas de `docs/diagramas/` están al día).
- **Milestone v0.5.0 fusionado (2026-09-25):** lección en karaoke con audio al lado, escena
  visible en modal durante el chat, correcciones triviales fuera del feedback, gramática con
  tres formas y verbos resaltados, lista de lecciones («Mis lecciones» en Práctica), turnos
  con voz obligatoria y corrector ortográfico en inglés en todas las plataformas (issues
  #167–#174, #182; PRs #175–#179, #181, #185). Más **v0.6.0**: prácticas dinámicas (#183,
  PR #184).
- **Vitrina pública** (capturas en inglés y sección de gamificación al día con v0.8.1, PR #224;
  describe la versión descargable, no `main` — se recaptura con el próximo release):
  https://raalzate.github.io/emma-desktop/ — sitio estático en
  `site/`, publicado en la rama `gh-pages` por `.github/workflows/pages.yml`. Los
  botones de descarga apuntan a la última release publicada (la API de GitHub los
  reescribe con el instalador de cada plataforma; sin red cae a `/releases/latest`).

## Señales

| Señal | Comando | Resultado |
|---|---|---|
| Self-test del arnés | `node scripts/harness-selftest.mjs` | verde — cada regla del config probada con una muestra que el freno bloquea |
| Link-check de docs | `node scripts/docs-linkcheck.mjs` | verde — enlaces, rutas citadas, scripts npm/pnpm citados y honestidad BLOCKING de la constitución |
| Lint de convenciones | `node scripts/repo-lint.mjs` | verde — PUREZA (domain/application/infrastructure), ANY, SECRETO, CONSOLE, ONLY, INCIDENTE |
| Artefactos en su lugar | `node scripts/artifacts-check.mjs` | verde — artefactos SDD en issues de GitHub; sin `specs/` en el repo |
| Diagramas sincronizados | `node scripts/diagrams-check.mjs` | verde — 4 vistas BPMN, 87 elementos; cajas en lenguaje de producto y anclas que apuntan a código que existe |
| Typecheck | `pnpm typecheck` | verde (tsconfig app + electron) |
| Tests | `pnpm test` | verde — 1935 pruebas en 233 archivos |
| Build de producción | `pnpm build` | verde — next export + tsc electron + move-out |
| Smoke de producción | `pnpm smoke` | verde — Electron carga `app://-` con contenido (camino empaquetado); OMITIDA donde no hay binario de Electron (gate de CI) |

Pre-commit instalado: sí (`core.hooksPath=.githooks`). CI corre el mismo gate: workflow
`.github/workflows/ci.yml` (`pnpm gate`) en cada push/PR a `main`. Push directo a `main`
bloqueado dos veces: `.githooks/pre-push` (local, antes de la red) y la protección de rama
en GitHub (server-side, exige PR con el check `gate` verde). La ruta SDD vive en
issues con `scripts/sdd-github.mjs` (`pnpm sdd:new · sdd:tasks · sdd:status · sdd:mirror`);
el directorio `specs/` se eliminó el 2026-09-01 — los 14 specs y 70 tareas ya estaban
espejados en issues (`sdd:feature` / `sdd:task`) y ahora las issues son el único registro.
Releases: tag `v*` dispara
`.github/workflows/release-build.yml` (dmg · exe · AppImage, borrador de release);
el proceso está escrito en `docs/RELEASE.md`, las notas viven en `docs/releases/`
(regla RELEASE del lint: sin notas de la versión no hay gate verde) y el primer
release real (v0.1.0) se publicó el 2026-08-31.

El gate se probó ROJO a propósito (2026-08-26): un `: any` temporal en `src/domain/` hizo
fallar `repo-lint` con la regla ANY. Un gate que nunca falló es una esperanza, no un gate.

**Madurez del arnés (escala L0–L4 de `docs/buenas-practicas.md`): L3, camino a L4** — gate
único con pre-commit y hooks del ciclo del agente vivos (self-test verde), rutas protegidas,
subagentes y comandos instalados, CI corriendo el mismo gate y `main` protegida (2026-08-31).
El ciclo RHO se estrenó el 2026-08-31: `/harness-audit` encontró punteros muertos y un
artículo BLOCKING sin freno, y `/lesson` los convirtió en dos frenos nuevos del link-check
con sus casos de self-test (primer gotcha real en `docs/gotchas.md`). L4 pide que el ciclo
sea rutina, no estreno.

## Deuda conocida

- **Vistas PFA desincronizadas con lo fusionado el 2026-09-25:** «BPMN · Voz y pronunciación»
  (turnos con voz obligatoria, #169), «BPMN · Simulación y feedback» (lista de lecciones,
  #172) y «BPMN · Repaso SRS» (recuerdo escrito, #183) describen el flujo anterior en el
  lienzo. Las instantáneas en `docs/diagramas/` pasan la señal del gate (anclas válidas),
  pero el dibujo en Processflow Architect no se pudo actualizar: la app no respondió en
  `127.0.0.1:7331` durante la sesión. Se sincroniza con el skill `disenar-diagrama` en
  cuanto esté abierta.

- **Cobertura sin umbral:** `vitest.config.ts` no exige mínimo de cobertura; el Artículo 1
  (TDD) es REVIEW hasta que se declare `coverage.thresholds` (mecanismo candidato:
  `pnpm test:coverage` como señal del gate con umbral).
- **Smoke de producción no corre en el gate de CI:** `ci.yml` instala con
  `ELECTRON_SKIP_BINARY_DOWNLOAD=1`, así que la señal se OMITE ahí (omitido ≠ pasó);
  cubre el gate local y el workflow de release (3 plataformas). Aceptado a propósito
  (~100 MB por run); revisar si vuelve a doler.
- **Artículos REVIEW de la constitución** (1, 4, 6, 7, 9, 13): sin comando que falle; los
  juzga `reviewer`/`code-reviewer` en cada diff.
- **Artículo 10 reclasificado a REVIEW** (v1.3.0): "integridad de aserciones" no es verificable
  por máquina; lo juzga la revisión del diff. Volvería a BLOCKING sólo con un freno real.
