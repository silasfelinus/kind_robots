// /utils/scripts/verifyComponentCanonicalExpand.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationPath =
  'prisma/migrations/20260718234000_component_canonical_expand/migration.sql'
const sql = await readFile(migrationPath, 'utf8')

const expectedStatuses = [
  'UNREVIEWED',
  'WORKING',
  'NEEDS_CONTEXT',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'RETIRED',
  'PREVIEW_UNSUPPORTED',
]

for (const status of expectedStatuses) {
  assert.match(sql, new RegExp(`'${status}'`), `missing ${status} enum value`)
}

for (const column of [
  'slug',
  'sourcePath',
  'sourceKey',
  'sourceHash',
  'status',
  'statusReason',
  'description',
  'category',
  'tags',
  'previewMode',
  'previewConfig',
  'lastSeenAt',
  'isDiscovered',
]) {
  assert.match(sql, new RegExp(`ADD COLUMN \\`${column}\\``))
}

assert.match(sql, /`status`[\s\S]*NOT NULL DEFAULT 'UNREVIEWED'/)
assert.match(sql, /`isDiscovered` BOOLEAN NOT NULL DEFAULT false/)
assert.match(sql, /`tags` JSON NULL/)
assert.match(sql, /`previewConfig` JSON NULL/)

const broken = sql.indexOf("WHEN `isBroken` = true THEN 'BROKEN'")
const building = sql.indexOf(
  "WHEN `underConstruction` = true THEN 'UNDER_CONSTRUCTION'",
)
const working = sql.indexOf("WHEN `isWorking` = true THEN 'WORKING'")
const unreviewed = sql.indexOf("ELSE 'UNREVIEWED'")

assert.ok(broken >= 0, 'broken precedence is required')
assert.ok(broken < building, 'broken must outrank under construction')
assert.ok(building < working, 'under construction must outrank working')
assert.ok(working < unreviewed, 'working must outrank unreviewed')

for (const indexName of [
  'Component_slug_key',
  'Component_sourceKey_key',
  'Component_status_idx',
  'Component_sourcePath_idx',
  'Component_lastSeenAt_idx',
  'Component_isDiscovered_idx',
]) {
  assert.match(sql, new RegExp(`\\`${indexName}\\``))
}

assert.doesNotMatch(sql, /\bDELETE\s+FROM\s+`?Component`?/i)
assert.doesNotMatch(sql, /\bDROP\s+(?:COLUMN|TABLE|INDEX)\b/i)
assert.doesNotMatch(sql, /ALTER\s+COLUMN\s+`?(?:isWorking|underConstruction|isBroken)`?/i)
assert.doesNotMatch(sql, /DROP\s+INDEX\s+`?Component_componentName_key`?/i)

const alterIndex = sql.indexOf('ALTER TABLE `Component`')
const updateIndex = sql.indexOf('UPDATE `Component`')
const uniqueIndex = sql.indexOf('CREATE UNIQUE INDEX `Component_slug_key`')

assert.ok(alterIndex >= 0 && alterIndex < updateIndex)
assert.ok(updateIndex < uniqueIndex, 'backfill must precede new indexes')

console.log('Component canonical expand migration contract passed.')
