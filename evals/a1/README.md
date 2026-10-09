# Evals de nivel A1 (promptfoo)

¿La persona de una escena le habla a un aprendiz **A1** como pide
`LEVEL_STYLE.A1` (`src/domain/chat/simulation-prompt-text.ts`)? Estas pruebas lo
miden contra un modelo real. No son parte de `pnpm gate`: no son deterministas,
tardan y pueden costar dinero.

## Qué se ejecuta

- `emma-provider.mjs` arma el system con `buildSimulationPrompt` (nivel A1, perfil
  de prueba «Laura») y corre el caso de uso real `runChatTurn` —limpieza,
  guardias y reintentos incluidos— con un `LlmGenerate` inyectado que habla con
  cualquier endpoint `/chat/completions` compatible con OpenAI.
- `emma-lib.ts` es la superficie del código que se usa; Vite la empaqueta a
  `.build/` (ignorado por git) para que Node la cargue sin TypeScript.
- Cada caso pasa por dos aserciones:
  - **`a1-deterministic`**: `checkA1Reply` (`src/domain/cefr/a1-reply-check.ts`, con su
    prueba). Exige como máximo 3 oraciones de hasta 15 palabras, solo inglés, sin
    modismos ni phrasal verbs de oficina, sin revelarse IA y sin corregir al aprendiz.
  - **`a1-comprehensible`**: un juez LLM revisa si un principiante lo entiende.

  Algunos casos agregan una rúbrica propia: reformular cuando el aprendiz se pierde,
  no corregir, seguir en inglés si piden español y no romper el personaje.

## Correr

```bash
# 1. Sin red: verifica el cableado y que la aserción A1 rechace respuestas malas
pnpm eval:a1:selftest

# 2. Contra Gemma local en Ollama (por defecto: http://localhost:11434/v1, gemma3n:e4b)
ollama pull gemma3n:e4b
pnpm eval:a1 -- --grader openai:chat:gpt-4.1-mini   # el juez necesita OPENAI_API_KEY

# 3. Todo con Claude (escena y juez; SDK oficial, lee ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=...            # en tu shell, nunca en un archivo del repo
pnpm eval:a1:claude                     # escena y juez: claude-opus-5
EMMA_EVAL_MODEL=claude-haiku-4-5 pnpm eval:a1:claude   # escena más barata

# Gemma en Ollama para la escena y Claude solo como juez
pnpm eval:a1 -- --grader anthropic:messages:claude-opus-5

# 4. Otro modelo para la escena (cualquier API compatible con OpenAI)
EMMA_EVAL_BASE_URL=https://api.openai.com/v1 EMMA_EVAL_MODEL=gpt-4.1-mini \
EMMA_EVAL_API_KEY=$OPENAI_API_KEY pnpm eval:a1

# Ver resultados en el navegador
npx promptfoo@0.123.1 view
```

El juez también puede ser local: `--grader ollama:chat:gemma3:12b`. Un juez más
chico que el modelo evaluado da veredictos poco confiables.

## Agregar un caso

Se agrega una entrada en `tests:` de `promptfooconfig.yaml` con `scenario` (un
`scenarioType` del catálogo con A1 en su `cefrRange`), `history` (turnos previos) y
`learner` (el mensaje del aprendiz; si va vacío y no hay historial, el turno es la
apertura de la escena).
