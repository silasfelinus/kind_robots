// /server/utils/queueControl.ts
//
// Read/write the singleton ArtJob queue pause flag (QueueControl id = 1).
// Every read is graceful: if the table does not exist yet (deploy landed before
// `prisma migrate deploy` ran) or any DB error occurs, we treat the queue as
// NOT paused so relays keep draining — a missing control row must never wedge
// the whole pipeline.
import prisma from './prisma'

export type QueueControlState = {
  paused: boolean
  pausedBy: string | null
  pausedAt: string | null
  note: string | null
  updatedAt: string | null
}

const DEFAULT_STATE: QueueControlState = {
  paused: false,
  pausedBy: null,
  pausedAt: null,
  note: null,
  updatedAt: null,
}

export async function getQueueControl(): Promise<QueueControlState> {
  try {
    const row = await prisma.queueControl.findUnique({ where: { id: 1 } })
    if (!row) return DEFAULT_STATE
    return {
      paused: row.paused,
      pausedBy: row.pausedBy ?? null,
      pausedAt: row.pausedAt ? row.pausedAt.toISOString() : null,
      note: row.note ?? null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    }
  } catch {
    return DEFAULT_STATE
  }
}

export async function isQueuePaused(): Promise<boolean> {
  return (await getQueueControl()).paused
}

export async function setQueuePaused(
  paused: boolean,
  pausedBy: string | null,
  note: string | null,
): Promise<QueueControlState> {
  const data = {
    paused,
    pausedBy: paused ? pausedBy : null,
    pausedAt: paused ? new Date() : null,
    note: note ?? null,
  }
  const row = await prisma.queueControl.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  })
  return {
    paused: row.paused,
    pausedBy: row.pausedBy ?? null,
    pausedAt: row.pausedAt ? row.pausedAt.toISOString() : null,
    note: row.note ?? null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }
}
