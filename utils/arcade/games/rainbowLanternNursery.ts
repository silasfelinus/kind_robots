/** Alternate Act A: Lantern Nursery. An authored score for a hidden sea-creature sanctuary.
 * Campaign integration, checkpoints and production art remain outstanding in t-028.
 */
import { buildFormationSchedule, wave } from './rainbowFormations'
import type { RainbowSpawn, RainbowWave } from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'

export type NurseryEnemy = 'angler' | 'pistol' | 'skate' | 'clawstrike'
export type NurseryWave = RainbowWave<NurseryEnemy>
export type NurserySpawn = RainbowSpawn<NurseryEnemy>

export const NURSERY = {
  name: 'Lantern Nursery',
  waveBase: 9200,
  openingEnds: 240,
  turnStarts: 4380,
  bossStarts: 4680,
} as const

export const NURSERY_SECTIONS = [
  { name: 'Luminous eggs', from: 240, to: 1080 },
  { name: 'Sleeping shoal', from: 1080, to: 1920 },
  { name: 'Broken lanterns', from: 1920, to: 2760 },
  { name: 'Nursery heart', from: 2760, to: 3600 },
  { name: 'Lantern matriarch', from: 3600, to: 4380 },
] as const

export const NURSERY_GUARDIAN: RainbowGuardianSection = {
  name: 'Lantern matriarch',
  from: 3600,
  to: 4380,
  kind: 'lantern',
}

/** Teach false pickup halos, remix with bubble rings, subvert with skates,
 * and test reading sniper marks while guarding the nursery's living heart.
 */
export const NURSERY_WAVES: readonly NurseryWave[] = [
  wave(300, 'angler', 'single', 1, 0.3),
  wave(480, 'angler', 'single', 1, 0.7),
  wave(660, 'pistol', 'single', 1, 0.5),
  wave(840, 'angler', 'pair', 2, 0.25),
  wave(1020, 'pistol', 'single', 1, 0.7),
  wave(1140, 'pistol', 'pair', 2, 0.3),
  wave(1320, 'angler', 'single', 1, 0.5),
  wave(1500, 'pistol', 'column', 2, 0.5, { spread: 0.4 }),
  wave(1680, 'angler', 'pair', 2, 0.2),
  wave(1860, 'pistol', 'pair', 2, 0.65),
  wave(1980, 'skate', 'line', 3, 0.3),
  wave(2160, 'angler', 'single', 1, 0.75),
  wave(2340, 'skate', 'stair', 3, 0.2),
  wave(2520, 'pistol', 'single', 1, 0.5),
  wave(2700, 'skate', 'line', 3, 0.7),
  wave(2820, 'clawstrike', 'single', 1, 0.2),
  wave(3000, 'angler', 'pair', 2, 0.4),
  wave(3180, 'clawstrike', 'single', 1, 0.8),
  wave(3360, 'skate', 'vee', 3, 0.5),
  wave(3540, 'pistol', 'pair', 2, 0.25),
]

const schedule = buildFormationSchedule(NURSERY_WAVES, NURSERY.waveBase)
export const NURSERY_WAVE_SIZES: readonly number[] = schedule.sizes

export function nurseryStage(frame: number) {
  if (frame < NURSERY.openingEnds) return 'opening'
  if (frame < NURSERY.turnStarts) return 'waves'
  if (frame < NURSERY.bossStarts) return 'turn'
  return 'boss'
}

export function nurserySpawns(frame: number): readonly NurserySpawn[] {
  return nurseryStage(frame) === 'waves' ? schedule.at(frame) : []
}
