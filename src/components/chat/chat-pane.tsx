"use client";

/**
 * Panel de conversación: cabecera + lista de mensajes + composer + cierre, sobre
 * UNA sesión de simulación. Se remonta (key) al cambiar de chat. Los dialogs de
 * Teach/Translate se abren sobre el turno elegido.
 *
 * El acceso a la lección vive al FINAL de la conversación, donde la escena
 * termina — no en la cabecera: un botón permanente arriba invitaba a cortar la
 * escena y competía con el hilo. Mientras la escena está viva sólo queda una
 * salida discreta para terminar antes.
 */

import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { UserProfile } from "@/domain/profile/user-profile";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import type { Scenario } from "@/domain/scenarios/scenario";
import { personaFor } from "@/domain/personas/protopersona";
import type { ChatConversation } from "@/domain/chat/chat-conversation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useChatSession, type SessionSnapshot } from "./use-chat-session";
import { useEndSession } from "./use-end-session";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { LessonDialog } from "./lesson-dialog";
import { SceneIntro } from "./scene-intro";
import { TeachDialog } from "./teach-dialog";
import { TranslateDialog } from "./translate-dialog";

interface Props {
  runtime: EmmaRuntime;
  profile: UserProfile;
  settings: ChatSettings;
  scenario: Scenario;
  scenarios: Scenario[];
  onSelectScenario: (s: Scenario) => void;
  restore: ChatConversation | null;
  onSnapshot: (s: SessionSnapshot) => void;
}

export function ChatPane({
  runtime, profile, settings, scenario, scenarios, onSelectScenario, restore, onSnapshot,
}: Props) {
  const s = useChatSession({ runtime, profile, settings, scenario, restore, onSnapshot });
  const { toast } = useToast();
  const [teachText, setTeachText] = useState<string | null>(null);
  const [translateText, setTranslateText] = useState<string | null>(null);

  const end = useEndSession({
    runtime,
    scenario,
    situation: s.situation,
    level: s.level,
    turns: s.turnCount,
    errors: s.errors,
    messages: s.messages,
    storedLesson: s.lesson,
    onLessonReady: (lesson) => {
      s.saveLesson(lesson);
      toast({ title: "Sesión evaluada", description: lesson.verdict });
    },
    autoFinish: s.sceneComplete && !s.restoredComplete,
  });

  // Etiqueta del cierre: revisar lo guardado no cuesta una generación nueva.
  const reviewLabel = end.hasStoredLesson ? "Ver tu lección" : "Finalizar y ver lección";

  return (
    <main className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="flex items-center gap-2 pr-4">
        <div className="flex-1">
          <ChatHeader
            scenarios={scenarios}
            scenario={scenario}
            onSelect={onSelectScenario}
            level={s.level}
            situationTitle={s.situation?.title}
            turnCount={s.turnCount}
            maxTurns={s.maxTurns}
            sceneGoals={s.sceneGoals}
            onFinishEarly={s.phase === "live" && !s.sceneComplete ? end.review : undefined}
            finishEarlyDisabled={s.busy || s.turnCount === 0 || end.running}
          />
        </div>
      </div>

      {s.phase === "intro" ? (
        <SceneIntro
          scenario={scenario}
          situation={s.situation}
          level={s.level}
          maxTurns={s.maxTurns}
          starting={s.busy}
          narrative={s.narrative}
          sceneReady={s.sceneReady}
          onStart={() => void s.begin()}
        />
      ) : (
        <>
          <MessageList
            messages={s.messages}
            typing={s.busy}
            persona={personaFor(scenario.scenarioType, scenario.emmaRole)}
            scenario={scenario}
            situation={s.situation}
            narrate={!restore?.messages?.length}
            onTeach={setTeachText}
            onTranslate={setTranslateText}
          />

          {s.sceneComplete ? (
            <div className="flex flex-wrap items-center justify-center gap-3 border-t bg-muted/40 px-4 py-3 text-sm text-muted-foreground duration-500 animate-in fade-in slide-in-from-bottom-2">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {end.hasStoredLesson
                  ? "Esta sesión ya terminó — su lección quedó guardada en tu histórico."
                  : end.running
                    ? "Escena completada — Emma está preparando tu lección…"
                    : "Escena completada — revisa tu lección cuando quieras."}
              </span>
              <Button size="sm" className="gap-1" onClick={end.review} disabled={end.running}>
                {end.running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}
                {end.running ? "Evaluando…" : reviewLabel}
              </Button>
            </div>
          ) : (
            <Composer
              onSend={s.send}
              busy={s.busy}
              context={s.lastEmma}
              sceneContext={s.suggestionContext}
              level={s.level}
              scenarioType={scenario.scenarioType}
            />
          )}
        </>
      )}

      <LessonDialog
        view={end.view}
        open={end.open}
        onClose={end.close}
        scenario={scenario}
        situation={s.situation}
        level={s.level}
        scenarios={scenarios}
        onSelectScenario={onSelectScenario}
        onTranslate={setTranslateText}
      />
      <TeachDialog text={teachText} onClose={() => setTeachText(null)} />
      <TranslateDialog text={translateText} onClose={() => setTranslateText(null)} />
    </main>
  );
}
