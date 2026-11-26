import {
  applyClashCommand,
  createClash,
  nextClashStrike,
  clashPower,
  clashPlayLimit,
  replayClash,
  type ClashCommand,
  type ClashOptions,
  type ClashState,
} from './clash'
import { CARDS, TEAMS, type Card, type Side, type TeamId } from './prototypes'

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
  /**
   * A challenge sent to one friend (Silas, 2026-11-11 PT: "You should be able
   * to challenge players on your friends list. And they should get
   * notified."). Only that player may join. Absent for open link duels.
   */
  invitedId?: number | null
  /**
   * Silas, 2026-11-11 PT: "Invites should be private or open and seen by
   * other visitors if public and joinable." Open duels are listed in VS for
   * anyone to join; private ones travel by link or friend challenge.
   */
  isPublic?: boolean
  lastActionAt?: string
  forfeitedBy?: Side
  meatRewards?: Record<Side, number>
  joinedAt?: string
  /** Duels created after 2026-11-22 PT deal each next hand at turn end. */
  dealEarly?: boolean
  /**
   * Silas, 2026-11-22 PT: "There should be a back button if it's your turn,
   * with options for more depending on game options at start." Older duels
   * stored 0 off, 1, or PVP_TAKEBACKS_ANY here. Silas, 2026-11-24 PT: "We
   * shouldn't be limiting undos." Every duel now allows any take-back until
   * FIGHT; the stored value is kept only so old records still parse.
   */
  takebacks?: number
  /** Take-backs used so far; keeps the duel revision moving forward. */
  undone?: number
  /** Take-backs used in the current turn, keyed `round:side`. */
  undoneThisTurn?: { key: string; count: number }
  commands: ClashCommand[]
}

export const PVP_MIN_REWARD_ROUND = 4
export const PVP_MIN_REWARD_PLAYS = 3
export const PVP_MIN_REWARD_MS = 5 * 60 * 1000

export function pvpMeatRewards(
  state: Pick<ClashState, 'round' | 'commands'>,
  outcome: NonNullable<ClashState['victor']>,
  joinedAt: string | undefined,
  now: number,
): Record<Side, number> {
  const eligible =
    state.round >= PVP_MIN_REWARD_ROUND &&
    (!joinedAt || now - Date.parse(joinedAt) >= PVP_MIN_REWARD_MS) &&
    (['player', 'enemy'] as const).every(
      (side) =>
        state.commands.filter((c) => c.t === 'play' && c.side === side)
          .length >= PVP_MIN_REWARD_PLAYS,
    )
  return {
    player: eligible
      ? outcome === 'draw'
        ? 15
        : outcome === 'player'
          ? 30
          : 10
      : 0,
    enemy: eligible
      ? outcome === 'draw'
        ? 15
        : outcome === 'enemy'
          ? 30
          : 10
      : 0,
  }
}

export const PVP_TAKEBACKS_ANY = 99
export const PVP_TAKEBACK_CHOICES = [0, 1, PVP_TAKEBACKS_ANY] as const

/**
 * The duel's take-back allowance per turn: unlimited for every duel, old or
 * new (Silas, 2026-11-24 PT: "We shouldn't be limiting undos.").
 */
export function pvpTakebacks(_record?: Pick<PvpRecord, 'takebacks'>): number {
  return PVP_TAKEBACKS_ANY
}

/**
 * The optimistic-concurrency revision. Every move adds one command and every
 * take-back removes one while counting itself twice, so the number only ever
 * grows and a stale tab can never match a newer board.
 */
export function pvpRevision(
  record: Pick<PvpRecord, 'commands' | 'undone'>,
): number {
  return record.commands.length + 2 * (record.undone ?? 0)
}

/** One resolved alley strike, for replaying a rival's sweep alley by alley. */
export interface PvpStrike {
  /** The duel's command count right after this strike. */
  at: number
  strike: NonNullable<ClashState['strike']>
}

/** Replay a duel and keep its most recent public strikes. */
export function replayPvpTrail(
  host: TeamId,
  guest: TeamId,
  seed: number,
  commands: ClashCommand[],
  rules: Pick<ClashOptions, 'dealEarly'> = {},
  keep = 12,
): { state: ClashState; strikes: PvpStrike[] } {
  let state = createClash(host, guest, seed, rules)
  const strikes: PvpStrike[] = []
  const from = commands.length - keep
  commands.forEach((command, index) => {
    state = applyClashCommand(state, command)
    if (index >= from && command.t === 'strike' && state.strike)
      strikes.push({ at: index + 1, strike: { ...state.strike } })
  })
  return { state, strikes }
}

export interface PvpTakeback {
  allowed: number
  left: number
  /** Why the last move cannot be taken back, or null when it can. */
  blocked: string | null
}

/**
 * Whether `seat` may take back its last move. Only a card play, power or tap
 * in the current play phase, within the turn's allowance, and only when the
 * move revealed nothing: no dice rolled, no card drawn, no rival trap sprung
 * and no rival card touched. A take-back can never be used to peek.
 */
export function pvpTakebackState(
  host: TeamId,
  guest: TeamId,
  seed: number,
  record: PvpRecord,
  seat: Side,
  current?: ClashState,
): PvpTakeback {
  const allowed = pvpTakebacks(record)
  const now =
    current ?? replayPvp(host, guest, seed, record.commands, pvpRules(record))
  const key = now.round + ':' + seat
  const used =
    record.undoneThisTurn?.key === key ? record.undoneThisTurn.count : 0
  const left = Math.max(0, allowed - used)
  const result = (blocked: string | null): PvpTakeback => ({
    allowed,
    left,
    blocked,
  })
  if (!allowed) return result('Take-backs are off in this duel.')
  // Spending the last play moves the engine into its attack phase, so the
  // turn check is "yours, and your newest action is that play": no strike
  // can have landed since.
  if (now.victor || now.active !== seat)
    return result('You can take back a play only during your own turn.')
  const last = record.commands.at(-1)
  if (
    !last ||
    last.side !== seat ||
    !['play', 'power', 'activate'].includes(last.t)
  )
    return result('Nothing to take back this turn.')
  if (!left) return result('No take-backs left this turn.')
  const before = replayPvp(
    host,
    guest,
    seed,
    record.commands.slice(0, -1),
    pvpRules(record),
  )
  const other: Side = seat === 'player' ? 'enemy' : 'player'
  if (before.rng !== now.rng)
    return result('That move rolled the dice, so it stands.')
  const expected = [...before.hands[seat]]
  if (last.t === 'play') expected.splice(expected.indexOf(last.card), 1)
  if (
    before.decks[seat].length !== now.decks[seat].length ||
    JSON.stringify([...expected].sort()) !==
      JSON.stringify([...now.hands[seat]].sort())
  )
    return result('That move drew or discarded cards, so it stands.')
  const hidden = (state: ClashState) =>
    JSON.stringify([
      state.hands[other],
      state.decks[other],
      state.traps.filter((trap) => trap.side === other),
    ])
  if (hidden(before) !== hidden(now))
    return result('That move set off something hidden, so it stands.')
  return result(null)
}

/** The record with `seat`'s last move taken back, or a reason it cannot be. */
export function pvpTakeBack(
  host: TeamId,
  guest: TeamId,
  seed: number,
  record: PvpRecord,
  seat: Side,
): { record: PvpRecord } | { error: string } {
  const now = replayPvp(host, guest, seed, record.commands, pvpRules(record))
  const check = pvpTakebackState(host, guest, seed, record, seat, now)
  if (check.blocked) return { error: check.blocked }
  const key = now.round + ':' + seat
  const used =
    record.undoneThisTurn?.key === key ? record.undoneThisTurn.count : 0
  return {
    record: {
      ...record,
      commands: record.commands.slice(0, -1),
      undone: (record.undone ?? 0) + 1,
      undoneThisTurn: { key, count: used + 1 },
    },
  }
}

export interface PvpBoard {
  round: number
  active: Side
  phase: ClashState['phase']
  plays: ClashState['plays']
  playLimit?: number
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
  /** Sent to one friend rather than shared as an open link. */
  challenge?: boolean
  /** Listed in VS for anyone to join. */
  open?: boolean
  board: PvpBoard | null
  revision: number
  outcome: ClashState['victor']
  forfeitedBy: Side | null
  meatReward?: number
  /** The other seated player, sent only to the duel's two players. */
  rivalId?: number | null
  rivalName?: string | null
  /** Take-backs allowed per turn in this duel (0, 1 or PVP_TAKEBACKS_ANY). */
  takebacks?: number
  /** The viewer's take-back, during their own play phase. */
  takeback?: PvpTakeback | null
  /** The most recent strikes, so a rival's sweep replays alley by alley. */
  strikes?: PvpStrike[]
}

/**
 * The other player's account for one of a joined duel's two seats, or null
 * for anyone else (a link holder sizing up a waiting duel sees no account).
 */
export function pvpSnapshotRival(
  hostId: number,
  record: Pick<PvpRecord, 'guestId'>,
  viewer: number,
): number | null {
  if (record.guestId === null) return null
  if (viewer === hostId) return record.guestId
  if (viewer === record.guestId) return hostId
  return null
}

/**
 * REMATCH after the final bell: a private challenge to the same rival with
 * the previous crew by default, or a newly selected crew. Null until the
 * duel is over or when the rival is unknown.
 */
export function pvpRematch(
  duel: Pick<
    PvpSnapshot,
    'stage' | 'seat' | 'hostTeam' | 'guestTeam' | 'rivalId'
  >,
  selectedTeam?: TeamId,
): { team: TeamId; friendId: number } | null {
  if (duel.stage !== 'finished' || !duel.rivalId) return null
  const team = duel.seat === 'player' ? duel.hostTeam : duel.guestTeam
  return team ? { team: selectedTeam ?? team, friendId: duel.rivalId } : null
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
    (data.invitedId !== undefined &&
      data.invitedId !== null &&
      (!Number.isSafeInteger(data.invitedId) || Number(data.invitedId) <= 0)) ||
    (data.isPublic !== undefined && typeof data.isPublic !== 'boolean') ||
    (data.dealEarly !== undefined && typeof data.dealEarly !== 'boolean') ||
    (data.takebacks !== undefined &&
      !PVP_TAKEBACK_CHOICES.includes(data.takebacks as 0)) ||
    (data.undone !== undefined &&
      (!Number.isSafeInteger(data.undone) || Number(data.undone) < 0)) ||
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
    case 'activate':
      if (
        !only('t', 'uid') ||
        !Number.isSafeInteger(value.uid) ||
        Number(value.uid) < 1
      )
        return null
      return { t: 'activate', side, uid: Number(value.uid) }
    case 'pass':
    case 'strike':
    case 'end':
      return only('t') ? { t: value.t, side } : null
    default:
      return null
  }
}

/** The engine rules a stored duel was created under. */
export function pvpRules(
  record: Pick<PvpRecord, 'dealEarly'>,
): Pick<ClashOptions, 'dealEarly'> {
  return record.dealEarly ? { dealEarly: true } : {}
}

export function replayPvp(
  host: TeamId,
  guest: TeamId,
  seed: number,
  commands: ClashCommand[],
  rules: Pick<ClashOptions, 'dealEarly'> = {},
): ClashState {
  return replayClash(host, guest, seed, commands, rules)
}

export function newPvpGame(
  host: TeamId,
  guest: TeamId,
  seed: number,
  rules: Pick<ClashOptions, 'dealEarly'> = {},
): ClashState {
  return createClash(host, guest, seed, rules)
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
    playLimit: clashPlayLimit(state, state.active),
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

/**
 * One row of the VS hub's game list. Silas, 2026-11-11 PT: "Practice is
 * redundant ... change it entirely to Vs which lets a user to manage games
 * between other users or cpu."
 */
export interface PvpGameSummary {
  id: string
  seat: Side
  myTeam: TeamId
  rivalTeam: TeamId | null
  stage: 'waiting' | 'battle' | 'finished' | 'expired'
  /** A friend's challenge waiting for this player to accept. */
  incoming: boolean
  /** Listed in VS for anyone to join. */
  open: boolean
  /** The other player's account, when known (the server adds the name). */
  rivalId: number | null
  rivalName?: string | null
  myTurn: boolean
  result: 'win' | 'loss' | 'draw' | null
  round: number
  bosses: { mine: number; rival: number } | null
  lastActionAt: string
}

/** Summarize a stored duel for one of its two players, or null for anyone else. */
export function pvpGameSummary(
  row: {
    id: string
    userId: number
    teamId: string
    foeId: string
    seed: number
    startedAt: Date
    settledAt: Date | null
    result: string | null
  },
  record: PvpRecord,
  viewer: number,
  now = Date.now(),
): PvpGameSummary | null {
  const incoming =
    record.guestId === null &&
    record.invitedId === viewer &&
    row.userId !== viewer
  const seat: Side | null =
    row.userId === viewer
      ? 'player'
      : record.guestId === viewer || incoming
        ? 'enemy'
        : null
  if (!seat || !isPvpTeam(row.teamId)) return null
  const joined = record.guestId !== null && isPvpTeam(row.foeId)
  const settled = row.settledAt !== null
  const state = joined
    ? replayPvp(
        row.teamId,
        row.foeId as TeamId,
        row.seed,
        record.commands,
        pvpRules(record),
      )
    : null
  const victor = settled
    ? (row.result as ClashState['victor'])
    : (state?.victor ?? null)
  const rival: Side = seat === 'player' ? 'enemy' : 'player'
  const expired = isPvpExpired(
    row.startedAt,
    record.lastActionAt,
    joined,
    settled,
    now,
  )
  const stage = expired
    ? 'expired'
    : !joined
      ? 'waiting'
      : victor
        ? 'finished'
        : 'battle'
  return {
    id: row.id,
    seat,
    myTeam: (seat === 'player' ? row.teamId : row.foeId) as TeamId,
    rivalTeam:
      seat === 'player'
        ? joined
          ? (row.foeId as TeamId)
          : null
        : (row.teamId as TeamId),
    stage,
    incoming,
    open: !!record.isPublic,
    rivalId:
      seat === 'player'
        ? (record.guestId ?? record.invitedId ?? null)
        : row.userId,
    myTurn: stage === 'battle' && state?.active === seat,
    result: victor
      ? victor === 'draw'
        ? 'draw'
        : victor === seat
          ? 'win'
          : 'loss'
      : null,
    round: state?.round ?? 0,
    bosses: state ? { mine: state.boss[seat], rival: state.boss[rival] } : null,
    lastActionAt: record.lastActionAt ?? row.startedAt.toISOString(),
  }
}

/** Wins, losses and draws across the finished games the VS list holds. */
export function pvpTally(games: Pick<PvpGameSummary, 'stage' | 'result'>[]): {
  win: number
  loss: number
  draw: number
} {
  const tally = { win: 0, loss: 0, draw: 0 }
  for (const game of games)
    if (game.stage === 'finished' && game.result) tally[game.result]++
  return tally
}

/** The VS hub lists games waiting on you first, then the most recent. */
export function sortPvpGames(games: PvpGameSummary[]): PvpGameSummary[] {
  const rank = (g: PvpGameSummary) =>
    g.incoming
      ? 0
      : g.myTurn
        ? 1
        : g.stage === 'battle'
          ? 2
          : g.stage === 'waiting'
            ? 3
            : 4
  return [...games].sort(
    (a, b) => rank(a) - rank(b) || b.lastActionAt.localeCompare(a.lastActionAt),
  )
}

/**
 * A duel board as an engine-shaped state for the viewer's own seat, so the
 * shared Clash hand and the legality helpers work client-side. Hidden zones
 * (rival hand, decks, discards) are placeholders of the right size; the
 * server stays the only authority on every move.
 */
export function pvpClashView(
  board: PvpBoard,
  seat: Side,
  hostTeam: TeamId,
  guestTeam: TeamId,
): ClashState {
  const hidden = (count: number) => Array.from({ length: count }, () => '')
  const bySeat = <T>(mine: T, theirs: T): Record<Side, T> =>
    seat === 'player'
      ? { player: mine, enemy: theirs }
      : { player: theirs, enemy: mine }
  return {
    seed: 0,
    rng: 0,
    teams: { player: hostTeam, enemy: guestTeam },
    round: board.round,
    active: board.active,
    phase: board.phase,
    plays: { ...board.plays },
    freePlays: {
      player: board.freePlays?.player ?? 0,
      enemy: board.freePlays?.enemy ?? 0,
    },
    boss: { ...board.boss },
    decks: bySeat(hidden(board.deckCount), hidden(board.opponentDeckCount)),
    hands: bySeat([...board.hand], hidden(board.opponentHandCount)),
    discards: bySeat(
      hidden(board.discardCount),
      hidden(board.opponentDiscardCount),
    ),
    units: board.units.map(({ power: _power, ...unit }) => ({
      ...unit,
      keywords: [...unit.keywords],
      gear: [...unit.gear],
    })),
    traps: board.traps.map((trap) => ({ ...trap })),
    log: board.log.map((entry) => ({ ...entry })),
    cursor: board.cursor,
    strike: board.strike ? { ...board.strike } : null,
    victor: board.victor,
    nextUid: 0,
    commands: [],
    levels: bySeat({ ...board.levels }, {}),
    deathMarks: { player: {}, enemy: {} },
    fallen: { player: [], enemy: [] },
    ...(board.format ? { format: board.format } : {}),
    ...(board.powersUsed
      ? {
          powersUsed: {
            player: [...board.powersUsed.player],
            enemy: [...board.powersUsed.enemy],
          },
        }
      : {}),
  }
}

/** Which row a card lands on: fighters and buffs mine, traps and attacks theirs. */
export function pvpCardRow(card: Card): 'own' | 'rival' {
  if (card.kind === 'creature') return 'own'
  if (
    card.kind === 'equipment' ||
    ['heal', 'armor', 'sharpen', 'boost', 'grant'].includes(card.effect ?? '')
  )
    return 'own'
  return 'rival'
}

/** A trap's side is its owner, not the battlefield row it occupies. */
export function visibleClashTrapAt(
  traps: ClashState['traps'],
  viewer: Side,
  row: Side,
  lane: number,
): ClashState['traps'][number] | undefined {
  if (row === viewer) return undefined
  return traps.find((trap) => trap.side === viewer && trap.lane === lane)
}
