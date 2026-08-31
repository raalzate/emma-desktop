"use client";

/**
 * Laboratorio de pronunciación: percepción de pares mínimos (dominio puro:
 * buildPerceptionRound/checkPerception/scoreRound) + subsección de Shadowing
 * (protocolo de 6 fases + Reto A). El TTS reutiliza <SpeakButton/> (Edge-TTS
 * con caída a Web Speech), el mismo mecanismo del chat: no hace falta una
 * sesión de conversación para escuchar una palabra o un texto suelto.
 *
 * Bucle de producción (§0.5 y Reto B, Parte 1 del libro): el dictado por
 * reconocimiento de voz es "el detector de errores de pronunciación más
 * barato y honesto que existe". Reutiliza el mismo mecanismo de voz del chat
 * (`useVoiceInput`, Whisper local vía transformers.js) para grabar al
 * aprendiz y comparar lo transcrito contra el objetivo con
 * `checkPronunciation` (dominio puro de `@/domain/phonetics/pronunciation-check`).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpeakButton } from "@/components/chat/speak-button";
import { useVoiceInput } from "@/components/chat/use-voice-input";
import {
  buildPerceptionRound,
  checkPerception,
  scoreRound,
  type PerceptionItem,
} from "@/domain/phonetics/minimal-pair-drill";
import {
  checkPronunciation,
  isIntelligible,
  type PronunciationCheckResult,
} from "@/domain/phonetics/pronunciation-check";
import { SOUND_CONTRASTS, SHADOWING_PROTOCOL, PART1_CHALLENGES } from "@/lib/phonetics-data";

type AttemptState = "idle" | "recording" | "transcribing" | "error";

/**
 * Graba con el mecanismo de voz existente del chat (Whisper local) y compara
 * lo transcrito contra `target` con `checkPronunciation`. Si el ASR no
 * devuelve texto (transcripción vacía o el pipeline falla), se trata igual:
 * "no te entendí" — es justamente el criterio del libro (si la máquina no te
 * entiende, un humano tampoco).
 */
function useSpokenAttempt(target: string) {
  const [state, setState] = useState<AttemptState>("idle");
  const [result, setResult] = useState<PronunciationCheckResult | null>(null);
  // Marca que esperamos un resultado de onResult; si el ASR falla o queda en
  // silencio, el hook nunca lo llama y lo detectamos por este flag.
  const expectingRef = useRef(false);

  const voice = useVoiceInput((text) => {
    expectingRef.current = false;
    setResult(checkPronunciation(target, text));
  });

  useEffect(() => {
    if (voice.recording) {
      setState("recording");
      return;
    }
    if (voice.busy) {
      setState("transcribing");
      return;
    }
    if (expectingRef.current) {
      expectingRef.current = false;
      setResult(checkPronunciation(target, ""));
    }
    setState((prev) => (prev === "error" ? prev : "idle"));
  }, [voice.recording, voice.busy, target]);

  async function toggle() {
    setResult(null);
    if (!voice.recording) expectingRef.current = true;
    try {
      await voice.toggle();
    } catch {
      // getUserMedia rechazado (sin permiso de micrófono) u otro fallo al grabar.
      expectingRef.current = false;
      setState("error");
    }
  }

  return { state, result, toggle };
}

function AttemptIcon({ state }: { state: AttemptState }) {
  if (state === "transcribing") return <Loader2 className="h-4 w-4 animate-spin" />;
  if (state === "recording") return <Square className="h-4 w-4" />;
  return <Mic className="h-4 w-4" />;
}

/** Botón "🎙️ Pronunciar" para un ítem de percepción: graba, transcribe y
 * marca en verde/rojo si la máquina reconoció la palabra objetivo. */
function PronounceCheck({ target }: { target: string }) {
  const { state, result, toggle } = useSpokenAttempt(target);
  const heard = result?.verdicts.map((v) => v.heard ?? "…").join(" ") || "(nada)";

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant={state === "recording" ? "destructive" : "outline"}
        onClick={toggle}
        disabled={state === "transcribing"}
      >
        <AttemptIcon state={state} />
        <span className="ml-1">🎙️ Pronunciar</span>
      </Button>
      {state === "error" && (
        <p className="text-xs text-red-600">No se pudo grabar: revisa el permiso del micrófono.</p>
      )}
      {result && (
        <p className={`text-xs ${result.score === 1 ? "text-green-600" : "text-red-600"}`}>
          {result.score === 1
            ? `✅ La máquina te entendió: "${target}"`
            : `❌ No sonó como "${target}" — oí: "${heard}"`}
        </p>
      )}
    </div>
  );
}

/** Reto A completo: graba el texto largo y muestra el veredicto palabra a
 * palabra, resaltando lo que el dictado no entendió. */
function ShadowingPronunciationCheck({ target }: { target: string }) {
  const { state, result, toggle } = useSpokenAttempt(target);

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant={state === "recording" ? "destructive" : "outline"}
        onClick={toggle}
        disabled={state === "transcribing"}
      >
        <AttemptIcon state={state} />
        <span className="ml-1">🎙️ Pronunciar el texto completo</span>
      </Button>
      {state === "error" && (
        <p className="text-xs text-red-600">No se pudo grabar: revisa el permiso del micrófono.</p>
      )}
      {result && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm">
            Puntaje de inteligibilidad:{" "}
            <span className="font-semibold">{Math.round(result.score * 100)}%</span>{" "}
            {isIntelligible(result.score) ? "— se entendió bien" : "— todavía cuesta entenderte"}
          </p>
          <p className="flex flex-wrap gap-1 text-sm">
            {result.verdicts.map((v, i) => (
              <span
                key={`${v.expected}-${i}`}
                className={v.ok ? "text-foreground" : "rounded bg-red-100 px-1 text-red-700"}
              >
                {v.expected}
              </span>
            ))}
          </p>
          <p className="text-xs text-muted-foreground">
            Criterio del libro: si el dictado no te entiende, un humano tampoco. El objetivo no es sonar
            nativo, es ser inteligible.
          </p>
        </div>
      )}
    </div>
  );
}

const ROUND_SIZE = 10;
const CONTRASTS = SOUND_CONTRASTS.filter((c) => c.id !== "vowel-atlas");
const CHALLENGE_A = PART1_CHALLENGES.find((c) => c.id === "A");

/** El Reto A trae el texto en inglés entre comillas guillemet («…»). */
function extractQuotedText(instructionsEs: string): string {
  const match = instructionsEs.match(/«([^»]+)»/);
  return match ? match[1] : instructionsEs;
}

function PerceptionRound({ contrastId }: { contrastId: string }) {
  const contrast = CONTRASTS.find((c) => c.id === contrastId)!;
  // Seed aleatoria por montaje: cada vez que se entra al laboratorio la ronda es distinta.
  const seed = useMemo(() => Math.floor(Math.random() * 1_000_000), [contrastId]);
  const items = useMemo(
    () => buildPerceptionRound(contrast, ROUND_SIZE, seed),
    [contrast, seed],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  if (index >= items.length) {
    const score = scoreRound(items, answers);
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm">
            Aciertos: <span className="font-semibold">{score.correct}</span> de {score.total}
          </p>
          {score.weakPairs.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Palabras a reforzar: {score.weakPairs.join(", ")}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const item: PerceptionItem = items[index];

  /** Registra la respuesta elegida y muestra el acierto/fallo. */
  function choose(optionIndex: number) {
    if (feedback !== null) return;
    setFeedback(checkPerception(item, optionIndex));
    setAnswers((prev) => [...prev, optionIndex]);
  }

  function next() {
    setFeedback(null);
    setIndex((i) => i + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Ítem {index + 1} de {items.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <SpeakButton text={item.prompt} />
          <span className="text-sm text-muted-foreground">Escucha y elige qué palabra sonó</span>
        </div>
        <PronounceCheck key={item.prompt} target={item.prompt} />
        <div className="flex gap-2">
          {item.options.map((option, i) => (
            <Button
              key={option}
              variant={feedback !== null && i === item.answerIndex ? "default" : "outline"}
              disabled={feedback !== null}
              onClick={() => choose(i)}
            >
              {option}
            </Button>
          ))}
        </div>
        {feedback !== null && (
          <div className="space-y-2">
            <p className={feedback ? "text-green-600" : "text-red-600"}>
              {feedback ? "✅ Correcto" : "❌ Incorrecto"}
            </p>
            <Button size="sm" onClick={next}>
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShadowingSection() {
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {SHADOWING_PROTOCOL.map((phase) => (
          <li key={phase.order} className="rounded-md border p-3 text-sm">
            <p className="font-medium">
              {phase.order}. {phase.nameEs} ({phase.minutes} min)
            </p>
            <p className="text-muted-foreground">{phase.actionEs}</p>
          </li>
        ))}
      </ol>
      {CHALLENGE_A && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reto A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{CHALLENGE_A.instructionsEs}</p>
            <div className="flex items-center gap-2">
              <SpeakButton text={extractQuotedText(CHALLENGE_A.instructionsEs)} />
              <span className="text-sm">Escuchar el texto del reto</span>
            </div>
            <ShadowingPronunciationCheck target={extractQuotedText(CHALLENGE_A.instructionsEs)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface Props {
  /** Preselección desde una recomendación de Emma (deep-link ?contrast=). */
  initialContrastId?: string;
}

export function MinimalPairLab({ initialContrastId }: Props = {}) {
  const [contrastId, setContrastId] = useState<string>(
    (initialContrastId && CONTRASTS.some((c) => c.id === initialContrastId) && initialContrastId) ||
      CONTRASTS[0]?.id ||
      "",
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Select value={contrastId} onValueChange={setContrastId}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="Elige un contraste" />
          </SelectTrigger>
          <SelectContent>
            {CONTRASTS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.titleEs}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {contrastId && <PerceptionRound key={contrastId} contrastId={contrastId} />}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Shadowing</h3>
        <ShadowingSection />
      </div>
    </div>
  );
}
