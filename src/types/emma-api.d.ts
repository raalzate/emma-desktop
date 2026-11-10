/** Tipado del puente preload expuesto como window.emmaAPI (espeja preload.ts). */

export interface LitertModelStatus {
  id: string;
  label: string;
  file: string;
  url: string;
  approxGB: number;
  minRamGB: number;
  blurb: string;
  downloaded: boolean;
  sizeBytes: number;
}

export type MicAccessStatus = "granted" | "denied" | "restricted" | "not-determined" | "unknown";

/** Clip en el cable del IPC (espeja `AudioClipMetaWire` del main). */
export interface AudioClipWireMeta {
  id: string;
  origin: "learner" | "emma" | "attempt";
  text: string;
  voice?: string;
  conversationId?: string;
  cardId?: string;
  durationMs: number;
  bytes: number;
  createdAt: number;
}

export interface AudioSaveArgs {
  meta: AudioClipWireMeta;
  mime: "audio/webm;codecs=opus" | "audio/webm";
  data: Uint8Array;
}

export interface EmmaApi {
  litertModelsList(): Promise<{ totalRamGB: number; models: LitertModelStatus[] }>;
  litertModelDownload(id: string): Promise<{ ok: boolean; error?: string }>;
  litertModelDelete(id: string): Promise<{ ok: boolean; error?: string }>;
  litertModelReveal(id: string): Promise<{ ok: boolean; error?: string }>;
  onLitertModelProgress(cb: (data: { id: string; percent: number }) => void): () => void;

  setAiKey(provider: string, key: string): Promise<{ ok: boolean; error?: string }>;
  deleteAiKey(provider: string): Promise<{ ok: boolean }>;
  getAiKeyStatus(): Promise<Record<string, boolean>>;
  remoteGenerate(args: {
    provider: string;
    model: string;
    prompt: string;
    system?: string;
  }): Promise<string>;

  /** Voz nativa (Kokoro en un utilityProcess); rechaza si el motor no arranca. */
  ttsNativeWarm?(): Promise<void>;
  ttsNativeGenerate?(text: string, voice: string): Promise<{ wav: Uint8Array; duration: number }>;

  systemInfo(): Promise<Record<string, unknown>>;

  // Actualizaciones (spec #137): el estado llega por onUpdateStatus.
  updatesCheck(): Promise<void>;
  updatesDownload(): Promise<void>;
  updatesInstall(): Promise<void>;
  updatesOpenDownload(): Promise<void>;
  updatesCurrentVersion(): Promise<string>;
  onUpdateStatus(callback: (status: unknown) => void): () => void;

  storeGet(key: string): Promise<Record<string, unknown>>;
  storeSet(key: string, value: Record<string, unknown>): Promise<{ ok: boolean }>;

  /** Audio guardado del repaso. Las respuestas se validan otra vez en el renderer (ipc-audio-store). */
  audioSave(args: AudioSaveArgs): Promise<{ ok: true } | { ok: false; error: "invalid" | "io" }>;
  audioRead(id: string): Promise<{ meta: AudioClipWireMeta; data: Uint8Array } | null>;
  audioRemove(ids: string[]): Promise<{ removed: number }>;
  audioRemoveConversation(conversationId: string): Promise<{ removed: number }>;
  audioRemoveAll(): Promise<{ ok: boolean }>;
  audioList(): Promise<AudioClipWireMeta[]>;
  audioUsage(): Promise<{ count: number; bytes: number }>;
  /** Permiso del micrófono según el SO (no abre el micrófono). */
  micAccessStatus(): Promise<MicAccessStatus>;

  navigate(cb: (route: string) => void): () => void;
  copyToClipboard(text: string): Promise<boolean>;
}

declare global {
  interface Window {
    emmaAPI?: EmmaApi;
  }
}

export {};
