// /server/utils/matureBarrier.ts
//
// THE HARD BARRIER. An anonymous viewer or a maturity-restricted account (CHILD,
// which wins over ADMIN) must not be able to tell a mature image exists: not as
// a cover, not as a 403, not as a reaction count. Callers answer exactly as they
// would for a row that was never there (404).
//
// No imports on purpose: a contract script can load this without a Nuxt runtime.
export function matureHiddenFrom(
  restricted: boolean,
  row: { isMature?: boolean | null } | null | undefined,
): boolean {
  return restricted && row?.isMature === true
}

function isMatureRecord(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { isMature?: unknown }).isMature === true
  )
}

/**
 * A response that EMBEDS other rows (a Dream with its art, characters and
 * rewards) has to withhold the mature ones itself: the parent being safe says
 * nothing about what hangs off it, and "the client hides it" still ships the
 * path. Walks the payload, dropping any nested mature record from an array and
 * nulling it as a property. The root is the caller's own 404 to give.
 *
 * Only records that SELECT isMature can be recognised, so a route that embeds
 * art must select the flag. Returns a new structure; the input is not mutated.
 */
export function withholdMature<T>(value: T, hide: boolean): T {
  if (!hide) return value
  return scrub(value) as T
}

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((item) => !isMatureRecord(item)).map(scrub)
  }
  if (value === null || typeof value !== 'object') return value
  if (value instanceof Date) return value

  const out: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isMatureRecord(child) ? null : scrub(child)
  }
  return out
}
