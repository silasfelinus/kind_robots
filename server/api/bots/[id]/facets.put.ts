// PUT /api/bots/:id/facets
/*
 * Carries the same fix as characters/[id]/facets.put.ts, which see for the full
 * account. In short: a `{ facetIds: [], facetKeys: [...] }` body normalized to
 * zero assignments here, and the unconditional deleteMany below still ran -- so
 * the request cleared the Bot's Facets, wrote nothing, and answered
 * `success: true`.
 *
 * Found while fixing the Character endpoint, not reported from the field: no
 * caller currently sends slugs to a Bot, so unlike Characters this one has not
 * actually eaten anything. It is the identical defect one route over, and a
 * route that silently deletes and reports success is not worth leaving armed.
 */
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { resolveFacetSelection } from '~/server/utils/facetAssignments'
import { loadBotFacetCatalog } from '~/server/utils/facetCatalog'

type BotFacetInput = {
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
      message: 'Each Bot Facet assignment requires a valid fieldKey.',
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

type BotFacetAssignment = {
  facetId: number
  fieldKey: string
  sortOrder: number
  weight: number
  source: string
}

/** The caller's explicit assignments, or null when it gave none. */
function explicitAssignments(body: unknown): BotFacetAssignment[] | null {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Body must be an object.' })
  }

  const record = body as Record<string, unknown>
  const rawAssignments = Array.isArray(record.assignments)
    ? (record.assignments as BotFacetInput[])
    : []

  if (!rawAssignments.length && Array.isArray(record.facetIds)) {
    const fieldKey = normalizeFieldKey(record.fieldKey ?? 'facet')
    for (const facetId of record.facetIds) {
      rawAssignments.push({ facetId, fieldKey })
    }
  }

  // An `assignments` array the caller actually sent is authoritative even when
  // empty -- that is a deliberate clear. Anything else with nothing in it falls
  // through to the facetIds/facetKeys selection.
  if (!Array.isArray(record.assignments) && !rawAssignments.length) return null

  const deduped = new Map<string, BotFacetAssignment>()

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
      throw createError({ statusCode: 400, message: 'Invalid Bot ID.' })
    }

    const auth = await requireApiUser(event)
    const bot = await prisma.bot.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!bot) {
      throw createError({ statusCode: 404, message: 'Bot not found.' })
    }

    if (!auth.isAdmin && bot.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to edit this Bot.',
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
      const existing = await prisma.botFacet.findMany({
        where: { botId: id },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      })
      const existingFieldKey = new Map(
        existing.map((assignment) => [assignment.facetId, assignment.fieldKey]),
      )

      /*
       * 'facet' rather than a taxonomy-derived key: a Bot has no field/taxonomy
       * convention the way a Character does (CHARACTER_FIELD_TAXONOMIES) or a
       * Reward does (rewardFacetFieldKey), and this endpoint's own facetIds path
       * already defaults to 'facet'. Inventing a second convention here would be
       * a guess nothing reads back.
       */
      assignments = facets.map((facet, index) => ({
        facetId: facet.id,
        fieldKey: existingFieldKey.get(facet.id) ?? 'facet',
        sortOrder: index,
        weight: 1,
        source: existingFieldKey.has(facet.id) ? 'CURATED' : 'MANUAL',
      }))
    }

    await prisma.$transaction(async (tx) => {
      await tx.botFacet.deleteMany({ where: { botId: id } })

      if (assignments.length) {
        await tx.botFacet.createMany({
          data: assignments.map((assignment) => ({
            botId: id,
            ...assignment,
          })),
          skipDuplicates: true,
        })
      }
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Bot Facets updated.',
      data: await loadBotFacetCatalog(id),
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
