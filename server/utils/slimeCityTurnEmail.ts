import { createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { sendSlimeCityTurnEmail } from '~/server/utils/email'
import { newProgression } from '~/utils/slimeCity/progression'

function optedIn(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && 'pvpTurnEmail' in raw && raw.pvpTurnEmail === true
}

async function verifiedRecipient(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, username: true, isGuest: true, isActive: true },
  })
  return user?.email && user.emailVerified && !user.isGuest && user.isActive
    ? { email: user.email, name: user.username }
    : null
}

export async function getSlimeCityTurnPreference(userId: number) {
  const recipient = await verifiedRecipient(userId)
  const row = await prisma.slimeCityAccount.findUnique({ where: { userId } })
  return { enabled: optedIn(row?.data), eligible: !!recipient }
}

export async function setSlimeCityTurnPreference(userId: number, enabled: unknown) {
  if (typeof enabled !== 'boolean')
    throw createError({ statusCode: 400, message: 'Choose on or off.' })
  const recipient = await verifiedRecipient(userId)
  if (enabled && !recipient)
    throw createError({ statusCode: 403, message: 'Verify your account email first.' })
  await prisma.$transaction(async (tx) => {
    const row = await tx.slimeCityAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, data: JSON.parse(JSON.stringify(newProgression())) },
    })
    const data =
      row.data && typeof row.data === 'object' && !Array.isArray(row.data)
        ? { ...row.data, pvpTurnEmail: enabled }
        : { ...newProgression(), pvpTurnEmail: enabled }
    const result = await tx.slimeCityAccount.updateMany({
      where: { userId, version: row.version },
      data: {
        data: data as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    })
    if (result.count !== 1)
      throw createError({ statusCode: 409, message: 'Settings changed. Retry.' })
  })
  return { enabled, eligible: !!recipient }
}

/** Called only after a committed, live turn handoff. Failures never undo play. */
export async function notifySlimeCityTurn(userId: number, duelId: string) {
  try {
    const recipient = await verifiedRecipient(userId)
    if (!recipient) return
    const row = await prisma.slimeCityAccount.findUnique({ where: { userId } })
    if (!optedIn(row?.data)) return
    await sendSlimeCityTurnEmail(recipient.email, recipient.name, duelId)
  } catch {
    console.warn('[slime-city] turn email unavailable')
  }
}
