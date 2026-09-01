import { createError, getRequestIP, setHeader, type H3Event } from 'h3'

const WINDOW_MS = 15 * 60 * 1000
const MAX_PAIR_FAILURES = 5
const MAX_IP_FAILURES = 20

type FailureWindow = {
  count: number
  resetAt: number
}

const pairFailures = new Map<string, FailureWindow>()
const ipFailures = new Map<string, FailureWindow>()

function requestIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

function pairKey(event: H3Event, username: string): string {
  return `${requestIp(event)}:${username.trim().toLowerCase()}`
}

function currentWindow(
  windows: Map<string, FailureWindow>,
  key: string,
  now: number,
): FailureWindow | undefined {
  const current = windows.get(key)
  if (current && current.resetAt > now) return current
  if (current) windows.delete(key)
  return undefined
}

function retryAfterSeconds(window: FailureWindow, now: number): number {
  return Math.max(1, Math.ceil((window.resetAt - now) / 1000))
}

export function assertAuthAttemptAllowed(event: H3Event, username: string): void {
  const now = Date.now()
  const pair = currentWindow(pairFailures, pairKey(event, username), now)
  const ip = currentWindow(ipFailures, requestIp(event), now)
  const blocked =
    pair && pair.count >= MAX_PAIR_FAILURES
      ? pair
      : ip && ip.count >= MAX_IP_FAILURES
        ? ip
        : undefined

  if (!blocked) return

  setHeader(event, 'Retry-After', String(retryAfterSeconds(blocked, now)))
  throw createError({
    statusCode: 429,
    message: 'Too many failed sign-in attempts. Please try again later.',
  })
}

function recordFailure(
  windows: Map<string, FailureWindow>,
  key: string,
  now: number,
): void {
  const current = currentWindow(windows, key, now)
  if (current) {
    current.count += 1
    return
  }
  windows.set(key, { count: 1, resetAt: now + WINDOW_MS })
}

export function recordAuthFailure(event: H3Event, username: string): void {
  const now = Date.now()
  recordFailure(pairFailures, pairKey(event, username), now)
  recordFailure(ipFailures, requestIp(event), now)
}

export function clearAuthFailures(event: H3Event, username: string): void {
  pairFailures.delete(pairKey(event, username))
}
