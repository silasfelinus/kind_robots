import { createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import type { EntityArtMetadata } from '~/server/utils/entityArt'

type ArtCollectionDb = Pick<
  Prisma.TransactionClient,
  'artCollection' | 'artImage' | 'dream' | 'facet' | 'project' | 'user'
>

type CollectionIdInput = {
  artCollectionId?: number | null
  artCollectionIds?: number[] | null
}

function asArtCollectionDb(db: unknown): ArtCollectionDb {
  return db as ArtCollectionDb
}

function positiveId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function normalizeRequestedArtCollectionIds(
  input: CollectionIdInput | null | undefined,
): number[] {
  const ids: number[] = []

  if (input?.artCollectionId != null) {
    const id = positiveId(input.artCollectionId)
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'artCollectionId must be a positive integer.',
      })
    }
    ids.push(id)
  }

  if (input?.artCollectionIds != null) {
    if (!Array.isArray(input.artCollectionIds)) {
      throw createError({
        statusCode: 400,
        message: 'artCollectionIds must be an array of positive integers.',
      })
    }

    for (const rawId of input.artCollectionIds) {
      const id = positiveId(rawId)
      if (!id) {
        throw createError({
          statusCode: 400,
          message: 'artCollectionIds must contain only positive integers.',
        })
      }
      ids.push(id)
    }
  }

  return [...new Set(ids)]
}

export async function assertOwnedActiveArtCollectionIds(
  db: unknown,
  ids: number[],
  userId: number,
): Promise<number[]> {
  if (!ids.length) return []

  const database = asArtCollectionDb(db)
  const rows = await database.artCollection.findMany({
    where: {
      id: { in: ids },
      userId,
      isActive: true,
    },
    select: { id: true },
  })
  const found = new Set(rows.map((row) => row.id))
  const invalid = ids.filter((id) => !found.has(id))

  if (invalid.length) {
    throw createError({
      statusCode: 400,
      message: `ArtCollection ${invalid.join(', ')} does not exist, is inactive, or is not owned by this user.`,
    })
  }

  return ids
}

async function generatedCollectionLabel(
  db: ArtCollectionDb,
  userId: number,
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true },
  })
  const username = user?.username?.trim()
  return username ? `${username}'s Art` : 'Generated Art'
}

export async function ensureGeneratedArtCollectionId(
  db: unknown,
  userId: number,
): Promise<number> {
  const database = asArtCollectionDb(db)
  const preferredLabel = await generatedCollectionLabel(database, userId)
  const labels = [...new Set([preferredLabel, 'Generated Art'])]
  const existing = await database.artCollection.findFirst({
    where: {
      userId,
      isActive: true,
      label: { in: labels },
    },
    orderBy: { id: 'asc' },
    select: { id: true },
  })

  if (existing) return existing.id

  const slug = `generated-art-u${userId}`
  const collision = await database.artCollection.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  })

  if (collision && collision.userId !== userId) {
    throw createError({
      statusCode: 409,
      message: `Generated Art collection key ${slug} is already owned by another user.`,
    })
  }

  const collection = await database.artCollection.upsert({
    where: { slug },
    update: {
      isActive: true,
    },
    create: {
      label: preferredLabel,
      slug,
      userId,
      isPublic: false,
      isMature: false,
      isActive: true,
      description: 'Automatically collected generated artwork.',
    },
    select: { id: true },
  })

  return collection.id
}

function collectPrimaryIds(
  rows: Array<{ artCollectionId: number | null }>,
): number[] {
  return rows.flatMap((row) =>
    row.artCollectionId ? [row.artCollectionId] : [],
  )
}

async function resolveDreamContextCollectionIds(
  db: ArtCollectionDb,
  metadata: EntityArtMetadata,
): Promise<number[]> {
  if (metadata.entityType === 'dream') {
    const dream = await db.dream.findUnique({
      where: { id: metadata.entityId },
      select: { artCollectionId: true },
    })
    return dream?.artCollectionId ? [dream.artCollectionId] : []
  }

  if (metadata.entityType === 'character') {
    return collectPrimaryIds(
      await db.dream.findMany({
        where: {
          artCollectionId: { not: null },
          Characters: { some: { id: metadata.entityId } },
        },
        select: { artCollectionId: true },
      }),
    )
  }

  if (metadata.entityType === 'reward') {
    return collectPrimaryIds(
      await db.dream.findMany({
        where: {
          artCollectionId: { not: null },
          Rewards: { some: { id: metadata.entityId } },
        },
        select: { artCollectionId: true },
      }),
    )
  }

  if (metadata.entityType === 'scenario') {
    return collectPrimaryIds(
      await db.dream.findMany({
        where: {
          artCollectionId: { not: null },
          Scenarios: { some: { id: metadata.entityId } },
        },
        select: { artCollectionId: true },
      }),
    )
  }

  if (metadata.entityType === 'bot') {
    return collectPrimaryIds(
      await db.dream.findMany({
        where: {
          artCollectionId: { not: null },
          OR: [
            { narratorId: metadata.entityId },
            { Bots: { some: { id: metadata.entityId } } },
          ],
        },
        select: { artCollectionId: true },
      }),
    )
  }

  return []
}

async function resolveEntityPrimaryCollectionIds(
  db: ArtCollectionDb,
  metadata: EntityArtMetadata | null,
): Promise<number[]> {
  if (!metadata) return []

  if (metadata.entityType === 'project') {
    const project = await db.project.findUnique({
      where: { id: metadata.entityId },
      select: { artCollectionId: true },
    })
    return project?.artCollectionId ? [project.artCollectionId] : []
  }

  if (metadata.entityType === 'facet') {
    const facet = await db.facet.findUnique({
      where: { id: metadata.entityId },
      select: { artCollectionId: true },
    })
    return facet?.artCollectionId ? [facet.artCollectionId] : []
  }

  return resolveDreamContextCollectionIds(db, metadata)
}

export async function attachCompletedArtImageToCollections(
  db: unknown,
  input: {
    artImageId: number
    userId: number
    requestedCollectionIds?: number[]
    entityArt?: EntityArtMetadata | null
  },
): Promise<number[]> {
  const database = asArtCollectionDb(db)
  const generatedCollectionId = await ensureGeneratedArtCollectionId(
    database,
    input.userId,
  )

  const requestedRows = input.requestedCollectionIds?.length
    ? await database.artCollection.findMany({
        where: {
          id: { in: input.requestedCollectionIds },
          userId: input.userId,
          isActive: true,
        },
        select: { id: true },
      })
    : []
  const entityCollectionIds = await resolveEntityPrimaryCollectionIds(
    database,
    input.entityArt ?? null,
  )
  const entityRows = entityCollectionIds.length
    ? await database.artCollection.findMany({
        where: {
          id: { in: entityCollectionIds },
          userId: input.userId,
          isActive: true,
        },
        select: { id: true },
      })
    : []
  const collectionIds = [
    generatedCollectionId,
    ...requestedRows.map((row) => row.id),
    ...entityRows.map((row) => row.id),
  ]
  const uniqueIds = [...new Set(collectionIds)]

  await database.artImage.update({
    where: { id: input.artImageId },
    data: {
      ArtCollections: {
        connect: uniqueIds.map((id) => ({ id })),
      },
    },
  })

  return uniqueIds
}
