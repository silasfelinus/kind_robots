// /server/utils/artArchiveMove.ts
//
// One admin-initiated ArchiveEntry relocation (art-archive/t-009), shared by
// the single-entry move route and the Butterfly Gallery's batch folder move:
// the real file moves under the archive root first (root-confined,
// no-overwrite -- artArchiveFileOps.ts), then the ledger, the ArtImage path,
// and the folder-derived ArtCollection membership follow it in one
// transaction, so the database always describes where the bytes really are.
import path from 'node:path'
import { realpath, stat } from 'node:fs/promises'
import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import {
  archiveFolderMoveTarget,
  moveConfinedArchiveFile,
  resolveConfinedTargetPath,
} from '~/server/utils/artArchiveFileOps'
import { ensureFolderCollection } from '~/server/utils/artArchiveImporter'
import { toArchiveCollectionRef } from '~/server/utils/artArchiveCollectionRefs'

export type MovedArchiveEntry = {
  id: number
  relativePath: string
  parentFolder: string | null
  folderCollection: { id: number; slug: string; label: string } | null
}

function toPosixRelative(root: string, absolute: string): string {
  return path.relative(root, absolute).split(path.sep).join('/')
}

async function pathExists(absolute: string): Promise<boolean> {
  try {
    await stat(absolute)
    return true
  } catch {
    return false
  }
}

async function loadMovableEntry(id: number) {
  const entry = await prisma.archiveEntry.findUnique({
    where: { id },
    select: {
      id: true,
      relativePath: true,
      artImageId: true,
      folderCollectionId: true,
      isActive: true,
      processState: true,
    },
  })
  if (!entry)
    throw createError({
      statusCode: 404,
      message: `Archive entry #${id} not found.`,
    })
  if (!entry.isActive || entry.processState === 'MISSING') {
    throw createError({
      statusCode: 400,
      message: 'Cannot move an inactive or missing archive entry.',
    })
  }
  return entry
}

export async function moveArchiveEntry(
  id: number,
  newRelativePath: string,
  userId: number,
): Promise<MovedArchiveEntry> {
  const entry = await loadMovableEntry(id)
  const resolvedRoot = await realpath(getArtArchiveRoot())
  await moveConfinedArchiveFile(
    resolvedRoot,
    entry.relativePath,
    newRelativePath,
  )

  const finalAbsolute = await realpath(
    path.resolve(resolvedRoot, newRelativePath),
  )
  const finalRelativePath = toPosixRelative(resolvedRoot, finalAbsolute)
  const parentFolder = path.posix.dirname(finalRelativePath)
  const normalizedParentFolder = parentFolder === '.' ? '' : parentFolder

  const updated = await prisma.$transaction(async (tx) => {
    const collection = await ensureFolderCollection(
      tx,
      normalizedParentFolder,
      userId,
    )

    if (entry.artImageId) {
      await tx.artImage.update({
        where: { id: entry.artImageId },
        data: {
          path: finalRelativePath.slice(0, 764),
          fileName: path.posix.basename(finalRelativePath).slice(0, 764),
        },
      })
      if (
        entry.folderCollectionId &&
        entry.folderCollectionId !== collection.id
      ) {
        await tx.artCollection.update({
          where: { id: entry.folderCollectionId },
          data: { ArtImages: { disconnect: { id: entry.artImageId } } },
        })
      }
      await tx.artCollection.update({
        where: { id: collection.id },
        data: { ArtImages: { connect: { id: entry.artImageId } } },
      })
    }

    const row = await tx.archiveEntry.update({
      where: { id },
      data: {
        relativePath: finalRelativePath,
        parentFolder: normalizedParentFolder || null,
        folderCollectionId: collection.id,
      },
      select: { id: true, relativePath: true, parentFolder: true },
    })
    const folderCollection = await tx.artCollection.findUnique({
      where: { id: collection.id },
      select: { id: true, slug: true, label: true },
    })
    return { ...row, folderCollection }
  })

  return {
    id: updated.id,
    relativePath: updated.relativePath,
    parentFolder: updated.parentFolder,
    folderCollection: updated.folderCollection
      ? toArchiveCollectionRef(updated.folderCollection)
      : null,
  }
}

/**
 * Moves an entry into `folder` (already normalized by
 * normalizeArchiveFolderInput), keeping its file name unless that name is
 * taken there. A move into the folder it already lives in is a no-op that
 * still reports the entry's current location.
 */
export async function moveArchiveEntryToFolder(
  id: number,
  folder: string,
  userId: number,
): Promise<MovedArchiveEntry> {
  const entry = await loadMovableEntry(id)
  const currentFolder = path.posix.dirname(entry.relativePath)
  if ((currentFolder === '.' ? '' : currentFolder) === folder) {
    const row = await prisma.archiveEntry.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        relativePath: true,
        parentFolder: true,
        folderCollectionId: true,
      },
    })
    const folderCollection = row.folderCollectionId
      ? await prisma.artCollection.findUnique({
          where: { id: row.folderCollectionId },
          select: { id: true, slug: true, label: true },
        })
      : null
    return {
      id: row.id,
      relativePath: row.relativePath,
      parentFolder: row.parentFolder,
      folderCollection: folderCollection
        ? toArchiveCollectionRef(folderCollection)
        : null,
    }
  }

  const resolvedRoot = await realpath(getArtArchiveRoot())
  let target = archiveFolderMoveTarget(folder, entry.relativePath, id)
  if (await pathExists(await resolveConfinedTargetPath(resolvedRoot, target)))
    target = archiveFolderMoveTarget(folder, entry.relativePath, id, true)
  return moveArchiveEntry(id, target, userId)
}
