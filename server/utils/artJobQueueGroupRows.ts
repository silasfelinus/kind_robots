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

// Previews come from recent completions only. DONE is most of the table, and
// each payload is a whole ComfyUI workflow, so this reads one bounded page at a
// time, newest job id first: the LIMITed derived table picks cheap columns and
// only those rows' payloads are parsed. The caller pages with `beforeId` until
// every pending group has a preview or the page budget runs out.
export const ART_JOB_GROUP_PREVIEW_PAGE_SIZE = 400
export const ART_JOB_GROUP_PREVIEW_MAX_PAGES = 10

export async function loadCompletedArtJobGroupPreviewRows(
  userId: number,
  maturity: GalleryMaturityFilter,
  beforeId: number = Number.MAX_SAFE_INTEGER,
  limit: number = ART_JOB_GROUP_PREVIEW_PAGE_SIZE,
): Promise<ArtJobGroupPreviewRow[]> {
  return prisma.$queryRaw<ArtJobGroupPreviewRow[]>`
    SELECT
      recent.id,
      recent.priority,
      recent.projectSlug,
      recent.artImageId,
      recent.finishedAt,
      recent.isMature,
      recent.isPublic,
      IF(JSON_VALID(p.payload), JSON_EXTRACT(p.payload, '$.title'), NULL)
        AS title,
      IF(JSON_VALID(p.payload), JSON_EXTRACT(p.payload, '$.label'), NULL)
        AS label,
      IF(JSON_VALID(p.payload), JSON_EXTRACT(p.payload, '$.name'), NULL)
        AS name
    FROM (
      SELECT
        j.id,
        j.priority,
        j.projectSlug,
        j.artImageId,
        COALESCE(j.updatedAt, j.createdAt) AS finishedAt,
        a.isMature,
        a.isPublic
      FROM ArtJob j
      INNER JOIN ArtImage a ON a.id = j.artImageId
      WHERE j.status = 'DONE'
        AND j.id < ${beforeId}
        AND a.isActive = TRUE
        AND (a.isPublic = TRUE OR a.userId = ${userId})
        AND (${maturity} = 'all'
          OR (${maturity} = 'safe' AND COALESCE(a.isMature, FALSE) = FALSE)
          OR (${maturity} = 'mature' AND a.isMature = TRUE))
        AND LOWER(a.fileType) IN (
          'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif',
          'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'
        )
      ORDER BY j.id DESC
      LIMIT ${limit}
    ) AS recent
    INNER JOIN ArtJob p ON p.id = recent.id
    ORDER BY recent.id DESC
  `
}
