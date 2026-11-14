// Server-verified Clash reward matches (Silas, 2026-11-08 PT: "make a solo or
// alliance clash deck and play against cpu ... earning rewards and opening
// packs"). The server issues the seed and rival, keeps the player's deck, and
// pays only for a transcript it can replay exactly: every CPU command must be
// the one chooseClashCpu would pick, and every command must change the state.
import {
  allianceProblems,
  cpuAlliance,
  soloProblems,
  type AllianceDeck,
} from './alliance'
import {
  applyClashCommand,
  chooseClashCpu,
  CLASH_BOSS_RANGE,
  createClash,
  type ClashCommand,
  type ClashState,
} from './clash'
import { clashMatchReport, reportMeat } from './matchReport'
import type { BattleOutcome } from './progression'
import { CARDS, TEAMS, type Side, type TeamId } from './prototypes'

export type ClashRewardFormat = 'solo' | 'alliance'
/**
 * Silas, 2026-11-10 PT: "bounties and rewards should be activated", then "Do
 * it" to SOLO story, CAMPAIGN and TOWER fights paying out like PRACTICE. A
 * bout brings its own rival and boss life (its story terms); the server checks
 * the terms stay inside the Clash band and replays the fight like any other.
 */
export const CLASH_BOUT_KINDS = [
  'rival',
  'contract',
  'campaign',
  'tower',
] as const
export type ClashBoutKind = (typeof CLASH_BOUT_KINDS)[number]
export interface ClashBoutTerms {
  kind: ClashBoutKind
  bosses: Record<Side, number>
}
/** What the server stores when it issues a Clash reward match. */
export type ClashRewardSetup = (
  | { format: 'solo'; cards: string[] }
  | { format: 'alliance'; deck: AllianceDeck }
) & { bout?: ClashBoutTerms }

export const CLASH_REWARD_MODES = {
  solo: 'clash',
  alliance: 'clash-alliance',
} as const
export const CLASH_TRANSCRIPT_MAX = 2000

/** The stored match mode: PRACTICE by format, bouts by kind. */
export function clashRewardMode(setup: ClashRewardSetup): string {
  return setup.bout
    ? 'clash-' + setup.bout.kind
    : CLASH_REWARD_MODES[setup.format]
}

/** Why bout terms are unusable, or ''. */
export function clashBoutProblem(format: unknown, raw: unknown): string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return 'Malformed bout terms.'
  const v = raw as Record<string, unknown>
  if (!CLASH_BOUT_KINDS.includes(v.kind as ClashBoutKind))
    return 'Unknown bout.'
  if (v.kind === 'tower' && format !== 'alliance')
    return 'Tower fights deal an Alliance deck.'
  const bosses = v.bosses as Record<string, unknown> | null
  const [low, high] = CLASH_BOSS_RANGE
  const life = (n: unknown) =>
    Number.isSafeInteger(n) && (n as number) >= low && (n as number) <= high
  if (
    !bosses ||
    typeof bosses !== 'object' ||
    !life(bosses.player) ||
    !life(bosses.enemy)
  )
    return 'Boss life must stay between ' + low + ' and ' + high + '.'
  return ''
}

const isTeam = (v: unknown): v is TeamId =>
  typeof v === 'string' && TEAMS.some((t) => t.id === v)

/** Why a client-proposed reward deck is unusable for `teamId`, or ''. */
export function clashRewardSetupProblem(
  teamId: string,
  setup: unknown,
): string {
  if (!isTeam(teamId)) return 'Unknown Slime City crew.'
  if (!setup || typeof setup !== 'object') return 'Choose a Clash deck.'
  const v = setup as Record<string, unknown>
  if (v.bout !== undefined) {
    const problem = clashBoutProblem(v.format, v.bout)
    if (problem) return problem
  }
  if (v.format === 'solo') {
    if (!Array.isArray(v.cards) || v.cards.length > 60)
      return 'Malformed Solo deck.'
    const problems = soloProblems(teamId, v.cards as string[])
    return problems.length ? problems.join(' · ') : ''
  }
  if (v.format === 'alliance') {
    const deck = v.deck as AllianceDeck | undefined
    if (!deck || typeof deck !== 'object' || !Array.isArray(deck.cards))
      return 'Malformed Alliance deck.'
    if (deck.general !== teamId) return 'Your general must be your crew.'
    const problems = allianceProblems(deck)
    return problems.length ? problems.join(' · ') : ''
  }
  return 'Choose SOLO or ALLIANCE.'
}

/** The cards a setup brings, for TRICKLE ownership checks. */
export function clashRewardCards(setup: ClashRewardSetup): string[] {
  return setup.format === 'solo' ? setup.cards : setup.deck.cards
}

/** The exact opening state for an issued match. */
export function clashRewardStart(
  teamId: TeamId,
  foeId: TeamId,
  seed: number,
  setup: ClashRewardSetup,
): ClashState {
  const bosses = setup.bout ? { bosses: setup.bout.bosses } : {}
  return setup.format === 'alliance'
    ? createClash(teamId, foeId, seed, {
        alliance: { player: setup.deck, enemy: cpuAlliance(foeId, seed) },
        ...bosses,
      })
    : createClash(teamId, foeId, seed, {
        decks: { player: setup.cards },
        ...bosses,
      })
}

const SHAPES: Record<string, (c: Record<string, unknown>) => boolean> = {
  play: (c) =>
    typeof c.card === 'string' &&
    CARDS.some((card) => card.id === c.card) &&
    Number.isSafeInteger(c.lane) &&
    (c.choice === undefined || c.choice === 1),
  power: (c) =>
    Number.isSafeInteger(c.lane) &&
    (c.team === undefined || typeof c.team === 'string'),
  activate: (c) => Number.isSafeInteger(c.uid) && Number(c.uid) > 0,
  pass: () => true,
  strike: () => true,
  end: () => true,
}

/**
 * Replay a client transcript from the issued start. Returns the finished state
 * or a reason it is rejected. Pure, so tests and the server share it.
 */
export function replayClashTranscript(
  start: ClashState,
  commands: unknown,
): { state: ClashState } | { error: string } {
  if (
    !Array.isArray(commands) ||
    commands.length < 3 ||
    commands.length > CLASH_TRANSCRIPT_MAX
  )
    return { error: 'Incomplete or oversized battle transcript.' }
  let s = start
  for (const raw of commands) {
    if (!raw || typeof raw !== 'object') return { error: 'Bad battle command.' }
    const c = raw as Record<string, unknown>
    if (
      typeof c.t !== 'string' ||
      !SHAPES[c.t]?.(c) ||
      (c.side !== 'player' && c.side !== 'enemy')
    )
      return { error: 'Bad battle command.' }
    if (s.victor) return { error: 'Commands after the match ended.' }
    if (c.side !== s.active) return { error: 'Out-of-turn command.' }
    if (s.active === 'enemy') {
      const expected = chooseClashCpu(s, 'enemy')
      if (JSON.stringify(expected) !== JSON.stringify(c))
        return { error: 'CPU commands do not match the server CPU.' }
    }
    const next = applyClashCommand(s, c as unknown as ClashCommand)
    if (next === s) return { error: 'Illegal battle command.' }
    s = next
  }
  if (!s.victor) return { error: 'Match is incomplete.' }
  if (!s.commands.some((c) => c.t === 'play' && c.side === 'player'))
    return { error: 'Battle needs played cards and real turns.' }
  return { state: s }
}

/** Reward ledger entry for a verified Clash match. */
export function clashOutcome(
  matchId: string,
  s: ClashState,
  storedMode = '',
): BattleOutcome {
  const bout = CLASH_BOUT_KINDS.find((kind) => storedMode === 'clash-' + kind)
  return {
    victor: s.victor!,
    receipt: JSON.stringify(['clash', matchId]),
    mode: 'clash',
    teamId: s.teams.player,
    plays: s.commands
      .filter(
        (c): c is Extract<ClashCommand, { t: 'play' }> =>
          c.t === 'play' && c.side === 'player',
      )
      .map((c) => c.card),
    meat: reportMeat(clashMatchReport(s)),
    ...(bout ? { bout } : {}),
    topLevel: Math.max(1, ...Object.values(s.levels?.player ?? {})),
  }
}
