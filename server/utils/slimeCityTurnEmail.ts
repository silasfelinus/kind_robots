import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import {
  sendSlimeCityChallengeEmail,
  sendSlimeCityTurnEmail,
} from '~/server/utils/email'
import { newProgression } from '~/utils/slimeCity/progression'

function optedIn(raw: unknown): boolean {
  return (
    !!raw &&
    typeof raw === 'object' &&
    'pvpTurnEmail' in raw &&
    raw.pvpTurnEmail === true
  )
}

function challengeOptedIn(raw: unknown): boolean {
  return (
    !!raw &&
    typeof raw === 'object' &&
    'pvpChallengeEmail' in raw &&
    raw.pvpChallengeEmail === true
  )
}

async function verifiedRecipient(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      username: true,
      isGuest: true,
      isActive: true,
    },
  })
  return user?.email && user.emailVerified && !user.isGuest && user.isActive
    ? { email: user.email, name: user.username }
    : null
}

export async function getSlimeCityTurnPreference(userId: number) {
  const recipient = await verifiedRecipient(userId)
  const row = await prisma.slimeCityAccount.findUnique({ where: { userId } })
  return {
    enabled: optedIn(row?.data),
    challengeEnabled: challengeOptedIn(row?.data),
    eligible: !!recipient,
  }
}

export async function setSlimeCityTurnPreference(
  userId: number,
  enabled: unknown,
  challengeEnabled?: unknown,
) {
  if (
    (enabled === undefined && challengeEnabled === undefined) ||
    (enabled !== undefined && typeof enabled !== 'boolean') ||
    (challengeEnabled !== undefined && typeof challengeEnabled !== 'boolean')
  )
    throw createError({ statusCode: 400, message: 'Choose on or off.' })
  const recipient = await verifiedRecipient(userId)
  if ((enabled === true || challengeEnabled === true) && !recipient)
    throw createError({
      statusCode: 403,
      message: 'Verify your account email first.',
    })
  return prisma.$transaction(async (tx) => {
    const row = await tx.slimeCityAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, data: JSON.parse(JSON.stringify(newProgression())) },
    })
    const data =
      row.data && typeof row.data === 'object' && !Array.isArray(row.data)
        ? { ...row.data }
        : { ...newProgression() }
    const preferences = {
      ...data,
      pvpTurnEmail: enabled ?? optedIn(row.data),
      pvpChallengeEmail: challengeEnabled ?? challengeOptedIn(row.data),
    }
    const result = await tx.slimeCityAccount.updateMany({
      where: { userId, version: row.version },
      data: {
        data: JSON.parse(JSON.stringify(preferences)),
        version: { increment: 1 },
      },
    })
    if (result.count !== 1)
      throw createError({
        statusCode: 409,
        message: 'Settings changed. Retry.',
      })
    return {
      enabled: preferences.pvpTurnEmail === true,
      challengeEnabled: preferences.pvpChallengeEmail === true,
      eligible: !!recipient,
    }
  })
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

export async function notifySlimeCityChallenge(
  userId: number,
  duelId: string,
  challenger: string,
) {
  try {
    const recipient = await verifiedRecipient(userId)
    if (!recipient) return
    const row = await prisma.slimeCityAccount.findUnique({ where: { userId } })
    if (!challengeOptedIn(row?.data)) return
    await sendSlimeCityChallengeEmail(
      recipient.email,
      recipient.name,
      duelId,
      challenger,
    )
  } catch {
    console.warn('[slime-city] challenge email unavailable')
  }
}
