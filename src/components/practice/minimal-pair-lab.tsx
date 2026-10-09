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
 *
 * H8: "Say it" ya no pide la palabra suelta, pide una ORACIÓN corta que la
 * contiene (`sentenceForPair`, ajustada al nivel CEFR del aprendiz) — el
 * veredicto sigue siendo sobre la palabra objetivo, más el % de inteligibilidad
 * de la frase completa.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerFeedback, ItemTransition } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpeakButton } from "@/components/chat/speak-button";
import { useVoiceInput } from "@/components/chat/use-voice-input";
import { LiveWaveform } from "@/components/chat/live-waveform";
import { useEmma } from "@/interface/emma-context";
import { isCefrLevel, INITIAL_LEVEL, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import {
  buildPerceptionRound,
  checkPerception,
  scoreRound,
  type PerceptionItem,
} from "@/domain/phonetics/minimal-pair-drill";
import {
  checkPronunciation,
  checkTargetWordInSentence,
  heardNothing,
  isIntelligible,
  splitSentences,
  type PronunciationCheckResult,
  type TargetWordVerdict,
} from "@/domain/phonetics/pronunciation-check";
import { sentenceForPair } from "@/domain/phonetics/minimal-pair-sentences";
import type { MinimalPair } from "@/domain/phonetics/phonetics";
import { SOUND_CONTRASTS, SHADOWING_PROTOCOL, PART1_CHALLENGES } from "@/lib/phonetics-data";

type AttemptState = "idle" | "recording" | "transcribing" | "error";

/**
 * Graba con el mecanismo de voz existente del chat (Whisper local) y evalúa
 * la transcripción con `checker`. Por defecto compara `target` palabra a
 * palabra con `checkPronunciation`; "Say it" por oración (H8) pasa un checker
 * que juzga solo la palabra objetivo dentro de la frase. Si el ASR no
 * devuelve texto (transcripción vacía o el pipeline falla), se evalúa igual
 * contra "" — es justamente el criterio del libro (si la máquina no te
 * entiende, un humano tampoco).
 */
function useSpokenAttempt<R = PronunciationCheckResult>(
  target: string,
  checker: (transcript: string) => R = (t) => checkPronunciation(target, t) as R,
) {
  const [state, setState] = useState<AttemptState>("idle");
  const [result, setResult] = useState<R | null>(null);
  // Marca que esperamos un resultado de onResult; si el ASR falla o queda en
  // silencio, el hook nunca lo llama y lo detectamos por este flag.
  const expectingRef = useRef(false);

  const voice = useVoiceInput((text) => {
    expectingRef.current = false;
    setResult(checker(text));
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
      setResult(checker(""));
    }
    setState((prev) => (prev === "error" ? prev : "idle"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return { state, result, toggle, stream: voice.stream };
}

function AttemptIcon({ state }: { state: AttemptState }) {
  if (state === "transcribing") return <Loader2 className="h-4 w-4 animate-spin" />;
  if (state === "recording") return <Square className="h-4 w-4" />;
  return <Mic className="h-4 w-4" />;
}

/**
 * Botón "🎙️ Say it" del round de percepción (H8): pide leer la ORACIÓN
 * completa (no la palabra suelta) y el veredicto juzga si la máquina
 * reconoció la palabra objetivo dentro de esa oración, más el % general de
 * inteligibilidad de la frase.
 */
function PerceptionSayIt({ sentence, targetWord }: { sentence: string; targetWord: string }) {
  const checker = useMemo(
    () => (transcript: string) => checkTargetWordInSentence(sentence, targetWord, transcript),
    [sentence, targetWord],
  );
  const { state, result, toggle, stream } = useSpokenAttempt<TargetWordVerdict>(sentence, checker);
  const heardSentence = result?.overall.verdicts.map((v) => v.heard ?? "…").join(" ") || "(nothing)";

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant={state === "recording" ? "destructive" : "outline"}
        title={state === "recording" ? "Detiene la grabación y comprueba tu pronunciación" : "Graba la oración para comprobar si la máquina reconoce la palabra objetivo"}
        onClick={toggle}
        disabled={state === "transcribing"}
      >
        <AttemptIcon state={state} />
        <span className="ml-1">🎙️ Say it</span>
      </Button>
      {state === "recording" && <LiveWaveform stream={stream} bars={16} />}
      {state === "error" && (
        <p className="text-xs text-red-600">Couldn't record: check the microphone permission.</p>
      )}
      {result && (
        <>
          <p className={`text-xs ${result.targetOk ? "text-green-600" : "text-red-600"}`}>
            {result.targetOk
              ? `✅ The machine heard "${targetWord}" clearly`
              : `❌ That didn't sound like "${targetWord}" — I heard: "${result.targetHeard ?? "…"}"`}
          </p>
          <p className="text-xs text-muted-foreground">
            Heard sentence: "{heardSentence}" — {Math.round(result.overall.score * 100)}%
            {isIntelligible(result.overall.score) ? " understood clearly" : " still hard to understand"}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Una oración del reto: escuchar, grabar y ver el veredicto palabra a palabra.
 * De a una oración —un párrafo entero de un tirón no se puede dictar— y con un
 * mensaje claro cuando el dictado no oyó nada, en vez de un «0 %» mudo.
 */
function SentenceCheck({ index, sentence }: { index: number; sentence: string }) {
  const { state, result, toggle } = useSpokenAttempt(sentence);
  const nothing = result ? heardNothing(result) : false;

  return (
    <li className="space-y-2 rounded-md border p-3">
      <p className="text-sm">
        <span className="mr-2 font-code text-[11px] text-muted-foreground">{index + 1}</span>
        {sentence}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <SpeakButton text={sentence} />
        <Button
          size="sm"
          variant={state === "recording" ? "destructive" : "outline"}
          title={state === "recording" ? "Detiene la grabación y compara tu lectura con la oración" : "Graba esta oración para comprobar si el dictado te entiende"}
          onClick={toggle}
          disabled={state === "transcribing"}
        >
          <AttemptIcon state={state} />
          <span className="ml-1">{state === "recording" ? "Stop and check" : "Record this sentence"}</span>
        </Button>
        {result && !nothing && (
          <span className="text-sm">
            <span className="font-semibold">{Math.round(result.score * 100)}%</span>{" "}
            {isIntelligible(result.score) ? "— understood well" : "— still hard to understand"}
          </span>
        )}
      </div>
      {state === "error" && (
        <p className="text-xs text-red-600">Couldn't record: check the microphone permission.</p>
      )}
      {result && nothing && (
        <p className="text-xs text-amber-700">
          Nothing was recognized. Speak closer to the microphone, a bit louder, and try again.
        </p>
      )}
      {result && !nothing && !isIntelligible(result.score) && (
        <p className="flex flex-wrap gap-1 text-sm">
          {result.verdicts.map((v, i) => (
            <span
              key={`${v.expected}-${i}`}
              className={v.ok ? "text-foreground" : "rounded bg-red-100 px-1 text-red-700"}
              title={v.ok ? "El dictado entendió esta palabra" : v.heard ? "El dictado oyó «" + v.heard + "»: repite esta palabra despacio" : "El dictado no oyó esta palabra: repítela marcando cada sílaba"}
            >
              {v.expected}
            </span>
          ))}
        </p>
      )}
    </li>
  );
}

/** Reto A: shadowing del texto del libro, oración por oración. */
function ShadowingChallenge({ instructionsEs }: { instructionsEs: string }) {
  const text = extractQuotedText(instructionsEs);
  const sentences = useMemo(() => splitSentences(text), [text]);
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Challenge A · Shadow the text, one sentence at a time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <li>1. Listen to each sentence twice.</li>
          <li>2. Read it aloud together with the audio.</li>
          <li>3. Record it and see which words the dictation missed.</li>
          <li>4. Repeat the red words slowly, then record again.</li>
        </ol>
        <div className="flex items-center gap-2">
          <SpeakButton text={text} />
          <span className="text-sm">Listen to the whole text</span>
        </div>
        <ol className="space-y-2">
          {sentences.map((sentence, i) => (
            <SentenceCheck key={sentence} index={i} sentence={sentence} />
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          Golden rule: if dictation can't understand you, neither can a human. The goal is not to
          sound native, it is to be intelligible.
        </p>
        <div>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 px-2 text-xs"
            title="Notas de preparación en español: marcar vocales, sílabas fuertes y puntos de linking antes de grabar"
            onClick={() => setNotesOpen((o) => !o)}
          >
            <ChevronDown className={notesOpen ? "h-3.5 w-3.5 rotate-180 transition-transform" : "h-3.5 w-3.5 transition-transform"} />
            Preparation notes (Spanish)
          </Button>
          {notesOpen && <p className="mt-1 text-sm text-muted-foreground">{instructionsEs}</p>}
        </div>
      </CardContent>
    </Card>
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

/** Resalta `word` dentro de `sentence` (coincidencia de palabra completa, sin distinguir mayúsculas). */
function HighlightWord({ sentence, word }: { sentence: string; word: string }) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = sentence.split(new RegExp(`(\\b${escaped}\\b)`, "i"));
  return (
    <p className="text-sm">
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <strong key={i} className="text-primary">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

/** Encuentra el `MinimalPair` de origen de un `PerceptionItem` y de qué lado (a/b) vino el prompt. */
function pairForItem(
  contrastPairs: MinimalPair[],
  item: PerceptionItem,
): { pair: MinimalPair; side: "a" | "b" } {
  const pair = contrastPairs.find((p) => p.a === item.options[0] && p.b === item.options[1]);
  if (!pair) throw new Error(`source pair not found for "${item.prompt}"`);
  return { pair, side: item.prompt === pair.a ? "a" : "b" };
}

function PerceptionRound({ contrastId, level }: { contrastId: string; level: CefrLevel }) {
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
            Correct: <span className="font-semibold">{score.correct}</span> of {score.total}
          </p>
          {score.weakPairs.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Words to reinforce: {score.weakPairs.join(", ")}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const item: PerceptionItem = items[index];
  // H8: la palabra suena dentro de una oración corta ajustada al nivel del
  // aprendiz, no suelta — el par mínimo sigue siendo la palabra objetivo.
  const { pair, side } = pairForItem(contrast.pairs, item);
  const sentence = sentenceForPair(pair, side, level);

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
    <ItemTransition itemKey={index}>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Item {index + 1} of {items.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">1 · Listen to the sentence</p>
          {/* key por ítem: cada oración tiene su propio audio, nunca el de la anterior. */}
          <SpeakButton key={`speak-${index}-${item.prompt}`} text={sentence} label="Listen to the sentence" />
          <HighlightWord sentence={sentence} word={item.prompt} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">2 · Which of the two did you hear?</p>
          <div className="flex gap-2">
            {item.options.map((option, i) => (
              <Button
                key={option}
                variant={feedback !== null && i === item.answerIndex ? "default" : "outline"}
                title="Marca la palabra que creés haber oído"
                disabled={feedback !== null}
                onClick={() => choose(i)}
                className="min-w-24 text-base"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
        {feedback !== null && (
          <AnswerFeedback state={feedback ? "success" : "error"} className="space-y-3">
            <p className={feedback ? "font-medium text-scaffold-easy" : "font-medium text-scaffold-hard"}>
              {feedback ? "Correct: it was " : "No: the word you heard was "}
              <span className="font-code">&quot;{item.prompt}&quot;</span>
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">3 · Now say the sentence and check whether the machine understands "{item.prompt}"</p>
              <PerceptionSayIt key={`say-${index}-${item.prompt}`} sentence={sentence} targetWord={item.prompt} />
            </div>
            <Button size="sm" title="Pasa al siguiente par mínimo" onClick={next}>
              Next
            </Button>
          </AnswerFeedback>
        )}
      </CardContent>
    </Card>
    </ItemTransition>
  );
}

// El reto es lo que se practica; el protocolo de seis pasos es la ayuda de
// cómo hacerlo, así que queda plegado hasta que el aprendiz lo pide.
function ShadowingSection() {
  return (
    <div className="space-y-4">
      {CHALLENGE_A && <ShadowingChallenge instructionsEs={CHALLENGE_A.instructionsEs} />}
      <details className="rounded-bubble border border-border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-medium" title="Los seis pasos del método de shadowing, con su tiempo">
          How shadowing works
        </summary>
        <ol className="mt-3 space-y-2">
          {SHADOWING_PROTOCOL.map((phase) => (
            <li key={phase.order}>
              <p className="font-medium">
                {phase.order}. {phase.nameEs} ({phase.minutes} min)
              </p>
              <p className="text-muted-foreground">{phase.actionEs}</p>
            </li>
          ))}
        </ol>
      </details>
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
  // Nivel CEFR del aprendiz: sale del perfil, salvo que ?level lo sobrescriba
  // (deep-link de una recomendación de Emma a un nivel puntual).
  const { profile } = useEmma();
  const params = useSearchParams();
  const levelParam = params.get("level");
  const level: CefrLevel =
    (levelParam && isCefrLevel(levelParam) && levelParam) || profile?.englishLevel || INITIAL_LEVEL;

  return (
    <Tabs defaultValue="pairs">
      <TabsList>
        <TabsTrigger value="pairs" title="Escuchá y distinguí dos sonidos parecidos, en oraciones">
          Minimal pairs
        </TabsTrigger>
        <TabsTrigger value="shadowing" title="Repetí un texto a la par del audio, oración por oración">
          Shadowing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pairs" className="space-y-3">
        <Select value={contrastId} onValueChange={setContrastId}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="Pick a contrast" />
          </SelectTrigger>
          <SelectContent>
            {CONTRASTS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.titleEs}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {contrastId && <PerceptionRound key={contrastId} contrastId={contrastId} level={level} />}
      </TabsContent>
      <TabsContent value="shadowing">
        <ShadowingSection />
      </TabsContent>
    </Tabs>
  );
}
