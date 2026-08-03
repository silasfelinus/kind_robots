import prisma from '@/server/utils/prisma'
import {
  assertConductorProjectionSnapshot,
  type ConductorProjectionSnapshot,
} from '@/server/utils/conductorProjection'

export interface StoredConductorProjection {
  snapshot: ConductorProjectionSnapshot
  syncedAt: string
}

type ProjectionRow = {
  payload: string
  syncedAt: Date | string
}

export async function readConductorProjection(): Promise<StoredConductorProjection | null> {
  const rows = await prisma.$queryRaw<ProjectionRow[]>`
    SELECT payload, syncedAt
    FROM ConductorProjection
    WHERE id = 1
    LIMIT 1
  `
  const row = rows[0]
  if (!row) return null

  const snapshot: unknown = JSON.parse(row.payload)
  assertConductorProjectionSnapshot(snapshot)
  return {
    snapshot,
    syncedAt: new Date(row.syncedAt).toISOString(),
  }
}
