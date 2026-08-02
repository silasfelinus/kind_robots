// /server/utils/manaGate.ts
import { createError, type H3Event } from 'h3'
import prisma from './prisma'
import { requireApiUser } from './authGuard'
import { userIsAdmin, userRoles } from './authUser'
import { applyMana } from './mana'
import type { ManaReason } from './mana'
import { resolveManaGateTarget } from './manaGateTarget'

type ManaGateKind = 'text' | 'art' | 'video' | 'model' | 'free'

// Kinds an external caller may request via /api/economy/mana/charge -- 'free'
// is deliberately excluded, it's an internal-only bypass, not something a
// trusted caller should be able to request directly.
export type ManaGateChargeableKind = Exclude<ManaGateKind, 'free'>

type ManaGateInput = {
  kind: ManaGateKind
  estCostUsd?: number
  serverId?: number | null
  useOwnResource?: boolean
  // Set only by a trusted machine caller (economy/mana/charge.post.ts) to
  // charge a different user for work the caller performed on its own
  // infrastructure. Ignored (falls back to the caller's own id) unless the
  // caller authenticates as a server key -- see resolveManaGateTarget.
  targetUserId?: number | null
}

type ManaGateResult = {
  user: {
    id: number
    mana: number | null
    Role?: string | null
  }
  cost: number
  free: boolean
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

const MANA_PER_USD = 1000

// video/model spends land under GENERATION_ART until the enum grows
// dedicated reasons (additive migration — separate task).
const REASON_BY_KIND: Record<Exclude<ManaGateKind, 'free'>, ManaReason> = {
  text: 'GENERATION_TEXT',
  art: 'GENERATION_ART',
  video: 'GENERATION_ART',
  model: 'GENERATION_ART',
}

export async function manaGate(
  event: H3Event,
  input: ManaGateInput,
): Promise<ManaGateResult> {
  const auth = await requireApiUser(event)

  const { userId: targetUserId, onBehalfOfOtherUser } = resolveManaGateTarget({
    callerUserId: auth.user.id,
    isServerKey: auth.isServerKey,
    targetUserId: input.targetUserId,
  })

  const user = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      id: true,
      mana: true,
      Role: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: onBehalfOfOtherUser ? 404 : 401,
      message: onBehalfOfOtherUser
        ? 'Target user was not found.'
        : 'Authorization user was not found.',
    })
  }

  const free = await isFreeGeneration({
    userId: user.id,
    serverId: input.serverId ?? null,
    useOwnResource: input.useOwnResource ?? false,
    // On-behalf-of charges bill the target user for real. The caller's own
    // admin/server-key standing must not grant a free pass on someone else's
    // account, or every cross-app charge would silently cost nothing.
    isAdmin: onBehalfOfOtherUser ? userIsAdmin(user) : auth.isAdmin,
    isServerKey: onBehalfOfOtherUser ? false : auth.isServerKey,
    userRoles: [...userRoles(user)],
    kind: input.kind,
  })

  const cost = free
    ? 0
    : Math.max(1, Math.ceil((input.estCostUsd ?? 0.001) * MANA_PER_USD))

  const balance = user.mana ?? 0

  if (cost > 0 && balance < cost) {
    throw createError({
      statusCode: 402,
      message: `Not enough mana. Required: ${cost}, available: ${balance}.`,
    })
  }

  return {
    user,
    cost,
    free,
    commit: async (refId: string, providerCostUsd?: number) => {
      if (cost <= 0) {
        return {
          balance,
        }
      }

      // Atomic debit + ManaTransaction ledger row (applyMana re-checks the
      // balance inside the transaction, closing the check-then-spend race).
      const result = await applyMana({
        userId: user.id,
        amount: -cost,
        reason:
          input.kind === 'free' ? 'ADJUSTMENT' : REASON_BY_KIND[input.kind],
        refId,
        costUsd: providerCostUsd ?? input.estCostUsd,
      })

      return {
        balance: result.balance,
      }
    },
  }
}

async function isFreeGeneration(input: {
  userId: number
  serverId?: number | null
  useOwnResource: boolean
  isAdmin: boolean
  isServerKey: boolean
  // The COMPLETE role set, not just the primary column. FAMILY is a permissive
  // grant, so reading only `User.Role` would quietly start charging a user who
  // holds FAMILY as a secondary role.
  userRoles?: readonly string[] | null
  kind: ManaGateKind
}): Promise<boolean> {
  if (input.kind === 'free') return true
  if (input.useOwnResource) return true
  if (input.isAdmin) return true
  if (input.isServerKey) return true
  if (
    (input.userRoles ?? []).some(
      (role) => String(role).toUpperCase() === 'FAMILY',
    )
  ) {
    return true
  }

  return await isFreeServerForUser({
    userId: input.userId,
    serverId: input.serverId ?? null,
  })
}

async function isFreeServerForUser(input: {
  userId: number
  serverId?: number | null
}): Promise<boolean> {
  if (!input.serverId) return false

  const server = await prisma.server.findFirst({
    where: {
      id: input.serverId,
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
      isPublic: true,
      isOfficial: true,
    },
  })

  if (!server) return false

  if (server.userId === input.userId) return true
  if (server.isPublic && !server.isOfficial) return true

  return false
}
