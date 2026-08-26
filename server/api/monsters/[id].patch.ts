// /server/api/monsters/[id].patch.ts
//
// cthulhuquarium/t-043: kaizen from t-015 -- t-008 seeded real Monster rows
// for every bible species and Monster.artImageId (plus the card/hero/icon
// slot columns) already exists in the schema, but no server/api/ route
// existed at all, so a generated ArtImage could never actually be linked to
// the creature it depicts from outside a direct database session.
//
// Scope is deliberately narrow, per the task's own note: this is an
// art-linking endpoint, not a general Monster mutation API. It accepts only
// the four art-image id columns, admin-gated -- Monster rows are shared
// bestiary reference data (no per-row owner the way Character has), so
// "authenticated caller" here means admin/server-key, not "any user".
//
// Each provided id (other than null, which clears the slot) is verified
// against a real ArtImage row first. artImageId has a real Prisma relation
// and would fail loudly on a bad id anyway; cardArtImageId/heroArtImageId/
// iconArtImageId are plain columns with no FK (same convention as
// Character's own slot-id columns), so nothing stops an orphaned reference
// without this check.

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { monsterArtSelect, monsterIdOrSlugWhere } from './lookup'

const ART_ID_FIELDS = [
  'artImageId',
  'cardArtImageId',
  'heroArtImageId',
  'iconArtImageId',
] as const

type ArtIdField = (typeof ART_ID_FIELDS)[number]

function parseArtId(value: unknown, field: ArtIdField): number | null {
  if (value === null) return null
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `${field} must be a positive integer or null.`,
    })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const where = monsterIdOrSlugWhere(getRouterParam(event, 'id'))
    const existing = await prisma.monster.findUnique({
      where,
      select: { id: true },
    })
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Monster '${getRouterParam(event, 'id')}' was not found.`,
      })
    }

    const body = (await readBody<Record<string, unknown>>(event)) || {}
    const data: Partial<Record<ArtIdField, number | null>> = {}

    for (const field of ART_ID_FIELDS) {
      if (body[field] === undefined) continue
      data[field] = parseArtId(body[field], field)
    }

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: `No valid fields provided. Expected one or more of: ${ART_ID_FIELDS.join(', ')}.`,
      })
    }

    const artImageIds = Object.values(data).filter(
      (value): value is number => value !== null,
    )
    if (artImageIds.length) {
      const found = await prisma.artImage.findMany({
        where: { id: { in: artImageIds } },
        select: { id: true },
      })
      const foundIds = new Set(found.map((row) => row.id))
      const missing = artImageIds.filter((id) => !foundIds.has(id))
      if (missing.length) {
        throw createError({
          statusCode: 404,
          message: `ArtImage id(s) not found: ${missing.join(', ')}.`,
        })
      }
    }

    const monster = await prisma.monster.update({
      where: { id: existing.id },
      data,
      select: monsterArtSelect,
    })

    return {
      success: true,
      message: 'Monster art updated successfully.',
      data: monster,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to update Monster.',
      data: null,
      statusCode,
    }
  }
})
