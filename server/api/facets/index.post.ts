// POST /api/facets
import { createError, defineEventHandler, readBody } from 'h3'
import type {
  CreationSource,
  FacetKind,
  Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  facetKinds,
  facetSummarySelect,
  hydrateFacetSummaries,
} from '~/server/utils/facetAssignments'
import { normalizeFacetLookupKey } from '~/utils/facetAliases'

type FacetCreateBody = {
  title?: unknown
  slug?: unknown
  kind?: unknown
  description?: unknown
  flavorText?: unknown
  examples?: unknown
  artPrompt?: unknown
  imagePath?: unknown
  cardPath?: unknown
  heroPath?: unknown
  icon?: unknown
  designer?: unknown
  creationSource?: unknown
  artImageId?: unknown
  artCollectionId?: unknown
  isPublic?: unknown
  isMature?: unknown
  aliases?: unknown
}

const creationSources: CreationSource[] = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
]

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function positiveId(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function facetSlug(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeAliases(value: unknown): string[] {
  const entries = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  const aliases = entries
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)

  const byLookupKey = new Map<string, string>()
  for (const alias of aliases) {
    const lookupKey = normalizeFacetLookupKey(alias)
    if (lookupKey && !byLookupKey.has(lookupKey)) byLookupKey.set(lookupKey, alias)
  }

  return Array.from(byLookupKey.values())
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<FacetCreateBody>(event)
    const title = optionalText(body.title)

    if (!title) {
      throw createError({ statusCode: 400, message: 'Facet title is required.' })
    }

    const slug = facetSlug(body.slug || title)
    if (!slug) {
      throw createError({ statusCode: 400, message: 'Facet slug is required.' })
    }

    const kind = facetKinds.includes(body.kind as FacetKind)
      ? (body.kind as FacetKind)
      : 'OTHER'
    const creationSource = creationSources.includes(
      body.creationSource as CreationSource,
    )
      ? (body.creationSource as CreationSource)
      : 'HUMAN'

    const explicitAliases = normalizeAliases(body.aliases)
    const aliasesByKey = new Map<string, { alias: string; isCanonical: boolean }>()
    const canonicalKey = normalizeFacetLookupKey(slug)
    aliasesByKey.set(canonicalKey, { alias: slug, isCanonical: true })

    for (const alias of explicitAliases) {
      const lookupKey = normalizeFacetLookupKey(alias)
      if (!lookupKey || lookupKey === canonicalKey) continue
      aliasesByKey.set(lookupKey, { alias, isCanonical: false })
    }

    const created = await prisma.$transaction(async (tx) => {
      const data: Prisma.FacetUncheckedCreateInput = {
        title,
        slug,
        kind,
        description: optionalText(body.description),
        flavorText: optionalText(body.flavorText),
        examples: optionalText(body.examples),
        artPrompt: optionalText(body.artPrompt),
        imagePath: optionalText(body.imagePath),
        cardPath: optionalText(body.cardPath),
        heroPath: optionalText(body.heroPath),
        icon: optionalText(body.icon),
        designer: optionalText(body.designer),
        creationSource,
        userId: auth.user.id,
        artImageId: positiveId(body.artImageId),
        artCollectionId: positiveId(body.artCollectionId),
        isPublic: body.isPublic !== false,
        isMature: body.isMature === true,
        isActive: true,
      }

      const facet = await tx.facet.create({
        data,
        select: facetSummarySelect,
      })

      await tx.facetAlias.createMany({
        data: Array.from(aliasesByKey.entries()).map(
          ([lookupKey, alias]) => ({
            facetId: facet.id,
            alias: alias.alias,
            lookupKey,
            isCanonical: alias.isCanonical,
            isActive: true,
          }),
        ),
      })

      return facet
    })

    const [facet] = await hydrateFacetSummaries([created])
    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Facet created successfully.',
      data: facet,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
