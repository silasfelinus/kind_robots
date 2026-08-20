// /server/api/dreams/daily.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  buildDailyDreamFacetBlueprint,
  type DailyDreamBlueprint,
} from '~/server/utils/dailyDreamFacetBlueprint'
import { diversifyDailyDreamNames } from '~/server/utils/dailyDreamNameDiversity'
import { effectiveShowMature } from '~/server/utils/contentAccess'

type DailyDreamRequest = {
  dateKey?: string | null
  characterCount?: number | null
  rewardCount?: number | null
  isPublic?: boolean | null
  isMature?: boolean | null
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function normalizeCount(value: unknown, fallback: number): number {
  const numeric = Number(value)
  return Number.isInteger(numeric)
    ? Math.min(4, Math.max(1, numeric))
    : fallback
}

function validDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const dailyDreamInclude = {
  Characters: true,
  Rewards: true,
  FacetLinks: { include: { Facet: true } },
} as const

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = (await readBody(event).catch(() => null)) as DailyDreamRequest | null
    const dateKey = String(
      body?.dateKey || new Date().toISOString().slice(0, 10),
    ).trim()

    if (!validDateKey(dateKey)) {
      throw createError({
        statusCode: 400,
        message: 'dateKey must be a real calendar date in YYYY-MM-DD format.',
      })
    }

    const requestedCharacterCount = normalizeCount(body?.characterCount, 2)
    const requestedRewardCount = normalizeCount(body?.rewardCount, 2)
    const blueprintOptions = {
      userId: auth.user.id,
      isAdmin: auth.isAdmin,
      includeMature: Boolean(body?.isMature && effectiveShowMature(auth.user)),
      dateKey,
    }
    const rawBlueprint = await buildDailyDreamFacetBlueprint({
      ...blueprintOptions,
      characterCount: requestedCharacterCount,
      rewardCount: requestedRewardCount,
    })

    const loadExisting = () =>
      prisma.dream.findFirst({
        where: { slug: rawBlueprint.slug, userId: auth.user.id, isActive: true },
        include: dailyDreamInclude,
      })

    async function blueprintForExisting(existing: {
      Characters: unknown[]
      Rewards: unknown[]
    }): Promise<DailyDreamBlueprint> {
      const characterCount = Math.min(4, Math.max(1, existing.Characters.length))
      const rewardCount = Math.min(4, Math.max(1, existing.Rewards.length))
      if (
        characterCount === requestedCharacterCount &&
        rewardCount === requestedRewardCount
      ) {
        return rawBlueprint
      }
      return buildDailyDreamFacetBlueprint({
        ...blueprintOptions,
        characterCount,
        rewardCount,
      })
    }

    const existing = await loadExisting()
    if (existing) {
      return {
        success: true,
        message: `Daily Dream for ${dateKey} already exists.`,
        data: {
          dream: existing,
          blueprint: await blueprintForExisting(existing),
          reused: true,
        },
        statusCode: 200,
      }
    }

    const blueprint = diversifyDailyDreamNames(rawBlueprint, {
      userId: auth.user.id,
      dateKey,
    })
    const isPublic = body?.isPublic ?? false
    const isMature = Boolean(body?.isMature && effectiveShowMature(auth.user))

    let created
    try {
      created = await prisma.$transaction(async (tx) => {
        const dream = await tx.dream.create({
          data: {
            title: blueprint.title,
            slug: blueprint.slug,
            description: blueprint.description,
            pitch: blueprint.pitch,
            flavorText: blueprint.flavorText,
            artPrompt: blueprint.artPrompt,
            dreamType: 'PITCH',
            creationSource: 'AI',
            designer: 'Daily Dream Facet Engine',
            userId: auth.user.id,
            isPublic,
            isMature,
            isActive: true,
          },
        })

        if (blueprint.facets.length) {
          await tx.dreamFacet.createMany({
            data: blueprint.facets.map((facet) => ({
              dreamId: dream.id,
              facetId: facet.facetId,
            })),
            skipDuplicates: true,
          })
        }

        const characterIds: number[] = []
        for (const character of blueprint.characters) {
          const createdCharacter = await tx.character.create({
            data: {
              name: character.name,
              species: character.species,
              class: character.characterClass,
              role: character.role,
              alignment: character.alignment,
              personality: character.personality,
              quirks: character.quirks,
              backstory: character.backstory,
              artPrompt: character.artPrompt,
              designer: 'Daily Dream Facet Engine',
              userId: auth.user.id,
              isPublic,
              isMature,
              isActive: true,
            },
          })
          characterIds.push(createdCharacter.id)

          if (character.facets.length) {
            await tx.characterFacet.createMany({
              data: character.facets.map((facet, index) => ({
                characterId: createdCharacter.id,
                facetId: facet.facetId,
                fieldKey: facet.fieldKey,
                sortOrder: index,
                source: 'DAILY_DREAM',
              })),
              skipDuplicates: true,
            })
          }
        }

        const rewardIds: number[] = []
        for (const reward of blueprint.rewards) {
          const createdReward = await tx.reward.create({
            data: {
              name: reward.name,
              description: reward.description,
              effect: reward.effect,
              flavorText: reward.flavorText,
              artPrompt: reward.artPrompt,
              rewardType: reward.rewardType,
              rarity: reward.rarity,
              collection: 'Daily Dream Objects',
              userId: auth.user.id,
              isPublic,
              isMature,
              isActive: true,
            },
          })
          rewardIds.push(createdReward.id)

          if (reward.facets.length) {
            await tx.rewardFacet.createMany({
              data: reward.facets.map((facet, index) => ({
                rewardId: createdReward.id,
                facetId: facet.facetId,
                fieldKey: facet.fieldKey,
                sortOrder: index,
                source: 'DAILY_DREAM',
              })),
              skipDuplicates: true,
            })
          }
        }

        const connected = await tx.dream.update({
          where: { id: dream.id },
          data: {
            Characters: { connect: characterIds.map((id) => ({ id })) },
            Rewards: { connect: rewardIds.map((id) => ({ id })) },
          },
          include: dailyDreamInclude,
        })

        return { dream: connected, characterIds, rewardIds }
      })
    } catch (cause) {
      if (
        cause instanceof Prisma.PrismaClientKnownRequestError &&
        cause.code === 'P2002'
      ) {
        const raced = await loadExisting()
        if (raced) {
          const racedBlueprint = diversifyDailyDreamNames(
            await blueprintForExisting(raced),
            { userId: auth.user.id, dateKey },
          )
          return {
            success: true,
            message: `Daily Dream for ${dateKey} already exists.`,
            data: {
              dream: raced,
              blueprint: racedBlueprint,
              reused: true,
            },
            statusCode: 200,
          }
        }
      }
      throw cause
    }

    event.node.res.statusCode = 201
    return {
      success: true,
      message: `Created the Daily Dream for ${dateKey} with ${created.characterIds.length} characters and ${created.rewardIds.length} objects.`,
      data: { ...created, blueprint, reused: false },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message || 'Failed to create Daily Dream.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
