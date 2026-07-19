// /server/api/scenarios/batch.patch.ts
// Batch-update multiple scenarios in a single request.
// Body shape: { "updates": [ { "id": number, ...scenarioFields }, ... ] }
// Each scenario is validated and updated independently; a single failing
// entry does not abort the others. Returns a per-item results array.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { scenarioMutationSelect } from './selects'

type ScenarioPatchInput = {
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
  characterIds?: unknown
}

type ScenarioBatchEntry = ScenarioPatchInput & { id?: unknown }

type ScenarioBatchBody = {
  updates?: unknown
}

type BatchResult = {
  id: number | null
  success: boolean
  message: string
  statusCode: number
  data?: unknown
}

function normalizeRequiredString(
  value: unknown,
  field: string,
  maxLength = 191,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a non-empty string when provided.`,
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

function normalizeString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a string when provided.`,
    })
  }

  return value.trim()
}

function normalizeNullableString(value: unknown, field: string): string | null {
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a string or null when provided.`,
    })
  }

  const trimmed = value.trim()
  return trimmed || null
}

function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') return value

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  throw createError({
    statusCode: 400,
    message: `The "${field}" field must be a boolean when provided.`,
  })
}

function normalizeNullableInteger(
  value: unknown,
  field: string,
): number | null {
  if (value === null || value === '') return null

  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be an integer or null when provided.`,
    })
  }

  return parsed
}

function normalizePositiveIdArray(value: unknown, field: string): number[] {
  if (typeof value === 'undefined') return []

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be an array of positive integer IDs.`,
    })
  }

  const ids = value.map((entry) => Number(entry))

  if (!ids.every((entry) => Number.isInteger(entry) && entry > 0)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must contain only positive integer IDs.`,
    })
  }

  return [...new Set(ids)]
}

function normalizeIntros(value: unknown): string {
  if (value === null) return '[]'

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

  throw createError({
    statusCode: 400,
    message:
      'The "intros" field must be an array, JSON array string, plain string, or null when provided.',
  })
}

function normalizeArtImageRelation(
  value: unknown,
): Prisma.ArtImageUpdateOneWithoutScenariosNestedInput {
  if (value === null || value === '') {
    return {
      disconnect: true,
    }
  }

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'artImageId must be a positive integer or null when provided.',
    })
  }

  return {
    connect: {
      id,
    },
  }
}

async function assertRelatedRecordsExist(options: { characterIds: number[] }) {
  const { characterIds } = options

  if (characterIds.length) {
    const characters = await prisma.character.findMany({
      where: { id: { in: characterIds } },
      select: { id: true },
    })

    const foundIds = new Set(characters.map((character) => character.id))
    const missingIds = characterIds.filter((id) => !foundIds.has(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Character IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }
}

async function buildScenarioUpdateInput(
  body: ScenarioPatchInput,
): Promise<Prisma.ScenarioUpdateInput> {
  const data: Prisma.ScenarioUpdateInput = {}

  if ('title' in body) data.title = normalizeRequiredString(body.title, 'title')
  if ('description' in body) {
    data.description = normalizeString(body.description, 'description')
  }
  if ('intros' in body) data.intros = normalizeIntros(body.intros)
  if ('imagePath' in body) {
    data.imagePath = normalizeNullableString(body.imagePath, 'imagePath')
  }
  if ('locations' in body) {
    data.locations = normalizeNullableString(body.locations, 'locations')
  }
  if ('artPrompt' in body) {
    data.artPrompt = normalizeNullableString(body.artPrompt, 'artPrompt')
  }
  if ('genres' in body) {
    data.genres = normalizeNullableString(body.genres, 'genres')
  }
  if ('inspirations' in body) {
    data.inspirations = normalizeNullableString(
      body.inspirations,
      'inspirations',
    )
  }
  if ('isMature' in body) {
    data.isMature = normalizeBoolean(body.isMature, 'isMature')
  }
  if ('isPublic' in body) {
    data.isPublic = normalizeBoolean(body.isPublic, 'isPublic')
  }
  if ('isActive' in body) {
    data.isActive = normalizeBoolean(body.isActive, 'isActive')
  }
  if ('difficulty' in body) {
    data.difficulty = normalizeNullableInteger(body.difficulty, 'difficulty')
  }
  if ('tier' in body) data.tier = normalizeNullableString(body.tier, 'tier')
  if ('group' in body) data.group = normalizeNullableString(body.group, 'group')
  if ('secretNotes' in body) {
    data.secretNotes = normalizeNullableString(body.secretNotes, 'secretNotes')
  }
  if ('artImageId' in body) {
    data.ArtImage = normalizeArtImageRelation(body.artImageId)
  }

  const characterIds = normalizePositiveIdArray(
    body.characterIds,
    'characterIds',
  )

  await assertRelatedRecordsExist({
    characterIds,
  })

  if (characterIds.length) {
    data.Characters = {
      connect: characterIds.map((id) => ({ id })),
    }
  }

  return data
}

async function processEntry(
  entry: ScenarioBatchEntry,
  user: { id: number; Role?: string | null },
): Promise<BatchResult> {
  let id: number | null = null

  try {
    id = Number(entry.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid scenario ID. It must be a positive integer.',
      })
    }

    const existingScenario = await prisma.scenario.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingScenario) {
      throw createError({
        statusCode: 404,
        message: 'Scenario not found.',
      })
    }

    if (existingScenario.userId !== user.id && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this scenario.',
      })
    }

    // Strip the routing id before building the Prisma update input.
    const { id: _omit, ...fields } = entry
    void _omit

    if (Object.keys(fields).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await buildScenarioUpdateInput(fields)

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid scenario fields provided for update.',
      })
    }

    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data,
      select: scenarioMutationSelect,
    })

    return {
      id,
      success: true,
      message: 'Scenario updated successfully.',
      statusCode: 200,
      data: updatedScenario,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    return {
      id,
      success: false,
      message:
        handledError.message ||
        `Failed to update scenario with ID ${id ?? 'unknown'}.`,
      statusCode: handledError.statusCode || 500,
    }
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

    const body = await readBody<ScenarioBatchBody>(event)

    if (!body || !Array.isArray(body.updates) || body.updates.length === 0) {
      throw createError({
        statusCode: 400,
        message:
          'Request body must include a non-empty "updates" array of scenario objects.',
      })
    }

    const results: BatchResult[] = []

    for (const entry of body.updates as ScenarioBatchEntry[]) {
      if (!entry || typeof entry !== 'object') {
        results.push({
          id: null,
          success: false,
          message: 'Each update entry must be an object with an "id".',
          statusCode: 400,
        })
        continue
      }

      results.push(await processEntry(entry, user))
    }

    const updatedCount = results.filter((result) => result.success).length
    const failedCount = results.length - updatedCount

    // 200 if everything succeeded, 207 (Multi-Status) if partial.
    event.node.res.statusCode = failedCount === 0 ? 200 : 207

    return {
      success: failedCount === 0,
      message: `Batch complete: ${updatedCount} updated, ${failedCount} failed.`,
      data: results,
      statusCode: event.node.res.statusCode,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to process scenario batch.',
      statusCode: event.node.res.statusCode,
    }
  }
})
