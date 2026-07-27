// Read-only audit for canonical BACKSTORY and QUIRK values embedded in prose fields.
//
// Arbitrary narrative prose remains valid and is ignored. A strict finding is
// emitted only when an entire Backstory value, or an individual delimited Quirk,
// exactly resolves to an active canonical Facet but the matching CharacterFacet
// assignment row is absent.
//
// Usage:
//   npx tsx utils/scripts/auditFacetProseAssignments.ts
//   npx tsx utils/scripts/auditFacetProseAssignments.ts --strict
//   npx tsx utils/scripts/auditFacetProseAssignments.ts --json
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL ?? ''
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const args = new Set(process.argv.slice(2))
const strict = args.has('--strict')
const jsonOnly = args.has('--json')

type Finding = {
  characterId: number
  fieldKey: 'backstory' | 'quirks'
  value: string
  facetId: number
}

function splitValues(fieldKey: 'backstory' | 'quirks', value: string | null): string[] {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return []
  if (fieldKey === 'backstory') return [trimmed]
  return trimmed
    .split(/\n---\n|\||\n|;|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function main(): Promise<void> {
  const [profiles, facets, aliases, characters, assignments] = await Promise.all([
    prisma.facetProfile.findMany({
      where: { taxonomy: { in: ['BACKSTORY', 'QUIRK'] } },
      select: { facetId: true, taxonomy: true, canonicalValue: true },
    }),
    prisma.facet.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
    }),
    prisma.facetAlias.findMany({
      where: { isActive: true },
      select: { facetId: true, lookupKey: true },
    }),
    prisma.character.findMany({
      where: { isActive: true },
      select: { id: true, backstory: true, quirks: true },
    }),
    prisma.characterFacet.findMany({
      where: { fieldKey: { in: ['backstory', 'quirks'] } },
      select: { characterId: true, facetId: true, fieldKey: true },
    }),
  ])

  const activeFacetIds = new Set(facets.map((facet) => facet.id))
  const taxonomyByFacetId = new Map(
    profiles
      .filter((profile) => activeFacetIds.has(profile.facetId))
      .map((profile) => [profile.facetId, profile.taxonomy]),
  )
  const facetById = new Map(facets.map((facet) => [facet.id, facet]))
  const lookup = {
    BACKSTORY: new Map<string, number>(),
    QUIRK: new Map<string, number>(),
  }

  for (const profile of profiles) {
    const taxonomy = profile.taxonomy as 'BACKSTORY' | 'QUIRK'
    const facet = facetById.get(profile.facetId)
    if (!facet || !lookup[taxonomy]) continue
    for (const value of [facet.title, profile.canonicalValue ?? '']) {
      const key = normalizeFacetLookupKey(value)
      if (key && !lookup[taxonomy].has(key)) {
        lookup[taxonomy].set(key, profile.facetId)
      }
    }
  }
  for (const alias of aliases) {
    const taxonomy = taxonomyByFacetId.get(alias.facetId) as
      | 'BACKSTORY'
      | 'QUIRK'
      | undefined
    if (!taxonomy) continue
    if (!lookup[taxonomy].has(alias.lookupKey)) {
      lookup[taxonomy].set(alias.lookupKey, alias.facetId)
    }
  }

  const linked = new Set(
    assignments.map(
      (assignment) =>
        `${assignment.characterId}:${assignment.fieldKey}:${assignment.facetId}`,
    ),
  )
  const findings: Finding[] = []

  for (const character of characters) {
    for (const fieldKey of ['backstory', 'quirks'] as const) {
      const taxonomy = fieldKey === 'backstory' ? 'BACKSTORY' : 'QUIRK'
      for (const value of splitValues(fieldKey, character[fieldKey])) {
        const facetId = lookup[taxonomy].get(normalizeFacetLookupKey(value))
        if (!facetId) continue // bespoke prose remains intentionally unlinked
        if (linked.has(`${character.id}:${fieldKey}:${facetId}`)) continue
        findings.push({ characterId: character.id, fieldKey, value, facetId })
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    asOfDatabase: databaseUrl.replace(/:[^:@/]+@/, ':***@'),
    checkedCharacters: characters.length,
    canonicalProseFacets: profiles.length,
    missingAssignments: findings.length,
    findings,
  }

  if (jsonOnly) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } else {
    process.stdout.write(
      [
        'Facet prose assignment audit',
        `Characters checked: ${report.checkedCharacters}`,
        `Canonical BACKSTORY/QUIRK Facets: ${report.canonicalProseFacets}`,
        `Missing exact-match assignments: ${report.missingAssignments}`,
        ...findings.map(
          (finding) =>
            `ERROR Character #${finding.characterId} ${finding.fieldKey} "${finding.value}" maps to Facet #${finding.facetId} but is unlinked.`,
        ),
      ].join('\n') + '\n',
    )
  }

  if (strict && findings.length) process.exitCode = 1
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
