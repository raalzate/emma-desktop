/**
 * TTS con Edge-TTS (Microsoft Read Aloud) en el proceso main — igual que el EMMA
 * original (voz `en-US-EmmaNeural`). Devuelve el mp3 + los timings por palabra
 * (WordBoundary) que alimentan el karaoke de la nota de voz. Requiere internet
 * (servicio en la nube), como la IA remota; si no hay red, el renderer cae a la
 * síntesis local del SO (Web Speech).
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface TtsWordTiming {
  word: string;
  start: number; // segundos
  end: number;
}

export interface TtsResult {
  audioBase64: string;
  mime: string;
  timings: TtsWordTiming[];
}

/** Ticks de 100 ns → segundos. */
const toSec = (ticks: number) => ticks / 10_000_000;

function collectBoundaries(chunk: unknown, out: TtsWordTiming[]): void {
  let obj: any = chunk;
  if (Buffer.isBuffer(chunk) || typeof chunk === 'string') {
    try {
      obj = JSON.parse(chunk.toString());
    } catch {
      return;
    }
  }
  for (const item of obj?.Metadata ?? []) {
    if (item?.Type !== 'WordBoundary') continue;
    const d = item.Data;
    out.push({
      word: d?.text?.Text ?? '',
      start: toSec(Number(d?.Offset ?? 0)),
      end: toSec(Number(d?.Offset ?? 0) + Number(d?.Duration ?? 0)),
    });
  }
}

/** Sintetiza *text* con la voz dada; resuelve con mp3 (base64) + timings. */
export async function synthesizeTts(text: string, voiceName?: string): Promise<TtsResult> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    voiceName || 'en-US-EmmaNeural',
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    { wordBoundaryEnabled: true },
  );
  const { audioStream, metadataStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  const timings: TtsWordTiming[] = [];
  metadataStream?.on('data', (m) => collectBoundaries(m, timings));

  await new Promise<void>((resolve, reject) => {
    audioStream.on('data', (d) => chunks.push(Buffer.from(d)));
    audioStream.on('end', () => resolve());
    audioStream.on('error', reject);
  });
  tts.close();
  return { audioBase64: Buffer.concat(chunks).toString('base64'), mime: 'audio/mpeg', timings };
}
