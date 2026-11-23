/**
 * Conductor rainbow t-060, PLOT-MOTHERLAND.md "What each road changes": on the rebel road (the crew flew high at
 * Act V's memorial and turned on the empire) the fight itself changes in Acts VI-VIII. Some Ocean craft stop
 * shooting at C.A.T.S., and the Motherland's own drones join the enemy waves in their place. The loyal road keeps
 * every wave exactly as authored.
 *
 * Everything here is derived from the authored wave lists, so a road is deterministic and replays identically:
 * - Every third Ocean school of each Act (its school index % 3 === 1) of a kind that only attacks through its aimed volley holds a
 *   truce: those craft never fire, never ram, and C.A.T.S. shots, specials and bodies pass through them.
 * - A Motherland drone pair launches a beat after each truce school enters, in the school's own lane, so the
 *   pressure moves to the empire rather than vanishing.
 * Kinds that attack some other way (mortar shells, a clawstrike's lane bolt, a broodship's launches) or that are
 * terrain, objectives or captives never hold a truce.
 */
import type { RainbowAllegiance } from './rainbowAllegiance'
import {
  CROWN_REEF,
  CROWN_REEF_ALL_WAVES,
  reefWaveRoute,
  type ReefRoute,
} from './rainbowCrownReef'
import { PALACE, PALACE_WAVES } from './rainbowEclipsePalace'
import { laneY, type RainbowWave } from './rainbowFormations'
import { GLASS, GLASS_WAVES } from './rainbowGlassCurrent'

/** The Motherland's interceptor: white-and-gold, angular, nothing like the Ocean's living craft. */
export type MotherlandEnemy = 'motherdrone'
export type RebelAct = 6 | 7 | 8

export const REBEL_ROAD = {
  /** Every third school, offset so the first school of each Act still fights. */
  truceEvery: 3,
  truceOffset: 1,
  /** Frames after the truce school's first craft before its Motherland escort launches. */
  escortDelay: 45,
  /** The escort pair flies this far above and below the school's lane, kept inside the lanes. */
  escortSpread: 26,
  escortTop: 52,
  escortBottom: 218,
  /** Motherland drone flight and fire. */
  drone: {
    glide: 1.35,
    steer: 0.35,
    firstShotX: 120,
    secondShotX: 260,
    volleySpeed: 2.2,
    volleySpread: 0.22,
    health: 4,
  },
} as const

/** Ocean kinds, per Act, whose only attack is their aimed volley: these can hold a truce. */
export const REBEL_TRUCE_KINDS: Readonly<Record<RebelAct, readonly string[]>> =
  {
    6: ['turret', 'bulwark', 'drone'],
    7: ['mirror', 'squid', 'harbinger', 'prism'],
    8: ['harbinger', 'spiral', 'cutter', 'lantern', 'mirror', 'pistol'],
  }

const ACT_WAVES: Readonly<
  Record<RebelAct, { base: number; waves: readonly RainbowWave<string>[] }>
> = {
  6: { base: CROWN_REEF.waveBase, waves: CROWN_REEF_ALL_WAVES },
  7: { base: GLASS.waveBase, waves: GLASS_WAVES },
  8: { base: PALACE.waveBase, waves: PALACE_WAVES },
}

/** `index` counts the Act's own schools from 0, so every Act's pattern starts the same way. */
function truceSchool(act: RebelAct, wave: RainbowWave<string>, index: number) {
  return (
    index % REBEL_ROAD.truceEvery === REBEL_ROAD.truceOffset &&
    REBEL_TRUCE_KINDS[act].includes(wave.kind)
  )
}

/** Whether this craft, entering in this Act's wave, holds a truce on this road. */
export function rebelTruce(
  allegiance: RainbowAllegiance | null,
  act: number,
  kind: string,
  wave: number | null,
): boolean {
  if (allegiance !== 'rebel' || wave === null) return false
  if (act !== 6 && act !== 7 && act !== 8) return false
  const { base, waves } = ACT_WAVES[act]
  const authored = waves[wave - base]
  return (
    authored !== undefined &&
    authored.kind === kind &&
    truceSchool(act, authored, wave - base)
  )
}

/** Truce schools per Act (Act VI by route: a route-only school counts on its own route). */
export function rebelTruceWaves(
  act: RebelAct,
  route: ReefRoute | null = null,
): number[] {
  const { base, waves } = ACT_WAVES[act]
  const ids: number[] = []
  waves.forEach((wave, index) => {
    if (act === 6) {
      const only = reefWaveRoute(index)
      if (only !== null && only !== route) return
    }
    if (truceSchool(act, wave, index)) ids.push(base + index)
  })
  return ids
}

/** The Motherland escorts that launch on this frame of this Act, rebel road only. */
export function rebelEscortSpawns(
  allegiance: RainbowAllegiance | null,
  act: number,
  frame: number,
  route: ReefRoute | null = null,
): { kind: MotherlandEnemy; y: number }[] {
  if (allegiance !== 'rebel') return []
  if (act !== 6 && act !== 7 && act !== 8) return []
  const { base, waves } = ACT_WAVES[act]
  const spawns: { kind: MotherlandEnemy; y: number }[] = []
  for (const id of rebelTruceWaves(act, route)) {
    const wave = waves[id - base]!
    if (wave.at + REBEL_ROAD.escortDelay !== frame) continue
    const y = laneY(wave.lane)
    for (const side of [-1, 1])
      spawns.push({
        kind: 'motherdrone',
        y: Math.max(
          REBEL_ROAD.escortTop,
          Math.min(REBEL_ROAD.escortBottom, y + side * REBEL_ROAD.escortSpread),
        ),
      })
  }
  return spawns
}

/** How faint a truce craft swims, so the pilots read it as out of the fight at a glance. */
export const REBEL_TRUCE_ALPHA = 0.62

/** The code-drawn Motherland drone (until its painting loads): a white-and-gold arrowhead with a crown crest. */
export function drawMotherlandDrone(g: CanvasRenderingContext2D): void {
  g.save()
  g.shadowColor = '#ffd76a'
  g.shadowBlur = 10
  g.fillStyle = '#fbf6ee'
  g.strokeStyle = '#c99a2e'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(-16, 0)
  g.lineTo(8, -9)
  g.lineTo(14, -3)
  g.lineTo(14, 3)
  g.lineTo(8, 9)
  g.closePath()
  g.fill()
  g.stroke()
  g.fillStyle = '#e8b93a'
  g.beginPath()
  g.moveTo(-2, -6)
  g.lineTo(1, -12)
  g.lineTo(4, -8)
  g.lineTo(7, -13)
  g.lineTo(8, -7)
  g.closePath()
  g.fill()
  g.fillStyle = '#ff4fc3'
  g.fillRect(-11, -1.5, 7, 3)
  g.restore()
}

/** A small beating heart over a truce craft. */
export function drawTruceHeart(
  g: CanvasRenderingContext2D,
  tick: number,
): void {
  const beat = 1 + Math.sin(tick / 10) * 0.08
  g.save()
  g.globalAlpha = 0.9
  g.translate(0, -17)
  g.scale(beat, beat)
  g.fillStyle = '#ff7ccf'
  g.strokeStyle = '#ffffff'
  g.lineWidth = 1.2
  g.beginPath()
  g.moveTo(0, 3)
  g.bezierCurveTo(-6, -2, -3, -7, 0, -3)
  g.bezierCurveTo(3, -7, 6, -2, 0, 3)
  g.fill()
  g.stroke()
  g.restore()
}
