// /server/utils/mana.ts
import { prisma } from './prisma'
import type { ManaReason, Role } from '~/prisma/generated/prisma/client'

const PEG_USD_PER_MANA = 0.001

export function usdToMana(usd: number) {
  return Math.max(1, Math.ceil(usd / PEG_USD_PER_MANA))
}

// Atomic credit/debit + ledger row. Throws on insufficient funds.
export async function applyMana(opts: {
  userId: number
  amount: number // signed
  reason: ManaReason
  refId?: string
  note?: string
  provider?: string
  costUsd?: number
  allowNegative?: boolean
}) {
  return prisma.$transaction(async (tx) => {
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
  })
}
