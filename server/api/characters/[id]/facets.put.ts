// PUT /api/characters/:id/facets
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { resolveFacetSelection } from '~/server/utils/facetAssignments'
import { loadCharacterFacetCatalog } from '~/server/utils/facetCatalog'

type CharacterFacetInput = {
  facetId?: unknown
  fieldKey?: unknown
  sortOrder?: unknown
  weight?: unknown
  source?: unknown
}

function normalizeFieldKey(value: unknown): string {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!key || key.length > 64) {
    throw createError({
      statusCode: 400,
      message: 'Each Character Facet assignment requires a valid fieldKey.',
    })
  }

  return key
}

function normalizeSource(value: unknown): string {
  const source = String(value ?? 'CURATED')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '_')
  return (source || 'CURATED').slice(0, 64)
}

function normalizeAssignments(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Body must be an object.' })
  }

  const record = body as Record<string, unknown>
  const rawAssignments = Array.isArray(record.assignments)
    ? (record.assignments as CharacterFacetInput[])
    : []

  if (!rawAssignments.length && Array.isArray(record.facetIds)) {
    const fieldKey = normalizeFieldKey(record.fieldKey ?? 'facet')
    for (const facetId of record.facetIds) {
      rawAssignments.push({ facetId, fieldKey })
    }
  }

  const deduped = new Map<
    string,
    {
      facetId: number
      fieldKey: string
      sortOrder: number
      weight: number
      source: string
    }
  >()

  for (const [index, entry] of rawAssignments.entries()) {
    const facetId = Number(entry?.facetId)
    if (!Number.isInteger(facetId) || facetId <= 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid facetId at assignment ${index + 1}.`,
      })
    }

    const fieldKey = normalizeFieldKey(entry.fieldKey)
    const sortOrder = Number(entry.sortOrder)
    const weight = Number(entry.weight)
    const normalized = {
      facetId,
      fieldKey,
      sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : index,
      weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
      source: normalizeSource(entry.source),
    }

    deduped.set(`${facetId}:${fieldKey}`, normalized)
  }

  return Array.from(deduped.values())
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Character ID.' })
    }

    const auth = await requireApiUser(event)
    const character = await prisma.character.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!character) {
      throw createError({ statusCode: 404, message: 'Character not found.' })
    }

    if (!auth.isAdmin && character.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to edit this Character.',
      })
    }

    const assignments = normalizeAssignments(await readBody(event))
    await resolveFacetSelection({
      facetIds: assignments.map((assignment) => assignment.facetId),
      userId: auth.user.id,
      isAdmin: auth.isAdmin,
    })

    await prisma.$transaction(async (tx) => {
      await tx.characterFacet.deleteMany({ where: { characterId: id } })

      if (assignments.length) {
        await tx.characterFacet.createMany({
          data: assignments.map((assignment) => ({
            characterId: id,
            ...assignment,
          })),
          skipDuplicates: true,
        })
      }
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Character Facets updated.',
      data: await loadCharacterFacetCatalog(id),
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
