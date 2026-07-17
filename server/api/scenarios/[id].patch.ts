// /server/api/scenarios/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { normalizeSlugInput } from '~/utils/slugify'
import type {
  Prisma,
  ScenarioOutputType,
} from '~/prisma/generated/prisma/client'

type ScenarioPatchInput = {
  title?: unknown
  slug?: unknown
  description?: unknown
  intros?: unknown
  outputType?: unknown
  cast?: unknown
  dreamIds?: unknown
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
  compositionIds?: unknown
}

const scenarioOutputTypes: ScenarioOutputType[] = [
  'STORY',
  'ART',
  'CHARACTER',
  'REWARD',
  'DREAM',
  'SCENARIO',
  'MIXED',
]

function normalizeOutputType(value: unknown): ScenarioOutputType {
  return scenarioOutputTypes.includes(value as ScenarioOutputType)
    ? (value as ScenarioOutputType)
    : 'STORY'
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

function normalizeJsonString(value: unknown, field: string): string | null {
  if (value === null) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    try {
      JSON.parse(trimmed)
      return trimmed
    } catch {
      return JSON.stringify(trimmed)
    }
  }

  try {
    return JSON.stringify(value)
  } catch {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be JSON-serializable.`,
    })
  }
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
  if (value === null || value === '') return { disconnect: true }

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'artImageId must be a positive integer or null when provided.',
    })
  }

  return { connect: { id } }
}

async function assertRelatedRecordsExist(options: {
  characterIds?: number[]
  compositionIds?: number[]
  dreamIds?: number[]
}) {
  const { characterIds, compositionIds, dreamIds } = options

  if (characterIds?.length) {
    const records = await prisma.character.findMany({
      where: { id: { in: characterIds } },
      select: { id: true },
    })
    const foundIds = new Set(records.map((record) => record.id))
    const missingIds = characterIds.filter((id) => !foundIds.has(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Character IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }

  if (compositionIds?.length) {
    const records = await prisma.composition.findMany({
      where: { id: { in: compositionIds } },
      select: { id: true },
    })
    const foundIds = new Set(records.map((record) => record.id))
    const missingIds = compositionIds.filter((id) => !foundIds.has(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Composition IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }

  if (dreamIds?.length) {
    const records = await prisma.dream.findMany({
      where: { id: { in: dreamIds } },
      select: { id: true },
    })
    const foundIds = new Set(records.map((record) => record.id))
    const missingIds = dreamIds.filter((id) => !foundIds.has(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Dream IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }
}

async function buildScenarioUpdateInput(
  body: ScenarioPatchInput,
): Promise<Prisma.ScenarioUpdateInput> {
  const data: Prisma.ScenarioUpdateInput = {}

  if ('title' in body) data.title = normalizeRequiredString(body.title, 'title')
  if ('slug' in body) data.slug = normalizeSlugInput(body.slug)
  if ('description' in body) {
    data.description = normalizeString(body.description, 'description')
  }
  if ('intros' in body) data.intros = normalizeIntros(body.intros)
  if ('outputType' in body) data.outputType = normalizeOutputType(body.outputType)
  if ('cast' in body) data.cast = normalizeJsonString(body.cast, 'cast')
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

  const characterIds =
    'characterIds' in body
      ? normalizePositiveIdArray(body.characterIds, 'characterIds')
      : undefined
  const compositionIds =
    'compositionIds' in body
      ? normalizePositiveIdArray(body.compositionIds, 'compositionIds')
      : undefined
  const dreamIds =
    'dreamIds' in body
      ? normalizePositiveIdArray(body.dreamIds, 'dreamIds')
      : undefined

  await assertRelatedRecordsExist({
    characterIds,
    compositionIds,
    dreamIds,
  })

  if (characterIds) {
    data.Characters = {
      set: characterIds.map((id) => ({ id })),
    }
  }

  if (compositionIds) {
    data.Compositions = {
      set: compositionIds.map((id) => ({ id })),
    }
  }

  if (dreamIds) {
    data.Dreams = {
      set: dreamIds.map((id) => ({ id })),
    }
  }

  return data
}

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid scenario ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
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

    if (existingScenario.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this scenario.',
      })
    }

    const body = await readBody<ScenarioPatchInput>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await buildScenarioUpdateInput(body)

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid scenario fields provided for update.',
      })
    }

    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data,
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
        Dreams: true,
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Scenario updated successfully.',
      data: updatedScenario,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message || `Failed to update scenario with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
