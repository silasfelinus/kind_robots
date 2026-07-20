// /server/api/challenges/[slug]/submissions.post.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import {
  ChallengeStatus,
  ChallengeSubmissionStatus,
  ChallengeType,
  Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { userIsAdmin } from '~/server/utils/authUser'
import { challengeSubmissionMutationSelect } from '~/server/utils/challengeSubmissionResource'
import { validateApiKey } from '~/server/utils/validateKey'

const submissionCreateFields = new Set([
  'contenderSlug',
  'variantKey',
  'promptUsed',
  'settings',
  'randomSelections',
  'agentModel',
  'outputText',
  'artImageId',
  'characterId',
  'scenarioId',
])

const MAX_TEXT_LENGTH = 50_000
const MAX_JSON_LENGTH = 50_000

type SubmissionBody = Record<string, unknown> & {
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

type SubmissionOutputField =
  | 'outputText'
  | 'artImageId'
  | 'characterId'
  | 'scenarioId'

type PublishableResource = {
  id: number
  isPublic: boolean | null
  isActive: boolean | null
  isMature: boolean | null
}

function assertSupportedFields(body: SubmissionBody) {
  const unsupported = Object.keys(body).filter(
    (field) => !submissionCreateFields.has(field),
  )

  if (unsupported.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Unsupported ChallengeSubmission fields: ${unsupported.join(', ')}. IDs, status, timestamps, and relationships are server-owned.`,
    })
  }
}

function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({ statusCode: 400, message: `${field} is required.` })
  }

  const normalized = value.trim()

  if (normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${field} must be ${maxLength} characters or fewer.`,
    })
  }

  return normalized
}

function optionalString(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === '') return null

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be a string.` })
  }

  const normalized = value.trim()
  if (!normalized) return null

  if (normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${field} must be ${maxLength} characters or fewer.`,
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

function optionalJson(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null

  if (typeof value !== 'object') {
    throw createError({
      statusCode: 400,
      message: `${field} must be an object or array.`,
    })
  }

  const serialized = JSON.stringify(value)

  if (serialized.length > MAX_JSON_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `${field} must serialize to ${MAX_JSON_LENGTH} characters or fewer.`,
    })
  }

  return serialized
}

function expectedOutputField(challengeType: ChallengeType): SubmissionOutputField {
  switch (challengeType) {
    case ChallengeType.ART:
      return 'artImageId'
    case ChallengeType.CHARACTER:
      return 'characterId'
    case ChallengeType.SCENARIO:
      return 'scenarioId'
    case ChallengeType.TEXT:
    case ChallengeType.REASONING:
      return 'outputText'
  }
}

function assertPublishableResource(
  resource: PublishableResource | null,
  field: SubmissionOutputField,
  challengeIsMature: boolean,
) {
  if (!resource) {
    throw createError({ statusCode: 404, message: `${field} was not found.` })
  }

  if (resource.isPublic !== true || resource.isActive !== true) {
    throw createError({
      statusCode: 403,
      message: `${field} must reference a public, active resource.`,
    })
  }

  if (resource.isMature === true && !challengeIsMature) {
    throw createError({
      statusCode: 409,
      message: `${field} cannot publish mature content into a non-mature Challenge.`,
    })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)

    if (!auth.isValid || !auth.user) {
      throw createError({ statusCode: 401, message: 'Authentication required.' })
    }

    if (!userIsAdmin(auth.user)) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const slug = getRouterParam(event, 'slug')?.trim()

    if (!slug) {
      throw createError({ statusCode: 400, message: 'Challenge slug is required.' })
    }

    const body = await readBody<SubmissionBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'A JSON ChallengeSubmission body is required.',
      })
    }

    assertSupportedFields(body)

    const contenderSlug = requiredString(
      body.contenderSlug,
      'contenderSlug',
      255,
    )
    const variantKey =
      optionalString(body.variantKey, 'variantKey', 128) ?? 'default'
    const outputText = optionalString(
      body.outputText,
      'outputText',
      MAX_TEXT_LENGTH,
    )
    const artImageId = optionalId(body.artImageId, 'artImageId')
    const characterId = optionalId(body.characterId, 'characterId')
    const scenarioId = optionalId(body.scenarioId, 'scenarioId')
    const outputValues: Record<
      SubmissionOutputField,
      string | number | null
    > = {
      outputText,
      artImageId,
      characterId,
      scenarioId,
    }
    const suppliedOutputFields = Object.entries(outputValues)
      .filter(([, value]) => value !== null)
      .map(([field]) => field as SubmissionOutputField)

    if (suppliedOutputFields.length !== 1) {
      throw createError({
        statusCode: 400,
        message:
          'A ChallengeSubmission requires exactly one of outputText, artImageId, characterId, or scenarioId.',
      })
    }

    const [challenge, contender] = await Promise.all([
      prisma.challenge.findUnique({
        where: { slug },
        select: {
          id: true,
          challengeType: true,
          status: true,
          isMature: true,
        },
      }),
      prisma.contender.findUnique({
        where: { slug: contenderSlug },
        select: { id: true, isActive: true },
      }),
    ])

    if (!challenge) {
      throw createError({ statusCode: 404, message: 'Challenge not found.' })
    }

    if (challenge.status !== ChallengeStatus.OPEN) {
      throw createError({
        statusCode: 409,
        message: 'Challenge submissions are only accepted while OPEN.',
      })
    }

    if (!contender?.isActive) {
      throw createError({ statusCode: 404, message: 'Active contender not found.' })
    }

    const expectedField = expectedOutputField(challenge.challengeType)

    if (suppliedOutputFields[0] !== expectedField) {
      throw createError({
        statusCode: 400,
        message: `${challenge.challengeType} Challenges require ${expectedField}.`,
      })
    }

    let linkedResource: PublishableResource | null = null

    if (artImageId) {
      linkedResource = await prisma.artImage.findUnique({
        where: { id: artImageId },
        select: { id: true, isPublic: true, isActive: true, isMature: true },
      })
    } else if (characterId) {
      linkedResource = await prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, isPublic: true, isActive: true, isMature: true },
      })
    } else if (scenarioId) {
      linkedResource = await prisma.scenario.findUnique({
        where: { id: scenarioId },
        select: { id: true, isPublic: true, isActive: true, isMature: true },
      })
    }

    if (expectedField !== 'outputText') {
      assertPublishableResource(
        linkedResource,
        expectedField,
        challenge.isMature,
      )
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId: challenge.id,
        contenderId: contender.id,
        variantKey,
        promptUsed: optionalString(
          body.promptUsed,
          'promptUsed',
          MAX_TEXT_LENGTH,
        ),
        settings: optionalJson(body.settings, 'settings'),
        randomSelections: optionalJson(
          body.randomSelections,
          'randomSelections',
        ),
        agentModel: optionalString(body.agentModel, 'agentModel', 256),
        outputText,
        artImageId,
        characterId,
        scenarioId,
        status: ChallengeSubmissionStatus.READY,
      },
      select: challengeSubmissionMutationSelect,
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
