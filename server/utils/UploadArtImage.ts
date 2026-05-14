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

export type UploadArtImageDirectModel =
  | 'bot'
  | 'character'
  | 'pitch'
  | 'prompt'
  | 'resource'
  | 'reward'

export type UploadArtImageInput = {
  uploadedFile: UploadedImageFile
  galleryName?: string
  userId?: number
  galleryId?: number
  fileType?: string
  artCollectionId?: number | null
  artCollectionIds?: number[]
  fileName?: string | null
  imagePath?: string | null
  rarity?: number | null
  path?: string | null
  promptString?: string | null
  artPrompt?: string | null
  negativePrompt?: string | null
  sampler?: string | null
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  cfgHalf?: boolean | null
  designer?: string | null
  genres?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  botId?: number | null
  characterId?: number | null
  pitchId?: number | null
  promptId?: number | null
  resourceId?: number | null
  rewardId?: number | null
  dreamId?: number | null
  scenarioId?: number | null
  tagIds?: number[]
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

function cleanPositiveId(value?: number | null): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : null
}

function cleanPositiveIds(values?: number[]): number[] {
  if (!Array.isArray(values)) return []

  return [...new Set(values)]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
}

function connectById(id?: number | null) {
  const cleanId = cleanPositiveId(id)
  return cleanId ? { connect: { id: cleanId } } : undefined
}

function connectMany(ids?: number[]) {
  const cleanIds = cleanPositiveIds(ids)

  return cleanIds.length
    ? {
        connect: cleanIds.map((id) => ({ id })),
      }
    : undefined
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
      artCollectionIds = [],
      rarity = null,
      path: sourcePath = null,
      promptString = null,
      artPrompt = null,
      negativePrompt = null,
      sampler = null,
      seed = null,
      steps = null,
      cfg = null,
      cfgHalf = null,
      designer = null,
      genres = null,
      isPublic = false,
      isMature = false,
      botId = null,
      characterId = null,
      pitchId = null,
      promptId = null,
      resourceId = null,
      rewardId = null,
      dreamId = null,
      scenarioId = null,
      tagIds = [],
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

    const collectionIds = cleanPositiveIds(
      [artCollectionId, ...artCollectionIds].filter(
        (id): id is number => typeof id === 'number',
      ),
    )

    const createData: Prisma.ArtImageCreateInput = {
      imageData: uploadedFile.data.toString('base64'),
      fileName: finalFileName,
      fileType: normalizedFileType,
      artPrompt: cleanText(artPrompt),
      imagePath: savedImagePath,
      rarity: cleanNumber(rarity),
      path: cleanText(sourcePath),
      promptString: cleanText(promptString),
      negativePrompt: cleanText(negativePrompt),
      sampler: cleanText(sampler),
      seed: cleanNumber(seed),
      steps: cleanNumber(steps),
      cfg: cleanNumber(cfg),
      cfgHalf: Boolean(cfgHalf),
      designer: cleanText(designer),
      genres: cleanText(genres),
      isPublic: Boolean(isPublic),
      isMature: Boolean(isMature),
      Gallery: connectById(galleryId),
      User: connectById(userId),
      Bot: connectById(botId),
      Character: connectById(characterId),
      Pitch: connectById(pitchId),
      Prompt: connectById(promptId),
      Resource: connectById(resourceId),
      Reward: connectById(rewardId),
      Dreams: connectMany(dreamId ? [dreamId] : []),
      Scenarios: connectMany(scenarioId ? [scenarioId] : []),
      Tags: connectMany(tagIds),
      ArtCollections: connectMany(collectionIds),
    }

    return await prisma.artImage.create({
      data: createData,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
