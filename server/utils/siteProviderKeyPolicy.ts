// /server/utils/siteProviderKeyPolicy.ts
//
// Who may spend the SITE's cloud provider keys (runtime ANTHROPIC_API_KEY /
// OPENAI_API_KEY)?
//
// Background (2026-09-04, Silas: "kill the leaks"): every text route resolved
// its upstream key as user key > stored Server key > site key, and the mana
// gate waived the charge for `useOwnResource: true` or for a public
// non-official Server. Those two facts composed badly -- a request that said
// "I bring my own resource" but attached no key was free to the caller AND
// fell through to the site key, so the site paid the provider bill for a
// request nobody paid mana for. The same fallthrough applied to a public
// Server row saved without a key.
//
// The rule this module encodes: the site key backs a request only when the
// request is actually paid for (mana/tokens debited) or when the caller is
// someone Silas has deliberately trusted with the site's spend -- an admin,
// the server key itself (agents, Conductor), or a FAMILY account. A request
// that was free BECAUSE it claimed its own resource must supply that
// resource: its own key, or a Server row that carries one.
//
// Pure and DB-free so it can be verified directly
// (utils/scripts/verifySiteProviderKeyPolicy.ts).

/** Why the mana gate waived the charge for a request, when it did. */
export type FreeGenerationReason =
  | 'kind-free'
  | 'own-resource'
  | 'admin'
  | 'server-key'
  | 'family'
  | 'free-server'

/** May the site's provider key back a request whose charge was waived for
 * `reason` (or not waived at all, `null`)? */
export function siteKeyAllowedForFreeReason(
  reason: FreeGenerationReason | null,
): boolean {
  // Paid request: the caller's mana/tokens cover the provider cost.
  if (reason === null) return true

  // Deliberately trusted callers.
  if (reason === 'admin' || reason === 'server-key' || reason === 'family') {
    return true
  }

  // Internal-only bypass (never requestable by an external caller -- see
  // ManaGateChargeableKind in manaGate.ts).
  if (reason === 'kind-free') return true

  // 'own-resource' / 'free-server': the request was free precisely because it
  // said it brings its own provider; hold it to that.
  return false
}
