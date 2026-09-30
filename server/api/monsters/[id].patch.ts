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

// cthulhuquarium/t-022: the shared-bestiary tag list is the one non-art field
// this route accepts, so a stale `games` value (a species tagged for
// ruler-hooked after the last seed run) can be corrected without a direct DB
// session. Accepts an array or a comma-separated string; stored comma-joined,
// the same shape scripts/seed_bestiary.ts writes.
function parseGames(value: unknown): string {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : null
  const tags = (list ?? [])
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
  if (!list || !tags.length || tags.some((tag) => !/^[a-z0-9-]+$/.test(tag))) {
    throw createError({
      statusCode: 400,
      message:
        'games must be a non-empty list of lowercase game slugs (array or comma-separated string).',
    })
  }
  return [...new Set(tags)].join(',')
}

// cthulhuquarium/t-076: the two path columns the client actually renders. Only
// stable same-origin plate URLs are accepted (or null to clear), so this stays an
// art-linking endpoint and cannot point a Monster at an arbitrary remote URL.
const PATH_FIELDS = ['iconPath', 'cardPath'] as const
const PLATE_PATH = /^\/cthulhuquarium-plates\/[a-z0-9][a-z0-9._-]*\.webp$/

function parsePlatePath(value: unknown, field: string): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !PLATE_PATH.test(value)) {
    throw createError({
      statusCode: 400,
      message: `${field} must be null or a /cthulhuquarium-plates/*.webp path.`,
    })
  }
  return value
}

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
    const data: Partial<Record<ArtIdField, number | null>> &
      Partial<Record<(typeof PATH_FIELDS)[number], string | null>> & {
        games?: string
      } = {}

    for (const field of PATH_FIELDS) {
      if (body[field] === undefined) continue
      data[field] = parsePlatePath(body[field], field)
    }

    for (const field of ART_ID_FIELDS) {
      if (body[field] === undefined) continue
      data[field] = parseArtId(body[field], field)
    }

    if (body.games !== undefined) data.games = parseGames(body.games)

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: `No valid fields provided. Expected one or more of: ${[...ART_ID_FIELDS, ...PATH_FIELDS, 'games'].join(', ')}.`,
      })
    }

    // Only the art-id columns reference ArtImage rows; `games` is a string.
    const artImageIds = ART_ID_FIELDS.map((field) => data[field]).filter(
      (value): value is number => typeof value === 'number',
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
      message: 'Monster updated successfully.',
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
