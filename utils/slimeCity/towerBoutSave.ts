// A Tower floor fight in progress, kept on this device so a reload resumes the
// exact board (same deal, same moves) instead of forfeiting the floor. The
// record is the launch plus the command log; Clash commands are seeded and
// pure, so replaying them rebuilds the fight move for move. Rewarded bouts are
// still settled by the server's own replay, so this record grants nothing.
import { validAllianceDeck, type AllianceDeck } from './alliance'
import type { ClashCommand } from './clash'
import { TEAMS, type Side, type TeamId } from './prototypes'
import type { TowerRun } from './allianceTower'

export const TOWER_BOUT_KEY = 'kr-slime-city-tower-bout-v1'
/** Far above any real fight; a cap keeps a tampered record from stalling replay. */
export const TOWER_BOUT_MAX_COMMANDS = 4000

export interface TowerBoutLaunch {
  balanceVersion?: 1 | 2
  kind: 'tower'
  format: 'alliance'
  player: TeamId
  enemy: TeamId
  seed: number
  rewardId?: string
  alliance: AllianceDeck
  bosses?: Record<Side, number>
}
export interface TowerBoutSave {
  version: 1
  /** 'guest', or the signed-in account id as a string. */
  account: string
  runSeed: number
  floor: number
  launch: TowerBoutLaunch
  commands: ClashCommand[]
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const uint = (n: unknown, max = 4294967295): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max
const team = (id: unknown): id is TeamId =>
  typeof id === 'string' && TEAMS.some((t) => t.id === id)
const side = (s: unknown): s is Side => s === 'player' || s === 'enemy'

/** One Clash command as it may be stored on this device. */
export function validClashCommand(raw: unknown): raw is ClashCommand {
  if (!record(raw) || !side(raw.side)) return false
  switch (raw.t) {
    case 'pass':
    case 'strike':
    case 'end':
      return true
    case 'play':
      return (
        typeof raw.card === 'string' &&
        uint(raw.lane, 16) &&
        (raw.choice === undefined || raw.choice === 1)
      )
    case 'power':
      return uint(raw.lane, 16) && (raw.team === undefined || team(raw.team))
    case 'activate':
      return uint(raw.uid, 1000000)
    default:
      return false
  }
}

export function validTowerBout(raw: unknown): raw is TowerBoutSave {
  if (!record(raw) || raw.version !== 1 || !record(raw.launch)) return false
  const launch = raw.launch
  return (
    typeof raw.account === 'string' &&
    raw.account.length > 0 &&
    raw.account.length <= 64 &&
    uint(raw.runSeed) &&
    uint(raw.floor, 64) &&
    (launch.balanceVersion === undefined ||
      launch.balanceVersion === 1 ||
      launch.balanceVersion === 2) &&
    launch.kind === 'tower' &&
    launch.format === 'alliance' &&
    team(launch.player) &&
    team(launch.enemy) &&
    uint(launch.seed) &&
    (launch.rewardId === undefined ||
      (typeof launch.rewardId === 'string' && launch.rewardId.length <= 128)) &&
    validAllianceDeck(launch.alliance) &&
    (launch.bosses === undefined ||
      (record(launch.bosses) &&
        uint(launch.bosses.player, 1000) &&
        uint(launch.bosses.enemy, 1000))) &&
    Array.isArray(raw.commands) &&
    raw.commands.length <= TOWER_BOUT_MAX_COMMANDS &&
    raw.commands.every(validClashCommand)
  )
}

/** The saved fight belongs to this account's current floor, mid-battle. */
export function towerBoutMatches(
  bout: TowerBoutSave | null,
  run: TowerRun | null,
  account: string,
): bout is TowerBoutSave {
  return (
    !!bout &&
    !!run &&
    run.phase === 'battle' &&
    bout.account === account &&
    bout.runSeed === run.seed &&
    bout.floor === run.floor
  )
}

type Storage_ = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const defaultStorage = (): Storage_ | null =>
  typeof localStorage === 'undefined' ? null : localStorage

export function readTowerBout(
  storage: Pick<Storage, 'getItem'> | null = defaultStorage(),
): TowerBoutSave | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(TOWER_BOUT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return validTowerBout(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeTowerBout(
  bout: TowerBoutSave,
  storage: Pick<Storage, 'setItem'> | null = defaultStorage(),
): boolean {
  if (!storage || !validTowerBout(bout)) return false
  try {
    storage.setItem(TOWER_BOUT_KEY, JSON.stringify(bout))
    return true
  } catch {
    return false
  }
}

export function clearTowerBout(
  storage: Pick<Storage, 'removeItem'> | null = defaultStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.removeItem(TOWER_BOUT_KEY)
    return true
  } catch {
    return false
  }
}
