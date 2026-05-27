// /server/api/scenarios/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import prisma from '../../utils/prisma'
import type { Prisma, Scenario } from '~/prisma/generated/prisma/client'

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
  isMature?: unknown
  isPublic?: unknown
  isActive?: unknown
  difficulty?: unknown
  tier?: unknown
  group?: unknown
  secretNotes?: unknown
}

type SkippedScenario = {
  title: string
  reason: string
  existingId?: number
}

type FailedScenario = {
  title: string
  message: string
}

function normalizeRequiredString(
  value: unknown,
  field: string,
  maxLength = 191,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field is required and must be a string.`,
    })
  }

  const trimmed = value.trim()

  if (trimmed.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be ${maxLength} characters or fewer.`,
    })
  }

  return trimmed
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

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return fallback
}

function normalizeNullableInteger(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined

  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    throw createError({
      statusCode: 400,
      message: 'difficulty must be an integer when provided.',
    })
  }

  return parsed
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown scenario seed error.'
}

function buildScenarioCreateInput(
  scenarioData: ScenarioPostInput,
  authenticatedUserId: number,
): Prisma.ScenarioCreateInput {
  const title = normalizeRequiredString(scenarioData.title, 'title')
  const artImageId = normalizeOptionalId(scenarioData.artImageId)
  const difficulty = normalizeNullableInteger(scenarioData.difficulty)

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
    isMature: normalizeBoolean(scenarioData.isMature, false),
    isPublic: normalizeBoolean(scenarioData.isPublic, true),
    isActive: normalizeBoolean(scenarioData.isActive, true),
    difficulty,
    tier: normalizeNullableString(scenarioData.tier),
    group: normalizeNullableString(scenarioData.group),
    secretNotes: normalizeNullableString(scenarioData.secretNotes),
    ArtImage: artImageId ? { connect: { id: artImageId } } : undefined,
  }
}

async function findExistingScenario(title: string, userId: number) {
  return await prisma.scenario.findFirst({
    where: {
      title,
      userId,
    },
    select: {
      id: true,
      title: true,
    },
  })
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

    const created: Scenario[] = []
    const skipped: SkippedScenario[] = []
    const failed: FailedScenario[] = []

    for (const scenarioData of scenarioInputs) {
      const fallbackTitle =
        typeof scenarioData.title === 'string' && scenarioData.title.trim()
          ? scenarioData.title.trim()
          : 'Untitled scenario'

      try {
        const createInput = buildScenarioCreateInput(scenarioData, user.id)
        const title = createInput.title

        const existingScenario = await findExistingScenario(title, user.id)

        if (existingScenario) {
          skipped.push({
            title,
            existingId: existingScenario.id,
            reason: 'Scenario with this title already exists for this user.',
          })
          continue
        }

        const createdScenario = await prisma.scenario.create({
          data: createInput,
          include: {
            ArtImage: true,
            User: {
              select: {
                id: true,
                username: true,
              },
            },
            Characters: true,
            Compositions: true,
          },
        })

        created.push(createdScenario)
      } catch (error) {
        failed.push({
          title: fallbackTitle,
          message: getErrorMessage(error),
        })
      }
    }

    if (failed.length && !created.length && !skipped.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        data: {
          created,
          skipped,
          failed,
        },
        message: `No scenarios were created. ${failed.length} failed.`,
      }
    }

    event.node.res.statusCode = failed.length ? 207 : 201

    return {
      success: failed.length === 0,
      data: isBatch
        ? {
            created,
            skipped,
            failed,
          }
        : created[0] || skipped[0] || failed[0],
      message: isBatch
        ? `${created.length} created, ${skipped.length} skipped, ${failed.length} failed.`
        : created.length
          ? 'Scenario created successfully.'
          : skipped.length
            ? 'Scenario already exists. Skipped duplicate.'
            : 'Scenario failed to create.',
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
