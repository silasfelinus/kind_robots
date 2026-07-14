// /server/api/challenges/variants.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import {
  basicSinglePools,
  dreamToRandomListItem,
} from '@/stores/helpers/randomHelper'
import {
  generatePromptVariants,
  extractPlaceholderKeys,
  normalizeVariantKey,
} from '~/server/utils/promptVariants'

type VariantsBody = {
  basePrompt?: unknown
  count?: unknown
}

const MAX_VARIANT_COUNT = 50

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)

    if (!auth.isValid || !auth.user) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required.',
      })
    }

    const body = await readBody<VariantsBody>(event)

    if (
      !body ||
      typeof body.basePrompt !== 'string' ||
      !body.basePrompt.trim()
    ) {
      throw createError({ statusCode: 400, message: 'basePrompt is required.' })
    }

    const count = Number(body.count ?? 1)

    if (!Number.isInteger(count) || count < 1 || count > MAX_VARIANT_COUNT) {
      throw createError({
        statusCode: 400,
        message: `count must be an integer between 1 and ${MAX_VARIANT_COUNT}.`,
      })
    }

    const basePrompt = body.basePrompt.trim()
    const keys = extractPlaceholderKeys(basePrompt)

    if (keys.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'basePrompt must contain at least one {{placeholder}}.',
      })
    }

    const builtInPools = new Map(
      basicSinglePools.map((pool) => [
        normalizeVariantKey(pool.key),
        [...pool.values],
      ]),
    )

    const customKeys = keys.filter((key) => !builtInPools.has(key))

    const randomListPools = new Map<string, string[]>()

    if (customKeys.length > 0) {
      const dreams = await prisma.dream.findMany({
        where: {
          // RANDOMLIST is a virtual/legacy dream type stored as BRAINSTORM in the DB
          // (see LEGACY_DREAM_TYPE_MAP in stores/helpers/dreamHelper.ts).
          dreamType: 'BRAINSTORM',
          isActive: true,
          OR: [{ isPublic: true }, { userId: auth.user.id }],
        },
        orderBy: { updatedAt: 'asc' },
      })

      for (const dream of dreams) {
        const item = dreamToRandomListItem(dream)
        randomListPools.set(normalizeVariantKey(item.title), item.content)
      }
    }

    const variants = generatePromptVariants(
      basePrompt,
      count,
      (key) => builtInPools.get(key) ?? randomListPools.get(key),
    )

    return {
      success: true,
      message: 'Prompt variants generated successfully.',
      data: { basePrompt, count, variants },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
