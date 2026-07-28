import type { Server } from '~/prisma/generated/prisma/client'
import { mergeServerRecord, type SafeServerRow } from './serverMerge'

/**
 * Reconcile a complete server API response with locally cached server rows.
 *
 * The incoming list is authoritative for membership: cached IDs absent from the
 * response are deleted. Matching rows are still merged so a locally cached,
 * unmasked API key survives the safe/masked API representation returned to the
 * browser.
 */
export function reconcileServerRows(
  existing: Server[],
  incoming: SafeServerRow[],
): Server[] {
  const cachedById = new Map(existing.map((server) => [server.id, server]))

  return incoming.map((server) =>
    mergeServerRecord(cachedById.get(server.id), server),
  )
}
