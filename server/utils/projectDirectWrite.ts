// /server/utils/projectDirectWrite.ts
import type { Prisma } from '~/prisma/generated/prisma/client'
import { createDatabaseDirectConnection } from './databaseDirectProbe'

const projectWriteColumns = [
  'title',
  'slug',
  'description',
  'pitch',
  'flavorText',
  'goal',
  'status',
  'priority',
  'conductorSlug',
  'lastSyncedAt',
  'repoUrl',
  'liveUrl',
  'channelKey',
  'tabKey',
  'allowReviews',
  'highlightImage',
  'icon',
  'imagePath',
  'cardPath',
  'heroPath',
  'designer',
  'managerBotId',
  'artImageId',
  'artCollectionId',
  'isPublic',
  'isMature',
  'userId',
] as const satisfies readonly (keyof Prisma.ProjectUncheckedCreateInput)[]

const projectSelectColumns = [
  'id',
  'createdAt',
  'updatedAt',
  'title',
  'slug',
  'description',
  'pitch',
  'flavorText',
  'goal',
  'status',
  'priority',
  'conductorSlug',
  'repoUrl',
  'liveUrl',
  'channelKey',
  'tabKey',
  'lastSyncedAt',
  'allowReviews',
  'highlightImage',
  'icon',
  'imagePath',
  'cardPath',
  'heroPath',
  'designer',
  'creationSource',
  'userId',
  'managerBotId',
  'artImageId',
  'artCollectionId',
  'isPublic',
  'isMature',
  'isActive',
] as const

function databaseValue(value: unknown): unknown {
  return value === undefined ? null : value
}

function booleanValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export async function upsertProjectDirect(
  data: Prisma.ProjectUncheckedCreateInput,
  conductorSlug: string,
) {
  const connection = await createDatabaseDirectConnection()

  try {
    const quotedColumns = projectWriteColumns
      .map((column) => `\`${column}\``)
      .join(', ')
    const placeholders = projectWriteColumns.map(() => '?').join(', ')
    const updates = projectWriteColumns
      .map((column) => `\`${column}\` = VALUES(\`${column}\`)`)
      .join(', ')
    const values = projectWriteColumns.map((column) =>
      databaseValue(data[column]),
    )

    await connection.query(
      `INSERT INTO \`Project\` (${quotedColumns}) ` +
        `VALUES (${placeholders}) ` +
        `ON DUPLICATE KEY UPDATE ${updates}, ` +
        '`updatedAt` = CURRENT_TIMESTAMP(3)',
      values,
    )

    const selectedColumns = projectSelectColumns
      .map((column) => `\`${column}\``)
      .join(', ')
    const rows = (await connection.query(
      `SELECT ${selectedColumns} FROM \`Project\` ` +
        'WHERE `conductorSlug` = ? LIMIT 1',
      [conductorSlug],
    )) as Array<Record<string, unknown>>
    const project = rows[0]

    if (!project) {
      throw new Error(
        `Direct Project upsert completed but ${conductorSlug} was not found.`,
      )
    }

    return {
      ...project,
      allowReviews: booleanValue(project.allowReviews),
      isPublic: booleanValue(project.isPublic),
      isMature: booleanValue(project.isMature),
      isActive: booleanValue(project.isActive),
    }
  } finally {
    await connection.end().catch((disconnectError: unknown) => {
      console.warn('[project-sync:direct-mariadb-disconnect-failed]', {
        conductorSlug,
        message:
          disconnectError instanceof Error
            ? disconnectError.message
            : String(disconnectError),
      })
    })
  }
}
