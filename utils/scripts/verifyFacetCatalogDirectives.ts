// /utils/scripts/verifyFacetCatalogDirectives.ts
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const directivePath = path.join(
  root,
  'utils/scripts/applyFacetCatalogDirectives.ts',
)
const runnerPath = path.join(root, 'scripts/run_facet_catalog_maintenance.ts')

const directive = fs.readFileSync(directivePath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')

for (const required of [
  "canonicalSlug: 'afrofuturism'",
  "duplicateSlugs: ['africanfuturism']",
  "'African Futurism'",
  "canonicalSlug: 'biopunk'",
  "duplicateSlugs: ['art-punk-biopunk']",
  "canonicalSlug: 'dieselpunk'",
  "canonicalSlug: 'mythpunk'",
  "canonicalSlug: 'nanopunk'",
  "canonicalSlug: 'solarpunk'",
  "canonicalSlug: 'steampunk'",
  "canonicalSlug: 'circuscore'",
  "finalSlug: 'circus'",
  "title: 'Circus'",
  "'Circuspunk'",
  "'Carnivalpunk'",
  "'Dark Carnival'",
  "title: 'Grand Scale'",
  "title: 'Devoted'",
  "taxonomy: 'ART_DIRECTION'",
  "taxonomy: 'THEME'",
  "where: { taxonomy: 'MOOD' }",
  "'merged-and-deleted'",
  'prisma.facet.delete',
  "groupKey: 'genre-recipe'",
  "duplicateSlug === 'carnival'",
]) {
  assert.ok(
    directive.includes(required),
    `Missing directive contract: ${required}`,
  )
}

assert.ok(
  directive.includes("aliases: ['Africanfuturism', 'African Futurism']"),
  'Africanfuturism must be an alias of Afrofuturism.',
)
assert.ok(
  directive.includes(
    'await prisma.facet.delete({ where: { id: duplicate.id } })',
  ),
  'Duplicate merges must physically delete old records.',
)
assert.ok(
  directive.includes('Expected zero MOOD profiles'),
  'The directive must enforce removal of MOOD as a global taxonomy.',
)
assert.ok(
  directive.includes("'Loyal Personality'"),
  'Devoted must retain a compatibility alias for Loyal Personality.',
)
assert.ok(
  !directive.includes("title: 'Epic Atmosphere'"),
  'Epic must remain a rarity, not survive as an atmosphere title.',
)

const hook = "script: 'utils/scripts/applyFacetCatalogDirectives.ts'"
assert.ok(
  runner.includes(hook),
  'Production build must apply catalog directives.',
)
assert.ok(
  runner.indexOf(hook) < runner.indexOf('auditFacetCatalogOddities.ts'),
  'Catalog directives must run before the whole-catalog audit.',
)

console.log('Facet catalog directive contract verified.')
