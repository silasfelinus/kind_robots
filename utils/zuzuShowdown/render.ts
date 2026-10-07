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

import { drawText } from '../arcade/font'
import { SPARK_PALETTES, SPARK_PIXELS, sparkFrame, type Spark } from './effects'
import {
  drawSprite,
  pickSprite,
  type LoadedSprites,
  type SpriteContext,
} from './sprites'
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
export function cameraX(s: MatchState): number {
  const mid = Math.trunc((s.fighters[0].x + s.fighters[1].x) / 2)
  const limit = (STAGE_HALF_WIDTH - VIEW_WIDTH / 2) * SUB
  return Math.max(-limit, Math.min(limit, mid))
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
  g.imageSmoothingEnabled = false
  const camera = cameraX(s)
  drawStage(g, camera, s.frame, options.reducedMotion)
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
    drawSparks(g, options.sparks, camera, options.reducedMotion)
  if (options.showBoxes) drawBoxes(g, s, roster, camera)
  const eyeStrip = drawSuperFlash(g, s, roster)
  drawHud(g, s, roster)
  if (!eyeStrip) drawCallouts(g, callouts)
}

/** Hit sparks, pixel by pixel; reduced motion keeps every spark small. */
export function drawSparks(
  g: G,
  sparks: Spark[],
  camera: number,
  reducedMotion: boolean,
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
      g.fillRect(cx + p.dx * size, cy + p.dy * size, size, size)
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
