// server/api/art/image/[id].delete.ts
import { defineEventHandler, createError, type H3Event } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'

type ValidatedUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  isAdmin?: boolean | null
}

type DeleteUser = {
  id: number
  isAdmin: boolean
  role: string
}

function isAdminUser(user: ValidatedUser | null | undefined): boolean {
  if (!user) return false

  const role = String(user.Role || user.role || '').toLowerCase()

  return Boolean(user.isAdmin || role === 'admin' || role === 'system')
}

async function requireDeleteUser(event: H3Event): Promise<DeleteUser> {
  const auth = await validateApiKey(event)
  const user = auth.user as ValidatedUser | null | undefined

  if (!auth.isValid || typeof user?.id !== 'number') {
    throw createError({
      statusCode: 401,
      message: 'Valid authorization token required.',
    })
  }

  return {
    id: Number(user.id),
    isAdmin: isAdminUser(user),
    role: String(user.Role || user.role || ''),
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