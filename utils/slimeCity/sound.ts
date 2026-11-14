/**
 * Slime City's music and sound effects, synthesised with WebAudio through the
 * arcade kit (`utils/arcade/sound.ts`), so there are no audio files to render,
 * ship or license.
 *
 * - Four music loops: TITLE for the opening menu and hubs, CITY for the
 *   Journey streets, BATTLE for a Clash, and SHOWDOWN once either boss is low.
 * - Regular effects every fight uses: a bell, plays, spells, traps, gear,
 *   strikes, knockouts, boss hits, the turn chime and the final result.
 * - Unique effects: each crew has its own voice for a summon, a strike and its
 *   one-time faction power, each attack style its own hit, and each evolution
 *   moment its own flourish.
 *
 * `clashSoundCues` is a pure diff of two board views, so the rules engine never
 * knows sound exists and replays stay silent and deterministic.
 */
import type { MusicLoop, Note } from '../arcade/sound'
import type {
  ClashCommand,
  ClashEvolutionMoment,
  ClashState,
  ClashStrike,
} from './clash'
import {
  cardById,
  type AttackStyle,
  type Side,
  type TeamId,
} from './prototypes'

export type SlimeMusic = 'title' | 'city' | 'battle' | 'showdown'
export type Crew = TeamId | 'mercenary'

export type SlimeCue =
  | 'nav'
  | 'select'
  | 'pack'
  | 'bell'
  | 'your-turn'
  | 'spell'
  | 'trap-set'
  | 'trap-spring'
  | 'gear'
  | 'evolve'
  | 'legend'
  | 'boss-hit'
  | 'ko'
  | 'victory'
  | 'defeat'
  | 'draw'
  | `summon-${Crew}`
  | `strike-${Crew}`
  | `style-${AttackStyle}`
  | `power-${TeamId}`
  | `evo-${ClashEvolutionMoment['effect']}`

export const SLIME_CREWS: readonly Crew[] = [
  'catgirls',
  'bloodfairies',
  'ironjaw',
  'riot',
  'undertow',
  'exchange',
  'mercenary',
]
export const SLIME_TEAMS: readonly TeamId[] = [
  'catgirls',
  'bloodfairies',
  'ironjaw',
  'riot',
  'undertow',
  'exchange',
]
export const ATTACK_STYLES: readonly AttackStyle[] = [
  'claw',
  'arrow',
  'spell',
  'sword',
  'hammer',
  'blast',
]
export const EVOLUTION_EFFECTS: readonly ClashEvolutionMoment['effect'][] = [
  'summon',
  'heal',
  'blast',
  'control',
  'strike',
]

// ---------------------------------------------------------------- music

/**
 * TITLE, "Slime City Strut": a swaggering E-minor bass line under a sly
 * square-wave hook, the neon sign buzzing over an empty coliseum.
 */
const TITLE: MusicLoop = {
  bpm: 100,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps:
        'E2 . E2 B2 . E2 D3 . E2 . E2 B2 . G2 A2 . ' +
        'C3 . C3 G2 . C3 B2 . B1 . B1 F#2 . A2 B2 .',
    },
    {
      type: 'square',
      vol: 0.022,
      steps:
        'B4 - G4 . E4 . G4 A4 B4 - - . D5 - B4 . ' +
        'A4 - G4 . E4 - G4 . F#4 - - - . . . .',
    },
    {
      noise: true,
      vol: 0.03,
      steps:
        '. . x . . . x . . . x . . . x x ' + '. . x . . . x . . . x . x . x .',
    },
  ],
}

/**
 * CITY, "Gutter Neon": a slower, wetter walk for the Journey streets, a
 * sine lead dripping over a D-dorian bass.
 */
const CITY: MusicLoop = {
  bpm: 88,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps:
        'D2 . . A2 D3 . C3 . G2 . . D3 G2 . A2 . ' +
        'D2 . . A2 D3 . F3 . C3 . . G2 A2 . C3 .',
    },
    {
      type: 'sine',
      vol: 0.05,
      steps:
        'F4 - - E4 D4 - A4 - - - G4 - F4 - E4 - ' +
        'F4 - - G4 A4 - C5 - B4 - - A4 G4 - - .',
    },
    {
      noise: true,
      vol: 0.02,
      steps:
        '. . . . x . . . . . . . x . . . ' + '. . . . x . . . . . . . x . x .',
    },
  ],
}

/**
 * BATTLE, "Coliseum Brawl": a driving A-minor octave bass, a sawtooth riff and
 * a backbeat that never sits still.
 */
const BATTLE: MusicLoop = {
  bpm: 138,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.03,
      steps:
        'A1 A2 A1 A2 A1 A2 G2 A2 F1 F2 F1 F2 G1 G2 G1 G2 ' +
        'A1 A2 A1 A2 A1 A2 C3 A2 E1 E2 E1 E2 E2 G#2 B2 E2',
    },
    {
      type: 'square',
      vol: 0.022,
      steps:
        'A4 . C5 . E5 - D5 C5 . . A4 . G4 - E4 . ' +
        'F4 . A4 . C5 - B4 A4 G#4 - - - E4 - - .',
    },
    {
      noise: true,
      vol: 0.035,
      steps:
        'x . x . x . x x x . x . x . x x ' + 'x . x . x . x x x . x x x x x x',
    },
  ],
}

/**
 * SHOWDOWN, "Last Boss Standing": a boss is nearly out, so the tempo jumps,
 * the bass climbs chromatically and the lead screams.
 */
const SHOWDOWN: MusicLoop = {
  bpm: 168,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.032,
      steps:
        'D2 D2 D3 D2 Eb2 Eb2 Eb3 Eb2 E2 E2 E3 E2 F2 F2 F3 F2 ' +
        'D2 D2 D3 D2 Bb1 Bb1 Bb2 Bb1 A1 A1 A2 A1 A1 C#2 E2 A2',
    },
    {
      type: 'square',
      vol: 0.024,
      steps:
        'D5 - A4 - D5 - Eb5 - E5 - Bb4 - E5 - F5 - ' +
        'D5 - F5 - A5 - - - G5 F5 E5 D5 C#5 - - -',
    },
    {
      noise: true,
      vol: 0.04,
      steps:
        'x . x x x . x x x . x x x . x x ' + 'x . x x x . x x x x x x x x x x',
    },
  ],
}

export const SLIME_MUSIC: Record<SlimeMusic, MusicLoop> = {
  title: TITLE,
  city: CITY,
  battle: BATTLE,
  showdown: SHOWDOWN,
}

/** Boss life at or under this, on either side, turns BATTLE into SHOWDOWN. */
export const SHOWDOWN_BOSS_LIFE = 10

export type SlimeView =
  | 'home'
  | 'settings'
  | 'city'
  | 'arena'
  | 'alleys'
  | 'clash'
  | 'cards'
  | 'campaign'
  | 'rewards'
  | 'tower'
  | 'vs'

/** The loop a Slime City screen plays; `tense` is a fight with a boss low. */
export function slimeMusicFor(view: SlimeView, tense = false): SlimeMusic {
  if (view === 'clash' || view === 'arena' || view === 'alleys')
    return tense ? 'showdown' : 'battle'
  if (view === 'city' || view === 'campaign') return 'city'
  return 'title'
}

/** Whether either boss is low enough for the SHOWDOWN loop. */
export function clashIsTense(
  boss: Record<Side, number>,
  victor: ClashState['victor'],
): boolean {
  if (victor) return false
  return Math.min(boss.player, boss.enemy) <= SHOWDOWN_BOSS_LIFE
}

// ---------------------------------------------------------------- on/off

export interface SlimeAudioPrefs {
  version: 1
  sound: boolean
  music: boolean
  effects: boolean
}

/** Sound, music and effects all start on (the Zuzu Showdown precedent). */
export function parseSlimeAudioPrefs(raw: unknown): SlimeAudioPrefs {
  const data =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const on = (value: unknown) => value !== false
  return {
    version: 1,
    sound: data.version === 1 ? on(data.sound) : true,
    music: data.version === 1 ? on(data.music) : true,
    effects: data.version === 1 ? on(data.effects) : true,
  }
}

// ---------------------------------------------------------------- effects

const n = (
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  at = 0,
  to?: number,
): Note => ({ freq, dur, type, vol, at, ...(to ? { to } : {}) })
/** A burst of white noise: the arcade kit plays it unfiltered, so only length and level shape it. */
const hit = (dur: number, vol: number, at = 0): Note => ({
  freq: 1,
  dur,
  vol,
  at,
  noise: true,
})

/** Each crew's voice: the sound of it landing a fighter, and of its blows. */
const CREW_SUMMON: Record<Crew, Note[]> = {
  // A cat's yowl: a square chirp up, then a sly slide down.
  catgirls: [
    n(620, 0.09, 'square', 0.05, 0, 980),
    n(980, 0.16, 'square', 0.045, 0.09, 560),
  ],
  // Fairy dust, but sharp: a high minor sparkle.
  bloodfairies: [
    n(1319, 0.08, 'triangle', 0.07),
    n(1568, 0.08, 'triangle', 0.07, 0.06),
    n(1865, 0.08, 'triangle', 0.06, 0.12),
    n(2637, 0.2, 'sine', 0.05, 0.18),
  ],
  // A lizard's low hiss-growl and a scale-rattle.
  ironjaw: [n(98, 0.32, 'sawtooth', 0.08, 0, 73), hit(0.18, 0.06, 0.04)],
  // Gene Riot: a stuttering punk power chord.
  riot: [
    n(196, 0.06, 'square', 0.05),
    n(196, 0.06, 'square', 0.05, 0.08),
    n(294, 0.18, 'square', 0.05, 0.16),
    n(392, 0.18, 'square', 0.035, 0.16),
  ],
  // Undertow: a bubble rising through the sewer.
  undertow: [
    n(240, 0.16, 'sine', 0.09, 0, 720),
    n(360, 0.12, 'sine', 0.07, 0.12, 1080),
  ],
  // The Meat Exchange: a cash-register ching and an occult organ hum.
  exchange: [
    n(2093, 0.05, 'square', 0.04),
    n(2637, 0.14, 'triangle', 0.06, 0.05),
    n(131, 0.36, 'sawtooth', 0.04, 0.05),
    n(139, 0.36, 'sawtooth', 0.04, 0.05),
  ],
  mercenary: [
    n(440, 0.07, 'square', 0.045),
    n(660, 0.12, 'square', 0.045, 0.07),
  ],
}

const CREW_STRIKE: Record<Crew, Note[]> = {
  catgirls: [hit(0.07, 0.1), n(900, 0.08, 'square', 0.04, 0.02, 1400)],
  bloodfairies: [hit(0.05, 0.08), n(1760, 0.1, 'triangle', 0.06, 0.02, 880)],
  ironjaw: [hit(0.14, 0.16), n(82, 0.18, 'sawtooth', 0.07, 0, 55)],
  riot: [hit(0.1, 0.13), n(262, 0.1, 'square', 0.05, 0.02, 196)],
  undertow: [hit(0.12, 0.1), n(520, 0.16, 'sine', 0.08, 0, 160)],
  exchange: [hit(0.08, 0.1), n(185, 0.16, 'sawtooth', 0.05, 0.02, 92)],
  mercenary: [hit(0.08, 0.11), n(300, 0.1, 'triangle', 0.06, 0, 150)],
}

const STYLE_STRIKE: Record<AttackStyle, Note[]> = {
  claw: [hit(0.05, 0.1), hit(0.05, 0.09, 0.05), hit(0.06, 0.08, 0.1)],
  arrow: [n(2400, 0.12, 'sine', 0.05, 0, 900), hit(0.05, 0.1, 0.12)],
  spell: [
    n(880, 0.18, 'triangle', 0.06, 0, 1760),
    n(1320, 0.18, 'sine', 0.04, 0.05, 2640),
  ],
  sword: [hit(0.08, 0.09), n(3136, 0.22, 'triangle', 0.04, 0.02)],
  hammer: [hit(0.2, 0.2), n(70, 0.25, 'sine', 0.12, 0, 45)],
  blast: [hit(0.35, 0.2), n(160, 0.35, 'sawtooth', 0.06, 0, 40)],
}

/** One-time faction powers: each crew's loudest, strangest moment. */
const POWER: Record<TeamId, Note[]> = {
  // Nine Lives: a full yowl chorus climbing three times.
  catgirls: [
    n(520, 0.16, 'square', 0.05, 0, 1040),
    n(620, 0.16, 'square', 0.05, 0.16, 1240),
    n(740, 0.3, 'square', 0.05, 0.32, 1480),
    n(1480, 0.4, 'triangle', 0.05, 0.62, 740),
  ],
  // A swarm of wings: fast detuned trills.
  bloodfairies: [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      n(i % 2 ? 1760 : 1661, 0.06, 'triangle', 0.05, i * 0.05),
    ),
    n(3520, 0.4, 'sine', 0.04, 0.4, 1760),
  ],
  // The jaw slams shut: a sub drop and a crunch.
  ironjaw: [
    n(196, 0.5, 'sawtooth', 0.09, 0, 41),
    hit(0.3, 0.2, 0.12),
    hit(0.3, 0.18, 0.3),
  ],
  // A mutation siren.
  riot: [
    n(440, 0.25, 'square', 0.05, 0, 880),
    n(880, 0.25, 'square', 0.05, 0.25, 440),
    n(440, 0.25, 'square', 0.05, 0.5, 880),
    hit(0.2, 0.12, 0.75),
  ],
  // The tide pulls under: a long sinking wave.
  undertow: [
    hit(0.9, 0.08),
    n(660, 0.9, 'sine', 0.08, 0, 110),
    n(330, 0.9, 'sine', 0.06, 0.1, 55),
  ],
  // The Exchange opens its ledger: an organ cluster and three coins.
  exchange: [
    n(110, 0.9, 'sawtooth', 0.04),
    n(117, 0.9, 'sawtooth', 0.04),
    n(165, 0.9, 'sawtooth', 0.035),
    n(2637, 0.06, 'square', 0.04, 0.2),
    n(2637, 0.06, 'square', 0.04, 0.35),
    n(3136, 0.2, 'square', 0.04, 0.5),
  ],
}

const EVOLUTION: Record<ClashEvolutionMoment['effect'], Note[]> = {
  summon: [n(392, 0.12, 'triangle', 0.06), n(784, 0.2, 'triangle', 0.06, 0.1)],
  heal: [
    n(523, 0.2, 'sine', 0.07),
    n(659, 0.2, 'sine', 0.07, 0.1),
    n(784, 0.3, 'sine', 0.07, 0.2),
  ],
  blast: [hit(0.4, 0.18), n(220, 0.4, 'sawtooth', 0.06, 0, 55)],
  control: [
    n(300, 0.4, 'sine', 0.07, 0, 600),
    n(450, 0.4, 'sine', 0.05, 0.05, 225),
  ],
  strike: [hit(0.08, 0.12), n(1200, 0.14, 'square', 0.04, 0.03, 300)],
}

const GENERAL: Record<string, Note[]> = {
  nav: [n(660, 0.04, 'square', 0.03)],
  select: [n(880, 0.04, 'square', 0.03), n(1320, 0.06, 'square', 0.03, 0.04)],
  pack: [
    hit(0.2, 0.07),
    n(523, 0.08, 'square', 0.04, 0.18),
    n(659, 0.08, 'square', 0.04, 0.26),
    n(784, 0.08, 'square', 0.04, 0.34),
    n(1047, 0.3, 'triangle', 0.06, 0.42),
  ],
  // The coliseum bell: two struck partials.
  bell: [
    n(587, 0.9, 'sine', 0.08),
    n(1397, 0.6, 'sine', 0.035),
    n(587, 0.9, 'sine', 0.06, 0.35),
  ],
  'your-turn': [
    n(784, 0.08, 'triangle', 0.06),
    n(1175, 0.14, 'triangle', 0.06, 0.08),
  ],
  spell: [
    n(1047, 0.1, 'sine', 0.05, 0, 2093),
    n(1568, 0.16, 'triangle', 0.04, 0.06),
    n(2093, 0.2, 'sine', 0.03, 0.12),
  ],
  'trap-set': [hit(0.03, 0.08), n(180, 0.06, 'square', 0.04, 0.03)],
  'trap-spring': [hit(0.04, 0.16), n(150, 0.2, 'square', 0.06, 0.02, 60)],
  gear: [
    n(1600, 0.05, 'square', 0.04),
    hit(0.05, 0.07, 0.05),
    n(800, 0.1, 'triangle', 0.05, 0.08),
  ],
  evolve: [
    n(330, 0.4, 'sawtooth', 0.035, 0, 990),
    n(660, 0.2, 'triangle', 0.05, 0.3),
    n(990, 0.25, 'triangle', 0.05, 0.4),
  ],
  // Level three: a full major chord over a sub thump.
  legend: [
    n(55, 0.5, 'sine', 0.12),
    n(262, 0.9, 'sawtooth', 0.03, 0.05),
    n(330, 0.9, 'sawtooth', 0.03, 0.05),
    n(392, 0.9, 'sawtooth', 0.03, 0.05),
    n(1047, 0.6, 'triangle', 0.05, 0.2),
  ],
  'boss-hit': [hit(0.25, 0.18), n(110, 0.25, 'sine', 0.12, 0, 55)],
  // A knockout: a squelch, because everyone in Slime City is a little slimy.
  ko: [n(400, 0.25, 'sine', 0.1, 0, 70), hit(0.2, 0.12, 0.05)],
  victory: [
    n(523, 0.12, 'square', 0.05),
    n(659, 0.12, 'square', 0.05, 0.12),
    n(784, 0.12, 'square', 0.05, 0.24),
    n(1047, 0.18, 'square', 0.05, 0.36),
    n(784, 0.1, 'square', 0.05, 0.56),
    n(1047, 0.6, 'square', 0.055, 0.68),
    n(131, 0.8, 'triangle', 0.08, 0.68),
  ],
  // The sad trombone, slime-flavoured.
  defeat: [
    n(392, 0.25, 'sawtooth', 0.06, 0, 370),
    n(370, 0.25, 'sawtooth', 0.06, 0.28, 349),
    n(349, 0.25, 'sawtooth', 0.06, 0.56, 330),
    n(330, 0.9, 'sawtooth', 0.065, 0.84, 165),
  ],
  draw: [n(440, 0.3, 'triangle', 0.06), n(415, 0.5, 'triangle', 0.06, 0.3)],
}

/** The notes a cue plays (empty for an unknown cue, never a throw). */
export function slimeCueNotes(cue: SlimeCue): Note[] {
  const [head, ...rest] = cue.split('-')
  const tail = rest.join('-')
  if (head === 'summon') return CREW_SUMMON[tail as Crew] ?? []
  if (head === 'strike') return CREW_STRIKE[tail as Crew] ?? []
  if (head === 'style') return STYLE_STRIKE[tail as AttackStyle] ?? []
  if (head === 'power') return POWER[tail as TeamId] ?? []
  if (head === 'evo')
    return EVOLUTION[tail as ClashEvolutionMoment['effect']] ?? []
  return GENERAL[cue] ?? []
}

/** Seconds a cue sounds for, from its first note to the end of its last. */
export function slimeCueSeconds(cue: SlimeCue): number {
  return slimeCueNotes(cue).reduce(
    (end, note) => Math.max(end, (note.at ?? 0) + note.dur),
    0,
  )
}

/** Cues played together, each a beat after the last, as one list of notes. */
export function slimeCueSequence(cues: readonly SlimeCue[]): Note[] {
  const notes: Note[] = []
  let at = 0
  for (const cue of cues) {
    for (const note of slimeCueNotes(cue))
      notes.push({ ...note, at: (note.at ?? 0) + at })
    at += Math.min(0.18, slimeCueSeconds(cue))
  }
  return notes
}

// ---------------------------------------------------------------- the diff

/**
 * What the sound diff reads from a board: a solo ClashState or a PvP seat's
 * board both fit. `lastCommand` is authoritative when known (solo); a PvP
 * board falls back to what changed on the table.
 */
export interface ClashSoundView {
  commandCount: number
  lastCommand?: ClashCommand | null
  active: Side
  victor: ClashState['victor']
  boss: Record<Side, number>
  units: ReadonlyArray<{ uid: number; cardId: string; side: Side }>
  traps: ReadonlyArray<{ side: Side; lane: number; cardId: string }>
  strike: ClashStrike | null
  powersUsed?: Partial<Record<Side, TeamId[]>>
  levels?: Partial<Record<Side, Record<string, number>>>
  lastEvolution?: ClashEvolutionMoment
}

export function clashSoundView(s: ClashState): ClashSoundView {
  return {
    commandCount: s.commands.length,
    lastCommand: s.commands[s.commands.length - 1] ?? null,
    active: s.active,
    victor: s.victor,
    boss: s.boss,
    units: s.units,
    traps: s.traps,
    strike: s.strike,
    powersUsed: s.powersUsed,
    levels: s.levels,
    lastEvolution: s.lastEvolution,
  }
}

/** A PvP seat's board (hidden hands and rival traps are already redacted). */
export function pvpSoundView(
  board: Pick<
    ClashState,
    'active' | 'victor' | 'boss' | 'units' | 'traps' | 'strike' | 'powersUsed'
  > & { commandCount: number },
): ClashSoundView {
  return {
    commandCount: board.commandCount,
    lastCommand: null,
    active: board.active,
    victor: board.victor,
    boss: board.boss,
    units: board.units,
    traps: board.traps,
    strike: board.strike,
    powersUsed: board.powersUsed,
  }
}

function crewOf(cardId: string): Crew {
  try {
    return cardById(cardId).team
  } catch {
    return 'mercenary'
  }
}

function styleOf(cardId: string): AttackStyle | null {
  try {
    return cardById(cardId).attackStyle ?? null
  } catch {
    return null
  }
}

function kindOf(cardId: string): string | null {
  try {
    return cardById(cardId).kind
  } catch {
    return null
  }
}

const sameStrike = (a: ClashStrike | null, b: ClashStrike | null): boolean =>
  JSON.stringify(a) === JSON.stringify(b)

/**
 * The cues a move from `prev` to `next` earns, heard from `me`'s seat, in the
 * order they play. A new match, a reload or a replay (anything but exactly
 * the next command) is silent.
 */
export function clashSoundCues(
  prev: ClashSoundView | null,
  next: ClashSoundView | null,
  me: Side = 'player',
): SlimeCue[] {
  if (!prev || !next || next.commandCount <= prev.commandCount) return []
  const cues: SlimeCue[] = []
  const command = next.lastCommand ?? null
  const single = next.commandCount === prev.commandCount + 1

  if (command?.t === 'play') {
    const before = prev.levels?.[command.side]?.[command.card] ?? 1
    const kind = kindOf(command.card)
    if (kind === 'creature') cues.push(`summon-${crewOf(command.card)}`)
    else if (kind === 'trap') cues.push('trap-set')
    else if (kind === 'equipment') cues.push('gear')
    else cues.push('spell')
    if (before >= 3) cues.push('legend')
    else if (before === 2) cues.push('evolve')
  } else if (!command) {
    const landed = next.units.filter(
      (u) => !prev.units.some((old) => old.uid === u.uid),
    )
    const crews = [...new Set(landed.map((u) => crewOf(u.cardId)))]
    for (const crew of crews.slice(0, 2)) cues.push(`summon-${crew}`)
    if (next.traps.length > prev.traps.length) cues.push('trap-set')
  }

  for (const side of ['player', 'enemy'] as const) {
    const fired = next.powersUsed?.[side] ?? []
    const had = prev.powersUsed?.[side] ?? []
    for (const team of fired.slice(had.length)) cues.push(`power-${team}`)
  }

  const struck =
    command?.t === 'strike' ||
    (!command && !!next.strike && !sameStrike(prev.strike, next.strike))
  if (struck && next.strike) {
    const strike = next.strike
    const style = styleOf(strike.attacker)
    cues.push(style ? `style-${style}` : `strike-${crewOf(strike.attacker)}`)
    if (strike.trap) cues.push('trap-spring')
    if (strike.target === 'boss' && strike.dealt > 0) cues.push('boss-hit')
    if (strike.defenderFell || strike.attackerFell) cues.push('ko')
  }

  if (
    single &&
    next.lastEvolution &&
    JSON.stringify(next.lastEvolution) !== JSON.stringify(prev.lastEvolution)
  )
    cues.push(`evo-${next.lastEvolution.effect}`)

  const lost = prev.units.some(
    (old) => !next.units.some((u) => u.uid === old.uid),
  )
  if (!struck && lost) cues.push('ko')

  if (next.victor && !prev.victor) {
    cues.push(
      next.victor === 'draw'
        ? 'draw'
        : next.victor === me
          ? 'victory'
          : 'defeat',
    )
    return cues
  }
  if (next.active === me && prev.active !== me) cues.push('your-turn')
  return [...new Set(cues)]
}
