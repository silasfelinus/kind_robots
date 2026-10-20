// server/api/art/image/[id].delete.ts
//
// "Delete" moves the image into the Gallery's Recycle Bin (isActive = false,
// archive files quarantined). Erasing it for good is POST
// /api/art/recycle-bin/purge, which only accepts what is already in the bin.
import { defineEventHandler, createError, type H3Event } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { recycleArtImage } from '../../../utils/artRecycleBin'

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

    const result = await recycleArtImage(imageId, user)

    event.node.res.statusCode = 200

    return {
      success: true,
      message: result.message,
      data: { id: imageId, recycled: true },
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
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})