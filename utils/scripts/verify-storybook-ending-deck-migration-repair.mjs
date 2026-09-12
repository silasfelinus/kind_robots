// /utils/scripts/verify-storybook-ending-deck-migration-repair.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  repairStorybookEndingDeckMigration,
  storybookEndingDeckMigrationNames,
} from '../../scripts/repair-storybook-ending-deck-migration.mjs'

const { bridge, failed } = storybookEndingDeckMigrationNames
assert.equal(bridge, '20260912121500_prepare_life_ending_deck_fk')
assert.equal(failed, '20260912123000_scope_life_ending_outcome_key_to_its_deck')

function fakeConnection(options = {}) {
  const state = {
    failed: options.failed ?? true,
    deckIdNullable: options.deckIdNullable ?? true,
    globalUnique: options.globalUnique ?? false,
    foreignKeyDeleteRule: options.foreignKeyDeleteRule ?? 'SET NULL',
    nullDeckIds: options.nullDeckIds ?? 0,
    duplicateGroups: options.duplicateGroups ?? 0,
    statements: [],
  }

  return {
    state,
    async query(sql, params = []) {
      const normalized = String(sql).replace(/\s+/g, ' ').trim()
      state.statements.push(normalized)

      if (normalized.startsWith('SELECT migration_name FROM _prisma_migrations')) {
        return state.failed ? [{ migration_name: failed }] : []
      }
      if (normalized.startsWith('SELECT DATABASE() AS databaseName')) {
        return [{ databaseName: 'kindrobots' }]
      }
      if (normalized.includes('FROM information_schema.COLUMNS')) {
        return [
          {
            dataType: 'int',
            isNullable: state.deckIdNullable ? 'YES' : 'NO',
          },
        ]
      }
      if (normalized.includes('FROM information_schema.STATISTICS')) {
        return state.globalUnique
          ? [{ columnName: 'outcomeKey', nonUnique: 0, sequence: 1 }]
          : []
      }
      if (normalized.includes('FROM information_schema.KEY_COLUMN_USAGE')) {
        return state.foreignKeyDeleteRule
          ? [
              {
                columnName: 'deckId',
                referencedTable: 'EndingDeck',
                referencedColumn: 'id',
                deleteRule: state.foreignKeyDeleteRule,
                updateRule: 'CASCADE',
              },
            ]
          : []
      }
      if (normalized === 'SELECT COUNT(*) AS count FROM `LifeEnding` WHERE `deckId` IS NULL') {
        return [{ count: state.nullDeckIds }]
      }
      if (normalized.includes('FROM ( SELECT deckId, outcomeKey FROM LifeEnding')) {
        return [{ count: state.duplicateGroups }]
      }
      if (normalized.includes('DROP INDEX `LifeEnding_outcomeKey_key`')) {
        state.globalUnique = false
        return { affectedRows: 0 }
      }
      if (normalized.includes('DROP FOREIGN KEY `LifeEnding_deckId_fkey`')) {
        state.foreignKeyDeleteRule = null
        return { affectedRows: 0 }
      }
      if (normalized.includes('ADD CONSTRAINT `LifeEnding_deckId_fkey`')) {
        state.foreignKeyDeleteRule = 'RESTRICT'
        return { affectedRows: 0 }
      }
      if (normalized === 'ALTER TABLE `LifeEnding` MODIFY `deckId` INTEGER NOT NULL') {
        state.deckIdNullable = false
        return { affectedRows: 0 }
      }

      throw new Error(`Unexpected Storybook repair query: ${normalized} params=${JSON.stringify(params)}`)
    },
  }
}

const noOp = fakeConnection({ failed: false })
const noOpCommands = []
assert.deepEqual(
  await repairStorybookEndingDeckMigration({
    connection: noOp,
    prismaUrl: 'mysql://example',
    runPrismaCommand: async (...args) => noOpCommands.push(args),
  }),
  { repaired: [] },
)
assert.deepEqual(noOpCommands, [])

// Production's expected partial-DDL shape: the failed migration's DROP INDEX
// already committed, but deckId remained nullable behind an ON DELETE SET NULL FK.
const partial = fakeConnection({
  globalUnique: false,
  deckIdNullable: true,
  foreignKeyDeleteRule: 'SET NULL',
})
const repairCommands = []
assert.deepEqual(
  await repairStorybookEndingDeckMigration({
    connection: partial,
    prismaUrl: 'mysql://example',
    runPrismaCommand: async (...args) => repairCommands.push(args),
  }),
  { repaired: [bridge, failed] },
)
assert.equal(partial.state.deckIdNullable, false)
assert.equal(partial.state.foreignKeyDeleteRule, 'RESTRICT')
assert.equal(partial.state.globalUnique, false)
assert.deepEqual(repairCommands, [
  ['mysql://example', ['migrate', 'resolve', '--applied', bridge]],
  ['mysql://example', ['migrate', 'resolve', '--applied', failed]],
])

// Also handles a failure before the first DDL statement committed.
const beforeDrop = fakeConnection({ globalUnique: true })
const beforeDropCommands = []
await repairStorybookEndingDeckMigration({
  connection: beforeDrop,
  prismaUrl: 'mysql://example',
  runPrismaCommand: async (...args) => beforeDropCommands.push(args),
})
assert.equal(beforeDrop.state.globalUnique, false)
assert.equal(beforeDrop.state.deckIdNullable, false)
assert.equal(beforeDrop.state.foreignKeyDeleteRule, 'RESTRICT')
assert.equal(beforeDropCommands.length, 2)

for (const [label, options, pattern] of [
  [
    'null deck IDs',
    { nullDeckIds: 1 },
    /LifeEnding row\(s\) still have NULL deckId/i,
  ],
  [
    'duplicate scoped keys',
    { duplicateGroups: 1 },
    /duplicate \(deckId, outcomeKey\) group/i,
  ],
]) {
  const unsafe = fakeConnection(options)
  const commands = []
  await assert.rejects(
    repairStorybookEndingDeckMigration({
      connection: unsafe,
      prismaUrl: 'mysql://example',
      runPrismaCommand: async (...args) => commands.push(args),
    }),
    pattern,
    label,
  )
  assert.deepEqual(commands, [], `${label}: migration history must remain unchanged`)
}

const repairSource = await readFile(
  'scripts/repair-storybook-ending-deck-migration.mjs',
  'utf8',
)
const deploySource = await readFile('scripts/prisma-migrate-deploy.mjs', 'utf8')
const bridgeSource = await readFile(
  'prisma/migrations/20260912121500_prepare_life_ending_deck_fk/migration.sql',
  'utf8',
)
const uniqueSource = await readFile(
  'prisma/migrations/20260912124000_add_life_ending_deck_outcome_unique/migration.sql',
  'utf8',
)

assert.match(repairSource, /ON DELETE RESTRICT ON UPDATE CASCADE/)
assert.match(repairSource, /LifeEnding.*deckId.*IS NULL/s)
assert.match(repairSource, /GROUP BY deckId, outcomeKey/)
assert.match(repairSource, /migrate',\s*'resolve',\s*'--applied'/)
assert.doesNotMatch(repairSource, /UPDATE\s+_prisma_migrations/i)
assert.doesNotMatch(repairSource, /DELETE\s+FROM/i)
assert.doesNotMatch(repairSource, /DROP\s+TABLE/i)
assert.match(bridgeSource, /ON DELETE RESTRICT ON UPDATE CASCADE/)
assert.match(uniqueSource, /UNIQUE INDEX `LifeEnding_deckId_outcomeKey_key`/)
assert.match(deploySource, /repairStorybookEndingDeckMigration/)
assert.match(
  deploySource,
  /withConnectionRetry[\s\S]*repairStorybookEndingDeckMigration[\s\S]*await runPrismaMigrate/,
)

console.log('Storybook ending-deck migration repair contract passed.')
