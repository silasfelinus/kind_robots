// /utils/zuzuShowdown/render.ts
//
// Draws a Zuzu Showdown match on a 480x270 canvas (conductor zuzu-showdown
// t-006): a parallax placeholder stage, placeholder fighters drawn from their
// real boxes, projectiles, an optional hitbox overlay, the HUD (life bars with
// red recoverable health, the three-bar meter, timer, round pips, names,
// combo counter), callouts (ROUND, FIGHT, READ!, COUNTER ...), hit sparks
// (effects.ts, t-010), the super flash and the Showdown eye strip.
//
// Everything here reads the sim state and never changes it. Sprite art
// replaces drawFighter and the stage layers in the art tasks (t-009, t-010+).

import type { RenderStyle } from '../arcade/display'
import {
  FONT_HEIGHT,
  drawText,
  measureText,
  setTextStyle,
} from '../arcade/font'
import { SPARK_PALETTES, SPARK_PIXELS, sparkFrame, type Spark } from './effects'
import {
  drawSprite,
  pickSprite,
  type LoadedSprites,
  type SpriteContext,
} from './sprites'
import {
  CROC_EYES,
  STAGE_INK,
  TUMBLEWEED,
  VULTURE,
  HYENA,
  PERCHES,
  RIFTS,
  appleAt,
  bellAngle,
  candleFlame,
  debrisAt,
  embersAt,
  packAt,
  doorOpen,
  duneSlumpAt,
  riftGlow,
  sandBlowAt,
  dustDevilAt,
  leavesAt,
  crocEyesAt,
  crowsAt,
  lightningAt,
  portalGlow,
  rainAt,
  layerX,
  smokePuffs,
  tumbleweedAt,
  vulturesAt,
  waterGlints,
  type LoadedStage,
  type PixelSprite,
  type StageFx,
  type StageLayer,
} from './stages'
import {
  METER_BAR,
  STAGE_HALF_WIDTH,
  hitbox,
  hurtbox,
  moveOf,
  projectileBox,
  pushbox,
} from './sim'
import {
  SUB,
  type FighterData,
  type FighterState,
  type MatchState,
  type SimEvent,
  type WorldBox,
} from './types'

export const VIEW_WIDTH = 480
export const VIEW_HEIGHT = 270
/** Screen row of the floor. */
export const FLOOR_Y = 238

type Pair<T> = [T, T]
type G = CanvasRenderingContext2D

export type RenderOptions = {
  showBoxes: boolean
  reducedMotion: boolean
  /** Fighter sprites by slug, once loaded; fighters without one draw as placeholders. */
  sprites?: Partial<Record<string, LoadedSprites>>
  /** Hit sparks in flight (effects.ts advanceSparks). */
  sparks?: Spark[]
  /** The stage's art, once loaded; until then the placeholder stage draws. */
  stage?: LoadedStage
  /** The stage event's state (stages.ts advanceStageFx). */
  stageFx?: StageFx
  /** Pixel or HD (t-027): smooth images, the vector font, smooth sparks. */
  style?: RenderStyle
  /** The camera's zoom (advanceZoom toward zoomTarget); 1, the whole stage, when left out. */
  zoom?: number
}

/** Set a context up for a render style: image filtering and the HUD font. */
export function applyRenderStyle(g: G, style: RenderStyle = 'pixel'): void {
  g.imageSmoothingEnabled = style === 'hd'
  if ('imageSmoothingQuality' in g) g.imageSmoothingQuality = 'high'
  setTextStyle(g, style === 'hd' ? 'vector' : 'pixel')
}

/** A fighter's own look, or the side colours; P2 in a mirror match gets the alternate. */
export function fighterColors(
  data: FighterData,
  side: 0 | 1,
  mirror: boolean,
): { body: string; light: string; dark: string } {
  if (data.look && !(mirror && side === 1)) return data.look
  return SIDE_COLORS[side]
}

export const SIDE_COLORS: Pair<{ body: string; light: string; dark: string }> =
  [
    { body: '#c2410c', light: '#fdba74', dark: '#431407' },
    { body: '#0f766e', light: '#5eead4', dark: '#042f2e' },
  ]

const HUD = {
  barWidth: 190,
  barHeight: 8,
  barTop: 10,
  edge: 10,
  meterTop: 256,
  meterSegment: 34,
  meterHeight: 5,
} as const

// ---------------------------------------------------------------- camera

/** The camera follows the fighters' midpoint, held inside the stage. */
/**
 * The camera follows the fighters' midpoint and stops where the view meets the stage's edge. Zoomed in,
 * the view is narrower, so it can follow them further toward the walls.
 */
export function cameraX(s: MatchState, zoom = 1): number {
  const mid = Math.trunc((s.fighters[0].x + s.fighters[1].x) / 2)
  const limit = Math.round((STAGE_HALF_WIDTH - VIEW_WIDTH / 2 / zoom) * SUB)
  return Math.max(-limit, Math.min(limit, mid))
}

// ---------------------------------------------------------------- the zoom camera
//
// Silas (2026-10-09 PT): "Characters should be almost twice as large." The camera closes in on the
// fight, Samurai Shodown style: up to MAX_ZOOM while the fighters are close, pulling back as they
// part or leap so both stay in view. The sim never knows: the zoom is a draw transform about
// (ZOOM_X, ZOOM_Y), the fighters and the floor scaled by it, the stage's deeper layers by less (a
// camera moving in grows near things more than far ones), and the HUD not at all.

/** The closest the camera comes: a standing Zuzu stands about twice as tall. */
export const MAX_ZOOM = 1.85
/** The point the view zooms about: the screen's centre, just under the floor. */
export const ZOOM_X = VIEW_WIDTH / 2
export const ZOOM_Y = 250
/** Room either side of the fighters (their half-widths and some air). */
const ZOOM_MARGIN = 54
/** The highest screen row a head may reach, just under the names. */
export const HEAD_ROW = 34
/** Room above the art's height for hats and ears. */
const HEAD_ROOM = 6

/** How far in the camera wants to be for this frame of the match. */
export function zoomTarget(s: MatchState, roster: Pair<FighterData>): number {
  const gap = Math.abs(s.fighters[0].x - s.fighters[1].x) / SUB
  const wide = VIEW_WIDTH / (gap + 2 * ZOOM_MARGIN)
  // The highest head this jump will reach, so the camera pulls back on the way up, not after.
  let top = 0
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    const data = roster[side]
    const rise = f.vy > 0 ? (f.vy * f.vy) / (2 * Math.max(1, data.gravity)) : 0
    const apex = Math.max(0, f.y + rise) / SUB
    top = Math.max(top, apex + data.hurtStand.y + data.hurtStand.h + HEAD_ROOM)
  }
  // Zoomed by z the floor sits at ZOOM_Y - (ZOOM_Y - FLOOR_Y) z, and a head `top` above it at
  // ZOOM_Y - (ZOOM_Y - FLOOR_Y + top) z, which must stay at or below HEAD_ROW.
  const tall = (ZOOM_Y - HEAD_ROW) / (ZOOM_Y - FLOOR_Y + top)
  return Math.max(1, Math.min(MAX_ZOOM, wide, tall))
}

/** Ease the camera toward its target: out quickly (nobody leaves the screen), in gently. */
export function advanceZoom(
  zoom: number,
  target: number,
  reducedMotion: boolean,
): number {
  const rate = target < zoom ? 0.2 : reducedMotion ? 0.03 : 0.07
  const next = zoom + (target - zoom) * rate
  return Math.abs(next - target) < 0.002 ? target : next
}

/** A stage layer's zoom: the floor and fighters take it all, the far sky barely any. */
export function layerZoom(zoom: number, factor: number): number {
  return 1 + (zoom - 1) * factor
}

/** Apply a zoom about (ZOOM_X, ZOOM_Y) to everything drawn next. */
function zoomAbout(g: G, zoom: number): void {
  if (zoom === 1) return
  g.translate(ZOOM_X, ZOOM_Y)
  g.scale(zoom, zoom)
  g.translate(-ZOOM_X, -ZOOM_Y)
}

export function screenX(worldX: number, camera: number): number {
  return Math.round(VIEW_WIDTH / 2 + (worldX - camera) / SUB)
}

export function screenY(worldY: number): number {
  return FLOOR_Y - Math.round(worldY / SUB)
}

function rectOf(box: WorldBox, camera: number) {
  const left = screenX(box.left, camera)
  const right = screenX(box.right, camera)
  const top = screenY(box.top)
  const bottom = screenY(box.bottom)
  return { x: left, y: top, w: right - left, h: bottom - top }
}

// ---------------------------------------------------------------- HUD maths

/** Pixel widths of a life bar's health and red (recoverable) parts. */
export function lifeBar(
  f: FighterState,
  data: FighterData,
  width: number = HUD.barWidth,
) {
  const health = Math.round((width * f.health) / data.health)
  const red = Math.min(
    width - health,
    Math.round((width * f.red) / data.health),
  )
  return { health, red }
}

/** Full meter bars and the fill of the bar in progress (0..1). */
export function meterBars(meter: number) {
  const full = Math.floor(meter / METER_BAR)
  const partial = full >= 3 ? 0 : (meter % METER_BAR) / METER_BAR
  return { full, partial }
}

export function clockSeconds(s: MatchState): number {
  return Math.ceil(s.timer / 60)
}

// ---------------------------------------------------------------- callouts

export type Callout = {
  text: string
  /** Which side's corner it belongs to, or null for centre screen. */
  side: 0 | 1 | null
  frames: number
  color: string
}

const CALLOUT_FRAMES = 70

/** Turn this frame's sim events into on-screen callouts. */
export function calloutsFor(events: SimEvent[]): Callout[] {
  const out: Callout[] = []
  const add = (
    text: string,
    side: 0 | 1 | null,
    color = '#ffffff',
    frames = CALLOUT_FRAMES,
  ) => out.push({ text, side, frames, color })
  for (const e of events) {
    switch (e.type) {
      case 'roundStart':
        add(
          e.round >= 5 ? 'FINAL ROUND' : `ROUND ${e.round}`,
          null,
          '#fde68a',
          80,
        )
        break
      case 'fight':
        add('FIGHT!', null, '#fca5a5', 50)
        break
      case 'ko':
        add(e.result === 'draw' ? 'DOUBLE K.O.' : 'K.O.', null, '#f87171', 120)
        break
      case 'timeOver':
        add('TIME', null, '#fde68a', 120)
        break
      case 'matchOver':
        add(
          e.winner === 'draw' ? 'DRAW GAME' : `P${e.winner + 1} WINS`,
          null,
          '#fde68a',
          600,
        )
        break
      case 'read':
        add('READ!', e.side, '#fde047')
        break
      case 'firstAttack':
        add('FIRST ATTACK', e.side, '#fdba74')
        break
      case 'reversal':
        add('REVERSAL', e.side, '#93c5fd')
        break
      case 'hit':
        if (e.counter) add('COUNTER', e.attacker, '#f9a8d4')
        break
      case 'breakout':
        add('BREAKOUT', e.side, '#a5f3fc')
        break
      case 'breaker':
        add('COMBO BREAKER', e.side, '#a5f3fc')
        break
      case 'parry':
        add('PARRY', e.side, '#bbf7d0')
        break
      case 'tech':
        add('TECH', null, '#e5e7eb', 40)
        break
      case 'super':
        if (e.showdown) add('SHOWDOWN!', e.side, '#fb7185', 90)
        break
      default:
        break
    }
  }
  return out
}

/** Age the callouts by a frame and add this frame's new ones. */
export function advanceCallouts(
  list: Callout[],
  events: SimEvent[],
): Callout[] {
  const aged = list
    .map((c) => ({ ...c, frames: c.frames - 1 }))
    .filter((c) => c.frames > 0)
  const fresh = calloutsFor(events)
  // A new centre callout replaces the old one.
  const kept = fresh.some((c) => c.side === null)
    ? aged.filter((c) => c.side !== null)
    : aged
  return [...kept, ...fresh].slice(-8)
}

// ---------------------------------------------------------------- stage

function drawStage(
  g: G,
  camera: number,
  frame: number,
  reducedMotion: boolean,
): void {
  const sky = g.createLinearGradient(0, 0, 0, FLOOR_Y)
  sky.addColorStop(0, '#1e1b4b')
  sky.addColorStop(0.55, '#9a3412')
  sky.addColorStop(1, '#f59e0b')
  g.fillStyle = sky
  g.fillRect(0, 0, VIEW_WIDTH, FLOOR_Y)

  // The sun.
  g.fillStyle = '#fde68a'
  g.fillRect(
    VIEW_WIDTH / 2 - 18 - Math.round(camera / SUB / 12),
    FLOOR_Y - 150,
    36,
    36,
  )

  // Far mesas, mid ridge and the bell tower, each scrolling slower than the floor.
  const layer = (
    factor: number,
    color: string,
    peaks: Array<[number, number, number]>,
  ) => {
    g.fillStyle = color
    const shift = Math.round((camera / SUB) * factor)
    for (const [x, w, h] of peaks) {
      g.fillRect(x - shift, FLOOR_Y - h, w, h)
    }
  }
  layer(0.15, '#7c2d12', [
    [-60, 120, 46],
    [70, 90, 62],
    [180, 140, 40],
    [330, 110, 58],
    [450, 160, 44],
  ])
  layer(0.4, '#431407', [
    [-120, 200, 24],
    [90, 180, 30],
    [300, 220, 22],
    [520, 200, 28],
  ])
  // Bell tower (Hollow Bell stand-in): a post, a roof and a swinging bell.
  const towerX = 300 - Math.round((camera / SUB) * 0.7)
  g.fillStyle = '#1c0a03'
  g.fillRect(towerX, FLOOR_Y - 120, 18, 120)
  g.fillRect(towerX - 8, FLOOR_Y - 128, 34, 8)
  const swing = reducedMotion ? 0 : Math.round(Math.sin(frame / 40) * 2)
  g.fillStyle = '#a16207'
  g.fillRect(towerX + 5 + swing, FLOOR_Y - 116, 8, 8)

  // The floor, with ticks that scroll at full speed.
  g.fillStyle = '#78350f'
  g.fillRect(0, FLOOR_Y, VIEW_WIDTH, VIEW_HEIGHT - FLOOR_Y)
  g.fillStyle = '#92400e'
  const tick = Math.round(camera / SUB)
  for (let x = -((tick % 32) + 32) % 32; x < VIEW_WIDTH; x += 32) {
    g.fillRect(x, FLOOR_Y + 4, 14, 2)
  }

  // Drifting dust.
  if (!reducedMotion) {
    g.fillStyle = 'rgba(253, 230, 138, 0.35)'
    for (let i = 0; i < 12; i += 1) {
      const x = (i * 73 + frame * (1 + (i % 3))) % (VIEW_WIDTH + 20)
      const y = FLOOR_Y - 10 - ((i * 37) % 90)
      g.fillRect(x - 10, y, 2, 1)
    }
  }
}

// ---------------------------------------------------------------- stage art (t-009)

/** A hand-pixel sprite with its top-left corner at (x, y). */
function drawPixelSprite(
  g: G,
  sprite: PixelSprite,
  x: number,
  y: number,
  scale = 1,
): void {
  // In HD (smooth images) the same pixels draw as overlapping round dots, so the stage's hand-drawn
  // creatures read as soft silhouettes beside the painted art instead of blocks.
  const smooth = g.imageSmoothingEnabled && typeof g.arc === 'function'
  sprite.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx += 1) {
      const key = row[rx]
      if (!key || key === '.') continue
      g.fillStyle = STAGE_INK[key] ?? '#ff00ff'
      if (smooth) {
        g.beginPath()
        g.arc(
          x + (rx + 0.5) * scale,
          y + (ry + 0.5) * scale,
          scale * 0.95,
          0,
          Math.PI * 2,
        )
        g.fill()
      } else g.fillRect(x + rx * scale, y + ry * scale, scale, scale)
    }
  })
}

/** A sprite turned a quarter turn `turns` times (the tumbleweed rolling). */
export function turned(sprite: PixelSprite, turns: number): PixelSprite {
  let rows: readonly string[] = sprite
  for (let t = 0; t < turns % 4; t += 1) {
    const h = rows.length
    const w = rows[0]?.length ?? 0
    const next: string[] = []
    for (let x = 0; x < w; x += 1) {
      let line = ''
      for (let y = h - 1; y >= 0; y -= 1) line += rows[y]?.[x] ?? '.'
      next.push(line)
    }
    rows = next
  }
  return rows
}

function drawLayer(
  g: G,
  image: CanvasImageSource,
  layer: StageLayer,
  x: number,
  scale: number,
  shimmer: number | null,
): void {
  if (shimmer === null) {
    g.drawImage(
      image,
      0,
      0,
      layer.w * scale,
      layer.h * scale,
      x,
      layer.y,
      layer.w,
      layer.h,
    )
    return
  }
  // Heat shimmer: the lower rows waver, more toward the ground.
  const start = Math.floor(layer.h * 0.55)
  g.drawImage(
    image,
    0,
    0,
    layer.w * scale,
    start * scale,
    x,
    layer.y,
    layer.w,
    start,
  )
  for (let row = start; row < layer.h; row += 1) {
    const depth = (row - start) / Math.max(1, layer.h - start)
    const offset = Math.round(Math.sin((shimmer + row * 5) / 7) * depth * 1.6)
    g.drawImage(
      image,
      0,
      row * scale,
      layer.w * scale,
      scale,
      x + offset,
      layer.y + row,
      layer.w,
      1,
    )
  }
}

/**
 * The stage from its art: each parallax layer at its scroll rate, with the moving parts that hang off
 * it drawn right after it (vultures over the backdrop, the bell, banner and smoke on the town, the
 * glints and the croc's eyes on the pond, the tumbleweed on the street).
 */
export function drawStageArt(
  g: G,
  stage: LoadedStage,
  s: MatchState,
  roster: Pair<FighterData>,
  camera: number,
  reducedMotion: boolean,
  fx: StageFx,
  zoom = 1,
): void {
  const m = stage.manifest
  const cam = camera / SUB
  const frame = s.frame
  g.fillStyle = '#000000'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  for (const layer of m.layers) {
    const image = stage.layers[layer.name]
    if (!image) continue
    // Each layer (and what hangs off it) under its own share of the zoom.
    g.save()
    zoomAbout(g, layerZoom(zoom, layer.factor))
    const x = layerX(layer, cam)
    const shimmer =
      (m.stage === 'watering-hole' || m.stage === 'lone-apple-tree') &&
      layer.name === 'backdrop' &&
      !reducedMotion
        ? frame
        : null
    // Storm Canyon's lightning: the sky blazes and everything in front of it goes dark, so the canyon
    // walls (and the fighters, against the bright sky) stand in silhouette.
    const flash =
      m.stage === 'storm-canyon' ? lightningAt(frame, reducedMotion) : 0
    if (flash > 0 && layer.name !== 'backdrop')
      g.filter = `brightness(${(1 - 0.75 * flash).toFixed(2)})`
    drawLayer(g, image, layer, x, m.scale, shimmer)
    g.filter = 'none'
    if (flash > 0 && layer.name === 'backdrop') {
      g.fillStyle = `rgba(220, 235, 255, ${(0.65 * flash).toFixed(2)})`
      g.fillRect(0, layer.y, VIEW_WIDTH, layer.h)
    }
    if (m.stage === 'the-thin-place' && layer.name === 'backdrop') {
      // The sky tearing at its seams: a wide dim glow under a bright core along each tear.
      const glow = riftGlow(frame, reducedMotion)
      for (const [width, colour] of [
        [3, `rgba(167, 139, 250, ${(0.45 * glow).toFixed(2)})`],
        [1, `rgba(204, 251, 241, ${glow.toFixed(2)})`],
      ] as const) {
        g.fillStyle = colour
        for (const rift of RIFTS) {
          for (let k = 0; k + 1 < rift.length; k += 1) {
            const [x0, y0] = rift[k]!
            const [x1, y1] = rift[k + 1]!
            const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
            for (let t = 0; t <= steps; t += 1) {
              const px = Math.round(x0 + ((x1 - x0) * t) / steps)
              const py = Math.round(y0 + ((y1 - y0) * t) / steps)
              g.fillRect(px - (width >> 1), py - (width >> 1), width, width)
            }
          }
        }
      }
    }
    if (m.stage === 'storm-canyon' && layer.name === 'backdrop') {
      for (const c of crowsAt(frame)) {
        drawPixelSprite(g, VULTURE[c.flap]!, x + c.x, layer.y + c.y)
      }
    }
    // Anchors and cutouts are in the layer's own pixels, so on screen they move with it.
    const anchor = (name: string) => {
      const a = m.anchors[name]
      return a && a.layer === layer.name ? a : null
    }
    if (m.stage === 'watering-hole' && layer.name === 'backdrop') {
      for (const v of vulturesAt(frame)) {
        drawPixelSprite(g, VULTURE[v.flap]!, x + v.x, layer.y + v.y)
      }
    }
    for (const cut of m.cutouts.filter((c) => c.layer === layer.name)) {
      const piece = stage.cutouts[cut.name]
      if (!piece) continue
      if (cut.name === 'bell') {
        // Swings from the top of its yoke.
        const angle = bellAngle(frame, fx, reducedMotion)
        g.save()
        g.translate(x + cut.x + cut.w / 2, layer.y + cut.y)
        g.rotate((angle * Math.PI) / 180)
        g.drawImage(
          piece,
          0,
          0,
          cut.w * m.scale,
          cut.h * m.scale,
          -cut.w / 2,
          0,
          cut.w,
          cut.h,
        )
        g.restore()
        if (!reducedMotion && fx.bell !== null && fx.bell < 40) {
          // The ring: two pale arcs spreading out either side of the bell.
          g.strokeStyle = 'rgba(253, 230, 138, 0.8)'
          g.lineWidth = 1
          const cx = x + cut.x + cut.w / 2
          const cy = layer.y + cut.y + cut.h / 2
          for (const gap of [0, 14]) {
            const r = fx.bell * 1.2 + gap + cut.h / 2
            g.beginPath()
            g.arc(cx, cy, r, -0.9, 0.9)
            g.stroke()
            g.beginPath()
            g.arc(cx, cy, r, Math.PI - 0.9, Math.PI + 0.9)
            g.stroke()
          }
        }
      } else if (cut.name === 'banner') {
        // A banner in the wind: each column rides a wave that grows toward its free end.
        for (let col = 0; col < cut.w; col += 1) {
          const lift = reducedMotion
            ? 0
            : Math.round(Math.sin(frame / 7 - col / 3) * (col / cut.w) * 2)
          g.drawImage(
            piece,
            col * m.scale,
            0,
            m.scale,
            cut.h * m.scale,
            x + cut.x + col,
            layer.y + cut.y + lift,
            1,
            cut.h,
          )
        }
      } else {
        g.drawImage(
          piece,
          0,
          0,
          cut.w * m.scale,
          cut.h * m.scale,
          x + cut.x,
          layer.y + cut.y,
          cut.w,
          cut.h,
        )
      }
    }
    const smoke = anchor('smoke')
    if (smoke) {
      g.fillStyle = 'rgba(120, 110, 104, 0.45)'
      for (const p of smokePuffs(frame, reducedMotion)) {
        const px = x + smoke.x + p.dx - p.r
        const py = layer.y + smoke.y + p.dy - p.r
        // A puff with its corners knocked off, so it reads as smoke rather than a square.
        if (p.r < 2) g.fillRect(px, py, p.r * 2, p.r * 2)
        else {
          g.fillRect(px + 1, py, p.r * 2 - 2, p.r * 2)
          g.fillRect(px, py + 1, p.r * 2, p.r * 2 - 2)
        }
      }
    }
    const arch = anchor('arch')
    if (arch?.w && arch.h) {
      // The town's own sign, lettered in the pixel font (the art carries no lettering).
      const width = arch.w
      const cx = x + arch.x + width / 2
      // A tall board takes the population too; the beam over the arch only has room for the name.
      const lines = (
        arch.h >= 9 + FONT_HEIGHT
          ? ['HOLLOW BELL', 'POP. 212']
          : ['HOLLOW BELL']
      ).filter((line) => measureText(line) <= width)
      const top =
        layer.y +
        arch.y +
        Math.round((arch.h - ((lines.length - 1) * 9 + FONT_HEIGHT)) / 2)
      lines.forEach((line, i) =>
        drawText(g, line, cx, top + i * 9, {
          align: 'center',
          color: '#e7dcc2',
          shadow: '#2a1a10',
        }),
      )
    }
    const water = anchor('water')
    if (water?.w && water.h) {
      g.fillStyle = '#fff7d6'
      for (const glint of waterGlints(frame, water.w, water.h)) {
        g.fillRect(x + water.x + glint.x, layer.y + water.y + glint.y, 2, 1)
      }
      const eyes = crocEyesAt(frame, roster, water.w)
      if (eyes && s.phase === 'fight') {
        const sprite = CROC_EYES[eyes.sprite]!
        drawPixelSprite(
          g,
          sprite,
          x + water.x + eyes.x,
          layer.y + water.y + Math.round(water.h / 2) - sprite.length + 1,
        )
      }
    }
    const fire = anchor('fire')
    if (fire?.w && fire.h) {
      // The bonfire's glow breathes, and embers climb out of it.
      const glow = reducedMotion ? 0.3 : 0.25 + 0.1 * Math.sin(frame / 5)
      // A soft pool of light round the fire (a plain wash where a context can't draw gradients).
      const cx = x + fire.x + fire.w / 2
      const cy = layer.y + fire.y + (fire.h * 2) / 3
      const r = fire.w + 14
      if (typeof g.createRadialGradient === 'function') {
        const pool = g.createRadialGradient(cx, cy, 0, cx, cy, r)
        pool.addColorStop(0, `rgba(251, 146, 60, ${(glow * 1.6).toFixed(2)})`)
        pool.addColorStop(1, 'rgba(251, 146, 60, 0)')
        g.fillStyle = pool
      } else g.fillStyle = `rgba(251, 146, 60, ${glow.toFixed(2)})`
      g.fillRect(cx - r, cy - r, r * 2, r * 2)
      g.fillStyle = '#fdba74'
      for (const ember of embersAt(frame, fire.w, fire.h, reducedMotion)) {
        g.fillRect(x + fire.x + ember.x, layer.y + fire.y + ember.y, 1, 1)
      }
    }
    // The Bone Yard's pack, perched on the ruined arch against the smoke: cackling, then howling on a
    // Showdown super.
    const pack = packAt(frame, fx, reducedMotion)
    PERCHES.forEach((name, i) => {
      const perch = anchor(name)
      const hyena = pack[i]
      if (!perch || !hyena) return
      const sprite = HYENA[hyena.headUp ? 1 : 0]!
      drawPixelSprite(
        g,
        sprite,
        x + perch.x - sprite[0]!.length,
        layer.y + perch.y - sprite.length * 2,
        2,
      )
    })
    const sun = anchor('sun')
    if (sun) {
      // The Dunes' long sun, low and huge, with a haze ring around it.
      g.fillStyle = 'rgba(255, 237, 180, 0.35)'
      g.fillRect(x + sun.x - 16, layer.y + sun.y - 12, 32, 24)
      g.fillRect(x + sun.x - 12, layer.y + sun.y - 16, 24, 32)
      g.fillStyle = '#fff3c4'
      g.fillRect(x + sun.x - 11, layer.y + sun.y - 8, 22, 16)
      g.fillRect(x + sun.x - 8, layer.y + sun.y - 11, 16, 22)
    }
    const crest = anchor('crest')
    if (crest?.w && crest.h) {
      g.fillStyle = 'rgba(250, 226, 180, 0.8)'
      for (const grain of sandBlowAt(frame, crest.w, crest.h, reducedMotion)) {
        g.fillRect(x + crest.x + grain.x, layer.y + crest.y + grain.y, 2, 1)
      }
    }
    const gap = anchor('doorgap')
    if (gap?.w && gap.h) {
      // The Thin Place: light from behind the door, wider each round.
      const open = doorOpen(s.round, frame, reducedMotion)
      const wide = Math.max(1, Math.round(gap.w * open))
      g.fillStyle = 'rgba(204, 251, 241, 0.9)'
      g.fillRect(x + gap.x + gap.w - wide, layer.y + gap.y, wide, gap.h)
      g.fillStyle = 'rgba(167, 139, 250, 0.35)'
      g.fillRect(x + gap.x + gap.w - wide - 3, layer.y + gap.y, 3, gap.h)
    }
    const canopy = anchor('canopy')
    if (canopy?.w && canopy.h) {
      // The Lone Apple Tree: red leaves drift down, and every few seconds an apple drops.
      g.fillStyle = '#b91c1c'
      for (const leaf of leavesAt(frame, canopy.w, reducedMotion)) {
        g.fillRect(x + canopy.x + leaf.x, layer.y + canopy.y + leaf.y, 2, 1)
      }
      const apple = appleAt(frame, canopy.w)
      if (apple && apple.alpha > 0) {
        const top = layer.y + canopy.y + canopy.h
        const y = Math.round(top + (FLOOR_Y - 3 - top) * apple.fall)
        const ax = x + canopy.x + apple.x
        g.globalAlpha = apple.alpha
        g.fillStyle = '#dc2626'
        g.fillRect(ax, y, 3, 3)
        g.fillStyle = '#fca5a5'
        g.fillRect(ax, y, 1, 1)
        g.fillStyle = '#3f6212'
        g.fillRect(ax + 1, y - 1, 1, 1)
        g.globalAlpha = 1
      }
    }
    const candle = anchor('candle')
    if (candle) {
      // The Mission's candle: a flame of two to four pixels that never quite settles.
      const flame = candleFlame(frame, reducedMotion)
      g.fillStyle = flame.bright ? '#fde68a' : '#f59e0b'
      g.fillRect(x + candle.x, layer.y + candle.y - flame.h, 1, flame.h)
      g.fillStyle = '#fff7d6'
      g.fillRect(x + candle.x, layer.y + candle.y - 1, 1, 1)
    }
    const portal = anchor('portal')
    if (portal?.w && portal.h) {
      // Between rounds something looks through the empty bell arch.
      const glow = portalGlow(s, reducedMotion)
      if (glow > 0) {
        g.fillStyle = `rgba(167, 139, 250, ${(0.8 * glow).toFixed(2)})`
        g.fillRect(x + portal.x, layer.y + portal.y, portal.w, portal.h)
        g.fillStyle = `rgba(52, 211, 153, ${(0.6 * glow).toFixed(2)})`
        g.fillRect(
          x + portal.x + Math.floor(portal.w / 3),
          layer.y + portal.y + Math.floor(portal.h / 4),
          Math.max(1, Math.floor(portal.w / 3)),
          Math.max(1, Math.floor(portal.h / 2)),
        )
      }
    }
    if (m.stage === 'hollow-bell' && layer.name === 'floor') {
      const weed = tumbleweedAt(frame)
      if (weed) {
        const sprite = turned(TUMBLEWEED[weed.spin % 2]!, weed.spin)
        drawPixelSprite(
          g,
          sprite,
          x + weed.x,
          FLOOR_Y - sprite.length + 2 + weed.y,
        )
      }
    }
    g.restore()
  }
  // The ground's own goings-on zoom with the floor; the rain is on the lens.
  g.save()
  zoomAbout(g, zoom)
  const slump =
    m.stage === 'the-dunes' && !reducedMotion
      ? duneSlumpAt(frame, VIEW_WIDTH)
      : null
  if (slump && slump.h > 0) {
    // Something vast moving under the dune: a heave of sand crossing behind the fighters.
    g.fillStyle = '#c99a5e'
    for (let dx = -30; dx <= 30; dx += 1) {
      const rise = Math.round(slump.h * (1 - (dx / 30) ** 2))
      if (rise > 0) g.fillRect(slump.x + dx, FLOOR_Y - 8 - rise, 1, rise)
    }
    g.fillStyle = '#8a6236'
    for (let dx = -18; dx <= 18; dx += 3)
      g.fillRect(slump.x + dx, FLOOR_Y - 8 - Math.round(slump.h * 0.6), 2, 1)
  }
  if (m.stage === 'the-thin-place') {
    g.fillStyle = '#6b6290'
    for (const d of debrisAt(frame, reducedMotion))
      g.fillRect(d.x, d.y, d.size + 1, d.size)
  }
  const devil =
    m.stage === 'lone-apple-tree' ? dustDevilAt(frame, reducedMotion) : null
  if (devil) {
    // A dust devil: a funnel of sand flecks spinning up off the street.
    g.fillStyle = 'rgba(176, 140, 96, 0.85)'
    for (let k = 0; k < devil.h; k += 1) {
      const r = 2 + (k * 6) / devil.h
      const a = (devil.spin + k * 9) / 6
      g.fillRect(Math.round(devil.x + Math.cos(a) * r), FLOOR_Y - k, 2, 1)
    }
  }
  g.restore()
  if (m.stage === 'storm-canyon') {
    g.fillStyle = 'rgba(186, 214, 255, 0.35)'
    for (const drop of rainAt(frame, reducedMotion, VIEW_WIDTH, VIEW_HEIGHT)) {
      // A slanting streak, two pixels down for every one across.
      for (let k = 0; k < 4; k += 1)
        g.fillRect(drop.x + k, drop.y + k * 2, 1, 2)
    }
  }
}

// ---------------------------------------------------------------- fighters

function drawFighter(
  g: G,
  f: FighterState,
  data: FighterData,
  side: 0 | 1,
  camera: number,
  frame: number,
  mirror: boolean,
  sprites?: LoadedSprites,
  context: SpriteContext = {},
): void {
  const colors = fighterColors(data, side, mirror)
  const x = screenX(f.x, camera)
  const floor = screenY(f.y)
  const width = data.hurtStand.w
  const standing = data.hurtStand.h
  g.save()
  if (f.action === 'dodge') g.globalAlpha = 0.5
  if ((f.action === 'hitstun' || f.action === 'airhit') && frame % 4 < 2)
    g.globalAlpha = 0.75

  // Shadow on the floor.
  g.fillStyle = 'rgba(0, 0, 0, 0.35)'
  g.fillRect(x - Math.round(width / 2), FLOOR_Y + 1, width, 3)

  // Rig art when it has loaded (t-010); P2 in a mirror match wears the alternate colours.
  const pick = sprites ? pickSprite(f, sprites.sheet, context) : null
  if (sprites && pick) {
    const image =
      mirror && side === 1 && sprites.p2 ? sprites.p2 : sprites.image
    const art = sprites.sheet.animations[pick.name]!.frames[pick.index]!
    drawSprite(g, image, art, sprites.sheet.scale, x, floor, f.facing)
    g.restore()
    return
  }

  if (f.action === 'knockdown' || f.action === 'ko' || f.action === 'thrown') {
    // Lying flat.
    g.fillStyle = colors.body
    g.fillRect(x - Math.round(standing / 2), floor - 12, standing, 12)
    g.fillStyle = colors.light
    g.fillRect(
      x +
        (f.facing === 1
          ? -Math.round(standing / 2)
          : Math.round(standing / 2) - 12),
      floor - 14,
      12,
      12,
    )
    g.restore()
    return
  }

  const crouching =
    f.action === 'crouch' ||
    (f.action === 'attack' && f.attack?.id.startsWith('crouch_') === true)
  const height = crouching
    ? data.hurtCrouch.h
    : f.action === 'jump' || f.action === 'airhit'
      ? Math.round(standing * 0.8)
      : standing
  const top = floor - height
  const head = Math.max(10, Math.round(width * 0.6))

  // Body and head.
  g.fillStyle = colors.dark
  g.fillRect(
    x - Math.round(width / 2) - 1,
    top + head - 1,
    width + 2,
    height - head + 1,
  )
  g.fillStyle = colors.body
  g.fillRect(x - Math.round(width / 2), top + head, width, height - head)
  g.fillStyle = colors.light
  g.fillRect(x - Math.round(head / 2), top, head, head)
  // The eye shows which way they face.
  g.fillStyle = colors.dark
  g.fillRect(
    x + f.facing * Math.round(head / 4) - 1,
    top + Math.round(head / 3),
    3,
    3,
  )
  if (data.look?.eyepatch) {
    // Over the right eye: the far side of the face when facing right.
    g.fillStyle = '#0c0a09'
    g.fillRect(
      x + f.facing * Math.round(head / 4) - 2,
      top + Math.round(head / 3) - 1,
      5,
      4,
    )
    g.fillRect(x - Math.round(head / 2), top + Math.round(head / 3), head, 1)
  }
  if (data.look?.hat === 'crushed') {
    // A crushed, sagging hat.
    g.fillStyle = '#44403c'
    g.fillRect(x - Math.round(head * 0.75), top - 1, Math.round(head * 1.5), 3)
    g.fillRect(x - Math.round(head / 2) + 1, top - 5, head - 4, 5)
  }
  if (data.look?.hat === 'kasa') {
    // A wide straw kasa whose brim shades the eyes.
    const brim = Math.round(head * 2.4)
    g.fillStyle = '#d4a373'
    g.fillRect(x - Math.round(brim / 2), top + 2, brim, 3)
    g.fillStyle = '#b08350'
    g.fillRect(x - Math.round(head / 2), top - 3, head, 5)
    g.fillRect(x - Math.round(head / 4), top - 6, Math.round(head / 2), 3)
  }

  // The attacking limb is the live hitbox (or where it will be).
  if (f.attack) {
    const move = moveOf(data, f.attack)
    if (
      move.hitbox.w > 0 &&
      f.attack.frame >= move.startup - 2 &&
      f.attack.frame < move.startup + move.active
    ) {
      const near = move.hitbox.x
      const left = f.facing === 1 ? x + near : x - near - move.hitbox.w
      g.fillStyle = colors.light
      g.fillRect(
        left,
        floor - move.hitbox.y - move.hitbox.h,
        move.hitbox.w,
        move.hitbox.h,
      )
    }
  }

  // Guard: a bright edge on the side facing the threat.
  if (f.action === 'blockstun') {
    g.fillStyle = '#e0f2fe'
    const edge =
      f.facing === 1 ? x + Math.round(width / 2) : x - Math.round(width / 2) - 3
    g.fillRect(edge, top + head, 3, height - head)
  }
  if (f.action === 'taunt' && frame % 20 < 10) {
    drawText(g, '!', x, top - 12, { align: 'center', color: colors.light })
  }
  g.restore()
}

function drawProjectiles(
  g: G,
  s: MatchState,
  roster: Pair<FighterData>,
  camera: number,
  frame: number,
): void {
  s.projectiles.forEach((p, index) => {
    const box = projectileBox(s, roster, index)
    if (!box) return
    const r = rectOf(box, camera)
    const colors = SIDE_COLORS[p.owner]
    g.fillStyle = colors.light
    g.fillRect(r.x, r.y, r.w, r.h)
    g.fillStyle = '#ffffff'
    const pulse = frame % 6 < 3 ? 2 : 4
    g.fillRect(
      r.x + pulse,
      r.y + pulse,
      Math.max(1, r.w - pulse * 2),
      Math.max(1, r.h - pulse * 2),
    )
  })
}

function drawBoxes(
  g: G,
  s: MatchState,
  roster: Pair<FighterData>,
  camera: number,
): void {
  const outline = (box: WorldBox | null, color: string) => {
    if (!box) return
    const r = rectOf(box, camera)
    g.strokeStyle = color
    g.lineWidth = 1
    g.strokeRect(
      r.x + 0.5,
      r.y + 0.5,
      Math.max(0, r.w - 1),
      Math.max(0, r.h - 1),
    )
  }
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    outline(pushbox(f, roster[side]), '#facc15')
    outline(hurtbox(f, roster[side]), '#4ade80')
    outline(hitbox(f, roster[side]), '#f87171')
  }
  s.projectiles.forEach((_, index) =>
    outline(projectileBox(s, roster, index), '#f87171'),
  )
}

// ---------------------------------------------------------------- HUD

function drawHud(g: G, s: MatchState, roster: Pair<FighterData>): void {
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    const data = roster[side]
    const { health, red } = lifeBar(f, data)
    const left = side === 0 ? HUD.edge : VIEW_WIDTH - HUD.edge - HUD.barWidth
    g.fillStyle = '#111827'
    g.fillRect(left - 1, HUD.barTop - 1, HUD.barWidth + 2, HUD.barHeight + 2)
    g.fillStyle = '#7f1d1d'
    g.fillRect(left, HUD.barTop, HUD.barWidth, HUD.barHeight)
    // P1 drains toward the left edge's centre side; bars fill from the outer edge.
    const healthX = side === 0 ? left : left + HUD.barWidth - health
    const redX = side === 0 ? left + health : left + HUD.barWidth - health - red
    g.fillStyle = '#ef4444'
    g.fillRect(redX, HUD.barTop, red, HUD.barHeight)
    g.fillStyle = health * 4 < HUD.barWidth ? '#facc15' : '#fde047'
    g.fillRect(healthX, HUD.barTop, health, HUD.barHeight)

    drawText(
      g,
      data.name.toUpperCase(),
      side === 0 ? left : left + HUD.barWidth,
      HUD.barTop + HUD.barHeight + 4,
      {
        align: side === 0 ? 'left' : 'right',
        color: '#ffffff',
        shadow: '#000000',
      },
    )
    // Bullets left, for fighters who reload.
    if (data.ammo) {
      for (let b = 0; b < data.ammo; b += 1) {
        const bx = side === 0 ? left + b * 5 : left + HUD.barWidth - 3 - b * 5
        g.fillStyle = b < f.ammo ? '#fbbf24' : '#44403c'
        g.fillRect(bx, HUD.barTop + HUD.barHeight + 14, 3, 5)
      }
    }
    // Round pips.
    for (let w = 0; w < s.wins[side]; w += 1) {
      const pipX =
        side === 0 ? left + HUD.barWidth - 8 - w * 10 : left + w * 10 + 2
      g.fillStyle = '#fde047'
      g.fillRect(pipX, HUD.barTop + HUD.barHeight + 4, 6, 6)
    }

    // Meter: three segments along the bottom.
    const { full, partial } = meterBars(f.meter)
    for (let bar = 0; bar < 3; bar += 1) {
      const x0 =
        side === 0
          ? HUD.edge + bar * (HUD.meterSegment + 3)
          : VIEW_WIDTH - HUD.edge - (bar + 1) * HUD.meterSegment - bar * 3
      g.fillStyle = '#1f2937'
      g.fillRect(x0, HUD.meterTop, HUD.meterSegment, HUD.meterHeight)
      const fill = bar < full ? 1 : bar === full ? partial : 0
      if (fill > 0) {
        const w = Math.round(HUD.meterSegment * fill)
        g.fillStyle = bar < full ? '#38bdf8' : '#0369a1'
        g.fillRect(
          side === 0 ? x0 : x0 + HUD.meterSegment - w,
          HUD.meterTop,
          w,
          HUD.meterHeight,
        )
      }
    }
    drawText(
      g,
      String(full),
      side === 0
        ? HUD.edge + 3 * (HUD.meterSegment + 3) + 2
        : VIEW_WIDTH - HUD.edge - 3 * (HUD.meterSegment + 3) - 2,
      HUD.meterTop - 1,
      {
        align: side === 0 ? 'left' : 'right',
        color: full > 0 ? '#38bdf8' : '#6b7280',
      },
    )

    // Combo counter on the attacker's side.
    const defender = s.fighters[side === 0 ? 1 : 0]
    if (defender.combo.hits >= 2) {
      drawText(
        g,
        `${defender.combo.hits} HITS`,
        side === 0 ? HUD.edge : VIEW_WIDTH - HUD.edge,
        60,
        {
          align: side === 0 ? 'left' : 'right',
          scale: 2,
          color: '#fde047',
          shadow: '#7c2d12',
        },
      )
    }
  }
  drawText(
    g,
    String(clockSeconds(s)).padStart(2, '0'),
    VIEW_WIDTH / 2,
    HUD.barTop - 2,
    {
      align: 'center',
      scale: 2,
      color: '#ffffff',
      shadow: '#000000',
    },
  )
}

function drawCallouts(g: G, callouts: Callout[]): void {
  const corner: Pair<number> = [0, 0]
  for (const c of callouts) {
    if (c.side === null) {
      drawText(g, c.text, VIEW_WIDTH / 2, 96, {
        align: 'center',
        scale: 3,
        color: c.color,
        shadow: '#000000',
      })
      continue
    }
    const y = 82 + corner[c.side] * 12
    corner[c.side] += 1
    drawText(g, c.text, c.side === 0 ? HUD.edge : VIEW_WIDTH - HUD.edge, y, {
      align: c.side === 0 ? 'left' : 'right',
      color: c.color,
      shadow: '#000000',
    })
  }
}

/**
 * The super flash; a Showdown super cuts to the comic's eye strip (SF1).
 * Returns true while the eye strip is up.
 */
function drawSuperFlash(
  g: G,
  s: MatchState,
  roster: Pair<FighterData>,
): boolean {
  if (s.freeze <= 0) return false
  const side = ([0, 1] as const).find(
    (i) => s.fighters[i].attack?.level === 'super',
  )
  if (side === undefined) return false
  const f = s.fighters[side]
  const showdown = f.attack
    ? moveOf(roster[side], f.attack).showdown === true
    : false
  g.fillStyle = 'rgba(0, 0, 0, 0.55)'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  if (!showdown) return false
  const stripHeight = Math.round(VIEW_WIDTH / 4)
  const top = Math.round((VIEW_HEIGHT - stripHeight) / 2)
  g.fillStyle = '#000000'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  const colors = fighterColors(
    roster[side],
    side,
    roster[0].slug === roster[1].slug,
  )
  g.fillStyle = colors.body
  g.fillRect(0, top, VIEW_WIDTH, stripHeight)
  // Two narrowed eyes.
  g.fillStyle = '#fef3c7'
  g.fillRect(VIEW_WIDTH / 2 - 90, top + stripHeight / 2 - 6, 60, 10)
  g.fillRect(VIEW_WIDTH / 2 + 30, top + stripHeight / 2 - 6, 60, 10)
  g.fillStyle = '#111827'
  g.fillRect(VIEW_WIDTH / 2 - 66, top + stripHeight / 2 - 6, 12, 10)
  g.fillRect(VIEW_WIDTH / 2 + 54, top + stripHeight / 2 - 6, 12, 10)
  return true
}

/** Draw one frame of the match. */
export function drawMatch(
  g: G,
  s: MatchState,
  roster: Pair<FighterData>,
  callouts: Callout[],
  options: RenderOptions,
): void {
  applyRenderStyle(g, options.style)
  const zoom = options.zoom ?? 1
  const camera = cameraX(s, zoom)
  if (options.stage)
    drawStageArt(
      g,
      options.stage,
      s,
      roster,
      camera,
      options.reducedMotion,
      options.stageFx ?? { bell: null },
      zoom,
    )
  else {
    g.save()
    zoomAbout(g, zoom)
    drawStage(g, camera, s.frame, options.reducedMotion)
    g.restore()
  }
  // The fight itself, under the camera's zoom; the HUD and callouts stay put.
  g.save()
  zoomAbout(g, zoom)
  // The fighter who is attacking draws in front.
  const order: Array<0 | 1> =
    s.fighters[1].attack && !s.fighters[0].attack ? [0, 1] : [1, 0]
  for (const side of order)
    drawFighter(
      g,
      s.fighters[side],
      roster[side],
      side,
      camera,
      s.frame,
      roster[0].slug === roster[1].slug,
      options.sprites?.[roster[side].slug],
      {
        intro: s.phase === 'intro' ? s.phaseFrame : undefined,
        perfect: s.fighters[side].health >= roster[side].health,
      },
    )
  drawProjectiles(g, s, roster, camera, s.frame)
  if (options.sparks)
    drawSparks(
      g,
      options.sparks,
      camera,
      options.reducedMotion,
      options.style === 'hd',
    )
  if (options.showBoxes) drawBoxes(g, s, roster, camera)
  g.restore()
  const eyeStrip = drawSuperFlash(g, s, roster)
  drawHud(g, s, roster)
  if (!eyeStrip) drawCallouts(g, callouts)
}

/**
 * Hit sparks, pixel by pixel; reduced motion keeps every spark small. `smooth` (the HD style) draws the
 * same shapes as soft round dots, a touch larger than the pixels so they merge into a burst.
 */
export function drawSparks(
  g: G,
  sparks: Spark[],
  camera: number,
  reducedMotion: boolean,
  smooth = false,
): void {
  for (const spark of sparks) {
    const frame = sparkFrame(spark)
    if (frame === null) continue
    const size = reducedMotion ? 1 : spark.scale
    const cx = screenX(spark.x, camera)
    const cy = screenY(spark.y)
    const palette = SPARK_PALETTES[spark.kind]
    for (const p of SPARK_PIXELS[frame]!) {
      g.fillStyle = palette[p.key]
      if (smooth) {
        g.beginPath()
        g.arc(
          cx + (p.dx + 0.5) * size,
          cy + (p.dy + 0.5) * size,
          size * 0.75,
          0,
          Math.PI * 2,
        )
        g.fill()
      } else g.fillRect(cx + p.dx * size, cy + p.dy * size, size, size)
    }
  }
}

/** Title / pause / result card drawn over the stage. */
export function drawCard(
  g: G,
  lines: Array<{ text: string; scale?: number; color?: string }>,
): void {
  g.fillStyle = 'rgba(0, 0, 0, 0.6)'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  let y = 70
  for (const line of lines) {
    const scale = line.scale ?? 1
    drawText(g, line.text, VIEW_WIDTH / 2, y, {
      align: 'center',
      scale,
      color: line.color ?? '#ffffff',
      shadow: '#000000',
    })
    y += 10 * scale + 8
  }
}
