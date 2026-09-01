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

  systemInfo(): Promise<Record<string, unknown>>;

  // Actualizaciones (spec #137): el estado llega por onUpdateStatus.
  updatesCheck(): Promise<void>;
  updatesDownload(): Promise<void>;
  updatesInstall(): Promise<void>;
  updatesOpenDownload(): Promise<void>;
  updatesCurrentVersion(): Promise<string>;
  onUpdateStatus(callback: (status: unknown) => void): () => void;

  ttsSynthesize(
    text: string,
    voice?: string,
  ): Promise<{
    audioBase64: string;
    mime: string;
    timings: { word: string; start: number; end: number }[];
  }>;

  storeGet(key: string): Promise<Record<string, unknown>>;
  storeSet(key: string, value: Record<string, unknown>): Promise<{ ok: boolean }>;

  navigate(cb: (route: string) => void): () => void;
  copyToClipboard(text: string): Promise<boolean>;
}

declare global {
  interface Window {
    emmaAPI?: EmmaApi;
  }
}

export {};
