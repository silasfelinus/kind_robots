// /server/api/challenges/[slug]/submissions.post.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'

type SubmissionBody = {
  contenderSlug?: unknown
  variantKey?: unknown
  promptUsed?: unknown
  settings?: unknown
  randomSelections?: unknown
  agentModel?: unknown
  outputText?: unknown
  artImageId?: unknown
  characterId?: unknown
  scenarioId?: unknown
}

function optionalString(value: unknown, maxLength?: number): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Expected a string value.' })
  }

  const normalized = value.trim()

  if (!normalized) return null

  if (maxLength && normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `String value must be ${maxLength} characters or fewer.`,
    })
  }

  return normalized
}

function optionalId(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === '') return null

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `${field} must be a positive integer.`,
    })
  }

  return id
}

function optionalJson(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined

  if (typeof value !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'JSON fields must be objects or arrays.',
    })
  }

  return JSON.stringify(value)
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)

    if (!auth.isValid || !auth.user) {
      throw createError({ statusCode: 401, message: 'Authentication required.' })
    }

    const slug = getRouterParam(event, 'slug')?.trim()

    if (!slug) {
      throw createError({ statusCode: 400, message: 'Challenge slug is required.' })
    }

    const body = await readBody<SubmissionBody>(event)

    if (!body || typeof body.contenderSlug !== 'string') {
      throw createError({ statusCode: 400, message: 'contenderSlug is required.' })
    }

    const contenderSlug = body.contenderSlug.trim()
    const variantKey = optionalString(body.variantKey, 128) ?? 'default'
    const outputText = optionalString(body.outputText)
    const artImageId = optionalId(body.artImageId, 'artImageId')
    const characterId = optionalId(body.characterId, 'characterId')
    const scenarioId = optionalId(body.scenarioId, 'scenarioId')

    if (!outputText && !artImageId && !characterId && !scenarioId) {
      throw createError({
        statusCode: 400,
        message:
          'A submission requires outputText, artImageId, characterId, or scenarioId.',
      })
    }

    const [challenge, contender] = await Promise.all([
      prisma.challenge.findUnique({ where: { slug } }),
      prisma.contender.findUnique({ where: { slug: contenderSlug } }),
    ])

    if (!challenge) {
      throw createError({ statusCode: 404, message: 'Challenge not found.' })
    }

    if (challenge.status === 'CLOSED') {
      throw createError({ statusCode: 409, message: 'Challenge is closed.' })
    }

    if (!contender || !contender.isActive) {
      throw createError({ statusCode: 404, message: 'Active contender not found.' })
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        Challenge: { connect: { id: challenge.id } },
        Contender: { connect: { id: contender.id } },
        variantKey,
        promptUsed: optionalString(body.promptUsed),
        settings: optionalJson(body.settings),
        randomSelections: optionalJson(body.randomSelections),
        agentModel: optionalString(body.agentModel, 256),
        outputText,
        ArtImage: artImageId ? { connect: { id: artImageId } } : undefined,
        Character: characterId ? { connect: { id: characterId } } : undefined,
        Scenario: scenarioId ? { connect: { id: scenarioId } } : undefined,
        status: 'READY',
      },
      include: {
        Contender: true,
        ArtImage: true,
        Character: true,
        Scenario: true,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Challenge submission created successfully.',
      data: submission,
      statusCode: 201,
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      event.node.res.statusCode = 409

      return {
        success: false,
        message:
          'This contender already submitted the same variant for this challenge.',
        statusCode: 409,
      }
    }

    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
