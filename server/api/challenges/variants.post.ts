// /server/api/challenges/variants.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { basicSinglePools } from '@/stores/helpers/randomHelper'
import {
  loadFacetCatalogEntries,
  type FacetTaxonomy,
} from '~/server/utils/facetCatalog'
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

const FACET_PLACEHOLDERS: Record<string, FacetTaxonomy[]> = {
  animal: ['ANIMAL'],
  species: ['ANIMAL', 'SPECIES'],
  backstory: ['BACKSTORY'],
  class: ['OCCUPATION', 'ARCHETYPE', 'ROLE'],
  occupation: ['OCCUPATION'],
  archetype: ['ARCHETYPE'],
  role: ['ROLE'],
  alignment: ['ALIGNMENT'],
  color: ['COLOR'],
  palette: ['COLOR'],
  genre: ['GENRE'],
  material: ['MATERIAL'],
  personality: ['PERSONALITY'],
  quirk: ['QUIRK'],
  theme: ['THEME'],
  style: ['STYLE'],
  mood: ['MOOD'],
  setting: ['SETTING'],
  core: ['CORE'],
  artdirection: ['ART_DIRECTION', 'PROMPT_ENHANCEMENT'],
}

function addPool(
  pools: Map<string, string[]>,
  key: string,
  values: Iterable<string>,
): void {
  const normalizedKey = normalizeVariantKey(key)
  const existing = pools.get(normalizedKey) ?? []
  pools.set(
    normalizedKey,
    Array.from(
      new Set([
        ...existing,
        ...Array.from(values)
          .map((value) => value.trim())
          .filter(Boolean),
      ]),
    ),
  )
}

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

    const pools = new Map<string, string[]>()
    for (const pool of basicSinglePools) {
      addPool(pools, pool.key, pool.values)
    }

    const requestedFacetTaxonomies = Array.from(
      new Set(
        keys.flatMap(
          (key) => FACET_PLACEHOLDERS[normalizeVariantKey(key)] ?? [],
        ),
      ),
    )

    if (requestedFacetTaxonomies.length) {
      const facets = await loadFacetCatalogEntries({
        taxonomies: requestedFacetTaxonomies,
        randomizableOnly: true,
        userId: auth.user.id,
        isAdmin: auth.user.Role === 'ADMIN' || auth.user.id === 1,
        take: 1000,
      })

      for (const [placeholder, taxonomies] of Object.entries(
        FACET_PLACEHOLDERS,
      )) {
        addPool(
          pools,
          placeholder,
          facets
            .filter((facet) => taxonomies.includes(facet.taxonomy))
            .map((facet) => facet.canonicalValue || facet.title),
        )
      }
    }

    const rewardPlaceholderKeys = new Set([
      'item',
      'skill',
      'power',
      'pet',
      'magic',
      'favor',
    ])
    if (keys.some((key) => rewardPlaceholderKeys.has(normalizeVariantKey(key)))) {
      const rewards = await prisma.reward.findMany({
        where: {
          isActive: true,
          OR: [{ isPublic: true }, { userId: auth.user.id }],
        },
        select: { name: true, rewardType: true },
        orderBy: { name: 'asc' },
      })

      for (const reward of rewards) {
        addPool(pools, reward.rewardType.toLowerCase(), [reward.name])
      }
    }

    const variants = generatePromptVariants(
      basePrompt,
      count,
      (key) => pools.get(key),
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
