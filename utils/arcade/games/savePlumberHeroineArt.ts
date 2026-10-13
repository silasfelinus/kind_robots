import type { Heroine } from './savePlumberHeroine'

type G = CanvasRenderingContext2D

export type HeroinePose = {
  /** Distance-driven stride phase in radians; 0 is standing. */
  stride: number
  /** 0..1, how far the run has blended in (0 = idle). */
  run: number
  airborne: boolean
  rising: boolean
  facing: 1 | -1
  tick: number
}

const paths = new Map<string, Path2D | null>()

function path(d: string): Path2D | null {
  let p = paths.get(d)
  if (p === undefined) {
    p = typeof Path2D === 'undefined' ? null : new Path2D(d)
    paths.set(d, p)
  }
  return p
}

function fill(g: G, d: string, colour: string) {
  const p = path(d)
  if (!p) return
  g.fillStyle = colour
  g.fill(p)
}

function roundRect(
  g: G,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  colour: string,
) {
  g.fillStyle = colour
  g.beginPath()
  if (typeof g.roundRect === 'function') g.roundRect(x, y, w, h, r)
  else g.rect(x, y, w, h)
  g.fill()
}

function circle(g: G, x: number, y: number, r: number, colour: string) {
  g.fillStyle = colour
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
}

function shade(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  const ch = (shift: number) =>
    Math.round(((n >> shift) & 255) * 0.72)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(16)}${ch(8)}${ch(0)}`
}

function limb(g: G, pivotY: number, angle: number, draw: () => void) {
  g.save()
  g.translate(0, pivotY)
  g.rotate(angle)
  g.translate(0, -pivotY)
  draw()
  g.restore()
}

const HAIR_BACK: Partial<Record<Heroine['hairStyle'], string>> = {
  ponytail: 'M-10-84c-16-2-28 10-30 26 8-6 16-8 24-6Z',
  braids: 'M-12-74c-4 10-6 22-2 30l6-2c-2-8-2-18 2-26Z',
  locs: 'M-16-80c-8 12-10 28-6 40h8c-2-12 0-26 6-36Z',
  bob: 'M-16-86c-6 12-6 22-2 30h10l2-28Z',
}

/**
 * The heroine, standing on (x, y), `height` logical px tall, in the same
 * drawing as the front page's runner. Legs and arms swing with the stride,
 * the jump tucks one knee, the scarf streams.
 */
export function drawHeroine(
  g: G,
  heroine: Heroine,
  x: number,
  y: number,
  height: number,
  pose: HeroinePose,
): void {
  const s = height / 102
  const swing = Math.sin(pose.stride) * 0.62 * pose.run
  const legFront = pose.airborne ? (pose.rising ? -0.9 : -0.35) : -swing
  const legBack = pose.airborne ? (pose.rising ? 0.55 : 0.25) : swing
  const armFront = pose.airborne ? -1.1 : swing * 0.8
  const armBack = pose.airborne ? 0.7 : -swing * 0.8
  const bob = pose.airborne ? 0 : Math.abs(Math.cos(pose.stride)) * 3 * pose.run
  const flutter = Math.sin(pose.tick / 4) * 0.12

  g.save()
  g.translate(x, y - bob * s)
  g.scale(s * pose.facing, s)

  g.save()
  g.translate(-6, -58)
  g.rotate(flutter - (pose.airborne ? 0.25 : 0.05 * pose.run))
  g.translate(6, 58)
  fill(
    g,
    'M-6-58c-14 2-26 8-38 4 6 6 18 10 30 8-8 6-20 8-30 6 10 8 26 6 38-6Z',
    heroine.scarf,
  )
  g.restore()

  const back = HAIR_BACK[heroine.hairStyle]
  if (back) fill(g, back, heroine.hair)
  else if (heroine.hairStyle === 'bun') circle(g, -8, -92, 8, heroine.hair)
  else if (heroine.hairStyle === 'curls') {
    circle(g, -14, -80, 10, heroine.hair)
    circle(g, -14, -64, 8, heroine.hair)
  }

  limb(g, -32, legBack, () => {
    roundRect(g, -6, -34, 10, 26, 5, shade(heroine.outfit))
    fill(g, 'M-8-10h16l4 10H-8Z', heroine.boots)
  })
  limb(g, -58, armBack, () =>
    roundRect(g, -4, -60, 8, 24, 4, heroine.skinShade),
  )

  roundRect(g, -13, -64, 26, 22, 8, heroine.shirt)
  fill(g, 'M-12-50h24v16c0 3-3 6-6 6H-6c-3 0-6-3-6-6Z', heroine.outfit)
  g.strokeStyle = heroine.outfit
  g.lineWidth = 4
  g.beginPath()
  g.moveTo(-10, -62)
  g.lineTo(-6, -50)
  g.moveTo(10, -62)
  g.lineTo(6, -50)
  g.stroke()

  limb(g, -32, legFront, () => {
    roundRect(g, -5, -34, 10, 26, 5, heroine.outfit)
    fill(g, 'M-7-10h16l4 10H-7Z', heroine.boots)
  })

  g.fillStyle = heroine.skinShade
  g.fillRect(-4, -70, 8, 8)
  circle(g, 2, -80, 15, heroine.skin)
  fill(
    g,
    'M-14-80c-2-14 6-22 18-22 10 0 16 6 15 14-6-4-12-4-18-2-4 6-10 9-15 10Z',
    heroine.hair,
  )
  if (heroine.hairStyle === 'curls') {
    circle(g, -6, -96, 7, heroine.hair)
    circle(g, 6, -98, 7, heroine.hair)
    circle(g, -14, -88, 7, heroine.hair)
  }
  circle(g, 9, -80, 2.4, '#2a2230')
  g.strokeStyle = '#7a2e3a'
  g.lineWidth = 1.8
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(8, -73)
  g.quadraticCurveTo(12, -71, 15, -74)
  g.stroke()
  g.globalAlpha *= 0.3
  circle(g, 5, -75, 3, '#ff7f8f')
  g.globalAlpha /= 0.3
  g.strokeStyle = '#5a4636'
  g.lineWidth = 2.5
  g.beginPath()
  g.moveTo(-13, -90)
  g.quadraticCurveTo(1, -96, 15, -90)
  g.stroke()
  circle(g, 10, -91, 4.5, '#e9b65c')

  limb(g, -58, armFront, () => {
    roundRect(g, -4, -60, 8, 24, 4, heroine.skin)
    g.save()
    g.translate(0, -38)
    g.rotate(0.52)
    roundRect(g, -2, -2, 5, 22, 2.5, '#9fb3bd')
    fill(g, 'M-6 20a7 7 0 1 0 14 0h-3l-2 4h-4l-2-4Z', '#c3d2d9')
    g.restore()
  })

  g.restore()
}
