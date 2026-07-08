// server/api/art/image/[id].delete.ts
import { defineEventHandler, createError, type H3Event } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'

type DeleteUser = {
  id: number
  isAdmin: boolean
}

async function requireDeleteUser(event: H3Event): Promise<DeleteUser> {
  // Same machine auth as the rest of the art API (JWT / user apiKey /
  // beta-admin token). Throws 401 when no valid credential is present.
  const auth = await requireMachineUser(event)

  return {
    id: auth.user.id,
    isAdmin: auth.isAdmin,
  }
}

export default defineEventHandler(async (event) => {
  let imageId: number | null = null

  try {
    imageId = Number(event.context.params?.id)

    if (!Number.isInteger(imageId) || imageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Image ID. It must be a positive integer.',
      })
    }

    const user = await requireDeleteUser(event)

    const artImage = await prisma.artImage.findUnique({
      where: {
        id: imageId,
      },
      select: {
        userId: true,
      },
    })

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `Art image with ID ${imageId} does not exist.`,
      })
    }

    if (!user.isAdmin && artImage.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this art image.',
      })
    }

    await prisma.artImage.delete({
      where: {
        id: imageId,
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: user.isAdmin
        ? `Art Image with ID ${imageId} deleted successfully by admin.`
        : `Art image ${imageId} deleted successfully.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete art image with ID ${imageId ?? 'unknown'}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})