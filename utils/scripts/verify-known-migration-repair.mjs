// /utils/scripts/verify-known-migration-repair.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  knownFailedMigrationNames,
  repairKnownFailedMigrations,
} from '../../scripts/repair-known-prisma-migrations.mjs'

const migrationName = '20260719031500_reaction_first_party_author_expand'
assert.deepEqual(knownFailedMigrationNames, [migrationName])

function fakeConnection(options = {}) {
  const state = {
    failed: options.failed ?? true,
    columns: new Map(options.columns || []),
    indexes: new Set(options.indexes || []),
    foreignKeys: new Set(options.foreignKeys || []),
    checkConstraint: options.checkConstraint ?? false,
    unsafeRows: options.unsafeRows ?? false,
    statements: [],
  }

  return {
    state,
    async query(sql, params = []) {
      const normalized = String(sql).replace(/\s+/g, ' ').trim()
      state.statements.push(normalized)

      if (normalized.startsWith('SELECT migration_name FROM _prisma_migrations')) {
        return state.failed ? [{ migration_name: migrationName }] : []
      }
      if (normalized.startsWith('SELECT DATABASE() AS databaseName')) {
        return [{ databaseName: 'kindrobots' }]
      }
      if (normalized.includes('FROM information_schema.COLUMNS')) {
        const column = params[1]
        const definition = state.columns.get(column)
        return definition ? [definition] : []
      }
      if (normalized.includes('FROM information_schema.STATISTICS')) {
        return state.indexes.has(params[1]) ? [{ INDEX_NAME: params[1] }] : []
      }
      if (normalized.includes('FROM information_schema.KEY_COLUMN_USAGE')) {
        return state.foreignKeys.has(params[1])
          ? [{ CONSTRAINT_NAME: params[1] }]
          : []
      }
      if (normalized.includes('FROM information_schema.TABLE_CONSTRAINTS')) {
        return state.checkConstraint ? [{ CONSTRAINT_NAME: params[1] }] : []
      }
      if (normalized.startsWith('SELECT SUM(authorBotId')) {
        return [
          state.unsafeRows
            ? { dualAuthors: 1, missingBots: 0, missingCharacters: 0 }
            : { dualAuthors: 0, missingBots: 0, missingCharacters: 0 },
        ]
      }
      if (normalized.includes('ADD COLUMN `authorBotId`')) {
        state.columns.set('authorBotId', { dataType: 'int', isNullable: 'YES' })
        return { affectedRows: 0 }
      }
      if (normalized.includes('ADD COLUMN `authorCharacterId`')) {
        state.columns.set('authorCharacterId', {
          dataType: 'int',
          isNullable: 'YES',
        })
        return { affectedRows: 0 }
      }
      if (normalized.startsWith('CREATE INDEX `Reaction_authorBotId_idx`')) {
        state.indexes.add('Reaction_authorBotId_idx')
        return { affectedRows: 0 }
      }
      if (
        normalized.startsWith('CREATE INDEX `Reaction_authorCharacterId_idx`')
      ) {
        state.indexes.add('Reaction_authorCharacterId_idx')
        return { affectedRows: 0 }
      }
      if (normalized.includes('DROP CONSTRAINT `Reaction_firstPartyAuthor_check`')) {
        state.checkConstraint = false
        return { affectedRows: 0 }
      }
      if (normalized.includes('ADD CONSTRAINT `Reaction_authorBotId_fkey`')) {
        state.foreignKeys.add('Reaction_authorBotId_fkey')
        return { affectedRows: 0 }
      }
      if (
        normalized.includes('ADD CONSTRAINT `Reaction_authorCharacterId_fkey`')
      ) {
        state.foreignKeys.add('Reaction_authorCharacterId_fkey')
        return { affectedRows: 0 }
      }

      throw new Error(`Unexpected repair query: ${normalized}`)
    },
  }
}

const noOp = fakeConnection({ failed: false })
const noOpCommands = []
assert.deepEqual(
  await repairKnownFailedMigrations({
    connection: noOp,
    prismaUrl: 'mysql://example',
    runPrismaCommand: async (...args) => noOpCommands.push(args),
  }),
  { repaired: [] },
)
assert.deepEqual(noOpCommands, [])

const partial = fakeConnection({
  columns: [
    ['authorBotId', { dataType: 'int', isNullable: 'YES' }],
    ['authorCharacterId', { dataType: 'int', isNullable: 'YES' }],
  ],
  indexes: ['Reaction_authorBotId_idx', 'Reaction_authorCharacterId_idx'],
})
const repairCommands = []
assert.deepEqual(
  await repairKnownFailedMigrations({
    connection: partial,
    prismaUrl: 'mysql://example',
    runPrismaCommand: async (...args) => repairCommands.push(args),
  }),
  { repaired: [migrationName] },
)
assert.ok(partial.state.foreignKeys.has('Reaction_authorBotId_fkey'))
assert.ok(partial.state.foreignKeys.has('Reaction_authorCharacterId_fkey'))
assert.deepEqual(repairCommands, [
  [
    'mysql://example',
    ['migrate', 'resolve', '--applied', migrationName],
  ],
])

const unsafe = fakeConnection({
  columns: [
    ['authorBotId', { dataType: 'int', isNullable: 'YES' }],
    ['authorCharacterId', { dataType: 'int', isNullable: 'YES' }],
  ],
  indexes: ['Reaction_authorBotId_idx', 'Reaction_authorCharacterId_idx'],
  unsafeRows: true,
})
const unsafeCommands = []
await assert.rejects(
  repairKnownFailedMigrations({
    connection: unsafe,
    prismaUrl: 'mysql://example',
    runPrismaCommand: async (...args) => unsafeCommands.push(args),
  }),
  /violates the intended foreign-key or single-author invariants/i,
)
assert.deepEqual(unsafeCommands, [])

const repairSource = await readFile(
  'scripts/repair-known-prisma-migrations.mjs',
  'utf8',
)
const deploySource = await readFile('scripts/prisma-migrate-deploy.mjs', 'utf8')
assert.match(repairSource, /migrate',\s*'resolve',\s*'--applied'/)
assert.match(repairSource, /schema verification failed; migration history was not changed/)
assert.doesNotMatch(repairSource, /UPDATE\s+_prisma_migrations/i)
assert.doesNotMatch(repairSource, /DELETE\s+FROM/i)
assert.doesNotMatch(repairSource, /DROP\s+TABLE/i)
assert.match(deploySource, /repairKnownFailedMigrations/)
assert.match(deploySource, /await repairKnownFailedMigrations[\s\S]*await runPrismaMigrate/)

console.log('Known failed Prisma migration repair contract passed.')
