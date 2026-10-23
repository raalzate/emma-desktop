// =============================================================================
// Mensajes entre el main y el proceso utilitario de voz (Kokoro nativo), y la
// validación de lo que llega del renderer por IPC. Sin Electron: lo comparten
// el cliente, el host y sus pruebas.
// =============================================================================

import { z } from 'zod';

const id = z.number().int().nonnegative();

// Ids de voz de Kokoro: `af_heart`, `bm_george`… nada que parezca una ruta.
const voiceSchema = z.string().regex(/^[a-z]{2}_[a-z]+$/);

const generateArgsSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: voiceSchema,
});

export type GenerateArgs = z.infer<typeof generateArgsSchema>;

export function parseGenerateArgs(raw: unknown): GenerateArgs {
  return generateArgsSchema.parse(raw);
}

export type HostRequest =
  | { type: 'load'; id: number }
  | { type: 'generate'; id: number; text: string; voice: string };

const requestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('load'), id }),
  z.object({ type: z.literal('generate'), id, text: z.string().min(1), voice: voiceSchema }),
]);

export function parseHostRequest(raw: unknown): HostRequest | null {
  const r = requestSchema.safeParse(raw);
  return r.success ? r.data : null;
}

const responseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready'), id }),
  z.object({ type: z.literal('audio'), id, wav: z.instanceof(Uint8Array), duration: z.number().positive().finite() }),
  z.object({ type: z.literal('error'), id, message: z.string() }),
]);

export type HostResponse = z.infer<typeof responseSchema>;

export function parseHostResponse(raw: unknown): HostResponse | null {
  const r = responseSchema.safeParse(raw);
  return r.success ? r.data : null;
}
