# spec · audio-tts — Audio y síntesis de voz (pronunciación)

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 3 — Práctica guiada
- **Módulos:** `src/domain/audio/audio-session.ts`, `src/domain/audio/audio-config.ts`,
  `src/domain/audio/i-transcribe.ts`, `src/domain/tts/speakable-text.ts`,
  `src/application/audio/transcribe-audio-use-case.ts`,
  `src/infrastructure/audio/whisper-transcribe.ts`, `src/infrastructure/tts/edge-tts.ts`,
  `src/infrastructure/tts/web-speech-tts.ts`

## Contexto
EMMA captura la voz del aprendiz en el renderer (micrófono → PCM), detecta cuándo dejó de
hablar para auto-enviar el turno, y transcribe con Whisper local vía el puerto `Transcribe`.
Para la voz de EMMA usa Edge-TTS (voz principal, con timings de palabra para el karaoke) con
respaldo en Web Speech API del sistema operativo si no hay bridge de Electron o falla la red.
Todo el pipeline de audio del dominio es puro (energía RMS, timers, umbrales); las Web APIs
concretas (getUserMedia, AudioContext, speechSynthesis) viven fuera del dominio.

## Historias de usuario
### US-1 — Auto-enviar mi turno de voz sin tener que pulsar "detener"
Como aprendiz, quiero que EMMA detecte cuándo dejo de hablar y envíe mi grabación sola, para
mantener la conversación fluida como una llamada real.
- **Given** una sesión de audio que ya detectó voz (`isSpeaking = true`) **When** transcurren
  1500 ms de silencio acumulado **Then** `shouldAutoSubmit` devuelve `true`.
- **Given** una sesión de audio en curso **When** la duración total alcanza 60000 ms
  **Then** `shouldAutoSubmit` devuelve `true` aunque el aprendiz siga hablando (corte duro).
- **Given** un chunk de audio con energía por encima de -40 dBFS **When** se llama
  `updateSilence` **Then** la sesión marca `isSpeaking = true` y resetea `silentDurationMs` a 0.

### US-2 — Transcribir mi grabación de forma tolerante a fallos
Como aprendiz, quiero que un audio demasiado corto o un fallo del motor ASR no rompan la
conversación, para no perder el turno por un problema técnico.
- **Given** una grabación cuya duración es menor que `minDurationMs` **When** se llama
  `transcribeAudio` **Then** devuelve `TranscriptionResult.empty()` sin invocar el puerto
  `Transcribe`.
- **Given** que el puerto `Transcribe` lanza una excepción **When** se llama
  `transcribeAudio` **Then** el resultado es un `TranscriptionResult` vacío en vez de
  propagar el error.
- **Given** una transcripción que devuelve solo espacios en blanco **When** se construye con
  `TranscriptionResult.fromText` **Then** `success` es `false`.

### US-3 — Escuchar a EMMA con una voz natural y texto limpio
Como aprendiz, quiero que el texto de las burbujas de EMMA se lea de forma natural (sin leer
emojis o símbolos markdown en voz alta), y que si el motor de voz preferido no está disponible
haya un respaldo, para no perder la práctica auditiva.
- **Given** un mensaje con emojis y comillas ("Great job! 😊 'nice'") **When** se prepara con
  `toSpeakable` para TTS **Then** el resultado no contiene emojis ni comillas, conservando
  puntuación y contracciones.
- **Given** un texto que tras limpiar queda vacío (solo emojis/símbolos) **When** se evalúa
  `hasSpeakableContent` **Then** devuelve `false` y el caller puede omitir la locución.
- **Given** que no existe `window.emmaAPI.ttsSynthesize` (fuera de Electron) **When** se
  consulta `edgeTtsAvailable()` **Then** devuelve `false`, señal para que el caller use
  Web Speech (`speak()`) como respaldo.

## Requisitos funcionales
- **FR-001** `rmsDbfs` debe devolver `-100.0` dBFS (piso de silencio) cuando el arreglo de
  muestras está vacío o su RMS es menor que 1.0, para evitar `log10(0)`.
- **FR-002** `AudioSession.shouldAutoSubmit(elapsedMs)` debe devolver `true` si (a) la sesión
  está hablando y `silentDurationMs >= SILENCE_TIMEOUT_MS` (1500 ms), o (b) `elapsedMs >=
  MAX_DURATION_MS` (60000 ms); en cualquier otro caso, `false`.
- **FR-003** `AudioSession.isTooShort(minDurationMs)` debe comparar `totalDurationMs` (delta
  entre el primer y el último chunk) contra el mínimo dado.
- **FR-004** `transcribeAudio` debe aplicar la guarda de duración ANTES de invocar el puerto
  `Transcribe`: si `durationMs < minDurationMs`, devuelve resultado vacío sin llamar al ASR.
- **FR-005** `transcribeAudio` debe capturar cualquier excepción del puerto `Transcribe` y
  degradar a `TranscriptionResult.empty()`.
- **FR-006** `toSpeakable` debe eliminar emojis, comillas (rectas y tipográficas), paréntesis/
  corchetes/llaves (conservando su contenido), guiones decorativos sueltos y símbolos
  markdown (`*`, `#`, `~`, `•`), preservando el apóstrofe interno de contracciones
  (`don't`, `it's`) y la puntuación natural.
- **FR-007** `hasSpeakableContent` debe devolver `true` solo si, tras aplicar `toSpeakable`,
  queda al menos una letra o dígito Unicode.
- **FR-008** `synthesizeEdge` debe resolver la voz por género (`en-US-EmmaNeural` por defecto,
  `en-US-GuyNeural` si `masculine`) cuando no se pasa `voiceId` explícito, y `speak()` (Web
  Speech) debe invocar `onEnd` inmediatamente y devolver un handle no-operativo cuando
  `ttsAvailable()` es `false`.

## Criterios de éxito
- **SC-001** Ninguna grabación por debajo del umbral mínimo (500 ms) llega al motor ASR
  (ahorro de cómputo, verificado por `transcribeAudio`).
- **SC-002** Un fallo del ASR o la ausencia del bridge de TTS de escritorio nunca detiene la
  conversación: siempre existe una ruta de resultado vacío o de voz de respaldo.
- **SC-003** El texto locutado por TTS no contiene emojis, comillas ni símbolos decorativos en
  el 100% de los casos cubiertos por `speakable-text.test.ts`.
- **SC-004** El auto-envío del turno de voz ocurre siempre dentro de la ventana de silencio
  configurada (1500 ms) o en el corte duro de 60 s, sin excepción.
