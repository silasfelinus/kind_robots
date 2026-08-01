// /server/utils/queueControl.ts
//
// Read/write the singleton ArtJob queue pause flag (QueueControl id = 1).
// Every read is graceful: if the table does not exist yet (deploy landed before
// `prisma migrate deploy` ran), the database is slow, or any DB error occurs,
// return the last known state. A missing control row must never wedge the
// pipeline or hold the queue dashboard open until its client timeout.
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

const READ_DEADLINE_MS = 2_000
const CACHE_TTL_MS = 5_000

let cachedState: QueueControlState = DEFAULT_STATE
let cachedAt = 0

function serializeQueueControl(row: {
  paused: boolean
  pausedBy: string | null
  pausedAt: Date | null
  note: string | null
  updatedAt: Date
}): QueueControlState {
  return {
    paused: row.paused,
    pausedBy: row.pausedBy ?? null,
    pausedAt: row.pausedAt ? row.pausedAt.toISOString() : null,
    note: row.note ?? null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }
}

async function readQueueControlWithDeadline() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), READ_DEADLINE_MS)
  })

  try {
    return await Promise.race([
      prisma.queueControl.findUnique({ where: { id: 1 } }),
      timeout,
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function getQueueControl(): Promise<QueueControlState> {
  if (Date.now() - cachedAt < CACHE_TTL_MS) return cachedState

  try {
    const row = await readQueueControlWithDeadline()
    if (!row) return cachedState

    cachedState = serializeQueueControl(row)
    cachedAt = Date.now()
    return cachedState
  } catch {
    return cachedState
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

  cachedState = serializeQueueControl(row)
  cachedAt = Date.now()
  return cachedState
}
