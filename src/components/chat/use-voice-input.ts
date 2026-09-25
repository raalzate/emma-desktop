"use client";

/**
 * Entrada por voz (STT): graba el micrófono con MediaRecorder, decodifica y
 * resamplea a 16 kHz mono, y transcribe con Whisper local (transformers.js).
 * Devuelve un toggle de grabación y el estado. El modelo se carga perezosamente
 * la 1ª vez (puede tardar). Todo offline; nada sale del equipo.
 */

import { useRef, useState } from "react";
import { transcribe } from "@/infrastructure/audio/whisper-transcribe";

/** Decodifica un Blob de audio a PCM mono float32 a 16 kHz. */
async function toPcm16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  const decoded = await new AC().decodeAudioData(buf);
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

/**
 * Nota de voz estilo WhatsApp: al detener, entrega la transcripción JUNTO con la
 * URL del audio grabado, para enviar ambos a la IA (transcripción para procesar,
 * audio para reproducir en la burbuja).
 */
export function useVoiceInput(
  onResult: (text: string, audioUrl: string) => void,
  /** Aviso en español cuando la grabación no deja nada utilizable (#169). */
  onProblem?: (mensajeEs: string) => void,
) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Sin micrófono o sin permiso: la UI necesita saberlo para ofrecer la
      // salida de emergencia en un turno obligatoriamente hablado.
      setAvailable(false);
      onProblem?.("No se pudo usar el micrófono: revisa el permiso del sistema.");
      return;
    }
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setBusy(true);
      try {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        const audioUrl = URL.createObjectURL(blob);
        const pcm = await toPcm16k(blob);
        const text = await transcribe(pcm);
        // Transcripción vacía: el turno NO avanza y hay que poder reintentar,
        // o el aprendiz queda atrapado en un turno hablado sin salida.
        if (text) onResult(text, audioUrl);
        else onProblem?.("No se entendió nada de la grabación. Intenta de nuevo, más cerca del micrófono.");
      } catch {
        onProblem?.("No se pudo procesar la grabación. Intenta de nuevo.");
      } finally {
        setBusy(false);
      }
    };
    rec.start();
    recorderRef.current = rec;
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return { recording, busy, available, toggle: () => (recording ? stop() : void start()) };
}
