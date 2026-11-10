"use client";

/** Contenedor del almacenamiento de audio: lee/borra por la fachada y guarda el tope. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEmma } from "@/interface/emma-context";
import type { AudioClipMeta } from "@/domain/audio/audio-clip";
import { DEFAULT_AUDIO_CAP_BYTES } from "@/domain/audio/audio-retention";
import { AudioStorageView } from "./audio-storage-view";
import { groupByConversation, parseCapMb } from "./audio-storage-model";

const MB = 1024 * 1024;

export function AudioStorageCard() {
  const { runtime } = useEmma();
  const audio = runtime?.audio ?? null;
  const { toast } = useToast();
  const [clips, setClips] = useState<AudioClipMeta[]>([]);
  const [capInput, setCapInput] = useState(String(DEFAULT_AUDIO_CAP_BYTES / MB));
  const [capError, setCapError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!audio) return;
    setClips(await audio.list());
  }, [audio]);

  useEffect(() => {
    if (!audio) return;
    void refresh().catch(() => {});
    void audio.getPrefs().then((p) => setCapInput(String(Math.round(p.capBytes / MB))), () => {});
  }, [audio, refresh]);

  const usage = useMemo(
    () => ({ count: clips.length, bytes: clips.reduce((a, c) => a + c.bytes, 0) }),
    [clips],
  );
  const groups = useMemo(() => groupByConversation(clips), [clips]);

  const guard = async (job: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await job();
      await refresh();
      toast({ title: done });
    } catch {
      toast({ title: "Could not update the audio", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeGroup = (conversationId: string | null) =>
    guard(
      () =>
        conversationId
          ? audio!.removeConversation(conversationId)
          : audio!.removeClips(clips.filter((c) => !c.conversationId).map((c) => c.id)),
      "Audio deleted",
    );

  const saveCap = async () => {
    const parsed = parseCapMb(capInput);
    if (!parsed.ok) return setCapError(parsed.error);
    setCapError(null);
    await guard(async () => audio!.savePrefs({ ...(await audio!.getPrefs()), capBytes: parsed.bytes }), "Limit saved");
  };

  if (!audio) return null;
  return (
    <AudioStorageView
      usage={usage} groups={groups} capInput={capInput} capError={capError} busy={busy}
      onCapInput={setCapInput} onSaveCap={() => void saveCap()}
      onRemoveConversation={(id) => void removeGroup(id)}
      onRemoveAll={() => void guard(() => audio.removeAll(), "All audio deleted")}
    />
  );
}
