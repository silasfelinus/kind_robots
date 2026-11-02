// Headless CPU-versus-CPU playtests for the three Slime City formats
// (conductor slime-city t-016). Both sides are driven by the same CPU from
// their own redacted views; every match is reproducible from its seed and
// replays exactly from its command record.
import {
  advance,
  cpuTurn,
  createMatch,
  TEAMS,
  type CardKind,
  type MatchState,
  type ModeId,
  type RuleVariants,
  type Side,
  type TeamId,
  type WinPath,
} from './prototypes'

export interface MatchMetrics {
  mode: ModeId
  playerTeam: TeamId
  enemyTeam: TeamId
  seed: number
  rounds: number
  victor: Side | 'draw'
  winPath: WinPath | null
  /** Round of the first damage, score or trap: the first visible consequence. */
  firstContact: number | null
  /** Rounds in which nothing moved, scored or lost HP. */
  deadRounds: number
  longestDeadStreak: number
  leadChanges: number
  /** The winner trailed by a clear margin at some point after round 2. */
  comeback: boolean
  clogs: number
  sidesteps: number
  plays: Record<Side, Record<CardKind, number>>
  knockouts: Record<Side, number>
  trapsSprung: number
  flagDrops: number
  explosions: number
  debt: number
  roots: number
  shoves: number
  /** Went to sudden-death extra time (t-003 overtime variant). */
  overtime: boolean
  finalScore: [number, number]
  commands: number
}

function hp(state: MatchState, side: Side): number {
  return state.units
    .filter((u) => u.side === side)
    .reduce((sum, u) => sum + u.hp, 0)
}

function boardKey(state: MatchState): string {
  const units = [...state.units]
    .sort((a, b) => a.id - b.id)
    .map(
      (u) =>
        u.id +
        '@' +
        u.x +
        ',' +
        u.y +
        ':' +
        u.hp +
        (u.carryingFlag ? ':flag' : ''),
    )
  const traps = [...state.traps]
    .map(
      (t) =>
        t.side +
        '@' +
        t.x +
        ',' +
        t.y +
        ':' +
        t.damage +
        ':' +
        Boolean(t.roots) +
        ':' +
        (t.debt ?? 0),
    )
    .sort()
  const monster = state.monster
    ? state.monster.x + ',' + state.monster.y + ':' + state.monster.hp
    : ''
  return JSON.stringify([units, traps, monster, state.score])
}

/** Positive when the player side leads. */
function lead(state: MatchState): number {
  if (state.mode === 'blackout') {
    const carrier = state.units.find((u) => u.carryingFlag)
    const flag = carrier ? (carrier.side === 'player' ? 4 : -4) : 0
    return hp(state, 'player') - hp(state, 'enemy') + flag
  }
  return (
    (state.score[0] - state.score[1]) * 6 +
    (hp(state, 'player') - hp(state, 'enemy')) * 0.25
  )
}

const MARGIN: Record<ModeId, number> = {
  blackout: 4,
  gridiron: 6,
  bloodrush: 6,
}

export function playHeadless(
  mode: ModeId,
  playerTeam: TeamId,
  enemyTeam: TeamId,
  seed: number,
  onRound?: (state: MatchState) => void,
  rules: Partial<RuleVariants> = {},
): { state: MatchState; metrics: MatchMetrics } {
  let state = createMatch(mode, playerTeam, enemyTeam, seed, rules)
  let firstContact: number | null = null
  let deadRounds = 0
  let streak = 0
  let longest = 0
  let leadChanges = 0
  let lastSign = 0
  let worstForPlayer = 0
  let worstForEnemy = 0
  for (let guard = 0; guard < 400 && !state.victor; guard++) {
    const round = state.round
    const before = boardKey(state)
    const scoreBefore = state.score[0] + state.score[1]
    const trapsBefore = state.stats.trapsSprung
    const knockoutsBefore =
      state.stats.knockouts.player + state.stats.knockouts.enemy
    const monsterHpBefore = state.monster?.hp ?? 0
    const hpBefore = hp(state, 'player') + hp(state, 'enemy')
    state = cpuTurn(state, 'player')
    state = advance(state)
    onRound?.(state)
    const hpAfter = hp(state, 'player') + hp(state, 'enemy')
    const scored = state.score[0] + state.score[1] !== scoreBefore
    const contact =
      scored ||
      state.stats.trapsSprung !== trapsBefore ||
      state.stats.knockouts.player + state.stats.knockouts.enemy >
        knockoutsBefore ||
      (state.monster?.hp ?? 0) < monsterHpBefore ||
      hpAfter < hpBefore
    if (firstContact === null && contact) firstContact = round
    if (boardKey(state) === before && !scored) {
      deadRounds++
      streak++
      longest = Math.max(longest, streak)
    } else streak = 0
    const l = lead(state)
    const sign = Math.sign(l)
    if (sign && lastSign && sign !== lastSign) leadChanges++
    if (sign) lastSign = sign
    if (round > 2) {
      worstForPlayer = Math.min(worstForPlayer, l)
      worstForEnemy = Math.max(worstForEnemy, l)
    }
  }
  const victor = state.victor ?? 'draw'
  const margin = MARGIN[mode]
  return {
    state,
    metrics: {
      mode,
      playerTeam,
      enemyTeam,
      seed,
      rounds: state.round,
      victor,
      winPath: state.winPath,
      firstContact,
      deadRounds,
      longestDeadStreak: longest,
      leadChanges,
      comeback:
        (victor === 'player' && worstForPlayer <= -margin) ||
        (victor === 'enemy' && worstForEnemy >= margin),
      clogs: state.stats.clogs,
      sidesteps: state.stats.sidesteps,
      plays: state.stats.plays,
      knockouts: state.stats.knockouts,
      trapsSprung: state.stats.trapsSprung,
      flagDrops: state.stats.flagDrops,
      explosions: state.stats.explosions,
      debt: state.stats.debt,
      roots: state.stats.roots,
      shoves: state.stats.shoves,
      overtime: state.overtime,
      finalScore: [state.score[0], state.score[1]],
      commands: state.commands.length,
    },
  }
}

/** Every ordered crew pairing (30) across a seed range, for one format. */
export function runTournament(
  mode: ModeId,
  seeds: number[],
  rules: Partial<RuleVariants> = {},
): MatchMetrics[] {
  const out: MatchMetrics[] = []
  for (const a of TEAMS)
    for (const b of TEAMS) {
      if (a.id === b.id) continue
      for (const seed of seeds)
        out.push(playHeadless(mode, a.id, b.id, seed, undefined, rules).metrics)
    }
  return out
}
