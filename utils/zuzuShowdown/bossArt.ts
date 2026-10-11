// /utils/zuzuShowdown/bossArt.ts
//
// The Thing Behind the Door, drawn (conductor zuzu-showdown t-021): never whole, only the door at the
// stage's edge and what comes through it, from the T021 layers (conductor tools/boss_layers.py). The door
// widens with each phase; the tentacle that is striking rises out of the floor under its target (the slam,
// the grasp, the portals) or slides out along the floor from the door (the sweep), drawn by how far the
// attack is through its frames; the eye glows in the door before the beam, and in phase 3 hangs out of
// the door at head height, where its hurtbox is. A dark ring on the floor warns where a tentacle will
// rise. Until a layer loads, a plain shape stands in.

import { moveOf } from './sim'
import { bossPhase } from './boss'
import index from './bossLayers.json'
import type { RenderStyle } from '../arcade/display'
import { screenX, screenY, type FighterPainter } from './render'
import type { FighterData, MatchState } from './types'

type G = CanvasRenderingContext2D

export const BOSS_ROOT = '/zuzu-showdown-boss'

export type BossLayer =
  'door' | 'eye' | 'tentacle-rise' | 'tentacle-sweep' | 'tentacle-grasp'

const SIZES = index as Record<BossLayer, { w: number; h: number }>

export const BOSS_LAYERS = Object.keys(SIZES) as BossLayer[]

export function bossLayerUrl(layer: BossLayer, style: RenderStyle): string {
  return `${BOSS_ROOT}/${layer}-${style === 'hd' ? 'hd.webp' : 'pixel.png'}`
}

export type LoadedBossArt = Partial<Record<BossLayer, CanvasImageSource>>

/** The door's width in each phase: it widens as the Thing comes through. */
const DOOR_SCALE = [1, 1.12, 1.22]

function layer(
  g: G,
  art: LoadedBossArt,
  name: BossLayer,
  x: number,
  floor: number,
  scaleX: number,
  scaleY: number,
  flip: boolean,
  fallback: string,
): void {
  const size = SIZES[name]
  const w = size.w * scaleX
  const h = size.h * scaleY
  const image = art[name]
  g.save()
  g.translate(x, floor)
  if (flip) g.scale(-1, 1)
  if (image) g.drawImage(image, -w / 2, -h, w, h)
  else {
    g.fillStyle = fallback
    g.fillRect(-w / 2, -h, w, h)
  }
  g.restore()
}

/** How far a tentacle is out of the floor: rising through startup, up while active, sinking after. */
function emergence(
  frame: number,
  startup: number,
  active: number,
  recovery: number,
): number {
  if (frame < startup)
    return Math.max(0, (frame - startup * 0.5) / (startup * 0.5))
  if (frame < startup + active) return 1
  return Math.max(
    0,
    1 - (frame - startup - active) / Math.max(1, recovery * 0.6),
  )
}

function warningRing(g: G, x: number, floor: number, width: number, t: number) {
  g.save()
  g.globalAlpha = 0.5 + 0.3 * Math.sin(t / 3)
  g.fillStyle = '#1e0b33'
  g.beginPath()
  g.ellipse(x, floor - 2, width / 2, 5, 0, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#a855f7'
  g.lineWidth = 1
  g.stroke()
  g.restore()
}

/** A painter for the boss (render.ts `painters`), drawing from `art`. */
export function bossPainter(
  data: FighterData,
  art: () => LoadedBossArt,
): FighterPainter {
  return (g: G, s: MatchState, side: 0 | 1, camera: number) => {
    const f = s.fighters[side]
    const layers = art()
    const phase = bossPhase(s, side)
    const x = screenX(f.x, camera)
    const floor = screenY(0)
    const facing = f.facing
    const door = DOOR_SCALE[phase] ?? 1
    layer(g, layers, 'door', x, floor, door, 1, false, '#1e1030')

    const attack = f.attack
    const move = attack ? moveOf(data, attack) : null
    // The eye glows in the door before a beam.
    if (attack && attack.id === 'beam' && move && attack.frame < move.startup) {
      g.save()
      g.globalAlpha = Math.min(1, attack.frame / move.startup)
      g.fillStyle = '#facc15'
      g.beginPath()
      g.arc(x, floor - 92, 6 + attack.frame / 6, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
    // Phase 3: the eye hangs out of the door at head height, where it can be hit.
    if (phase >= 2) {
      const bob = Math.round(Math.sin(s.frame / 12) * 2)
      layer(
        g,
        layers,
        'eye',
        x + facing * 30,
        floor - 40 + bob,
        1,
        1,
        facing === 1,
        '#facc15',
      )
    }
    if (!attack || !move) return
    const t = attack.frame
    const out = emergence(t, move.startup, move.active, move.recovery)
    if (attack.id === 'sweep') {
      // Slides out along the floor from the door's foot toward the opponent.
      const length = Math.max(0.05, out)
      const reach = SIZES['tentacle-sweep'].w * 1.5 * length
      layer(
        g,
        layers,
        'tentacle-sweep',
        x + (facing * reach) / 2,
        floor + 4,
        1.5 * length,
        1,
        facing === 1,
        '#2e1065',
      )
      return
    }
    const target =
      attack.targetX !== undefined ? screenX(attack.targetX, camera) : x
    const name: BossLayer =
      attack.id === 'grasp' ? 'tentacle-grasp' : 'tentacle-rise'
    if (
      attack.id === 'slam' ||
      attack.id === 'grasp' ||
      attack.id === 'portals'
    ) {
      if (t < move.startup)
        warningRing(
          g,
          target,
          floor,
          attack.id === 'portals' ? 52 : 40,
          s.frame,
        )
      const scale = attack.id === 'portals' ? 0.6 : 1
      if (out <= 0) return
      // Rises out of the floor: clipped at the floor line, pushed up by how far out it is.
      g.save()
      g.beginPath()
      g.rect(target - 80, 0, 160, floor + 2)
      g.clip()
      const h = SIZES[name].h * scale
      layer(
        g,
        layers,
        name,
        target,
        floor + h * (1 - out),
        scale,
        scale,
        facing === 1,
        '#2e1065',
      )
      g.restore()
    }
  }
}
