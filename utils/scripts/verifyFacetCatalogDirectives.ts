// /utils/scripts/verifyFacetCatalogDirectives.ts
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const directivePath = path.join(
  root,
  'utils/scripts/applyFacetCatalogDirectives.ts',
)
const buildPath = path.join(root, 'scripts/vercel-build.mjs')

const directive = fs.readFileSync(directivePath, 'utf8')
const build = fs.readFileSync(buildPath, 'utf8')

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
  "title: 'Circus'",
  "'Circuspunk'",
  "'Carnivalpunk'",
  "'Dark Carnival'",
  "title: 'Grand Scale'",
  "title: 'Devoted'",
  "taxonomy: 'ART_DIRECTION'",
  "taxonomy: 'THEME'",
  "where: { taxonomy: 'MOOD' }",
  'prisma.facet.delete',
  "groupKey: 'genre-recipe'",
]) {
  assert.ok(directive.includes(required), `Missing directive contract: ${required}`)
}

assert.ok(
  directive.includes("aliases: ['Africanfuturism', 'African Futurism']"),
  'Africanfuturism must be an alias of Afrofuturism.',
)
assert.ok(
  directive.includes("action: 'merged-and-deleted'"),
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

const hook = "['utils/scripts/applyFacetCatalogDirectives.ts', '--apply']"
assert.ok(build.includes(hook), 'Production build must apply catalog directives.')
assert.ok(
  build.indexOf(hook) < build.indexOf('auditFacetCatalogOddities.ts'),
  'Catalog directives must run before the whole-catalog audit.',
)

console.log('Facet catalog directive contract verified.')
