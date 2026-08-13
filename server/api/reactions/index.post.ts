// /server/api/reactions/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { validateApiKey } from '../../utils/validateKey'
import { awardKarma } from '../../utils/karma'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '~/prisma/generated/prisma/client'
import { userIsAdmin } from '../../utils/authUser'

type ReactionBody = Record<string, unknown> & {
  reactionType?: unknown
  reactionCategory?: unknown
  comment?: unknown
  rating?: unknown
  artImageId?: unknown
  artId?: unknown
  artCollectionId?: unknown
  botId?: unknown
  characterId?: unknown
  chatId?: unknown
  dreamId?: unknown
  facetId?: unknown
  projectId?: unknown
  promptId?: unknown
  resourceId?: unknown
  rewardId?: unknown
  scenarioId?: unknown
  themeId?: unknown
}

const REACTION_CREATE_FIELDS = new Set([
  'reactionType',
  'reactionCategory',
  'comment',
  'rating',
  'artImageId',
  'artId',
  'artCollectionId',
  'botId',
  'characterId',
  'chatId',
  'dreamId',
  'facetId',
  'projectId',
  'promptId',
  'resourceId',
  'rewardId',
  'scenarioId',
  'themeId',
])

const validReactionTypes = Object.values(ReactionType)
const validReactionCategories = Object.values(Reaction_reactionCategory)
const retiredReactionCategories = new Set<string>(['BUTTERFLY', 'COMPONENT'])

const reactionCategoryAliases: Record<string, Reaction_reactionCategory> = {
  ART: Reaction_reactionCategory.ART_IMAGE,
  ARTIMAGE: Reaction_reactionCategory.ART_IMAGE,
  ART_IMAGE: Reaction_reactionCategory.ART_IMAGE,
  IMAGE: Reaction_reactionCategory.ART_IMAGE,
  COLLECTION: Reaction_reactionCategory.ART_COLLECTION,
  ART_COLLECTION: Reaction_reactionCategory.ART_COLLECTION,
  CHAT: Reaction_reactionCategory.CHAT_EXCHANGE,
  CHAT_EXCHANGE: Reaction_reactionCategory.CHAT_EXCHANGE,
  MESSAGE: Reaction_reactionCategory.MESSAGE,
  BOT: Reaction_reactionCategory.BOT,
  CHARACTER: Reaction_reactionCategory.CHARACTER,
  DREAM: Reaction_reactionCategory.DREAM,
  FACET: Reaction_reactionCategory.FACET,
  PROJECT: Reaction_reactionCategory.PROJECT,
  PROMPT: Reaction_reactionCategory.PROMPT,
  RESOURCE: Reaction_reactionCategory.RESOURCE,
  REWARD: Reaction_reactionCategory.REWARD,
  SCENARIO: Reaction_reactionCategory.SCENARIO,
  THEME: Reaction_reactionCategory.THEME,
}

function assertReactionCreateFields(body: ReactionBody): void {
  const unsupportedFields = Object.keys(body).filter(
    (field) => !REACTION_CREATE_FIELDS.has(field),
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Reaction create fields: ${unsupportedFields.join(', ')}. IDs, timestamps, and system fields are server-owned.`,
    })
  }
}

function normalizeReactionType(value: unknown): ReactionType {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"reactionType" is required.',
    })
  }

  const normalized = value.trim().toUpperCase() as ReactionType

  if (!validReactionTypes.includes(normalized)) {
    throw createError({
      statusCode: 400,
      message: `"reactionType" must be one of: ${validReactionTypes.join(', ')}.`,
    })
  }

  return normalized
}

function normalizeReactionCategory(value: unknown): Reaction_reactionCategory {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"reactionCategory" is required.',
    })
  }

  const normalizedKey = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

  if (retiredReactionCategories.has(normalizedKey)) {
    throw createError({
      statusCode: 400,
      message: `reactionCategory ${normalizedKey} is no longer supported.`,
    })
  }

  const aliased = reactionCategoryAliases[normalizedKey]

  if (aliased) return aliased

  const normalized = normalizedKey as Reaction_reactionCategory

  if (!validReactionCategories.includes(normalized)) {
    throw createError({
      statusCode: 400,
      message: `"reactionCategory" must be one of: ${validReactionCategories.join(', ')}.`,
    })
  }

  return normalized
}

function toNullableText(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toRating(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(5, Math.round(parsed)))
}

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function getTargetFields(body: ReactionBody) {
  return {
    artImageId: toPositiveId(body.artImageId ?? body.artId),
    artCollectionId: toPositiveId(body.artCollectionId),
    botId: toPositiveId(body.botId),
    characterId: toPositiveId(body.characterId),
    chatId: toPositiveId(body.chatId),
    dreamId: toPositiveId(body.dreamId),
    facetId: toPositiveId(body.facetId),
    projectId: toPositiveId(body.projectId),
    promptId: toPositiveId(body.promptId),
    resourceId: toPositiveId(body.resourceId),
    rewardId: toPositiveId(body.rewardId),
    scenarioId: toPositiveId(body.scenarioId),
    themeId: toPositiveId(body.themeId),
  }
}

/**
 * A category that legitimately has no target row of its own. MESSAGE is the
 * only one, and it is not the same thing as a category this route does not
 * support -- which is exactly the distinction the old `?? null` collapsed.
 */
const TARGETLESS = 'TARGETLESS' as const

type ExpectedTargetField =
  | keyof ReturnType<typeof getTargetFields>
  | typeof TARGETLESS
  | null

/**
 * Which column carries the target for this category. `null` means "this route
 * does not support that category" and callers must reject it.
 *
 * The map is a total Record on purpose. It used to be Partial, and three enum
 * values (FACET, PROJECT, CHALLENGE_SUBMISSION) were simply missing from it --
 * which meant `map[category] ?? null` returned null, buildTargetWhere returned
 * an empty where clause, and the route happily wrote a Reaction with every
 * foreign key null. Worse, the dedupe findFirst inherited that empty clause, so
 * a user's second such reaction updated their first one, across the whole
 * table. Making the Record total means a new enum value cannot be forgotten
 * here: it fails to compile instead.
 */
function getExpectedTargetField(
  category: Reaction_reactionCategory,
): ExpectedTargetField {
  const map: Record<Reaction_reactionCategory, ExpectedTargetField> = {
    [Reaction_reactionCategory.ART_IMAGE]: 'artImageId',
    [Reaction_reactionCategory.ART_COLLECTION]: 'artCollectionId',
    [Reaction_reactionCategory.BOT]: 'botId',
    [Reaction_reactionCategory.CHARACTER]: 'characterId',
    [Reaction_reactionCategory.CHAT_EXCHANGE]: 'chatId',
    [Reaction_reactionCategory.DREAM]: 'dreamId',
    [Reaction_reactionCategory.FACET]: 'facetId',
    [Reaction_reactionCategory.PROMPT]: 'promptId',
    [Reaction_reactionCategory.RESOURCE]: 'resourceId',
    [Reaction_reactionCategory.REWARD]: 'rewardId',
    [Reaction_reactionCategory.SCENARIO]: 'scenarioId',
    [Reaction_reactionCategory.THEME]: 'themeId',
    [Reaction_reactionCategory.PROJECT]: 'projectId',
    [Reaction_reactionCategory.MESSAGE]: TARGETLESS,
    // Reachable enum values with no route support. They have columns on
    // Reaction, but no allow-listed field, no access check and no owner
    // lookup, so accepting one would write an untargeted row. Give them a
    // target field before removing them from this list.
    //
    // CHALLENGE_SUBMISSION stays null deliberately: ChallengeSubmission has no
    // userId/isPublic pair to check, and Reaction's
    // @@unique([userId, challengeSubmissionId]) makes it one row per user --
    // a vote, not a comment thread.
    [Reaction_reactionCategory.CHALLENGE_SUBMISSION]: null,
    // Retired earlier in the request by retiredReactionCategories.
    [Reaction_reactionCategory.BUTTERFLY]: null,
    [Reaction_reactionCategory.COMPONENT]: null,
  }

  return map[category]
}

function buildTargetWhere(
  category: Reaction_reactionCategory,
  targets: ReturnType<typeof getTargetFields>,
): Prisma.ReactionWhereInput {
  const expectedField = getExpectedTargetField(category)
  if (expectedField === TARGETLESS) return {}
  if (!expectedField) {
    throw createError({
      statusCode: 400,
      message: `reactionCategory ${category} is not supported.`,
    })
  }

  const expectedId = targets[expectedField]

  if (!expectedId) {
    throw createError({
      statusCode: 400,
      message: `${expectedField} is required for reactionCategory ${category}.`,
    })
  }

  return { [expectedField]: expectedId }
}

async function getContentOwnerId(
  category: Reaction_reactionCategory,
  targets: ReturnType<typeof getTargetFields>,
): Promise<number | null> {
  const expectedField = getExpectedTargetField(category)
  if (!expectedField || expectedField === TARGETLESS) return null
  const targetId = targets[expectedField]
  if (!targetId) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelMap: Record<
    string,
    { findUnique: (args: any) => Promise<unknown> }
  > = {
    artImageId: prisma.artImage,
    artCollectionId: prisma.artCollection,
    botId: prisma.bot,
    characterId: prisma.character,
    chatId: prisma.chat,
    dreamId: prisma.dream,
    facetId: prisma.facet,
    projectId: prisma.project,
    promptId: prisma.prompt,
    resourceId: prisma.resource,
    rewardId: prisma.reward,
    scenarioId: prisma.scenario,
    themeId: prisma.theme,
  }

  const model = modelMap[expectedField]
  if (!model) return null

  const result = (await model.findUnique({
    where: { id: targetId },
    select: { userId: true },
  })) as { userId?: number | null } | null
  return result?.userId ?? null
}

// Content targets that carry a userId + isPublic visibility model. A non-admin may
// react only to a public row or one they own.
const contentTargetLabels: Record<string, string> = {
  artImageId: 'ArtImage',
  artCollectionId: 'ArtCollection',
  botId: 'Bot',
  characterId: 'Character',
  dreamId: 'Dream',
  facetId: 'Facet',
  projectId: 'Project',
  promptId: 'Prompt',
  resourceId: 'Resource',
  rewardId: 'Reward',
  scenarioId: 'Scenario',
  themeId: 'Theme',
}

/**
 * Target columns whose model carries an `allowReviews` opt-out. ArtImage,
 * ArtCollection, Prompt and Theme have no such column, so selecting it would be
 * a Prisma error rather than a permissive default.
 */
const REVIEWABLE_TARGETS = new Set([
  'botId',
  'characterId',
  'dreamId',
  'facetId',
  'projectId',
  'resourceId',
  'rewardId',
  'scenarioId',
])

function contentTargetModel(field: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map: Record<string, { findUnique: (args: any) => Promise<unknown> }> = {
    artImageId: prisma.artImage,
    artCollectionId: prisma.artCollection,
    botId: prisma.bot,
    characterId: prisma.character,
    dreamId: prisma.dream,
    // facetId was in every other map in this file -- the allow-list, the
    // category map, the owner lookup, contentTargetLabels, REVIEWABLE_TARGETS
    // -- but not this one, so every FACET reaction fell through to the
    // fail-closed branch below and 400'd with "No access check is defined for
    // facetId." Facets carry 961 published comments that nobody could reply to.
    facetId: prisma.facet,
    projectId: prisma.project,
    promptId: prisma.prompt,
    resourceId: prisma.resource,
    rewardId: prisma.reward,
    scenarioId: prisma.scenario,
    themeId: prisma.theme,
  }

  return map[field]
}

function reactionTargetNotFound(field: string, targetId: number) {
  return createError({
    statusCode: 404,
    message: `${field} target not found: ${targetId}.`,
  })
}

// Full per-category access model for reaction targets: existence plus the right
// access rule for each target's real model.
//   - CHAT_EXCHANGE: participant model — allow a chat participant, a public chat,
//     or an admin.
//   - content categories (art/collection/bot/character/dream/prompt/resource/
//     reward/scenario/theme): allow a public row, the owner, or an admin.
//   - MESSAGE: no target row — nothing to check.
async function assertReactionTargetAccessible(
  category: Reaction_reactionCategory,
  targets: ReturnType<typeof getTargetFields>,
  userId: number,
  isAdmin: boolean,
) {
  const expectedField = getExpectedTargetField(category)
  if (!expectedField || expectedField === TARGETLESS) return

  const targetId = targets[expectedField]
  if (!targetId) return

  if (expectedField === 'chatId') {
    const chat = await prisma.chat.findUnique({
      where: { id: targetId },
      select: { id: true, userId: true, recipientId: true, isPublic: true },
    })
    if (!chat) throw reactionTargetNotFound(expectedField, targetId)

    if (
      isAdmin ||
      chat.isPublic === true ||
      chat.userId === userId ||
      chat.recipientId === userId
    ) {
      return
    }

    throw createError({
      statusCode: 403,
      message: 'You do not have permission to react to this Chat.',
    })
  }

  // Fail closed. Chat returns from its own branch above, so reaching here with
  // no model means a target field was added to getExpectedTargetField without
  // an access check -- which used to mean the reaction was written unchecked.
  const model = contentTargetModel(expectedField)
  if (!model) {
    throw createError({
      statusCode: 400,
      message: `No access check is defined for ${expectedField}.`,
    })
  }

  const row = (await model.findUnique({
    where: { id: targetId },
    select: {
      userId: true,
      isPublic: true,
      ...(REVIEWABLE_TARGETS.has(expectedField) ? { allowReviews: true } : {}),
    },
  })) as {
    userId?: number | null
    isPublic?: boolean | null
    allowReviews?: boolean | null
  } | null

  if (!row) throw reactionTargetNotFound(expectedField, targetId)

  // allowReviews was a client-side gate only: the galleries honoured it and the
  // API never looked at it, so a direct POST walked straight past an owner's
  // opt-out. The owner and admins can still react to their own record.
  if (row.allowReviews === false && !isAdmin && row.userId !== userId) {
    throw createError({
      statusCode: 403,
      message: `${contentTargetLabels[expectedField] ?? 'This record'} has reviews turned off.`,
    })
  }

  if (isAdmin || row.isPublic === true || row.userId === userId) return

  const label = contentTargetLabels[expectedField] ?? 'record'
  throw createError({
    statusCode: 403,
    message: `You do not have permission to react to this ${label}.`,
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

    const body = await readBody<ReactionBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Reaction payload is required.',
      })
    }

    assertReactionCreateFields(body)

    const reactionType = normalizeReactionType(body.reactionType)
    const reactionCategory = normalizeReactionCategory(body.reactionCategory)
    const targets = getTargetFields(body)
    const targetWhere = buildTargetWhere(reactionCategory, targets)

    const isAdmin = userIsAdmin(user)
    await assertReactionTargetAccessible(
      reactionCategory,
      targets,
      user.id,
      isAdmin,
    )

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: user.id,
        reactionType,
        reactionCategory,
        ...targetWhere,
      },
    })

    const mutationData: Prisma.ReactionUncheckedCreateInput = {
      userId: user.id,
      reactionType,
      reactionCategory,
      comment: toNullableText(body.comment),
      rating: toRating(body.rating),
      ...targets,
    }

    const data = existingReaction
      ? await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: mutationData,
        })
      : await prisma.reaction.create({ data: mutationData })

    if (!existingReaction) {
      awardKarma({
        userId: user.id,
        reason: 'REACTION_GIVEN',
        // REACTION_GIVEN is "earned by user action," not "earned by an
        // object" — refId stays the Reaction's own id, no refType.
        refId: String(data.id),
      }).catch(() => {})
      // Award content owner for receiving a reaction (fire-and-forget; gated by KARMA_LIVE).
      // Attribute this to the reacted-on OBJECT (refType/refId), not the Reaction
      // row itself, so per-object earned-karma totals can be aggregated later.
      const targetField = getExpectedTargetField(reactionCategory)
      const targetedField =
        targetField && targetField !== TARGETLESS ? targetField : null
      const targetRefId = targetedField ? targets[targetedField] : undefined
      const targetRefType = targetedField
        ? targetedField.replace(/Id$/, '')
        : undefined

      getContentOwnerId(reactionCategory, targets)
        .then((ownerId) => {
          if (ownerId && ownerId !== user.id) {
            awardKarma({
              userId: ownerId,
              reason: 'REACTION_RECEIVED',
              refId: targetRefId ? String(targetRefId) : String(data.id),
              refType: targetRefId ? targetRefType : undefined,
            }).catch(() => {})
          }
        })
        .catch(() => {})
    }

    event.node.res.statusCode = existingReaction ? 200 : 201

    return {
      success: true,
      message: existingReaction
        ? 'Reaction updated successfully.'
        : 'Reaction created successfully.',
      data,
      statusCode: event.node.res.statusCode,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to create/update reaction.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
