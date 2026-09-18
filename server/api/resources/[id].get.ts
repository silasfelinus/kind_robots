// /server/api/resources/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import { resourceGallerySelect } from './gallery'
import { canView, viewerShowsMature } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  const resourceId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'Invalid ID format. ID must be a positive integer.',
        data: null,
        statusCode: 400,
      }
    }

    const auth = await getOptionalApiUser(event)
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, isActive: true },
      select: resourceGallerySelect,
    })

    if (!resource) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Resource not found.',
        data: null,
        statusCode: 404,
      }
    }

    const isAdmin = auth?.isAdmin ?? false

    // canView() covers own/admin/an active RESOURCE Grant; `isPublic` here
    // is the resource's plain public flag, same gate resourceGalleryWhere()
    // used to apply — a Grant recipient of an otherwise-private resource can
    // now see it too (kind-robots/t-062, SHARING-SPEC.md).
    const allowed = await canView(
      { id: resource.id, userId: resource.userId, isPublic: resource.isPublic },
      'RESOURCE',
      auth ? { id: auth.user.id, isAdmin } : null,
    )

    /*
     * One rule, no admin carve-out: logged in, not a CHILD, opted in. The
     * `!isAdmin` bypass here meant an admin with their own maturity toggle OFF
     * still received mature resources -- privilege standing in for preference.
     * An admin who wants to see mature content turns the toggle on like anyone.
     */
    const matureBlocked = resource.isMature && !viewerShowsMature(auth?.user)

    if (!allowed || matureBlocked) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Resource not found.',
        data: null,
        statusCode: 404,
      }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Resource retrieved successfully.',
      data: resource,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to retrieve resource.',
      data: null,
      statusCode,
    }
  }
})
