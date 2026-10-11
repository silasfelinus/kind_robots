// /utils/zuzuShowdown/arcade.ts
//
// Zuzu Showdown Arcade mode (conductor zuzu-showdown t-021): one player climbs a ladder of CPU fights
// against every other fighter, on a rising difficulty, then faces The Thing Behind the Door. The ladder's
// order is shuffled from a seed, except its end: the fighter's rival (fighters.yaml `rival`) is the
// second-to-last fight and the Swamp Witch, the Thing's avatar, the last before the door (her `arcade`
// role; playing as her, the rival is last). Losing a fight offers a continue, which keeps the climb and
// clears the score, so the leaderboard holds one-credit runs.
//
// The score comes from the match's own events, scaled by the chosen difficulty: damage dealt, a bonus
// for every hit deeper into a combo, READ!s, Perfect rounds, the time left on a round won, and a bonus
// for each fight won that grows up the ladder. Pure: no canvas, no storage.

import { INITIALS_ALPHABET, isAllowedInitials } from '../arcade/initials'
import { CPU_LEVELS, type CpuLevel } from './cpu'
import { FPS } from './sim'
import type { FighterData, MatchState, SimEvent } from './types'

/** The arcade's final boss, fought on the Thin Place once the ladder is climbed. */
export const BOSS_SLUG = 'thing-behind-the-door'
/** The Thing's avatar: the last fighter before the door. */
export const AVATAR_SLUG = 'swamp-witch'
/** The arcade leaderboard's game slug (utils/arcade/games.ts). */
export const ARCADE_GAME_SLUG = 'zuzu-showdown'

/** Each fighter's rival (conductor fighters.yaml `rival`): the second-to-last fight of their ladder. */
export const RIVALS: Record<string, string> = {
  zuzu: 'coyote-vagrant',
  'coyote-vagrant': 'river-croc',
  'the-abbess': 'the-siblings',
  'the-siblings': 'the-abbess',
  'storm-crow': 'hyena-matriarch',
  'river-croc': 'coyote-vagrant',
  'hyena-matriarch': 'storm-crow',
  'old-komodo': 'river-croc',
  'swamp-witch': 'the-abbess',
}

/** xorshift32, as the sim's own rng: the same seed always climbs the same ladder. */
function nextRandom(seed: number): number {
  let x = seed | 0 || 1
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return x >>> 0
}

/**
 * The CPU opponents of `player`'s climb, in order (the boss comes after them): every other fighter in
 * `roster`, shuffled by `seed`, then the rival, then the Swamp Witch.
 */
export function arcadeLadder(
  player: string,
  roster: readonly string[],
  seed: number,
): string[] {
  const rival = RIVALS[player]
  const tail = [rival, player === AVATAR_SLUG ? undefined : AVATAR_SLUG]
    .filter((slug): slug is string => !!slug && slug !== player)
    .filter((slug) => roster.includes(slug))
  const rest = roster.filter((slug) => slug !== player && !tail.includes(slug))
  let state = seed >>> 0 || 1
  for (let i = rest.length - 1; i > 0; i -= 1) {
    state = nextRandom(state)
    const j = state % (i + 1)
    ;[rest[i], rest[j]] = [rest[j]!, rest[i]!]
  }
  return [...rest, ...tail]
}

/**
 * The CPU's level on the `rung`-th fight (0-based) of `fights`: it climbs two steps from the chosen
 * level over the ladder (capped at Showdown), and the boss always fights at the top of it.
 */
export function rungLevel(
  start: CpuLevel,
  rung: number,
  fights: number,
): CpuLevel {
  const base = CPU_LEVELS.indexOf(start)
  const climb = fights <= 1 ? 2 : Math.floor((rung * 3) / fights)
  return CPU_LEVELS[Math.min(CPU_LEVELS.length - 1, base + Math.min(2, climb))]!
}

/** The score multiplier for the level the climb started on. */
export const DIFFICULTY_MULTIPLIER: Record<CpuLevel, number> = {
  kid: 1,
  normal: 2,
  hard: 3,
  showdown: 4,
}

export const SCORE = {
  /** Per point of damage the player deals. */
  damage: 1,
  /** Per hit, times its place in the combo past the first (a 4-hit combo pays 0+1+2+3 of these). */
  comboStep: 25,
  read: 1000,
  perfect: 10000,
  /** Per second left on the clock when the player takes a round. */
  timeSecond: 100,
  round: 5000,
  /** Per fight won, times the fight's place on the ladder (1-based). */
  fight: 10000,
  boss: 100000,
} as const

/** A score no honest run can pass (the arcade scores API rejects anything above it). */
export const MAX_PLAUSIBLE_SCORE = 50_000_000

export type ArcadeScore = {
  total: number
  /** Fights won this credit. */
  fights: number
  perfects: number
  reads: number
  bestCombo: number
}

export function newArcadeScore(): ArcadeScore {
  return { total: 0, fights: 0, perfects: 0, reads: 0, bestCombo: 0 }
}

/**
 * Add one sim step's worth of the player's (`side`) scoring to `score`. `state` is the match after the
 * step (for the clock and health at a KO), `fullHealth` the player's starting health (a Perfect ends the
 * round on it) and `multiplier` the difficulty's.
 */
export function scoreStep(
  score: ArcadeScore,
  events: readonly SimEvent[],
  state: MatchState,
  side: 0 | 1,
  fullHealth: number,
  multiplier: number,
): ArcadeScore {
  let gained = 0
  const next = { ...score }
  for (const event of events) {
    if (event.type === 'hit' && event.attacker === side) {
      gained += event.damage * SCORE.damage
      gained += Math.max(0, event.combo - 1) * SCORE.comboStep
      next.bestCombo = Math.max(next.bestCombo, event.combo)
    } else if (event.type === 'read' && event.side === side) {
      gained += SCORE.read
      next.reads += 1
    } else if (
      (event.type === 'ko' || event.type === 'timeOver') &&
      event.result === side
    ) {
      gained += SCORE.round
      gained += Math.floor(Math.max(0, state.timer) / FPS) * SCORE.timeSecond
      if (event.type === 'ko' && state.fighters[side].health >= fullHealth) {
        gained += SCORE.perfect
        next.perfects += 1
      }
    }
  }
  next.total += gained * multiplier
  return next
}

/** The bonus for winning the `rung`-th fight (0-based) of the ladder. */
export function fightBonus(
  score: ArcadeScore,
  rung: number,
  multiplier: number,
): ArcadeScore {
  return {
    ...score,
    total: score.total + SCORE.fight * (rung + 1) * multiplier,
    fights: score.fights + 1,
  }
}

/** Fighters with a rival and an ending: everyone on the select screen. */
export function arcadeReady(fighters: readonly FighterData[]): boolean {
  return fighters.every((f) => RIVALS[f.slug] && ENDINGS[f.slug])
}

// ---------------------------------------------------------------- endings

/** One still of an ending: its image (conductor art/T021-ENDINGS.yaml) and the line under it. */
export type EndingStill = { file: string; line: string }

/**
 * Each fighter's ending after the door shuts: two stills and a line each, in the narrator's voice (the
 * Swamp Witch tells hers as "we"). The stills ship to /zuzu-showdown-endings/<file>-<style>; until one
 * has rendered, the screen shows the fighter's victory portrait in its place.
 */
export const ENDINGS: Record<string, [EndingStill, EndingStill]> = {
  zuzu: [
    { file: 'zuzu-ending-1', line: 'The door is shut. Zuzu walks on.' },
    {
      file: 'zuzu-ending-2',
      line: 'At Hollow Bell the bell rings once. He listens.',
    },
  ],
  'coyote-vagrant': [
    {
      file: 'coyote-ending-1',
      line: 'He tells everyone he shut the door himself.',
    },
    {
      file: 'coyote-ending-2',
      line: 'Nobody listens. He found his old gun, though.',
    },
  ],
  'the-abbess': [
    {
      file: 'abbess-ending-1',
      line: 'She blessed the door shut, and kept the key.',
    },
    {
      file: 'abbess-ending-2',
      line: 'Every night she visits it, to keep it company.',
    },
  ],
  'the-siblings': [
    {
      file: 'siblings-ending-1',
      line: 'No more doors. Just the long walk home.',
    },
    {
      file: 'siblings-ending-2',
      line: 'The apples are ripe. He sleeps. She almost smiles.',
    },
  ],
  'storm-crow': [
    { file: 'crow-ending-1', line: 'The storm answered him tonight.' },
    {
      file: 'crow-ending-2',
      line: 'Tomorrow the whole sky flies under his sash.',
    },
  ],
  'river-croc': [
    {
      file: 'croc-ending-1',
      line: 'The water is quiet again. The water is his.',
    },
    {
      file: 'croc-ending-2',
      line: 'The old harpoon rusts on the bank. HSSSSS.',
    },
  ],
  'hyena-matriarch': [
    {
      file: 'hyena-ending-1',
      line: 'She laughed loudest of all at the door.',
    },
    {
      file: 'hyena-ending-2',
      line: 'She kept a piece of it. Lately it laughs back.',
    },
  ],
  'old-komodo': [
    { file: 'komodo-ending-1', line: 'He ate well. Now, a long sleep.' },
    {
      file: 'komodo-ending-2',
      line: 'The dunes will wake him in a hundred years.',
    },
  ],
  'swamp-witch': [
    {
      file: 'witch-ending-1',
      line: 'We went home. We left the door open a crack.',
    },
    {
      file: 'witch-ending-2',
      line: 'Just a crack. In case you want to make a deal.',
    },
  ],
}

// ---------------------------------------------------------------- initials

/** The three-initial name entry after a run: up and down turn a letter, LP takes it, HP steps back. */
export type InitialsEntry = {
  letters: [number, number, number]
  /** The letter being chosen (3 once all three are in). */
  pos: number
}

/** A fresh entry, starting from the player's last initials when they have some. */
export function newInitials(saved = ''): InitialsEntry {
  const at = (i: number) =>
    Math.max(0, INITIALS_ALPHABET.indexOf(saved[i] ?? 'A'))
  return { letters: [at(0), at(1), at(2)], pos: 0 }
}

export function initialsText(entry: InitialsEntry): string {
  return entry.letters.map((i) => INITIALS_ALPHABET[i]).join('')
}

/** Whether the entry is finished: all three taken, and allowed. */
export function initialsDone(entry: InitialsEntry): boolean {
  return entry.pos >= 3 && isAllowedInitials(initialsText(entry))
}

export type InitialsPress = {
  up?: boolean
  down?: boolean
  left?: boolean
  right?: boolean
  lp?: boolean
  hp?: boolean
  start?: boolean
}

export function advanceInitials(
  entry: InitialsEntry,
  press: InitialsPress,
): InitialsEntry {
  const letters: [number, number, number] = [...entry.letters]
  let pos = entry.pos
  const size = INITIALS_ALPHABET.length
  if (pos < 3) {
    if (press.up) letters[pos] = (letters[pos]! + 1) % size
    if (press.down) letters[pos] = (letters[pos]! + size - 1) % size
  }
  if (press.lp || press.right) pos = Math.min(3, pos + 1)
  else if (press.start) pos = 3
  else if (press.hp || press.left) pos = Math.max(0, pos - 1)
  // A blocked name goes back to its last letter rather than posting.
  if (pos >= 3 && !isAllowedInitials(initialsText({ letters, pos })))
    return { letters, pos: 2 }
  return { letters, pos }
}
