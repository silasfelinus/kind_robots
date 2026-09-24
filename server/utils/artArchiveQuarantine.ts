import { realpath } from 'node:fs/promises'
import prisma from '~/server/utils/prisma'
import { getArtArchiveRoot } from '~/server/utils/artArchiveRoot'
import { quarantineConfinedArchiveFile } from '~/server/utils/artArchiveFileOps'

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
