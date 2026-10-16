/**
 * Authored Act III encounter director: the Chromatic Trench (S03). Uses local 60 Hz frames after the
 * Moonjelly aftermath, so the global combat tick and inventory never reset. The waves follow the world
 * bible's S03 beats, one new craft per section: E09 clawstrike snipers that mark their lane before a
 * straight bolt, E10 pistol shuttles whose bubbles burst into rings, E11 angler decoys whose false
 * pickup halo flashes a cross before it detonates, and E12 glassfin skates whose pellets ricochet once
 * off the trench walls; then a vault-approach remix. The TURN waits at the salvage vault before B03
 * Clawburst (ACT-STRUCTURE: pre-boss). Wave ids start at 2000 so Act III formations never share a school
 * with Acts I or II.
 */
import {
  buildFormationSchedule,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'

export type TrenchEnemy = 'clawstrike' | 'pistol' | 'angler' | 'skate'
export type TrenchStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type TrenchSceneId = 'A03.OPEN' | 'A03.TURN' | 'A03.AFTER'
export type TrenchDialogue = { speaker: string; text: string }
export type TrenchWave = RainbowWave<TrenchEnemy>
export type TrenchSpawn = RainbowSpawn<TrenchEnemy>

export const TRENCH = {
  openingEnds: 300,
  turnStarts: 8100,
  bossStarts: 8400,
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
] as const

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
