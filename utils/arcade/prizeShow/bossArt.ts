// /utils/arcade/prizeShow/bossArt.ts
//
// How the bosses of episodes 1-3 look (conductor kr-arcade t-029; the Parade Float keeps its own
// sprites in games/prizeShowPanic.ts), episode 4 and the Live Finale. Bosses are big, so most of each is built from the 16-bit
// kit's shaded orbs and bevels rather than one huge sprite: the Big Wobble is literally balloons,
// the Souffle a dome of shaded crust in a fluted dish. The faces, cupcakes and the cart are pixel
// sprites. Every tell is drawn here: the Wobble's raised arm over its slam spot and its hop's
// landing shadow, the Souffle's steam shadows, the Jumbotron's flickering next screen and its
// turrets flipping open.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bevel,
  dropShadow,
  drawSprite,
  gauge,
  glow,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { Ramp } from '../snes'
import {
  ACT_TITLES,
  BOSS,
  DANCE_MOVES,
  MACHINE_ACTS,
  beamsHot,
  liveParts,
  machineBeams,
  screenSpot,
} from './bosses'
import type { Boss, BossPart } from './bosses'
import { HOST_PORTRAIT } from './hostArt'
import { BOTTOM, CX, LEFT, RIGHT, TOP } from './stage'

const FLASH: Ramp = ['#f0ebff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']

/**
 * The boss's health bar in its fixed place along the bottom of the floor (the big bosses fill the
 * top of the set), with a mark where its second act begins.
 */
function healthBar(g: CanvasRenderingContext2D, b: Boss) {
  const w = 140
  const x = CX - w / 2
  const y = BOTTOM - 7
  gauge(g, x, y, w, 3, b.hp / b.maxHp, b.phase === 2 ? RAMPS.ember : RAMPS.leaf)
  g.fillStyle = INK
  g.fillRect(x + Math.round(w * b.phase2At), y - 1, 1, 5)
}

// --- the Big Wobble -----------------------------------------------------------------------------

const WOBBLE_FACE = pixelSprite(
  [
    '.ww....ww.',
    'wkkw..wkkw',
    'wkkw..wkkw',
    '.ww....ww.',
    '..........',
    '..m....m..',
    '...mmmm...',
  ],
  { w: '#ffffff', k: INK, m: RAMPS.ember[1] },
  { outline: null },
)

/** A balloon limb: a chain of orbs from (x0, y0) to (x1, y1). */
function balloonLimb(
  g: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  ramp: Ramp,
) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (r * 1.4)))
  for (let i = 0; i <= n; i++) {
    const k = i / n
    shadedOrb(
      g,
      x0 + (x1 - x0) * k,
      y0 + (y1 - y0) * k,
      r * (1 - k * 0.15),
      ramp,
      {
        glint: i === n,
      },
    )
  }
}

/** A popped limb: a tied-off knot where it was. */
function knot(g: CanvasRenderingContext2D, x: number, y: number) {
  g.fillStyle = INK
  g.fillRect(x - 3, y - 2, 6, 5)
  g.fillStyle = RAMPS.pink[1]
  g.fillRect(x - 2, y - 1, 4, 3)
  g.fillStyle = RAMPS.pink[3]
  g.fillRect(x - 1, y - 1, 1, 1)
}

function renderWobble(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const cfg = BOSS.wobble
  const flash = b.flash > 0
  const body = flash ? FLASH : RAMPS.pink
  const limbRamp = flash ? FLASH : RAMPS.purple
  // The hop's landing spot and the slam's spot, told on the floor first.
  if (b.mode === 1) {
    const k = 1 - b.clock / cfg.hopTicks
    dropShadow(g, b.aimX, b.aimY + 38, 18 + k * 18, 6 + k * 5, 0.25 + k * 0.3)
  }
  dropShadow(g, b.x, b.y + 40, 30 - b.z * 0.3, 7, 0.4)
  if (b.tell > 0) {
    const k = 1 - b.tell / cfg.slamTell
    dropShadow(g, b.aimX, b.aimY, 8 + k * 10, 4 + k * 4, 0.3 + k * 0.4)
    g.strokeStyle = rgba(RAMPS.ember[3], 0.5 + 0.5 * (Math.floor(tick / 4) % 2))
    g.lineWidth = 1
    g.beginPath()
    g.ellipse(
      b.aimX,
      b.aimY,
      cfg.slamReach + 2,
      (cfg.slamReach + 2) * 0.6,
      0,
      0,
      Math.PI * 2,
    )
    g.stroke()
  }
  const y = b.y - b.z
  const squash = b.phase === 2 ? Math.sin(tick / 5) * 1.5 : Math.sin(tick / 12)
  // Legs first, behind the body.
  for (const leg of b.parts.filter((p) => p.role === 'leg')) {
    if (leg.gone) {
      knot(g, leg.x, leg.y - 8)
      continue
    }
    balloonLimb(
      g,
      leg.x,
      leg.y - 8,
      leg.x,
      leg.y + 6,
      7,
      legRamp(limbRamp, leg),
    )
  }
  // The body and head: two big balloons, the head bobbing on its neck.
  shadedOrb(g, b.x, y + squash, 21, body)
  g.fillStyle = rgba(RAMPS.gold[3], 0.9)
  g.fillRect(b.x - 12, y + 6 + squash, 24, 3)
  shadedOrb(g, b.x + Math.sin(tick / 9) * 2, y - 27, 14, body)
  drawSprite(g, WOBBLE_FACE, b.x + Math.sin(tick / 9) * 2, y - 27)
  // A party hat.
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(b.x - 7, y - 37)
  g.lineTo(b.x + 7, y - 37)
  g.lineTo(b.x + 1, y - 52)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.teal[3]
  g.beginPath()
  g.moveTo(b.x - 5, y - 38)
  g.lineTo(b.x + 5, y - 38)
  g.lineTo(b.x + 1, y - 50)
  g.closePath()
  g.fill()
  // Arms: raised over the slam spot while it tells, stretched to it as it lands.
  b.parts.forEach((arm, i) => {
    if (arm.role !== 'arm') return
    const sx = b.x + Math.sign(arm.ox) * 17
    const sy = y - 8
    if (arm.gone) {
      knot(g, sx + Math.sign(arm.ox) * 4, sy)
      return
    }
    const ramp = legRamp(limbRamp, arm)
    if (b.arm === i && b.slam > 0) {
      balloonLimb(g, sx, sy, b.aimX, b.aimY - 4, 6, ramp)
    } else if (b.arm === i && b.tell > 0) {
      const k = 1 - b.tell / cfg.slamTell
      balloonLimb(
        g,
        sx,
        sy,
        sx + Math.sign(arm.ox) * 10,
        sy - 18 - k * 10,
        6,
        ramp,
      )
    } else {
      balloonLimb(g, sx, sy, arm.x, arm.y + 8, 6, ramp)
    }
  })
  healthBar(g, b)
}

/** A limb goes red as it nears popping. */
function legRamp(base: Ramp, p: BossPart): Ramp {
  if (base === FLASH) return base
  return p.hp / p.maxHp < 0.4 ? RAMPS.ember : base
}

// --- the Pie Cart -------------------------------------------------------------------------------

const CART_PALETTE = {
  s: RAMPS.steel[3],
  S: RAMPS.steel[2],
  d: RAMPS.steel[1],
  c: RAMPS.cream[3],
  C: RAMPS.cream[2],
  p: RAMPS.pink[3],
  P: RAMPS.pink[2],
  r: RAMPS.ember[2],
  g: RAMPS.gold[3],
  G: RAMPS.gold[2],
  k: INK,
  w: '#ffffff',
}

const cartRows = (wheel: 0 | 1) => [
  '....cpc.....cpc.....',
  '...cwwcc...cwwcc....',
  '...GGGGG...GGGGG..ss',
  '.SSSSSSSSSSSSSSSSSs.',
  '.SdddddddddddddddS..',
  '..s.....pPp.....s...',
  '..s....cwwcc....s...',
  '..s....GGGGG....s...',
  '.SSSSSSSSSSSSSSSSS..',
  '.SdddddddddddddddS..',
  '..s.............s...',
  wheel ? '.kkk...........kkk..' : '..k.k.........k.k...',
  wheel ? '.k.k...........k.k..' : '..kkk.........kkk...',
]
const CART_SPRITES = [
  pixelSprite(cartRows(0), CART_PALETTE),
  pixelSprite(cartRows(1), CART_PALETTE),
]
const CART_FLASH = pixelSprite(
  cartRows(0).map((row) => row.replace(/[^.]/g, 'w')),
  CART_PALETTE,
)

function renderPieCart(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  dropShadow(g, b.x, b.y + 15, 24, 5, 0.45)
  const spin = b.shift > 0 ? Math.sin(b.shift / 2) * 3 : 0
  const sprite =
    b.flash > 0 ? CART_FLASH : CART_SPRITES[Math.floor(tick / 6) % 2]!
  drawSprite(g, sprite, Math.round(b.x + spin), Math.round(b.y), {
    flipX: b.vx < 0,
    scale: 2,
  })
  if (b.phase === 2 && tick % 10 < 5)
    glow(g, b.x, b.y + 12, 16, RAMPS.ember[3], 0.35)
  healthBar(g, b)
}

// --- the Souffle Supreme ------------------------------------------------------------------------

const SOUFFLE_FACE = pixelSprite(
  ['k..k', '....', '.mm.'],
  { k: INK, m: RAMPS.ember[1] },
  { outline: null },
)

const CUPCAKE_PALETTE = {
  r: RAMPS.ember[2],
  p: RAMPS.pink[3],
  P: RAMPS.pink[2],
  w: '#ffffff',
  g: RAMPS.gold[2],
  G: RAMPS.gold[1],
  k: INK,
}
const CUPCAKE_ROWS = [
  '....r....',
  '..pwpp...',
  '.pppppP..',
  'pPpkpkPP.',
  '.ggGgGgg.',
  '.gGgGgGg.',
  '..GgGgG..',
]
const CUPCAKE = pixelSprite(CUPCAKE_ROWS, CUPCAKE_PALETTE)
const CUPCAKE_HOP = pixelSprite(
  ['....r....', '.pppwpp..', 'pPpkpkpP.', '.ggGgGgg.', '..GgGgG..'],
  CUPCAKE_PALETTE,
)

function renderSouffle(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const cfg = BOSS.souffle
  // Steam on its way down: a shadow that darkens as it nears.
  for (const d of b.drops) {
    const k = 1 - d.t / cfg.rainTell
    dropShadow(g, d.x, d.y, 6 + k * 8, 3 + k * 4, 0.2 + k * 0.4)
    const sy = d.y - (1 - k) * 60
    g.fillStyle = rgba('#ffffff', 0.35 + k * 0.3)
    g.beginPath()
    g.ellipse(d.x, sy, 5, 3, 0, 0, Math.PI * 2)
    g.fill()
  }
  for (const c of liveParts(b, 'cupcake')) {
    dropShadow(g, c.x, c.y + 5, 5, 2, 0.35)
    const hop = (tick + c.ox) % 24 < 6
    drawSprite(
      g,
      b.flash > 0 && b.flash % 2 ? CUPCAKE_HOP : hop ? CUPCAKE_HOP : CUPCAKE,
      Math.round(c.x),
      Math.round(c.y - (hop ? 2 : 0)),
    )
  }
  if (b.mode > 3) {
    // Split: the empty dish waits in the middle.
    dish(g, b.x, b.y + 8, 0.6)
    healthBar(g, b)
    return
  }
  dropShadow(g, b.x, b.y + 16, 22 - b.z * 0.2, 6, 0.4)
  const y = b.y - b.z
  const sag = b.mode === 3 ? 4 : 0
  const puff = b.mode === 0 || b.mode === 1 ? Math.sin(tick / 6) * 1.5 : 0
  dish(g, b.x, y + 8, 1)
  const crust = b.flash > 0 ? FLASH : RAMPS.gold
  // The dome: three shaded lobes, puffed when risen, sagging when it has landed.
  shadedOrb(g, b.x - 12, y - 3 + sag, 14 + puff * 0.5, crust, { glint: false })
  shadedOrb(g, b.x + 12, y - 3 + sag, 14 + puff * 0.5, crust, { glint: false })
  shadedOrb(g, b.x, y - 12 + sag * 1.5, 19 + puff - sag * 0.5, crust)
  drawSprite(g, SOUFFLE_FACE, b.x, y - 8 + sag * 1.5, { scale: 2 })
  if (b.mode === 1 || b.mode === 0) {
    // Steam curling off the top while it is up.
    for (let i = 0; i < 3; i++) {
      const t = (tick + i * 20) % 60
      g.fillStyle = rgba('#ffffff', 0.5 * (1 - t / 60))
      g.fillRect(
        Math.round(b.x - 8 + i * 8 + Math.sin(t / 8) * 2),
        Math.round(y - 26 - t / 3),
        2,
        2,
      )
    }
  }
  if (b.mode === 3)
    drawText(g, 'OPEN!', b.x, y - 40, {
      align: 'center',
      color: RAMPS.leaf[4],
      outline: INK,
    })
  healthBar(g, b)
}

/** The fluted dish the Souffle sits in. */
function dish(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
) {
  g.save()
  g.globalAlpha *= alpha
  bevel(g, Math.round(x - 21), Math.round(y - 7), 42, 14, RAMPS.cream)
  g.fillStyle = RAMPS.cream[1]
  for (let i = 0; i < 9; i++)
    g.fillRect(Math.round(x - 18 + i * 5), Math.round(y - 5), 1, 10)
  g.restore()
}

// --- the Mosh Mascot ----------------------------------------------------------------------------

const SHADES = pixelSprite(
  ['kkkkkkkkkkk', 'kwkkk.kwkkk', '.kkk...kkk.'],
  { k: INK, w: '#ffffff' },
  { outline: null },
)

function renderMosh(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const flash = b.flash > 0
  const body = flash ? FLASH : RAMPS.purple
  const head = flash ? FLASH : RAMPS.gold
  dropShadow(g, b.x, b.y + 22, 20, 5, b.z > 4 ? 0.25 : 0.4)
  const y = b.y - b.z
  if (b.mode === 3) {
    // Flat on its back, seeing stars.
    shadedOrb(g, b.x, y + 10, 18, body)
    shadedOrb(g, b.x - 20, y + 6, 12, head)
    drawSprite(g, SHADES, b.x - 20, y + 4)
    for (let i = 0; i < 3; i++) {
      const a = tick / 10 + (i * Math.PI * 2) / 3
      const sx = b.x - 20 + Math.cos(a) * 14
      const sy = y - 10 + Math.sin(a) * 4
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 1)
      g.fillRect(Math.round(sx), Math.round(sy) - 1, 1, 3)
    }
    drawText(g, 'DIZZY!', b.x, y - 16, {
      align: 'center',
      color: RAMPS.leaf[4],
      outline: INK,
    })
    healthBar(g, b)
    return
  }
  const surfing = b.mode === 1 || b.mode === 2
  const wave = Math.sin(tick / 6)
  // Arms: up and waving while it surfs, beckoning while it rallies.
  for (const side of [-1, 1]) {
    const up = surfing ? -22 + wave * 3 * side : -8 + Math.sin(tick / 8) * 6
    shadedOrb(g, b.x + side * 22, y + up, 6, body)
    shadedOrb(g, b.x + side * 17, y + up / 2 + 2, 6, body)
  }
  shadedOrb(g, b.x, y + 6, 18, body)
  g.fillStyle = RAMPS.pink[3]
  g.fillRect(b.x - 10, y + 2, 20, 3)
  shadedOrb(g, b.x, y - 16, 13, head)
  drawSprite(g, SHADES, b.x, y - 17)
  // A pink mohawk.
  for (let i = -2; i <= 2; i++) {
    g.fillStyle = INK
    g.fillRect(b.x + i * 3 - 1, y - 34 + Math.abs(i), 4, 8)
    g.fillStyle = i % 2 ? RAMPS.pink[2] : RAMPS.pink[3]
    g.fillRect(b.x + i * 3, y - 33 + Math.abs(i), 2, 7)
  }
  healthBar(g, b)
}

// --- the Jumbotron ------------------------------------------------------------------------------

const FACE_PALETTE = {
  k: INK,
  w: '#ffffff',
  e: RAMPS.ember[2],
  m: RAMPS.pink[2],
  t: RAMPS.teal[3],
}
const FACE_ROWS = [
  '.ttttt...ttttt.',
  'ttwwwtt.ttwwwtt',
  'ttwkktt.ttwkktt',
  '.ttttt...ttttt.',
  '...............',
  '...m.......m...',
  '....mmmmmmm....',
]
const FACE = pixelSprite(FACE_ROWS, FACE_PALETTE, { outline: null })
const FACE_BLINK = pixelSprite(
  [
    '...............',
    '.ttttt...ttttt.',
    '...............',
    '...............',
    '...............',
    '...m.......m...',
    '....mmmmmmm....',
  ],
  FACE_PALETTE,
  { outline: null },
)
const FACE_CROSS = pixelSprite(
  [
    'eee.......eee..',
    '..eee...eee....',
    'ttwkktt.ttwkktt',
    '.ttttt...ttttt.',
    '...............',
    '....mmmmmmm....',
    '...m.......m...',
  ],
  FACE_PALETTE,
  { outline: null },
)

function renderJumbotron(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const cfg = BOSS.jumbotron
  const first = screenSpot(0)
  const last = screenSpot(cfg.cols * cfg.rows - 1)
  // The truss the screens hang from.
  const left = first.x - cfg.w / 2 - 6
  const right = last.x + cfg.w / 2 + 6
  bevel(g, left, TOP - 2, right - left, 5, RAMPS.steel, { depth: 1 })
  for (let x = left + 4; x < right - 4; x += 8) {
    g.fillStyle = RAMPS.steel[1]
    g.fillRect(x, TOP - 1, 4, 3)
  }
  b.parts.forEach((s, i) => {
    const x = Math.round(s.x - cfg.w / 2)
    const y = Math.round(s.y - cfg.h / 2)
    bevel(g, x - 2, y - 2, cfg.w + 4, cfg.h + 4, RAMPS.steel, { depth: 1 })
    g.fillStyle = s.gone ? INK : RAMPS.night[1]
    g.fillRect(x, y, cfg.w, cfg.h)
    if (s.gone) {
      // Cracked: dark glass and a starburst of cracks.
      g.strokeStyle = RAMPS.steel[2]
      g.lineWidth = 1
      g.beginPath()
      const cx = x + cfg.w / 2
      const cy = y + cfg.h / 2
      for (let k = 0; k < 5; k++) {
        const a = k * 1.3 + i
        g.moveTo(cx, cy)
        g.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 11)
      }
      g.stroke()
      return
    }
    // Scanlines.
    g.fillStyle = rgba(RAMPS.night[3], 0.4)
    for (let ly = y + 1; ly < y + cfg.h; ly += 3) g.fillRect(x, ly, cfg.w, 1)
    const hurt = s.hp / s.maxHp
    if (hurt < 1) {
      g.strokeStyle = rgba(RAMPS.steel[3], 0.7)
      g.beginPath()
      g.moveTo(x + 6, y + 4)
      g.lineTo(x + 6 + (1 - hurt) * 30, y + 4 + (1 - hurt) * 16)
      g.stroke()
    }
    if (i === b.face) {
      const sprite =
        b.cornered || b.phase === 2
          ? FACE_CROSS
          : tick % 120 < 6
            ? FACE_BLINK
            : FACE
      glow(g, s.x, s.y, 26, b.flash > 0 ? '#ffffff' : RAMPS.teal[3], 0.35)
      drawSprite(g, sprite, s.x, s.y, { scale: 2 })
      if (b.flash > 0) {
        g.fillStyle = rgba('#ffffff', 0.45)
        g.fillRect(x, y, cfg.w, cfg.h)
      }
      return
    }
    if (i === b.next) {
      // The screen it is about to hop to fizzes with static.
      for (let k = 0; k < 24; k++) {
        const sx = x + ((k * 37 + tick * 13) % cfg.w)
        const sy = y + ((k * 23 + tick * 7) % cfg.h)
        g.fillStyle = k % 2 ? '#ffffff' : RAMPS.steel[3]
        g.fillRect(sx, sy, 2, 1)
      }
    }
    if (s.mode === 1) {
      // Flipping open: a hatch slides down to show the barrel.
      const k = 1 - s.clock / cfg.flip
      g.fillStyle = RAMPS.ember[1]
      g.fillRect(x + 2, y + 2, cfg.w - 4, Math.round((cfg.h - 4) * k))
      g.fillStyle = rgba(RAMPS.ember[3], 0.5 + 0.5 * (Math.floor(tick / 3) % 2))
      g.fillRect(x + cfg.w / 2 - 4, y + cfg.h - 6, 8, 2)
    } else if (s.mode === 2) {
      g.fillStyle = RAMPS.ember[1]
      g.fillRect(x + 2, y + 2, cfg.w - 4, cfg.h - 4)
      bevel(g, Math.round(s.x - 5), y + cfg.h - 8, 10, 10, RAMPS.steel, {
        depth: 1,
      })
      glow(g, s.x, y + cfg.h + 2, 8, RAMPS.ember[3], 0.6)
    } else {
      // An idle screen shows the crowd as dots of colour.
      for (let k = 0; k < 8; k++) {
        g.fillStyle = [RAMPS.pink[2], RAMPS.teal[2], RAMPS.gold[2]][k % 3]!
        g.fillRect(
          x + 4 + k * 6,
          y + cfg.h - 7 + ((k + Math.floor(tick / 15)) % 2),
          3,
          3,
        )
      }
    }
  })
  healthBar(g, b)
}

// --- the Mothership -------------------------------------------------------------------------------

function renderMothership(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const stunned = b.mode === 2
  const tilt = stunned ? Math.sin(tick / 6) * 2 : 0
  // The tractor beam: a pale column from the emitter down to the prize it has hold of.
  if (b.prize && b.mode === 1) {
    const warming = b.clock > 0
    const y0 = b.y + 18
    const y1 = b.prize.y - b.prize.lift * 26
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.fillStyle = rgba(
      RAMPS.teal[3],
      warming ? 0.08 + 0.1 * (Math.floor(tick / 3) % 2) : 0.22,
    )
    g.beginPath()
    g.moveTo(b.x - 5, y0)
    g.lineTo(b.x + 5, y0)
    g.lineTo(b.prize.x + 12, y1 + 6)
    g.lineTo(b.prize.x - 12, y1 + 6)
    g.closePath()
    g.fill()
    g.restore()
    for (let i = 0; i < 4; i++) {
      const k = (tick / 20 + i / 4) % 1
      g.fillStyle = rgba(RAMPS.teal[4], 0.6 * (1 - k))
      g.fillRect(
        Math.round(b.prize.x + (b.x - b.prize.x) * k) - 1,
        Math.round(y1 + (y0 - y1) * k),
        3,
        1,
      )
    }
  }
  dropShadow(g, b.x, b.y + 60, 40, 6, 0.25)
  const hull = b.flash > 0 ? FLASH : RAMPS.purple
  // The hull: a wide disc of bands, a ring of running lights, a glass dome on top.
  g.save()
  g.translate(b.x, b.y)
  g.rotate((tilt * Math.PI) / 180)
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, 0, 47, 14, 0, 0, Math.PI * 2)
  g.fill()
  for (const [rx, ry, i] of [
    [46, 13, 1],
    [42, 10, 2],
    [36, 7, 3],
  ] as const) {
    g.fillStyle = hull[i]
    g.beginPath()
    g.ellipse(0, -1, rx, ry, 0, 0, Math.PI * 2)
    g.fill()
  }
  shadedOrb(g, 0, -9, 13, b.flash > 0 ? FLASH : RAMPS.teal)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + tick / 30
    const lx = Math.cos(a) * 40
    const ly = Math.sin(a) * 8 + 3
    if (Math.sin(a) < -0.2) continue
    const on = !stunned && (i + Math.floor(tick / 6)) % 3 === 0
    g.fillStyle = on ? RAMPS.gold[4] : RAMPS.purple[1]
    g.fillRect(Math.round(lx) - 1, Math.round(ly) - 1, 3, 2)
  }
  g.restore()
  // The emitter dish underneath (gone dark while it is broken).
  const emitter = b.parts[0]
  if (emitter && !emitter.gone) {
    bevel(g, Math.round(b.x - 7), Math.round(b.y + 12), 14, 7, RAMPS.steel, {
      depth: 1,
    })
    glow(
      g,
      b.x,
      b.y + 18,
      8,
      RAMPS.teal[3],
      0.4 + 0.3 * (Math.floor(tick / 5) % 2),
    )
  } else {
    g.fillStyle = INK
    g.fillRect(Math.round(b.x - 6), Math.round(b.y + 12), 12, 5)
  }
  if (stunned)
    drawText(g, 'STUNNED!', b.x, b.y - 30, {
      align: 'center',
      color: RAMPS.leaf[4],
      outline: INK,
    })
  if (b.hold > 0)
    drawText(g, `HOLD ${b.hold}`, b.x, b.y + 22, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
  healthBar(g, b)
}

// --- the Conga Dragon ---------------------------------------------------------------------------

const DRAGON_FACE = pixelSprite(
  ['.ww..ww.', 'wkkw.wkk', '.ww..ww.', '........', '.mmmmmm.'],
  { w: '#ffffff', k: INK, m: RAMPS.ember[2] },
  { outline: null },
)
const SEGMENT_RAMPS = [
  RAMPS.pink,
  RAMPS.teal,
  RAMPS.gold,
  RAMPS.purple,
] as const

function renderDragon(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const segs = liveParts(b, 'segment')
  // Tail first, so each segment sits over the one behind it.
  for (let i = segs.length - 1; i >= 0; i--) {
    const seg = segs[i]!
    const idx = b.parts.indexOf(seg)
    dropShadow(g, seg.x, seg.y + 8, 7, 2, 0.3)
    // A dancer's feet under each segment of the costume, stepping in time.
    const step = (tick / 6 + idx) % 2 < 1 ? 1 : -1
    g.fillStyle = INK
    g.fillRect(Math.round(seg.x) - 4, Math.round(seg.y) + 4 + step, 2, 3)
    g.fillRect(Math.round(seg.x) + 2, Math.round(seg.y) + 4 - step, 2, 3)
    const ramp =
      b.flash > 0 ? FLASH : SEGMENT_RAMPS[idx % SEGMENT_RAMPS.length]!
    shadedOrb(g, seg.x, seg.y, 7, seg.hp < seg.maxHp ? RAMPS.ember : ramp)
    // A frill along its back.
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(Math.round(seg.x) - 1, Math.round(seg.y) - 9, 2, 3)
  }
  dropShadow(g, b.x, b.y + 11, 12, 3, 0.35)
  const armoured = segs.length > BOSS.dragon.armour
  const head = b.flash > 0 ? FLASH : armoured ? RAMPS.ember : RAMPS.gold
  shadedOrb(g, b.x, b.y, 11, head)
  // Horns and a party crest.
  g.fillStyle = INK
  g.fillRect(Math.round(b.x) - 9, Math.round(b.y) - 13, 4, 6)
  g.fillRect(Math.round(b.x) + 5, Math.round(b.y) - 13, 4, 6)
  g.fillStyle = RAMPS.cream[4]
  g.fillRect(Math.round(b.x) - 8, Math.round(b.y) - 12, 2, 4)
  g.fillRect(Math.round(b.x) + 6, Math.round(b.y) - 12, 2, 4)
  drawSprite(g, DRAGON_FACE, b.x + Math.sign(b.vx) * 2, b.y + 1)
  if (armoured) {
    // Gilded plates: confetti glances off until the tail is short.
    g.strokeStyle = rgba(RAMPS.gold[4], 0.8)
    g.lineWidth = 1
    g.beginPath()
    g.arc(b.x, b.y, 13, Math.PI * 1.1, Math.PI * 1.9)
    g.stroke()
  }
  // The breath's tell: embers gathering at the snout.
  if (b.clock < 30)
    glow(
      g,
      b.x + b.vx * 8,
      b.y + b.vy * 8 + 3,
      6 + (30 - b.clock) / 3,
      RAMPS.ember[3],
      0.6,
    )
  healthBar(g, b)
}

// --- the Prize Machine --------------------------------------------------------------------------

const WHEEL_RAMPS = [
  RAMPS.pink,
  RAMPS.gold,
  RAMPS.teal,
  RAMPS.purple,
  RAMPS.leaf,
  RAMPS.sky,
] as const

/** The host's TV head and a dancing body under it. */
function renderHost(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  flash: boolean,
  pose: number,
) {
  const frame = HOST_PORTRAIT[Math.floor(tick / 8) % HOST_PORTRAIT.length]!
  // Legs, then the portrait (head and jacket) on top.
  g.fillStyle = INK
  g.fillRect(Math.round(x) - 5, Math.round(y) - 1, 4, 9 + pose)
  g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 4, 9 - pose)
  g.fillStyle = RAMPS.purple[2]
  g.fillRect(Math.round(x) - 4, Math.round(y), 2, 7 + pose)
  g.fillRect(Math.round(x) + 2, Math.round(y), 2, 7 - pose)
  drawSprite(g, frame, x, y, { anchor: 'feet' })
  if (flash) glow(g, x, y - 12, 14, '#ffffff', 0.6)
}

function renderMachine(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const cfg = BOSS.machine
  const n = MACHINE_ACTS.length
  if (b.mode === 1 && MACHINE_ACTS[b.face] === 'lights') {
    // The lighting act: two spotlights swinging from the hub; faint while they warm, then hot.
    const hot = beamsHot(b)
    g.save()
    g.beginPath()
    g.rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
    g.clip()
    g.globalCompositeOperation = 'lighter'
    for (const angle of machineBeams(b)) {
      g.fillStyle = rgba(hot ? RAMPS.gold[4] : RAMPS.gold[2], hot ? 0.35 : 0.12)
      g.beginPath()
      g.moveTo(b.x, b.y)
      g.lineTo(
        b.x + Math.cos(angle - 0.03) * 240,
        b.y + Math.sin(angle - 0.03) * 240,
      )
      g.lineTo(
        b.x + Math.cos(angle + 0.03) * 240,
        b.y + Math.sin(angle + 0.03) * 240,
      )
      g.closePath()
      g.fill()
    }
    g.restore()
  }
  if (b.mode <= 2) {
    const broken = b.mode === 2
    const wy = broken ? b.fromY : b.y
    // The stand and the wheel: six coloured slices, the hub, a pointer at the top.
    bevel(g, Math.round(b.x - 4), Math.round(wy), 8, 30, RAMPS.steel)
    g.fillStyle = INK
    g.beginPath()
    g.arc(b.x, wy, cfg.r + 2, 0, Math.PI * 2)
    g.fill()
    for (let i = 0; i < n; i++) {
      const a0 = b.angle + (i / n) * Math.PI * 2 - Math.PI / 2 - Math.PI / n
      const ramp = broken && i % 2 ? RAMPS.night : WHEEL_RAMPS[i]!
      g.fillStyle = ramp[i === b.face && b.mode === 1 ? 3 : 2]
      g.beginPath()
      g.moveTo(b.x, wy)
      g.arc(b.x, wy, cfg.r, a0, a0 + (Math.PI * 2) / n)
      g.closePath()
      g.fill()
      // A bulb at the rim of each slice.
      const mid = a0 + Math.PI / n
      g.fillStyle =
        (Math.floor(tick / 5) + i) % 2 ? RAMPS.gold[4] : RAMPS.gold[2]
      g.fillRect(
        Math.round(b.x + Math.cos(mid) * (cfg.r - 4)) - 1,
        Math.round(wy + Math.sin(mid) * (cfg.r - 4)) - 1,
        3,
        3,
      )
    }
    if (b.mode === 0) {
      // Spinning blur.
      g.strokeStyle = rgba('#ffffff', 0.25)
      g.lineWidth = 2
      g.beginPath()
      g.arc(b.x, wy, cfg.r - 8, b.angle, b.angle + 2)
      g.stroke()
    }
    const open = b.mode === 1
    shadedOrb(
      g,
      b.x,
      wy,
      10,
      b.flash > 0 ? FLASH : open ? RAMPS.gold : RAMPS.steel,
    )
    if (open)
      glow(
        g,
        b.x,
        wy,
        18,
        RAMPS.gold[3],
        0.3 + 0.2 * (Math.floor(tick / 6) % 2),
      )
    // The pointer, and the host riding the top of the wheel.
    g.fillStyle = INK
    g.beginPath()
    g.moveTo(b.x - 5, wy - cfg.r - 6)
    g.lineTo(b.x + 5, wy - cfg.r - 6)
    g.lineTo(b.x, wy - cfg.r + 2)
    g.closePath()
    g.fill()
    if (!broken)
      renderHost(
        g,
        b.x,
        wy - cfg.r - 6,
        tick,
        b.flash > 0,
        Math.round(Math.sin(tick / 8)),
      )
    // What the act is, and what the wheel says is next.
    const label =
      b.mode === 1
        ? ACT_TITLES[MACHINE_ACTS[b.face]!]
        : b.mode === 0
          ? 'SPINNING...'
          : ''
    if (label)
      drawText(g, label, b.x + cfg.r + 8, wy - 12, {
        color: RAMPS.gold[4],
        outline: INK,
      })
    if (!broken && b.next >= 0)
      drawText(
        g,
        `NEXT: ${MACHINE_ACTS[b.next]!.toUpperCase()}`,
        b.x + cfg.r + 8,
        wy - 2,
        {
          color: RAMPS.cream[3],
          outline: INK,
        },
      )
  }
  if (b.mode >= 2) {
    // The host on the floor (or mid-leap), dancing.
    const move = DANCE_MOVES[b.move]!
    dropShadow(g, b.x, b.y + 8, 9, 3, 0.4)
    if (b.mode === 3 && b.tell > 0) {
      if (move === 'slide') {
        // A dashed arrow along the slide to come.
        g.strokeStyle = rgba(RAMPS.ember[3], 0.8)
        g.lineWidth = 2
        g.setLineDash([4, 4])
        g.beginPath()
        g.moveTo(b.x, b.y)
        g.lineTo(b.aimX, b.aimY)
        g.stroke()
        g.setLineDash([])
      } else if (move === 'stomp') {
        dropShadow(
          g,
          b.aimX,
          b.aimY,
          16,
          6,
          0.3 + 0.4 * (1 - b.tell / cfg.moveTell),
        )
      } else {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + tick / 6
          g.fillStyle = RAMPS.gold[4]
          g.fillRect(
            Math.round(b.x + Math.cos(a) * 14),
            Math.round(b.y - 10 + Math.sin(a) * 6),
            2,
            2,
          )
        }
      }
    }
    if (move === 'stomp' && b.mode === 3 && b.tell === 0 && b.clock > 0)
      dropShadow(g, b.aimX, b.aimY, 16, 6, 0.5)
    const pose = b.tell > 0 ? Math.round(Math.sin(tick / 3) * 2) : 0
    renderHost(g, b.x, b.y - b.z + 6, tick, b.flash > 0, pose)
  }
  healthBar(g, b)
}

/** Draws a boss (not the Parade Float, which the game draws itself). */
export function renderBoss(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  switch (b.kind) {
    case 'wobble':
      return renderWobble(g, b, tick)
    case 'piecart':
      return renderPieCart(g, b, tick)
    case 'souffle':
      return renderSouffle(g, b, tick)
    case 'mosh':
      return renderMosh(g, b, tick)
    case 'jumbotron':
      return renderJumbotron(g, b, tick)
    case 'mothership':
      return renderMothership(g, b, tick)
    case 'dragon':
      return renderDragon(g, b, tick)
    case 'machine':
      return renderMachine(g, b, tick)
    case 'float':
      return
  }
}
