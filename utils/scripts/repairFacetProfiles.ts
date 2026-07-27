// Repair legacy Facets that never received a FacetProfile during the Facet
// migration. Each active Facet without a profile is flagged by the strict audit
// as FACET_WITHOUT_PROFILE, and every assignment that references it cascades
// into ASSIGNMENT_WITHOUT_PROFILE + CHARACTER/BOT taxonomy mismatches.
//
// The fix is deterministic: a Facet's dormant `kind` already records its
// concept family (all 26 current legacy facets are kind=GENRE), so the profile
// is minted with taxonomy = kind (validated against the FacetTaxonomy enum,
// falling back to OTHER), canonicalValue = the Facet title, and grouping/render
// metadata mirrored from an existing profile of the same taxonomy.
//
// Guards:
//   - Skips any Facet that already has a profile (idempotent).
//   - Skips (and reports for manual merge) any Facet whose (taxonomy,
//     normalized canonicalValue) already belongs to another profile, so the
//     repair can never introduce a DUPLICATE_CANONICAL_VALUE regression — use
//     mergeCanonicalFacetDuplicates.ts for those.
//   - Ensures each repaired Facet has an active canonical alias (creates one
//     from the title only if the Facet has none), so the profile can't leave an
//     ACTIVE_FACET_WITHOUT_ALIAS gap behind.
//
// Usage:
//   DATABASE_URL=... tsx utils/scripts/repairFacetProfiles.ts            # dry-run
//   DATABASE_URL=... tsx utils/scripts/repairFacetProfiles.ts --apply    # write
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl: string = process.env.DATABASE_URL ?? ''
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.slice(2).includes('--apply')

const FACET_TAXONOMIES = new Set([
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'SPECIES',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'ALIGNMENT',
  'GENDER',
  'BOT_TYPE',
  'DREAM_TYPE',
  'REWARD_TYPE',
  'RARITY',
  'PERSONALITY',
  'BACKSTORY',
  'QUIRK',
  'MATERIAL',
  'PROMPT_ENHANCEMENT',
  'OTHER',
])

function taxonomyForKind(kind: unknown): string {
  const normalized = typeof kind === 'string' ? kind.trim().toUpperCase() : ''
  return FACET_TAXONOMIES.has(normalized) ? normalized : 'OTHER'
}

type ProfileTemplate = {
  groupKey: string | null
  groupLabel: string | null
  artRequired: boolean
  isRandomizable: boolean
  randomWeight: number
  sourceRank: number
  maxSortOrder: number
}

async function main(): Promise<void> {
  const [facets, profiles, aliases] = await Promise.all([
    prisma.facet.findMany({
      select: { id: true, title: true, slug: true, kind: true, isActive: true },
    }),
    prisma.facetProfile.findMany({
      select: {
        facetId: true,
        taxonomy: true,
        canonicalValue: true,
        groupKey: true,
        groupLabel: true,
        artRequired: true,
        isRandomizable: true,
        randomWeight: true,
        sourceRank: true,
        sortOrder: true,
      },
    }),
    prisma.facetAlias.findMany({
      where: { isActive: true },
      select: { facetId: true },
    }),
  ])

  const profiledFacetIds = new Set(profiles.map((profile) => profile.facetId))
  const facetById = new Map(facets.map((facet) => [facet.id, facet]))
  const facetsWithAlias = new Set(aliases.map((alias) => alias.facetId))

  // Existing (taxonomy, normalized canonicalValue) occupancy — mirrors the
  // audit's DUPLICATE_CANONICAL_VALUE key so the repair can't collide.
  const canonicalOccupied = new Set<string>()
  // First profile encountered per taxonomy becomes the metadata template, and
  // we track the running max sortOrder so new rows append after the deck.
  const templateByTaxonomy = new Map<string, ProfileTemplate>()
  for (const profile of profiles) {
    const facet = facetById.get(profile.facetId)
    const lookup = normalizeFacetLookupKey(
      profile.canonicalValue || facet?.title || facet?.slug || '',
    )
    if (lookup) canonicalOccupied.add(`${profile.taxonomy}:${lookup}`)

    const template = templateByTaxonomy.get(profile.taxonomy)
    if (!template) {
      templateByTaxonomy.set(profile.taxonomy, {
        groupKey: profile.groupKey,
        groupLabel: profile.groupLabel,
        artRequired: profile.artRequired,
        isRandomizable: profile.isRandomizable,
        randomWeight: profile.randomWeight,
        sourceRank: profile.sourceRank,
        maxSortOrder: profile.sortOrder,
      })
    } else {
      template.maxSortOrder = Math.max(template.maxSortOrder, profile.sortOrder)
    }
  }

  const legacyFacets = facets.filter(
    (facet) => facet.isActive && !profiledFacetIds.has(facet.id),
  )

  type PlannedProfile = {
    facetId: number
    title: string
    taxonomy: string
    canonicalValue: string
    groupKey: string | null
    groupLabel: string | null
    sortOrder: number
    artRequired: boolean
    isRandomizable: boolean
    randomWeight: number
    sourceRank: number
    needsAlias: boolean
  }
  const planned: PlannedProfile[] = []
  const skippedDuplicates: Array<{ facetId: number; title: string; key: string }> =
    []

  for (const facet of legacyFacets) {
    const taxonomy = taxonomyForKind(facet.kind)
    const canonicalValue = (facet.title || facet.slug || '').trim()
    const lookup = normalizeFacetLookupKey(canonicalValue)
    const dupeKey = `${taxonomy}:${lookup}`
    if (lookup && canonicalOccupied.has(dupeKey)) {
      skippedDuplicates.push({
        facetId: facet.id,
        title: facet.title,
        key: dupeKey,
      })
      continue
    }
    // Claim the slot so two legacy facets with the same title don't both mint.
    if (lookup) canonicalOccupied.add(dupeKey)

    const template = templateByTaxonomy.get(taxonomy)
    const nextSortOrder = (template?.maxSortOrder ?? 0) + 1
    if (template) template.maxSortOrder = nextSortOrder

    planned.push({
      facetId: facet.id,
      title: facet.title,
      taxonomy,
      canonicalValue,
      groupKey: template?.groupKey ?? taxonomy.toLowerCase(),
      groupLabel:
        template?.groupLabel ??
        taxonomy
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      sortOrder: nextSortOrder,
      artRequired: template?.artRequired ?? true,
      isRandomizable: template?.isRandomizable ?? true,
      randomWeight: template?.randomWeight ?? 1,
      sourceRank: template?.sourceRank ?? 100,
      needsAlias: !facetsWithAlias.has(facet.id),
    })
  }

  const byTaxonomy = planned.reduce<Record<string, number>>((acc, item) => {
    acc[item.taxonomy] = (acc[item.taxonomy] ?? 0) + 1
    return acc
  }, {})

  process.stdout.write(
    [
      `Facet profile repair — ${apply ? 'APPLY' : 'DRY-RUN'}`,
      `Active Facets without a profile: ${legacyFacets.length}`,
      `Profiles to create: ${planned.length}  ${JSON.stringify(byTaxonomy)}`,
      `Canonical aliases to backfill: ${planned.filter((p) => p.needsAlias).length}`,
      `Skipped as duplicate canonical (merge manually): ${skippedDuplicates.length}`,
      ...planned
        .slice(0, 40)
        .map(
          (p) =>
            `  + profile facet ${p.facetId} "${p.title}" -> ${p.taxonomy} (sort ${p.sortOrder}${p.needsAlias ? ', +alias' : ''})`,
        ),
      planned.length > 40 ? `  … +${planned.length - 40} more` : '',
      ...skippedDuplicates.map(
        (s) => `  ! skip facet ${s.facetId} "${s.title}" — ${s.key} already exists`,
      ),
    ]
      .filter(Boolean)
      .join('\n') + '\n',
  )

  if (!apply) {
    process.stdout.write('\nDry-run only. Re-run with --apply to write.\n')
    return
  }
  if (!planned.length) {
    process.stdout.write('\nNothing to apply.\n')
    return
  }

  let createdProfiles = 0
  let createdAliases = 0
  for (const item of planned) {
    await prisma.facetProfile.create({
      data: {
        facetId: item.facetId,
        taxonomy: item.taxonomy as never,
        canonicalValue: item.canonicalValue || null,
        groupKey: item.groupKey,
        groupLabel: item.groupLabel,
        sortOrder: item.sortOrder,
        artRequired: item.artRequired,
        isRandomizable: item.isRandomizable,
        randomWeight: item.randomWeight,
        sourceRank: item.sourceRank,
      },
    })
    createdProfiles += 1

    if (item.needsAlias && item.canonicalValue) {
      const lookupKey = normalizeFacetLookupKey(item.canonicalValue)
      if (lookupKey) {
        const result = await prisma.facetAlias.createMany({
          data: [
            {
              facetId: item.facetId,
              alias: item.canonicalValue,
              lookupKey,
              isCanonical: true,
              isActive: true,
            },
          ],
          skipDuplicates: true,
        })
        createdAliases += result.count
      }
    }
  }

  process.stdout.write(
    `\nApplied: created ${createdProfiles} profiles, ${createdAliases} canonical aliases.\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
