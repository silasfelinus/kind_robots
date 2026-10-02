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
