"use client";

/**
 * Panel de conversación: cabecera + lista de mensajes + composer + cierre, sobre
 * UNA sesión de simulación. Se remonta (key) al cambiar de chat. Los dialogs de
 * Teach/Translate se abren sobre el turno elegido.
 */

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { UserProfile } from "@/domain/profile/user-profile";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import type { Scenario } from "@/domain/scenarios/scenario";
import { personaFor } from "@/domain/personas/protopersona";
import type { ChatConversation } from "@/domain/chat/chat-conversation";
import { useChatSession, type SessionSnapshot } from "./use-chat-session";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { EndSession } from "./end-session";
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
  const [teachText, setTeachText] = useState<string | null>(null);
  const [translateText, setTranslateText] = useState<string | null>(null);

  return (
    <main className="flex h-screen flex-1 flex-col bg-background">
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
          />
        </div>
        <EndSession
          scenario={scenario}
          situation={s.situation}
          level={s.level}
          turns={s.turnCount}
          errors={s.errors}
          messages={s.messages}
          disabled={s.busy || s.turnCount === 0}
          autoFinish={s.sceneComplete && !s.restoredComplete}
          scenarios={scenarios}
          onSelectScenario={onSelectScenario}
          onTranslate={setTranslateText}
        />
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
            onTeach={setTeachText}
            onTranslate={setTranslateText}
          />

          {s.sceneComplete ? (
            <div className="flex items-center justify-center gap-2 border-t bg-muted/40 px-4 py-3 text-sm text-muted-foreground duration-500 animate-in fade-in slide-in-from-bottom-2">
              <GraduationCap className="h-4 w-4" />
              {s.restoredComplete
                ? "Esta sesión ya terminó — pulsa «Finalizar y ver lección» para revisarla, o continúa tu ruta."
                : "Escena completada — Emma está preparando tu lección…"}
            </div>
          ) : (
            <Composer
              onSend={s.send}
              busy={s.busy}
              context={s.lastEmma}
              level={s.level}
              scenarioType={scenario.scenarioType}
            />
          )}
        </>
      )}

      <TeachDialog text={teachText} onClose={() => setTeachText(null)} />
      <TranslateDialog text={translateText} onClose={() => setTranslateText(null)} />
    </main>
  );
}
