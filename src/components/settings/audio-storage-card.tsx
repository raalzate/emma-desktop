"use client";

/** Contenedor del almacenamiento de audio: lee/borra por la fachada y guarda el tope. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEmma } from "@/interface/emma-context";
import { CLIP_MIME, type AudioClipMeta } from "@/domain/audio/audio-clip";
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
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const player = useRef<{ el: HTMLAudioElement; url: string } | null>(null);

  const stopPlayback = useCallback(() => {
    if (player.current) {
      player.current.el.pause();
      URL.revokeObjectURL(player.current.url);
      player.current = null;
    }
    setPlayingId(null);
  }, []);
  useEffect(() => stopPlayback, [stopPlayback]);

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

  const toggleGroup = (key: string) =>
    setExpandedKeys((k) => (k.includes(key) ? k.filter((x) => x !== key) : [...k, key]));

  const playClip = async (id: string) => {
    const wasPlaying = playingId === id;
    stopPlayback();
    if (wasPlaying) return;
    try {
      const clip = await audio!.load(id);
      if (!clip) return void toast({ title: "That clip is no longer available", variant: "destructive" });
      const url = URL.createObjectURL(new Blob([clip.data as BlobPart], { type: CLIP_MIME }));
      const el = new Audio(url);
      el.onended = stopPlayback;
      player.current = { el, url };
      setPlayingId(id);
      await el.play();
    } catch {
      stopPlayback();
      toast({ title: "Could not play the clip", variant: "destructive" });
    }
  };

  const removeClip = (id: string) => {
    if (playingId === id) stopPlayback();
    return guard(() => audio!.removeClips([id]), "Clip deleted");
  };

  const saveCap = async () => {
    const parsed = parseCapMb(capInput);
    if (!parsed.ok) return setCapError(parsed.error);
    setCapError(null);
    await guard(async () => audio!.savePrefs({ ...(await audio!.getPrefs()), capBytes: parsed.bytes }), "Limit saved");
  };

  if (!audio) return null;
  return (
    <AudioStorageView
      usage={usage} groups={groups} clips={clips}
      expandedKeys={expandedKeys} playingId={playingId}
      onToggleGroup={toggleGroup} onPlayClip={(id) => void playClip(id)} onRemoveClip={(id) => void removeClip(id)}
      capInput={capInput} capError={capError} busy={busy}
      onCapInput={setCapInput} onSaveCap={() => void saveCap()}
      onRemoveConversation={(id) => void removeGroup(id)}
      onRemoveAll={() => void guard(() => audio.removeAll(), "All audio deleted")}
    />
  );
}
