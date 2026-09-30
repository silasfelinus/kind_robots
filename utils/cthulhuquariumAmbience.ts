// /utils/cthulhuquariumAmbience.ts
//
// The water itself: what makes the tank read as a tank before anything in it
// moves. Rising bubbles from the aerator, drifting marine snow, caustic light
// moving on the upper water, the surface line, and a sheen on the front glass.
// Pure canvas drawing with its own small particle state; the swim canvas calls
// stepAmbience/drawAmbienceBack/drawAmbienceFront around its occupants.
// stepAmbience returns how many bubbles reached the surface, for the sound.

import { prefersReducedMotion } from './cthulhuquariumSprites'

export interface Bubble {
  x: number
  y: number
  r: number
  wobble: number
  speed: number
}

export interface Speck {
  x: number
  y: number
  r: number
  drift: number
  alpha: number
}

export interface AmbienceState {
  bubbles: Bubble[]
  specks: Speck[]
  time: number
  nextBubble: number
  aeratorX: number
}

export function createAmbience(
  width: number,
  height: number,
  random: () => number = Math.random,
): AmbienceState {
  return {
    bubbles: [],
    specks: Array.from({ length: 46 }, () => ({
      x: random() * width,
      y: random() * height,
      r: 0.4 + random() * 1.2,
      drift: (random() - 0.5) * 4,
      alpha: 0.12 + random() * 0.3,
    })),
    time: 0,
    nextBubble: 0,
    aeratorX: width * (0.08 + random() * 0.06),
  }
}

export function stepAmbience(
  state: AmbienceState,
  width: number,
  height: number,
  delta: number,
  random: () => number = Math.random,
): number {
  state.time += delta
  state.nextBubble -= delta
  if (state.nextBubble <= 0) {
    state.nextBubble = 0.08 + random() * 0.3
    const stray = random() < 0.12
    state.bubbles.push({
      x: stray ? random() * width : state.aeratorX + (random() - 0.5) * 6,
      y: height - 4,
      r: 1 + random() * (stray ? 1.5 : 3),
      wobble: random() * Math.PI * 2,
      speed: 30 + random() * 40,
    })
  }
  const before = state.bubbles.length
  state.bubbles = state.bubbles.filter((bubble) => {
    bubble.y -= bubble.speed * delta
    bubble.wobble += delta * 4
    bubble.x += Math.sin(bubble.wobble) * 8 * delta
    bubble.r += delta * 0.25
    return bubble.y > height * 0.035
  })
  const popped = before - state.bubbles.length
  for (const speck of state.specks) {
    speck.y += (2 + speck.r * 2) * delta
    speck.x +=
      (speck.drift + Math.sin(state.time * 0.4 + speck.y * 0.05) * 2) * delta
    if (speck.y > height) {
      speck.y = 0
      speck.x = random() * width
    }
  }
  return popped
}

/** Light and particles that sit behind the occupants. */
export function drawAmbienceBack(
  context: CanvasRenderingContext2D,
  state: AmbienceState,
  width: number,
  height: number,
): void {
  const time = prefersReducedMotion() ? 0 : state.time
  context.save()
  context.globalCompositeOperation = 'lighter'
  const band = height * 0.55
  for (let index = 0; index < 7; index += 1) {
    const offset = (index / 7) * width
    const sway = Math.sin(time * 0.35 + index * 1.7) * 40
    const x = offset + sway
    const gradient = context.createLinearGradient(x, 0, x + 60, band)
    gradient.addColorStop(0, 'rgba(190, 255, 225, 0.075)')
    gradient.addColorStop(1, 'rgba(190, 255, 225, 0)')
    context.fillStyle = gradient
    context.beginPath()
    context.moveTo(x - 14, 0)
    context.lineTo(x + 18, 0)
    context.lineTo(x + 70 + sway * 0.5, band)
    context.lineTo(x + 20 + sway * 0.5, band)
    context.closePath()
    context.fill()
  }

  context.lineWidth = 1
  for (let row = 0; row < 4; row += 1) {
    const y = height * (0.05 + row * 0.045)
    context.strokeStyle = `rgba(210, 255, 240, ${0.06 - row * 0.012})`
    context.beginPath()
    for (let x = 0; x <= width; x += 12) {
      const wave =
        Math.sin(x * 0.045 + time * 1.3 + row) * 2.2 +
        Math.sin(x * 0.11 - time * 0.9 + row * 2) * 1.2
      if (x === 0) context.moveTo(x, y + wave)
      else context.lineTo(x, y + wave)
    }
    context.stroke()
  }
  context.restore()

  for (const speck of state.specks) {
    context.fillStyle = `rgba(225, 235, 210, ${speck.alpha})`
    context.beginPath()
    context.arc(speck.x, speck.y, speck.r, 0, Math.PI * 2)
    context.fill()
  }
}

/** The surface, bubbles and glass: the layers in front of the occupants. */
export function drawAmbienceFront(
  context: CanvasRenderingContext2D,
  state: AmbienceState,
  width: number,
  height: number,
): void {
  for (const bubble of state.bubbles) {
    context.strokeStyle = 'rgba(220, 255, 245, 0.55)'
    context.lineWidth = 0.8
    context.beginPath()
    context.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2)
    context.stroke()
    context.fillStyle = 'rgba(255, 255, 255, 0.6)'
    context.beginPath()
    context.arc(
      bubble.x - bubble.r * 0.35,
      bubble.y - bubble.r * 0.35,
      Math.max(0.5, bubble.r * 0.28),
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  const surface = height * 0.035
  context.fillStyle = 'rgba(200, 245, 235, 0.08)'
  context.fillRect(0, 0, width, surface)
  context.strokeStyle = 'rgba(225, 255, 245, 0.45)'
  context.lineWidth = 1.2
  context.beginPath()
  for (let x = 0; x <= width; x += 8) {
    const wave =
      Math.sin(x * 0.06 + state.time * 2) * 1.2 +
      Math.sin(x * 0.017 - state.time) * 0.8
    if (x === 0) context.moveTo(x, surface + wave)
    else context.lineTo(x, surface + wave)
  }
  context.stroke()

  const sheen = context.createLinearGradient(0, 0, width, height)
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.07)')
  sheen.addColorStop(0.18, 'rgba(255, 255, 255, 0)')
  sheen.addColorStop(0.82, 'rgba(255, 255, 255, 0)')
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0.04)')
  context.fillStyle = sheen
  context.fillRect(0, 0, width, height)

  context.fillStyle = 'rgba(40, 60, 45, 0.55)'
  context.fillRect(state.aeratorX - 5, height - 7, 10, 7)
}

/**
 * A dirty tank has to look dirty, or the Clean button is a chore nobody was
 * asked to do (playtest 2026-09-30: at 70% debris the old faint tint was
 * invisible over a painted background). `debris` is the server's 0-100 level.
 * Four signs, each growing with it: the water murks over, silt settles along
 * the floor, a green film creeps in from the glass edges, and motes of silt
 * hang in the water. Drawn over the background and under the occupants.
 */
export function drawDebris(
  context: CanvasRenderingContext2D,
  state: AmbienceState,
  width: number,
  height: number,
  debris: number,
): void {
  const level = Math.max(0, Math.min(100, debris)) / 100
  if (level <= 0) return
  const time = prefersReducedMotion() ? 0 : state.time

  context.fillStyle = `rgba(92, 88, 48, ${0.4 * level})`
  context.fillRect(0, 0, width, height)

  const siltTop = height * (1 - 0.3 * level)
  const silt = context.createLinearGradient(0, siltTop, 0, height)
  silt.addColorStop(0, 'rgba(78, 66, 36, 0)')
  silt.addColorStop(1, `rgba(78, 66, 36, ${0.75 * level})`)
  context.fillStyle = silt
  context.fillRect(0, siltTop, width, height - siltTop)

  const film = Math.min(width, height) * 0.22 * level
  const algae = `rgba(58, 96, 44, ${0.55 * level})`
  for (const [x0, y0, x1, y1, x, y, w, h] of [
    [0, 0, film, 0, 0, 0, film, height],
    [width, 0, width - film, 0, width - film, 0, film, height],
    [0, 0, 0, film, 0, 0, width, film],
  ] as const) {
    const edge = context.createLinearGradient(x0, y0, x1, y1)
    edge.addColorStop(0, algae)
    edge.addColorStop(1, 'rgba(58, 96, 44, 0)')
    context.fillStyle = edge
    context.fillRect(x, y, w, h)
  }

  // Motes: placed by index, so they hold still under reduced motion and
  // never need their own particle state.
  const motes = Math.round(70 * level)
  context.fillStyle = `rgba(66, 56, 30, ${0.35 + 0.35 * level})`
  for (let index = 0; index < motes; index++) {
    const seed = Math.sin(index * 12.9898) * 43758.5453
    const fx = seed - Math.floor(seed)
    const fy = (seed * 7.13) % 1
    const x = (fx * width + Math.sin(time * 0.3 + index) * 6 + width) % width
    const y =
      (Math.abs(fy) * height + time * (2 + (index % 5)) + height) % height
    context.beginPath()
    context.arc(x, y, 0.6 + (index % 3) * 0.5, 0, Math.PI * 2)
    context.fill()
  }
}
