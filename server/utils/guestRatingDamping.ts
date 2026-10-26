import { createHash, randomBytes } from 'node:crypto'

// Burst damping for anonymous Arcade ratings. The client address is hashed
// with a per-process random salt and held only in this process's memory for
// one hour; it is never written to the database or the logs.
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 20
const MAX_TRACKED_CLIENTS = 10_000
const salt = randomBytes(16).toString('hex')
const recentByClient = new Map<string, number[]>()

export function allowGuestRating(address: string, now = Date.now()): boolean {
  const key = createHash('sha256')
    .update(`${salt}:${address || 'unknown'}`)
    .digest('hex')
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

// Only this hash is stored, never the browser token itself.
export function guestVoterHash(token: string): string {
  return createHash('sha256').update(`kr-guest-rating:${token}`).digest('hex')
}
