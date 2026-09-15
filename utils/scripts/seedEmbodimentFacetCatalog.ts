// /utils/scripts/seedEmbodimentFacetCatalog.ts
//
// Seed the AGE / BUILD / HAIR / ORIGIN catalog rows from the declarative
// vocabulary in utils/seeds/facetEmbodimentValues.ts.
//
// Dry by default, exactly like seedGenderFacetCatalog.ts: it prints what it
// would write and changes nothing until `--apply` is passed. These rows become
// live creative vocabulary the moment they land, so the default has to be the
// safe one.
//
// Idempotent by slug. Re-running adopts existing rows rather than minting
// duplicates, and the upsert-by-slug converges rather than throwing P2002 when
// two production deploys seed at once.
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import {
  EMBODIMENT_FACET_SEEDS,
  type EmbodimentFacetSeed,
  type EmbodimentTaxonomySeed,
} from './../seeds/facetEmbodimentValues'
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

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220)
}

/**
 * Prefixed by taxonomy, matching the `gender-` convention the gender seed
 * established. Without the prefix an entry like "Very Small" would collide
 * with any same-named Facet in another taxonomy and silently adopt its row.
 */
function facetSlug(group: EmbodimentTaxonomySeed, value: EmbodimentFacetSeed): string {
  return `${group.groupKey}-${slugify(value.title)}`
}

async function saveValue(
  group: EmbodimentTaxonomySeed,
  value: EmbodimentFacetSeed,
  sortOrder: number,
): Promise<number | null> {
  const slug = facetSlug(group, value)
  const metadata = {
    source: 'embodiment-vocabulary',
    taxonomy: group.taxonomy,
    fieldKey: group.groupKey,
    // The walrus guard. A drawer that ignores this will happily put box braids
    // on a hammerhead; see facetEmbodimentValues.ts's header for why the scope
    // exists at all.
    scope: value.scope,
    drawCount: group.drawCount,
  }

  if (!apply) {
    console.log(
      `[dry-run] ${group.taxonomy.padEnd(7)} ${slug.padEnd(48)} scope=${value.scope}`,
    )
    return null
  }

  const facet = await prisma.facet.upsert({
    where: { slug },
    create: {
      title: value.title,
      slug,
      description: value.description,
      artPrompt: value.artPrompt,
      designer: 'facet-catalog',
      creationSource: 'HUMAN',
      userId: 1,
      isPublic: true,
      isMature: false,
      isActive: true,
    },
    update: {
      title: value.title,
      description: value.description,
      artPrompt: value.artPrompt,
      designer: 'facet-catalog',
      isActive: true,
    },
  })

  await prisma.facetProfile.upsert({
    where: { facetId: facet.id },
    create: {
      facetId: facet.id,
      taxonomy: group.taxonomy,
      canonicalValue: value.title,
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      sortOrder,
      isRandomizable: true,
      randomWeight: value.weight ?? 1,
      artRequired: true,
      sourceRank: 10,
      metadata: JSON.stringify(metadata),
    },
    update: {
      taxonomy: group.taxonomy,
      canonicalValue: value.title,
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      sortOrder,
      isRandomizable: true,
      randomWeight: value.weight ?? 1,
      artRequired: true,
      sourceRank: 10,
      metadata: JSON.stringify(metadata),
    },
  })

  for (const alias of prepareUniqueFacetAliases([slug, value.title])) {
    const owner = await prisma.facetAlias.findUnique({
      where: { lookupKey: alias.lookupKey },
      select: { facetId: true },
    })
    if (owner && owner.facetId !== facet.id) {
      console.warn(
        `[facet-catalog] Embodiment alias ${alias.alias} already belongs to Facet ${owner.facetId}; leaving it unchanged.`,
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

async function main(): Promise<void> {
  let written = 0
  for (const group of EMBODIMENT_FACET_SEEDS) {
    console.log(
      `\n[facet-catalog] ${group.taxonomy}: ${group.values.length} value(s), drawCount ${group.drawCount}`,
    )
    for (const [index, value] of group.values.entries()) {
      const id = await saveValue(group, value, index)
      if (id !== null) written += 1
    }
  }

  const total = EMBODIMENT_FACET_SEEDS.reduce((sum, g) => sum + g.values.length, 0)
  console.log(
    apply
      ? `\n[facet-catalog] Wrote ${written}/${total} embodiment Facet(s).`
      : `\n[facet-catalog] Dry run: ${total} embodiment Facet(s) would be written. Re-run with --apply.`,
  )
}

main()
  .catch((error) => {
    console.error('[facet-catalog] Embodiment seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
