/** Reject malformed backup envelopes before any existing browser progress is removed. */
export function isShiftingDesksBackupEnvelope(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const backup = value as Record<string, unknown>
  if (backup.game !== 'shifting-desks' || backup.version !== 1) return false
  if (!Object.hasOwn(backup, 'run')) return false
  if (!Array.isArray(backup.discovered) || !Array.isArray(backup.endingsFound)) return false
  if (!backup.settings || typeof backup.settings !== 'object' || Array.isArray(backup.settings)) return false
  if (!backup.rewardArchive || typeof backup.rewardArchive !== 'object' || Array.isArray(backup.rewardArchive)) return false
  if (backup.envelopeOpened !== true && backup.envelopeOpened !== false) return false
  if (backup.discovered.some((entry: unknown) => typeof entry !== 'string')) return false
  if (backup.endingsFound.some((entry: unknown) => typeof entry !== 'string')) return false
  return true
}
