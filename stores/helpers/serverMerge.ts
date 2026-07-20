import type { Server } from '~/prisma/generated/prisma/client'
import { mergeDefinedRecord } from './recordMerge'

export type SafeServerRow = Server & {
  hasApiKey?: boolean
}

const maskedApiKey = '••••••••'

export function mergeServerRecord(
  existing: Server | undefined,
  incoming: SafeServerRow,
): Server {
  const merged = mergeDefinedRecord(existing, incoming)

  if (incoming.hasApiKey === false) {
    merged.apiKey = null
    return merged
  }

  if (incoming.hasApiKey && incoming.apiKey === maskedApiKey) {
    const cachedKey = existing?.apiKey
    merged.apiKey =
      cachedKey && cachedKey !== maskedApiKey ? cachedKey : incoming.apiKey
  }

  return merged
}

export function mergeServerRows(
  existing: Server[],
  incoming: SafeServerRow[],
): Server[] {
  const rows = new Map(existing.map((server) => [server.id, server]))

  for (const server of incoming) {
    rows.set(server.id, mergeServerRecord(rows.get(server.id), server))
  }

  return Array.from(rows.values())
}
