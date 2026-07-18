import { slugify } from '../../utils/slugify'
import { reserveUniqueSlug } from './characterSlug'

type BotSlugRow = {
  id: number
  slug: string | null
}

type UniqueSlugOptions = {
  excludeId?: number
  reservedSlugs?: Set<string>
}

// Mirrors getUniqueCharacterSlug: derive a unique, collision-free slug for a
// Bot from a source string (usually its name), respecting slugs already taken.
export async function getUniqueBotSlug(
  client: any,
  source: string,
  options: UniqueSlugOptions = {},
): Promise<string | null> {
  const base = slugify(source)
  if (!base) return null

  const rows = (await client.bot.findMany({
    where: {
      slug: { not: null },
      ...(options.excludeId ? { NOT: { id: options.excludeId } } : {}),
    },
    select: {
      id: true,
      slug: true,
    },
  })) as BotSlugRow[]

  const taken = new Set(
    rows.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)),
  )

  for (const slug of options.reservedSlugs ?? []) {
    taken.add(slug)
  }

  return reserveUniqueSlug(base, taken)
}
