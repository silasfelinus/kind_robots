/**
 * Shared formation director for the Rainbow Space Princess Acts. Waves are authored data; this module
 * expands each into its members' entry ticks and lanes and builds a per-tick spawn schedule. Lanes run
 * 0 (top) to 1 (bottom) and map onto the playfield between the HUD and the coral floor.
 */
export type RainbowFormation =
  'single' | 'line' | 'column' | 'vee' | 'pair' | 'stair' | 'wall'

/** One authored wave; a wall leaves its open corridor centred on `lane`. */
export type RainbowWave<Kind extends string> = {
  at: number
  kind: Kind
  formation: RainbowFormation
  count: number
  lane: number
  spread?: number
  step?: 1 | -1
}

export type RainbowSpawn<Kind extends string> = {
  kind: Kind
  y: number
  wave: number
}

export const RAINBOW_LANES = {
  top: 52,
  span: 166,
  wallPitch: 0.18,
  schoolSize: 3,
  schoolBonusPerCraft: 50,
} as const

export const laneY = (lane: number) =>
  RAINBOW_LANES.top + lane * RAINBOW_LANES.span

export function wave<Kind extends string>(
  at: number,
  kind: Kind,
  formation: RainbowFormation,
  count: number,
  lane: number,
  extra: Pick<RainbowWave<Kind>, 'spread' | 'step'> = {},
): RainbowWave<Kind> {
  return { at, kind, formation, count, lane, ...extra }
}

const clampLane = (lane: number) => Math.max(0, Math.min(1, lane))

/** Expand one wave into its members' entry ticks and lanes. */
export function formationMembers<Kind extends string>(
  wave: RainbowWave<Kind>,
): Array<{ at: number; lane: number }> {
  const { at, count, lane } = wave
  const members: Array<{ at: number; lane: number }> = []
  if (wave.formation === 'single') members.push({ at, lane })
  else if (wave.formation === 'line') {
    for (let i = 0; i < count; i++) members.push({ at: at + i * 16, lane })
  } else if (wave.formation === 'column') {
    const spread = wave.spread ?? 0.16
    for (let i = 0; i < count; i++) {
      members.push({ at, lane: lane + (i - (count - 1) / 2) * spread })
    }
  } else if (wave.formation === 'vee') {
    members.push({ at, lane })
    for (let k = 1; members.length < count; k++) {
      members.push({ at: at + k * 12, lane: lane - k * 0.12 })
      if (members.length < count)
        members.push({ at: at + k * 12, lane: lane + k * 0.12 })
    }
  } else if (wave.formation === 'pair') {
    const each = Math.max(1, Math.round(count / 2))
    for (let i = 0; i < each; i++) {
      members.push({ at: at + i * 16, lane })
      members.push({ at: at + i * 16, lane: 1 - lane })
    }
  } else if (wave.formation === 'stair') {
    const step = wave.step ?? 1
    for (let i = 0; i < count; i++) {
      members.push({ at: at + i * 20, lane: lane + i * step * 0.14 })
    }
  } else {
    const pitch = RAINBOW_LANES.wallPitch
    for (let k = 1; members.length < count; k++) {
      const above = lane - k * pitch
      const below = lane + k * pitch
      if (above < 0 && below > 1) break
      if (above >= 0) members.push({ at, lane: above })
      if (below <= 1 && members.length < count)
        members.push({ at, lane: below })
    }
  }
  return members.map((member) => ({ ...member, lane: clampLane(member.lane) }))
}

/**
 * Build a tick-indexed schedule. `waveBase` offsets wave ids so each Act's formations stay distinct
 * for the school bonus.
 */
export function buildFormationSchedule<Kind extends string>(
  waves: readonly RainbowWave<Kind>[],
  waveBase = 0,
) {
  const schedule = new Map<number, RainbowSpawn<Kind>[]>()
  waves.forEach((entry, index) => {
    for (const member of formationMembers(entry)) {
      const list = schedule.get(member.at) ?? []
      list.push({
        kind: entry.kind,
        y: laneY(member.lane),
        wave: waveBase + index,
      })
      schedule.set(member.at, list)
    }
  })
  return {
    sizes: waves.map((entry) => formationMembers(entry).length),
    at: (tick: number): readonly RainbowSpawn<Kind>[] =>
      schedule.get(tick) ?? [],
  }
}
