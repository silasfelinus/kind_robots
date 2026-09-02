import { createError, defineEventHandler, readBody } from 'h3'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'

type ProfileBody = {
  avatarImage?: unknown
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

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const body = (await readBody<ProfileBody>(event)) ?? {}
    const avatarImage = optionalText(body.avatarImage, 'avatarImage', 764)
    const bio = optionalText(body.bio, 'bio', 5000)
    const designerName = optionalText(body.designerName, 'designerName', 120)

    const data: { avatarImage?: string | null; bio?: string | null; designerName?: string | null } = {}
    if (avatarImage !== undefined) data.avatarImage = avatarImage
    if (bio !== undefined) data.bio = bio
    if (designerName !== undefined) data.designerName = designerName
    if (!Object.keys(data).length) {
      throw createError({ statusCode: 400, message: 'No supported profile fields were provided.' })
    }

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data,
      select: {
        id: true,
        username: true,
        avatarImage: true,
        bio: true,
        designerName: true,
      },
    })
    return { success: true, user }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to update community profile.' }
  }
})
