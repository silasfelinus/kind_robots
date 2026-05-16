// /server/api/art/image/index.post.ts
import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { uploadArtImage } from '~/server/utils/UploadArtImage'
import { errorHandler } from '~/server/utils/error'
import prisma from '~/server/utils/prisma'

type MultipartField = {
  name?: string
  filename?: string
  type?: string
  data?: Buffer
}

function getField(parts: MultipartField[], name: string): string | null {
  const part = parts.find((item) => item.name === name)

  if (!part?.data) return null

  const value = part.data.toString('utf8').trim()

  return value || null
}

function getNumberField(parts: MultipartField[], name: string): number | null {
  const raw = getField(parts, name)

  if (!raw) return null

  const value = Number(raw)

  return Number.isInteger(value) && value > 0 ? value : null
}

function getOptionalNumberField(
  parts: MultipartField[],
  name: string,
): number | null {
  const raw = getField(parts, name)

  if (!raw) return null

  const value = Number(raw)

  return Number.isFinite(value) ? value : null
}

function getBooleanField(parts: MultipartField[], name: string): boolean {
  const raw = getField(parts, name)

  if (!raw) return false

  return ['true', '1', 'yes', 'on'].includes(raw.toLowerCase())
}

function getNumberListField(parts: MultipartField[], name: string): number[] {
  const raw = getField(parts, name)

  if (!raw) return []

  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0)
}

async function validateUserToken(userId: number, token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { apiKey: token },
    select: { id: true },
  })

  if (!user || user.id !== userId) {
    throw createError({
      statusCode: 403,
      message: 'Token does not match user ID',
    })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const authorizationHeader = event.node.req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token required in the format "Bearer <token>"',
      })
    }

    const token = authorizationHeader.split(' ')[1]?.trim()

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is empty',
      })
    }

    const parts = (await readMultipartFormData(event)) as
      | MultipartField[]
      | undefined

    if (!parts?.length) {
      throw createError({
        statusCode: 400,
        message: 'Multipart form data is required',
      })
    }

    const imagePart = parts.find(
      (part) => part.name === 'image' && part.data?.length,
    )

    if (!imagePart?.data?.length) {
      throw createError({
        statusCode: 400,
        message: 'Missing image file',
      })
    }

    const userId = getNumberField(parts, 'userId')

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing userId',
      })
    }

    await validateUserToken(userId, token)

    const galleryName = getField(parts, 'galleryName') || 'userUpload'
    const galleryId = getNumberField(parts, 'galleryId') || 21
    const fileType =
      getField(parts, 'fileType') || imagePart.type || 'image/png'
    const fileName =
      getField(parts, 'fileName') || imagePart.filename || 'upload'

    const artImage = await uploadArtImage({
      uploadedFile: {
        data: imagePart.data,
        filename: fileName,
      },
      galleryName,
      galleryId,
      userId,
      fileType,
      fileName,
      artCollectionId: getNumberField(parts, 'artCollectionId'),
      artCollectionIds: getNumberListField(parts, 'artCollectionIds'),
      rarity: getOptionalNumberField(parts, 'rarity'),
      path: getField(parts, 'path'),
      promptString: getField(parts, 'promptString'),
      artPrompt: getField(parts, 'artPrompt'),
      negativePrompt: getField(parts, 'negativePrompt'),
      sampler: getField(parts, 'sampler'),
      seed: getOptionalNumberField(parts, 'seed'),
      steps: getOptionalNumberField(parts, 'steps'),
      cfg: getOptionalNumberField(parts, 'cfg'),
      cfgHalf: getBooleanField(parts, 'cfgHalf'),
      designer: getField(parts, 'designer'),
      genres: getField(parts, 'genres'),
      isPublic: getBooleanField(parts, 'isPublic'),
      isMature: getBooleanField(parts, 'isMature'),
      botId: getNumberField(parts, 'botId'),
      characterId: getNumberField(parts, 'characterId'),
      pitchId: getNumberField(parts, 'pitchId'),
      promptId: getNumberField(parts, 'promptId'),
      resourceId: getNumberField(parts, 'resourceId'),
      rewardId: getNumberField(parts, 'rewardId'),
      dreamId: getNumberField(parts, 'dreamId'),
      scenarioId: getNumberField(parts, 'scenarioId'),
      tagIds: getNumberListField(parts, 'tagIds'),
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Image uploaded',
      data: artImage,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message,
    }
  }
})
