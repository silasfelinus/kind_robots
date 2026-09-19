import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getArtArchiveRoot } from '@/server/utils/artArchiveRoot'
import { scanArchiveRoot } from '@/server/utils/artArchiveScanner'
import { loadKnownArchiveFiles, planArchiveReconciliation } from '@/server/utils/artArchiveReconciler'
import { matchArchiveResources, type ResourceMatchConfidence, type ResourceMatchOutcome } from '@/server/utils/artArchiveResourceMatch'
import prisma from '@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const knownFiles = await loadKnownArchiveFiles()
    const scan = await scanArchiveRoot(getArtArchiveRoot(), { knownFiles })
    const existingEntries = await prisma.archiveEntry.findMany({
      where: { isActive: true, processState: { not: 'MISSING' } },
      select: { id: true, relativePath: true, contentHash: true },
    })
    const plan = planArchiveReconciliation(scan.files, existingEntries)
    const countOf = (kind: string) => plan.actions.filter((action) => action.kind === kind).length
    const confidenceCounts: Record<ResourceMatchConfidence, number> = { hash: 0, exact: 0, suggested: 0 }
    let filesWithMatchEvidence = 0
    let unmatchedModels = 0

    const resourceMatches = await Promise.all(
      scan.files.map(async (file) => {
        const matches = await matchArchiveResources(
          file.metadata,
          file.relativePath,
          file.parentFolder,
          prisma.resource,
        )
        const outcomes = [matches.checkpoint, ...matches.loras].filter(
          (outcome): outcome is ResourceMatchOutcome => outcome !== null,
        )
        if (outcomes.length > 0) filesWithMatchEvidence += 1
        for (const outcome of outcomes) {
          if (outcome.candidates.length > 0) {
            for (const candidate of outcome.candidates) confidenceCounts[candidate.confidence] += 1
          } else if (outcome.unmatched) unmatchedModels += 1
        }
        return { relativePath: file.relativePath, matches }
      }),
    )

    return {
      success: true,
      message: `Previewed reconciliation of ${scan.files.length} scanned file(s) with no database writes.`,
      data: {
        root: scan.root,
        filesScanned: scan.files.length,
        cacheHitCount: scan.cacheHitCount,
        scanIssueCount: scan.issues.length,
        plan: {
          new: countOf('new'),
          unchanged: countOf('unchanged'),
          changed: countOf('changed'),
          moved: countOf('moved'),
          copied: countOf('copied'),
          missing: plan.missing.length,
        },
        filesWithMatchEvidence,
        unmatchedModels,
        confidenceCounts,
        resourceMatches,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to preview Art Archive reconciliation.',
      statusCode,
    }
  }
})
