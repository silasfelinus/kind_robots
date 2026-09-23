import path from 'node:path'
import { createHash } from 'node:crypto'
import prisma from '~/server/utils/prisma'
import { narrowToPngMetadata } from './artArchiveMetadata'
import { classifyIntColumnValue, intColumnOrNull } from './artArchiveIntColumns'
import type { IntColumnFault } from './artArchiveIntColumns'
import type { ScannedArchiveFile } from './artArchiveScanner'

export type ArchiveImportResult = {
  relativePath: string
  archiveEntryId: number
  artImageId: number
  collectionId: number
  createdImage: boolean
  createdCollection: boolean
  /**
   * Generation values this file carried that its ArtImage column cannot hold.
   * The true value rides along: "250 seeds were too big" and "the biggest was
   * 1,049,274,193,847,562" are different findings -- the first is consistent
   * with 32-bit A1111 seeds, the second says the archive is ComfyUI and a
   * BigInt column would not be optional.
   */
  droppedValues: DroppedColumnValue[]
}

export type DroppedColumnValue = {
  field: string
  fault: IntColumnFault
  value: number
}

type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

export function folderSlug(parentFolder: string): string {
  const key = parentFolder || '__root__'
  const digest = createHash('sha256').update(key).digest('hex').slice(0, 16)
  return `archive-folder-${digest}`
}

export function folderLabel(parentFolder: string): string {
  if (!parentFolder) return 'Archive Root'
  return path.posix.basename(parentFolder) || parentFolder
}

/**
 * Finds or creates the private+mature folder ArtCollection for
 * `parentFolder`, forcing privacy invariants on every call (matching
 * importArchiveFile's own behavior) -- shared by the importer and by
 * admin-initiated moves (art-archive/t-009) so a file relocated into a new
 * folder gets the identical collection identity a normal import would give
 * it, rather than a second, slightly different code path drifting from it.
 */
export async function ensureFolderCollection(
  tx: TransactionClient,
  parentFolder: string,
  userId: number,
): Promise<{ id: number; created: boolean }> {
  const slug = folderSlug(parentFolder)
  const existing = await tx.artCollection.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (existing) {
    await tx.artCollection.update({
      where: { id: existing.id },
      data: { isPublic: false, isMature: true, isActive: true },
    })
    return { id: existing.id, created: false }
  }

  const created = await tx.artCollection.create({
    data: {
      slug,
      label: folderLabel(parentFolder),
      parentFolder: parentFolder || null,
      description: `Private legacy archive folder: ${parentFolder || '/'}`,
      userId,
      isPublic: false,
      isMature: true,
      isActive: true,
    },
    select: { id: true },
  })
  return { id: created.id, created: true }
}

function fileType(relativePath: string): string {
  return (
    path.posix.extname(relativePath).replace(/^\./, '').toLowerCase() || 'png'
  )
}

// Range rules and the reasoning behind dropping rather than clamping live in
// artArchiveIntColumns.ts.
function generationFields(file: ScannedArchiveFile): {
  fields: Record<string, unknown>
  droppedValues: DroppedColumnValue[]
} {
  const png = narrowToPngMetadata(file.metadata)
  if (!png) return { fields: {}, droppedValues: [] }
  const source = png.a1111 ?? png.comfy
  if (!source) return { fields: {}, droppedValues: [] }

  const droppedValues: DroppedColumnValue[] = []
  const intField = (name: string, raw: unknown): number | null => {
    // An absent field is not a loss; only a present-but-unusable one is.
    const fault = classifyIntColumnValue(raw)
    if (fault) droppedValues.push({ field: name, fault, value: raw as number })
    return intColumnOrNull(raw)
  }

  return {
    droppedValues,
    fields: {
      promptString: 'prompt' in source ? source.prompt : source.positivePrompt,
      negativePrompt: source.negativePrompt,
      seed: intField('seed', source.seed),
      cfg: intField('cfg', source.cfg),
      sampler: source.sampler,
      steps: intField('steps', source.steps),
      checkpoint: source.checkpoint,
    },
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
    const collection = await ensureFolderCollection(
      tx,
      file.parentFolder,
      userId,
    )
    const createdCollection = collection.created

    const existingEntry = await tx.archiveEntry.findUnique({
      where: { relativePath: file.relativePath },
      select: { id: true, artImageId: true },
    })

    const generation = generationFields(file)
    let artImageId = existingEntry?.artImageId ?? null
    let createdImage = false
    if (artImageId) {
      const existingImage = await tx.artImage.findUnique({
        where: { id: artImageId },
        select: { id: true },
      })
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
          ...generation.fields,
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
      ? await tx.archiveEntry.update({
          where: { id: existingEntry.id },
          data: entryData,
          select: { id: true },
        })
      : await tx.archiveEntry.create({
          data: { relativePath: file.relativePath, ...entryData },
          select: { id: true },
        })

    return {
      relativePath: file.relativePath,
      archiveEntryId: archiveEntry.id,
      artImageId,
      collectionId: collection.id,
      droppedValues: generation.droppedValues,
      createdImage,
      createdCollection,
    }
  })
}

export type ArchiveImportSummary = {
  root: string
  filesScanned: number
  scanIssues: number
  imagesCreated: number
  imagesReused: number
  collectionsCreated: number
  collectionsReused: number
  errors: { relativePath: string; message: string }[]
}

/**
 * Runs importArchiveFile() over every file in an already-completed scan and
 * rolls the per-file created/reused counts up into one summary -- the same
 * counting shape utils/scripts/importArtArchive.ts's CLI reports, so a
 * caller (the admin import endpoint, art-archive/t-024) gets identical
 * numbers whether it triggers the scan-then-import flow from the CLI or
 * over HTTP. A per-file failure is recorded in `errors` and does not abort
 * the rest of the batch.
 */
export async function importArchiveScan(
  scan: { root: string; files: ScannedArchiveFile[]; issues: unknown[] },
  userId: number,
): Promise<ArchiveImportSummary> {
  let imagesCreated = 0
  let imagesReused = 0
  let collectionsCreated = 0
  let collectionsReused = 0
  const errors: { relativePath: string; message: string }[] = []

  for (const file of scan.files) {
    try {
      const result = await importArchiveFile(file, userId)
      if (result.createdImage) imagesCreated += 1
      else imagesReused += 1
      if (result.createdCollection) collectionsCreated += 1
      else collectionsReused += 1
    } catch (error) {
      errors.push({ relativePath: file.relativePath, message: String(error) })
    }
  }

  return {
    root: scan.root,
    filesScanned: scan.files.length,
    scanIssues: scan.issues.length,
    imagesCreated,
    imagesReused,
    collectionsCreated,
    collectionsReused,
    errors,
  }
}
