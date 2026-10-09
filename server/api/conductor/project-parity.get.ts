import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      conductorSlug: true,
      status: true,
      isActive: true,
    },
    orderBy: { id: 'asc' },
  })

  return {
    success: true,
    data: projects,
  }
})
