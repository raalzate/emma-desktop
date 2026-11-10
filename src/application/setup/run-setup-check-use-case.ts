/**
 * Caso de uso del chequeo de setup (FR-024..FR-028, FR-035, SC-003).
 * Corre las sondas en paralelo, cada una bajo su tope; un timeout o una excepción
 * se traducen a medición y nunca abortan el resto. Los puertos entran por argumento.
 */
import { diagnoseSetup, mergeDiagnosis, type SetupDiagnosis } from "@/domain/setup/diagnose-setup";
import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import type { ISetupProbe } from "@/domain/setup/i-setup-probe";
import { SETUP_CHECK_VERSION, type SetupCheckRecord } from "@/domain/setup/setup-check-record";
import type { OsName } from "@/domain/setup/setup-remediation";
import type { AiProbe, MicProbe, ProbeName, VoiceProbe } from "@/domain/setup/setup-probe-result";
import { PROBE_TIMEOUT_MS } from "@/domain/setup/setup-thresholds";

/** Reloj inyectado: `sleep` debe resolverse también si se aborta su señal. */
export interface SetupClock {
  now(): number;
  sleep(ms: number, signal?: AbortSignal): Promise<void>;
}

export interface RunSetupCheckArgs {
  probe: ISetupProbe;
  repo: ISetupCheckRepository;
  clock: SetupClock;
  os: OsName;
  trigger: SetupCheckRecord["trigger"];
  /** Re-corre sólo esa sonda y la fusiona con el resultado previo («Test again»). */
  only?: ProbeName;
}

// Mediciones de reemplazo cuando la sonda no entrega una.
const VOICE_TIMEOUT: VoiceProbe = { status: "timeout", engine: "none" };
const VOICE_ERROR: VoiceProbe = { status: "error", engine: "none" };
const MIC_TIMEOUT: MicProbe = { status: "timeout", devices: 0 };
const MIC_ERROR: MicProbe = { status: "unknown", devices: 0 };
// Sin contexto de modo/dispositivo: se asume local y disponible, la ruta más prudente.
const AI_BASE: Omit<AiProbe, "status"> = { mode: "local", online: true, readiness: "ok", localModelAvailable: false };
const AI_TIMEOUT: AiProbe = { ...AI_BASE, status: "timeout" };
const AI_ERROR: AiProbe = { ...AI_BASE, status: "error" };

const EXPIRO = Symbol("expiro");

/** Corre una sonda bajo su tope. Si expira, aborta la sonda y devuelve `onTimeout`. */
async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number,
  clock: SetupClock,
  onTimeout: T,
): Promise<T> {
  const probeCtl = new AbortController();
  const timerCtl = new AbortController();
  const timer = clock.sleep(ms, timerCtl.signal).then(() => EXPIRO);
  try {
    const result = await Promise.race([Promise.resolve().then(() => run(probeCtl.signal)), timer]);
    if (result !== EXPIRO) return result as T;
    probeCtl.abort();
    return onTimeout;
  } finally {
    timerCtl.abort();
  }
}

function settled<T>(r: PromiseSettledResult<T>, onError: T): T {
  return r.status === "fulfilled" ? r.value : onError;
}

type Measurements = { voice?: VoiceProbe; ai?: AiProbe; mic?: MicProbe };

async function measure(a: RunSetupCheckArgs): Promise<Measurements> {
  const { probe, clock, only } = a;
  const want = (n: ProbeName) => !only || only === n;
  const [voice, ai, mic] = await Promise.allSettled([
    want("voice") ? withTimeout((s) => probe.probeVoice(s), PROBE_TIMEOUT_MS.voice, clock, VOICE_TIMEOUT) : undefined,
    want("ai") ? withTimeout((s) => probe.probeAi(s), PROBE_TIMEOUT_MS.ai, clock, AI_TIMEOUT) : undefined,
    want("mic") ? withTimeout((s) => probe.probeMic(s), PROBE_TIMEOUT_MS.mic, clock, MIC_TIMEOUT) : undefined,
  ]);
  return {
    voice: settled(voice, VOICE_ERROR),
    ai: settled(ai, AI_ERROR),
    mic: settled(mic, MIC_ERROR),
  };
}

async function lastDiagnosis(repo: ISetupCheckRepository): Promise<SetupDiagnosis | null> {
  try {
    return (await repo.last())?.diagnosis ?? null;
  } catch {
    return null;
  }
}

async function persist(repo: ISetupCheckRepository, record: SetupCheckRecord): Promise<void> {
  try {
    await repo.append(record);
  } catch {
    // Un historial roto no debe tumbar el chequeo: el diagnóstico igual se devuelve.
  }
}

export async function runSetupCheck(a: RunSetupCheckArgs): Promise<SetupDiagnosis> {
  const measurements = await measure(a);
  let diagnosis = diagnoseSetup({ ...measurements, os: a.os });
  if (a.only) {
    const rerun = diagnosis.probes.find((p) => p.probe === a.only);
    const prev = await lastDiagnosis(a.repo);
    if (rerun && prev) diagnosis = mergeDiagnosis(prev, rerun);
  }
  await persist(a.repo, {
    version: SETUP_CHECK_VERSION, at: a.clock.now(), trigger: a.trigger, diagnosis, acknowledged: false,
  });
  return diagnosis;
}
