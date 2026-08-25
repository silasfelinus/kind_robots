// /server/utils/aquariumSlug.ts
//
// Unique-per-owner slug generation for Aquarium, mirroring
// server/utils/characterSlug.ts's reserveUniqueSlug pattern. Aquarium.slug
// is @@unique([userId, slug]) (cthulhuquarium/t-032 -- deliberately NOT
// globally unique, since a global unique constraint collided the moment a
// second user picked the same tank name), so uniqueness is checked only
// against the same user's existing tanks.

import { slugify } from '../../utils/slugify'
import { reserveUniqueSlug } from './characterSlug'
import prisma from './prisma'

const FALLBACK_BASE = 'tank'

// Picks a slug unique among `userId`'s own Aquarium rows, seeded from
// `source` (typically the user's username). Falls back to a generic base
// when `source` slugifies to nothing (e.g. a username that is entirely
// non-ASCII punctuation).
export async function getUniqueAquariumSlugForUser(
  userId: number,
  source: string,
): Promise<string> {
  const base = slugify(source) || FALLBACK_BASE

  const rows = await prisma.aquarium.findMany({
    where: { userId },
    select: { slug: true },
  })

  const taken = new Set(rows.map((row) => row.slug))

  return reserveUniqueSlug(base, taken) ?? `${FALLBACK_BASE}-${Date.now()}`
}
