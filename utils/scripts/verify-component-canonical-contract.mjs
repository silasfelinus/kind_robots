// /utils/scripts/verify-component-canonical-contract.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationPath =
  'prisma/migrations/20260719125500_component_canonical_contract/migration.sql'

const [schema, migration, generatedComponent] = await Promise.all([
  readFile('prisma/schema.prisma', 'utf8'),
  readFile(migrationPath, 'utf8'),
  readFile('prisma/generated/prisma/models/Component.ts', 'utf8'),
])

const componentBlock =
  schema.match(/model Component \{[\s\S]*?\n\}/)?.[0] || ''
assert.ok(componentBlock, 'Prisma Component model must exist.')
assert.match(
  componentBlock,
  /^\s*status\s+ComponentStatus\s+@default\(UNREVIEWED\)/m,
)
assert.match(componentBlock, /^\s*Reactions\s+Reaction\[\]/m)

const legacyFields = ['isWorking', 'underConstruction', 'isBroken']
for (const field of legacyFields) {
  assert.doesNotMatch(
    componentBlock,
    new RegExp(`^\\s*${field}\\s+`, 'm'),
    `${field} must be removed from the Prisma Component model.`,
  )
  assert.doesNotMatch(
    generatedComponent,
    new RegExp(`\\b${field}\\b`),
    `${field} must be removed from the generated Component client.`,
  )
}

assert.match(migration, /^ALTER TABLE `Component`/m)
for (const field of legacyFields) {
  assert.equal(
    (migration.match(new RegExp('DROP COLUMN `' + field + '`', 'g')) || [])
      .length,
    1,
    `The contract migration must drop ${field} exactly once.`,
  )
}
assert.equal(
  (migration.match(/DROP COLUMN/g) || []).length,
  legacyFields.length,
  'The contract migration must drop only the three retired status columns.',
)
assert.doesNotMatch(migration, /DROP\s+TABLE|DELETE\s+FROM|TRUNCATE/i)
assert.doesNotMatch(
  migration,
  /DROP\s+COLUMN\s+`(?:status|componentName|sourceKey)`/i,
)
assert.doesNotMatch(migration, /Reaction/i)

console.log('Component canonical contract migration verification passed.')
