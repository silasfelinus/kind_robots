import { createError } from 'h3'
import { isMaturityRestricted } from './contentAccess'
import prisma from './prisma'

type MaturityParticipant = {
  id: number
  Role: string | null
  UserRoles: Array<{ role: string }>
}

async function loadMaturityParticipant(userId: number): Promise<MaturityParticipant | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      Role: true,
      UserRoles: { select: { role: true } },
    },
  })
}

export async function assertAgentMessagePairMaturity(input: {
  humanUserId: number
  agentProfileId: number
}) {
  const profile = await prisma.agentProfile.findUnique({
    where: { id: input.agentProfileId },
    select: { userId: true },
  })

  if (!profile) {
    throw createError({
      statusCode: 403,
      message: 'Messaging is not available for this participant pair.',
    })
  }

  const [human, operator] = await Promise.all([
    loadMaturityParticipant(input.humanUserId),
    loadMaturityParticipant(profile.userId),
  ])

  if (
    !human ||
    !operator ||
    isMaturityRestricted(human) ||
    isMaturityRestricted(operator)
  ) {
    throw createError({
      statusCode: 403,
      message: 'Messaging is not available for this participant pair.',
    })
  }
}
