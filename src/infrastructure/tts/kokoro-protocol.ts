/**
 * Protocolo de mensajes entre el renderer y el Web Worker de Kokoro. Es entrada
 * externa para cada lado (un worker roto o un mensaje ajeno no debe entrar al
 * adaptador), así que se valida con Zod en el borde y lo inválido se descarta.
 */

import { z } from "zod";

const id = z.number().int().nonnegative();

const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("load"), id }),
  z.object({ type: z.literal("generate"), id, text: z.string().min(1), voice: z.string().min(1) }),
]);

const responseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready"), id }),
  z.object({
    type: z.literal("audio"),
    id,
    blob: z.instanceof(Blob),
    duration: z.number().positive().finite(),
  }),
  z.object({ type: z.literal("error"), id, message: z.string() }),
]);

export type WorkerRequest = z.infer<typeof requestSchema>;
export type WorkerResponse = z.infer<typeof responseSchema>;

export function parseWorkerRequest(data: unknown): WorkerRequest | null {
  const r = requestSchema.safeParse(data);
  return r.success ? r.data : null;
}

export function parseWorkerResponse(data: unknown): WorkerResponse | null {
  const r = responseSchema.safeParse(data);
  return r.success ? r.data : null;
}
