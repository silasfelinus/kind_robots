export class FacetMaintenanceLockLostError extends Error {
  constructor(cause?: unknown) {
    super('Facet catalog maintenance lost its database lock session.', {
      cause,
    })
    this.name = 'FacetMaintenanceLockLostError'
  }
}

export type FacetMaintenanceLockGuard = {
  signal: AbortSignal
  loseLock: (cause?: unknown) => boolean
}

export function createFacetMaintenanceLockGuard(): FacetMaintenanceLockGuard {
  const controller = new AbortController()

  return {
    signal: controller.signal,
    loseLock(cause?: unknown) {
      if (controller.signal.aborted) return false
      controller.abort(new FacetMaintenanceLockLostError(cause))
      return true
    },
  }
}

export function facetMaintenanceAbortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new FacetMaintenanceLockLostError(signal.reason)
}

export function throwIfFacetMaintenanceAborted(signal: AbortSignal): void {
  if (signal.aborted) throw facetMaintenanceAbortReason(signal)
}

export async function runSerializedFacetMaintenanceSteps<T>(
  steps: readonly T[],
  runStep: (step: T, signal: AbortSignal) => Promise<void>,
  signal: AbortSignal,
): Promise<void> {
  for (const step of steps) {
    throwIfFacetMaintenanceAborted(signal)
    await runStep(step, signal)
    throwIfFacetMaintenanceAborted(signal)
  }
}

function numericRowField(
  row: Record<string, unknown>,
  field: string,
): number | undefined {
  const raw = row[field]
  if (raw === null || raw === undefined) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

export function lockOwnerMatchesConnection(rows: unknown): boolean {
  if (!Array.isArray(rows) || !rows.length) return false
  const row = rows[0]
  if (!row || typeof row !== 'object') return false

  const record = row as Record<string, unknown>
  const connectionId = numericRowField(record, 'connectionId')
  const ownerId = numericRowField(record, 'ownerId')

  return connectionId !== undefined && connectionId === ownerId
}
