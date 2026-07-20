import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { normalizeSlugInput } from '~/utils/slugify'
import { ScenarioOutputType, type Prisma } from '~/prisma/generated/prisma/client'
import {
  assertScenarioMutationInput,
  assertScenarioRelationsExist,
  normalizeScenarioBoolean,
  normalizeScenarioIdArray,
  normalizeScenarioIntros,
  normalizeScenarioJsonString,
  normalizeScenarioNullableId,
  normalizeScenarioNullableInteger,
  normalizeScenarioNullableString,
  normalizeScenarioOutputType,
  normalizeScenarioRequiredString,
  normalizeScenarioString,
  scenarioBatchCreateFields,
  scenarioCreateFields,
  type ScenarioMutationInput,
} from './mutation'

export type ScenarioPostInput = ScenarioMutationInput

export type SkippedScenario = {
  title: string
  reason: string
  existingId?: number
}

export type FailedScenario = {
  title: string
  message: string
}

export function fallbackScenarioTitle(input: ScenarioPostInput): string {
  return typeof input?.title === 'string' && input.title.trim()
    ? input.title.trim()
    : 'Untitled scenario'
}

export function getScenarioErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown scenario seed error.'
}

export function isScenarioInfrastructureError(error: unknown): boolean {
  const handled = errorHandler(error)
  return Number(handled.statusCode) >= 500
}

export async function buildScenarioCreateInput(
  rawInput: unknown,
  authenticatedUserId: number,
  options: { batch?: boolean } = {},
): Promise<Prisma.ScenarioCreateInput> {
  assertScenarioMutationInput(rawInput, {
    allowedFields: options.batch
      ? scenarioBatchCreateFields
      : scenarioCreateFields,
    context: options.batch
      ? 'Scenario batch create item'
      : 'Scenario create payload',
    authenticatedUserId: options.batch ? undefined : authenticatedUserId,
    allowTemporaryId: !options.batch,
  })

  const scenarioData = rawInput
  const title = normalizeScenarioRequiredString(scenarioData.title, 'title')
  const artImageId = normalizeScenarioNullableId(
    scenarioData.artImageId,
    'artImageId',
  )
  const difficulty = normalizeScenarioNullableInteger(
    scenarioData.difficulty,
    'difficulty',
  )
  const dreamIds = normalizeScenarioIdArray(scenarioData.dreamIds, 'dreamIds')
  const characterIds = normalizeScenarioIdArray(
    scenarioData.characterIds,
    'characterIds',
  )

  await assertScenarioRelationsExist({
    artImageId,
    dreamIds,
    characterIds,
  })

  return {
    User: { connect: { id: authenticatedUserId } },
    title,
    slug: normalizeSlugInput(scenarioData.slug) ?? undefined,
    description: normalizeScenarioString(
      scenarioData.description,
      'description',
      '',
    ),
    intros: normalizeScenarioIntros(scenarioData.intros),
    outputType: normalizeScenarioOutputType(
      scenarioData.outputType,
      ScenarioOutputType.STORY,
    ),
    cast: normalizeScenarioJsonString(scenarioData.cast, 'cast'),
    imagePath: normalizeScenarioNullableString(
      scenarioData.imagePath,
      'imagePath',
    ),
    locations: normalizeScenarioNullableString(
      scenarioData.locations,
      'locations',
    ),
    artPrompt: normalizeScenarioNullableString(
      scenarioData.artPrompt,
      'artPrompt',
    ),
    genres: normalizeScenarioNullableString(scenarioData.genres, 'genres'),
    inspirations: normalizeScenarioNullableString(
      scenarioData.inspirations,
      'inspirations',
    ),
    isMature:
      scenarioData.isMature === undefined
        ? false
        : normalizeScenarioBoolean(scenarioData.isMature, 'isMature'),
    isPublic:
      scenarioData.isPublic === undefined
        ? true
        : normalizeScenarioBoolean(scenarioData.isPublic, 'isPublic'),
    isActive:
      scenarioData.isActive === undefined
        ? true
        : normalizeScenarioBoolean(scenarioData.isActive, 'isActive'),
    difficulty,
    tier: normalizeScenarioNullableString(scenarioData.tier, 'tier'),
    group: normalizeScenarioNullableString(scenarioData.group, 'group'),
    secretNotes: normalizeScenarioNullableString(
      scenarioData.secretNotes,
      'secretNotes',
    ),
    ArtImage:
      typeof artImageId === 'number'
        ? { connect: { id: artImageId } }
        : undefined,
    Dreams: dreamIds?.length
      ? { connect: dreamIds.map((id) => ({ id })) }
      : undefined,
    Characters: characterIds?.length
      ? { connect: characterIds.map((id) => ({ id })) }
      : undefined,
  }
}

export async function findExistingScenario(title: string, userId: number) {
  return await prisma.scenario.findFirst({
    where: { title, userId },
    select: { id: true, title: true },
  })
}
