// /server/api/scenarios/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import prisma from '../../utils/prisma'
import type { Prisma } from '~/prisma/generated/prisma/client'

type ScenarioPostInput = {
  title?: unknown
  description?: unknown
  intros?: unknown
  artImageId?: unknown
  imagePath?: unknown
  locations?: unknown
  artPrompt?: unknown
  genres?: unknown
  inspirations?: unknown
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field is required and must be a string.`,
    })
  }

  return value.trim()
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed || null
}

function normalizeIntros(value: unknown): string {
  if (!value) return '[]'

  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((entry) => String(entry).trim()).filter(Boolean),
    )
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) return '[]'

    try {
      const parsed = JSON.parse(trimmed)

      if (Array.isArray(parsed)) {
        return JSON.stringify(
          parsed.map((entry) => String(entry).trim()).filter(Boolean),
        )
      }

      return JSON.stringify([trimmed])
    } catch {
      return JSON.stringify(
        trimmed
          .split('\n')
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
    }
  }

  return '[]'
}

function normalizeOptionalId(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'artImageId must be a positive integer when provided.',
    })
  }

  return id
}

function buildScenarioCreateInput(
  scenarioData: ScenarioPostInput,
  authenticatedUserId: number,
): Prisma.ScenarioCreateInput {
  const title = normalizeRequiredString(scenarioData.title, 'title')
  const artImageId = normalizeOptionalId(scenarioData.artImageId)

  return {
    User: { connect: { id: authenticatedUserId } },
    title,
    description: normalizeString(scenarioData.description),
    intros: normalizeIntros(scenarioData.intros),
    imagePath: normalizeNullableString(scenarioData.imagePath),
    locations: normalizeNullableString(scenarioData.locations),
    artPrompt: normalizeNullableString(scenarioData.artPrompt),
    genres: normalizeNullableString(scenarioData.genres),
    inspirations: normalizeNullableString(scenarioData.inspirations),
    ArtImage: artImageId ? { connect: { id: artImageId } } : undefined,
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ScenarioPostInput | ScenarioPostInput[]>(event)

    if (!body) {
      throw createError({
        statusCode: 400,
        message: 'Request body is required.',
      })
    }

    const isBatch = Array.isArray(body)
    const scenarioInputs = isBatch ? body : [body]

    if (!scenarioInputs.length) {
      throw createError({
        statusCode: 400,
        message: 'Request body must include at least one scenario.',
      })
    }

    const data = await prisma.$transaction(
      scenarioInputs.map((scenarioData) =>
        prisma.scenario.create({
          data: buildScenarioCreateInput(scenarioData, user.id),
          include: {
            ArtImage: true,
          },
        }),
      ),
    )

    event.node.res.statusCode = 201

    return {
      success: true,
      data: isBatch ? data : data[0],
      message: isBatch
        ? `${data.length} scenarios created successfully.`
        : 'Scenario created successfully.',
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to create scenario.',
    }
  }
})
