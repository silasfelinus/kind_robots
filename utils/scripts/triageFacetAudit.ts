// Read-only triage for the strict Facet data-audit findings.
//
// The audit (auditFacetCatalogData.ts) flags every populated owner field that
// has no canonical Facet assignment, without checking whether the scalar value
// even maps to a Facet. This script classifies each strict finding into
// FIXABLE (a matching canonical Facet exists, so a backfill can link it) vs
// EXPECTED (the value is custom/free-text with no canonical Facet, so it can
// never be linked) — plus it lists exactly what the profileless Facets and
// taxonomy mismatches are, so we know precisely what a repair must touch.
//
// Usage:
//   DATABASE_URL=... tsx utils/scripts/triageFacetAudit.ts
//   DATABASE_URL=... tsx utils/scripts/triageFacetAudit.ts --json
//   DATABASE_URL=... tsx utils/scripts/triageFacetAudit.ts --samples=15
//
// It performs NO writes.
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl: string = process.env.DATABASE_URL ?? ''
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const args = new Set(process.argv.slice(2))
const jsonOnly = args.has('--json')
const samplesArg = process.argv.find((entry) => entry.startsWith('--samples='))
const SAMPLES = Math.max(
  1,
  Number(samplesArg?.slice('--samples='.length)) || 12,
)

const CHARACTER_FIELD_TAXONOMIES: Record<string, readonly string[]> = {
  genre: ['GENRE'],
  species: ['ANIMAL', 'SPECIES'],
  class: ['OCCUPATION', 'ARCHETYPE', 'ROLE'],
  alignment: ['ALIGNMENT'],
  gender: ['GENDER'],
  personality: ['PERSONALITY'],
  backstory: ['BACKSTORY'],
  quirks: ['QUIRK'],
  role: ['ROLE'],
}
const BOT_FIELD_TAXONOMIES: Record<string, readonly string[]> = {
  BotType: ['BOT_TYPE'],
  personality: ['PERSONALITY'],
}

function splitScalar(fieldKey: string, value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) return []
  if (
    fieldKey === 'personality' ||
    fieldKey === 'quirks' ||
    fieldKey === 'genres'
  ) {
    return value
      .split(/\n---\n|\||\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return [value.trim()]
}

type Bucket = {
  flaggedFields: number
  fixableFields: number
  expectedFields: number
  fixableSamples: string[]
  expectedSamples: string[]
}

function emptyBucket(): Bucket {
  return {
    flaggedFields: 0,
    fixableFields: 0,
    expectedFields: 0,
    fixableSamples: [],
    expectedSamples: [],
  }
}

async function main(): Promise<void> {
  const [
    facets,
    profiles,
    aliases,
    characterLinks,
    botLinks,
    scenarioLinks,
    characters,
    bots,
    scenarios,
  ] = await Promise.all([
    prisma.facet.findMany({
      select: { id: true, title: true, slug: true, isActive: true },
    }),
    prisma.facetProfile.findMany({
      select: { facetId: true, taxonomy: true, canonicalValue: true },
    }),
    prisma.facetAlias.findMany({
      where: { isActive: true },
      select: { facetId: true, lookupKey: true },
    }),
    prisma.characterFacet.findMany({
      select: { characterId: true, facetId: true, fieldKey: true },
    }),
    prisma.botFacet.findMany({
      select: { botId: true, facetId: true, fieldKey: true },
    }),
    prisma.scenarioFacet.findMany({
      select: { scenarioId: true, facetId: true },
    }),
    prisma.character.findMany({
      where: { isActive: true },
      select: {
        id: true,
        genre: true,
        species: true,
        class: true,
        alignment: true,
        gender: true,
        personality: true,
        backstory: true,
        quirks: true,
        role: true,
      },
    }),
    prisma.bot.findMany({
      where: { isActive: true },
      select: { id: true, BotType: true, personality: true },
    }),
    prisma.scenario.findMany({
      where: { isActive: true },
      select: { id: true, genres: true },
    }),
  ])

  const taxonomyByFacetId = new Map(
    profiles.map((profile) => [profile.facetId, profile.taxonomy]),
  )
  const facetById = new Map(facets.map((facet) => [facet.id, facet]))
  // lookupKey -> the taxonomies of the Facet(s) that own that alias.
  const taxonomiesByLookup = new Map<string, Set<string>>()
  for (const alias of aliases) {
    const taxonomy = taxonomyByFacetId.get(alias.facetId)
    if (!taxonomy) continue
    const set = taxonomiesByLookup.get(alias.lookupKey) ?? new Set<string>()
    set.add(taxonomy)
    taxonomiesByLookup.set(alias.lookupKey, set)
  }

  // A field is FIXABLE if at least one of its values maps to a canonical Facet
  // whose taxonomy is allowed for the field (a backfill would create >=1 link,
  // clearing the field-level flag). Otherwise it is EXPECTED (custom values).
  function classifyField(
    fieldKey: string,
    values: string[],
    allowed: readonly string[],
  ): boolean {
    return values.some((value) => {
      const owners = taxonomiesByLookup.get(normalizeFacetLookupKey(value))
      if (!owners) return false
      return allowed.some((taxonomy) => owners.has(taxonomy))
    })
  }

  function tally(
    bucket: Bucket,
    fieldKey: string,
    values: string[],
    fixable: boolean,
  ): void {
    bucket.flaggedFields++
    const label = `${fieldKey}: ${values.slice(0, 3).join(' | ')}`
    if (fixable) {
      bucket.fixableFields++
      if (bucket.fixableSamples.length < SAMPLES)
        bucket.fixableSamples.push(label)
    } else {
      bucket.expectedFields++
      if (bucket.expectedSamples.length < SAMPLES)
        bucket.expectedSamples.push(label)
    }
  }

  // --- CHARACTER_SCALAR_WITHOUT_ASSIGNMENT ---
  const charLinked = new Set(
    characterLinks.map((link) => `${link.characterId}:${link.fieldKey}`),
  )
  const charBucket = emptyBucket()
  const charByField: Record<string, Bucket> = {}
  for (const character of characters) {
    for (const fieldKey of Object.keys(CHARACTER_FIELD_TAXONOMIES)) {
      const values = splitScalar(
        fieldKey,
        (character as Record<string, unknown>)[fieldKey],
      )
      if (!values.length || charLinked.has(`${character.id}:${fieldKey}`))
        continue
      const fixable = classifyField(
        fieldKey,
        values,
        CHARACTER_FIELD_TAXONOMIES[fieldKey]!,
      )
      tally(charBucket, fieldKey, values, fixable)
      charByField[fieldKey] = charByField[fieldKey] ?? emptyBucket()
      tally(charByField[fieldKey]!, fieldKey, values, fixable)
    }
  }

  // --- BOT_SCALAR_WITHOUT_ASSIGNMENT ---
  const botLinked = new Set(
    botLinks.map((link) => `${link.botId}:${link.fieldKey}`),
  )
  const botBucket = emptyBucket()
  for (const bot of bots) {
    for (const fieldKey of Object.keys(BOT_FIELD_TAXONOMIES)) {
      const values = splitScalar(
        fieldKey,
        (bot as Record<string, unknown>)[fieldKey],
      )
      if (!values.length || botLinked.has(`${bot.id}:${fieldKey}`)) continue
      const fixable = classifyField(
        fieldKey,
        values,
        BOT_FIELD_TAXONOMIES[fieldKey]!,
      )
      tally(botBucket, fieldKey, values, fixable)
    }
  }

  // --- SCENARIO_GENRE_WITHOUT_ASSIGNMENT ---
  const genreFacetIds = new Set(
    profiles.filter((p) => p.taxonomy === 'GENRE').map((p) => p.facetId),
  )
  const scenariosWithGenreLink = new Set(
    scenarioLinks
      .filter((link) => genreFacetIds.has(link.facetId))
      .map((link) => link.scenarioId),
  )
  const scenarioBucket = emptyBucket()
  for (const scenario of scenarios) {
    const values = splitScalar('genres', scenario.genres)
    if (!values.length || scenariosWithGenreLink.has(scenario.id)) continue
    const fixable = classifyField('genres', values, ['GENRE'])
    tally(scenarioBucket, 'genres', values, fixable)
  }

  // --- FACET_WITHOUT_PROFILE (the 26) ---
  const profileless = facets
    .filter((facet) => !taxonomyByFacetId.has(facet.id))
    .map((facet) => ({
      id: facet.id,
      title: facet.title,
      slug: facet.slug,
      isActive: facet.isActive,
    }))

  // --- CHARACTER_ASSIGNMENT_TAXONOMY_MISMATCH: cascade vs genuine ---
  let mismatchFromProfileless = 0
  let mismatchGenuine = 0
  const mismatchSamples: string[] = []
  for (const link of characterLinks) {
    const taxonomy = taxonomyByFacetId.get(link.facetId)
    const allowed = CHARACTER_FIELD_TAXONOMIES[link.fieldKey]
    const bad = !taxonomy || !allowed || !allowed.includes(taxonomy)
    if (!bad) continue
    if (!taxonomy) mismatchFromProfileless++
    else {
      mismatchGenuine++
      if (mismatchSamples.length < SAMPLES) {
        mismatchSamples.push(
          `char ${link.characterId} field=${link.fieldKey} -> facet ${link.facetId} (${taxonomy}; allowed ${allowed?.join('/') ?? 'n/a'})`,
        )
      }
    }
  }

  const report = {
    facetWithoutProfile: { count: profileless.length, facets: profileless },
    characterScalar: {
      total: charBucket.flaggedFields,
      fixable: charBucket.fixableFields,
      expected: charBucket.expectedFields,
      byField: Object.fromEntries(
        Object.entries(charByField).map(([field, bucket]) => [
          field,
          {
            total: bucket.flaggedFields,
            fixable: bucket.fixableFields,
            expected: bucket.expectedFields,
          },
        ]),
      ),
      fixableSamples: charBucket.fixableSamples,
      expectedSamples: charBucket.expectedSamples,
    },
    botScalar: {
      total: botBucket.flaggedFields,
      fixable: botBucket.fixableFields,
      expected: botBucket.expectedFields,
      expectedSamples: botBucket.expectedSamples,
    },
    scenarioGenre: {
      total: scenarioBucket.flaggedFields,
      fixable: scenarioBucket.fixableFields,
      expected: scenarioBucket.expectedFields,
      expectedSamples: scenarioBucket.expectedSamples,
    },
    characterTaxonomyMismatch: {
      cascadeFromProfileless: mismatchFromProfileless,
      genuine: mismatchGenuine,
      genuineSamples: mismatchSamples,
    },
  }

  if (jsonOnly) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    return
  }

  const lines: string[] = [
    'Facet audit triage (read-only) — REAL (fixable by backfill) vs EXPECTED (custom, unlinkable)',
    '',
    `FACET_WITHOUT_PROFILE: ${report.facetWithoutProfile.count} legacy facets (cascade into ASSIGNMENT_WITHOUT_PROFILE + part of the mismatch count)`,
    ...profileless
      .slice(0, SAMPLES)
      .map((f) => `   #${f.id} "${f.title}" [active=${f.isActive}]`),
    profileless.length > SAMPLES
      ? `   … +${profileless.length - SAMPLES} more`
      : '',
    '',
    `CHARACTER_SCALAR: ${charBucket.flaggedFields} flagged  ->  FIXABLE ${charBucket.fixableFields} | EXPECTED ${charBucket.expectedFields}`,
    ...Object.entries(charByField).map(
      ([field, b]) =>
        `   ${field}: ${b.flaggedFields} (fixable ${b.fixableFields}, expected ${b.expectedFields})`,
    ),
    charBucket.expectedSamples.length
      ? `   expected/custom samples: ${charBucket.expectedSamples.join('  //  ')}`
      : '',
    '',
    `BOT_SCALAR: ${botBucket.flaggedFields} flagged  ->  FIXABLE ${botBucket.fixableFields} | EXPECTED ${botBucket.expectedFields}`,
    botBucket.expectedSamples.length
      ? `   expected/custom samples: ${botBucket.expectedSamples.join('  //  ')}`
      : '',
    '',
    `SCENARIO_GENRE: ${scenarioBucket.flaggedFields} flagged  ->  FIXABLE ${scenarioBucket.fixableFields} | EXPECTED ${scenarioBucket.expectedFields}`,
    scenarioBucket.expectedSamples.length
      ? `   expected/custom samples: ${scenarioBucket.expectedSamples.join('  //  ')}`
      : '',
    '',
    `CHARACTER_TAXONOMY_MISMATCH: cascade-from-profileless ${mismatchFromProfileless} | genuine ${mismatchGenuine}`,
    ...mismatchSamples.map((s) => `   ${s}`),
  ]
  process.stdout.write(lines.filter((line) => line !== '').join('\n') + '\n')
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
