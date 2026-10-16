/**
 * Authored Act II encounter director. Uses local 60 Hz frames after the
 * Pinkwake aftermath, so the global combat tick and inventory never reset.
 * The waves are authored formations (see rainbowFormations) in eleven sections that follow the world
 * bible's S02 beats: the lantern gap lesson, linked relays, skimmer bead rain, breakable coral cover
 * and a bell remix, then six escalations (tendril maze, lantern lattice, moonrise surge, bell canyon,
 * relay storm, bell veil). Wave ids
 * start at 1000 so Act II formations never share a school with Act I.
 */
import {
  buildFormationSchedule,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'

export type MoonjellyEnemy = 'lantern' | 'relay' | 'skimmer' | 'coral'
export type MoonjellyStage =
  'opening' | 'waves' | 'turn' | 'remix' | 'approach' | 'boss' | 'aftermath'
export type MoonjellySceneId = 'A02.OPEN' | 'A02.TURN' | 'A02.AFTER'
export type MoonjellyDialogue = { speaker: string; text: string }
export type MoonjellyWave = RainbowWave<MoonjellyEnemy>
export type MoonjellySpawn = RainbowSpawn<MoonjellyEnemy>

export const MOONJELLY = {
  openingEnds: 300,
  nemiAppears: 1680,
  turnStarts: 3900,
  turnEnds: 4200,
  approachStarts: 17700,
  bossStarts: 18000,
  aftermathFrames: 360,
  lineFrames: 96,
  waveBase: 1000,
} as const

export const MOONJELLY_SECTIONS = [
  { name: 'Lantern gap lesson', from: 300, to: 1500 },
  { name: 'Relay links', from: 1500, to: 2700 },
  { name: 'Skimmer rain', from: 2700, to: 3900 },
  { name: 'Coral cover', from: 4200, to: 5700 },
  { name: 'Bell remix', from: 5700, to: 6900 },
  { name: 'Tendril maze', from: 6900, to: 8700 },
  { name: 'Lantern lattice', from: 8700, to: 10500 },
  { name: 'Moonrise surge', from: 10500, to: 12300 },
  { name: 'Bell canyon', from: 12300, to: 14100 },
  { name: 'Relay storm', from: 14100, to: 15900 },
  { name: 'Bell veil', from: 15900, to: 17700 },
] as const

export const MOONJELLY_WAVES: readonly MoonjellyWave[] = [
  wave(330, 'lantern', 'single', 1, 0.5),
  wave(540, 'lantern', 'pair', 2, 0.25),
  wave(780, 'lantern', 'single', 1, 0.3),
  wave(900, 'lantern', 'single', 1, 0.7),
  wave(1080, 'lantern', 'pair', 2, 0.2),
  wave(1320, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(1560, 'relay', 'line', 3, 0.25),
  wave(1800, 'relay', 'line', 3, 0.3),
  wave(1980, 'relay', 'column', 3, 0.5),
  wave(2160, 'relay', 'vee', 3, 0.5),
  wave(2340, 'relay', 'pair', 4, 0.2),
  wave(2520, 'lantern', 'single', 1, 0.5),
  wave(2520, 'relay', 'line', 3, 0.15),
  wave(2760, 'skimmer', 'line', 4, 0.15),
  wave(2940, 'skimmer', 'line', 4, 0.3),
  wave(3120, 'skimmer', 'stair', 5, 0.1),
  wave(3360, 'skimmer', 'pair', 4, 0.2),
  wave(3600, 'skimmer', 'line', 3, 0.15),
  wave(3600, 'lantern', 'single', 1, 0.7),
  wave(3780, 'skimmer', 'vee', 5, 0.3),
  wave(4260, 'coral', 'wall', 3, 0.5),
  wave(4500, 'relay', 'line', 3, 0.5),
  wave(4740, 'coral', 'wall', 4, 0.3),
  wave(4980, 'lantern', 'pair', 2, 0.3),
  wave(5160, 'coral', 'wall', 4, 0.7),
  wave(5400, 'relay', 'column', 3, 0.5),
  wave(5400, 'skimmer', 'line', 3, 0.15),
  wave(5760, 'lantern', 'single', 1, 0.5),
  wave(5760, 'relay', 'pair', 2, 0.2),
  wave(6000, 'coral', 'wall', 3, 0.4),
  wave(6240, 'skimmer', 'stair', 5, 0.1),
  wave(6480, 'relay', 'vee', 5, 0.5),
  wave(6720, 'lantern', 'pair', 2, 0.25),
  // Tendril maze: coral walls whose corridors hold relay files, with skimmer rain over the top.
  wave(6960, 'coral', 'wall', 4, 0.5),
  wave(7140, 'relay', 'line', 3, 0.5),
  wave(7320, 'skimmer', 'line', 4, 0.15),
  wave(7500, 'coral', 'wall', 4, 0.3),
  wave(7620, 'relay', 'line', 3, 0.3),
  wave(7860, 'coral', 'wall', 4, 0.7),
  wave(7980, 'relay', 'line', 3, 0.7),
  wave(8160, 'skimmer', 'stair', 5, 0.1),
  wave(8400, 'lantern', 'single', 1, 0.5),
  wave(8520, 'relay', 'pair', 4, 0.2),
  // Lantern lattice: two lanterns' fans at once, so the gap lesson becomes a gap choice.
  wave(8760, 'lantern', 'pair', 2, 0.3),
  wave(8940, 'relay', 'vee', 5, 0.5),
  wave(9120, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(9300, 'relay', 'column', 3, 0.5),
  wave(9480, 'skimmer', 'line', 4, 0.2),
  wave(9660, 'lantern', 'single', 1, 0.25),
  wave(9660, 'relay', 'line', 3, 0.75),
  wave(9900, 'lantern', 'pair', 2, 0.2),
  wave(10080, 'relay', 'stair', 5, 0.15),
  wave(10260, 'skimmer', 'vee', 5, 0.3),
  // Moonrise surge: every Act II craft, building to the Aurelia Array.
  wave(10560, 'relay', 'vee', 5, 0.5),
  wave(10740, 'coral', 'wall', 3, 0.5),
  wave(10860, 'skimmer', 'line', 4, 0.1),
  wave(11040, 'lantern', 'pair', 2, 0.25),
  wave(11220, 'relay', 'column', 4, 0.5, { spread: 0.2 }),
  wave(11400, 'coral', 'wall', 4, 0.35),
  wave(11520, 'relay', 'line', 3, 0.35),
  wave(11700, 'skimmer', 'stair', 5, 0.1),
  wave(11880, 'lantern', 'single', 1, 0.5),
  wave(11880, 'relay', 'pair', 4, 0.15),
  wave(12060, 'skimmer', 'vee', 5, 0.3),
  // Bell canyon: coral walls open high, then low, each gap guarded by a lantern's fan.
  wave(12360, 'coral', 'wall', 4, 0.2),
  wave(12540, 'lantern', 'single', 1, 0.2),
  wave(12720, 'coral', 'wall', 4, 0.8),
  wave(12900, 'lantern', 'single', 1, 0.8),
  wave(13080, 'relay', 'vee', 5, 0.5),
  wave(13260, 'coral', 'wall', 4, 0.5),
  wave(13440, 'relay', 'line', 3, 0.5),
  wave(13620, 'skimmer', 'line', 4, 0.15),
  wave(13800, 'lantern', 'pair', 2, 0.25),
  wave(13920, 'relay', 'column', 3, 0.5),
  // Relay storm: relay files crossing in both directions under skimmer rain.
  wave(14160, 'relay', 'stair', 5, 0.1),
  wave(14340, 'relay', 'stair', 5, 0.9, { step: -1 }),
  wave(14520, 'skimmer', 'vee', 5, 0.5),
  wave(14700, 'relay', 'column', 4, 0.5, { spread: 0.2 }),
  wave(14880, 'lantern', 'single', 1, 0.5),
  wave(15000, 'relay', 'pair', 4, 0.15),
  wave(15180, 'skimmer', 'line', 4, 0.85),
  wave(15360, 'relay', 'vee', 5, 0.3),
  wave(15540, 'relay', 'vee', 5, 0.7),
  wave(15720, 'skimmer', 'stair', 5, 0.1),
  // Bell veil: the colony's last screen, every Act II craft before the Aurelia Array.
  wave(15960, 'lantern', 'pair', 2, 0.2),
  wave(16140, 'coral', 'wall', 3, 0.5),
  wave(16260, 'relay', 'line', 3, 0.5),
  wave(16440, 'skimmer', 'line', 4, 0.1),
  wave(16620, 'lantern', 'column', 2, 0.5, { spread: 0.5 }),
  wave(16800, 'relay', 'stair', 5, 0.15),
  wave(16980, 'coral', 'wall', 4, 0.65),
  wave(17100, 'relay', 'line', 3, 0.65),
  wave(17280, 'lantern', 'single', 1, 0.35),
  wave(17280, 'skimmer', 'vee', 5, 0.5),
  wave(17460, 'relay', 'pair', 4, 0.2),
]

const schedule = buildFormationSchedule(MOONJELLY_WAVES, MOONJELLY.waveBase)

/** Craft per wave, by wave index (id minus waveBase), for the school bonus. */
export const MOONJELLY_WAVE_SIZES: readonly number[] = schedule.sizes

export function moonjellyStage(
  frame: number,
  defeatedAt: number | null,
): MoonjellyStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < MOONJELLY.openingEnds) return 'opening'
  if (frame < MOONJELLY.turnStarts) return 'waves'
  if (frame < MOONJELLY.turnEnds) return 'turn'
  if (frame < MOONJELLY.approachStarts) return 'remix'
  if (frame < MOONJELLY.bossStarts) return 'approach'
  return 'boss'
}

/** Every craft that enters on this Act II frame; empty outside the waves and remix stages. */
export function moonjellySpawns(frame: number): readonly MoonjellySpawn[] {
  const stage = moonjellyStage(frame, null)
  if (stage !== 'waves' && stage !== 'remix') return []
  return schedule.at(frame)
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function moonjellyDialogue(
  id: MoonjellySceneId,
  elapsed: number,
  players: number,
  rescuedNemi: boolean,
): MoonjellyDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const lines: Record<MoonjellySceneId, MoonjellyDialogue[]> = {
    'A02.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Moonjelly Fields. This whole reef is transmitting one broken distress call.',
      },
      {
        speaker: lead,
        text: 'Then we follow the current. No shooting what we can safely rescue.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Those bells are beautiful. The lightning inside them is less charming.',
      },
    ],
    'A02.TURN': [
      {
        speaker: 'Lilt-7',
        text: rescuedNemi
          ? 'Nemi is aboard. She says the lights are pleading for help.'
          : 'We lost the Nemi beacon. The current still carries her warning.',
      },
      {
        speaker: wing,
        text: 'The transmission changes pitch every time a ship loses control.',
      },
      {
        speaker: lead,
        text: 'The Aurelia Array is a prison, not a weapon. We break its lock.',
      },
    ],
    'A02.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'The colony is free. I remember that control signature. I wish I did not.',
      },
      {
        speaker: lead,
        text: 'You can tell us when you are ready. For now, we protect the survivors.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'The trench ahead holds the old relay network. We have more questions than answers.',
      },
    ],
  }
  return lines[id][Math.floor(elapsed / MOONJELLY.lineFrames)] ?? null
}

export function moonjellyScene(
  frame: number,
  defeatedFrame: number | null,
): { id: MoonjellySceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < MOONJELLY.aftermathFrames
      ? { id: 'A02.AFTER', elapsed }
      : null
  }
  if (frame < MOONJELLY.openingEnds) return { id: 'A02.OPEN', elapsed: frame }
  if (frame >= MOONJELLY.turnStarts && frame < MOONJELLY.turnEnds) {
    return { id: 'A02.TURN', elapsed: frame - MOONJELLY.turnStarts }
  }
  return null
}
