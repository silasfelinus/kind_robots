// /server/utils/artRecycleBin.ts
//
// The Gallery's Recycle Bin. Deleting an image or a collection (folder) is a
// move into the bin, never an erase: the row is marked isActive = false, the
// schema's soft-delete convention, and every gallery query already filters on
// it. Archive-backed images go through quarantineArchiveEntry so their file
// also moves into the archive's reserved trash subtree.
//
// The bin is a virtual collection, like Unsorted, rather than a real
// ArtCollection or Tag: images belong to many collections at once, so a
// "Recycle Bin" membership could not say which of them the image was deleted
// from, while the isActive flag is already honored by every listing.
//
// Inside the bin there are exactly two ways out: restore (flip back, moving
// archive files home) or purge ("Delete forever"). Purge only accepts rows
// already in the bin, so nothing is ever erased in one click from the
// gallery itself.
import { realpath } from 'node:fs/promises'
import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import {
  ARCHIVE_TRASH_FOLDER,
  purgeQuarantinedArchiveFile,
} from '~/server/utils/artArchiveFileOps'
import {
  quarantineArchiveEntry,
  restoreArchiveEntry,
} from '~/server/utils/artArchiveQuarantine'

export type RecycleBinActor = {
  id: number
  isAdmin: boolean
}

export type RecycleBinOutcome = {
  id: number
  message: string
}

function assertMayModify(
  actor: RecycleBinActor,
  ownerId: number | null,
  noun: string,
): void {
  if (!actor.isAdmin && ownerId !== actor.id) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to change this ${noun}.`,
    })
  }
}

function archiveOnlyForAdmin(actor: RecycleBinActor): void {
  if (!actor.isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Only an admin can delete or restore an imported archive image.',
    })
  }
}

async function findArtImageOwner(imageId: number) {
  const image = await prisma.artImage.findUnique({
    where: { id: imageId },
    select: { id: true, userId: true, isActive: true },
  })
  if (!image) {
    throw createError({
      statusCode: 404,
      message: `Art image with ID ${imageId} does not exist.`,
    })
  }
  return image
}

async function findArtCollectionOwner(collectionId: number) {
  const collection = await prisma.artCollection.findUnique({
    where: { id: collectionId },
    select: { id: true, userId: true, isActive: true },
  })
  if (!collection) {
    throw createError({
      statusCode: 404,
      message: `Collection with ID ${collectionId} does not exist.`,
    })
  }
  return collection
}

async function binImage(
  imageId: number,
  actor: RecycleBinActor,
): Promise<string> {
  const archiveEntry = await prisma.archiveEntry.findFirst({
    where: { artImageId: imageId, isActive: true },
    select: {
      id: true,
      relativePath: true,
      artImageId: true,
      isActive: true,
      processState: true,
    },
  })
  if (archiveEntry) {
    archiveOnlyForAdmin(actor)
    await quarantineArchiveEntry(archiveEntry)
    return `Art image ${imageId} moved to the Recycle Bin (archive file quarantined).`
  }

  await prisma.artImage.update({
    where: { id: imageId },
    data: { isActive: false },
  })
  return `Art image ${imageId} moved to the Recycle Bin.`
}

export async function recycleArtImage(
  imageId: number,
  actor: RecycleBinActor,
): Promise<RecycleBinOutcome> {
  const image = await findArtImageOwner(imageId)
  assertMayModify(actor, image.userId, 'art image')
  if (!image.isActive) {
    return {
      id: imageId,
      message: `Art image ${imageId} is already in the Recycle Bin.`,
    }
  }
  return { id: imageId, message: await binImage(imageId, actor) }
}

export async function restoreArtImage(
  imageId: number,
  actor: RecycleBinActor,
): Promise<RecycleBinOutcome> {
  const image = await findArtImageOwner(imageId)
  assertMayModify(actor, image.userId, 'art image')
  if (image.isActive) {
    return { id: imageId, message: `Art image ${imageId} is not in the bin.` }
  }

  const archiveEntry = await prisma.archiveEntry.findFirst({
    where: { artImageId: imageId, isActive: false },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      relativePath: true,
      artImageId: true,
      isActive: true,
      preQuarantineRelativePath: true,
    },
  })
  if (archiveEntry) {
    archiveOnlyForAdmin(actor)
    await restoreArchiveEntry(archiveEntry)
  } else {
    await prisma.artImage.update({
      where: { id: imageId },
      data: { isActive: true },
    })
  }
  return { id: imageId, message: `Art image ${imageId} restored.` }
}

export async function purgeArtImage(
  imageId: number,
  actor: RecycleBinActor,
): Promise<RecycleBinOutcome> {
  const image = await findArtImageOwner(imageId)
  assertMayModify(actor, image.userId, 'art image')
  if (image.isActive) {
    throw createError({
      statusCode: 409,
      message: `Art image ${imageId} must be in the Recycle Bin before it can be deleted forever.`,
    })
  }

  const archiveEntries = await prisma.archiveEntry.findMany({
    where: { artImageId: imageId },
    select: { id: true, relativePath: true, isActive: true },
  })
  if (archiveEntries.length) {
    archiveOnlyForAdmin(actor)
    if (archiveEntries.some((entry) => entry.isActive)) {
      throw createError({
        statusCode: 409,
        message: `Art image ${imageId} still has a live archive file; move it to the Recycle Bin first.`,
      })
    }
    const resolvedRoot = await realpath(getArtArchiveRoot())
    for (const entry of archiveEntries) {
      if (entry.relativePath.startsWith(`${ARCHIVE_TRASH_FOLDER}/`)) {
        await purgeQuarantinedArchiveFile(resolvedRoot, entry.relativePath)
      }
    }
    // The ledger row stays as provenance for what was purged and when; it
    // just no longer points at an image or a file.
    await prisma.archiveEntry.updateMany({
      where: { id: { in: archiveEntries.map((entry) => entry.id) } },
      data: {
        artImageId: null,
        processState: 'MISSING',
        preQuarantineRelativePath: null,
      },
    })
  }

  await prisma.artImage.delete({ where: { id: imageId } })
  return { id: imageId, message: `Art image ${imageId} deleted forever.` }
}

export async function recycleArtCollection(
  collectionId: number,
  actor: RecycleBinActor,
): Promise<RecycleBinOutcome> {
  const collection = await findArtCollectionOwner(collectionId)
  assertMayModify(actor, collection.userId, 'collection')
  if (!collection.isActive) {
    return {
      id: collectionId,
      message: `Collection ${collectionId} is already in the Recycle Bin.`,
    }
  }
  await prisma.artCollection.update({
    where: { id: collectionId },
    data: { isActive: false },
  })
  return {
    id: collectionId,
    message: `Collection ${collectionId} moved to the Recycle Bin.`,
  }
}

export async function restoreArtCollection(
  collectionId: number,
  actor: RecycleBinActor,
): Promise<RecycleBinOutcome> {
  const collection = await findArtCollectionOwner(collectionId)
  assertMayModify(actor, collection.userId, 'collection')
  if (!collection.isActive) {
    await prisma.artCollection.update({
      where: { id: collectionId },
      data: { isActive: true },
    })
  }
  return { id: collectionId, message: `Collection ${collectionId} restored.` }
}

/**
 * Deleting a folder forever removes the folder itself. Images that lived only
 * in it are not erased with it: the ones this actor may modify move into the
 * bin as loose images, where each needs its own Delete forever. Images that
 * also belong to another live collection simply lose this membership.
 */
export async function purgeArtCollection(
  collectionId: number,
  actor: RecycleBinActor,
): Promise<RecycleBinOutcome & { binnedImageCount: number }> {
  const collection = await findArtCollectionOwner(collectionId)
  assertMayModify(actor, collection.userId, 'collection')
  if (collection.isActive) {
    throw createError({
      statusCode: 409,
      message: `Collection ${collectionId} must be in the Recycle Bin before it can be deleted forever.`,
    })
  }

  const orphaned = await prisma.artImage.findMany({
    where: {
      isActive: true,
      ArtCollections: {
        some: { id: collectionId },
        none: { id: { not: collectionId }, isActive: true },
      },
      ...(actor.isAdmin ? {} : { userId: actor.id }),
    },
    select: { id: true },
  })

  let binnedImageCount = 0
  for (const image of orphaned) {
    await binImage(image.id, actor).then(
      () => {
        binnedImageCount += 1
      },
      (error: unknown) => {
        if ((error as { statusCode?: number })?.statusCode !== 403) throw error
      },
    )
  }

  await prisma.artCollection.delete({ where: { id: collectionId } })
  return {
    id: collectionId,
    binnedImageCount,
    message: binnedImageCount
      ? `Collection ${collectionId} deleted forever; ${binnedImageCount} of its images moved to the Recycle Bin.`
      : `Collection ${collectionId} deleted forever.`,
  }
}
