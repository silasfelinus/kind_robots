/**
 * Authored Act III encounter director: the Chromatic Trench (S03). Uses local 60 Hz frames after the
 * Moonjelly aftermath, so the global combat tick and inventory never reset. The waves follow the world
 * bible's S03 beats, one new craft per section: E09 clawstrike snipers that mark their lane before a
 * straight bolt, E10 pistol shuttles whose bubbles burst into rings, E11 angler decoys whose false
 * pickup halo flashes a cross before it detonates, and E12 glassfin skates whose pellets ricochet once
 * off the trench walls; then a vault-approach remix, the Clawstrike guardian (see rainbowGuardian) and
 * twelve escalations (crossfire ridge, bubble garden, mirror vents, lure maze, pressure drop, ember drift,
 * sigil wreck, echo trench, cinder lanes, hollow armoury, deep vents, vault gate). A clean run of Act III
 * takes about ten minutes. The
 * TURN waits at the salvage vault before B03
 * Clawburst (ACT-STRUCTURE: pre-boss). Wave ids start at 2000 so Act III formations never share a school
 * with Acts I or II.
 */
import {
  buildFormationSchedule,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'

export type TrenchEnemy = 'clawstrike' | 'pistol' | 'angler' | 'skate'
export type TrenchStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type TrenchSceneId = 'A03.OPEN' | 'A03.TURN' | 'A03.AFTER'
export type TrenchDialogue = { speaker: string; text: string }
export type TrenchWave = RainbowWave<TrenchEnemy>
export type TrenchSpawn = RainbowSpawn<TrenchEnemy>

export const TRENCH = {
  openingEnds: 300,
  turnStarts: 31500,
  bossStarts: 31800,
  aftermathFrames: 390,
  lineFrames: 96,
  waveBase: 2000,
} as const

export const TRENCH_SECTIONS = [
  { name: 'Sniper ridge', from: 300, to: 1800 },
  { name: 'Bubble pockets', from: 1800, to: 3300 },
  { name: 'Angler lights', from: 3300, to: 4800 },
  { name: 'Glass skates', from: 4800, to: 6300 },
  { name: 'Vault approach', from: 6300, to: 8100 },
  { name: 'Clawstrike guardian', from: 8100, to: 9900 },
  { name: 'Crossfire ridge', from: 9900, to: 11700 },
  { name: 'Bubble garden', from: 11700, to: 13500 },
  { name: 'Mirror vents', from: 13500, to: 15300 },
  { name: 'Lure maze', from: 15300, to: 17100 },
  { name: 'Pressure drop', from: 17100, to: 18900 },
  { name: 'Ember drift', from: 18900, to: 20700 },
  { name: 'Sigil wreck', from: 20700, to: 22500 },
  { name: 'Echo trench', from: 22500, to: 24300 },
  { name: 'Cinder lanes', from: 24300, to: 26100 },
  { name: 'Hollow armoury', from: 26100, to: 27900 },
  { name: 'Deep vents', from: 27900, to: 29700 },
  { name: 'Vault gate', from: 29700, to: 31500 },
] as const

/** The Clawstrike guardian holds the Act after the vault-approach remix; no waves fly in its section. */
export const TRENCH_GUARDIAN: RainbowGuardianSection = {
  name: 'Clawstrike guardian',
  from: 8100,
  to: 9900,
  kind: 'clawstrike',
}

export const TRENCH_WAVES: readonly TrenchWave[] = [
  // Sniper ridge: one clawstrike at a time, so each lane mark is read before the bolt.
  wave(360, 'clawstrike', 'single', 1, 0.2),
  wave(540, 'clawstrike', 'single', 1, 0.8),
  wave(720, 'clawstrike', 'single', 1, 0.5),
  wave(900, 'clawstrike', 'pair', 2, 0.25),
  wave(1140, 'clawstrike', 'single', 1, 0.35),
  wave(1260, 'clawstrike', 'single', 1, 0.65),
  wave(1440, 'clawstrike', 'line', 2, 0.5),
  wave(1620, 'clawstrike', 'pair', 2, 0.15),
  // Bubble pockets: pistol shuttles; each bubble bursts into a ring, so keep its edge at a distance.
  wave(1860, 'pistol', 'single', 1, 0.5),
  wave(2040, 'pistol', 'pair', 2, 0.3),
  wave(2280, 'pistol', 'single', 1, 0.2),
  wave(2400, 'pistol', 'single', 1, 0.8),
  wave(2580, 'pistol', 'column', 2, 0.5, { spread: 0.4 }),
  wave(2820, 'clawstrike', 'single', 1, 0.5),
  wave(2940, 'pistol', 'pair', 2, 0.2),
  wave(3120, 'pistol', 'single', 1, 0.5),
  // Angler lights: decoys drop a halo that looks like a pickup and flashes its cross before it blows.
  wave(3360, 'angler', 'single', 1, 0.5),
  wave(3600, 'angler', 'single', 1, 0.3),
  wave(3720, 'clawstrike', 'single', 1, 0.8),
  wave(3900, 'angler', 'pair', 2, 0.25),
  wave(4140, 'pistol', 'single', 1, 0.5),
  wave(4320, 'angler', 'single', 1, 0.7),
  wave(4500, 'angler', 'column', 2, 0.5, { spread: 0.5 }),
  wave(4680, 'clawstrike', 'pair', 2, 0.2),
  // Glass skates: fast schools whose pellets glance off the trench walls once.
  wave(4860, 'skate', 'line', 3, 0.3),
  wave(5040, 'skate', 'line', 3, 0.7),
  wave(5220, 'skate', 'vee', 3, 0.5),
  wave(5400, 'pistol', 'single', 1, 0.5),
  wave(5520, 'skate', 'pair', 4, 0.2),
  wave(5760, 'angler', 'single', 1, 0.5),
  wave(5880, 'skate', 'stair', 4, 0.15),
  wave(6120, 'skate', 'line', 3, 0.5),
  // Vault approach: all four craft together on the way down to the salvage vault.
  wave(6360, 'clawstrike', 'pair', 2, 0.2),
  wave(6480, 'skate', 'line', 3, 0.5),
  wave(6660, 'pistol', 'single', 1, 0.3),
  wave(6660, 'angler', 'single', 1, 0.7),
  wave(6900, 'skate', 'vee', 5, 0.5),
  wave(7080, 'clawstrike', 'single', 1, 0.5),
  wave(7260, 'pistol', 'pair', 2, 0.25),
  wave(7440, 'skate', 'stair', 5, 0.85, { step: -1 }),
  wave(7620, 'angler', 'pair', 2, 0.2),
  wave(7800, 'clawstrike', 'line', 3, 0.5),
  wave(7920, 'skate', 'pair', 4, 0.15),
  // Crossfire ridge: clawstrike pairs from both walls, with skate glass between their lanes.
  wave(9960, 'clawstrike', 'pair', 2, 0.15),
  wave(10140, 'skate', 'line', 3, 0.5),
  wave(10320, 'clawstrike', 'pair', 2, 0.3),
  wave(10500, 'skate', 'vee', 3, 0.5),
  wave(10680, 'clawstrike', 'single', 1, 0.5),
  wave(10800, 'pistol', 'single', 1, 0.3),
  wave(10980, 'clawstrike', 'pair', 2, 0.2),
  wave(11160, 'skate', 'stair', 4, 0.15),
  wave(11340, 'clawstrike', 'line', 3, 0.5),
  wave(11520, 'skate', 'pair', 4, 0.25),
  // Bubble garden: pistol columns sow bubble rings while angler lures hide among them.
  wave(11760, 'pistol', 'column', 2, 0.5, { spread: 0.5 }),
  wave(11940, 'angler', 'single', 1, 0.5),
  wave(12120, 'pistol', 'pair', 2, 0.25),
  wave(12300, 'pistol', 'single', 1, 0.5),
  wave(12480, 'angler', 'pair', 2, 0.3),
  wave(12660, 'skate', 'line', 3, 0.5),
  wave(12840, 'pistol', 'column', 3, 0.5, { spread: 0.3 }),
  wave(13020, 'angler', 'single', 1, 0.2),
  wave(13200, 'pistol', 'pair', 2, 0.15),
  wave(13320, 'skate', 'vee', 3, 0.5),
  // Mirror vents: crossing skate stairs fill the walls with ricochets around lone snipers.
  wave(13560, 'skate', 'stair', 5, 0.1),
  wave(13800, 'skate', 'stair', 5, 0.9, { step: -1 }),
  wave(13980, 'clawstrike', 'single', 1, 0.5),
  wave(14160, 'skate', 'pair', 4, 0.2),
  wave(14340, 'clawstrike', 'pair', 2, 0.3),
  wave(14520, 'skate', 'vee', 5, 0.5),
  wave(14700, 'pistol', 'single', 1, 0.5),
  wave(14880, 'skate', 'line', 4, 0.3),
  wave(15060, 'clawstrike', 'single', 1, 0.7),
  // Lure maze: angler lures high and low, so every cross must be read before it fires.
  wave(15360, 'angler', 'single', 1, 0.2),
  wave(15480, 'angler', 'single', 1, 0.8),
  wave(15660, 'clawstrike', 'single', 1, 0.5),
  wave(15840, 'angler', 'pair', 2, 0.35),
  wave(16020, 'pistol', 'single', 1, 0.5),
  wave(16200, 'angler', 'column', 2, 0.5, { spread: 0.5 }),
  wave(16380, 'skate', 'line', 3, 0.5),
  wave(16560, 'angler', 'single', 1, 0.5),
  wave(16740, 'clawstrike', 'pair', 2, 0.2),
  wave(16920, 'angler', 'pair', 2, 0.25),
  // Pressure drop: the trench narrows and every craft presses in at once.
  wave(17160, 'pistol', 'pair', 2, 0.3),
  wave(17280, 'skate', 'vee', 5, 0.5),
  wave(17460, 'clawstrike', 'pair', 2, 0.15),
  wave(17580, 'angler', 'single', 1, 0.5),
  wave(17700, 'skate', 'stair', 5, 0.1),
  wave(17880, 'pistol', 'column', 2, 0.5, { spread: 0.5 }),
  wave(18060, 'clawstrike', 'line', 3, 0.5),
  wave(18180, 'skate', 'pair', 4, 0.2),
  wave(18360, 'angler', 'pair', 2, 0.3),
  wave(18540, 'pistol', 'single', 1, 0.5),
  wave(18660, 'skate', 'line', 4, 0.7),
  // Ember drift: skate glass drifts through vent heat between slow pistol bubbles.
  wave(18960, 'skate', 'line', 3, 0.2),
  wave(19140, 'pistol', 'single', 1, 0.6),
  wave(19320, 'skate', 'line', 3, 0.8),
  wave(19500, 'pistol', 'single', 1, 0.3),
  wave(19680, 'skate', 'vee', 5, 0.5),
  wave(19860, 'clawstrike', 'single', 1, 0.5),
  wave(20040, 'skate', 'stair', 4, 0.15),
  wave(20220, 'pistol', 'pair', 2, 0.25),
  wave(20400, 'skate', 'pair', 4, 0.2),
  wave(20520, 'angler', 'single', 1, 0.5),
  // Sigil wreck: a wrecked fleet hull: clawstrikes nest in its ribs, one lane at a time.
  wave(20760, 'clawstrike', 'single', 1, 0.15),
  wave(20880, 'clawstrike', 'single', 1, 0.85),
  wave(21060, 'clawstrike', 'single', 1, 0.5),
  wave(21240, 'skate', 'line', 3, 0.3),
  wave(21420, 'clawstrike', 'pair', 2, 0.25),
  wave(21600, 'angler', 'single', 1, 0.5),
  wave(21780, 'clawstrike', 'line', 3, 0.35),
  wave(21960, 'skate', 'vee', 3, 0.6),
  wave(22140, 'clawstrike', 'pair', 2, 0.2),
  wave(22320, 'pistol', 'single', 1, 0.5),
  // Echo trench: the walls tighten: every skate pellet comes back off them.
  wave(22560, 'skate', 'stair', 5, 0.1),
  wave(22740, 'skate', 'stair', 5, 0.9, { step: -1 }),
  wave(22920, 'pistol', 'single', 1, 0.5),
  wave(23100, 'skate', 'vee', 5, 0.5),
  wave(23280, 'angler', 'pair', 2, 0.3),
  wave(23460, 'skate', 'line', 4, 0.2),
  wave(23580, 'skate', 'line', 4, 0.8),
  wave(23760, 'clawstrike', 'single', 1, 0.5),
  wave(23940, 'skate', 'pair', 4, 0.25),
  wave(24120, 'pistol', 'pair', 2, 0.2),
  // Cinder lanes: clawstrike lane marks cross pistol rings: read both before you move.
  wave(24360, 'clawstrike', 'pair', 2, 0.3),
  wave(24540, 'pistol', 'column', 2, 0.5, { spread: 0.5 }),
  wave(24720, 'clawstrike', 'single', 1, 0.5),
  wave(24840, 'pistol', 'single', 1, 0.2),
  wave(25020, 'clawstrike', 'pair', 2, 0.15),
  wave(25200, 'skate', 'vee', 3, 0.5),
  wave(25380, 'pistol', 'pair', 2, 0.3),
  wave(25560, 'clawstrike', 'line', 3, 0.65),
  wave(25740, 'angler', 'single', 1, 0.35),
  wave(25920, 'skate', 'line', 3, 0.5),
  // Hollow armoury: abandoned racks of lures: angler crosses in pairs and columns.
  wave(26160, 'angler', 'pair', 2, 0.25),
  wave(26340, 'angler', 'single', 1, 0.5),
  wave(26520, 'clawstrike', 'single', 1, 0.8),
  wave(26700, 'angler', 'column', 2, 0.5, { spread: 0.5 }),
  wave(26880, 'skate', 'line', 3, 0.3),
  wave(27060, 'angler', 'pair', 2, 0.35),
  wave(27240, 'pistol', 'single', 1, 0.5),
  wave(27420, 'angler', 'single', 1, 0.2),
  wave(27540, 'angler', 'single', 1, 0.8),
  wave(27720, 'clawstrike', 'pair', 2, 0.25),
  // Deep vents: the hottest vents: every craft at full pressure before the vault gate.
  wave(27960, 'skate', 'vee', 5, 0.5),
  wave(28140, 'clawstrike', 'pair', 2, 0.2),
  wave(28260, 'pistol', 'pair', 2, 0.3),
  wave(28440, 'angler', 'single', 1, 0.5),
  wave(28620, 'skate', 'stair', 5, 0.15),
  wave(28800, 'clawstrike', 'line', 3, 0.5),
  wave(28980, 'pistol', 'column', 2, 0.5, { spread: 0.5 }),
  wave(29160, 'skate', 'pair', 4, 0.2),
  wave(29340, 'angler', 'pair', 2, 0.3),
  wave(29520, 'skate', 'line', 4, 0.6),
  // Vault gate: the vault guns wake: a last remix before the salvage vault opens.
  wave(29760, 'clawstrike', 'pair', 2, 0.25),
  wave(29940, 'skate', 'vee', 5, 0.5),
  wave(30120, 'pistol', 'pair', 2, 0.2),
  wave(30240, 'angler', 'single', 1, 0.5),
  wave(30420, 'skate', 'stair', 5, 0.85, { step: -1 }),
  wave(30600, 'clawstrike', 'line', 3, 0.35),
  wave(30720, 'pistol', 'single', 1, 0.65),
  wave(30900, 'skate', 'pair', 4, 0.15),
  wave(31080, 'angler', 'pair', 2, 0.25),
  wave(31260, 'clawstrike', 'single', 1, 0.5),
]

const schedule = buildFormationSchedule(TRENCH_WAVES, TRENCH.waveBase)

/** Craft per wave, by wave index, for the school bonus. */
export const TRENCH_WAVE_SIZES: readonly number[] = schedule.sizes

export function trenchStage(
  frame: number,
  defeatedAt: number | null,
): TrenchStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < TRENCH.openingEnds) return 'opening'
  if (frame < TRENCH.turnStarts) return 'waves'
  if (frame < TRENCH.bossStarts) return 'turn'
  return 'boss'
}

/** Every craft that enters on this Act III frame; empty outside the waves stage. */
export function trenchSpawns(frame: number): readonly TrenchSpawn[] {
  return trenchStage(frame, null) === 'waves' ? schedule.at(frame) : []
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function trenchDialogue(
  id: TrenchSceneId,
  elapsed: number,
  players: number,
): TrenchDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const lines: Record<TrenchSceneId, TrenchDialogue[]> = {
    'A03.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Chromatic Trench. The vents are hot, and something down here is still aiming.',
      },
      {
        speaker: lead,
        text: 'Abandoned weapons do not fire on their own. Somebody built these.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Every hull down here wears the same fleet sigil, scratched half off.',
      },
    ],
    'A03.TURN': [
      {
        speaker: 'Lilt-7',
        text: 'Salvage vault ahead. Its locks answer to Crown-compatible hardware.',
      },
      {
        speaker: wing,
        text: 'Crown hardware this deep? Then this trench was an armoury, not a wreck.',
      },
      {
        speaker: lead,
        text: 'That claw has a pilot inside. We break the cannon, not the cockpit.',
      },
    ],
    'A03.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'Clawburst is down and its pilot is alive. Their orders came from old fleet command.',
      },
      {
        speaker: lead,
        text: 'Then we keep the pilot safe and the evidence safer. Both of them matter.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'The salvage dock is quiet. Breathe, repair, then follow those orders upstream.',
      },
    ],
  }
  return lines[id][Math.floor(elapsed / TRENCH.lineFrames)] ?? null
}

export function trenchScene(
  frame: number,
  defeatedFrame: number | null,
): { id: TrenchSceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < TRENCH.aftermathFrames
      ? { id: 'A03.AFTER', elapsed }
      : null
  }
  if (frame < TRENCH.openingEnds) return { id: 'A03.OPEN', elapsed: frame }
  if (frame >= TRENCH.turnStarts && frame < TRENCH.bossStarts) {
    return { id: 'A03.TURN', elapsed: frame - TRENCH.turnStarts }
  }
  return null
}
