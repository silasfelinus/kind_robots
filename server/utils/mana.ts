// /server/utils/mana.ts
import { prisma } from './prisma'
import type { ManaReason, Role } from '~/prisma/generated/prisma/client'

// prisma is $extends()-wrapped (see server/utils/prisma.ts), so its
// $transaction callback's tx param has extended InternalArgs that don't
// structurally match the plain Prisma.TransactionClient type. Derive the
// type from the actual instance instead of the generated default (same
// pattern as server/api/model-builder/items/[id]/commit.post.ts).
type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

const PEG_USD_PER_MANA = 0.001

export function usdToMana(usd: number) {
  return Math.max(1, Math.ceil(usd / PEG_USD_PER_MANA))
}

// Atomic credit/debit + ledger row. Throws on insufficient funds.
// Pass `tx` when this call must participate in a caller's own transaction
// (e.g. crediting mana alongside an Order/OrderItem write in the same
// commit) instead of opening its own independent transaction.
export async function applyMana(opts: {
  userId: number
  amount: number // signed
  reason: ManaReason
  refId?: string
  note?: string
  provider?: string
  costUsd?: number
  allowNegative?: boolean
  tx?: TransactionClient
}) {
  const run = async (tx: TransactionClient) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: opts.userId },
      select: { mana: true },
    })
    const next = user.mana + opts.amount
    if (next < 0 && !opts.allowNegative) {
      throw createError({ statusCode: 402, statusMessage: 'INSUFFICIENT_MANA' })
    }
    await tx.user.update({
      where: { id: opts.userId },
      data: { mana: next },
    })
    const txn = await tx.manaTransaction.create({
      data: {
        userId: opts.userId,
        amount: opts.amount,
        reason: opts.reason,
        balanceAfter: next,
        refId: opts.refId,
        note: opts.note,
        provider: opts.provider,
        costUsd: opts.costUsd,
      },
    })
    return { balance: next, txnId: txn.id }
  }

  return opts.tx ? run(opts.tx) : prisma.$transaction(run)
}

export type { ManaReason }
