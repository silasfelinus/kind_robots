import { createError, defineEventHandler, readBody } from 'h3'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'
import { resolveRainbowAvatar } from '@/server/utils/rainbowDirectory'

type ProfileBody = {
  avatarImage?: unknown
  artImageId?: unknown
  bio?: unknown
  designerName?: unknown
}

function optionalText(value: unknown, label: string, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${label} must be text.` })
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    throw createError({ statusCode: 400, message: `${label} must be ${max} characters or fewer.` })
  }
  return trimmed || null
}

function optionalArtImageId(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'artImageId must be a positive image id.' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const body = (await readBody<ProfileBody>(event)) ?? {}
    const avatarImage = optionalText(body.avatarImage, 'avatarImage', 764)
    const artImageId = optionalArtImageId(body.artImageId)
    const bio = optionalText(body.bio, 'bio', 5000)
    const designerName = optionalText(body.designerName, 'designerName', 120)

    const data: {
      avatarImage?: string | null
      artImageId?: number | null
      bio?: string | null
      designerName?: string | null
    } = {}
    if (avatarImage !== undefined) data.avatarImage = avatarImage
    if (artImageId !== undefined) data.artImageId = artImageId
    if (bio !== undefined) data.bio = bio
    if (designerName !== undefined) data.designerName = designerName

    if (!Object.keys(data).length) {
      throw createError({ statusCode: 400, message: 'No supported profile fields were provided.' })
    }

    if (artImageId !== undefined && artImageId !== null) {
      const image = await prisma.artImage.findFirst({
        where: {
          id: artImageId,
          userId: auth.user.id,
          isActive: true,
          isMature: false,
        },
        select: { id: true },
      })
      if (!image) {
        throw createError({
          statusCode: 400,
          message: 'Avatar must be one of your active non-mature images.',
        })
      }

      // A Rainbow directory avatar is a public profile asset. Publish only the
      // selected image, then link it by ArtImage id just like Kind Robots' own
      // avatar picker. Never copy base64 into User.avatarImage.
      await prisma.artImage.update({
        where: { id: image.id },
        data: { isPublic: true, isMature: false },
      })
      data.avatarImage = null
    }

    if (artImageId === null) data.avatarImage = avatarImage ?? null

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data,
      select: {
        id: true,
        username: true,
        avatarImage: true,
        artImageId: true,
        bio: true,
        designerName: true,
      },
    })
    return {
      success: true,
      user: {
        ...user,
        avatarImage: resolveRainbowAvatar(user),
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to update community profile.' }
  }
})
