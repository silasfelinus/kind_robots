import { slugify } from '@/utils/slugify'

const maxSlugLength = 255

type CharacterSlugRow = {
  id: number
  name: string
  slug: string | null
}

type CharacterSlugClient = {
  character: {
    findMany: (args: any) => Promise<CharacterSlugRow[]>
  }
}

type UniqueSlugOptions = {
  excludeId?: number
  reservedSlugs?: Set<string>
}

function fitSlug(base: string, suffix = ''): string {
  return `${base.slice(0, maxSlugLength - suffix.length)}${suffix}`
}

export function reserveUniqueSlug(baseValue: string, taken: Set<string>): string | null {
  const base = slugify(baseValue)
  if (!base) return null

  let slug = fitSlug(base)
  let suffix = 2

  while (taken.has(slug)) {
    const nextSuffix = `-${suffix}`
    slug = fitSlug(base, nextSuffix)
    suffix += 1
  }

  taken.add(slug)
  return slug
}

export function getCharacterNameKey(name: string): string {
  return slugify(name)
}

export async function getUniqueCharacterSlug(
  client: CharacterSlugClient,
  source: string,
  options: UniqueSlugOptions = {},
): Promise<string | null> {
  const base = slugify(source)
  if (!base) return null

  const rows = await client.character.findMany({
    where: {
      slug: { not: null },
      ...(options.excludeId ? { NOT: { id: options.excludeId } } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  const taken = new Set(
    rows.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)),
  )

  for (const slug of options.reservedSlugs ?? []) {
    taken.add(slug)
  }

  return reserveUniqueSlug(base, taken)
}

export async function findCharacterNameDuplicate(
  client: CharacterSlugClient,
  userId: number,
  name: string,
  excludeId?: number,
): Promise<CharacterSlugRow | null> {
  const key = getCharacterNameKey(name)
  if (!key) return null

  const rows = await client.character.findMany({
    where: {
      userId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { id: 'asc' },
  })

  return rows.find((row) => getCharacterNameKey(row.name) === key) ?? null
}
