// /utils/scripts/verifyFacetCurationMoodPolicy.ts
//
// Every curated MOOD definition must be one the directives step knows how to
// migrate. Offline; no database.
//
//   npx tsx utils/scripts/verifyFacetCurationMoodPolicy.ts
//
// WHY
// ---
// The facet maintenance run is a serialized sequence, and two of its steps
// disagree about MOOD unless somebody keeps them in sync by hand:
//
//   curateFacetCatalog        applies FACET_CURATION_BATCHES, upserting each
//                             definition's taxonomy verbatim -- so a mood()
//                             definition CREATES a MOOD profile.
//
//   applyFacetCatalogDirectives  reclassifies the four slugs in its
//                             NARRATIVE_TONES constant to THEME, then asserts
//                             `Expected zero MOOD profiles`.
//
// A MOOD definition that is not in NARRATIVE_TONES therefore survives its own
// migration and fails the post-condition. The failure is expensive out of all
// proportion to the mistake: it surfaces sixteen minutes into a production run
// that has already merged duplicates and DELETED historical shell rows, so the
// exit code reads like a rollback when nothing rolled back at all.
//
// That happened on 2026-08-13 (run 31703186995). A genre-vocabulary batch added
// mood('elegiac-wonder') -- correct instinct, wrong taxonomy, since the catalog
// policy is "art atmosphere is ART_DIRECTION, story tone is THEME" -- and a
// second one, mood('borrowed-light-bittersweet'), was already queued to fail
// the same way on the following run.
//
// This check is deliberately a PAIRING rule rather than a ban. The two
// legitimate mood() definitions (emotionally-intimate, tender) are declared
// MOOD and migrated to THEME by the directives on purpose; outlawing MOOD
// outright would force a rewrite of a working arrangement. What must never
// happen again is a MOOD definition with nothing to migrate it.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FACET_CURATION_BATCHES } from './../../utils/seeds/facetCatalogCuration'

const root = process.cwd()
const directivePath = join(
  root,
  'utils/scripts/applyFacetCatalogDirectives.ts',
)
const directive = readFileSync(directivePath, 'utf8')

/**
 * The NARRATIVE_TONES array, read out of the directive source.
 *
 * Parsed from text rather than imported because applyFacetCatalogDirectives
 * opens a Prisma client and runs `main()` on import -- importing it here would
 * try to reach production from a contract test.
 */
function narrativeToneSlugs(): Set<string> {
  const block = directive.match(
    /const NARRATIVE_TONES = \[([\s\S]*?)\] as const/,
  )?.[1]
  assert.ok(
    block,
    'Could not find the NARRATIVE_TONES array in applyFacetCatalogDirectives.ts. ' +
      'If it was renamed, update this contract rather than deleting it.',
  )
  const slugs = [...block.matchAll(/'([^']+)'/g)].map((match) => match[1] || '')
  assert.ok(
    slugs.length > 0,
    'NARRATIVE_TONES parsed as empty; the regex above no longer matches the source.',
  )
  return new Set(slugs)
}

/** The post-condition this whole check exists to protect. */
assert.ok(
  directive.includes("where: { taxonomy: 'MOOD' }") &&
    directive.includes('Expected zero MOOD profiles'),
  'applyFacetCatalogDirectives no longer asserts zero MOOD profiles. If that ' +
    'policy was deliberately dropped, this contract should be dropped with it.',
)

const tones = narrativeToneSlugs()
const violations: string[] = []
let moodDefinitions = 0

for (const batch of FACET_CURATION_BATCHES) {
  for (const definition of batch.ensures) {
    if (definition.taxonomy !== 'MOOD') continue
    moodDefinitions += 1
    if (!tones.has(definition.slug)) {
      violations.push(
        `${batch.id}: mood('${definition.slug}', '${definition.title}') is not in ` +
          `NARRATIVE_TONES, so nothing will migrate it and the maintenance run ` +
          `will fail its zero-MOOD post-condition. Use theme() if this is story ` +
          `tone, or add the slug to NARRATIVE_TONES if it genuinely needs the ` +
          `narrative-tone group and weight.`,
      )
    }
  }
}

if (violations.length) {
  console.error(`Facet curation MOOD policy FAILED (${violations.length}):`)
  for (const violation of violations) console.error(`  - ${violation}`)
  process.exit(1)
}

console.log(
  `Facet curation MOOD policy verified: ${moodDefinitions} MOOD definition(s) ` +
    `across ${FACET_CURATION_BATCHES.length} batch(es), all covered by the ` +
    `${tones.size} slug(s) in NARRATIVE_TONES.`,
)
