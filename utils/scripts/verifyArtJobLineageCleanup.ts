// /utils/scripts/verifyArtJobLineageCleanup.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationPath =
  'prisma/migrations/20260720235000_squash_artjob_lineage_duplicates/migration.sql'
const sql = await readFile(migrationPath, 'utf8')

assert.match(sql, /CREATE TEMPORARY TABLE `_ArtJobLineageDuplicate`/)
assert.match(sql, /clone\.`status` = 'PENDING'/)
assert.match(sql, /root\.`status` IN \('FAILED', 'PENDING'\)/)
assert.match(
  sql,
  /JSON_UNQUOTE\(JSON_EXTRACT\(clone\.`payload`, '\$\.retry\.mode'\)\) = 'NEW_OUTPUT'/,
)
assert.match(sql, /clone\.`status` = 'CANCELLED'/)
assert.match(sql, /root\.`status` = 'PENDING'/)
assert.match(sql, /root\.`attempts` = 0/)
assert.match(sql, /root\.`error` = NULL/)
assert.match(sql, /DROP TEMPORARY TABLE `_ArtJobLineageDuplicate`/)
assert.doesNotMatch(sql, /DELETE\s+FROM/i)
assert.doesNotMatch(sql, /DROP\s+TABLE\s+`ArtJob`/i)
assert.doesNotMatch(sql, /TRUNCATE/i)

console.log('ArtJob lineage cleanup migration contract passed.')
