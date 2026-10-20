import { realpath } from 'node:fs/promises'
import prisma from '~/server/utils/prisma'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import {
  quarantineConfinedArchiveFile,
  restoreConfinedArchiveFile,
} from '~/server/utils/artArchiveFileOps'

export type ArchiveEntryToQuarantine = {
  id: number
  relativePath: string
  artImageId: number | null
  isActive: boolean
  processState: 'PENDING' | 'IMPORTED' | 'ERROR' | 'MISSING'
}

export type ArchiveQuarantineResult = {
  alreadyQuarantined: boolean
  trashRelativePath: string | null
}

export async function quarantineArchiveEntry(
  entry: ArchiveEntryToQuarantine,
): Promise<ArchiveQuarantineResult> {
  if (!entry.isActive) {
    return {
      alreadyQuarantined: true,
      trashRelativePath: null,
    }
  }

  const resolvedRoot = await realpath(getArtArchiveRoot())
  const trashRelativePath =
    entry.processState === 'MISSING'
      ? null
      : await quarantineConfinedArchiveFile(
          resolvedRoot,
          entry.id,
          entry.relativePath,
        )

  await prisma.$transaction(async (tx) => {
    await tx.archiveEntry.update({
      where: { id: entry.id },
      data: {
        isActive: false,
        ...(trashRelativePath
          ? {
              relativePath: trashRelativePath,
              preQuarantineRelativePath: entry.relativePath,
            }
          : {}),
      },
    })

    if (entry.artImageId) {
      await tx.artImage.update({
        where: { id: entry.artImageId },
        data: { isActive: false },
      })
    }
  })

  return {
    alreadyQuarantined: false,
    trashRelativePath,
  }
}

export type ArchiveEntryToRestore = {
  id: number
  relativePath: string
  artImageId: number | null
  isActive: boolean
  preQuarantineRelativePath: string | null
}

export type ArchiveRestoreResult = {
  alreadyActive: boolean
  restoredRelativePath: string | null
}

/**
 * The exact inverse of quarantineArchiveEntry (art-archive/t-012): moves a
 * relocated file back to `preQuarantineRelativePath` (root-confined,
 * no-overwrite) before flipping the entry and its linked ArtImage back to
 * active. An entry quarantined while already MISSING never had a file moved,
 * so restoring it only needs the flag flip.
 */
export async function restoreArchiveEntry(
  entry: ArchiveEntryToRestore,
): Promise<ArchiveRestoreResult> {
  if (entry.isActive) {
    return { alreadyActive: true, restoredRelativePath: null }
  }

  let restoredRelativePath: string | null = null
  if (entry.preQuarantineRelativePath) {
    const resolvedRoot = await realpath(getArtArchiveRoot())
    await restoreConfinedArchiveFile(
      resolvedRoot,
      entry.relativePath,
      entry.preQuarantineRelativePath,
    )
    restoredRelativePath = entry.preQuarantineRelativePath
  }

  await prisma.$transaction(async (tx) => {
    await tx.archiveEntry.update({
      where: { id: entry.id },
      data: {
        isActive: true,
        ...(restoredRelativePath
          ? {
              relativePath: restoredRelativePath,
              preQuarantineRelativePath: null,
            }
          : {}),
      },
    })
    if (entry.artImageId) {
      await tx.artImage.update({
        where: { id: entry.artImageId },
        data: { isActive: true },
      })
    }
  })

  return { alreadyActive: false, restoredRelativePath }
}
