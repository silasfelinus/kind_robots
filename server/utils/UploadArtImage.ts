// /server/utils/UploadArtImage.ts
import path from 'node:path'
import fs from 'node:fs/promises'
import prisma from '~/server/utils/prisma'
import type { ArtImage, Prisma } from '~/prisma/generated/prisma/client'
import { errorHandler } from './error'
import { getImageStorageRoot } from './imageStorageRoot'

export type UploadedImageFile = {
  data: Buffer
  filename: string
}

export type UploadArtImageInput = {
  uploadedFile: UploadedImageFile
  userId: number
  galleryName?: string
  fileType?: string
  fileName?: string | null
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

export async function uploadArtImage(
  input: UploadArtImageInput,
): Promise<ArtImage> {
  try {
    const {
      uploadedFile,
      userId,
      galleryName = 'userUpload',
      fileType = 'png',
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
    } = input

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('A valid authenticated user ID is required.')
    }

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

    let savedImagePath: string | null = null

    if (process.env.APP_ENV !== 'production') {
      const imageRoot = getImageStorageRoot()
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
      artPrompt: cleanText(artPrompt),
      imagePath: savedImagePath,
      path: cleanText(sourcePath),
      promptString: cleanText(promptString),
      negativePrompt: cleanText(negativePrompt),
      sampler: cleanText(sampler),
      seed: cleanNumber(seed),
      steps: cleanNumber(steps),
      cfg: cleanNumber(cfg),
      cfgHalf: Boolean(cfgHalf),
      rarity: cleanNumber(rarity),
      designer: cleanText(designer),
      genres: cleanText(genres),
      isPublic: Boolean(isPublic),
      isMature: Boolean(isMature),
      User: {
        connect: { id: userId },
      },
    }

    return await prisma.artImage.create({
      data: createData,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
