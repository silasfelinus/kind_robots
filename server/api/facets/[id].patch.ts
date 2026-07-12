// PATCH /api/facets/:id
import { createError, defineEventHandler, readBody } from 'h3'
import type { FacetKind, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  facetKinds,
  facetSummarySelect,
  hydrateFacetSummaries,
} from '~/server/utils/facetAssignments'
import { normalizeFacetLookupKey } from '~/utils/facetAliases'

type FacetPatchBody = Record<string, unknown>

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function nullableId(value: unknown): number | null {
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
    if (lookupKey && !byLookupKey.has(lookupKey))
      byLookupKey.set(lookupKey, alias)
  }

  return Array.from(byLookupKey.values())
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Facet ID.' })
    }

    const auth = await requireApiUser(event)
    const existing = await prisma.facet.findUnique({
      where: { id },
      select: { id: true, userId: true, slug: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Facet not found.' })
    }

    if (!auth.isAdmin && existing.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Facet.',
      })
    }

    const body = await readBody<FacetPatchBody>(event)
    const data: Prisma.FacetUncheckedUpdateInput = {}

    if (body.title !== undefined) {
      const title = optionalText(body.title)
      if (!title) {
        throw createError({
          statusCode: 400,
          message: 'Facet title cannot be empty.',
        })
      }
      data.title = title
    }
    if (body.kind !== undefined) {
      if (!facetKinds.includes(body.kind as FacetKind)) {
        throw createError({
          statusCode: 400,
          message: `Invalid Facet kind. Expected one of: ${facetKinds.join(', ')}.`,
        })
      }
      data.kind = body.kind as FacetKind
    }
    if (body.description !== undefined)
      data.description = optionalText(body.description)
    if (body.flavorText !== undefined)
      data.flavorText = optionalText(body.flavorText)
    if (body.examples !== undefined) data.examples = optionalText(body.examples)
    if (body.artPrompt !== undefined)
      data.artPrompt = optionalText(body.artPrompt)
    if (body.imagePath !== undefined)
      data.imagePath = optionalText(body.imagePath)
    if (body.cardPath !== undefined) data.cardPath = optionalText(body.cardPath)
    if (body.heroPath !== undefined) data.heroPath = optionalText(body.heroPath)
    if (body.icon !== undefined) data.icon = optionalText(body.icon)
    if (body.designer !== undefined) data.designer = optionalText(body.designer)
    if (body.artImageId !== undefined)
      data.artImageId = nullableId(body.artImageId)
    if (body.artCollectionId !== undefined)
      data.artCollectionId = nullableId(body.artCollectionId)
    if (typeof body.isPublic === 'boolean') data.isPublic = body.isPublic
    if (typeof body.isMature === 'boolean') data.isMature = body.isMature
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive

    const nextSlug = body.slug !== undefined ? facetSlug(body.slug) : null
    if (body.slug !== undefined && !nextSlug) {
      throw createError({
        statusCode: 400,
        message: 'Facet slug cannot be empty.',
      })
    }

    const nextAliases =
      body.aliases !== undefined ? normalizeAliases(body.aliases) : null

    const updated = await prisma.$transaction(async (tx) => {
      if (nextSlug && nextSlug !== existing.slug) {
        const lookupKey = normalizeFacetLookupKey(nextSlug)
        const taken = await tx.facetAlias.findUnique({
          where: { lookupKey },
          select: { facetId: true },
        })
        if (taken && taken.facetId !== id) {
          throw createError({
            statusCode: 409,
            message: `Slug "${nextSlug}" is already used by another Facet.`,
          })
        }
        data.slug = nextSlug
        // The old canonical slug survives as a plain alias so stale links keep resolving.
        await tx.facetAlias.updateMany({
          where: { facetId: id, isCanonical: true },
          data: { isCanonical: false },
        })
        await tx.facetAlias.upsert({
          where: { lookupKey },
          create: {
            facetId: id,
            alias: nextSlug,
            lookupKey,
            isCanonical: true,
            isActive: true,
          },
          update: { alias: nextSlug, isCanonical: true, isActive: true },
        })
      }

      if (nextAliases) {
        const canonicalSlug = nextSlug ?? existing.slug ?? ''
        const canonicalKey = normalizeFacetLookupKey(canonicalSlug)
        const keepKeys = new Set([canonicalKey])

        for (const alias of nextAliases) {
          const lookupKey = normalizeFacetLookupKey(alias)
          if (!lookupKey || lookupKey === canonicalKey) continue
          const taken = await tx.facetAlias.findUnique({
            where: { lookupKey },
            select: { facetId: true },
          })
          if (taken && taken.facetId !== id) {
            throw createError({
              statusCode: 409,
              message: `Alias "${alias}" is already used by another Facet.`,
            })
          }
          keepKeys.add(lookupKey)
          await tx.facetAlias.upsert({
            where: { lookupKey },
            create: {
              facetId: id,
              alias,
              lookupKey,
              isCanonical: false,
              isActive: true,
            },
            update: { alias, isActive: true },
          })
        }

        await tx.facetAlias.updateMany({
          where: {
            facetId: id,
            isCanonical: false,
            lookupKey: { notIn: Array.from(keepKeys) },
          },
          data: { isActive: false },
        })
      }

      return tx.facet.update({
        where: { id },
        data,
        select: facetSummarySelect,
      })
    })

    const [facet] = await hydrateFacetSummaries([updated])
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Facet updated successfully.',
      data: facet,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
