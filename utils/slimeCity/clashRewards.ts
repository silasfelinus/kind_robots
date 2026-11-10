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
  createClash,
  type ClashCommand,
  type ClashState,
} from './clash'
import type { BattleOutcome } from './progression'
import { CARDS, TEAMS, type TeamId } from './prototypes'

export type ClashRewardFormat = 'solo' | 'alliance'
/** What the server stores when it issues a Clash reward match. */
export type ClashRewardSetup =
  | { format: 'solo'; cards: string[] }
  | { format: 'alliance'; deck: AllianceDeck }

export const CLASH_REWARD_MODES = {
  solo: 'clash',
  alliance: 'clash-alliance',
} as const
export const CLASH_TRANSCRIPT_MAX = 2000

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
  return setup.format === 'alliance'
    ? createClash(teamId, foeId, seed, {
        alliance: { player: setup.deck, enemy: cpuAlliance(foeId, seed) },
      })
    : createClash(teamId, foeId, seed, { decks: { player: setup.cards } })
}

const SHAPES: Record<string, (c: Record<string, unknown>) => boolean> = {
  play: (c) =>
    typeof c.card === 'string' &&
    CARDS.some((card) => card.id === c.card) &&
    Number.isSafeInteger(c.lane) &&
    (c.choice === undefined || c.choice === 1),
  power: (c) => Number.isSafeInteger(c.lane),
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
export function clashOutcome(matchId: string, s: ClashState): BattleOutcome {
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
  }
}
