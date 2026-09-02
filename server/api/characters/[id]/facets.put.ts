// PUT /api/characters/:id/facets
/*
 * ACCEPTS FACET KEYS, NOT ONLY IDS -- and that was a silent data-loss bug.
 *
 * Every other Facet PUT (dreams, scenarios, rewards, art images) resolves a
 * `{ facetIds, facetKeys }` selection; this one read `assignments` or
 * `facetIds` and nothing else. A caller sending slugs therefore normalized to
 * ZERO assignments, and the transaction below still ran its unconditional
 * deleteMany -- so the request wiped the Character's Facets, created nothing,
 * and returned `success: true` with an empty catalog. Silent, and reported as a
 * success to whoever asked.
 *
 * Conductor's daily-dream pipeline is exactly that caller: it resolves seed
 * Facets to slugs and only falls back to ids when a slug is missing, so it
 * sends `facetIds: []` with a full `facetKeys`. Measured 2026-09-02: all 36
 * built dream bundles recorded `facet_assignments.status: "complete"` with
 * `errors: []` while every one of their Characters had `facet_ids: []`, and
 * GET /api/characters/3320/facets on production returned `data: []` for a
 * character whose bundle requested six. Silas, seeing the digest: "I just don't
 * get the facets added as part of my daily digest, so there is a discrepancy."
 *
 * The fallback branch mirrors rewards/[id]/facets.put.ts, which had already
 * solved this: resolve the selection, then map each Facet onto the fieldKey its
 * taxonomy belongs under, preserving the fieldKey a Facet already had so a
 * re-apply does not reclassify curated assignments.
 */
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { resolveFacetSelection } from '~/server/utils/facetAssignments'
import { loadCharacterFacetCatalog } from '~/server/utils/facetCatalog'
import { characterFacetFieldKey } from '~/server/utils/characterFacetSync'

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

type CharacterFacetAssignment = {
  facetId: number
  fieldKey: string
  sortOrder: number
  weight: number
  source: string
}

/**
 * The caller's explicit assignments, or null when it did not give any.
 *
 * null means "fall through to the facetIds/facetKeys selection" -- distinct
 * from an empty array, which is a caller deliberately clearing the Character's
 * Facets. Returning [] for both is what made a slug-only body read as an
 * intentional clear.
 */
function explicitAssignments(body: unknown): CharacterFacetAssignment[] | null {
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

  /*
   * An `assignments` array the caller actually sent is authoritative even when
   * empty -- that is how you clear a Character's Facets on purpose. Everything
   * else with nothing in it is not a selection at all, and falls through to the
   * facetIds/facetKeys branch. Conflating the two is the whole bug: a body of
   * `{ facetIds: [], facetKeys: [...] }` read as "clear it".
   */
  if (!Array.isArray(record.assignments) && !rawAssignments.length) return null

  const deduped = new Map<string, CharacterFacetAssignment>()

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
      const existing = await prisma.characterFacet.findMany({
        where: { characterId: id },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      })
      const existingFieldKey = new Map(
        existing.map((assignment) => [assignment.facetId, assignment.fieldKey]),
      )

      assignments = facets.map((facet, index) => ({
        facetId: facet.id,
        fieldKey:
          existingFieldKey.get(facet.id) ??
          characterFacetFieldKey(facet.taxonomy),
        sortOrder: index,
        weight: 1,
        source: existingFieldKey.has(facet.id) ? 'CURATED' : 'MANUAL',
      }))
    }

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
