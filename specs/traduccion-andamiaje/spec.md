# spec · traduccion-andamiaje — Traducción bajo demanda como apoyo en español

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 2 — Tutoría y andamiaje
- **Módulos:** `src/domain/translation`, `src/application/translation`

## Contexto
La inmersión de EMMA es 100% en inglés (Artículo 9 de la constitución): la
conversación de práctica nunca cambia de idioma. Cuando el aprendiz no sabe
decir algo, puede pedir la traducción de una frase; esta dinámica es el único
punto donde otro idioma entra al flujo, y lo hace como andamiaje bajo demanda,
no como cambio del canal principal. El LLM traduce oración por oración y
devuelve pares bilingües que el dominio re-empareja de forma tolerante a
errores de formato del modelo pequeño.

## Historias de usuario

### US-1 — Pedir la traducción de una frase que no sé decir en inglés
Como aprendiz, quiero traducir mi frase al idioma que prefiera (por defecto
español) para saber cómo decirla en inglés sin salir de la conversación.
- **Given** mi idioma destino configurado es `es` **When** pido traducir un
  texto **Then** el prompt de sistema envía el nombre en inglés del idioma
  (`Spanish`), no el código ISO.
- **Given** el texto a traducir tiene 2 oraciones **When** el LLM responde con
  2 pares bien formados (inglés / traducción, separados por línea en blanco)
  **Then** `translate` devuelve exactamente 2 `BilingualPair`.
- **Given** paso un `targetLang` que no está en `SUPPORTED_LANGUAGES`
  **When** se resuelve el nombre del idioma **Then** se usa el código tal cual
  como nombre (comportamiento de respaldo, no falla).

### US-2 — Recibir la traducción aunque el modelo formatee mal la salida
Como aprendiz, quiero seguir viendo una traducción usable aunque el modelo
pequeño meta líneas en blanco de más, para que la ayuda no se rompa.
- **Given** el LLM devuelve líneas con blancos extra entre frase y traducción
  **When** se re-emparejan (`pairLines`) **Then** las líneas no vacías se
  agrupan en bloques de a dos, ignorando los blancos intermedios.
- **Given** el LLM devuelve un número impar de líneas no vacías
  **When** se re-emparejan **Then** la última línea suelta se empareja con
  `target: ""` en vez de perderse o lanzar error.
- **Given** el LLM lanza una excepción o timeout **When** se ejecuta
  `translate` **Then** la función retorna `{ pairs: [] }` en lugar de
  propagar el error al llamador.

## Requisitos funcionales
- **FR-001** `isSupported(code)` valida membresía exacta en
  `SUPPORTED_LANGUAGES` (es, fr, de, pt, zh) usando
  `Object.prototype.hasOwnProperty`.
- **FR-002** `resolveLanguageName` usa el `label` en inglés del idioma soportado
  si existe (`SUPPORTED_LANGUAGES[targetLang]?.label`); si no, usa el código
  recibido tal cual como nombre.
- **FR-003** `buildUserPrompt` construye el prompt exactamente como
  `` `Translate to ${targetLanguageName}:\n${text}` `` — sin transformación
  adicional del texto de entrada.
- **FR-004** `SYSTEM_PROMPT` se preserva verbatim del original Python: exige
  pares línea por línea (oración en inglés, luego traducción) separados por
  una única línea en blanco, sin comentarios adicionales del modelo.
- **FR-005** `pairLines` filtra líneas vacías antes de re-emparejar y agrupa
  las líneas no vacías restantes de dos en dos (`source`, `target`); es
  idempotente sobre entradas ya bien formadas.
- **FR-006** `translate` envuelve la llamada al LLM en `try/catch` y retorna
  `{ pairs: [] }` ante cualquier fallo, sin lanzar excepción al llamador.
- **FR-007** El límite de tokens de la traducción usa el presupuesto
  compartido `TRANSLATION_MAX_TOKENS` (`src/domain/shared/token-budgets.ts`), no
  un valor hardcodeado en el caso de uso.

## Criterios de éxito
- **SC-001** El 100% de las traducciones solicitadas usan el nombre del
  idioma en inglés en el prompt, nunca el código ISO crudo, cuando el código
  está en `SUPPORTED_LANGUAGES`.
- **SC-002** Ante cualquier error del LLM (excepción, timeout, respuesta
  vacía), `translate` nunca propaga la excepción: siempre retorna una
  estructura `{ pairs: [] }` consumible por la UI.
- **SC-003** `pairLines` nunca descarta una línea no vacía: toda línea de
  contenido termina en algún `source` o `target` de algún par.
- **SC-004** La traducción bajo demanda no cambia el idioma de la conversación
  principal (la simulación sigue en inglés); es un canal de apoyo aparte,
  consistente con el Artículo 9 de `docs/CONSTITUTION.md`.
