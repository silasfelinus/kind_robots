// A VS CPU match in progress, kept on this device so a reload can resume the
// exact board (same deal, same moves) instead of losing the fight. The record
// is the frozen launch plus the command log; Clash commands are seeded and
// pure, so replaying them rebuilds the match move for move. A reward match is
// still settled by the server's own replay of the full command log, so this
// record grants nothing by itself. Records older than the server's 24-hour
// settlement window are dropped.
import { validAllianceDeck, type AllianceDeck } from './alliance'
import type { ClashCommand } from './clash'
import { TEAMS, type TeamId } from './prototypes'
import { validClashCommand, TOWER_BOUT_MAX_COMMANDS } from './towerBoutSave'

export const VS_BOUT_KEY = 'kr-slime-city-vs-bout-v1'
/** The server refuses to settle a CPU reward match older than a day. */
export const VS_BOUT_MAX_AGE_MS = 86400000
/** A solo deck is 20 cards; the cap only stops tampered records. */
const MAX_DECK = 60

export interface VsBoutLaunch {
  kind: 'practice' | 'reward'
  format: 'solo' | 'alliance'
  player: TeamId
  enemy: TeamId
  seed: number
  rewardId?: string
  cards?: string[]
  alliance?: AllianceDeck
}
export interface VsBoutSave {
  version: 1
  /** 'guest', or the signed-in account id as a string. */
  account: string
  /** When the match was dealt (ms since epoch). */
  savedAt: number
  launch: VsBoutLaunch
  commands: ClashCommand[]
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const uint = (n: unknown, max = 4294967295): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max
const team = (id: unknown): id is TeamId =>
  typeof id === 'string' && TEAMS.some((t) => t.id === id)

function validLaunch(launch: Record<string, unknown>): boolean {
  if (launch.kind !== 'practice' && launch.kind !== 'reward') return false
  if (!team(launch.player) || !team(launch.enemy) || !uint(launch.seed))
    return false
  if (launch.kind === 'reward') {
    if (typeof launch.rewardId !== 'string' || !launch.rewardId) return false
  } else if (launch.rewardId !== undefined) return false
  if (typeof launch.rewardId === 'string' && launch.rewardId.length > 128)
    return false
  if (launch.format === 'alliance')
    return launch.cards === undefined && validAllianceDeck(launch.alliance)
  if (launch.format === 'solo')
    return (
      launch.alliance === undefined &&
      Array.isArray(launch.cards) &&
      launch.cards.length > 0 &&
      launch.cards.length <= MAX_DECK &&
      launch.cards.every((c) => typeof c === 'string' && c.length <= 128)
    )
  return false
}

export function validVsBout(raw: unknown): raw is VsBoutSave {
  if (!record(raw) || raw.version !== 1 || !record(raw.launch)) return false
  return (
    typeof raw.account === 'string' &&
    raw.account.length > 0 &&
    raw.account.length <= 64 &&
    typeof raw.savedAt === 'number' &&
    Number.isSafeInteger(raw.savedAt) &&
    raw.savedAt > 0 &&
    validLaunch(raw.launch) &&
    Array.isArray(raw.commands) &&
    raw.commands.length <= TOWER_BOUT_MAX_COMMANDS &&
    raw.commands.every(validClashCommand)
  )
}

/** The saved match belongs to this account and can still be settled. */
export function vsBoutMatches(
  bout: VsBoutSave | null,
  account: string,
  now = Date.now(),
): bout is VsBoutSave {
  return (
    !!bout &&
    bout.account === account &&
    bout.savedAt <= now + 60000 &&
    now - bout.savedAt < VS_BOUT_MAX_AGE_MS
  )
}

type Storage_ = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const defaultStorage = (): Storage_ | null =>
  typeof localStorage === 'undefined' ? null : localStorage

export function readVsBout(
  storage: Pick<Storage, 'getItem'> | null = defaultStorage(),
): VsBoutSave | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(VS_BOUT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return validVsBout(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeVsBout(
  bout: VsBoutSave,
  storage: Pick<Storage, 'setItem'> | null = defaultStorage(),
): boolean {
  if (!storage || !validVsBout(bout)) return false
  try {
    storage.setItem(VS_BOUT_KEY, JSON.stringify(bout))
    return true
  } catch {
    return false
  }
}

export function clearVsBout(
  storage: Pick<Storage, 'removeItem'> | null = defaultStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.removeItem(VS_BOUT_KEY)
    return true
  } catch {
    return false
  }
}
