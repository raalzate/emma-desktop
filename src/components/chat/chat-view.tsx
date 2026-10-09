"use client";

/**
 * Orquestador del chat con Emma. Gestiona el HISTORIAL: barra lateral con las
 * conversaciones persistidas (nuevo/abrir/renombrar/eliminar) y el panel activo.
 * Cada chat es una simulación independiente; cambiar de escenario abre uno nuevo.
 * El panel se remonta (key = id de sesión) al cambiar de conversación.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { UserProfile } from "@/domain/profile/user-profile";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import { scenariosForLevel } from "@/domain/scenarios/scenario-catalog";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { ChatConversation } from "@/domain/chat/chat-conversation";
import { deriveTitle, stripForStorage } from "@/domain/chat/chat-conversation";
import { AppShell } from "@/components/nav/app-shell";
import { ChatSidebar } from "./chat-sidebar";
import { ChatPane } from "./chat-pane";
import { useChatHistory } from "./use-chat-history";
import type { SessionSnapshot } from "./use-chat-session";
import { Button } from "@/components/ui/button";
import { PendingLessonsNotice } from "@/components/progress/pending-lessons-notice";
import { useScenarioGate } from "@/components/lessons/use-scenario-gate";

interface Props {
  runtime: EmmaRuntime;
  profile: UserProfile;
  settings: ChatSettings;
  /** Escena con la que abrir, elegida en el trazado de la ruta (`?scenario=`). */
  initialScenarioType?: string;
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `chat-${Date.now()}-${Math.floor(performance.now())}`;
}

export function ChatView({ runtime, profile, settings, initialScenarioType }: Props) {
  const history = useChatHistory(runtime.repos.chatHistory);
  const scenarios = useMemo(() => scenariosForLevel(profile.englishLevel), [profile.englishLevel]);

  const [scenario, setScenario] = useState<Scenario>(
    () => scenarios.find((s) => s.scenarioType === initialScenarioType) ?? scenarios[0],
  );
  const [sessionId, setSessionId] = useState<string>(() => newId());
  const [restore, setRestore] = useState<ChatConversation | null>(null);
  // createdAt del chat activo (se conserva entre upserts de la misma sesión).
  const createdAt = useRef<number>(Date.now());

  const startNew = useCallback(
    (s: Scenario) => {
      setScenario(s);
      setRestore(null);
      setSessionId(newId());
      createdAt.current = Date.now();
    },
    [],
  );

  // #202: «Next scene» y el selector respetan el mismo gate que el trazado.
  const gate = useScenarioGate(runtime, profile.englishLevel);
  const [blocked, setBlocked] = useState(false);
  const selectScenario = useCallback(
    (s: Scenario) => {
      if (!gate.check(s.scenarioType, scenario.scenarioType).allowed) {
        setBlocked(true);
        return;
      }
      setBlocked(false);
      startNew(s);
    },
    [gate, scenario.scenarioType, startNew],
  );

  const openChat = useCallback(
    (c: ChatConversation) => {
      const found = scenarios.find((s) => s.scenarioType === c.scenarioType) ?? scenarios[0];
      setScenario(found);
      // Archivada = nivel superado: se abre en solo lectura (modo escena completada).
      setRestore(c.archived ? { ...c, completed: true } : c);
      setSessionId(c.id);
      createdAt.current = c.createdAt;
    },
    [scenarios],
  );

  // Persiste el estado del panel activo tras cada cambio de mensajes.
  const onSnapshot = useCallback(
    (snap: SessionSnapshot) => {
      const conversation: ChatConversation = {
        id: sessionId,
        // Nombre corto e identificable de la sesión: escenario · situación
        // (dos "Daily Standup" en la barra no distinguen qué se vivió).
        title:
          history.list.find((c) => c.id === sessionId)?.title ??
          deriveTitle(
            snap.situationTitle ? `${scenario.title} · ${snap.situationTitle}` : scenario.title,
            snap.messages,
          ),
        scenarioType: snap.scenarioType,
        situationTitle: snap.situationTitle,
        level: snap.level,
        messages: stripForStorage(snap.messages),
        turnCount: snap.turnCount,
        completed: snap.completed,
        lesson: snap.lesson,
        voiceOptOut: snap.voiceOptOut,
        // El archivado lo decide la promoción: un guardado del panel no debe borrarlo.
        archived: history.list.find((c) => c.id === sessionId)?.archived,
        createdAt: createdAt.current,
        updatedAt: Date.now(),
      };
      void history.persist(conversation);
    },
    [sessionId, scenario.title, history],
  );

  // El borrado se espera ANTES de abrir la sesión nueva: `writeOne` es
  // leer-modificar-escribir sobre la colección completa, así que un guardado del
  // panel activo solapado con el borrado reescribiría la conversación eliminada.
  const handleDelete = useCallback(
    async (id: string) => {
      await history.remove(id);
      if (id === sessionId) startNew(scenario);
    },
    [history, sessionId, scenario, startNew],
  );

  // UNA sola sidebar: la del shell. Las sesiones viajan por la ranura `extra`.
  return (
    <AppShell
      extra={
        <ChatSidebar
          list={history.list}
          activeId={sessionId}
          onNew={() => startNew(scenario)}
          onOpen={openChat}
          onRename={history.rename}
          onDelete={handleDelete}
        />
      }
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">
        {blocked && (
          <div className="flex items-center justify-center gap-3 border-b bg-muted/40 px-4 py-2">
            <PendingLessonsNotice />
            <Button
              variant="ghost"
              size="sm"
              title="Cierra el aviso y sigue en esta escena"
              onClick={() => setBlocked(false)}
            >
              Close
            </Button>
          </div>
        )}
        <ChatPane
          key={sessionId}
          conversationId={sessionId}
          runtime={runtime}
          profile={profile}
          settings={settings}
          scenario={scenario}
          scenarios={scenarios}
          onSelectScenario={selectScenario}
          restore={restore}
          onSnapshot={onSnapshot}
        />
      </div>
    </AppShell>
  );
}
