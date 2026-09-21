# Propuesta — Machine Learning en EMMA Desktop

Estado: **propuesta** (no implementada). Fecha: 2026-09-18.

## 1. Problema

Hoy EMMA tiene **dos tipos de inteligencia** y le falta la tercera:

| Tipo | Dónde vive hoy | Limitación |
|---|---|---|
| Generativa (LLM) | Gemma local / nube (`src/lib/ai/`) | no aprende del aprendiz: cada turno parte del prompt |
| Reglas deterministas | `promotion-policy.ts`, `leitner.ts`, `next-scenario-policy.ts`, `practice-recommender.ts` | constantes fijas a ojo (`PASS_ERRORS_PER_TURN`, `BOX_INTERVALS_DAYS`, `ERROR_BOOST=2`) iguales para todo aprendiz |
| **Predictiva (ML)** | — | **falta**: nada estima probabilidad de recuerdo, nivel real ni efecto de una recomendación |

Las constantes son la tesis en miniatura: `BOX_INTERVALS_DAYS = {1,2,4,8,16}` decide cuándo repasa
cada usuario del mundo, sin mirar un solo dato suyo. **ML = reemplazar esas constantes por
parámetros aprendidos de la propia telemetría, sin salir del dispositivo.**

## 2. Principios de diseño (no negociables)

1. **Local-first también para ML.** Inferencia y entrenamiento ocurren on-device. Ningún dato
   de aprendizaje sale del equipo salvo consentimiento explícito.
2. **El dominio sigue puro.** Modelos lineales/logísticos/bayesianos = aritmética: viven en
   `src/domain/` como funciones puras que **reciben los pesos por argumento**. Los modelos
   pesados (audio, embeddings) entran por **puerto** (`MlScorer`), igual que `LlmGenerate`.
3. **Regla antes que modelo (cold start).** Cada modelo arranca con el comportamiento actual
   como *prior*; el ML sólo toma el control cuando supera un mínimo de observaciones. Nunca
   hay pantalla en blanco por falta de datos.
4. **ML medible o no entra.** Todo modelo se compara contra el baseline de reglas con métrica
   offline declarada y modo sombra antes de activarse.
5. **Determinismo en pruebas.** Los tests fijan pesos explícitos; nada de entrenamiento dentro
   del gate.

## 3. Las cinco intervenciones (ordenadas por relación valor/riesgo)

### M1 · SRS adaptativo — *Half-Life Regression* (reemplaza Leitner)

- **Reemplaza:** `src/domain/srs/leitner.ts` (5 cajas, intervalos fijos).
- **Modelo:** `p(recuerdo) = 2^(-Δt / h)`, con `h = exp(θ·x)` (vida media aprendida).
  Features `x`: aciertos, fallos, caja/repasos previos, días desde el último repaso,
  categoría de error, longitud del ítem, nivel CEFR del aprendiz.
- **Entrenamiento:** regresión con descenso de gradiente sobre `log h`, pérdida L2 sobre
  `-Δt / log2(p_observada)`; ~50 parámetros, entrena en milisegundos en un Web Worker.
- **Por qué primero:** el dato ya existe (cada repaso es una etiqueta `correct: boolean`),
  el modelo es minúsculo, y la ganancia es medible (recuerdo a igual número de repasos).
- **Métrica:** MAE de vida media y log-loss del recuerdo contra baseline Leitner, en
  backtest sobre el log de repasos.

```ts
// nuevo: half-life.ts en src/domain/srs/ — dominio puro, pesos inyectados
export interface HlrWeights { readonly theta: readonly number[]; readonly bias: number }
export function halfLifeDays(features: readonly number[], w: HlrWeights): number
export function recallProbability(halfLife: number, elapsedDays: number): number
export function nextIntervalDays(halfLife: number, targetRecall: number): number // p.ej. 0.9
```

### M2 · Trazado de conocimiento — *Bayesian Knowledge Tracing* por categoría de error

- **Reemplaza:** la barra fija de `promotion-policy.ts` (`LEVEL_PASS_BAR`, `PROMOTION_STREAK`).
- **Modelo:** un BKT por categoría de la taxonomía (`article`, `preposition`, `word_order`, …)
  con 4 parámetros (`p_init`, `p_learn`, `p_slip`, `p_guess`) estimados por EM sobre el
  historial de errores silenciosos. Salida: `p(dominio)` por categoría, actualizada por turno.
- **Efecto en producto:** la promoción CEFR deja de ser "3 sesiones bajo 0.25 errores/turno" y
  pasa a ser "dominio ≥ 0.85 en las categorías que el nivel exige" — y
  `weakErrorCategories` (que hoy alimenta `practice-recommender.ts`) se ordena por
  probabilidad de fallo, no por conteo bruto.
- **Métrica:** AUC/log-loss de predecir el acierto del siguiente turno, vs. baseline "conteo".

### M3 · Recomendación como *contextual bandit* (reemplaza los boosts fijos)

- **Reemplaza:** `ERROR_BOOST=2 / PLAN_BOOST=2 / GOAL_BOOST=1` en `next-scenario-policy.ts`.
- **Modelo:** LinUCB o Thompson sampling con contexto = (nivel, `p(dominio)` por categoría de
  M2, semana del plan, metas, SRS pendiente) y brazos = escenarios / tipos de práctica.
  **Recompensa** = mejora observada tras la sesión (caída de errores/turno en la categoría
  objetivo + finalización de la sesión).
- **Salvaguarda pedagógica:** la exploración se acota al plan de 24 semanas — el bandit
  reordena candidatos válidos, no inventa currículo. El `reasonEs` sigue siendo explicable.
- **Métrica:** *regret* acumulado y recompensa media vs. política determinista actual,
  evaluado off-policy (replay) sobre el log antes de activarse.

### M4 · Pronunciación real — GOP fonémico (reemplaza comparación de strings)

- **Reemplaza:** `pronunciation-check.ts`, que hoy declara error cuando el ASR no transcribe
  la palabra: binario, ciego al *qué* sonó mal.
- **Modelo:** *Goodness of Pronunciation* sobre posteriores de fonema de un acústico CTC
  (wav2vec2-phoneme / Whisper con alineación forzada), ejecutado en el renderer por
  `transformers.js` / `onnxruntime-web` con WebGPU — la misma vía que ya usa Whisper.
- **Efecto en producto:** puntaje por fonema → los pares mínimos (`minimal-pair-drill.ts`)
  se eligen por el fonema que el aprendiz falla de verdad, no por la unidad activa.
- **Métrica:** correlación con juicio humano sobre una muestra etiquetada + tasa de falsos
  positivos vs. el detector actual.
- **Riesgo:** es la intervención más cara (peso del modelo, latencia). Va detrás de M1–M3.

### M5 · Destilación del clasificador de errores (LLM → modelo pequeño)

- **Reemplaza (parcialmente):** la llamada a Gemma de la gramática silenciosa.
- **Método:** *knowledge distillation* — el LLM etiqueta los turnos (ya lo hace en producción);
  con ese corpus se entrena un clasificador ligero (regresión logística sobre n-gramas/POS, o
  un transformer distilado) que detecta las categorías frecuentes.
- **Ganancia:** latencia y consumo por turno (el clasificador corre en ms; el LLM queda como
  *fallback* para casos de baja confianza). Es la contribución más "de tesis": cuantificar
  cuánto del LLM se puede sustituir sin perder calidad de detección.
- **Métrica:** F1 por categoría contra el LLM como oráculo + latencia p95 por turno.

## 4. Arquitectura — dónde encaja sin romper las capas

```
interface/components  ──►  application  ──►  domain
      │                        │               ├─ srs/half-life.ts        (M1, puro)
      │                        │               ├─ progression/bkt.ts      (M2, puro)
      │                        │               ├─ pathway/bandit.ts       (M3, puro)
      │                        │               └─ ml/ml-port.ts           (MlScorer, MlWeightsRepository)
      └──►  infrastructure ────┘
              ├─ ml/onnx-scorer.ts        (M4/M5: adaptador WebGPU)
              ├─ ml/weights-repository.ts (pesos en el store JSON, versionados)
              └─ ml/trainer.worker.ts     (entrenamiento fuera del hilo de UI)
```

- **Puerto nuevo**: `ml-port.ts` en un módulo de dominio nuevo, `domain/ml/`:

```ts
/** Puntuación por un modelo externo (audio, embeddings). Adaptador afuera. */
export interface MlScorer {
  score(input: MlInput): Promise<MlScore>;
}
/** Pesos entrenados, versionados por esquema; el dominio nunca los carga solo. */
export interface MlWeightsRepository {
  load(modelId: string): Promise<VersionedWeights | null>;
  save(modelId: string, weights: VersionedWeights): Promise<void>;
}
```

- **Inferencia lineal = dominio puro.** M1–M3 son sumas y exponenciales: funciones puras que
  reciben `weights` por argumento (misma inyección que `LlmGenerate` en `teach-use-case.ts`).
- **Entrenamiento = infraestructura.** Corre en un Worker del renderer, disparado al cerrar
  sesión, nunca en el camino de un turno.
- **Diagramas:** M1–M3 tocan «BPMN · Repaso SRS», «BPMN · Ruta y progresión» y
  «BPMN · Simulación y feedback»; M4, «BPMN · Voz y pronunciación». Cada fase reescribe su
  instantánea en `docs/diagramas/` (señal `diagramas sincronizados` del gate).

## 5. Datos: sin dataset no hay ML

El store JSON ya guarda agregados (perfil, progresión, error stats, tarjetas SRS), pero **no el
evento crudo con su contexto**, que es lo que un modelo necesita. Fase 0 crea esa base:

- **Colección `ml_events`** (append-only, esquema versionado, un JSON por colección como el
  resto del store): `{ schemaVersion, ts, kind, features, outcome, modelIdInPlay }` para
  `srs_review`, `turn_error`, `recommendation_shown`, `recommendation_taken`, `pronunciation_attempt`.
- **Retención y control del usuario:** ventana configurable, botón de borrado, export a JSONL
  para la evaluación de la tesis. **Nada sale del equipo sin consentimiento explícito.**
- **Arranque en frío:** con `< N` eventos manda la regla actual; el modelo corre en **sombra**
  (predice y se registra, no decide). Umbrales propuestos: sombra desde el evento 1, control
  desde 50 repasos (M1) / 200 turnos (M2) / 100 sesiones (M3).
- **Semilla sintética** para M1/M2: simulador de aprendiz (curva de olvido conocida) para
  validar que el entrenador recupera parámetros conocidos — test de dominio, no dato real.

## 6. Evaluación (lo que defiende la tesis)

| Nivel | Qué se hace | Criterio de activación |
|---|---|---|
| Offline | backtest sobre `ml_events` exportado; baseline = reglas actuales | el modelo gana en la métrica declarada |
| Sombra | modelo predice en producción sin decidir; se registran ambas decisiones | ≥ 2 semanas sin degradación ni error de inferencia |
| Activo | feature flag por modelo, reversible desde ajustes | métrica de producto (recuerdo, errores/turno) no empeora |

Métricas de producto (las que importan, no la *loss*): errores/turno por nivel, tasa de
recuerdo en repasos, sesiones hasta promoción CEFR, adherencia al plan.

## 7. Plan por fases

| Fase | Contenido | Señal de hecho |
|---|---|---|
| **F0** | `ml_events` + export JSONL + simulador sintético + flags | gate verde; eventos visibles en el store |
| **F1** | M1 (HLR) en sombra → activo | backtest gana a Leitner; UI de repaso sin cambios visibles |
| **F2** | M2 (BKT) → alimenta promoción y `weakErrorCategories` | AUC > baseline de conteo |
| **F3** | M3 (bandit) sobre los candidatos del plan | *regret* off-policy < política fija |
| **F4** | M4 (GOP fonémico) | correlación con juicio humano sobre muestra etiquetada |
| **F5** | M5 (destilación del detector de errores) | F1 ≥ 0.85 vs. LLM oráculo, latencia p95 < 100 ms |

Cada fase es una feature del flujo SDD (issue `sdd:feature` + tareas), con TDD sobre el dominio
puro y `pnpm gate` verde como única definición de entregable.

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pocos datos por usuario (n=1) | modelos de pocos parámetros + priors de las reglas actuales + jerarquía: prior poblacional embarcado, ajuste personal encima |
| Modelo peor que la regla | modo sombra obligatorio + flag reversible + baseline siempre presente |
| Peso/latencia de modelos de audio (M4) | ONNX cuantizado, descarga bajo demanda como ya se hace con los `.litertlm` |
| No determinismo en pruebas | pesos fijos en los tests; entrenamiento nunca corre en el gate |
| Opacidad ("¿por qué me recomienda esto?") | cada decisión ML conserva su `reasonEs`; el bandit ordena, no explica menos que hoy |
| Privacidad | on-device por defecto; export sólo por acción del usuario; sin telemetría remota |

## 9. Lo que NO se propone

- Entrenar o *fine-tunear* el LLM: fuera de presupuesto y del alcance local-first.
- Aprendizaje federado entre usuarios: sin infraestructura de servidor, no aplica hoy.
- Deep Knowledge Tracing (LSTM) en F2: sin datos suficientes, un BKT calibrado gana y se explica.
