import { createHash, randomBytes } from 'node:crypto'

// Abuse damping for the anonymous site-stats counter. The client address is
// hashed with a per-process random salt and kept only in this process's memory
// for one minute; it is never written to the database or the logs.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 60
const MAX_TRACKED_CLIENTS = 10_000
const salt = randomBytes(16).toString('hex')
const recentByClient = new Map<string, number[]>()

function clientKey(address: string): string {
  return createHash('sha256').update(`${salt}:${address}`).digest('hex')
}

export function allowSiteStatHit(address: string, now = Date.now()): boolean {
  const key = clientKey(address || 'unknown')
  const recent = (recentByClient.get(key) ?? []).filter(
    (at) => now - at < WINDOW_MS,
  )
  if (recent.length >= MAX_PER_WINDOW) {
    recentByClient.set(key, recent)
    return false
  }
  recent.push(now)
  recentByClient.set(key, recent)
  if (recentByClient.size > MAX_TRACKED_CLIENTS) {
    for (const [client, times] of recentByClient) {
      if (!times.some((at) => now - at < WINDOW_MS))
        recentByClient.delete(client)
    }
  }
  return true
}
