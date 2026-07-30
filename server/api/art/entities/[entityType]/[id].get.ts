// /server/api/art/entities/[entityType]/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  listEntityArtHistory,
  resolveEntityArtTarget,
} from '~/server/utils/entityArt'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const entityType = getRouterParam(event, 'entityType')
    const id = getRouterParam(event, 'id')

    // Resolve through the first supported field only to validate type, id, and access.
    const defaultField =
      entityType === 'bot' ? 'avatarImage' : 'imagePath'
    const target = await resolveEntityArtTarget(
      prisma,
      entityType,
      id,
      defaultField,
      auth,
    )
    const history = await listEntityArtHistory(
      prisma,
      target.entityType,
      target.entityId,
    )

    return {
      success: true,
      message: `${target.entityType} artwork loaded.`,
      data: {
        entity: target.record,
        history,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load entity artwork.',
      data: null,
      statusCode,
    }
  }
})
