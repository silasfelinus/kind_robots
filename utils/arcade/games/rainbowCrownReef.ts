/**
 * Authored Act VI encounter director: the Crown Reef (S06), a gold nebula of coral megastructures and
 * bioluminescent arches. Local 60 Hz frames start when the crew leaves Act V's memorial (the second quiet
 * intermission). World bible S06 beats, one new craft per lesson: E19 manta broodships darken their wings,
 * then launch two interceptor drones; E20 reef turrets unfold their flower before an aimed petal barrage,
 * and their stem breaks at double damage; E21 nautilus bulwarks are armoured until their shell window opens
 * to sweep a slow barrier, when the spiral eye takes damage; and timed reef gates, coral walls with a single
 * gap. A coral merge leads to the Bulwark guardian (see rainbowGuardian), then Lilt's voluntary revelation
 * (ACT-STRUCTURE mid-Act; COMMS bible S06) and eight escalations. The S06 choice follows: high to break the
 * Crown's damage relay (three pylons; flag stoppedRelay) or low to the shield cache. Both routes rejoin at
 * the nursery before B06 Lantern Ray. A clean run takes about ten minutes. Wave ids start at 5000.
 */
import {
  buildFormationSchedule,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'

export type ReefEnemy =
  'brood' | 'drone' | 'turret' | 'bulwark' | 'gate' | 'pylon'
export type ReefStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type ReefSceneId =
  'A06.OPEN' | 'A06.REVEAL' | 'A06.FORK' | 'A06.TURN' | 'A06.AFTER'
export type ReefDialogue = { speaker: string; text: string }
export type ReefWave = RainbowWave<ReefEnemy>
export type ReefSpawn = RainbowSpawn<ReefEnemy>
/** S06's route: high to break the Crown's damage relay, or low to the shield cache. */
export type ReefRoute = 'relay' | 'cache'

export const CROWN_REEF = {
  openingEnds: 300,
  turnStarts: 31500,
  bossStarts: 31800,
  aftermathFrames: 390,
  lineFrames: 96,
  waveBase: 5000,
  /** Act V's memorial between Acts V and VI: A launches after restMinFrames, or it launches itself. */
  restMinFrames: 120,
  restMaxFrames: 600,
  /** Lilt's revelation opens the section after the guardian. */
  revealAt: 9900,
} as const

export const CROWN_REEF_SECTIONS = [
  { name: 'Brood wings', from: 300, to: 1800 },
  { name: 'Petal turrets', from: 1800, to: 3300 },
  { name: 'Bulwark shells', from: 3300, to: 4800 },
  { name: 'Reef gate', from: 4800, to: 6300 },
  { name: 'Coral merge', from: 6300, to: 8100 },
  { name: 'Bulwark guardian', from: 8100, to: 9900 },
  { name: 'Bioluminescent arches', from: 9900, to: 11700 },
  { name: 'Brood nests', from: 11700, to: 13500 },
  { name: 'Petal storm', from: 13500, to: 15300 },
  { name: 'Shell parade', from: 15300, to: 17100 },
  { name: 'Closing gates', from: 17100, to: 18900 },
  { name: 'Golden nebula', from: 18900, to: 20700 },
  { name: 'Tendril maze', from: 20700, to: 22500 },
  { name: 'Crown arches', from: 22500, to: 24300 },
  { name: 'Reef heart', from: 24300, to: 26100 },
  { name: 'Relay or cache', from: 26100, to: 29700 },
  { name: 'Nursery approach', from: 29700, to: 31500 },
] as const

/** The Bulwark guardian holds the Act after the coral merge; no waves fly in its section. */
export const CROWN_REEF_GUARDIAN: RainbowGuardianSection = {
  name: 'Bulwark guardian',
  from: 8100,
  to: 9900,
  kind: 'bulwark',
}

/**
 * The fork: two comms lines from markFrom, the crew's position decides at decideAt, and the routes rejoin
 * at rejoinAt. The relay route breaks the relay if every pylon falls; the cache route refills shields.
 */
export const CROWN_REEF_FORK = {
  markFrom: 25908,
  decideAt: 26100,
  rejoinAt: 29700,
  splitY: 135,
  relayScore: 3000,
} as const

export const CROWN_REEF_WAVES: readonly ReefWave[] = [
  // Brood wings: a broodship darkens its wings, then launches two interceptor drones.
  wave(420, 'brood', 'single', 1, 0.5),
  wave(780, 'brood', 'single', 1, 0.3),
  wave(1080, 'brood', 'single', 1, 0.7),
  wave(1380, 'brood', 'pair', 2, 0.25),
  wave(1680, 'brood', 'single', 1, 0.5),
  // Petal turrets: reef turrets unfold their flowers before a petal barrage; their stems break fastest.
  wave(1860, 'turret', 'single', 1, 0.8),
  wave(2160, 'turret', 'single', 1, 0.2),
  wave(2400, 'turret', 'pair', 2, 0.15),
  wave(2700, 'brood', 'single', 1, 0.5),
  wave(2940, 'turret', 'single', 1, 0.6),
  wave(3180, 'turret', 'single', 1, 0.35),
  // Bulwark shells: nautilus bulwarks only open their shell window to sweep; hit the eye then.
  wave(3360, 'bulwark', 'single', 1, 0.5),
  wave(3720, 'bulwark', 'single', 1, 0.3),
  wave(4020, 'turret', 'single', 1, 0.75),
  wave(4260, 'bulwark', 'single', 1, 0.7),
  wave(4560, 'bulwark', 'pair', 2, 0.25),
  // Reef gate: coral gate walls close in; fly through the gap before it moves.
  wave(4860, 'gate', 'wall', 5, 0.5),
  wave(5220, 'gate', 'wall', 5, 0.3),
  wave(5580, 'gate', 'wall', 5, 0.7),
  wave(5940, 'gate', 'wall', 5, 0.45),
  wave(6180, 'brood', 'single', 1, 0.5),
  // Coral merge: every reef craft together under the coral arches.
  wave(6360, 'brood', 'single', 1, 0.3),
  wave(6540, 'turret', 'single', 1, 0.7),
  wave(6780, 'bulwark', 'single', 1, 0.5),
  wave(7020, 'gate', 'wall', 5, 0.6),
  wave(7260, 'turret', 'pair', 2, 0.2),
  wave(7500, 'brood', 'pair', 2, 0.3),
  wave(7740, 'bulwark', 'single', 1, 0.6),
  wave(7920, 'turret', 'single', 1, 0.4),
  // Bioluminescent arches: Lilt’s revelation plays out before the arches fill with craft.
  wave(10260, 'brood', 'single', 1, 0.5),
  wave(10500, 'turret', 'single', 1, 0.3),
  wave(10740, 'bulwark', 'single', 1, 0.6),
  wave(10980, 'gate', 'wall', 5, 0.5),
  wave(11220, 'brood', 'pair', 2, 0.2),
  wave(11460, 'turret', 'single', 1, 0.7),
  // Brood nests: broodships in pairs, filling the reef with drones.
  wave(11760, 'brood', 'pair', 2, 0.2),
  wave(12060, 'turret', 'single', 1, 0.5),
  wave(12300, 'brood', 'pair', 2, 0.35),
  wave(12600, 'bulwark', 'single', 1, 0.5),
  wave(12840, 'brood', 'single', 1, 0.5),
  wave(13140, 'brood', 'pair', 2, 0.15),
  // Petal storm: turrets high and low unfold together.
  wave(13560, 'turret', 'pair', 2, 0.15),
  wave(13800, 'turret', 'single', 1, 0.5),
  wave(14040, 'brood', 'single', 1, 0.4),
  wave(14280, 'turret', 'pair', 2, 0.3),
  wave(14520, 'gate', 'wall', 5, 0.5),
  wave(14760, 'turret', 'pair', 2, 0.2),
  wave(15000, 'bulwark', 'single', 1, 0.5),
  // Shell parade: bulwarks sweep in turn; wait for each window.
  wave(15360, 'bulwark', 'single', 1, 0.3),
  wave(15600, 'bulwark', 'single', 1, 0.7),
  wave(15900, 'turret', 'single', 1, 0.5),
  wave(16140, 'bulwark', 'pair', 2, 0.25),
  wave(16440, 'brood', 'single', 1, 0.5),
  wave(16680, 'bulwark', 'single', 1, 0.5),
  // Closing gates: gate after gate, each gap a little further from the last.
  wave(17160, 'gate', 'wall', 5, 0.2),
  wave(17460, 'gate', 'wall', 5, 0.8),
  wave(17760, 'brood', 'single', 1, 0.5),
  wave(18000, 'gate', 'wall', 5, 0.35),
  wave(18300, 'gate', 'wall', 5, 0.65),
  wave(18600, 'turret', 'single', 1, 0.5),
  // Golden nebula: the gold nebula opens and every craft comes at once.
  wave(18960, 'brood', 'pair', 2, 0.2),
  wave(19200, 'turret', 'single', 1, 0.5),
  wave(19440, 'bulwark', 'single', 1, 0.35),
  wave(19680, 'gate', 'wall', 5, 0.6),
  wave(19920, 'brood', 'single', 1, 0.7),
  wave(20160, 'turret', 'pair', 2, 0.25),
  wave(20400, 'bulwark', 'single', 1, 0.6),
  // Tendril maze: branch tendrils hide turrets between the gates.
  wave(20760, 'gate', 'wall', 5, 0.4),
  wave(21000, 'turret', 'single', 1, 0.15),
  wave(21240, 'turret', 'single', 1, 0.85),
  wave(21480, 'gate', 'wall', 5, 0.6),
  wave(21720, 'brood', 'single', 1, 0.5),
  wave(21960, 'gate', 'wall', 5, 0.3),
  wave(22200, 'turret', 'single', 1, 0.6),
  // Crown arches: the Crown’s own arches, guarded by its broodships.
  wave(22560, 'brood', 'pair', 2, 0.3),
  wave(22860, 'bulwark', 'single', 1, 0.5),
  wave(23100, 'brood', 'single', 1, 0.2),
  wave(23340, 'turret', 'pair', 2, 0.25),
  wave(23580, 'bulwark', 'pair', 2, 0.2),
  wave(23880, 'brood', 'single', 1, 0.6),
  // Reef heart: the reef heart before the relay and the cache come into view.
  wave(24360, 'turret', 'single', 1, 0.4),
  wave(24540, 'brood', 'single', 1, 0.6),
  wave(24780, 'gate', 'wall', 5, 0.5),
  wave(25020, 'bulwark', 'single', 1, 0.3),
  wave(25260, 'turret', 'pair', 2, 0.2),
  wave(25500, 'brood', 'single', 1, 0.5),
  // Nursery approach: the routes rejoin at the nursery the Lantern Ray guards.
  wave(29760, 'brood', 'pair', 2, 0.25),
  wave(30000, 'turret', 'single', 1, 0.5),
  wave(30240, 'gate', 'wall', 5, 0.4),
  wave(30480, 'bulwark', 'single', 1, 0.6),
  wave(30720, 'brood', 'single', 1, 0.3),
  wave(30960, 'turret', 'pair', 2, 0.2),
  wave(31200, 'bulwark', 'single', 1, 0.5),
]

/** The relay route: three relay pylons among a heavy guard, flown only on that route. */
export const CROWN_REEF_RELAY_WAVES: readonly ReefWave[] = [
  wave(26220, 'pylon', 'single', 1, 0.15),
  wave(26340, 'brood', 'single', 1, 0.5),
  wave(26700, 'turret', 'single', 1, 0.3),
  wave(27000, 'pylon', 'single', 1, 0.2),
  wave(27180, 'bulwark', 'single', 1, 0.45),
  wave(27420, 'brood', 'pair', 2, 0.2),
  wave(27660, 'turret', 'single', 1, 0.4),
  wave(27900, 'pylon', 'single', 1, 0.1),
  wave(28080, 'brood', 'single', 1, 0.5),
  wave(28320, 'bulwark', 'single', 1, 0.35),
  wave(28560, 'turret', 'pair', 2, 0.2),
  wave(28800, 'brood', 'single', 1, 0.3),
  wave(29040, 'gate', 'wall', 5, 0.5),
  wave(29280, 'turret', 'single', 1, 0.4),
]

/** The shield cache route: a light patrol, flown only on that route. */
export const CROWN_REEF_CACHE_WAVES: readonly ReefWave[] = [
  wave(26340, 'brood', 'single', 1, 0.75),
  wave(26880, 'turret', 'single', 1, 0.8),
  wave(27420, 'brood', 'single', 1, 0.7),
  wave(27960, 'bulwark', 'single', 1, 0.75),
  wave(28500, 'turret', 'single', 1, 0.7),
  wave(29040, 'brood', 'single', 1, 0.8),
]

/** Every Act VI wave, both routes; a wave's id is CROWN_REEF.waveBase plus its index here. */
export const CROWN_REEF_ALL_WAVES: readonly ReefWave[] = [
  ...CROWN_REEF_WAVES,
  ...CROWN_REEF_RELAY_WAVES,
  ...CROWN_REEF_CACHE_WAVES,
]

/** Relay pylons the crew must break on the relay route. */
export const CROWN_REEF_PYLONS = CROWN_REEF_RELAY_WAVES.filter(
  (w) => w.kind === 'pylon',
).length

/** Which route a wave belongs to, by its index in CROWN_REEF_ALL_WAVES; null flies on both. */
export function reefWaveRoute(index: number): ReefRoute | null {
  if (index < CROWN_REEF_WAVES.length) return null
  return index < CROWN_REEF_WAVES.length + CROWN_REEF_RELAY_WAVES.length
    ? 'relay'
    : 'cache'
}

const schedule = buildFormationSchedule(
  CROWN_REEF_ALL_WAVES,
  CROWN_REEF.waveBase,
)

/** Craft per wave, by wave index in CROWN_REEF_ALL_WAVES, for the school bonus. */
export const CROWN_REEF_WAVE_SIZES: readonly number[] = schedule.sizes

export function reefStage(frame: number, defeatedAt: number | null): ReefStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < CROWN_REEF.openingEnds) return 'opening'
  if (frame < CROWN_REEF.turnStarts) return 'waves'
  if (frame < CROWN_REEF.bossStarts) return 'turn'
  return 'boss'
}

/** Most living pilots above the line break the relay, most below take the cache; a tie follows the lead. */
export function reefRouteFor(ys: readonly number[]): ReefRoute {
  const high = ys.filter((y) => y < CROWN_REEF_FORK.splitY).length
  const low = ys.length - high
  if (high !== low) return high > low ? 'relay' : 'cache'
  return ys[0] !== undefined && ys[0] < CROWN_REEF_FORK.splitY
    ? 'relay'
    : 'cache'
}

/** Every craft that enters on this Act VI frame on this route; empty outside the waves stage. */
export function reefSpawns(
  frame: number,
  route: ReefRoute | null,
): readonly ReefSpawn[] {
  if (reefStage(frame, null) !== 'waves') return []
  return schedule.at(frame).filter((spawn) => {
    const only = reefWaveRoute(spawn.wave - CROWN_REEF.waveBase)
    return only === null || only === route
  })
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const
/** COMMS bible S06: each pilot's own answer to Lilt's revelation. */
const REPLIES: Record<(typeof PILOTS)[number], string> = {
  Maribel: 'Then we put the word back. Ask us, Lilt, and we will answer.',
  Azure: 'A rule missing a word is a wrong map. We can redraw it together.',
  Solenne: 'You told us before anyone made you. That is the rule I trust.',
  Vivi: 'Then sing the old rule back to it, the whole verse this time.',
}

export function reefDialogue(
  id: ReefSceneId,
  elapsed: number,
  players: number,
  route: ReefRoute | null = null,
  stoppedRelay = false,
): ReefDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const lines: Record<ReefSceneId, ReefDialogue[]> = {
    'A06.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Crown Reef. Everything here was grown to protect something.',
      },
      {
        speaker: lead,
        text: 'Then we find out what it thinks it is protecting.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Broodships ahead. When their wings go dark, drones follow.',
      },
    ],
    'A06.REVEAL': [
      {
        speaker: 'Lilt-7',
        text: 'I helped write the first rescue rule. The Crown kept the word protect and erased the word ask.',
      },
      { speaker: wing, text: REPLIES[wing] },
      {
        speaker: 'Lilt-7',
        text: 'I will not make that choice for you again.',
      },
    ],
    'A06.FORK': [
      {
        speaker: 'Lilt-7',
        text: "The Crown's relay is high and a shield cache drifts low. I will not choose for you.",
      },
      {
        speaker: lead,
        text: 'High to break the relay, low to take the shields. We decide together.',
      },
    ],
    'A06.TURN': [
      {
        speaker: 'Lilt-7',
        text:
          route === 'relay'
            ? stoppedRelay
              ? 'The relay is dark. The Crown cannot call the reef to the Lantern Ray now.'
              : 'The relay still hums. The Lantern Ray will have the whole reef behind it.'
            : 'Shields full. The Lantern Ray guards a nursery of manta juveniles ahead.',
      },
      {
        speaker: wing,
        text: 'Its shadow falls in lanes before it fires. Stay in the light.',
      },
      {
        speaker: lead,
        text: 'Open the nurseries, do not burn them. Those juveniles are why it is here.',
      },
    ],
    'A06.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'The nursery is open. The juveniles are drifting away, alive.',
      },
      {
        speaker: lead,
        text: 'You opened that nursery yourself, Lilt.',
      },
      {
        speaker: 'Lilt-7',
        text: 'I asked them first. That is the rule now.',
      },
    ],
  }
  return lines[id][Math.floor(elapsed / CROWN_REEF.lineFrames)] ?? null
}

export function reefScene(
  frame: number,
  defeatedFrame: number | null,
): { id: ReefSceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < CROWN_REEF.aftermathFrames
      ? { id: 'A06.AFTER', elapsed }
      : null
  }
  if (frame < CROWN_REEF.openingEnds) return { id: 'A06.OPEN', elapsed: frame }
  if (
    frame >= CROWN_REEF.revealAt &&
    frame < CROWN_REEF.revealAt + 3 * CROWN_REEF.lineFrames
  )
    return { id: 'A06.REVEAL', elapsed: frame - CROWN_REEF.revealAt }
  if (frame >= CROWN_REEF_FORK.markFrom && frame < CROWN_REEF_FORK.decideAt)
    return { id: 'A06.FORK', elapsed: frame - CROWN_REEF_FORK.markFrom }
  if (frame >= CROWN_REEF.turnStarts && frame < CROWN_REEF.bossStarts)
    return { id: 'A06.TURN', elapsed: frame - CROWN_REEF.turnStarts }
  return null
}
