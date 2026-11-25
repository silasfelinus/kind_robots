// /server/utils/artJobQueueGroupRows.ts
//
// The PENDING rows the queue-group view and bulk priority action work from.
// Only the three payload keys that name a job are extracted, never the whole
// LongText payload; a payload that is not valid JSON contributes no keys and
// falls back to its projectSlug. Grouping itself is utils/artJobQueueGroups.ts.
import prisma from './prisma'
import type {
  ArtJobGroupPreviewRow,
  ArtJobGroupSourceRow,
} from '~/utils/artJobQueueGroups'
import type { GalleryMaturityFilter } from './artImageAccess'

export async function loadPendingArtJobGroupRows(): Promise<
  ArtJobGroupSourceRow[]
> {
  return prisma.$queryRaw<ArtJobGroupSourceRow[]>`
    SELECT
      pending.id,
      pending.priority,
      pending.projectSlug,
      JSON_EXTRACT(pending.doc, '$.title') AS title,
      JSON_EXTRACT(pending.doc, '$.label') AS label,
      JSON_EXTRACT(pending.doc, '$.name') AS name
    FROM (
      SELECT
        id,
        priority,
        projectSlug,
        IF(JSON_VALID(payload), payload, NULL) AS doc
      FROM ArtJob
      WHERE status = 'PENDING'
    ) AS pending
  `
}

export async function loadCompletedArtJobGroupPreviewRows(
  userId: number,
  maturity: GalleryMaturityFilter,
): Promise<ArtJobGroupPreviewRow[]> {
  return prisma.$queryRaw<ArtJobGroupPreviewRow[]>`
    SELECT
      completed.id,
      completed.priority,
      completed.projectSlug,
      completed.artImageId,
      completed.finishedAt,
      completed.isMature,
      completed.isPublic,
      JSON_EXTRACT(completed.doc, '$.title') AS title,
      JSON_EXTRACT(completed.doc, '$.label') AS label,
      JSON_EXTRACT(completed.doc, '$.name') AS name
    FROM (
      SELECT
        j.id,
        j.priority,
        j.projectSlug,
        j.artImageId,
        COALESCE(j.updatedAt, j.createdAt) AS finishedAt,
        a.isMature,
        a.isPublic,
        IF(JSON_VALID(j.payload), j.payload, NULL) AS doc
      FROM ArtJob j
      INNER JOIN ArtImage a ON a.id = j.artImageId
      WHERE j.status = 'DONE'
        AND a.isActive = TRUE
        AND (a.isPublic = TRUE OR a.userId = ${userId})
        AND (${maturity} = 'all'
          OR (${maturity} = 'safe' AND COALESCE(a.isMature, FALSE) = FALSE)
          OR (${maturity} = 'mature' AND a.isMature = TRUE))
        AND LOWER(a.fileType) IN (
          'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif',
          'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'
        )
    ) AS completed
    ORDER BY completed.finishedAt DESC, completed.id DESC
  `
}
