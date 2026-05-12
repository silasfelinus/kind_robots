// /server/api/chatgpt/utils/collectionService.ts
import prisma from '../../../utils/prisma'
import {
  type ChatGptActionHeaders,
  fail,
  requireUser,
  resolveChatGptSession,
} from './access'
import { isRecord } from './validate'

export type CreatedArtCollectionResult = {
  id: number
  name: string
  description: string
  isPublic: boolean
  isMature: boolean
  reused: boolean
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

function getArtCollectionDelegate() {
  const artCollection = (prisma as any).artCollection

  if (!artCollection) {
    fail('Prisma delegate not found: artCollection', 500)
  }

  return artCollection
}

function cleanData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  )
}

async function createCollectionWithFallbacks(
  data: Record<string, unknown>,
): Promise<any> {
  const artCollection = getArtCollectionDelegate()
  const attempts = [
    data,
    cleanData({
      name: data.name,
      description: data.description,
      userId: data.userId,
      isPublic: data.isPublic,
      isMature: data.isMature,
    }),
    cleanData({
      title: data.name,
      description: data.description,
      userId: data.userId,
      isPublic: data.isPublic,
      isMature: data.isMature,
    }),
    cleanData({
      label: data.name,
      description: data.description,
      userId: data.userId,
      isPublic: data.isPublic,
      isMature: data.isMature,
    }),
    cleanData({
      name: data.name,
      userId: data.userId,
    }),
  ]

  let lastError: unknown = null

  for (const attempt of attempts) {
    try {
      return await artCollection.create({
        data: attempt,
      })
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

export async function createArtCollectionFromAction(
  rawInput: Record<string, unknown>,
  headers: ChatGptActionHeaders,
): Promise<{ ok: true; data: CreatedArtCollectionResult }> {
  if (!isRecord(rawInput)) {
    fail('Input must be an object', 400)
  }

  const session = await resolveChatGptSession(headers)
  const user = requireUser(session)
  const artCollection = getArtCollectionDelegate()

  const existingId = asNumber(rawInput.id ?? rawInput.artCollectionId)

  if (existingId) {
    const existing = await artCollection.findUnique({
      where: { id: existingId },
    })

    if (!existing) {
      fail('ArtCollection not found', 404)
    }

    return {
      ok: true,
      data: {
        id: existing.id,
        name:
          existing.name ||
          existing.title ||
          existing.label ||
          `Collection ${existing.id}`,
        description: existing.description || '',
        isPublic: Boolean(existing.isPublic),
        isMature: Boolean(existing.isMature),
        reused: true,
      },
    }
  }

  const name =
    asString(rawInput.name) ||
    asString(rawInput.title) ||
    asString(rawInput.label) ||
    `ChatGPT Bundle ${Date.now()}`

  const description = asString(rawInput.description)
  const isPublic = asBoolean(rawInput.isPublic ?? rawInput.public, true)
  const isMature = asBoolean(rawInput.isMature ?? rawInput.mature, false)

  const created = await createCollectionWithFallbacks(
    cleanData({
      name,
      title: name,
      label: name,
      description,
      userId: user.id,
      isPublic,
      isMature,
    }),
  )

  return {
    ok: true,
    data: {
      id: created.id,
      name: created.name || created.title || created.label || name,
      description: created.description || description,
      isPublic: Boolean(created.isPublic ?? isPublic),
      isMature: Boolean(created.isMature ?? isMature),
      reused: false,
    },
  }
}
