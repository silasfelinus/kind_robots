// /server/api/prompts/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  CreationSource,
  type Prisma,
} from '~/prisma/generated/prisma/client'
import { promptResourceSelect } from './selects'

type PromptPatchBody = {
  prompt?: unknown
  artPrompt?: unknown
  creationSource?: unknown
  isMature?: unknown
  isPublic?: unknown
  isActive?: unknown
  botId?: unknown
  artImageId?: unknown
}

const allowedPatchFields = new Set([
  'prompt',
  'artPrompt',
  'creationSource',
  'isMature',
  'isPublic',
  'isActive',
  'botId',
  'artImageId',
])
const validCreationSources = Object.values(CreationSource)

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a non-empty string.`,
    })
  }

  return value.trim()
}

function nullableText(value: unknown, field: string): string | null {
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a string or null.`,
    })
  }

  const text = value.trim()
  return text.length ? text : null
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a boolean.`,
    })
  }

  return value
}

function nullablePositiveId(value: unknown, field: string): number | null {
  if (value === null) return null

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a positive integer or null.`,
    })
  }

  return id
}

function creationSourceValue(value: unknown): CreationSource {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"creationSource" must be a string.',
    })
  }

  const normalized = value.trim().toUpperCase() as CreationSource

  if (!validCreationSources.includes(normalized)) {
    throw createError({
      statusCode: 400,
      message: `"creationSource" must be one of: ${validCreationSources.join(', ')}.`,
    })
  }

  return normalized
}

async function assertRelatedRecordsExist(options: {
  botId?: number | null
  artImageId?: number | null
}) {
  if (options.botId) {
    const bot = await prisma.bot.findUnique({
      where: { id: options.botId },
      select: { id: true },
    })

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot ID not found: ${options.botId}.`,
      })
    }
  }

  if (options.artImageId) {
    const artImage = await prisma.artImage.findUnique({
      where: { id: options.artImageId },
      select: { id: true },
    })

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `ArtImage ID not found: ${options.artImageId}.`,
      })
    }
  }
}

async function buildPromptPatch(body: unknown): Promise<Prisma.PromptUpdateInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Prompt update payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => !allowedPatchFields.has(field),
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Prompt update fields: ${unsupportedFields.join(', ')}.`,
    })
  }

  const input = record as PromptPatchBody
  const data: Prisma.PromptUpdateInput = {}
  let botId: number | null | undefined
  let artImageId: number | null | undefined

  if (input.prompt !== undefined) {
    data.prompt = requiredText(input.prompt, 'prompt')
  }

  if (input.artPrompt !== undefined) {
    data.artPrompt = nullableText(input.artPrompt, 'artPrompt')
  }

  if (input.creationSource !== undefined) {
    data.creationSource = creationSourceValue(input.creationSource)
  }

  if (input.isMature !== undefined) {
    data.isMature = booleanValue(input.isMature, 'isMature')
  }

  if (input.isPublic !== undefined) {
    data.isPublic = booleanValue(input.isPublic, 'isPublic')
  }

  if (input.isActive !== undefined) {
    data.isActive = booleanValue(input.isActive, 'isActive')
  }

  if (input.botId !== undefined) {
    botId = nullablePositiveId(input.botId, 'botId')
    data.Bot = botId ? { connect: { id: botId } } : { disconnect: true }
  }

  if (input.artImageId !== undefined) {
    artImageId = nullablePositiveId(input.artImageId, 'artImageId')
    data.ArtImage = artImageId
      ? { connect: { id: artImageId } }
      : { disconnect: true }
  }

  if (!Object.keys(data).length) {
    throw createError({
      statusCode: 400,
      message: 'No valid Prompt update fields were provided.',
    })
  }

  await assertRelatedRecordsExist({ botId, artImageId })

  return data
}

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid prompt ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingPrompt = await prisma.prompt.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingPrompt) {
      throw createError({
        statusCode: 404,
        message: 'Prompt not found.',
      })
    }

    if (existingPrompt.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this prompt.',
      })
    }

    const body = await readBody<unknown>(event)
    const data = await prisma.prompt.update({
      where: { id },
      data: await buildPromptPatch(body),
      select: promptResourceSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      message: 'Prompt updated successfully.',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || 'Failed to update the prompt.',
      statusCode,
    }
  }
})
