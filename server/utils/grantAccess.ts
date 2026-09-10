import { createError } from 'h3'
import type { GrantSubject } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

export type GrantActor = {
  id: number
  isAdmin: boolean
}

export async function assertCanManageGrantSubject(
  actor: GrantActor,
  subjectType: GrantSubject,
  subjectId: number,
): Promise<void> {
  if (actor.isAdmin) return

  let ownerId: number | null | undefined

  if (subjectType === 'PROJECT') {
    ownerId = (
      await prisma.project.findUnique({
        where: { id: subjectId },
        select: { userId: true },
      })
    )?.userId
  } else if (subjectType === 'RESOURCE') {
    ownerId = (
      await prisma.resource.findUnique({
        where: { id: subjectId },
        select: { userId: true },
      })
    )?.userId
  } else if (subjectType === 'PACK') {
    ownerId = (
      await prisma.pack.findUnique({
        where: { id: subjectId },
        select: { ownerId: true },
      })
    )?.ownerId
  } else {
    throw createError({ statusCode: 400, message: 'Unsupported grant subject type.' })
  }

  if (ownerId === undefined) {
    throw createError({ statusCode: 404, message: 'Grant subject not found.' })
  }

  if (ownerId !== actor.id) {
    throw createError({ statusCode: 403, message: 'Only the subject owner or an admin may manage grants.' })
  }
}
