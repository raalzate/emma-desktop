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
