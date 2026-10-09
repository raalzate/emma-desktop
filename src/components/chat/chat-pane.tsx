"use client";

/**
 * Panel de conversación: cabecera + lista de mensajes + composer + cierre, sobre
 * UNA sesión de simulación. Se remonta (key) al cambiar de chat. Teach me se abre
 * en una columna al lado del chat; Translate, en un dialog sobre el turno elegido.
 *
 * El acceso a la lección vive al FINAL de la conversación, donde la escena
 * termina — no en la cabecera: un botón permanente arriba invitaba a cortar la
 * escena y competía con el hilo. Mientras la escena está viva sólo queda una
 * salida discreta para terminar antes.
 */

import { useCallback, useState } from "react";
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
import { SceneDialog } from "./scene-dialog";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { LessonDialog } from "./lesson-dialog";
import { SceneIntro } from "./scene-intro";
import { TeachPanel } from "./teach-panel";
import { TranslateDialog } from "./translate-dialog";

interface Props {
  /** Id de la conversación: ata las lecciones asignadas al cierre (#211). */
  conversationId: string;
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
  conversationId, runtime, profile, settings, scenario, scenarios, onSelectScenario, restore, onSnapshot,
}: Props) {
  const s = useChatSession({ runtime, profile, settings, scenario, restore, onSnapshot });
  const { toast } = useToast();
  const [teachText, setTeachText] = useState<string | null>(null);
  const [translateText, setTranslateText] = useState<string | null>(null);
  // Estable: el panel re-suscribe Esc cuando cambia onClose.
  const closeTeach = useCallback(() => setTeachText(null), []);
  // Volver a ver la escena no toca la conversación: sólo abre el diálogo (#167).
  const [sceneOpen, setSceneOpen] = useState(false);

  const end = useEndSession({
    conversationId,
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
      toast({ title: "Session reviewed", description: lesson.verdict });
    },
    autoFinish: s.sceneComplete && !s.restoredComplete,
  });

  // Etiqueta del cierre: revisar lo guardado no cuesta una generación nueva.
  const reviewLabel = end.hasStoredLesson ? "See your lesson" : "Finish and see your lesson";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background">
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
              onShowScene={s.phase === "live" ? () => setSceneOpen(true) : undefined}
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
              narrative={s.narrative}
              onTeach={setTeachText}
              onTranslate={setTranslateText}
            />

            {s.sceneComplete ? (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t bg-muted/40 px-4 py-3 text-sm text-muted-foreground duration-500 animate-in fade-in slide-in-from-bottom-2">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {end.hasStoredLesson
                    ? "This session is over — its lesson is saved in your history."
                    : end.running
                      ? "Scene complete — Emma is preparing your lesson…"
                      : "Scene complete — review your lesson whenever you like."}
                </span>
                <Button size="sm" className="gap-1" title="Abre la lección que Emma preparó con tus errores y aciertos" onClick={end.review} disabled={end.running}>
                  {end.running ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GraduationCap className="h-4 w-4" />
                  )}
                  {end.running ? "Reviewing…" : reviewLabel}
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
                voiceRequirement={s.voiceRequirement}
                onVoiceUnavailable={s.declareVoiceUnavailable}
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
        <SceneDialog
          open={sceneOpen}
          onClose={() => setSceneOpen(false)}
          scenario={scenario}
          situation={s.situation}
          sceneReady={s.sceneReady}
          narrative={s.narrative}
        />
        <TranslateDialog text={translateText} onClose={() => setTranslateText(null)} />
      </main>
      <TeachPanel text={teachText} onClose={closeTeach} />
    </div>
  );
}
