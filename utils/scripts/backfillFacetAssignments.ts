// Backfill the *real* Facet-assignment debt the refined strict audit still
// reports — the mappable-but-unlinked owner fields — and clean up the genuine
// taxonomy mismatches. This is the small, surgical counterpart to the audit
// refinement: the triage (triageFacetAudit.ts) showed the overwhelming majority
// of "missing assignment" findings are expected bespoke creative data, so this
// script only ever touches values that resolve to a real canonical Facet.
//
// Two ordered, independently-logged steps (run AFTER repairFacetProfiles.ts so
// the profileless-cascade rows already carry a taxonomy):
//
//   (a) Delete genuine taxonomy mismatches — Character/Bot assignment rows whose
//       linked Facet has a taxonomy that is NOT allowed for the field (e.g. a
//       `class` field linked to a SPECIES Facet). These are wrong links from an
//       earlier backfill; removing them lets step (b) recreate a correct link if
//       the underlying value is mappable. Rows whose Facet still has no profile
//       are left alone (those are the profile-repair's job, not a real mismatch).
//
//   (b) Create mappable-but-unlinked assignments — for every Character/Bot field
//       and Scenario genre whose value(s) resolve via the alias table to a
//       canonical Facet of the allowed taxonomy but have no link, insert the
//       assignment row(s) (source = 'MIGRATION'). Prose Character fields
//       (backstory, quirks) are skipped, matching the audit.
//
// Idempotent: every insert uses skipDuplicates against the owner's unique
// constraint, and re-running after a clean run is a no-op.
//
// Usage:
//   DATABASE_URL=... tsx utils/scripts/backfillFacetAssignments.ts          # dry-run
//   DATABASE_URL=... tsx utils/scripts/backfillFacetAssignments.ts --apply  # write
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import { normalizeFacetLookupKey } from './../facetAliases'

const databaseUrl: string = process.env.DATABASE_URL ?? ''
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.slice(2).includes('--apply')

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
// Narrative prose fields — never canonical concept references, excluded from
// the scalar-assignment backfill (mirrors auditFacetCatalogData.ts).
const PROSE_CHARACTER_FIELDS = new Set(['backstory', 'quirks'])

function splitScalar(fieldKey: string, value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) return []
  if (fieldKey === 'personality' || fieldKey === 'quirks' || fieldKey === 'genres') {
    return value
      .split(/\n---\n|\||\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return [value.trim()]
}

async function main(): Promise<void> {
  const [profiles, aliases, characterLinks, botLinks, scenarioLinks, characters, bots, scenarios] =
    await Promise.all([
      prisma.facetProfile.findMany({ select: { facetId: true, taxonomy: true } }),
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

  const taxonomyByFacetId = new Map(profiles.map((p) => [p.facetId, p.taxonomy]))
  // lookupKey -> facets that own it, each with its taxonomy, sorted by facetId
  // so resolution is deterministic when several facets share an alias.
  const facetsByLookup = new Map<string, Array<{ facetId: number; taxonomy: string }>>()
  for (const alias of aliases) {
    const taxonomy = taxonomyByFacetId.get(alias.facetId)
    if (!taxonomy) continue
    const list = facetsByLookup.get(alias.lookupKey) ?? []
    list.push({ facetId: alias.facetId, taxonomy })
    facetsByLookup.set(alias.lookupKey, list)
  }
  for (const list of facetsByLookup.values()) {
    list.sort((a, b) => a.facetId - b.facetId)
  }

  // Resolve a scalar value to the facetId of a canonical Facet whose taxonomy is
  // allowed for the field, or null if the value is custom/unmappable.
  function resolveFacet(value: string, allowed: readonly string[]): number | null {
    const owners = facetsByLookup.get(normalizeFacetLookupKey(value))
    if (!owners) return null
    const match = owners.find((owner) => allowed.includes(owner.taxonomy))
    return match ? match.facetId : null
  }

  // --- Step (a): genuine taxonomy-mismatch deletions ---
  const charDeletes: Array<{ characterId: number; facetId: number; fieldKey: string }> = []
  for (const link of characterLinks) {
    const taxonomy = taxonomyByFacetId.get(link.facetId)
    const allowed = CHARACTER_FIELD_TAXONOMIES[link.fieldKey]
    if (taxonomy && allowed && !allowed.includes(taxonomy)) {
      charDeletes.push(link)
    }
  }
  const botDeletes: Array<{ botId: number; facetId: number; fieldKey: string }> = []
  for (const link of botLinks) {
    const taxonomy = taxonomyByFacetId.get(link.facetId)
    const allowed = BOT_FIELD_TAXONOMIES[link.fieldKey]
    if (taxonomy && allowed && !allowed.includes(taxonomy)) {
      botDeletes.push(link)
    }
  }

  // Rebuild "field is linked" sets excluding the rows step (a) removes, so a
  // field freed by a mismatch delete becomes eligible for a correct backfill.
  const deletedCharKeys = new Set(
    charDeletes.map((d) => `${d.characterId}:${d.facetId}:${d.fieldKey}`),
  )
  const deletedBotKeys = new Set(
    botDeletes.map((d) => `${d.botId}:${d.facetId}:${d.fieldKey}`),
  )
  const charLinkedField = new Set(
    characterLinks
      .filter((l) => !deletedCharKeys.has(`${l.characterId}:${l.facetId}:${l.fieldKey}`))
      .map((l) => `${l.characterId}:${l.fieldKey}`),
  )
  const botLinkedField = new Set(
    botLinks
      .filter((l) => !deletedBotKeys.has(`${l.botId}:${l.facetId}:${l.fieldKey}`))
      .map((l) => `${l.botId}:${l.fieldKey}`),
  )
  const scenarioLinkedFacet = new Set(
    scenarioLinks.map((l) => `${l.scenarioId}:${l.facetId}`),
  )

  // --- Step (b): mappable-but-unlinked backfill ---
  type CharacterFacetRow = {
    characterId: number
    facetId: number
    fieldKey: string
    sortOrder: number
    source: string
  }
  type BotFacetRow = { botId: number; facetId: number; fieldKey: string; sortOrder: number; source: string }
  type ScenarioFacetRow = { scenarioId: number; facetId: number }

  const charInserts: CharacterFacetRow[] = []
  for (const character of characters) {
    for (const fieldKey of Object.keys(CHARACTER_FIELD_TAXONOMIES)) {
      if (PROSE_CHARACTER_FIELDS.has(fieldKey)) continue
      if (charLinkedField.has(`${character.id}:${fieldKey}`)) continue
      const values = splitScalar(fieldKey, (character as Record<string, unknown>)[fieldKey])
      if (!values.length) continue
      const seen = new Set<number>()
      let sortOrder = 0
      for (const value of values) {
        const facetId = resolveFacet(value, CHARACTER_FIELD_TAXONOMIES[fieldKey]!)
        if (facetId === null || seen.has(facetId)) continue
        seen.add(facetId)
        charInserts.push({
          characterId: character.id,
          facetId,
          fieldKey,
          sortOrder: sortOrder++,
          source: 'MIGRATION',
        })
      }
    }
  }

  const botInserts: BotFacetRow[] = []
  for (const bot of bots) {
    for (const fieldKey of Object.keys(BOT_FIELD_TAXONOMIES)) {
      if (botLinkedField.has(`${bot.id}:${fieldKey}`)) continue
      const values = splitScalar(fieldKey, (bot as Record<string, unknown>)[fieldKey])
      if (!values.length) continue
      const seen = new Set<number>()
      let sortOrder = 0
      for (const value of values) {
        const facetId = resolveFacet(value, BOT_FIELD_TAXONOMIES[fieldKey]!)
        if (facetId === null || seen.has(facetId)) continue
        seen.add(facetId)
        botInserts.push({
          botId: bot.id,
          facetId,
          fieldKey,
          sortOrder: sortOrder++,
          source: 'MIGRATION',
        })
      }
    }
  }

  const scenarioInserts: ScenarioFacetRow[] = []
  for (const scenario of scenarios) {
    const values = splitScalar('genres', scenario.genres)
    if (!values.length) continue
    for (const value of values) {
      const facetId = resolveFacet(value, ['GENRE'])
      if (facetId === null) continue
      if (scenarioLinkedFacet.has(`${scenario.id}:${facetId}`)) continue
      scenarioLinkedFacet.add(`${scenario.id}:${facetId}`)
      scenarioInserts.push({ scenarioId: scenario.id, facetId })
    }
  }

  process.stdout.write(
    [
      `Facet assignment backfill — ${apply ? 'APPLY' : 'DRY-RUN'}`,
      '',
      'Step (a) genuine taxonomy-mismatch deletions:',
      `  CharacterFacet rows: ${charDeletes.length}`,
      `  BotFacet rows:       ${botDeletes.length}`,
      ...charDeletes
        .slice(0, 20)
        .map((d) => `    - char ${d.characterId} field=${d.fieldKey} facet=${d.facetId} (${taxonomyByFacetId.get(d.facetId)})`),
      charDeletes.length > 20 ? `    … +${charDeletes.length - 20} more` : '',
      '',
      'Step (b) mappable-but-unlinked backfill:',
      `  CharacterFacet inserts: ${charInserts.length}`,
      `  BotFacet inserts:       ${botInserts.length}`,
      `  ScenarioFacet inserts:  ${scenarioInserts.length}`,
      ...charInserts
        .slice(0, 20)
        .map((r) => `    + char ${r.characterId} field=${r.fieldKey} -> facet ${r.facetId}`),
      charInserts.length > 20 ? `    … +${charInserts.length - 20} more` : '',
    ]
      .filter((line) => line !== '')
      .join('\n') + '\n',
  )

  if (!apply) {
    process.stdout.write('\nDry-run only. Re-run with --apply to write.\n')
    return
  }

  let deleted = 0
  for (const d of charDeletes) {
    const result = await prisma.characterFacet.deleteMany({
      where: { characterId: d.characterId, facetId: d.facetId, fieldKey: d.fieldKey },
    })
    deleted += result.count
  }
  for (const d of botDeletes) {
    const result = await prisma.botFacet.deleteMany({
      where: { botId: d.botId, facetId: d.facetId, fieldKey: d.fieldKey },
    })
    deleted += result.count
  }

  let inserted = 0
  if (charInserts.length) {
    const result = await prisma.characterFacet.createMany({
      data: charInserts,
      skipDuplicates: true,
    })
    inserted += result.count
  }
  if (botInserts.length) {
    const result = await prisma.botFacet.createMany({
      data: botInserts,
      skipDuplicates: true,
    })
    inserted += result.count
  }
  if (scenarioInserts.length) {
    const result = await prisma.scenarioFacet.createMany({
      data: scenarioInserts,
      skipDuplicates: true,
    })
    inserted += result.count
  }

  process.stdout.write(
    `\nApplied: deleted ${deleted} mismatched rows, created ${inserted} assignment rows.\n`,
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
