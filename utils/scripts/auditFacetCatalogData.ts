// Read-only production audit for the canonical Facet catalog.
//
// Usage:
//   npm run audit:facet-data
//   npm run audit:facet-data -- --json
//   npm run audit:facet-data -- --strict --output=artifacts/facet-data-audit.json
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const args = new Set(process.argv.slice(2))
const strict = args.has('--strict')
const jsonOnly = args.has('--json')
const outputArg = process.argv.find((entry) => entry.startsWith('--output='))
const outputPath = outputArg?.slice('--output='.length).trim() || null

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

const ALL_TAXONOMIES = [
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
] as const

type AuditIssue = {
  code: string
  message: string
  details?: unknown
}

type LinkReference = {
  ownerType: string
  ownerId: number
  facetId: number
  fieldKey?: string
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

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function hasUsableArt(facet: {
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  artImageId: number | null
  artCollectionId: number | null
}): boolean {
  return Boolean(
    facet.imagePath?.trim() ||
      facet.cardPath?.trim() ||
      facet.heroPath?.trim() ||
      facet.artImageId ||
      facet.artCollectionId,
  )
}

async function main(): Promise<void> {
  const [
    facets,
    profiles,
    aliases,
    characterLinks,
    botLinks,
    rewardLinks,
    scenarioLinks,
    dreamLinks,
    characters,
    bots,
    scenarios,
  ] = await Promise.all([
    prisma.facet.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        imagePath: true,
        cardPath: true,
        heroPath: true,
        artImageId: true,
        artCollectionId: true,
      },
    }),
    prisma.facetProfile.findMany(),
    prisma.facetAlias.findMany({
      where: { isActive: true },
      select: { facetId: true, lookupKey: true, isCanonical: true },
    }),
    prisma.characterFacet.findMany({
      select: { characterId: true, facetId: true, fieldKey: true },
    }),
    prisma.botFacet.findMany({
      select: { botId: true, facetId: true, fieldKey: true },
    }),
    prisma.rewardFacet.findMany({
      select: { rewardId: true, facetId: true, fieldKey: true },
    }),
    prisma.scenarioFacet.findMany({
      select: { scenarioId: true, facetId: true },
    }),
    prisma.dreamFacet.findMany({
      select: { dreamId: true, facetId: true },
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

  const severe: AuditIssue[] = []
  const warnings: AuditIssue[] = []
  const profileByFacetId = new Map(
    profiles.map((profile) => [profile.facetId, profile]),
  )
  const facetById = new Map(facets.map((facet) => [facet.id, facet]))
  const aliasesByFacetId = new Map<number, string[]>()
  for (const alias of aliases) {
    const values = aliasesByFacetId.get(alias.facetId) ?? []
    values.push(alias.lookupKey)
    aliasesByFacetId.set(alias.facetId, values)
  }

  const missingProfiles = facets.filter((facet) => !profileByFacetId.has(facet.id))
  if (missingProfiles.length) {
    severe.push({
      code: 'FACET_WITHOUT_PROFILE',
      message: `${missingProfiles.length} Facets do not have a FacetProfile.`,
      details: missingProfiles.map(({ id, title, slug }) => ({ id, title, slug })),
    })
  }

  const orphanProfiles = profiles.filter((profile) => !facetById.has(profile.facetId))
  if (orphanProfiles.length) {
    severe.push({
      code: 'PROFILE_WITHOUT_FACET',
      message: `${orphanProfiles.length} FacetProfiles reference missing Facets.`,
      details: orphanProfiles.map((profile) => profile.facetId),
    })
  }

  const facetsWithoutAliases = facets.filter(
    (facet) => facet.isActive && !(aliasesByFacetId.get(facet.id)?.length),
  )
  if (facetsWithoutAliases.length) {
    severe.push({
      code: 'ACTIVE_FACET_WITHOUT_ALIAS',
      message: `${facetsWithoutAliases.length} active Facets have no active alias lookup.`,
      details: facetsWithoutAliases.map(({ id, title, slug }) => ({ id, title, slug })),
    })
  }

  const canonicalGroups = new Map<string, number[]>()
  for (const profile of profiles) {
    const facet = facetById.get(profile.facetId)
    if (!facet) continue
    const lookup = normalizeFacetLookupKey(
      profile.canonicalValue || facet.title || facet.slug || '',
    )
    if (!lookup) continue
    const key = `${profile.taxonomy}:${lookup}`
    const values = canonicalGroups.get(key) ?? []
    values.push(profile.facetId)
    canonicalGroups.set(key, values)
  }
  const duplicateCanonicals = Array.from(canonicalGroups.entries())
    .filter(([, facetIds]) => facetIds.length > 1)
    .map(([key, facetIds]) => ({ key, facetIds }))
  if (duplicateCanonicals.length) {
    severe.push({
      code: 'DUPLICATE_CANONICAL_VALUE',
      message: `${duplicateCanonicals.length} taxonomy/canonical-value groups contain multiple Facets.`,
      details: duplicateCanonicals,
    })
  }

  const countsByTaxonomy = Object.fromEntries(
    ALL_TAXONOMIES.map((taxonomy) => [
      taxonomy,
      profiles.filter((profile) => profile.taxonomy === taxonomy).length,
    ]),
  ) as Record<string, number>
  const emptyTaxonomies = ALL_TAXONOMIES.filter(
    (taxonomy) => countsByTaxonomy[taxonomy] === 0,
  )
  if (emptyTaxonomies.length) {
    warnings.push({
      code: 'EMPTY_TAXONOMY',
      message: `${emptyTaxonomies.length} declared taxonomies currently contain no records.`,
      details: emptyTaxonomies,
    })
  }

  const missingRequiredArt = profiles
    .filter((profile) => profile.artRequired)
    .map((profile) => facetById.get(profile.facetId))
    .filter((facet): facet is NonNullable<typeof facet> => Boolean(facet))
    .filter((facet) => facet.isActive && !hasUsableArt(facet))
  if (missingRequiredArt.length) {
    warnings.push({
      code: 'MISSING_REQUIRED_ART',
      message: `${missingRequiredArt.length} active art-required Facets have no usable media.`,
      details: missingRequiredArt.map(({ id, title, slug }) => ({ id, title, slug })),
    })
  }

  const references: LinkReference[] = [
    ...characterLinks.map((link) => ({
      ownerType: 'Character',
      ownerId: link.characterId,
      facetId: link.facetId,
      fieldKey: link.fieldKey,
    })),
    ...botLinks.map((link) => ({
      ownerType: 'Bot',
      ownerId: link.botId,
      facetId: link.facetId,
      fieldKey: link.fieldKey,
    })),
    ...rewardLinks.map((link) => ({
      ownerType: 'Reward',
      ownerId: link.rewardId,
      facetId: link.facetId,
      fieldKey: link.fieldKey,
    })),
    ...scenarioLinks.map((link) => ({
      ownerType: 'Scenario',
      ownerId: link.scenarioId,
      facetId: link.facetId,
    })),
    ...dreamLinks.map((link) => ({
      ownerType: 'Dream',
      ownerId: link.dreamId,
      facetId: link.facetId,
    })),
  ]

  const brokenReferences = references.filter(
    (reference) => !facetById.has(reference.facetId),
  )
  if (brokenReferences.length) {
    severe.push({
      code: 'ASSIGNMENT_WITHOUT_FACET',
      message: `${brokenReferences.length} assignment rows reference missing Facets.`,
      details: brokenReferences,
    })
  }

  const profilelessReferences = references.filter(
    (reference) =>
      facetById.has(reference.facetId) &&
      !profileByFacetId.has(reference.facetId),
  )
  if (profilelessReferences.length) {
    severe.push({
      code: 'ASSIGNMENT_WITHOUT_PROFILE',
      message: `${profilelessReferences.length} assignment rows reference Facets without profiles.`,
      details: profilelessReferences,
    })
  }

  const inactiveReferences = references.filter(
    (reference) => facetById.get(reference.facetId)?.isActive === false,
  )
  if (inactiveReferences.length) {
    severe.push({
      code: 'INACTIVE_FACET_REFERENCED',
      message: `${inactiveReferences.length} assignment rows still reference inactive Facets.`,
      details: inactiveReferences,
    })
  }

  const incompatibleCharacterLinks = characterLinks.filter((link) => {
    const taxonomy = profileByFacetId.get(link.facetId)?.taxonomy
    const allowed = CHARACTER_FIELD_TAXONOMIES[link.fieldKey]
    return !taxonomy || !allowed || !allowed.includes(taxonomy)
  })
  if (incompatibleCharacterLinks.length) {
    severe.push({
      code: 'CHARACTER_ASSIGNMENT_TAXONOMY_MISMATCH',
      message: `${incompatibleCharacterLinks.length} CharacterFacet rows use an incompatible taxonomy.`,
      details: incompatibleCharacterLinks,
    })
  }

  const incompatibleBotLinks = botLinks.filter((link) => {
    const taxonomy = profileByFacetId.get(link.facetId)?.taxonomy
    const allowed = BOT_FIELD_TAXONOMIES[link.fieldKey]
    return !taxonomy || !allowed || !allowed.includes(taxonomy)
  })
  if (incompatibleBotLinks.length) {
    severe.push({
      code: 'BOT_ASSIGNMENT_TAXONOMY_MISMATCH',
      message: `${incompatibleBotLinks.length} BotFacet rows use an incompatible taxonomy.`,
      details: incompatibleBotLinks,
    })
  }

  const characterLinksByOwnerField = new Set(
    characterLinks.map((link) => `${link.characterId}:${link.fieldKey}`),
  )
  const missingCharacterAssignments: Array<{
    characterId: number
    fieldKey: string
    values: string[]
  }> = []
  for (const character of characters) {
    for (const fieldKey of Object.keys(CHARACTER_FIELD_TAXONOMIES)) {
      const values = splitScalar(
        fieldKey,
        (character as Record<string, unknown>)[fieldKey],
      )
      if (
        values.length &&
        !characterLinksByOwnerField.has(`${character.id}:${fieldKey}`)
      ) {
        missingCharacterAssignments.push({
          characterId: character.id,
          fieldKey,
          values,
        })
      }
    }
  }
  if (missingCharacterAssignments.length) {
    severe.push({
      code: 'CHARACTER_SCALAR_WITHOUT_ASSIGNMENT',
      message: `${missingCharacterAssignments.length} populated Character fields have no canonical Facet assignment.`,
      details: missingCharacterAssignments,
    })
  }

  const botLinksByOwnerField = new Set(
    botLinks.map((link) => `${link.botId}:${link.fieldKey}`),
  )
  const missingBotAssignments: Array<{
    botId: number
    fieldKey: string
    values: string[]
  }> = []
  for (const bot of bots) {
    for (const fieldKey of Object.keys(BOT_FIELD_TAXONOMIES)) {
      const values = splitScalar(
        fieldKey,
        (bot as Record<string, unknown>)[fieldKey],
      )
      if (values.length && !botLinksByOwnerField.has(`${bot.id}:${fieldKey}`)) {
        missingBotAssignments.push({ botId: bot.id, fieldKey, values })
      }
    }
  }
  if (missingBotAssignments.length) {
    severe.push({
      code: 'BOT_SCALAR_WITHOUT_ASSIGNMENT',
      message: `${missingBotAssignments.length} populated Bot fields have no canonical Facet assignment.`,
      details: missingBotAssignments,
    })
  }

  const genreFacetIds = new Set(
    profiles
      .filter((profile) => profile.taxonomy === 'GENRE')
      .map((profile) => profile.facetId),
  )
  const scenarioIdsWithGenreLinks = new Set(
    scenarioLinks
      .filter((link) => genreFacetIds.has(link.facetId))
      .map((link) => link.scenarioId),
  )
  const missingScenarioGenreAssignments = scenarios
    .filter((scenario) => splitScalar('genres', scenario.genres).length)
    .filter((scenario) => !scenarioIdsWithGenreLinks.has(scenario.id))
    .map((scenario) => ({
      scenarioId: scenario.id,
      values: splitScalar('genres', scenario.genres),
    }))
  if (missingScenarioGenreAssignments.length) {
    severe.push({
      code: 'SCENARIO_GENRE_WITHOUT_ASSIGNMENT',
      message: `${missingScenarioGenreAssignments.length} Scenarios have genre strings but no GENRE Facet links.`,
      details: missingScenarioGenreAssignments,
    })
  }

  const report = {
    generatedAt: new Date().toISOString(),
    asOfDatabase: databaseUrl.replace(/:[^:@/]+@/, ':***@'),
    summary: {
      facets: facets.length,
      activeFacets: facets.filter((facet) => facet.isActive).length,
      profiles: profiles.length,
      activeAliases: aliases.length,
      countsByTaxonomy,
      references: references.length,
      severeIssues: severe.length,
      warnings: warnings.length,
    },
    severe,
    warnings,
  }

  const serialized = `${JSON.stringify(report, null, 2)}\n`
  if (outputPath) {
    const absolute = resolve(process.cwd(), outputPath)
    await mkdir(dirname(absolute), { recursive: true })
    await writeFile(absolute, serialized, 'utf8')
  }

  if (jsonOnly) {
    process.stdout.write(serialized)
  } else {
    process.stdout.write(
      [
        'Facet catalog data audit',
        `Facets: ${report.summary.facets} (${report.summary.activeFacets} active)`,
        `Profiles: ${report.summary.profiles}`,
        `Active aliases: ${report.summary.activeAliases}`,
        `Assignments: ${report.summary.references}`,
        `Severe issue groups: ${report.summary.severeIssues}`,
        `Warning groups: ${report.summary.warnings}`,
        ...severe.map((issue) => `ERROR ${issue.code}: ${issue.message}`),
        ...warnings.map((issue) => `WARN  ${issue.code}: ${issue.message}`),
        outputPath ? `JSON report: ${outputPath}` : '',
      ]
        .filter(Boolean)
        .join('\n') + '\n',
    )
  }

  if (strict && severe.length) process.exitCode = 1
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
