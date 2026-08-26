// /server/api/monsters/lookup.ts
//
// cthulhuquarium/t-043: shared id-or-slug resolution for the Monster API.
// Route params arrive as strings, and callers of this API (art-linking
// scripts especially) are as likely to know a creature's slug as its
// numeric id -- t-008's seed keys every row on `slug`, never `id`. A route
// param that parses as a positive integer is treated as an id; anything
// else is looked up by slug.

import { createError } from 'h3'
import prisma from '@/server/utils/prisma'

export const monsterArtSelect = {
  id: true,
  slug: true,
  name: true,
  species: true,
  class: true,
  tier: true,
  isActive: true,
  isPublic: true,
  icon: true,
  iconPath: true,
  imagePath: true,
  cardPath: true,
  heroPath: true,
  artImageId: true,
  cardArtImageId: true,
  heroArtImageId: true,
  iconArtImageId: true,
  updatedAt: true,
} as const

export function monsterIdOrSlugWhere(routeParam: unknown) {
  const raw = String(routeParam ?? '').trim()
  if (!raw) {
    throw createError({
      statusCode: 400,
      message: 'A Monster id or slug is required.',
    })
  }
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? { id } : { slug: raw }
}

export async function findMonsterByIdOrSlug(routeParam: unknown) {
  const monster = await prisma.monster.findUnique({
    where: monsterIdOrSlugWhere(routeParam),
    select: monsterArtSelect,
  })
  if (!monster) {
    throw createError({
      statusCode: 404,
      message: `Monster '${String(routeParam)}' was not found.`,
    })
  }
  return monster
}
