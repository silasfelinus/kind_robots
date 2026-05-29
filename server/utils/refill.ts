// /server/utils/refill.ts — call from a daily cron or lazily on user load
import { prisma } from './prisma'
import { applyMana } from './mana'

const CYCLE_MS = 1000 * 60 * 60 * 24 // daily; tune to your economics

export async function maybeRefill(userId: number) {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      mana: true,
      manaCap: true,
      lastManaRefill: true,
      Role: true,
      isGuest: true,
      signupBonusGiven: true,
    },
  })

  // one-time signup bonus for real users
  if (!u.isGuest && !u.signupBonusGiven) {
    await applyMana({ userId, amount: 250, reason: 'SIGNUP_BONUS' })
    await prisma.user.update({
      where: { id: userId },
      data: { signupBonusGiven: true },
    })
  }

  const due =
    !u.lastManaRefill || Date.now() - u.lastManaRefill.getTime() >= CYCLE_MS
  if (!due) return

  // top up TO cap (no rollover for guests), never reduce
  if (u.mana < u.manaCap) {
    await applyMana({
      userId,
      amount: u.manaCap - u.mana,
      reason: 'CYCLE_REFILL',
    })
  }
  await prisma.user.update({
    where: { id: userId },
    data: { lastManaRefill: new Date() },
  })
}
