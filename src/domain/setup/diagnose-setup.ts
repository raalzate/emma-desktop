/**
 * Convierte las mediciones crudas del chequeo en diagnóstico (FR-024, FR-032):
 * estado por prueba, severidad, causas y remediaciones. Función pura, sin IO.
 * Bloqueante = ningún motor de IA utilizable; todo lo demás es advertencia y
 * permite «Continue anyway».
 */
import { recommendEngine } from "@/domain/ai/engine-recommendation";
import { REMEDIATIONS, type OsName, type Remediation, type SetupCause } from "./setup-remediation";
import type { AiProbe, MicProbe, ProbeName, VoiceProbe } from "./setup-probe-result";
import { AI_MS, VOICE_MS, classifyLatency, type Speed } from "./setup-thresholds";

export type { ProbeName } from "./setup-probe-result";
export type Severity = "ok" | "warning" | "blocking";

export interface ProbeDiagnosis {
  probe: ProbeName;
  severity: Severity;
  speed?: Speed;
  ms?: number;
  /** Carga en frío del modelo local (informativa). */
  loadMs?: number;
  summary: string;
  causes: SetupCause[];
  remediations: Remediation[];
}

export interface SetupDiagnosis {
  verdict: "pass" | "warn" | "blocked";
  probes: ProbeDiagnosis[];
}

export interface SetupMeasurements {
  voice?: VoiceProbe;
  ai?: AiProbe;
  mic?: MicProbe;
  os: OsName;
}

const PROBE_ORDER: readonly ProbeName[] = ["voice", "ai", "mic"];

const SUMMARY: Record<SetupCause, string> = {
  "no-webgpu": "This device has no WebGPU, so the local model cannot run.",
  "low-ram": "This device has less memory than the local model needs.",
  "ai-slow-local": "The local model answers slowly.",
  "ai-slow-remote": "The cloud model answers slowly.",
  "ai-no-response": "The AI engine did not respond.",
  "ai-empty": "The AI engine returned an empty answer.",
  "ai-timeout": "The AI engine took too long to answer.",
  "ai-loading": "The local model is still loading. Test again in a few seconds.",
  "ai-offline": "You are offline and the cloud model is selected.",
  "voice-fallback": "EMMA's voice fell back to the basic system voice.",
  "voice-slow": "EMMA's voice takes a while to start.",
  "voice-timeout": "EMMA's voice did not start in time.",
  "mic-denied": "Microphone access is denied.",
  "mic-missing": "No microphone was found.",
};

/** Los ms se guardan y muestran enteros. */
const whole = (ms: number | undefined): number | undefined => (ms === undefined ? undefined : Math.round(ms));

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

function remediationsFor(causes: readonly SetupCause[], keep: (r: Remediation) => boolean): Remediation[] {
  const seen = new Set<string>();
  return causes
    .flatMap((c) => REMEDIATIONS[c])
    .filter(keep)
    .filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true)));
}

function build(
  probe: ProbeName,
  severity: Severity,
  causes: SetupCause[],
  keep: (r: Remediation) => boolean = () => true,
  extra: Pick<ProbeDiagnosis, "speed" | "ms" | "loadMs"> = {},
): ProbeDiagnosis {
  const uniq = unique(causes);
  const summary = uniq.length > 0 ? SUMMARY[uniq[0]] : "Working as expected.";
  return { probe, severity, summary, causes: uniq, remediations: remediationsFor(uniq, keep), ...extra };
}

function diagnoseVoice(v: VoiceProbe): ProbeDiagnosis {
  if (v.status === "timeout") return build("voice", "warning", ["voice-timeout"]);
  if (v.status === "error") return build("voice", "warning", ["voice-fallback"]);
  const ms = whole(v.ms);
  const speed = ms === undefined ? undefined : classifyLatency(ms, VOICE_MS);
  const causes: SetupCause[] = [];
  if (v.engine === "web-speech") causes.push("voice-fallback");
  if (speed && speed !== "ok") causes.push("voice-slow");
  const severity: Severity = causes.length > 0 ? "warning" : "ok";
  return build("voice", severity, causes, () => true, { speed, ms });
}

function diagnoseMic(m: MicProbe, os: OsName): ProbeDiagnosis {
  const onlyThisOs = (r: Remediation) => r.action.kind !== "steps" || r.action.os === os || r.action.os === "any";
  if (m.status === "timeout") return micTimeout();
  if (m.status === "denied") return build("mic", "warning", ["mic-denied"], onlyThisOs);
  if (m.status === "no-device" || m.devices === 0) return build("mic", "warning", ["mic-missing"]);
  return build("mic", "ok", []);
}

// Sin causa propia: sólo se puede repetir la prueba.
function micTimeout(): ProbeDiagnosis {
  return {
    probe: "mic",
    severity: "warning",
    summary: "The microphone check did not finish in time.",
    causes: [],
    remediations: [
      { label: "Test the microphone again", tooltipEs: "Repite sólo la prueba de micrófono.", action: { kind: "retest", probe: "mic" } },
    ],
  };
}

// ¿Hay otro motor al que pasar si el configurado falla?
function hasAlternativeEngine(a: AiProbe): boolean {
  if (a.mode === "hybrid") return true;
  return a.mode === "remote" && a.localModelAvailable;
}

function deviceCauses(a: AiProbe): SetupCause[] {
  if (!a.device || a.mode === "remote") return [];
  const rec = recommendEngine({ webgpu: a.device.webgpu, ramGB: a.device.ramGB, minRamGB: a.device.minRamGB });
  return rec.engine === "cloud" ? [rec.reason] : [];
}

function slowCause(a: AiProbe): SetupCause {
  return a.mode === "remote" ? "ai-slow-remote" : "ai-slow-local";
}

function failureCauses(a: AiProbe): SetupCause[] {
  const causes: SetupCause[] = [];
  if (a.mode === "remote" && !a.online) causes.push("ai-offline");
  else if (a.status === "empty") causes.push("ai-empty");
  else if (a.status === "timeout") causes.push("ai-timeout", slowCause(a));
  else causes.push("ai-no-response");
  return [...causes, ...deviceCauses(a)];
}

function diagnoseAi(a: AiProbe): ProbeDiagnosis {
  const noLocalSwitch = (r: Remediation) => a.localModelAvailable || r.action.kind !== "switch-to-local";
  const ms = whole(a.ms);
  // La clasificación usa sólo la inferencia: la carga en frío es informativa.
  const speed = ms === undefined || a.status !== "ok" ? undefined : classifyLatency(ms, AI_MS);
  const extra = { speed, ms, loadMs: whole(a.loadMs) };
  if (a.status === "timeout" && a.loadingModel) return build("ai", "warning", ["ai-loading"], noLocalSwitch, extra);

  if (a.status === "ok" && a.readiness === "ok") {
    const causes: SetupCause[] = speed && speed !== "ok" ? [slowCause(a)] : [];
    return build("ai", causes.length > 0 ? "warning" : "ok", causes, noLocalSwitch, extra);
  }

  const causes = failureCauses(a);
  const stillUsable = a.readiness === "ok" && (hasAlternativeEngine(a) || (a.status === "timeout" && a.mode !== "remote"));
  return build("ai", stillUsable ? "warning" : "blocking", causes, noLocalSwitch, extra);
}

function verdictOf(probes: readonly ProbeDiagnosis[]): SetupDiagnosis["verdict"] {
  if (probes.some((p) => p.severity === "blocking")) return "blocked";
  if (probes.some((p) => p.severity === "warning")) return "warn";
  return "pass";
}

function assemble(probes: readonly ProbeDiagnosis[]): SetupDiagnosis {
  const ordered = [...probes].sort((x, y) => PROBE_ORDER.indexOf(x.probe) - PROBE_ORDER.indexOf(y.probe));
  return { verdict: verdictOf(ordered), probes: ordered };
}

export function diagnoseSetup(m: SetupMeasurements): SetupDiagnosis {
  const probes: ProbeDiagnosis[] = [];
  if (m.voice) probes.push(diagnoseVoice(m.voice));
  if (m.ai) probes.push(diagnoseAi(m.ai));
  if (m.mic) probes.push(diagnoseMic(m.mic, m.os));
  return assemble(probes);
}

/** «Test again» de una sola prueba: sustituye su entrada y recalcula el veredicto (H5). */
export function mergeDiagnosis(prev: SetupDiagnosis, rerun: ProbeDiagnosis): SetupDiagnosis {
  return assemble([...prev.probes.filter((p) => p.probe !== rerun.probe), rerun]);
}
