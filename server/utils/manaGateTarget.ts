// /server/utils/manaGateTarget.ts
//
// Pure (no DB, no Nuxt runtime) authorization boundary for on-behalf-of mana
// charges. Split out of manaGate.ts so it has a direct, dependency-free unit
// test (utils/scripts/verifyManaGateOnBehalfOfTarget.test.ts) -- manaGate.ts
// itself pulls in authGuard.ts -> server/api/auth, which calls Nuxt's
// useRuntimeConfig() at module load and can only run inside the Nuxt/Nitro
// runtime, not a standalone tsx script.
//
// Only a caller that authenticated as a server key (requireMachineUser's
// beta-admin-token / future scoped machine-credential path, see
// server/utils/authGuard.ts) may specify a targetUserId other than its own --
// a regular session JWT or user apiKey must never be able to redirect a
// charge onto someone else's balance (kind-robots/t-043,
// server/api/economy/mana/charge.post.ts).
import { createError } from 'h3'

export function resolveManaGateTarget(input: {
  callerUserId: number
  isServerKey: boolean
  targetUserId?: number | null
}): { userId: number; onBehalfOfOtherUser: boolean } {
  const requested = input.targetUserId ?? null

  if (requested == null || requested === input.callerUserId) {
    return { userId: input.callerUserId, onBehalfOfOtherUser: false }
  }

  if (!input.isServerKey) {
    throw createError({
      statusCode: 403,
      message:
        'Only a trusted machine caller may charge mana against a different user.',
    })
  }

  return { userId: requested, onBehalfOfOtherUser: true }
}
