// The after-match reward screen (Silas, 2026-11-11 PT): "We need an actual
// reward screen which shows the meat earned after a match. Even losing should
// earn some, but winning is more, with benefits for not taking damage. Notice
// and comment on oddities (no level threes played, fast game, close call,
// etc)". Pure: the server pays exactly these lines for a replayed match and
// the client draws the same report from the same final state.
import { clashBossCap, type ClashState } from './clash'

export interface MeatLine {
  label: string
  meat: number
}
export interface MatchReport {
  victor: ClashState['victor']
  rounds: number
  bossLeft: number
  bossMax: number
  rivalLeft: number
  rivalMax: number
  /** Cards that reached level three this match. */
  levelThrees: number
  knockouts: number
  powersFired: number
  cardsPlayed: number
  meat: MeatLine[]
  notes: string[]
}

/** Thresholds from 600 CPU-vs-CPU games (2026-11-11): rounds p10 7, p90 12;
 * a winner keeps a median 35% of boss life, p20 ~15%, p90 65%. */
export const REPORT_FAST_ROUNDS = 7
export const REPORT_LONG_ROUNDS = 12
export const REPORT_CLOSE_SHARE = 0.15
export const REPORT_BLOWOUT_SHARE = 0.65

/** Base pay. Even a loss pays; a win pays most. */
export const MATCH_BASE_MEAT = { win: 45, draw: 15, loss: 10 } as const
/** Up to this much more for boss life kept (wins and draws). */
export const MATCH_LIFE_KEPT_MEAT = 15
/** A win without a scratch on your boss. */
export const MATCH_FLAWLESS_MEAT = 10
/** A loss still pays for damage dealt, up to this. */
export const MATCH_GRIT_MEAT = 10
/** One Meat per rival fighter knocked out, up to this. */
export const MATCH_KNOCKOUT_MEAT_MAX = 5

export function clashMatchReport(s: ClashState): MatchReport {
  const bossMax = clashBossCap(s, 'player')
  const rivalMax = clashBossCap(s, 'enemy')
  const bossLeft = Math.max(0, Math.min(bossMax, s.boss.player))
  const rivalLeft = Math.max(0, Math.min(rivalMax, s.boss.enemy))
  const levelThrees = Object.values(s.levels.player).filter(
    (lv) => lv >= 3,
  ).length
  const knockouts = s.fallen?.enemy.length ?? 0
  const powersFired = s.powersUsed?.player.length ?? 0
  const cardsPlayed = s.commands.filter(
    (c) => c.t === 'play' && c.side === 'player',
  ).length
  const win = s.victor === 'player'
  const draw = s.victor === 'draw'
  const kept = bossLeft / bossMax
  const dealt = (rivalMax - rivalLeft) / rivalMax

  const meat: MeatLine[] = [
    win
      ? { label: 'Victory', meat: MATCH_BASE_MEAT.win }
      : draw
        ? { label: 'Draw at the bell', meat: MATCH_BASE_MEAT.draw }
        : { label: 'Showed up and fought', meat: MATCH_BASE_MEAT.loss },
  ]
  if (win || draw) {
    const lifeKept = Math.round(MATCH_LIFE_KEPT_MEAT * kept)
    if (lifeKept > 0)
      meat.push({
        label: `Boss life kept · ${bossLeft}/${bossMax}`,
        meat: lifeKept,
      })
  }
  if (win && bossLeft >= bossMax)
    meat.push({ label: 'Flawless: not a scratch', meat: MATCH_FLAWLESS_MEAT })
  if (!win && !draw) {
    const grit = Math.round(MATCH_GRIT_MEAT * dealt)
    if (grit > 0)
      meat.push({
        label: `Damage dealt · ${rivalMax - rivalLeft}/${rivalMax}`,
        meat: grit,
      })
  }
  const koMeat = Math.min(MATCH_KNOCKOUT_MEAT_MAX, knockouts)
  if (koMeat > 0)
    meat.push({
      label: `Knockouts · ${knockouts}`,
      meat: koMeat,
    })

  const notes: string[] = []
  if (win && bossLeft >= bossMax)
    notes.push('Flawless. Your boss never took a hit.')
  else if (win && kept <= REPORT_CLOSE_SHARE)
    notes.push(`Close call. You won with ${bossLeft} boss life left.`)
  else if (win && kept >= REPORT_BLOWOUT_SHARE)
    notes.push(`Blowout. You kept ${bossLeft} of ${bossMax} boss life.`)
  if (!win && !draw && rivalLeft / rivalMax <= REPORT_CLOSE_SHARE)
    notes.push(`So close. Their boss hung on with ${rivalLeft} life.`)
  if (!win && !draw && dealt === 0) notes.push('Their boss never took a hit.')
  if (draw) notes.push('Dead even at the final bell.')
  if (s.round <= REPORT_FAST_ROUNDS)
    notes.push(`Fast game. Over in ${s.round} rounds.`)
  else if (s.round >= REPORT_LONG_ROUNDS)
    notes.push(`Long haul. ${s.round} rounds in the pit.`)
  if (!levelThrees) notes.push('No level-three evolutions played.')
  else if (levelThrees >= 3)
    notes.push(`Evolution engine. ${levelThrees} cards reached level three.`)
  if (!powersFired) notes.push('Your faction power never fired.')
  if (!knockouts) notes.push('No knockouts. Every rival fighter walked away.')
  else if (knockouts >= 6)
    notes.push(`Wrecking crew. ${knockouts} rival fighters knocked out.`)

  return {
    victor: s.victor,
    rounds: s.round,
    bossLeft,
    bossMax,
    rivalLeft,
    rivalMax,
    levelThrees,
    knockouts,
    powersFired,
    cardsPlayed,
    meat,
    notes,
  }
}

/** The Meat a report earns before the daily cap. */
export function reportMeat(report: Pick<MatchReport, 'meat'>): number {
  return report.meat.reduce((sum, line) => sum + line.meat, 0)
}
