// /server/utils/artJobQueueGroupRows.ts
//
// The PENDING rows the queue-group view and bulk priority action work from.
// Only the three payload keys that name a job are extracted, never the whole
// LongText payload; a payload that is not valid JSON contributes no keys and
// falls back to its projectSlug. Grouping itself is utils/artJobQueueGroups.ts.
import prisma from './prisma'
import type { ArtJobGroupSourceRow } from '~/utils/artJobQueueGroups'

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
