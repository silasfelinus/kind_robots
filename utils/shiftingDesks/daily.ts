/**
 * The Daily Memo: one seeded Wellness Weekend per day, the same for everyone
 * (PITCHES.md "Expansions": Daily Memo). The day is the Pacific calendar date,
 * the Company's head-office time, so a player in any time zone gets the same
 * files, society and mutation as everyone else that day.
 *
 * A daily run is an ordinary run whose seed is `daily-YYYY-MM-DD`; nothing in
 * the save schema changes and the engine stays deterministic.
 */
export const DAILY_PREFIX = 'daily-'
const DAILY_ZONE = 'America/Los_Angeles'

/** YYYY-MM-DD for the Company's calendar day. */
export function dailyKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function dailySeed(date: Date = new Date()): string {
  return `${DAILY_PREFIX}${dailyKey(date)}`
}

/** The day a daily run belongs to, or null for an ordinary run. */
export function dailyDateOf(seed: string | null | undefined): string | null {
  const match = /^daily-(\d{4}-\d{2}-\d{2})$/.exec(seed ?? '')
  return match?.[1] ?? null
}

/** "Oct 16" for a YYYY-MM-DD key. */
export function dailyLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1)))
}

export type DailyShare = {
  key: string
  title: string
  successor: number
  files: number
  verdict: string
}

/** The spoiler-light result line a player pastes to friends. */
export function dailyShareText(share: DailyShare): string {
  return [
    `Shifting Desks · Daily Memo ${dailyLabel(share.key)}`,
    `${share.title} · Successor #${share.successor} · ${share.files} files handled`,
    `PAL's verdict: ${share.verdict}`,
    'https://kindrobots.org/play/shifting-desks',
  ].join('\n')
}
