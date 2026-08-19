// /server/utils/mana.ts
import { prisma } from './prisma'
import type {
  ManaAttributionSource,
  ManaReason,
  ManaResource,
} from '~/prisma/generated/prisma/client'
import { PEG_USD_PER_MANA } from './revenueSplit'

// prisma is $extends()-wrapped (see server/utils/prisma.ts), so its
// $transaction callback's tx param has extended InternalArgs that don't
// structurally match the plain Prisma.TransactionClient type. Derive the
// type from the actual instance instead of the generated default (same
// pattern as server/api/model-builder/items/[id]/commit.post.ts).
type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

// kind-economy/t-008: PEG_USD_PER_MANA now lives in server/utils/revenueSplit.ts
// (a prisma-free module, unlike this one) and is imported above for local
// use, so this module still has exactly one place that reads the literal
// peg value, not two. Not re-exported from here too -- Nuxt's server/utils
// auto-import registry warns on the same exported name resolving from two
// files ("Duplicated imports"), so anything else that needs the constant
// should import it from revenueSplit.ts directly, matching mana.ts's own
// import above.
export function usdToMana(usd: number) {
  return Math.max(1, Math.ceil(usd / PEG_USD_PER_MANA))
}

// kind-economy/t-006: which User column a resolved ManaResource lives on.
const FIELD_BY_RESOURCE: Record<
  ManaResource,
  'mana' | 'tokens' | 'earnedTokens'
> = {
  MANA: 'mana',
  TOKENS: 'tokens',
  EARNED: 'earnedTokens',
}

// kind-economy/t-006: reasons with one deterministic resource. Free grants
// (SIGNUP_BONUS, CYCLE_REFILL) and giveaway-shaped grants (SOCIAL_*,
// BOUNTY_*, KARMA_CONVERSION, ACHIEVEMENT_CONFIRMED) always land in MANA.
// Real-money grants (PURCHASE, SUBSCRIPTION_GRANT) always land in TOKENS.
//
// GENERATION_ART/GENERATION_TEXT are deliberately NOT here: a spend's
// resource is resolved dynamically per-call (manaGate tries tokens first,
// falls back to mana), not fixed by reason. ADMIN_REFUND/ADJUSTMENT are also
// deliberately NOT here: which pool an admin refund/adjustment should touch
// is genuinely ambiguous and must be stated explicitly by the caller rather
// than guessed. Both groups require `opts.resource` to be passed explicitly.
const REASON_RESOURCE: Partial<Record<ManaReason, ManaResource>> = {
  SIGNUP_BONUS: 'MANA',
  CYCLE_REFILL: 'MANA',
  SOCIAL_REACTION: 'MANA',
  SOCIAL_SHARE: 'MANA',
  BOUNTY_CREATE: 'MANA',
  BOUNTY_REWARD: 'MANA',
  KARMA_CONVERSION: 'MANA',
  ACHIEVEMENT_CONFIRMED: 'MANA',
  PURCHASE: 'TOKENS',
  SUBSCRIPTION_GRANT: 'TOKENS',
}

// Exported (unlike the rest of this module's internals) specifically so it
// can be unit-tested without a database -- see
// utils/scripts/verifyManaResourceSplit.test.ts.
export function resolveManaResource(
  reason: ManaReason,
  explicit?: ManaResource,
): ManaResource {
  if (explicit) return explicit
  const fromReason = REASON_RESOURCE[reason]
  if (fromReason) return fromReason
  throw new Error(
    `applyMana: reason "${reason}" has no default resource and requires an explicit opts.resource (GENERATION_ART/GENERATION_TEXT resolve dynamically per spend; ADMIN_REFUND/ADJUSTMENT are ambiguous by design).`,
  )
}

// Atomic credit/debit + ledger row. Throws on insufficient funds.
// Pass `tx` when this call must participate in a caller's own transaction
// (e.g. crediting mana alongside an Order/OrderItem write in the same
// commit) instead of opening its own independent transaction.
//
// kind-economy/t-006: `resource` selects which balance (`mana`, `tokens`, or
// `earnedTokens`) this call actually grants/debits. When omitted it is
// derived from `reason` via REASON_RESOURCE -- see that map's comment for
// which reasons require it to be passed explicitly instead.
export async function applyMana(opts: {
  userId: number
  amount: number // signed
  reason: ManaReason
  resource?: ManaResource
  refId?: string
  note?: string
  provider?: string
  costUsd?: number
  allowNegative?: boolean
  tx?: TransactionClient
  // kind-economy/t-007: which object (if any) seeded this generation and
  // who created it -- see server/utils/manaAttribution.ts for how a caller
  // resolves these from a ManaSource before calling applyMana. Left as
  // three independent optional fields (not a nested object) so a caller
  // that only knows the resolved creatorUserId (no live source ref to
  // report) can still pass that much without inventing a fake source.
  sourceType?: ManaAttributionSource | null
  sourceId?: number | null
  creatorUserId?: number | null
  isSelfAttribution?: boolean
}) {
  const resource = resolveManaResource(opts.reason, opts.resource)
  const field = FIELD_BY_RESOURCE[resource]

  const run = async (tx: TransactionClient) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: opts.userId },
      select: { mana: true, tokens: true, earnedTokens: true },
    })
    const current = user[field]
    const next = current + opts.amount
    if (next < 0 && !opts.allowNegative) {
      throw createError({
        statusCode: 402,
        statusMessage: `INSUFFICIENT_${resource}`,
      })
    }
    await tx.user.update({
      where: { id: opts.userId },
      data: { [field]: next },
    })
    const txn = await tx.manaTransaction.create({
      data: {
        userId: opts.userId,
        amount: opts.amount,
        reason: opts.reason,
        resource,
        balanceAfter: next,
        refId: opts.refId,
        note: opts.note,
        provider: opts.provider,
        costUsd: opts.costUsd,
        sourceType: opts.sourceType ?? null,
        sourceId: opts.sourceId ?? null,
        creatorUserId: opts.creatorUserId ?? null,
        isSelfAttribution: opts.isSelfAttribution ?? false,
      },
    })
    return { balance: next, resource, txnId: txn.id }
  }

  return opts.tx ? run(opts.tx) : prisma.$transaction(run)
}

export type { ManaReason, ManaResource }
