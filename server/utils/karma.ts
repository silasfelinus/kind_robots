// /server/utils/karma.ts
// KARMA_LIVE enabled 2026-07-04 — amounts approved by Silas as tunable defaults.
import prisma from './prisma'
import type { KarmaReason } from '~/prisma/generated/prisma/client'

const KARMA_LIVE = true

// All amounts are named constants — Silas tunes the numbers
export const KARMA_AMOUNTS: Record<KarmaReason, number> = {
  REACTION_GIVEN: 1,
  REACTION_RECEIVED: 1,
  CONTENT_CREATED_PUBLIC: 1,
  CONTENT_SHARED: 1,
  GENERATION_COMPLETED: 2,
  BOUNTY_POSTED: 0,
  BOUNTY_FULFILLED: 5,
  BOUNTY_CLAIMED: 1,
  REFERRAL_SIGNUP: 10,
  REFERRAL_CUT: 0,
  ADMIN_ADJUSTMENT: 0,
}

export async function awardKarma(opts: {
  userId: number
  reason: KarmaReason
  amount?: number
  refId?: string
  note?: string
}): Promise<{ balance: number; txnId: number } | null> {
  if (!KARMA_LIVE) return null

  const amount = opts.amount ?? KARMA_AMOUNTS[opts.reason]
  if (amount === 0) return null

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: opts.userId },
      select: { karma: true },
    })
    const next = user.karma + amount
    await tx.user.update({ where: { id: opts.userId }, data: { karma: next } })
    const txn = await tx.karmaTransaction.create({
      data: {
        userId: opts.userId,
        amount,
        reason: opts.reason,
        balanceAfter: next,
        refId: opts.refId,
        note: opts.note,
      },
    })
    return { balance: next, txnId: txn.id }
  })
}

export type { KarmaReason }
