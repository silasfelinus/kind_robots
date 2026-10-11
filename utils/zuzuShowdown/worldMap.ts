// /utils/zuzuShowdown/worldMap.ts
//
// The wasteland (conductor zuzu-showdown t-029): one map of the Shifting Lands that the character
// select shows each side's home on, and that Story mode travels across between fights, a red route
// drawing itself from where the challenger stands to the next opponent's ground, Indiana Jones style.
//
// The geography is extrapolated from the eight stages and Shifting Lands' five lands (its DESIGN-BRIEF):
// Hollow Bell and the Lone Apple Tree in the west, the Mission on its hill to the south-west (the
// Homestead), the Watering Hole in the middle of the plain with the Coyote's camp and the Witch's mire
// beside it (Dustwater Crossing), Storm Canyon in the broken tablelands to the north-east, the Bone Yard
// in the eastern badlands, the Dunes to the south-east, and the Thin Place at the eastern edge of
// everything (the Black Verge). Positions are fractions of the map, so the same pins sit on the drawn
// map and on the painted one (worldMap art, when it has rendered).

import { drawText, measureText } from '../arcade/font'
import type { RenderStyle } from '../arcade/display'
import { drawPortrait, type LoadedPortraits } from './portraits'
import manifest from './worldMap.json'

/** Where the painted map is served from, once conductor's tools/world_map.py has shipped it. */
export const MAP_ROOT = '/zuzu-showdown-map'

/** Whether the painted map has shipped; until it has, the map is drawn in ink (drawInkMap). */
export function mapArtShipped(): boolean {
  return manifest.shipped === true
}

export function mapArtUrl(style: RenderStyle): string {
  return `${MAP_ROOT}/wasteland-${style === 'hd' ? 'hd.webp' : 'pixel.png'}`
}

type G = CanvasRenderingContext2D

export type MapPoint = { x: number; y: number }

/** A named place on the map, by stage. */
export type MapPlace = MapPoint & { name: string }

// Pinned to the painted map's landmarks (conductor art/T029-WORLD-MAP.yaml wasteland-map-3, krea2).
export const PLACES: Record<string, MapPlace> = {
  'hollow-bell': { name: 'HOLLOW BELL', x: 0.12, y: 0.41 },
  'lone-apple-tree': { name: 'LONE APPLE TREE', x: 0.13, y: 0.19 },
  'the-mission': { name: 'THE MISSION', x: 0.18, y: 0.69 },
  'watering-hole': { name: 'THE WATERING HOLE', x: 0.42, y: 0.47 },
  'storm-canyon': { name: 'STORM CANYON', x: 0.63, y: 0.22 },
  'bone-yard': { name: 'BONE YARD', x: 0.81, y: 0.5 },
  'the-dunes': { name: 'THE DUNES', x: 0.67, y: 0.8 },
  'the-thin-place': { name: 'THE THIN PLACE', x: 0.95, y: 0.26 },
}

/**
 * Where each fighter is found: their stage's place, or beside it when they share one (the Coyote camps
 * on the road into the Watering Hole, the Witch keeps to the mire on its far side).
 */
export const HOMES: Record<string, MapPoint> = {
  zuzu: PLACES['hollow-bell']!,
  'the-siblings': PLACES['lone-apple-tree']!,
  'the-abbess': PLACES['the-mission']!,
  'river-croc': PLACES['watering-hole']!,
  'coyote-vagrant': { x: 0.35, y: 0.54 },
  'swamp-witch': { x: 0.55, y: 0.47 },
  'storm-crow': PLACES['storm-canyon']!,
  'hyena-matriarch': PLACES['bone-yard']!,
  'old-komodo': PLACES['the-dunes']!,
  'thing-behind-the-door': PLACES['the-thin-place']!,
}

export function homeOf(slug: string): MapPoint {
  return HOMES[slug] ?? PLACES['hollow-bell']!
}

/** Where the map sits on screen. */
export type MapRect = { x: number; y: number; w: number; h: number }

export function mapToScreen(p: MapPoint, r: MapRect): { x: number; y: number } {
  return { x: r.x + p.x * r.w, y: r.y + p.y * r.h }
}

/**
 * The point `t` (0..1) along the route from `a` to `b`: a gentle arc, bowed to one side, the way a
 * route is inked on an old map.
 */
export function routePoint(a: MapPoint, b: MapPoint, t: number): MapPoint {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const bow = 0.18
  const cx = mx - dy * bow
  const cy = my + dx * bow
  const u = 1 - t
  return {
    x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
    y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
  }
}

const PARCHMENT = '#d9c391'
const PARCHMENT_DARK = '#b89a62'
const INK = '#4a3420'
const INK_SOFT = 'rgba(74, 52, 32, 0.55)'
const WATER = '#5f8a8b'
const ROUTE = '#b91c1c'

function at(r: MapRect, x: number, y: number) {
  return { x: r.x + x * r.w, y: r.y + y * r.h }
}

/** The map itself: the painted one when it has loaded, otherwise drawn in ink on parchment. */
export function drawWorldMap(
  g: G,
  r: MapRect,
  art: CanvasImageSource | undefined,
  labels: boolean,
): void {
  g.save()
  g.beginPath()
  g.rect(r.x, r.y, r.w, r.h)
  g.clip()
  if (art) {
    g.drawImage(art, r.x, r.y, r.w, r.h)
  } else {
    drawInkMap(g, r)
  }
  if (labels) {
    for (const place of Object.values(PLACES)) {
      const p = at(r, place.x, place.y)
      // Kept inside the map's edges (the Thin Place sits hard against the east).
      const half = measureText(place.name) / 2 + 2
      const x = Math.min(r.x + r.w - half, Math.max(r.x + half, p.x))
      drawText(g, place.name, x, p.y + 9, {
        align: 'center',
        color: '#2b1d10',
        outline: 'rgba(233, 214, 170, 0.85)',
      })
    }
  }
  // A dark edge, like a map that has been folded and carried.
  g.strokeStyle = 'rgba(43, 29, 16, 0.85)'
  g.lineWidth = 2
  g.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2)
  g.restore()
}

function drawInkMap(g: G, r: MapRect): void {
  const s = Math.min(r.w / 480, r.h / 270)
  g.fillStyle = PARCHMENT
  g.fillRect(r.x, r.y, r.w, r.h)
  // Stains and wear toward the edges.
  g.fillStyle = 'rgba(150, 110, 60, 0.18)'
  for (const [x, y, rx, ry] of [
    [0.05, 0.1, 0.12, 0.18],
    [0.95, 0.9, 0.14, 0.2],
    [0.85, 0.08, 0.1, 0.12],
    [0.1, 0.92, 0.12, 0.12],
  ] as const) {
    const c = at(r, x, y)
    g.beginPath()
    g.ellipse(c.x, c.y, rx * r.w, ry * r.h, 0, 0, Math.PI * 2)
    g.fill()
  }

  // The river, down from the canyon through the Watering Hole and away south.
  g.strokeStyle = WATER
  g.lineWidth = Math.max(1, 2 * s)
  g.beginPath()
  const river = [
    [0.6, 0.0],
    [0.62, 0.12],
    [0.55, 0.28],
    [0.5, 0.42],
    [0.48, 0.5],
    [0.44, 0.66],
    [0.47, 0.82],
    [0.42, 1.0],
  ] as const
  river.forEach(([x, y], i) => {
    const p = at(r, x, y)
    if (i === 0) g.moveTo(p.x, p.y)
    else g.lineTo(p.x, p.y)
  })
  g.stroke()
  // The Watering Hole and the mire.
  const hole = at(r, 0.48, 0.5)
  g.fillStyle = WATER
  g.beginPath()
  g.ellipse(hole.x, hole.y, 0.045 * r.w, 0.06 * r.h, 0, 0, Math.PI * 2)
  g.fill()
  const mire = at(r, 0.58, 0.61)
  g.fillStyle = 'rgba(63, 90, 58, 0.55)'
  g.beginPath()
  g.ellipse(mire.x, mire.y, 0.05 * r.w, 0.045 * r.h, 0.3, 0, Math.PI * 2)
  g.fill()

  // Mountains and the canyon to the north-east.
  g.fillStyle = PARCHMENT_DARK
  g.strokeStyle = INK
  g.lineWidth = Math.max(1, s)
  for (const [x, y, size] of [
    [0.6, 0.16, 0.06],
    [0.66, 0.1, 0.07],
    [0.73, 0.15, 0.06],
    [0.79, 0.09, 0.05],
    [0.71, 0.27, 0.045],
    [0.56, 0.08, 0.045],
  ] as const) {
    const c = at(r, x, y)
    const w = size * r.w
    g.beginPath()
    g.moveTo(c.x - w / 2, c.y + w * 0.45)
    g.lineTo(c.x, c.y - w * 0.45)
    g.lineTo(c.x + w / 2, c.y + w * 0.45)
    g.closePath()
    g.fill()
    g.stroke()
  }
  // The dunes to the south-east: rows of ink arcs.
  g.strokeStyle = INK_SOFT
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const c = at(r, 0.6 + col * 0.05 + (row % 2) * 0.025, 0.74 + row * 0.06)
      g.beginPath()
      g.arc(c.x, c.y, 0.022 * r.w, Math.PI * 1.1, Math.PI * 1.9)
      g.stroke()
    }
  }
  // Scrub dots across the plain.
  g.fillStyle = INK_SOFT
  for (let i = 0; i < 70; i += 1) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1
    const y = (Math.sin(i * 78.233) * 12345.6789) % 1
    const p = at(r, 0.02 + 0.96 * Math.abs(x), 0.02 + 0.96 * Math.abs(y))
    g.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, s), Math.max(1, s))
  }

  // Trails between the places, dotted.
  g.strokeStyle = INK_SOFT
  g.lineWidth = Math.max(1, s)
  g.setLineDash?.([Math.max(2, 3 * s), Math.max(2, 3 * s)])
  const trails: Array<[string, string]> = [
    ['lone-apple-tree', 'hollow-bell'],
    ['hollow-bell', 'the-mission'],
    ['hollow-bell', 'watering-hole'],
    ['the-mission', 'watering-hole'],
    ['watering-hole', 'storm-canyon'],
    ['watering-hole', 'bone-yard'],
    ['watering-hole', 'the-dunes'],
    ['bone-yard', 'the-thin-place'],
    ['storm-canyon', 'the-thin-place'],
  ]
  for (const [a, b] of trails) {
    const pa = at(r, PLACES[a]!.x, PLACES[a]!.y)
    const pb = at(r, PLACES[b]!.x, PLACES[b]!.y)
    g.beginPath()
    g.moveTo(pa.x, pa.y)
    g.lineTo(pb.x, pb.y)
    g.stroke()
  }
  g.setLineDash?.([])

  // The places, each as a small inked landmark.
  const icon = Math.max(3, 6 * s)
  g.fillStyle = INK
  g.strokeStyle = INK
  // Hollow Bell: a few roofs and the bell tower.
  const town = at(r, PLACES['hollow-bell']!.x, PLACES['hollow-bell']!.y)
  g.fillRect(town.x - icon * 1.2, town.y - icon * 0.4, icon * 0.8, icon * 0.6)
  g.fillRect(town.x + icon * 0.4, town.y - icon * 0.3, icon * 0.8, icon * 0.5)
  g.fillRect(town.x - icon * 0.2, town.y - icon * 1.4, icon * 0.4, icon * 1.6)
  // The Lone Apple Tree: a trunk and a round crown, with red apples.
  const tree = at(r, PLACES['lone-apple-tree']!.x, PLACES['lone-apple-tree']!.y)
  g.fillRect(tree.x - icon * 0.12, tree.y - icon * 0.6, icon * 0.24, icon * 0.8)
  g.beginPath()
  g.arc(tree.x, tree.y - icon * 0.9, icon * 0.6, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#b91c1c'
  g.fillRect(tree.x - icon * 0.3, tree.y - icon, Math.max(1, s), Math.max(1, s))
  g.fillRect(
    tree.x + icon * 0.2,
    tree.y - icon * 0.7,
    Math.max(1, s),
    Math.max(1, s),
  )
  g.fillStyle = INK
  // The Mission: a chapel and its bell arch on the hill.
  const mission = at(r, PLACES['the-mission']!.x, PLACES['the-mission']!.y)
  g.fillRect(
    mission.x - icon * 0.8,
    mission.y - icon * 0.5,
    icon * 1.6,
    icon * 0.7,
  )
  g.fillRect(
    mission.x - icon * 0.25,
    mission.y - icon * 1.2,
    icon * 0.5,
    icon * 0.7,
  )
  // The Bone Yard: the ruined arch.
  const bones = at(r, PLACES['bone-yard']!.x, PLACES['bone-yard']!.y)
  g.lineWidth = Math.max(1, 1.5 * s)
  g.beginPath()
  g.arc(bones.x, bones.y, icon * 0.8, Math.PI, Math.PI * 2)
  g.stroke()
  // The Thin Place: a tear of starry dark over a lone door.
  const thin = at(r, PLACES['the-thin-place']!.x, PLACES['the-thin-place']!.y)
  g.fillStyle = '#1e1030'
  g.beginPath()
  g.ellipse(
    thin.x,
    thin.y - icon * 0.6,
    icon * 0.9,
    icon * 1.5,
    0.2,
    0,
    Math.PI * 2,
  )
  g.fill()
  g.fillStyle = '#e9d5ff'
  g.fillRect(
    thin.x - icon * 0.3,
    thin.y - icon * 1.2,
    Math.max(1, s),
    Math.max(1, s),
  )
  g.fillRect(
    thin.x + icon * 0.3,
    thin.y - icon * 0.4,
    Math.max(1, s),
    Math.max(1, s),
  )
  g.fillStyle = '#facc15'
  g.fillRect(thin.x - icon * 0.2, thin.y - icon * 0.3, icon * 0.4, icon * 0.6)
}

/** A fighter's token on the map: their bust in a ringed disc, or a coloured dot until it has loaded. */
export function drawToken(
  g: G,
  portraits: LoadedPortraits | undefined,
  slug: string,
  x: number,
  y: number,
  size: number,
  ring: string,
  fill = '#57534e',
): void {
  g.save()
  g.beginPath()
  g.arc(x, y, size / 2, 0, Math.PI * 2)
  g.fillStyle = '#1c1917'
  g.fill()
  g.clip()
  const drawn = drawPortrait(
    g,
    portraits,
    slug,
    'bust',
    x,
    y + size / 2,
    false,
    size / 50,
  )
  if (!drawn) {
    g.fillStyle = fill
    g.fillRect(x - size / 2, y - size / 2, size, size)
  }
  g.restore()
  g.strokeStyle = ring
  g.lineWidth = Math.max(1, size / 12)
  g.beginPath()
  g.arc(x, y, size / 2, 0, Math.PI * 2)
  g.stroke()
}

/** An inked X where a fight has been won. */
export function drawCrossedOff(g: G, x: number, y: number, size: number): void {
  g.strokeStyle = ROUTE
  g.lineWidth = Math.max(1, size / 6)
  g.beginPath()
  g.moveTo(x - size / 2, y - size / 2)
  g.lineTo(x + size / 2, y + size / 2)
  g.moveTo(x + size / 2, y - size / 2)
  g.lineTo(x - size / 2, y + size / 2)
  g.stroke()
}

/**
 * The red route from `a` to `b`, drawn as far as `progress` (0..1): a solid line for a leg already
 * travelled, a dashed one for the leg under way.
 */
export function drawRoute(
  g: G,
  r: MapRect,
  a: MapPoint,
  b: MapPoint,
  progress: number,
  dashed: boolean,
): void {
  const steps = 32
  const upto = Math.max(0, Math.min(1, progress))
  g.save()
  g.strokeStyle = dashed ? ROUTE : 'rgba(185, 28, 28, 0.55)'
  g.lineWidth = dashed ? 2 : 1.5
  g.lineCap = 'round'
  g.setLineDash?.(dashed ? [4, 3] : [])
  g.beginPath()
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * upto
    const p = mapToScreen(routePoint(a, b, t), r)
    if (i === 0) g.moveTo(p.x, p.y)
    else g.lineTo(p.x, p.y)
  }
  g.stroke()
  g.restore()
}

export const ROUTE_COLOUR = ROUTE
