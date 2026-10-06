// /server/utils/artImageBytes.ts
import { promises as fs } from 'node:fs'
import path from 'node:path'
import prisma from '@/server/utils/prisma'
import { getImageStorageRoot } from '@/server/utils/imageStorageRoot'

export type ArtImageBytes = { base64: string; fileType: string }

const EXTENSION_TYPES: Record<string, string> = {
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp',
  '.gif': 'gif',
}

/*
 * An ArtImage's bytes, wherever they live.
 *
 * A finished render starts in ArtImage.imageData, and artImageOffload.ts later
 * moves it to IMAGES_PATH, leaving imagePath `/images/...` and imageData null.
 * Code that read imageData alone stopped seeing the image at that moment: the
 * music-video clip route (t-009) sent an empty first frame for every offloaded
 * scene still, so "animate this scene" lost the scene. This reads the database
 * copy first and falls back to the offloaded file, refusing any path that would
 * escape the storage root.
 */
export async function readArtImageBytes(
  artImageId: number | null | undefined,
): Promise<ArtImageBytes | null> {
  if (!artImageId) return null
  const image = await prisma.artImage.findUnique({
    where: { id: artImageId },
    select: { imageData: true, imagePath: true, fileType: true },
  })
  if (!image) return null

  const storedType = String(image.fileType || 'png').toLowerCase()
  if (image.imageData) {
    const raw = image.imageData
    const comma = raw.indexOf(',')
    const base64 =
      raw.startsWith('data:') && comma >= 0 ? raw.slice(comma + 1) : raw
    return { base64, fileType: storedType === 'jpg' ? 'jpeg' : storedType }
  }

  const served = String(image.imagePath || '').split('?')[0] ?? ''
  if (!served.startsWith('/images/')) return null
  const root = getImageStorageRoot()
  const absolute = path.resolve(root, served.slice('/images/'.length))
  if (absolute !== root && !absolute.startsWith(root + path.sep)) return null
  try {
    const bytes = await fs.readFile(absolute)
    const fileType =
      EXTENSION_TYPES[path.extname(absolute).toLowerCase()] ?? storedType
    return { base64: bytes.toString('base64'), fileType }
  } catch {
    return null
  }
}

/** The bytes as a data URL, or '' when there are none (the ComfyUI input shape). */
export async function readArtImageDataUrl(
  artImageId: number | null | undefined,
): Promise<string> {
  const bytes = await readArtImageBytes(artImageId)
  return bytes ? `data:image/${bytes.fileType};base64,${bytes.base64}` : ''
}
