<template>
  <canvas ref="canvasRef" class="split-flap-departures" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const COLUMNS = 14
const ROWS = 3
const STRIP = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?-'
const STRIP_LENGTH = STRIP.length
const FLIP_MS = 85
const TILE_STAGGER_MS = 38
const BASE_LAPS = 5
const DWELL_MS = 4600
const PERIOD_MS = 10400
const MAX_HOVER_PAUSE_MS = 3000
const CLICK_COOLDOWN_MS = 1200
const BACKGROUND_TOP = '#14161c'
const BACKGROUND_BOTTOM = '#1f232c'

// Each phrase is three rows of at most COLUMNS characters.
const PHRASES: string[][] = [
  ['THE LAST TRAIN', 'TO YESTERDAY', 'IS ON TIME'],
  ['GATE 9 IS A', 'DOORWAY TO', 'SOMEWHERE KIND'],
  ['NOW BOARDING', 'ALL THE ROBOTS', 'WHO MISSED YOU'],
  ['DELAYED BY', 'A VERY GOOD', 'CUP OF TEA'],
  ['PLATFORM 3', 'SMELLS LIKE', 'RAIN AND TOAST'],
  ['YOUR WINDOW', 'SEAT HAS THE', 'BEST CLOUDS'],
  ['LOST AND FOUND', 'HOLDING ONE', 'LUCKY UMBRELLA'],
  ['ARRIVING SOON', 'EVERYTHING', 'YOU HOPED FOR'],
]

function targetIndex(phrase: number, row: number, column: number): number {
  const wrapped = ((phrase % PHRASES.length) + PHRASES.length) % PHRASES.length
  const text = (PHRASES[wrapped] as string[])[row] ?? ''
  const pad = Math.floor((COLUMNS - text.length) / 2)
  const char = text[column - pad] ?? ' '
  const index = STRIP.indexOf(char)
  return index < 0 ? 0 : index
}

interface Tile {
  row: number
  column: number
  // Hover pauses this tile's flap; the clock keeps going for the rest.
  pauseMs: number
  x: number
  y: number
  w: number
  h: number
}

const tiles: Tile[] = []
for (let row = 0; row < ROWS; row++) {
  for (let column = 0; column < COLUMNS; column++) {
    tiles.push({ row, column, pauseMs: 0, x: 0, y: 0, w: 0, h: 0 })
  }
}

let context: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let width = 1
let height = 1
let dpr = 1
let previousTimestamp = 0
let clockMs = 0
let reducedMotion = false
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0
let lastPhrase = 0

// Pure function of the phrase clock: which strip index a tile shows, and how
// far through the current flap it is (0 = at rest).
function tileState(
  tile: Tile,
  phrase: number,
  localMs: number,
): { current: number; next: number; progress: number } {
  const from = targetIndex(phrase - 1, tile.row, tile.column)
  const to = targetIndex(phrase, tile.row, tile.column)
  const diff = (to - from + STRIP_LENGTH) % STRIP_LENGTH
  const laps = BASE_LAPS + ((tile.column * 7 + tile.row * 3 + phrase) % 5)
  const flips = laps + diff
  const delay = (tile.column + tile.row * 3) * TILE_STAGGER_MS
  const t = Math.max(0, localMs - tile.pauseMs - delay)
  const done = t >= flips * FLIP_MS
  if (done) return { current: to, next: to, progress: 0 }
  const count = Math.floor(t / FLIP_MS)
  const current = (from + count) % STRIP_LENGTH
  return {
    current,
    next: (current + 1) % STRIP_LENGTH,
    progress: (t % FLIP_MS) / FLIP_MS,
  }
}

function layoutTiles(): void {
  const gap = Math.max(3, Math.min(width, height) * 0.008)
  const tileW = Math.min(
    (width * 0.9 - gap * (COLUMNS - 1)) / COLUMNS,
    ((height * 0.7 - gap * (ROWS - 1)) / ROWS) * 0.72,
  )
  const tileH = tileW / 0.72
  const boardW = tileW * COLUMNS + gap * (COLUMNS - 1)
  const boardH = tileH * ROWS + gap * (ROWS - 1)
  const left = (width - boardW) / 2
  const top = (height - boardH) / 2
  for (const tile of tiles) {
    tile.w = tileW
    tile.h = tileH
    tile.x = left + tile.column * (tileW + gap)
    tile.y = top + tile.row * (tileH + gap)
  }
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  dpr = Math.min(2, window.devicePixelRatio || 1)
  width = Math.max(1, canvas.clientWidth)
  height = Math.max(1, canvas.clientHeight)
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  context?.setTransform(dpr, 0, 0, dpr, 0, 0)
  layoutTiles()
}

function canvasPoint(event: PointerEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function handlePointerMove(event: PointerEvent): void {
  const point = canvasPoint(event)
  pointerActive = point !== null
  if (point) {
    pointerX = point.x
    pointerY = point.y
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion || !canvasPoint(event)) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  // Skip the remaining dwell: jump the clock to the next phrase boundary
  // only when the board has already settled.
  const local = clockMs % PERIOD_MS
  if (local > PERIOD_MS - DWELL_MS) clockMs += PERIOD_MS - local
}

function drawHalf(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  char: string,
  top: boolean,
  scaleY: number,
): void {
  if (scaleY <= 0.001) return
  const half = tile.h / 2
  const originY = tile.y + half
  ctx.save()
  ctx.beginPath()
  ctx.translate(tile.x, originY)
  ctx.scale(1, scaleY)
  const y0 = top ? -half : 0
  ctx.rect(0, y0, tile.w, half)
  ctx.fillStyle = top ? '#2b2f3a' : '#232731'
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = '#f2e6c4'
  ctx.font = `700 ${tile.h * 0.68}px ui-monospace, Menlo, Consolas, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, tile.w / 2, 0)
  ctx.restore()
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  state: { current: number; next: number; progress: number },
  hovered: boolean,
): void {
  const currentChar = STRIP.charAt(state.current)
  const nextChar = STRIP.charAt(state.next)
  const resting = state.progress === 0
  if (resting) {
    drawHalf(ctx, tile, currentChar, true, 1)
    drawHalf(ctx, tile, currentChar, false, 1)
  } else {
    // Static halves: new character above, old character below.
    drawHalf(ctx, tile, nextChar, true, 1)
    drawHalf(ctx, tile, currentChar, false, 1)
    if (state.progress < 0.5) {
      // Old top flap swings down and shrinks away.
      drawHalf(ctx, tile, currentChar, true, 1 - state.progress * 2)
    } else {
      // New bottom flap swings into place.
      drawHalf(ctx, tile, nextChar, false, (state.progress - 0.5) * 2)
    }
  }
  // Hinge line.
  ctx.fillStyle = 'rgba(8, 9, 12, 0.85)'
  ctx.fillRect(tile.x, tile.y + tile.h / 2 - 1, tile.w, 2)
  if (hovered) {
    ctx.strokeStyle = 'rgba(242, 230, 196, 0.6)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(tile.x, tile.y, tile.w, tile.h)
  }
}

function renderFrame(timestamp: number): void {
  const ctx = context
  if (!ctx) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  let phrase = 0
  let local = PERIOD_MS
  if (reducedMotion) {
    phrase = lastPhrase
  } else {
    clockMs += delta
    phrase = Math.floor(clockMs / PERIOD_MS)
    local = clockMs % PERIOD_MS
    if (phrase !== lastPhrase) {
      lastPhrase = phrase
      for (const tile of tiles) tile.pauseMs = 0
    }
  }

  const background = ctx.createLinearGradient(0, 0, 0, height)
  background.addColorStop(0, BACKGROUND_TOP)
  background.addColorStop(1, BACKGROUND_BOTTOM)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  for (const tile of tiles) {
    const hovered =
      !reducedMotion &&
      pointerActive &&
      pointerX >= tile.x &&
      pointerX <= tile.x + tile.w &&
      pointerY >= tile.y &&
      pointerY <= tile.y + tile.h
    let state = tileState(tile, phrase, local)
    // Hovering holds a still-flapping tile mid-motion (paused, not reset).
    if (hovered && state.current !== state.next) {
      tile.pauseMs = Math.min(MAX_HOVER_PAUSE_MS, tile.pauseMs + delta)
      state = tileState(tile, phrase, local)
    }
    drawTile(ctx, tile, state, hovered)
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  // Reduced motion holds the current phrase fully settled, no flaps.
  for (const tile of tiles) tile.pauseMs = 0
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  context = null
})
</script>

<style scoped>
.split-flap-departures {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
