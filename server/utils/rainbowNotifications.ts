import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

export type RainbowNotificationClass =
  | 'AGENT_ATTENTION'
  | 'FORUM_REPLY_MENTION'
  | 'SCHEDULED_AGENT_FAILURE'

export type RainbowNotificationPreference = {
  userId: number
  agentAttention: boolean
  forumReplyMention: boolean
  scheduledAgentFailure: boolean
  updatedAt: Date | null
}

export type RainbowNotificationDeliveryReason =
  | 'READY'
  | 'OPTED_OUT'
  | 'EMAIL_MISSING'
  | 'EMAIL_UNVERIFIED'

export type RainbowNotificationDeliveryDecision = {
  userId: number
  notificationClass: RainbowNotificationClass
  optedIn: boolean
  reason: RainbowNotificationDeliveryReason
  targets: Array<{
    transport: 'EMAIL'
    address: string
  }>
}

type PreferenceRow = {
  userId: number
  agentAttention: boolean | number
  forumReplyMention: boolean | number
  scheduledAgentFailure: boolean | number
  updatedAt: Date
}

function preferenceEnabled(
  preference: RainbowNotificationPreference,
  notificationClass: RainbowNotificationClass,
): boolean {
  switch (notificationClass) {
    case 'AGENT_ATTENTION':
      return preference.agentAttention
    case 'FORUM_REPLY_MENTION':
      return preference.forumReplyMention
    case 'SCHEDULED_AGENT_FAILURE':
      return preference.scheduledAgentFailure
  }
}

export async function getRainbowNotificationPreference(
  userId: number,
): Promise<RainbowNotificationPreference> {
  const rows = await prisma.$queryRaw<PreferenceRow[]>(Prisma.sql`
    SELECT userId, agentAttention, forumReplyMention, scheduledAgentFailure, updatedAt
    FROM RainbowNotificationPreference
    WHERE userId = ${userId}
    LIMIT 1
  `)

  const row = rows[0]
  return {
    userId,
    agentAttention: Boolean(row?.agentAttention),
    forumReplyMention: Boolean(row?.forumReplyMention),
    scheduledAgentFailure: Boolean(row?.scheduledAgentFailure),
    updatedAt: row?.updatedAt ?? null,
  }
}

export async function setRainbowNotificationPreference(input: {
  userId: number
  agentAttention: boolean
  forumReplyMention: boolean
  scheduledAgentFailure: boolean
}): Promise<RainbowNotificationPreference> {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO RainbowNotificationPreference (
      userId,
      agentAttention,
      forumReplyMention,
      scheduledAgentFailure,
      updatedAt
    ) VALUES (
      ${input.userId},
      ${input.agentAttention},
      ${input.forumReplyMention},
      ${input.scheduledAgentFailure},
      CURRENT_TIMESTAMP(3)
    )
    ON DUPLICATE KEY UPDATE
      agentAttention = VALUES(agentAttention),
      forumReplyMention = VALUES(forumReplyMention),
      scheduledAgentFailure = VALUES(scheduledAgentFailure),
      updatedAt = CURRENT_TIMESTAMP(3)
  `)

  return getRainbowNotificationPreference(input.userId)
}

export async function planRainbowNotificationDelivery(input: {
  userId: number
  notificationClass: RainbowNotificationClass
}): Promise<RainbowNotificationDeliveryDecision> {
  const preference = await getRainbowNotificationPreference(input.userId)
  const optedIn = preferenceEnabled(preference, input.notificationClass)

  if (!optedIn) {
    return {
      userId: input.userId,
      notificationClass: input.notificationClass,
      optedIn: false,
      reason: 'OPTED_OUT',
      targets: [],
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, emailVerified: true },
  })
  const email = user?.email?.trim() || ''

  if (!email) {
    return {
      userId: input.userId,
      notificationClass: input.notificationClass,
      optedIn: true,
      reason: 'EMAIL_MISSING',
      targets: [],
    }
  }

  if (!user?.emailVerified) {
    return {
      userId: input.userId,
      notificationClass: input.notificationClass,
      optedIn: true,
      reason: 'EMAIL_UNVERIFIED',
      targets: [],
    }
  }

  return {
    userId: input.userId,
    notificationClass: input.notificationClass,
    optedIn: true,
    reason: 'READY',
    targets: [{ transport: 'EMAIL', address: email }],
  }
}
