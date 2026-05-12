// /server/api/chatgpt/utils/assetService.ts
import prisma from '../../../utils/prisma'
import {
  type ChatGptActionHeaders,
  fail,
  requireUser,
  resolveChatGptSession,
} from './access'
import { isRecord } from './validate'

type AssetUploadInput = {
  label?: unknown
  role?: unknown
  imageData?: unknown
  imageUrl?: unknown
  allowImageUrlOnly?: unknown
  fileName?: unknown
  fileType?: unknown
  prompt?: unknown
  imagePrompt?: unknown
  negativePrompt?: unknown
  galleryId?: unknown
  artCollectionId?: unknown
  pitchId?: unknown
  promptId?: unknown
  isPublic?: unknown
  public?: unknown
  isMature?: unknown
  mature?: unknown
  checkpoint?: unknown
  sampler?: unknown
  seed?: unknown
  steps?: unknown
  cfg?: unknown
  cfgHalf?: unknown
  createArt?: unknown
}

export type UploadedChatGptAsset = {
  label: string
  role: string
  artImageId: number | null
  artId: number | null
  galleryId: number | null
  artCollectionId: number | null
  imagePath: string
  fileName: string
  fileType: string
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function asNumber(value: unknown): number | undefined {
  const numberValue = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : undefined
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    return ['true', 'yes', '1', 'public'].includes(value.toLowerCase())
  }

  return fallback
}

function normalizeImageData(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return ''

  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/i)

  if (dataUrlMatch?.[2]) {
    return dataUrlMatch[2].trim()
  }

  return trimmed
}

function getDelegate(name: string) {
  const delegate = (prisma as any)[name]

  if (!delegate) {
    fail(`Prisma delegate not found: ${name}`, 500)
  }

  return delegate
}

function cleanData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  )
}

async function updateArtImageWithArtId(artImageId: number, artId: number) {
  const artImage = getDelegate('artImage')

  try {
    await artImage.update({
      where: { id: artImageId },
      data: { artId },
    })
  } catch {}
}

export async function attachArtToCollection(opts: {
  artId: number
  artCollectionId?: number | null
}) {
  if (!opts.artCollectionId) return false

  const artCollection = (prisma as any).artCollection

  if (!artCollection) return false

  const attempts = [
    { Art: { connect: { id: opts.artId } } },
    { Arts: { connect: { id: opts.artId } } },
    { art: { connect: { id: opts.artId } } },
    { arts: { connect: { id: opts.artId } } },
  ]

  for (const data of attempts) {
    try {
      await artCollection.update({
        where: { id: opts.artCollectionId },
        data,
      })

      return true
    } catch {}
  }

  return false
}

export async function uploadChatGptAsset(
  rawInput: Record<string, unknown>,
  headers: ChatGptActionHeaders,
): Promise<{ ok: true; data: UploadedChatGptAsset }> {
  if (!isRecord(rawInput)) {
    fail('Input must be an object', 400)
  }

  const session = await resolveChatGptSession(headers)
  const user = requireUser(session)
  const input = rawInput as AssetUploadInput

  const label = asString(input.label, `asset-${Date.now()}`)
  const role = asString(input.role, 'asset')
  const imageData = normalizeImageData(asString(input.imageData))
  const imageUrl = asString(input.imageUrl)
  const allowImageUrlOnly = asBoolean(input.allowImageUrlOnly, false)
  const fileName = asString(input.fileName, `${label}.webp`)
  const fileType = asString(input.fileType, 'image/webp')
  const prompt = asString(input.prompt) || asString(input.imagePrompt)
  const negativePrompt = asString(input.negativePrompt)
  const galleryId = asNumber(input.galleryId) ?? null
  const artCollectionId = asNumber(input.artCollectionId) ?? null
  const pitchId = asNumber(input.pitchId)
  const promptId = asNumber(input.promptId)
  const isPublic = asBoolean(input.isPublic ?? input.public, true)
  const isMature = asBoolean(input.isMature ?? input.mature, false)
  const createArt = asBoolean(input.createArt, true)
  const checkpoint = asString(input.checkpoint)
  const sampler = asString(input.sampler)
  const seed = asNumber(input.seed)
  const steps = asNumber(input.steps)
  const cfg = asNumber(input.cfg)
  const cfgHalf = asBoolean(input.cfgHalf, false)

  if (!imageData && !allowImageUrlOnly) {
    fail(
      'ChatGPT asset upload requires imageData for durable ArtImage storage',
      400,
    )
  }

  if (!imageData && allowImageUrlOnly && !imageUrl) {
    fail(
      'Asset requires imageData, or imageUrl when allowImageUrlOnly is true',
      400,
    )
  }

  const artImage = getDelegate('artImage')
  const art = getDelegate('art')

  let artImageId: number | null = null
  let artId: number | null = null
  const imagePath = imageUrl || ''

  if (imageData) {
    const createdArtImage = await artImage.create({
      data: cleanData({
        imageData,
        fileName,
        fileType,
        galleryId,
        userId: user.id,
      }),
    })

    artImageId = createdArtImage.id
  }

  if (createArt) {
    const createdArt = await art.create({
      data: cleanData({
        promptString: prompt || label,
        negativePrompt: negativePrompt || undefined,
        checkpoint: checkpoint || undefined,
        sampler: sampler || undefined,
        seed,
        steps,
        cfg,
        cfgHalf,
        pitchId,
        promptId,
        galleryId: galleryId ?? undefined,
        artImageId: artImageId ?? undefined,
        imagePath: imagePath || undefined,
        path: imagePath || undefined,
        isPublic,
        isMature,
        userId: user.id,
        designer: user.designerName || user.username,
      }),
    })

    const createdArtId = Number(createdArt.id)

    if (!Number.isFinite(createdArtId) || createdArtId <= 0) {
      fail('Created Art record did not return a valid id', 500)
    }

    artId = createdArtId

    if (artImageId) {
      await updateArtImageWithArtId(artImageId, createdArtId)
    }

    if (artCollectionId) {
      await attachArtToCollection({
        artId: createdArtId,
        artCollectionId,
      })
    }
  }

  return {
    ok: true,
    data: {
      label,
      role,
      artImageId,
      artId,
      galleryId,
      artCollectionId,
      imagePath,
      fileName,
      fileType,
    },
  }
}
