import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const schema = await readFile('prisma/schema.prisma', 'utf8')
assert.doesNotMatch(schema, /model\s+Component\s*\{/)
assert.doesNotMatch(schema, /\bcomponentId\s+Int\?/)
assert.doesNotMatch(schema, /enum\s+ComponentStatus\s*\{/)

const migration = await readFile(
  'prisma/migrations/20260812040500_retire_component_schema/migration.sql',
  'utf8',
)
for (const fragment of [
  'DROP TABLE IF EXISTS `ReviewDraft`',
  "`reactionCategory` = 'COMPONENT'",
  'DROP FOREIGN KEY `Reaction_componentId_fkey`',
  'DROP COLUMN `componentId`',
  'DROP TABLE `Component`',
]) {
  assert.match(migration, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}

const files = await readdir('config')
assert.equal(
  files.filter((name) => /^wonderlab-voice-polish-batch-\d+\.json$/.test(name)).length,
  39,
  'Voice corpus must remain checked in after Component schema retirement',
)

const reactions = await readFile('server/api/reactions/index.post.ts', 'utf8')
assert.match(reactions, /retiredReactionCategories[\s\S]*'COMPONENT'/)
assert.doesNotMatch(reactions, /componentId\?:/)

console.log('Component schema retirement contract passed.')
