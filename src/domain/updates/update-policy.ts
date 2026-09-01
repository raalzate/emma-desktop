/**
 * Política de actualización (dominio puro, spec #137 FR-001/FR-005/FR-008).
 *
 * La decisión de QUÉ ofrecer ante una versión nueva vive aquí, sin IO: el main
 * sólo ejecuta lo decidido. La restricción que gobierna todo: en macOS la firma
 * es ad-hoc y Squirrel.Mac se niega a aplicar updates sin firma válida — en Mac
 * se ofrece la descarga, nunca auto-instalar. Cuando exista firma real, basta
 * `signed: true` para que Mac pase a auto sin reescribir nada.
 *
 * Lo que llega del feed es entrada externa: una versión malformada se trata
 * como "no hay update" (guarda, jamás excepción).
 */

/** Semver simple x.y.z — lo único que produce release-build.yml. */
const SEMVER = /^\d+\.\d+\.\d+$/;

export function isValidVersion(version: unknown): version is string {
  return typeof version === "string" && SEMVER.test(version);
}

/** Negativo si a<b, 0 si iguales, positivo si a>b. Requiere versiones válidas. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/** Qué se le ofrece al usuario ante el estado del feed. */
export type UpdateAction = "auto" | "manual" | "none";

export interface UpdateContext {
  /** Versión instalada (app.getVersion()). */
  current: string;
  /** Última versión publicada según el feed. */
  latest: string;
  /** process.platform del main. */
  platform: "darwin" | "win32" | "linux";
  /** Hay firma de código real (hoy: false — la firma es ad-hoc). */
  signed: boolean;
}

export function resolveUpdateAction(context: UpdateContext): UpdateAction {
  const { current, latest, platform, signed } = context;
  if (!isValidVersion(current) || !isValidVersion(latest)) return "none";
  if (compareVersions(latest, current) <= 0) return "none";
  if (platform === "win32" || platform === "linux") return "auto";
  if (platform === "darwin") return signed ? "auto" : "manual";
  // Plataforma desconocida: avisar con descarga manual nunca rompe nada.
  return "manual";
}
