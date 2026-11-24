/**
 * Fever Dream scenery for the Rainbow Space Princess cabinet (Conductor rainbow t-036/t-037): the backdrop a
 * very talented kid would airbrush on a 1980s school folder (DOODLE-DIRECTION.md). Saturated neon gradients
 * across deep-violet starry space, rainbow aurora ribbons, four-point twinkles, doodled hearts and stars, and a
 * rainbow ribbon behind every ship.
 *
 * Decoration only. Nothing here reads or changes game state: the same frames, hitboxes and seeds play out in
 * either look. Readability rule: the playfield's middle stays dark enough that every shot still reads, so the
 * ribbons are translucent and the doodles are large, soft and slow. They never look like incoming fire.
 */

const W = 480
const H = 270

/**
 * Top, middle and floor colours of the sky per Act: dark up top so every shot reads, the Act's own colour key
 * toward the floor (presentation critic P-20, 2026-11-23 PT: Acts I, III, IV and V all read as "purple again").
 * I Pinkwake magenta, II Moonjelly teal, III Trench volcanic amber, IV Express night-blue and gold, V Wreckyard
 * rust dusk, VI Crown Reef coral gold, VII Glass ice, VIII Palace eclipse violet, IX the full rainbow returns.
 */
export const FEVER_SKIES = [
  ['#1c0630', '#5e0f62', '#ff4fb8'],
  ['#03142a', '#0b3c58', '#21d7e6'],
  ['#1a0806', '#5a1c08', '#ff7a1c'],
  ['#050a2c', '#16287a', '#ffd23a'],
  ['#140a0e', '#4a1a22', '#ff6a4a'],
  ['#1a0820', '#62163e', '#ffc21f'],
  ['#08122c', '#24467e', '#cfe8ff'],
  ['#0a0418', '#2a0a48', '#c38cff'],
  ['#08021a', '#2c0848', '#8a2cff'],
] as const

/**
 * Each Act's aurora: the folder's full rainbow opens (Act I) and closes (the finale) the flight; in between the
 * ribbons take the Act's colour key, so the Acts no longer share one band.
 */
export const FEVER_AURORAS: readonly (readonly string[])[] = [
  ['#ff3fa4', '#ff8a2a', '#ffe03a', '#7dff4a', '#2ee6ff', '#a64dff'],
  ['#2ee6ff', '#7affd8', '#9ff6ff', '#2ee6ff', '#7affd8', '#9ff6ff'],
  ['#ff8a2a', '#ffb347', '#ff3c3c', '#ff8a2a', '#ffb347', '#ff3c3c'],
  ['#ffe03a', '#4a8cff', '#a6c8ff', '#ffe03a', '#4a8cff', '#a6c8ff'],
  ['#ff6a4a', '#ffb08a', '#c88a5a', '#ff6a4a', '#ffb08a', '#c88a5a'],
  ['#ffc21f', '#ff7ac8', '#ffe9a0', '#ffc21f', '#ff7ac8', '#ffe9a0'],
  ['#cfe8ff', '#8fe9ff', '#ffffff', '#cfe8ff', '#8fe9ff', '#ffffff'],
  ['#c38cff', '#fff2a8', '#ff5ad1', '#c38cff', '#fff2a8', '#ff5ad1'],
  ['#ff3fa4', '#ff8a2a', '#ffe03a', '#7dff4a', '#2ee6ff', '#a64dff'],
]

/** The airbrush rainbow: hot pink, tangerine, sunshine, lime, turquoise, electric purple. */
export const FEVER_RAINBOW = [
  '#ff3fa4',
  '#ff8a2a',
  '#ffe03a',
  '#7dff4a',
  '#2ee6ff',
  '#a64dff',
] as const

const DOODLE_TINTS = ['#ff9be0', '#9ff6ff', '#fff19a', '#c8a6ff'] as const

function wrap(x: number, span: number) {
  return ((x % span) + span) % span
}

/** A four-point twinkle, the school-folder sparkle. */
function twinkle(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  g.moveTo(x, y - r)
  g.quadraticCurveTo(x, y, x + r, y)
  g.quadraticCurveTo(x, y, x, y + r)
  g.quadraticCurveTo(x, y, x - r, y)
  g.quadraticCurveTo(x, y, x, y - r)
  g.fill()
}

function heart(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  g.moveTo(x, y + r)
  g.bezierCurveTo(x - r * 1.5, y, x - r * 0.9, y - r * 1.25, x, y - r * 0.5)
  g.bezierCurveTo(x + r * 0.9, y - r * 1.25, x + r * 1.5, y, x, y + r)
  g.fill()
}

function star(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  turn: number,
) {
  g.beginPath()
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 - Math.PI / 2 + turn
    const reach = k % 2 ? r * 0.45 : r
    const px = x + Math.cos(a) * reach
    const py = y + Math.sin(a) * reach
    if (k) g.lineTo(px, py)
    else g.moveTo(px, py)
  }
  g.closePath()
  g.fill()
}

/**
 * Paint the Fever Dream sky for an Act (1-9) at this tick. `drift` is the calm-motion factor, so the planes
 * slow together and their parallax still reads.
 */
export function drawFeverSky(
  g: CanvasRenderingContext2D,
  act: number,
  tick: number,
  drift = 1,
) {
  const key = Math.min(FEVER_SKIES.length, Math.max(1, act)) - 1
  const sky = FEVER_SKIES[key]!
  const aurora = FEVER_AURORAS[key]!
  const fill = g.createLinearGradient(0, 0, 0, H)
  fill.addColorStop(0, sky[0])
  fill.addColorStop(0.6, sky[1])
  fill.addColorStop(1, sky[2])
  g.fillStyle = fill
  g.fillRect(0, 0, W, H)

  const scenicTick = tick * drift

  g.save()
  // Far starfield: tiny white pinpricks, barely moving.
  g.fillStyle = '#ffffff'
  for (let i = 0; i < 42; i++) {
    const x = wrap(i * 53 - tick * drift * 0.06, W)
    const y = (i * 97) % (H - 40)
    g.globalAlpha = 0.35 + 0.35 * Math.sin(scenicTick / 23 + i * 1.7)
    g.fillRect(x, y, 1, 1)
  }

  // Aurora: six translucent rainbow ribbons waving across the upper sky.
  g.globalAlpha = 0.16
  g.lineCap = 'round'
  for (let band = 0; band < aurora.length; band++) {
    g.strokeStyle = aurora[band]!
    g.lineWidth = 9
    g.beginPath()
    for (let x = -10; x <= W + 10; x += 12) {
      const y =
        70 +
        band * 8 +
        Math.sin(x / 70 + tick * drift * 0.012 + act) * 22 +
        Math.sin(x / 23 - tick * drift * 0.02) * 4
      if (x === -10) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }

  // Distant bioluminescent ocean: a separate slow-moving atmospheric plane.
  // Keep the middle of the playfield dark for hostile projectile contrast.
  g.globalAlpha = 0.12
  for (let layer = 0; layer < 2; layer++) {
    const baseY = H - 12 + layer * 14
    const offset = tick * drift * (0.035 + layer * 0.025)
    g.fillStyle = layer === 0 ? sky[1] : sky[2]
    g.beginPath()
    g.moveTo(0, H)
    for (let x = 0; x <= W; x += 8) {
      const y =
        baseY -
        22 * Math.sin((x + offset) / (75 + layer * 30) + act * 0.7) -
        7 * Math.sin((x - offset) / 29 + layer)
      g.lineTo(x, y)
    }
    g.lineTo(W, H)
    g.closePath()
    g.fill()
  }

  // Doodle planes: soft hearts, stars and twinkles drifting at three depths.
  for (let plane = 0; plane < 3; plane++) {
    const speed = [0.18, 0.4, 0.75][plane]!
    const size = [3, 4.5, 6][plane]!
    for (let i = 0; i < 9; i++) {
      const x = wrap(i * (61 + plane * 17) - tick * drift * speed, W + 40) - 20
      const y = 24 + ((i * 71 + plane * 43) % (H - 70))
      const pulse = 0.5 + 0.5 * Math.sin(scenicTick / 18 + i * 2.1 + plane)
      g.fillStyle = DOODLE_TINTS[(i + plane) % DOODLE_TINTS.length]!
      g.globalAlpha = 0.14 + 0.1 * plane + 0.12 * pulse
      const shape = (i + plane) % 3
      if (shape === 0) twinkle(g, x, y, size * (0.8 + 0.4 * pulse))
      else if (shape === 1) heart(g, x, y, size * 0.8)
      else star(g, x, y, size, scenicTick * 0.01 * (i % 2 ? 1 : -1))
    }
  }

  // A rainbow arching low on the horizon, the folder's signature: Act I and the finale only (P-20).
  if (key !== 0 && key !== FEVER_SKIES.length - 1) {
    g.restore()
    return
  }
  g.globalAlpha = 0.22
  g.lineWidth = 5
  const cx = wrap(380 - tick * drift * 0.05, W + 300) - 150
  for (let band = 0; band < FEVER_RAINBOW.length; band++) {
    g.strokeStyle = FEVER_RAINBOW[band]!
    g.beginPath()
    g.arc(cx, H + 30, 150 - band * 5, Math.PI, Math.PI * 2)
    g.stroke()
  }
  g.restore()
}

/**
 * The rainbow ribbon streaming behind a ship at (x, y), nose to the right. It waves with the tick and fades
 * out over its length, drawn before the ship so the hull sits on top.
 */
export function drawFeverTrail(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  length = 46,
) {
  g.save()
  g.lineWidth = 1.6
  g.lineCap = 'round'
  const tail = x - 12
  for (let band = 0; band < FEVER_RAINBOW.length; band++) {
    const offset = (band - (FEVER_RAINBOW.length - 1) / 2) * 1.6
    for (let step = 0; step < length; step += 4) {
      const wave = (s: number) => Math.sin((tick - s) / 5) * (s / length) * 4
      g.strokeStyle = FEVER_RAINBOW[band]!
      g.globalAlpha = 0.75 * (1 - step / length)
      g.beginPath()
      g.moveTo(tail - step, y + offset + wave(step))
      g.lineTo(tail - step - 4, y + offset + wave(step + 4))
      g.stroke()
    }
  }
  // A few sparkles shed from the ribbon.
  g.fillStyle = '#ffffff'
  for (let k = 0; k < 3; k++) {
    const age = (tick + k * 7) % 21
    g.globalAlpha = 0.8 * (1 - age / 21)
    twinkle(g, tail - 8 - age * 2, y + Math.sin(tick / 4 + k * 2) * 6, 2.4)
  }
  g.restore()
}
