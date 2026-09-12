// /scripts/repair-storybook-ending-deck-migration.mjs
//
// Production recovery for the failed Storybook ending-deck contraction.
//
// 20260912123000_scope_life_ending_outcome_key_to_its_deck was written as:
//   1. DROP the legacy global LifeEnding.outcomeKey unique index
//   2. make LifeEnding.deckId NOT NULL
//
// The preceding additive migration created LifeEnding_deckId_fkey with
// ON DELETE SET NULL. MariaDB correctly refuses to make that FK column NOT
// NULL while SET NULL remains its delete action, and MySQL/MariaDB DDL is not
// transactional across this sequence. Production can therefore be left with
// step 1 applied, step 2 rejected, and Prisma recording the migration failed.
//
// This repair is deliberately narrow and state-driven. It runs only when that
// exact failed migration is present, refuses to guess if existing data violates
// the intended required/deck-scoped invariants, converges only the schema
// changes that the migration history now describes, verifies them, and only
// then lets Prisma mark the bridge and failed migrations applied. The normal
// migrate-deploy pass subsequently applies the composite unique index migration.

const BRIDGE_MIGRATION = '20260912121500_prepare_life_ending_deck_fk'
const FAILED_MIGRATION =
  '20260912123000_scope_life_ending_outcome_key_to_its_deck'
const LEGACY_OUTCOME_INDEX = 'LifeEnding_outcomeKey_key'
const DECK_FOREIGN_KEY = 'LifeEnding_deckId_fkey'

function rows(result) {
  return Array.isArray(result) ? result : []
}

function countValue(result) {
  const first = rows(result)[0]
  return Number(first?.count ?? first?.COUNT ?? 0)
}

async function currentDatabase(connection) {
  const result = rows(await connection.query('SELECT DATABASE() AS databaseName'))
  const databaseName = result[0]?.databaseName
  if (typeof databaseName !== 'string' || !databaseName) {
    throw new Error('[storybook migration repair] Could not resolve the active database name.')
  }
  return databaseName
}

async function failedMigrationExists(connection) {
  const result = rows(
    await connection.query(
      `SELECT migration_name
         FROM _prisma_migrations
        WHERE migration_name = ?
          AND finished_at IS NULL
          AND rolled_back_at IS NULL
        LIMIT 1`,
      [FAILED_MIGRATION],
    ),
  )
  return result.length > 0
}

async function columnDefinition(connection, databaseName) {
  const result = rows(
    await connection.query(
      `SELECT DATA_TYPE AS dataType, IS_NULLABLE AS isNullable
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'LifeEnding'
          AND COLUMN_NAME = 'deckId'
        LIMIT 1`,
      [databaseName],
    ),
  )
  return result[0] || null
}

async function legacyOutcomeIndexDefinition(connection, databaseName) {
  return rows(
    await connection.query(
      `SELECT COLUMN_NAME AS columnName, NON_UNIQUE AS nonUnique, SEQ_IN_INDEX AS sequence
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'LifeEnding'
          AND INDEX_NAME = ?
        ORDER BY SEQ_IN_INDEX`,
      [databaseName, LEGACY_OUTCOME_INDEX],
    ),
  )
}

async function deckForeignKeyDefinition(connection, databaseName) {
  const result = rows(
    await connection.query(
      `SELECT
          kcu.COLUMN_NAME AS columnName,
          kcu.REFERENCED_TABLE_NAME AS referencedTable,
          kcu.REFERENCED_COLUMN_NAME AS referencedColumn,
          rc.DELETE_RULE AS deleteRule,
          rc.UPDATE_RULE AS updateRule
       FROM information_schema.KEY_COLUMN_USAGE kcu
       JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
         ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
        AND rc.TABLE_NAME = kcu.TABLE_NAME
        AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       WHERE kcu.CONSTRAINT_SCHEMA = ?
         AND kcu.TABLE_NAME = 'LifeEnding'
         AND kcu.CONSTRAINT_NAME = ?
         AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
       LIMIT 1`,
      [databaseName, DECK_FOREIGN_KEY],
    ),
  )
  return result[0] || null
}

async function assertDataCanBecomeRequired(connection) {
  const nullDeckIds = countValue(
    await connection.query(
      'SELECT COUNT(*) AS count FROM `LifeEnding` WHERE `deckId` IS NULL',
    ),
  )
  if (nullDeckIds > 0) {
    throw new Error(
      `[storybook migration repair] Refusing automatic repair: ${nullDeckIds} LifeEnding row(s) still have NULL deckId.`,
    )
  }

  const duplicateGroups = countValue(
    await connection.query(
      `SELECT COUNT(*) AS count
         FROM (
           SELECT deckId, outcomeKey
             FROM LifeEnding
            GROUP BY deckId, outcomeKey
           HAVING COUNT(*) > 1
         ) duplicate_endings`,
    ),
  )
  if (duplicateGroups > 0) {
    throw new Error(
      `[storybook migration repair] Refusing automatic repair: ${duplicateGroups} duplicate (deckId, outcomeKey) group(s) exist.`,
    )
  }
}

function assertExpectedLegacyIndex(indexRows) {
  if (indexRows.length === 0) return
  const exactLegacyUnique =
    indexRows.length === 1 &&
    indexRows[0]?.columnName === 'outcomeKey' &&
    Number(indexRows[0]?.nonUnique) === 0
  if (!exactLegacyUnique) {
    throw new Error(
      `[storybook migration repair] ${LEGACY_OUTCOME_INDEX} exists with an unexpected definition; refusing automatic repair.`,
    )
  }
}

function assertExpectedDeckForeignKey(foreignKey) {
  if (!foreignKey) return
  const expectedTarget =
    foreignKey.columnName === 'deckId' &&
    foreignKey.referencedTable === 'EndingDeck' &&
    foreignKey.referencedColumn === 'id' &&
    foreignKey.updateRule === 'CASCADE'
  if (!expectedTarget) {
    throw new Error(
      `[storybook migration repair] ${DECK_FOREIGN_KEY} exists with an unexpected definition; refusing automatic repair.`,
    )
  }
  if (!['SET NULL', 'RESTRICT', 'NO ACTION'].includes(foreignKey.deleteRule)) {
    throw new Error(
      `[storybook migration repair] ${DECK_FOREIGN_KEY} has unexpected ON DELETE ${foreignKey.deleteRule}; refusing automatic repair.`,
    )
  }
}

async function ensureRequiredDeckForeignKey(connection, databaseName) {
  const current = await deckForeignKeyDefinition(connection, databaseName)
  assertExpectedDeckForeignKey(current)

  if (current?.deleteRule === 'RESTRICT' || current?.deleteRule === 'NO ACTION') {
    return
  }

  if (current) {
    await connection.query(
      `ALTER TABLE \`LifeEnding\` DROP FOREIGN KEY \`${DECK_FOREIGN_KEY}\``,
    )
  }

  await connection.query(
    `ALTER TABLE \`LifeEnding\`
       ADD CONSTRAINT \`${DECK_FOREIGN_KEY}\`
       FOREIGN KEY (\`deckId\`) REFERENCES \`EndingDeck\`(\`id\`)
       ON DELETE RESTRICT ON UPDATE CASCADE`,
  )
}

async function repairSchema(connection, databaseName) {
  const column = await columnDefinition(connection, databaseName)
  if (!column || column.dataType !== 'int') {
    throw new Error(
      '[storybook migration repair] LifeEnding.deckId is missing or has an unexpected type; refusing automatic repair.',
    )
  }

  await assertDataCanBecomeRequired(connection)

  const legacyIndex = await legacyOutcomeIndexDefinition(connection, databaseName)
  assertExpectedLegacyIndex(legacyIndex)
  if (legacyIndex.length > 0) {
    await connection.query(
      `ALTER TABLE \`LifeEnding\` DROP INDEX \`${LEGACY_OUTCOME_INDEX}\``,
    )
  }

  await ensureRequiredDeckForeignKey(connection, databaseName)

  if (column.isNullable === 'YES') {
    await connection.query(
      'ALTER TABLE `LifeEnding` MODIFY `deckId` INTEGER NOT NULL',
    )
  } else if (column.isNullable !== 'NO') {
    throw new Error(
      '[storybook migration repair] LifeEnding.deckId nullability could not be determined; refusing automatic repair.',
    )
  }

  const verifiedColumn = await columnDefinition(connection, databaseName)
  const verifiedForeignKey = await deckForeignKeyDefinition(connection, databaseName)
  const verifiedLegacyIndex = await legacyOutcomeIndexDefinition(
    connection,
    databaseName,
  )

  assertExpectedDeckForeignKey(verifiedForeignKey)
  if (
    verifiedColumn?.dataType !== 'int' ||
    verifiedColumn?.isNullable !== 'NO' ||
    !verifiedForeignKey ||
    !['RESTRICT', 'NO ACTION'].includes(verifiedForeignKey.deleteRule) ||
    verifiedLegacyIndex.length !== 0
  ) {
    throw new Error(
      '[storybook migration repair] Expected schema state was not reached; migration history was not changed.',
    )
  }
}

export async function repairStorybookEndingDeckMigration({
  connection,
  prismaUrl,
  runPrismaCommand,
}) {
  if (!(await failedMigrationExists(connection))) {
    return { repaired: [] }
  }

  console.warn(
    `[storybook migration repair] Found failed ${FAILED_MIGRATION}; reconciling its known partial-DDL state.`,
  )

  const databaseName = await currentDatabase(connection)
  await repairSchema(connection, databaseName)

  await runPrismaCommand(prismaUrl, [
    'migrate',
    'resolve',
    '--applied',
    BRIDGE_MIGRATION,
  ])
  await runPrismaCommand(prismaUrl, [
    'migrate',
    'resolve',
    '--applied',
    FAILED_MIGRATION,
  ])

  console.log(
    `[storybook migration repair] Verified required deck FK + NOT NULL state and marked ${BRIDGE_MIGRATION} plus ${FAILED_MIGRATION} applied.`,
  )

  return { repaired: [BRIDGE_MIGRATION, FAILED_MIGRATION] }
}

export const storybookEndingDeckMigrationNames = {
  bridge: BRIDGE_MIGRATION,
  failed: FAILED_MIGRATION,
}
