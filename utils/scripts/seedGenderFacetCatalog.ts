// /utils/scripts/seedGenderFacetCatalog.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { ADVENTURE_CARDS } from './../../stores/helpers/adventureCards'
import { legacyFacetGenderValues } from './../seeds/facetGenderValues'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})
const apply = process.argv.includes('--apply')

type GenderCandidate = {
  title: string
  canonicalValue: string
  description?: string
  imagePath?: string
  sortOrder: number
  sourceRank: number
  aliases: Set<string>
  metadata: Record<string, unknown>
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220)
}

function titleCase(value: string): string {
  if (value.startsWith('N/A')) return 'Does Not Apply'
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function collectGenderCandidates(): GenderCandidate[] {
  const candidates = new Map<string, GenderCandidate>()
  const genderCard = ADVENTURE_CARDS.find((card) => card.key === 'gender')

  for (const step of genderCard?.steps ?? []) {
    const fieldKey = clean(step.field) || clean(step.key)
    if (fieldKey !== 'gender') continue

    for (const [sortOrder, choice] of (step.choices ?? []).entries()) {
      if (choice.opensCustom || choice.opensList) continue
      const canonicalValue = clean(choice.value)
      const title = clean(choice.label) || canonicalValue
      if (!canonicalValue || !title) continue

      const key = normalizeFacetLookupKey(canonicalValue)
      if (!key) continue
      candidates.set(key, {
        title,
        canonicalValue,
        description: clean(choice.subtext) || undefined,
        imagePath: clean(choice.image) || undefined,
        sortOrder,
        sourceRank: 10,
        aliases: new Set([title, canonicalValue]),
        metadata: {
          source: 'adventure-builder',
          fieldKey: 'gender',
          cardKey: genderCard?.key ?? 'gender',
          stepKey: step.key,
        },
      })
    }
  }

  let nextOrder = candidates.size
  for (const value of legacyFacetGenderValues) {
    const canonicalValue = clean(value)
    const key = normalizeFacetLookupKey(canonicalValue)
    if (!canonicalValue || !key || candidates.has(key)) continue

    const title = titleCase(canonicalValue)
    candidates.set(key, {
      title,
      canonicalValue,
      sortOrder: nextOrder++,
      sourceRank: 90,
      aliases: new Set([title, canonicalValue]),
      metadata: {
        source: 'legacy-generator-gender-list',
        fieldKey: 'gender',
      },
    })
  }

  return Array.from(candidates.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
  )
}

async function saveCandidate(candidate: GenderCandidate): Promise<number> {
  const slug = `gender-${slugify(candidate.title || candidate.canonicalValue)}`
  const existing = await prisma.facet.findUnique({ where: { slug } })
  const facet = existing
    ? await prisma.facet.update({
        where: { id: existing.id },
        data: {
          title: candidate.title,
          description: candidate.description || existing.description,
          imagePath: candidate.imagePath || existing.imagePath,
          designer: existing.designer || 'facet-catalog',
          isActive: true,
        },
      })
    : await prisma.facet.create({
        data: {
          title: candidate.title,
          slug,
          kind: 'OTHER',
          description: candidate.description,
          imagePath: candidate.imagePath,
          designer: 'facet-catalog',
          creationSource: 'HUMAN',
          userId: 1,
          isPublic: true,
          isMature: false,
          isActive: true,
        },
      })

  await prisma.facetProfile.upsert({
    where: { facetId: facet.id },
    create: {
      facetId: facet.id,
      taxonomy: 'GENDER',
      canonicalValue: candidate.canonicalValue,
      groupKey: 'gender',
      groupLabel: 'Gender',
      sortOrder: candidate.sortOrder,
      isRandomizable: true,
      randomWeight: 1,
      artRequired: true,
      sourceRank: candidate.sourceRank,
      metadata: JSON.stringify(candidate.metadata),
    },
    update: {
      taxonomy: 'GENDER',
      canonicalValue: candidate.canonicalValue,
      groupKey: 'gender',
      groupLabel: 'Gender',
      sortOrder: candidate.sortOrder,
      isRandomizable: true,
      artRequired: true,
      sourceRank: candidate.sourceRank,
      metadata: JSON.stringify(candidate.metadata),
    },
  })

  for (const alias of prepareUniqueFacetAliases([
    slug,
    candidate.title,
    candidate.canonicalValue,
    ...candidate.aliases,
  ])) {
    const owner = await prisma.facetAlias.findUnique({
      where: { lookupKey: alias.lookupKey },
      select: { facetId: true },
    })
    if (owner && owner.facetId !== facet.id) {
      console.warn(
        `[facet-catalog] Gender alias ${alias.alias} already belongs to Facet ${owner.facetId}; leaving it unchanged.`,
      )
      continue
    }

    await prisma.facetAlias.upsert({
      where: { lookupKey: alias.lookupKey },
      create: {
        facetId: facet.id,
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
      update: {
        facetId: facet.id,
        alias: alias.alias,
        isCanonical: alias.lookupKey === normalizeFacetLookupKey(slug),
        isActive: true,
      },
    })
  }

  return facet.id
}

async function backfillCharacterGender(
  facetIdByLookupKey: Map<string, number>,
): Promise<number> {
  const characters = await prisma.character.findMany({
    where: { gender: { not: null } },
    select: { id: true, gender: true },
  })
  let linked = 0

  for (const character of characters) {
    const lookupKey = normalizeFacetLookupKey(character.gender || '')
    const facetId = lookupKey ? facetIdByLookupKey.get(lookupKey) : undefined
    if (!facetId) continue

    await prisma.$transaction([
      prisma.characterFacet.deleteMany({
        where: { characterId: character.id, fieldKey: 'gender' },
      }),
      prisma.characterFacet.create({
        data: {
          characterId: character.id,
          facetId,
          fieldKey: 'gender',
          sortOrder: 0,
          weight: 1,
          source: 'MIGRATED',
        },
      }),
    ])
    linked++
  }

  return linked
}

async function main(): Promise<void> {
  const candidates = collectGenderCandidates()
  const directArtwork = candidates.filter((candidate) => candidate.imagePath).length
  const missingRequiredArt = candidates.length - directArtwork

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          taxonomy: 'GENDER',
          candidates: candidates.length,
          directArtwork,
          missingRequiredArt,
          note: 'Run with --apply after prisma migrate deploy.',
        },
        null,
        2,
      )}\n`,
    )
    return
  }

  const facetIdByLookupKey = new Map<string, number>()
  for (const candidate of candidates) {
    const facetId = await saveCandidate(candidate)
    for (const alias of [
      candidate.title,
      candidate.canonicalValue,
      ...candidate.aliases,
    ]) {
      const lookupKey = normalizeFacetLookupKey(alias)
      if (lookupKey) facetIdByLookupKey.set(lookupKey, facetId)
    }
  }

  const characterLinks = await backfillCharacterGender(facetIdByLookupKey)
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        taxonomy: 'GENDER',
        candidates: candidates.length,
        saved: candidates.length,
        directArtwork,
        missingRequiredArt,
        characterLinks,
      },
      null,
      2,
    )}\n`,
  )
}

await main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
