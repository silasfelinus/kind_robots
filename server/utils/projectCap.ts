// /server/utils/projectCap.ts
import { createError } from 'h3'
import prisma from './prisma'

export const FREE_PROJECT_LIMIT = 2

/**
 * Throws HTTP 403 if the user has reached the free project cap.
 * No-op for admins (id=1 or Role=ADMIN), FAMILY role, and active members.
 */
export async function enforceProjectCap(input: {
  userId: number
  userRole: string | null | undefined
  isAdmin: boolean
}): Promise<void> {
  if (input.isAdmin) return
  const role = String(input.userRole ?? '').toUpperCase()
  if (role === 'ADMIN' || role === 'FAMILY') return

  const userRecord = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { isMember: true, memberUntil: true },
  })

  const isMemberActive =
    userRecord?.isMember === true &&
    (!userRecord.memberUntil || userRecord.memberUntil > new Date())

  if (isMemberActive) return

  const activeCount = await prisma.project.count({
    where: {
      userId: input.userId,
      status: { in: ['ACTIVE', 'PAUSED'] },
      isActive: true,
    },
  })

  if (activeCount >= FREE_PROJECT_LIMIT) {
    throw createError({
      statusCode: 403,
      message: `Free accounts are limited to ${FREE_PROJECT_LIMIT} active projects. Archive or complete a project to make room, or upgrade to a membership.`,
    })
  }
}
