// /server/api/server/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  canReadServer,
  getOptionalAuthUser,
  safeServers,
} from './../../utils/serverApi'

export default defineEventHandler(async (event) => {
  try {
    const user = await getOptionalAuthUser(event)

    const servers = await prisma.server.findMany({
      where: user?.isAdmin
        ? undefined
        : {
            OR: [
              { isPublic: true },
              { isOfficial: true },
              { isDefault: true },
              ...(user ? [{ userId: user.id }] : []),
            ],
          },
      orderBy: [
        { isOfficial: 'desc' },
        { isDefault: 'desc' },
        { sortOrder: 'asc' },
        { title: 'asc' },
      ],
    })

    const readableServers = servers.filter((server) =>
      canReadServer(server, user),
    )

    return {
      success: true,
      message: 'Servers fetched successfully.',
      data: safeServers(readableServers, user),
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to fetch servers.',
      data: [],
    }
  }
})
