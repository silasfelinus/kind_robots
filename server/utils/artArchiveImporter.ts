import path from 'node:path'
import { createHash } from 'node:crypto'
import prisma from '~/server/utils/prisma'
import type { ScannedArchiveFile } from './artArchiveScanner'

export type ArchiveImportResult = {
  relativePath: string
  archiveEntryId: number
  artImageId: number
  collectionId: number
  createdImage: boolean
  createdCollection: boolean
}

function folderSlug(parentFolder: string): string {
  const key = parentFolder || '__root__'
  const digest = createHash('sha256').update(key).digest('hex').slice(0, 16)
  return `archive-folder-${digest}`
}

function folderLabel(parentFolder: string): string {
  if (!parentFolder) return 'Archive Root'
  return path.posix.basename(parentFolder) || parentFolder
}

function fileType(relativePath: string): string {
  return path.posix.extname(relativePath).replace(/^\./, '').toLowerCase() || 'png'
}

function generationFields(file: ScannedArchiveFile) {
  if (!file.metadata.supported || file.metadata.format !== 'png') return {}
  const source = file.metadata.a1111 ?? file.metadata.comfy
  if (!source) return {}
  return {
    promptString: 'prompt' in source ? source.prompt : source.positivePrompt,
    negativePrompt: source.negativePrompt,
    seed: source.seed,
    cfg: source.cfg,
    sampler: source.sampler,
    steps: source.steps,
    checkpoint: source.checkpoint,
  }
}

/**
 * Reconcile one scanner result into the durable archive ledger and Kind Robots art models.
 * This never moves or deletes source bytes. Archive privacy is an invariant, not inferred
 * from generation Resources: every pass forces both the ArtImage and folder collection to
 * private + mature.
 */
export async function importArchiveFile(
  file: ScannedArchiveFile,
  userId: number,
): Promise<ArchiveImportResult> {
  return prisma.$transaction(async (tx) => {
    const slug = folderSlug(file.parentFolder)
    let collection = await tx.artCollection.findUnique({ where: { slug }, select: { id: true } })
    let createdCollection = false

    if (!collection) {
      collection = await tx.artCollection.create({
        data: {
          slug,
          label: folderLabel(file.parentFolder),
          parentFolder: file.parentFolder || null,
          description: `Private legacy archive folder: ${file.parentFolder || '/'}`,
          userId,
          isPublic: false,
          isMature: true,
          isActive: true,
        },
        select: { id: true },
      })
      createdCollection = true
    } else {
      await tx.artCollection.update({
        where: { id: collection.id },
        data: { isPublic: false, isMature: true, isActive: true },
      })
    }

    const existingEntry = await tx.archiveEntry.findUnique({
      where: { relativePath: file.relativePath },
      select: { id: true, artImageId: true },
    })

    let artImageId = existingEntry?.artImageId ?? null
    let createdImage = false
    if (artImageId) {
      const existingImage = await tx.artImage.findUnique({ where: { id: artImageId }, select: { id: true } })
      if (!existingImage) artImageId = null
    }

    if (!artImageId) {
      const image = await tx.artImage.create({
        data: {
          userId,
          fileName: path.posix.basename(file.relativePath).slice(0, 764),
          fileType: fileType(file.relativePath),
          path: file.relativePath.slice(0, 764),
          isPublic: false,
          isMature: true,
          isActive: true,
          designer: 'art-archive',
          ...generationFields(file),
        },
        select: { id: true },
      })
      artImageId = image.id
      createdImage = true
    } else {
      await tx.artImage.update({
        where: { id: artImageId },
        data: {
          isPublic: false,
          isMature: true,
          isActive: true,
          path: file.relativePath.slice(0, 764),
          fileName: path.posix.basename(file.relativePath).slice(0, 764),
          fileType: fileType(file.relativePath),
        },
      })
    }

    await tx.artCollection.update({
      where: { id: collection.id },
      data: { ArtImages: { connect: { id: artImageId } } },
    })

    const entryData = {
      contentHash: file.contentHash,
      parentFolder: file.parentFolder || null,
      fileSize: file.fileSize,
      fileMtime: file.fileMtime,
      artImageId,
      folderCollectionId: collection.id,
      processState: 'IMPORTED' as const,
      extractedMetadata: JSON.stringify(file.metadata),
      isActive: true,
    }

    const archiveEntry = existingEntry
      ? await tx.archiveEntry.update({ where: { id: existingEntry.id }, data: entryData, select: { id: true } })
      : await tx.archiveEntry.create({ data: { relativePath: file.relativePath, ...entryData }, select: { id: true } })

    return {
      relativePath: file.relativePath,
      archiveEntryId: archiveEntry.id,
      artImageId,
      collectionId: collection.id,
      createdImage,
      createdCollection,
    }
  })
}

export async function importArchiveScan(files: ScannedArchiveFile[], userId: number) {
  const results: ArchiveImportResult[] = []
  for (const file of files) results.push(await importArchiveFile(file, userId))
  return results
}
