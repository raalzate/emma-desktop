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
