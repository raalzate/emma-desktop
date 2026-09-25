# Gotchas — lo que ya nos costó horas

Formato fijo: **síntoma observable → causa raíz → regla → mecanismo que la hace fallar**.
Se escribe en el momento en que se paga, no "cuando haya tiempo" (`/lesson <incidente>`).

La línea `Mecanismo:` es obligatoria y la exige el lint (regla INCIDENTE): sin ella, la entrada es
prosa que se va a volver a pagar. Si el mecanismo es "ninguno ejecutable", **se escribe así**, con
el motivo — un hueco declarado se puede cerrar; uno tácito, no.

Higiene: si un test o un hook ya garantiza la regla, la entrada se recorta a una línea que apunta
al mecanismo. La prosa duplicada sólo gasta contexto.

---

### GOTCHA: <síntoma en una línea, como se ve desde afuera>

Síntoma: <qué se observó: el mensaje exacto, la pantalla en blanco, el proceso que murió>
Causa:   <la causa raíz, no la primera hipótesis>
Regla:   <qué se hace de ahora en más>
Mecanismo: <el comando que ahora falla si alguien lo repite — o "ninguno ejecutable: <por qué>">

---

### GOTCHA: el corrector ortográfico sugería en español aunque el diccionario fuera en-US

Síntoma: en macOS (2026-09-25) el aprendiz escribía «I am a soluction» y el menú contextual
  ofrecía «solución, solicito, solicitan, soluciona, solucione». El fix #174 (diccionario
  `en-US` + `lang="en"`) estaba en HEAD y el gate verde.
Causa:   en macOS Electron usa el corrector del sistema operativo: `setSpellCheckerLanguages`
  es un no-op y el atributo `lang` del input no cambia el idioma de las sugerencias (probado
  con un sondeo de Electron: `context-menu` devolvía las mismas sugerencias con y sin `lang`).
  Con el sistema en español, las sugerencias son en español para cualquier palabra.
Regla:   las sugerencias de ortografía no dependen del SO: las pone un diccionario Hunspell
  en-US empaquetado (`dictionary-en` + `nspell`) en el proceso main, en todas las plataformas.
  El SO sólo aporta el subrayado y la palabra marcada.
Mecanismo: `pnpm test` — `main/__tests__/spell-english.test.ts` carga el diccionario real y
  exige que «soluction» sugiera «solution» sin acentos ni «-ción»; `context-menu.test.ts` fija
  el ítem «Correcta en inglés» cuando el SO subraya una palabra inglesa válida.

---

### GOTCHA: los diagramas de arquitectura afirmaban secuencias que el código no ejecuta

Síntoma: cuatro vistas BPMN recién subidas a Processflow Architect leían bien y estaban
  validadas, y al contrastarlas contra los callers tres eran falsas: «Voz y pronunciación»
  modelaba `transcribeAudio`/`checkSpokenAttempt`, que no tienen caller de producción (el
  renderer llama al adaptador Whisper directo en `src/components/chat/use-voice-input.ts`);
  «Ruta y progresión» dibujaba una compuerta paralela donde `emma-runtime.ts` corre las dos
  persistencias en secuencia, cada una en su try/catch; «Turno de chat» dibujaba las
  sugerencias como un paso secuencial cuando son un `useEffect` con el borrador debounceado.
Causa:   los NODOS se sacaron leyendo los casos de uso, pero las SECUENCIAS entre casos de uso
  se compusieron sin leer el orquestador (`src/interface/emma-runtime.ts`) ni los hooks que los
  llaman. Un caso de uso dice lo que hace; sólo su caller dice cuándo y en qué orden se ejecuta
  — o si no se ejecuta nunca.
Regla:   antes de dibujar un flujo, se leen los CALLERS del código, no sólo el módulo. Y lo que
  se lee en el lienzo va en lenguaje de producto («Propone 3 respuestas»), no en rutas del repo:
  una caja que dice `src/lib/ai/router.ts` no le dice nada a quien lee el proceso. El ancla al
  código vive sólo en la instantánea del repo, y apunta a un SÍMBOLO, nunca a un número de línea:
  la línea se corre en cada edición y un freno con rojos falsos termina desactivado.
Mecanismo: `node scripts/diagrams-check.mjs` (señal «diagramas sincronizados» del gate) lee las
  instantáneas de `docs/diagramas/` y falla si una caja no tiene descripción, si su nombre o su
  descripción hablan en rutas del repo, o si su ancla apunta a un archivo o un símbolo que ya no
  existe. El self-test del arnés le pone los tres cebos (archivo borrado, símbolo renombrado y
  caja que habla en rutas) y verifica que muerda. Lo que NO puede verificar una máquina —que la
  secuencia dibujada sea la que el caller ejecuta— queda como revisión humana: es por eso que la
  regla de leer los callers está escrita acá.

---

### GOTCHA: el gate completo no se podía correr en un git worktree

Síntoma: `pnpm gate` dentro de un worktree muere en la primera señal —
  `Error: ENOTDIR: not a directory, lstat '<worktree>/.git/gate-dirty'` en
  `scripts/harness-selftest.mjs` — y termina en `GATE ROJO — señales fallidas:
  self-test del arnés`. Las otras siete señales salen verdes. Se pagó preparando
  el release v0.2.0: el árbol principal tenía trabajo sin commitear de otra rama,
  así que el único lugar limpio para verificar era un worktree, y ahí el gate no
  corría.
Causa:   el marcador del gate (`gate.marker = .git/gate-dirty`) se resolvía con
  `path.join(REPO_ROOT, marker)` en cuatro lugares. En un worktree `.git` es un
  ARCHIVO con una línea `gitdir: …`, no un directorio: escribir debajo es ENOTDIR.
Regla:   ninguna ruta bajo `.git/` se arma a mano; la resuelve git
  (`--git-common-dir`), que además devuelve el MISMO directorio para el árbol
  principal y para cada worktree — un marcador por repo, no uno por árbol.
Mecanismo: `scripts/gate-marker.mjs` es el único resolvedor (lo usan `gate.sh`,
  los hooks y el self-test) y `scripts/__tests__/gate-marker.test.ts` monta un
  worktree real y falla si alguien vuelve a componer la ruta con `path.join`.
  El self-test suma el caso «el marcador del gate cae en un directorio real».

---

### GOTCHA: la vitrina se publicó sin un archivo y el workflow terminó en verde

Síntoma: `https://raalzate.github.io/emma-desktop/ultima-version.js` devuelve 404
  y la página se queda sin el bloque de versión, mientras el workflow `pages`
  figura «success». El HTML publicado sí pedía el script.
Causa:   el paso de publicación enumeraba los archivos a commitear (index.html,
  styles.css, img, .nojekyll). Un archivo nuevo dentro de `site/` no entra en esa
  lista y nada lo nota: publicar de menos no es un error para git.
Regla:   lo que se publica es el directorio `site/` completo, y el job compara lo
  publicado contra el origen antes de empujar.
Mecanismo: `.github/workflows/pages.yml` agrega el directorio entero y corta con
  `PAGES ROJO` si `find` sobre `site/` no coincide con `git ls-files`;
  `scripts/__tests__/pages-publica-todo.test.ts` falla si alguien vuelve a
  enumerar archivos, si desaparece la comparación, o si la página referencia un
  archivo que no existe.

---

### GOTCHA: `next dev` moría al recompilar Tailwind — config ESM llamando `require()`

Síntoma: `pnpm electron-dev` muere a los minutos con `ReferenceError: require is not
  defined` en `tailwind.config.ts:53`, sólo en la primera recompilación de Tailwind.
  `pnpm build` y el gate entero VERDES: en build Next resuelve la config por otro camino.
Causa:   el config era ESM (`import` + `export default`) pero cargaba los plugins con
  `require()`. Node 25 detecta sintaxis de módulo y lo carga como ESM (`loadESMFromCJS`),
  donde `require` no existe. No es reproducible fuera de `next dev` (se intentó con
  `import()` y con `require()` desde CJS: ambos cargan bien sueltos).
Regla:   en los configs del raíz no se mezcla ESM con `require()`: los plugins se importan.
Mecanismo: `src/lib/__tests__/config-esm-sin-require.test.ts` — escanea los configs del
  raíz y falla ante la mezcla; incluye prueba de vida con el contenido exacto del incidente.

---

### GOTCHA: el juez LLM del turno nunca corría — muerto de hambre detrás de la gramática

Síntoma: la escena seguía perdiendo respuestas («No, I am fine today.» → repregunta de
  bloqueos) DESPUÉS de desplegar la arquitectura «LLM juzga, código decide». Sin ningún
  error: desde fuera, indistinguible de que el juez no existiera.
Causa:   el motor local procesa UNA generación a la vez. `send` encolaba el chequeo
  gramatical (360 tokens) antes que el juez (80): el juez vencía su tope de 4 s y la red
  determinista —el statu quo con regexes— respondía todos los turnos.
Regla:   toda pieza con fallback silencioso declara quién respondió (`source`) y el
  fallback se ve en la consola de dev; el juez corre primero en la cola del motor.
Mecanismo: `src/components/chat/__tests__/juez-antes-que-gramatica.test.ts` — falla si el
  orden se invierte o si el aviso de fallback desaparece. Los invariantes de conversación
  (`conversacion-invariantes.test.ts`) fijan además el piso que la red garantiza sola.

---

### GOTCHA: el smoke del release murió en Linux — la cache de pnpm venía "construida" sin el binario de Electron

Síntoma: primer build de v0.1.1: `Error: Electron failed to install correctly` en el paso
  de smoke del job `Package (ubuntu-latest)`; mac y windows verdes. El install de Ubuntu
  tardó 2.4 s y no corrió NINGÚN postinstall (el de mac muestra `electron postinstall: Done`).
Causa:   `ci.yml` instala con `ELECTRON_SKIP_BINARY_DOWNLOAD=1` y comparte la cache de pnpm
  con `release-build.yml` (misma clave: el lockfile). La cache de Ubuntu quedó marcada con
  el postinstall de electron "hecho" pero sin `dist/`; al restaurarla, el release no volvió
  a correrlo y `require('electron')` tiró. Dos workflows que instalan distinto NO pueden
  dar por buena la misma cache de builds.
Regla:   el smoke no confía en que el binario esté: lo verifica y, si falta, corre
  `node_modules/electron/install.js` y reintenta antes de fallar.
Mecanismo: auto-reparación en `scripts/package-smoke.mjs` (`electronBinary()` +
  install.js). Verificado en rojo: con `node_modules/electron/dist` renombrado, el smoke
  se auto-repara y termina VERDE; sin auto-reparación moría igual que en CI.

---

### GOTCHA: el release v0.1.0 compiló verde y la app instalada abría una ventana en blanco

Síntoma: el dmg de v0.1.0 instalado en Aplicaciones abre una ventana vacía (título
  `emma-desktop`, contenido blanco) con el ícono genérico de Electron en el Dock. Gate,
  CI y el workflow de release: todos verdes.
Causa:   dos punteros rotos que NINGUNA señal ejecutaba. (1) `main/config.ts` servía el
  renderer desde `join(__dirname, 'out')` asumiendo `__dirname = build/`, pero el archivo
  compila a `build/main/config.js` → electron-serve apuntaba a `build/main/out`, que no
  existe → `app://-` fallaba con ERR_FILE_NOT_FOUND → ventana blanca. (2) `build.mac.icon`
  y `win.icon` citaban `assets/icon.icns`/`.ico` que nunca existieron (sólo hay `icon.png`)
  → electron-builder cayó al ícono por defecto, en silencio. El build "verde" sólo probaba
  que COMPILA, no que CARGA: la prueba de humo del instalador era deuda declarada (#95).
Regla:   ningún release sin ejecutar el camino empaquetado: el renderer debe cargar
  `app://-` CON contenido. Las rutas del main compilado se resuelven en `main/paths.ts`
  (módulo puro con test), nunca con `join(__dirname, ...)` inline.
Mecanismo: `pnpm smoke` (`scripts/package-smoke.mjs`, señal «smoke de producción» del
  gate; el workflow de release lo corre en las 3 plataformas antes de empaquetar) +
  `main/__tests__/paths.test.ts` que fija el layout compilado. Verificado en rojo:
  con el bug de v0.1.0 reinyectado en `build/main/config.js`, el smoke sale 1.

---

### GOTCHA: instrucción del arnés apuntaba a un script inexistente y nada lo veía

Síntoma: `/harness-audit` (2026-08-31) encontró `npm run hooks:install` citado en <!-- linkcheck:ignora: cita el puntero muerto que causó el incidente -->
  `.githooks/pre-commit` y `post-commit` sin que el script existiera en `package.json` —
  un clon fresco que siguiera la instrucción fallaba con "Missing script". Ídem `npm run lint`
  en la skill nuevo-freno. El link-check estaba verde: sólo miraba enlaces y rutas.
Causa:   un script npm/pnpm citado en prosa es un puntero igual que una ruta, pero ningún freno
  lo verificaba contra el manifest. Mismo hueco para la regla de honestidad de la constitución:
  el Artículo 10 vivió etiquetado BLOCKING con mecanismo "revisión del diff" (= REVIEW) y nada falló.
Regla:   todo script npm/pnpm citado en docs y hooks existe en `package.json`; todo artículo
  BLOCKING cita un comando ejecutable en su `*Mecanismo:*`, o se reclasifica a REVIEW.
Mecanismo: `node scripts/docs-linkcheck.mjs` (señal del gate) — frenos «script npm/pnpm citado»
  y «artículo BLOCKING sin freno» (`docs.scriptRefs` y `docs.constitution` del config), cada uno
  con su caso en `scripts/harness-selftest.mjs` (3i, 3j).
