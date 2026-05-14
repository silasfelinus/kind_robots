// /server/api/utils/UploadArtImage.ts
import path from 'path'
import fs from 'fs/promises'
import prisma from '~/server/utils/prisma'
import type { ArtImage, Prisma } from '~/prisma/generated/prisma/client'
import { errorHandler } from './error'

export type UploadedImageFile = {
  data: Buffer
  filename: string
}

export type UploadArtImageInput = {
  uploadedFile: UploadedImageFile
  galleryName?: string
  userId?: number
  galleryId?: number
  fileType?: string
  artCollectionId?: number | null
  fileName?: string | null
  imagePath?: string | null
  rarity?: number | null
  path?: string | null
  promptString?: string | null
  negativePrompt?: string | null
  checkpoint?: string | null
  checkpointResourceId?: number | null
  sampler?: string | null
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  cfgHalf?: boolean | null
  designer?: string | null
  genres?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  serverId?: number | null
  serverName?: string | null
  serverUrl?: string | null
  botId?: number | null
  componentId?: number | null
  milestoneId?: number | null
  pitchId?: number | null
  promptId?: number | null
  resourceId?: number | null
  rewardId?: number | null
  chatId?: number | null
  characterId?: number | null
  butterflyId?: number | null
}

const validExtensions = ['png', 'jpeg', 'jpg', 'webp']

function normalizeFileType(fileType = 'png'): string {
  return fileType.replace('image/', '').replace('.', '').toLowerCase()
}

function sanitizeSlug(value: string): string {
  return value
    .trim()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function cleanText(value?: string | null): string | null {
  const text = value?.trim()
  return text ? text : null
}

function cleanNumber(value?: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function connectById(id?: number | null) {
  return cleanNumber(id) ? { connect: { id: Number(id) } } : undefined
}

export async function uploadArtImage(
  input: UploadArtImageInput,
): Promise<ArtImage> {
  try {
    const {
      uploadedFile,
      galleryName = 'userUpload',
      userId = 10,
      galleryId = 21,
      fileType = 'png',
      artCollectionId = null,
      rarity = null,
      path: sourcePath = null,
      promptString = null,
      negativePrompt = null,
      checkpoint = null,
      checkpointResourceId = null,
      sampler = null,
      seed = null,
      steps = null,
      cfg = null,
      cfgHalf = null,
      designer = null,
      genres = null,
      isPublic = false,
      isMature = false,
      serverId = null,
      serverName = null,
      serverUrl = null,
      botId = null,
      componentId = null,
      milestoneId = null,
      pitchId = null,
      promptId = null,
      resourceId = null,
      rewardId = null,
      chatId = null,
      characterId = null,
      butterflyId = null,
    } = input

    const normalizedFileType = normalizeFileType(fileType)

    if (!validExtensions.includes(normalizedFileType)) {
      throw new Error(
        `Unsupported file type: ${fileType}. Accepted types are ${validExtensions.join(', ')}`,
      )
    }

    if (!uploadedFile?.data?.length) {
      throw new Error('No image data received.')
    }

    const safeGalleryName = sanitizeSlug(galleryName) || 'userUpload'
    const originalName = sanitizeSlug(input.fileName || uploadedFile.filename)
    const timestamp = Date.now()
    const finalFileName = `${safeGalleryName}-${originalName || 'image'}-${timestamp}.${normalizedFileType}`

    let savedImagePath = cleanText(input.imagePath)

    if (process.env.APP_ENV !== 'production') {
      const imageRoot = process.env.IMAGES_PATH || './public/images'
      const dirPath = path.join(imageRoot, safeGalleryName)
      const filePath = path.join(dirPath, finalFileName)

      try {
        await fs.access(dirPath)
      } catch {
        await fs.mkdir(dirPath, { recursive: true })
      }

      await fs.writeFile(filePath, uploadedFile.data)
      savedImagePath = `/images/${safeGalleryName}/${finalFileName}`
    }

    const createData: Prisma.ArtImageCreateInput = {
      imageData: uploadedFile.data.toString('base64'),
      fileName: finalFileName,
      fileType: normalizedFileType,
      imagePath: savedImagePath,
      rarity: cleanNumber(rarity),
      path: cleanText(sourcePath),
      promptString: cleanText(promptString),
      negativePrompt: cleanText(negativePrompt),
      checkpoint: cleanText(checkpoint),
      sampler: cleanText(sampler),
      seed: cleanNumber(seed),
      steps: cleanNumber(steps),
      cfg: cleanNumber(cfg),
      cfgHalf: Boolean(cfgHalf),
      designer: cleanText(designer),
      genres: cleanText(genres),
      isPublic: Boolean(isPublic),
      isMature: Boolean(isMature),
      serverName: cleanText(serverName),
      serverUrl: cleanText(serverUrl),
      Gallery: connectById(galleryId),
      User: connectById(userId),
      Server: connectById(serverId),
      CheckpointResource: connectById(checkpointResourceId),
      Bot: connectById(botId),
      Component: connectById(componentId),
      Milestone: connectById(milestoneId),
      Pitch: connectById(pitchId),
      Prompt: connectById(promptId),
      Resource: connectById(resourceId),
      Reward: connectById(rewardId),
      Chat: connectById(chatId),
      Character: connectById(characterId),
      ArtCollections: cleanNumber(artCollectionId)
        ? {
            connect: {
              id: Number(artCollectionId),
            },
          }
        : undefined,
    }

    const data = await prisma.artImage.create({
      data: createData,
    })

    return data
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
