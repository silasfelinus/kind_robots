export type IdentifiedRecord = {
  id: number
}

function definedEntries<T extends object>(record: T) {
  return Object.entries(record).filter(([, value]) => value !== undefined)
}

/**
 * Shallow-merges one API row without letting omitted/undefined fields erase
 * richer cached detail. Explicit nulls and empty arrays still replace the old
 * value, which keeps intentional relationship clears honest.
 */
export function mergeDefinedRecord<T extends IdentifiedRecord>(
  existing: T | undefined,
  incoming: T,
): T {
  if (!existing) return incoming

  return {
    ...existing,
    ...Object.fromEntries(definedEntries(incoming)),
  } as T
}

/**
 * Upserts incoming rows by numeric ID while preserving rows outside a filtered
 * result set. Ordering is intentionally left to the owning store.
 */
export function mergeRecordsById<T extends IdentifiedRecord>(
  existing: T[],
  incoming: T[],
): T[] {
  const records = new Map(existing.map((record) => [record.id, record]))

  for (const record of incoming) {
    records.set(record.id, mergeDefinedRecord(records.get(record.id), record))
  }

  return Array.from(records.values())
}

/**
 * Reconciles an authoritative full-list response while preserving richer
 * defined fields for IDs that still exist. Rows omitted by the server are
 * removed, unlike mergeRecordsById which is intended for filtered responses.
 */
export function reconcileRecordsById<T extends IdentifiedRecord>(
  existing: T[],
  incoming: T[],
): T[] {
  const existingById = new Map(existing.map((record) => [record.id, record]))

  return incoming.map((record) =>
    mergeDefinedRecord(existingById.get(record.id), record),
  )
}
