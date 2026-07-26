// PUT /api/rewards/:id/facets
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { resolveFacetSelection } from '~/server/utils/facetAssignments'
import {
  loadRewardFacetCatalog,
  rewardFacetFieldKey,
  type RewardFacetAssignment,
} from '~/server/utils/rewardFacetCatalog'

type RewardFacetInput = {
  facetId?: unknown
  fieldKey?: unknown
  sortOrder?: unknown
  weight?: unknown
  source?: unknown
}

function normalizeFieldKey(value: unknown): string {
  const fieldKey = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!fieldKey || fieldKey.length > 64) {
    throw createError({
      statusCode: 400,
      message: 'Each Reward Facet assignment requires a valid fieldKey.',
    })
  }
  return fieldKey
}

function normalizeSource(value: unknown): string {
  const source = String(value ?? 'CURATED')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '_')
  return (source || 'CURATED').slice(0, 64)
}

function explicitAssignments(body: unknown): RewardFacetAssignment[] | null {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Body must be an object.' })
  }

  const record = body as Record<string, unknown>
  if (!Array.isArray(record.assignments)) return null

  const deduped = new Map<string, RewardFacetAssignment>()
  for (const [index, entry] of (
    record.assignments as RewardFacetInput[]
  ).entries()) {
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
    const assignment = {
      facetId,
      fieldKey,
      sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : index,
      weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
      source: normalizeSource(entry.source),
    }
    deduped.set(`${facetId}:${fieldKey}`, assignment)
  }

  return Array.from(deduped.values())
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Reward ID.' })
    }

    const auth = await requireApiUser(event)
    const reward = await prisma.reward.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })
    if (!reward) {
      throw createError({ statusCode: 404, message: 'Reward not found.' })
    }
    if (!auth.isAdmin && reward.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to edit this Reward.',
      })
    }

    const body = await readBody(event)
    let assignments = explicitAssignments(body)

    if (assignments) {
      await resolveFacetSelection({
        facetIds: assignments.map((assignment) => assignment.facetId),
        userId: auth.user.id,
        isAdmin: auth.isAdmin,
      })
    } else {
      const record = body as Record<string, unknown>
      const facets = await resolveFacetSelection({
        facetIds: record.facetIds,
        facetKeys: record.facetKeys,
        userId: auth.user.id,
        isAdmin: auth.isAdmin,
      })
      const existing = await prisma.rewardFacet.findMany({
        where: { rewardId: id },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      })
      const existingFieldKey = new Map(
        existing.map((assignment) => [assignment.facetId, assignment.fieldKey]),
      )

      assignments = facets.map((facet, index) => ({
        facetId: facet.id,
        fieldKey:
          existingFieldKey.get(facet.id) ?? rewardFacetFieldKey(facet.taxonomy),
        sortOrder: index,
        weight: 1,
        source: existingFieldKey.has(facet.id) ? 'CURATED' : 'MANUAL',
      }))
    }

    await prisma.$transaction(async (tx) => {
      await tx.rewardFacet.deleteMany({ where: { rewardId: id } })
      if (assignments.length) {
        await tx.rewardFacet.createMany({
          data: assignments.map((assignment) => ({
            rewardId: id,
            ...assignment,
          })),
          skipDuplicates: true,
        })
      }
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Reward Facets updated.',
      data: await loadRewardFacetCatalog(id),
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
