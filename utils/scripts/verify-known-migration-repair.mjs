// /utils/scripts/verify-known-migration-repair.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  knownFailedMigrationNames,
  repairKnownFailedMigrations,
} from '../../scripts/repair-known-prisma-migrations.mjs'
import {
  isRetryableConnectionError,
  withConnectionRetry,
} from '../../scripts/db-connection-retry.mjs'

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
// The repair must run inside the connection-retry wrapper so a transient
// ProxySQL socket drop (SQLState 08S01) reconnects instead of failing the deploy.
assert.match(deploySource, /withConnectionRetry/)
assert.match(
  deploySource,
  /withConnectionRetry[\s\S]*repairKnownFailedMigrations[\s\S]*await runPrismaMigrate/,
)

// --- Connection-retry classification ---------------------------------------
// Transient connection-level failures are retryable...
assert.equal(
  isRetryableConnectionError({
    code: 'ER_SOCKET_UNEXPECTED_CLOSE',
    sqlState: '08S01',
    errno: 45009,
    fatal: true,
  }),
  true,
)
assert.equal(isRetryableConnectionError({ sqlState: '08S01' }), true)
assert.equal(isRetryableConnectionError({ code: 'ECONNRESET' }), true)
// ...but logical/query errors are not (retrying would hide a real bug).
assert.equal(
  isRetryableConnectionError({ code: 'ER_PARSE_ERROR', sqlState: '42000' }),
  false,
)
assert.equal(
  isRetryableConnectionError({ code: 'ER_DUP_ENTRY', sqlState: '23000' }),
  false,
)
assert.equal(isRetryableConnectionError(null), false)

// --- withConnectionRetry behavior ------------------------------------------
const noDelay = async () => {}

// Retries a transient socket close, then succeeds on a fresh attempt.
let transientCalls = 0
const retryAttempts = []
const retryResult = await withConnectionRetry(
  async () => {
    transientCalls += 1
    if (transientCalls < 3) {
      const error = new Error('socket has unexpectedly been closed')
      error.code = 'ER_SOCKET_UNEXPECTED_CLOSE'
      error.sqlState = '08S01'
      error.fatal = true
      throw error
    }
    return 'repaired'
  },
  {
    baseDelayMs: 0,
    delay: noDelay,
    onRetry: ({ attempt }) => retryAttempts.push(attempt),
  },
)
assert.equal(retryResult, 'repaired')
assert.equal(transientCalls, 3)
assert.deepEqual(retryAttempts, [1, 2])

// Does NOT retry a non-connection (logical) error.
let parseCalls = 0
await assert.rejects(
  withConnectionRetry(
    async () => {
      parseCalls += 1
      const error = new Error('You have an error in your SQL syntax')
      error.code = 'ER_PARSE_ERROR'
      error.sqlState = '42000'
      throw error
    },
    { delay: noDelay },
  ),
  /SQL syntax/,
)
assert.equal(parseCalls, 1)

// Gives up after the attempt budget on a persistent transient error.
let persistentCalls = 0
await assert.rejects(
  withConnectionRetry(
    async () => {
      persistentCalls += 1
      const error = new Error('socket has unexpectedly been closed')
      error.code = 'ER_SOCKET_UNEXPECTED_CLOSE'
      throw error
    },
    { attempts: 3, baseDelayMs: 0, delay: noDelay },
  ),
  /socket has unexpectedly been closed/,
)
assert.equal(persistentCalls, 3)

console.log('Known failed Prisma migration repair contract passed.')
