// /server/utils/manaGate.ts
import { createError, type H3Event } from 'h3'
import prisma from './prisma'
import { requireApiUser } from './authGuard'
import { userIsAdmin, userRoles } from './authUser'
import { applyMana } from './mana'
import type { ManaReason, ManaResource } from './mana'
import { resolveManaGateTarget } from './manaGateTarget'
import { resolveSpendResource } from './manaSpendResolution'
import { resolveManaAttribution } from './manaAttribution'
import type { ManaSource } from './manaAttribution'
import {
  computeRevenueSplit,
  computePaymentProcessingFeeCents,
  tokensToGrossCents,
  usdToCents,
} from './revenueSplit'

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
  // kind-economy/t-007: the object (Bot, Character, Facet, Scenario,
  // PitchSheet, ArtImage, Pack, Reward, or Dream) that seeded this
  // generation, when the caller knows one. Optional -- most entry points
  // today have no single seed object (a freeform prompt, a from-scratch art
  // gen) and omitting this is correct for them, not a gap to fill in. When
  // set, manaGate resolves the creator via resolveManaAttribution() and
  // writes it onto the committed ManaTransaction row -- see
  // server/utils/manaAttribution.ts for the fallback/self-attribution rules.
  source?: ManaSource | null
}

type ManaGateResult = {
  user: {
    id: number
    mana: number | null
    tokens: number | null
    Role?: string | null
  }
  cost: number
  free: boolean
  // kind-economy/t-006: which pool `cost` will actually be drawn from if
  // committed -- 'TOKENS' when the user's paid balance alone covers it,
  // 'MANA' as the fallback (preserves pre-split "any balance that covers
  // the cost works" behavior), or null when cost is 0 (nothing is spent).
  fundedBy: ManaResource | null
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number; resource: ManaResource | null }>
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
      tokens: true,
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

  const tokenBalance = user.tokens ?? 0
  const manaBalance = user.mana ?? 0

  const resolved = resolveSpendResource({ cost, tokenBalance, manaBalance })
  if (!resolved.ok) {
    throw createError({
      statusCode: 402,
      message: `Not enough mana or tokens. Required: ${cost}, available: ${tokenBalance} tokens + ${manaBalance} mana.`,
    })
  }
  const fundedBy = resolved.fundedBy

  // kind-economy/t-007: resolve who (if anyone) seeded this generation
  // before committing, so a resolver failure surfaces at gate time rather
  // than silently vanishing inside commit()'s later transaction. Resolved
  // against targetUserId -- the account actually being spent from, which is
  // the correct "is this self-attribution" comparison even on an
  // on-behalf-of machine-caller charge.
  const attribution = await resolveManaAttribution(input.source, targetUserId)

  return {
    user,
    cost,
    free,
    fundedBy,
    commit: async (refId: string, providerCostUsd?: number) => {
      // fundedBy is only ever null when cost <= 0 (see resolution above --
      // cost > 0 either sets fundedBy or throws 402), so this is the free
      // path: nothing to debit, return the unchanged mana balance as before.
      if (cost <= 0 || !fundedBy) {
        return {
          balance: manaBalance,
          resource: null,
        }
      }

      // Atomic debit + ManaTransaction ledger row (applyMana re-checks the
      // balance inside the transaction, closing the check-then-spend race).
      // `allowNegative` stays false: if the pool selected above (based on a
      // slightly-stale read) has since been spent down by a concurrent
      // request, applyMana's in-transaction re-check throws 402 rather than
      // let this go negative -- it does NOT retry against the other pool,
      // matching the "pick one pool, no partial split" rule above.
      const resolvedCostUsd = providerCostUsd ?? input.estCostUsd

      const result = await applyMana({
        userId: user.id,
        amount: -cost,
        // input.kind === 'free' here is unreachable in practice (isFreeGeneration
        // forces cost to 0 for 'free', which returns above before this call), but
        // REASON_BY_KIND has no 'free' entry, so this ternary is kept for type
        // safety. `resource` is always passed explicitly regardless of reason.
        reason:
          input.kind === 'free' ? 'ADJUSTMENT' : REASON_BY_KIND[input.kind],
        resource: fundedBy,
        refId,
        costUsd: resolvedCostUsd,
        sourceType: attribution.source?.type ?? null,
        sourceId: attribution.source?.id ?? null,
        creatorUserId: attribution.creatorUserId,
        isSelfAttribution: attribution.isSelfAttribution,
      })

      // kind-economy/t-008: append an immutable RevenueSplit row for every
      // TOKENS-funded (paid) spend -- see server/utils/revenueSplit.ts for
      // the split math and server/utils/mana.ts / prisma/schema.prisma's
      // RevenueSplit model doc for the accounting policy. A MANA-funded
      // (free-pool) spend must NEVER get a row here -- mana is the free
      // pool the paid ledger doesn't apply to (kind-economy/t-006).
      //
      // Written as a separate write immediately after applyMana's own
      // transaction, not inside it: applyMana() already opened (or joined)
      // its own transaction and has committed by the time it returns here,
      // and RevenueSplit derivation only needs that already-committed
      // ManaTransaction's id/costUsd -- it doesn't need to participate in
      // the same debit transaction. A failure in this step would leave a
      // real (committed) debit with no corresponding ledger row rather than
      // rolling the debit back; that gap is judged acceptable for this
      // task (better to charge correctly and log loudly than to risk
      // failing a user's paid generation over ledger bookkeeping) but is
      // exactly the kind of drift a future reconciliation job should scan
      // for (a TOKENS ManaTransaction with no RevenueSplit row).
      if (fundedBy === 'TOKENS') {
        try {
          const grossCents = tokensToGrossCents(cost)
          const paymentProcessingFeeCents =
            computePaymentProcessingFeeCents(grossCents)
          const providerCostCents = usdToCents(resolvedCostUsd)
          const split = computeRevenueSplit({
            grossCents,
            paymentProcessingFeeCents,
            providerCostCents,
          })

          await prisma.revenueSplit.create({
            data: {
              manaTransactionId: result.txnId,
              userId: user.id,
              creatorUserId: attribution.creatorUserId,
              isSelfAttribution: attribution.isSelfAttribution,
              grossCents,
              paymentProcessingFeeCents,
              providerCostCents,
              platformShareCents: split.platformShareCents,
              missionShareCents: split.missionShareCents,
              creatorShareCents: split.creatorShareCents,
              roundingRemainderCents: split.roundingRemainderCents,
            },
          })
        } catch (error) {
          console.error(
            '[manaGate] failed to write RevenueSplit row for TOKENS-funded ManaTransaction',
            result.txnId,
            error,
          )
        }
      }

      return {
        balance: result.balance,
        resource: result.resource,
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
