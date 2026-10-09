"use client";

/**
 * Lección de Emma al cerrar la escena. Aquí el búfer silencioso de errores por
 * fin se revela, ya fuera del turno de chat. La lección llega EN INGLÉS y con
 * AUDIO (directriz: Emma siempre habla inglés; la ayuda en español es un botón
 * aparte). El cierre (#211) lo gobierna el plan: lecciones asignadas solas o elegir
 * entre repetir la escena y continuar.
 *
 * Presentacional: la decisión de generar o leer del histórico vive en
 * `use-end-session`; aquí sólo se pinta lo que llega.
 */

import { useRouter } from "next/navigation";
import { Languages, Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Markdown } from "@/components/ui/markdown";
import { levelLabel, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { LessonView } from "./use-end-session";
import { useKaraoke, type Karaoke } from "./use-karaoke";
import { KaraokeTranscript } from "./karaoke-transcript";
import { ClosingPlanPanel } from "./closing-plan-panel";
import { hasSpeakableContent } from "@/domain/tts/speakable-text";
import { splitReportAtLesson } from "@/domain/feedback/report-sections";

/** Voz reservada de Emma (tutora): siempre femenina, en-US-EmmaNeural. */
const EMMA_VOICE = "en-US-EmmaNeural";

interface Props {
  view: LessonView | null;
  open: boolean;
  onClose: () => void;
  scenario: Scenario;
  situation: SituationVariant | null;
  level: CefrLevel;
  /** Catálogo del nivel + navegación de ruta (repetir / siguiente escenario). */
  scenarios: Scenario[];
  onSelectScenario: (s: Scenario) => void;
  /** Abre la ayuda en español sobre un texto (reutiliza el TranslateDialog). */
  onTranslate: (text: string) => void;
}

/** Decisión metodológica de Emma en una línea legible. */
function decisionLineOf(view: LessonView): string {
  const { promoted, passed, newLevel } = view.decision;
  if (promoted) return `✅ Emma’s call: you move up to ${levelLabel(newLevel) || newLevel}. Great work!`;
  if (passed) return "✅ Emma’s call: scenario passed — you can move on in your path.";
  return "🔁 Emma’s call: repeat this scenario to consolidate before moving on.";
}

/**
 * La lección de Emma en karaoke, con el audio en la cabecera de su propia
 * sección (#171): el control vivía arriba del reporte, lejos del texto que se
 * escucha, y la lección se leía como markdown plano —ninguna pista de qué línea
 * estaba sonando—. Sin autoplay: la lección nunca suena sola al abrir.
 */
export function LessonKaraoke({
  karaoke,
  lesson,
  onTranslate,
}: {
  karaoke: Karaoke;
  lesson: string;
  onTranslate: () => void;
}) {
  const speakable = hasSpeakableContent(lesson);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm font-semibold">📚 Lesson from Emma</p>
        {speakable && (
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            title={karaoke.playing ? "Detén la lectura de la lección" : "Escucha la lección en voz alta con las palabras resaltadas"}
            disabled={!karaoke.available || karaoke.loading}
            onClick={() => (karaoke.playing ? karaoke.stop() : karaoke.play())}
          >
            {karaoke.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : karaoke.playing ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {karaoke.playing ? "Stop" : "Listen to Emma"}
          </Button>
        )}
        <Button variant="outline" size="sm" className="gap-1" title="Traduce la lección al español si algo no quedó claro" onClick={onTranslate}>
          <Languages className="h-4 w-4" /> Help in Spanish
        </Button>
      </div>
      <KaraokeTranscript
        sentences={karaoke.sentences}
        active={karaoke.activeSentence}
        activeWord={karaoke.activeWord}
        onPick={(i) => karaoke.playSentence(i)}
        seekable={karaoke.canSeek}
      />
    </div>
  );
}

export function LessonDialog({
  view, open, onClose, scenario, situation, level, scenarios, onSelectScenario, onTranslate,
}: Props) {
  const router = useRouter();
  // Audio de la lección con la voz de Emma (mismo motor que las burbujas).
  const karaoke = useKaraoke(view?.lesson ?? "", "feminine", EMMA_VOICE);
  // La lección sale del markdown del reporte: se renderiza en karaoke, no plana.
  const reportParts = splitReportAtLesson(view?.report ?? "");

  // Siguiente paso de la ruta: nunca el escenario que se acaba de jugar —
  // si la recomendación coincide, rota al siguiente del catálogo del nivel.
  const recommended = view?.next
    ? scenarios.find((s) => s.scenarioType === view.next!.scenarioType) ?? null
    : null;
  const nextScenario = (() => {
    if (recommended && recommended.scenarioType !== scenario.scenarioType) return recommended;
    const idx = scenarios.findIndex((s) => s.scenarioType === scenario.scenarioType);
    return scenarios.length > 1 ? scenarios[(idx + 1) % scenarios.length] : null;
  })();

  const closeAnd = (action?: () => void): void => {
    karaoke.stop();
    onClose();
    action?.();
  };

  if (!view) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAnd()}>
      <DialogContent className="max-h-[85vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>🎓 Your lesson with Emma</DialogTitle>
          <DialogDescription>
            {scenario.title}
            {situation?.title ? ` · ${situation.title}` : ""} · {levelLabel(level)}
            {view.stored ? " · saved in your history" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2">
          {/* Componente 1 — Enseñanza: correcciones + lección de Emma (audio). */}
          <section className="rounded-lg border bg-card p-4">
            <Markdown>{reportParts.before}</Markdown>
            {view.lesson && (
              <LessonKaraoke
                karaoke={karaoke}
                onTranslate={() => onTranslate(view.lesson!)}
                lesson={view.lesson}
              />
            )}
            {reportParts.after && <Markdown>{reportParts.after}</Markdown>}
          </section>
          {/* Componente 2 — Decisión de Emma: avanzar de nivel o repetir. */}
          <section className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Emma’s decision
            </p>
            <p className="mt-1 text-sm font-medium">{decisionLineOf(view)}</p>
            {view.next && !view.decision.promoted && (
              <p className="mt-1 text-xs text-muted-foreground">
                Path suggestion: {view.next.title}.
              </p>
            )}
          </section>
        </div>
        {/* Componente 3 — Cierre: lecciones asignadas solas o elegir practicar/continuar. */}
        <ClosingPlanPanel
          plan={view.plan}
          onStartLessons={() => closeAnd(() => router.push("/practice/"))}
          onPracticeAgain={() => closeAnd(() => onSelectScenario(scenario))}
          onContinue={() =>
            closeAnd(() => (nextScenario ? onSelectScenario(nextScenario) : router.push("/")))
          }
        />
      </DialogContent>
    </Dialog>
  );
}
