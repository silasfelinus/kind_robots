// /server/api/art/queue/groups/priority.post.ts
//
// Admin action: set one priority on every PENDING ArtJob in a named group
// (see utils/artJobQueueGroups.ts), e.g. send all "hybridizer" jobs to the
// back. Same range and permission as the single-job priority endpoint. The
// update re-checks PENDING so a job claimed mid-request is left alone.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import { loadPendingArtJobGroupRows } from '../../../../utils/artJobQueueGroupRows'
import { parseArtJobPriority } from '~/utils/artJobPriority'
import {
  artJobIdsInGroup,
  parseArtJobGroupName,
} from '~/utils/artJobQueueGroups'

type GroupPriorityBody = {
  group?: unknown
  priority?: unknown
}

const UPDATE_CHUNK_SIZE = 500

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to prioritize jobs.',
      })
    }

    const body = (await readBody(event).catch(
      () => null,
    )) as GroupPriorityBody | null
    const group = parseArtJobGroupName(body?.group)
    if (!group.ok) {
      throw createError({ statusCode: 400, message: group.message })
    }
    const parsed = parseArtJobPriority(body?.priority)
    if (!parsed.ok) {
      throw createError({ statusCode: 400, message: parsed.message })
    }

    const ids = artJobIdsInGroup(await loadPendingArtJobGroupRows(), group.name)

    if (!ids.length) {
      throw createError({
        statusCode: 404,
        message: `No PENDING jobs in group "${group.name}".`,
      })
    }

    let updated = 0
    for (let start = 0; start < ids.length; start += UPDATE_CHUNK_SIZE) {
      const result = await prisma.artJob.updateMany({
        where: {
          id: { in: ids.slice(start, start + UPDATE_CHUNK_SIZE) },
          status: 'PENDING',
        },
        data: { priority: parsed.priority },
      })
      updated += result.count
    }

    return {
      success: true,
      message: `Set ${updated} "${group.name}" job(s) to priority ${parsed.priority}.`,
      data: { group: group.name, priority: parsed.priority, updated },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to update art job group priority.',
      statusCode,
    }
  }
})
