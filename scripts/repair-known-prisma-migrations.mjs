// /scripts/repair-known-prisma-migrations.mjs

const REACTION_AUTHOR_MIGRATION =
  '20260719031500_reaction_first_party_author_expand'

function rows(result) {
  return Array.isArray(result) ? result : []
}

async function currentDatabase(connection) {
  const result = rows(await connection.query('SELECT DATABASE() AS databaseName'))
  const databaseName = result[0]?.databaseName
  if (typeof databaseName !== 'string' || !databaseName) {
    throw new Error('[database repair] Could not resolve the active database name.')
  }
  return databaseName
}

async function failedMigrationExists(connection, migrationName) {
  try {
    const result = rows(
      await connection.query(
        `SELECT migration_name
           FROM _prisma_migrations
          WHERE migration_name = ?
            AND finished_at IS NULL
            AND rolled_back_at IS NULL
          LIMIT 1`,
        [migrationName],
      ),
    )
    return result.length > 0
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return false
    throw error
  }
}

async function columnDefinition(connection, databaseName, columnName) {
  const result = rows(
    await connection.query(
      `SELECT DATA_TYPE AS dataType, IS_NULLABLE AS isNullable
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'Reaction'
          AND COLUMN_NAME = ?
        LIMIT 1`,
      [databaseName, columnName],
    ),
  )
  return result[0] || null
}

async function indexExists(connection, databaseName, indexName) {
  const result = rows(
    await connection.query(
      `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'Reaction'
          AND INDEX_NAME = ?
        LIMIT 1`,
      [databaseName, indexName],
    ),
  )
  return result.length > 0
}

async function foreignKeyExists(connection, databaseName, constraintName) {
  const result = rows(
    await connection.query(
      `SELECT CONSTRAINT_NAME
         FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'Reaction'
          AND CONSTRAINT_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
        LIMIT 1`,
      [databaseName, constraintName],
    ),
  )
  return result.length > 0
}

async function checkConstraintExists(connection, databaseName, constraintName) {
  const result = rows(
    await connection.query(
      `SELECT CONSTRAINT_NAME
         FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = ?
          AND TABLE_NAME = 'Reaction'
          AND CONSTRAINT_NAME = ?
          AND CONSTRAINT_TYPE = 'CHECK'
        LIMIT 1`,
      [databaseName, constraintName],
    ),
  )
  return result.length > 0
}

async function assertNullableIntegerColumn(connection, databaseName, columnName) {
  const definition = await columnDefinition(connection, databaseName, columnName)
  if (!definition) {
    await connection.query(
      `ALTER TABLE \`Reaction\` ADD COLUMN \`${columnName}\` INTEGER NULL`,
    )
    return
  }

  if (definition.dataType !== 'int' || definition.isNullable !== 'YES') {
    throw new Error(
      `[database repair] Reaction.${columnName} exists with an unexpected definition; refusing automatic repair.`,
    )
  }
}

async function ensureIndex(connection, databaseName, indexName, columnName) {
  if (await indexExists(connection, databaseName, indexName)) return
  await connection.query(
    `CREATE INDEX \`${indexName}\` ON \`Reaction\`(\`${columnName}\`)`,
  )
}

async function ensureForeignKey(
  connection,
  databaseName,
  constraintName,
  columnName,
  referencedTable,
) {
  if (await foreignKeyExists(connection, databaseName, constraintName)) return
  await connection.query(
    `ALTER TABLE \`Reaction\`
       ADD CONSTRAINT \`${constraintName}\`
       FOREIGN KEY (\`${columnName}\`) REFERENCES \`${referencedTable}\`(\`id\`)
       ON DELETE SET NULL ON UPDATE CASCADE`,
  )
}

async function assertSafeAuthorRows(connection) {
  const result = rows(
    await connection.query(
      `SELECT
         SUM(authorBotId IS NOT NULL AND authorCharacterId IS NOT NULL) AS dualAuthors,
         SUM(authorBotId IS NOT NULL AND b.id IS NULL) AS missingBots,
         SUM(authorCharacterId IS NOT NULL AND c.id IS NULL) AS missingCharacters
       FROM \`Reaction\` r
       LEFT JOIN \`Bot\` b ON b.id = r.authorBotId
       LEFT JOIN \`Character\` c ON c.id = r.authorCharacterId`,
    ),
  )
  const counts = result[0] || {}
  const unsafe = [counts.dualAuthors, counts.missingBots, counts.missingCharacters].some(
    (value) => Number(value || 0) > 0,
  )
  if (unsafe) {
    throw new Error(
      '[database repair] Existing Reaction author data violates the intended foreign-key or single-author invariants; refusing automatic repair.',
    )
  }
}

async function repairReactionAuthorMigration(connection, databaseName) {
  console.warn(
    `[database repair] Found failed ${REACTION_AUTHOR_MIGRATION}; reconciling its expand-only schema state.`,
  )

  await assertNullableIntegerColumn(connection, databaseName, 'authorBotId')
  await assertNullableIntegerColumn(connection, databaseName, 'authorCharacterId')
  await ensureIndex(
    connection,
    databaseName,
    'Reaction_authorBotId_idx',
    'authorBotId',
  )
  await ensureIndex(
    connection,
    databaseName,
    'Reaction_authorCharacterId_idx',
    'authorCharacterId',
  )

  if (
    await checkConstraintExists(
      connection,
      databaseName,
      'Reaction_firstPartyAuthor_check',
    )
  ) {
    await connection.query(
      'ALTER TABLE `Reaction` DROP CONSTRAINT `Reaction_firstPartyAuthor_check`',
    )
  }

  await assertSafeAuthorRows(connection)
  await ensureForeignKey(
    connection,
    databaseName,
    'Reaction_authorBotId_fkey',
    'authorBotId',
    'Bot',
  )
  await ensureForeignKey(
    connection,
    databaseName,
    'Reaction_authorCharacterId_fkey',
    'authorCharacterId',
    'Character',
  )

  const requiredState = await Promise.all([
    columnDefinition(connection, databaseName, 'authorBotId'),
    columnDefinition(connection, databaseName, 'authorCharacterId'),
    indexExists(connection, databaseName, 'Reaction_authorBotId_idx'),
    indexExists(connection, databaseName, 'Reaction_authorCharacterId_idx'),
    foreignKeyExists(connection, databaseName, 'Reaction_authorBotId_fkey'),
    foreignKeyExists(connection, databaseName, 'Reaction_authorCharacterId_fkey'),
  ])
  if (requiredState.some((value) => !value)) {
    throw new Error(
      `[database repair] ${REACTION_AUTHOR_MIGRATION} schema verification failed; migration history was not changed.`,
    )
  }
}

export async function repairKnownFailedMigrations({
  connection,
  prismaUrl,
  runPrismaCommand,
}) {
  if (
    !(await failedMigrationExists(connection, REACTION_AUTHOR_MIGRATION))
  ) {
    return { repaired: [] }
  }

  const databaseName = await currentDatabase(connection)
  await repairReactionAuthorMigration(connection, databaseName)
  await runPrismaCommand(prismaUrl, [
    'migrate',
    'resolve',
    '--applied',
    REACTION_AUTHOR_MIGRATION,
  ])

  console.log(
    `[database repair] Marked ${REACTION_AUTHOR_MIGRATION} applied after verifying its complete fixed schema state.`,
  )
  return { repaired: [REACTION_AUTHOR_MIGRATION] }
}

export const knownFailedMigrationNames = [REACTION_AUTHOR_MIGRATION]
