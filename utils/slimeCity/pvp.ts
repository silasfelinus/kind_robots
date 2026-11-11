import {
  applyClashCommand,
  createClash,
  nextClashStrike,
  clashPower,
  replayClash,
  type ClashCommand,
  type ClashState,
} from './clash'
import { CARDS, TEAMS, type Side, type TeamId } from './prototypes'

export const PVP_MODE = 'clash-pvp'
export const PVP_MAX_COMMANDS = 2000
export const PVP_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
export const PVP_IDLE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

/** Completed matches remain readable as history; live matches expire after inactivity. */
export function isPvpExpired(
  startedAt: Date,
  lastActionAt: string | undefined,
  joined: boolean,
  settled: boolean,
  now = Date.now(),
): boolean {
  if (settled) return false
  const timestamp = lastActionAt
    ? Date.parse(lastActionAt)
    : startedAt.getTime()
  if (!Number.isFinite(timestamp)) return true
  return now - timestamp > (joined ? PVP_IDLE_EXPIRY_MS : PVP_INVITE_EXPIRY_MS)
}

export interface PvpRecord {
  version: 1
  guestId: number | null
  lastActionAt?: string
  forfeitedBy?: Side
  commands: ClashCommand[]
}

export interface PvpBoard {
  round: number
  active: Side
  phase: ClashState['phase']
  plays: ClashState['plays']
  freePlays: ClashState['freePlays']
  boss: ClashState['boss']
  units: Array<ClashState['units'][number] & { power: number }>
  traps: ClashState['traps']
  log: ClashState['log']
  cursor: number
  strike: ClashState['strike']
  victor: ClashState['victor']
  format: ClashState['format']
  powersUsed: ClashState['powersUsed']
  hand: string[]
  levels: Record<string, number>
  opponentHandCount: number
  deckCount: number
  opponentDeckCount: number
  discardCount: number
  opponentDiscardCount: number
  commandCount: number
  nextStrike: number
}

export interface PvpSnapshot {
  id: string
  seat: Side
  hostTeam: TeamId
  guestTeam: TeamId | null
  stage: 'waiting' | 'battle' | 'finished'
  board: PvpBoard | null
  revision: number
  outcome: Side | null
  forfeitedBy: Side | null
}

export function isPvpTeam(value: unknown): value is TeamId {
  return typeof value === 'string' && TEAMS.some((team) => team.id === value)
}

export function parsePvpRecord(value: unknown): PvpRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  if (
    data.version !== 1 ||
    (data.guestId !== null &&
      (!Number.isSafeInteger(data.guestId) || Number(data.guestId) <= 0)) ||
    (data.lastActionAt !== undefined &&
      (typeof data.lastActionAt !== 'string' ||
        !Number.isFinite(Date.parse(data.lastActionAt)))) ||
    (data.forfeitedBy !== undefined &&
      data.forfeitedBy !== 'player' &&
      data.forfeitedBy !== 'enemy') ||
    !Array.isArray(data.commands) ||
    data.commands.length > PVP_MAX_COMMANDS
  )
    return null
  return data as unknown as PvpRecord
}

/** Take only known command fields. Never accept a client-supplied seat. */
export function pvpCommand(raw: unknown, side: Side): ClashCommand | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const value = raw as Record<string, unknown>
  if (typeof value.t !== 'string' || 'side' in value) return null
  const fields = Object.keys(value)
  const only = (...allowed: string[]) =>
    fields.every((key) => allowed.includes(key))
  switch (value.t) {
    case 'play':
      if (
        !only('t', 'card', 'lane', 'choice') ||
        typeof value.card !== 'string' ||
        !CARDS.some((card) => card.id === value.card) ||
        !Number.isSafeInteger(value.lane) ||
        Number(value.lane) < 0 ||
        Number(value.lane) > 4 ||
        (value.choice !== undefined && value.choice !== 1)
      )
        return null
      return {
        t: 'play',
        side,
        card: value.card,
        lane: Number(value.lane),
        ...(value.choice === 1 ? { choice: 1 as const } : {}),
      }
    case 'power':
      if (
        !only('t', 'lane', 'team') ||
        !Number.isSafeInteger(value.lane) ||
        Number(value.lane) < 0 ||
        Number(value.lane) > 4 ||
        (value.team !== undefined && !isPvpTeam(value.team))
      )
        return null
      return {
        t: 'power',
        side,
        lane: Number(value.lane),
        ...(value.team ? { team: value.team as TeamId } : {}),
      }
    case 'pass':
    case 'strike':
    case 'end':
      return only('t') ? { t: value.t, side } : null
    default:
      return null
  }
}

export function replayPvp(
  host: TeamId,
  guest: TeamId,
  seed: number,
  commands: ClashCommand[],
): ClashState {
  return replayClash(host, guest, seed, commands)
}

export function newPvpGame(
  host: TeamId,
  guest: TeamId,
  seed: number,
): ClashState {
  return createClash(host, guest, seed)
}

export function stepPvp(
  state: ClashState,
  command: ClashCommand,
): ClashState | null {
  if (state.victor || state.active !== command.side) return null
  const next = applyClashCommand(state, command)
  return next === state ? null : next
}

/** The client never receives the seed, rival deck order, hand, or hidden traps. */
export function pvpBoard(state: ClashState, seat: Side): PvpBoard {
  const other = seat === 'player' ? 'enemy' : 'player'
  return {
    round: state.round,
    active: state.active,
    phase: state.phase,
    plays: { ...state.plays },
    freePlays: {
      player: state.freePlays?.player ?? 0,
      enemy: state.freePlays?.enemy ?? 0,
    },
    boss: { ...state.boss },
    units: state.units.map((unit) => ({
      ...unit,
      power: clashPower(state, unit),
    })),
    traps: state.traps
      .filter((trap) => trap.side === seat)
      .map((trap) => ({ ...trap })),
    log: state.log
      .filter(
        (entry) =>
          !!state.victor || ['death', 'boss', 'turn'].includes(entry.kind),
      )
      .map((entry) => ({ ...entry })),
    cursor: state.cursor,
    strike: state.strike ? { ...state.strike } : null,
    victor: state.victor,
    format: state.format,
    powersUsed: state.powersUsed
      ? {
          player: [...state.powersUsed.player],
          enemy: [...state.powersUsed.enemy],
        }
      : undefined,
    hand: [...state.hands[seat]],
    levels: { ...state.levels[seat] },
    opponentHandCount: state.hands[other].length,
    deckCount: state.decks[seat].length,
    opponentDeckCount: state.decks[other].length,
    discardCount: state.discards[seat].length,
    opponentDiscardCount: state.discards[other].length,
    commandCount: state.commands.length,
    nextStrike: nextClashStrike(state, state.active),
  }
}
