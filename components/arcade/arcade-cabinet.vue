<template>
  <div
    class="arcade-cabinet"
    :style="{ '--arcade-accent': meta?.accent ?? '#f472b6' }"
  >
    <div class="cabinet-marquee">
      <img
        v-if="marqueeArt"
        :src="marqueeArt"
        alt=""
        class="cabinet-marquee-art"
        @error="marqueeArt = ''"
      />
    </div>
    <div class="cabinet-title-plate">
      <span class="cabinet-marquee-title">{{ meta?.title ?? 'Arcade' }}</span>
    </div>

    <div class="cabinet-screen-wrap">
      <div class="cabinet-bezel" :style="{ maxWidth: screenMaxWidth }">
        <div
          ref="screenRef"
          class="cabinet-screen"
          :style="{ aspectRatio: `${meta?.width ?? 4} / ${meta?.height ?? 3}` }"
        >
          <canvas
            ref="canvasRef"
            class="cabinet-canvas"
            :aria-label="`${meta?.title ?? 'Arcade'} game screen`"
            role="img"
            tabindex="0"
            @pointerdown="onScreenPointer"
          />
          <div v-if="crt" class="cabinet-crt" aria-hidden="true" />
          <p v-if="loadError" class="cabinet-error">{{ loadError }}</p>
        </div>
      </div>
    </div>

    <div class="cabinet-panel">
      <div
        v-if="touchControls"
        class="cabinet-touch"
        aria-label="Touch controls"
      >
        <div class="cabinet-dpad">
          <button
            v-for="pad in dpad"
            :key="pad.button"
            type="button"
            class="cabinet-key"
            :class="pad.class"
            :aria-label="pad.label"
            @pointerdown.prevent="press(pad.button, true)"
            @pointerup.prevent="press(pad.button, false)"
            @pointerleave="press(pad.button, false)"
            @pointercancel="press(pad.button, false)"
          >
            {{ pad.glyph }}
          </button>
        </div>
        <div class="cabinet-buttons">
          <button
            type="button"
            class="cabinet-ball cabinet-ball-b"
            aria-label="B button"
            @pointerdown.prevent="press('b', true)"
            @pointerup.prevent="press('b', false)"
            @pointerleave="press('b', false)"
            @pointercancel="press('b', false)"
          >
            B
          </button>
          <button
            type="button"
            class="cabinet-ball cabinet-ball-a"
            aria-label="A button"
            @pointerdown.prevent="press('a', true)"
            @pointerup.prevent="press('a', false)"
            @pointerleave="press('a', false)"
            @pointercancel="press('a', false)"
          >
            A
          </button>
        </div>
      </div>
      <p v-else class="cabinet-hint">
        Arrows or WASD move · Space or Z = A · X or Shift = B · Enter = Start ·
        P pauses · gamepads work too
      </p>
      <div class="cabinet-switches">
        <button
          type="button"
          class="cabinet-switch cabinet-start"
          @pointerdown.prevent="press('start', true)"
          @pointerup.prevent="press('start', false)"
          @pointerleave="press('start', false)"
        >
          Start
        </button>
        <button
          type="button"
          class="cabinet-switch"
          :aria-pressed="phase === 'paused'"
          @click="togglePause"
        >
          {{ phase === 'paused' ? 'Resume' : 'Pause' }}
        </button>
        <button
          type="button"
          class="cabinet-switch"
          :aria-pressed="muted"
          @click="toggleMute"
        >
          {{ muted ? 'Sound off' : 'Sound on' }}
        </button>
        <button
          type="button"
          class="cabinet-switch"
          :aria-pressed="crt"
          @click="toggleCrt"
        >
          {{ crt ? 'CRT on' : 'CRT off' }}
        </button>
        <span class="cabinet-coin">Free play</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/arcade/arcade-cabinet.vue
//
// One Kind Robots Arcade cabinet (conductor kr-arcade): marquee, CRT screen
// in a painted bezel, control panel. Runs the attract loop (title, how to
// play, high scores, demo), the game, game over and three-initial entry.
// The flow itself is the pure reducer in utils/arcade/machine.ts.

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArcadeStore } from '@/stores/arcadeStore'
import { findArcadeGame, loadArcadeGame } from '~/utils/arcade/games'
import { ArcadeInput } from '~/utils/arcade/input'
import { startFixedLoop, TICK_MS, type FixedLoop } from '~/utils/arcade/loop'
import {
  arcadeReducer,
  ATTRACT_PHASES,
  initialArcadeState,
  qualifiesForBoard,
  type ArcadeEvent,
  type ArcadePhase,
} from '~/utils/arcade/machine'
import { createArcadeSound, type ArcadeSound } from '~/utils/arcade/sound'
import { drawText, measureText } from '~/utils/arcade/font'
import { mulberry32 } from '~/utils/arcade/curve'
import { INITIALS_ALPHABET, isAllowedInitials } from '~/utils/arcade/initials'
import type {
  ArcadeButton,
  ArcadeGameInstance,
  ArcadeGameModule,
  InputFrame,
} from '~/utils/arcade/types'

const props = defineProps<{ slug: string }>()
const emit = defineEmits<{ (e: 'scored', score: number): void }>()

const store = useArcadeStore()
const meta = computed(() => findArcadeGame(props.slug))

const screenRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const phase = ref<ArcadePhase>('title')
const muted = computed(() => store.muted)
const crt = computed(() => store.crt)
const touchControls = ref(false)
const loadError = ref('')
const marqueeArt = ref('/images/arcade/cabinet-marquee.webp')

let machine = initialArcadeState()
let gameModule: ArcadeGameModule | null = null
let game: ArcadeGameInstance | null = null
let demoGame: ArcadeGameInstance | null = null
let sound: ArcadeSound | null = null
let loop: FixedLoop | null = null
let resizeObserver: ResizeObserver | null = null
const input = new ArcadeInput()
const titleArt = typeof Image === 'undefined' ? null : new Image()
let titleArtReady = false
let ticks = 0
let lastScore = 0
let lastLevel = 1
let qualifies = false
let initials = ['A', 'A', 'A']
let cursor = 0
let initialsNote = ''
let submitting = false
let demoSeed = 1

const dpad: Array<{
  button: ArcadeButton
  glyph: string
  label: string
  class: string
}> = [
  { button: 'up', glyph: '▲', label: 'Up', class: 'cabinet-key-up' },
  { button: 'left', glyph: '◀', label: 'Left', class: 'cabinet-key-left' },
  { button: 'right', glyph: '▶', label: 'Right', class: 'cabinet-key-right' },
  { button: 'down', glyph: '▼', label: 'Down', class: 'cabinet-key-down' },
]

const screenMaxWidth = computed(() => {
  const ratio = (meta.value?.width ?? 4) / (meta.value?.height ?? 3)
  return `min(100%, calc(62dvh * ${ratio.toFixed(4)}))`
})

const board = computed(() => store.board(props.slug, 'all'))
const hiScore = () => board.value[0]?.score ?? 0

function press(button: ArcadeButton, down: boolean) {
  if (down) sound?.unlock()
  input.setTouch(button, down)
}

// --- flow -----------------------------------------------------------------

function dispatch(event: ArcadeEvent) {
  const before = machine.phase
  machine = arcadeReducer(machine, event, qualifies)
  if (machine.phase !== before) enterPhase(machine.phase)
}

function enterPhase(next: ArcadePhase) {
  phase.value = next
  input.clear()
  input.typing = next === 'initials'
  if (next === 'demo' && gameModule) {
    demoGame = gameModule.create({
      rng: mulberry32(demoSeed++),
      sound: { play: () => {} },
      demo: true,
      hiScore: hiScore(),
    })
  } else if (next !== 'demo') {
    demoGame = null
  }
  if (next === 'scores') {
    void store.fetchBoard(props.slug, 'all')
    void store.fetchBoard(props.slug, 'today')
  }
  if (next === 'initials') {
    initials = readSavedInitials()
    cursor = 0
    initialsNote = ''
  }
  if (next === 'title' || next === 'scores') game = null
}

function startGame() {
  if (!gameModule) return
  sound?.unlock()
  sound?.play('start')
  game = gameModule.create({
    rng: Math.random,
    sound: sound ?? { play: () => {} },
    demo: false,
    hiScore: hiScore(),
  })
  dispatch({ type: 'start' })
}

function togglePause() {
  sound?.unlock()
  if (machine.phase === 'playing') dispatch({ type: 'pause' })
  else if (machine.phase === 'paused') dispatch({ type: 'resume' })
}

function readSavedInitials(): string[] {
  const saved = store.savedInitials
  return isAllowedInitials(saved)
    ? saved.toUpperCase().split('')
    : ['A', 'A', 'A']
}

async function submitInitials() {
  const value = initials.join('')
  if (!isAllowedInitials(value)) {
    initialsNote = 'PICK DIFFERENT INITIALS'
    sound?.play('warn')
    return
  }
  if (submitting) return
  submitting = true
  store.rememberInitials(value)
  await store.submitScore({
    game: props.slug,
    initials: value,
    score: lastScore,
    level: lastLevel,
  })
  submitting = false
  sound?.play('level')
  dispatch({ type: 'initialsDone' })
}

function stepInitials(frame: InputFrame) {
  const letter = initials[cursor] ?? 'A'
  const index = INITIALS_ALPHABET.indexOf(letter)
  const size = INITIALS_ALPHABET.length
  if (frame.pressed.up) {
    initials[cursor] = INITIALS_ALPHABET[(index + 1) % size]!
    sound?.play('blip')
  }
  if (frame.pressed.down) {
    initials[cursor] = INITIALS_ALPHABET[(index - 1 + size) % size]!
    sound?.play('blip')
  }
  if (frame.pressed.left || frame.pressed.b) cursor = Math.max(0, cursor - 1)
  if (frame.pressed.right) cursor = Math.min(2, cursor + 1)
  if (frame.pressed.a || frame.pressed.start) {
    if (cursor < 2) cursor++
    else void submitInitials()
  }
}

function tick() {
  ticks++
  const frame = input.poll()
  const current = machine.phase
  if (ATTRACT_PHASES.includes(current)) {
    if (frame.pressed.start || frame.pressed.a) {
      startGame()
      return
    }
    if (current === 'demo' && demoGame) {
      demoGame.update(frame)
      if (demoGame.over) dispatch({ type: 'demoOver' })
    }
    if (frame.pressed.right) dispatch({ type: 'skip' })
    dispatch({ type: 'tick', ms: TICK_MS })
    return
  }
  if (current === 'playing' && game) {
    game.update(frame)
    if (game.over) {
      lastScore = game.score
      lastLevel = game.level
      qualifies = qualifiesForBoard(lastScore, board.value)
      emit('scored', lastScore)
      dispatch({ type: 'gameOver' })
    }
    return
  }
  if (current === 'paused') {
    if (frame.pressed.start || frame.pressed.a) dispatch({ type: 'resume' })
    return
  }
  if (current === 'gameover') {
    if (frame.pressed.start || frame.pressed.a) dispatch({ type: 'skip' })
    dispatch({ type: 'tick', ms: TICK_MS })
    return
  }
  if (current === 'initials') stepInitials(frame)
}

// --- drawing --------------------------------------------------------------

const SHADOW = '#1e1b4b'

function blinkOn() {
  return Math.floor(ticks / 30) % 2 === 0
}

function fitTitle(text: string, maxWidth: number, maxScale: number) {
  let scale = maxScale
  while (scale > 1 && measureText(text, scale) > maxWidth) scale--
  return scale
}

function drawBackdrop(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  artAlpha: number,
) {
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#0b0620')
  sky.addColorStop(1, '#3b0764')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  if (titleArt && titleArtReady && artAlpha > 0) {
    const scale = Math.max(w / titleArt.width, h / titleArt.height)
    const dw = titleArt.width * scale
    const dh = titleArt.height * scale
    g.globalAlpha = artAlpha
    g.drawImage(titleArt, (w - dw) / 2, (h - dh) / 2, dw, dh)
    g.globalAlpha = 1
    const shade = g.createLinearGradient(0, 0, 0, h)
    shade.addColorStop(0, 'rgba(11, 6, 32, 0.55)')
    shade.addColorStop(0.5, 'rgba(11, 6, 32, 0.15)')
    shade.addColorStop(1, 'rgba(11, 6, 32, 0.8)')
    g.fillStyle = shade
    g.fillRect(0, 0, w, h)
  }
}

function drawBoardRows(g: CanvasRenderingContext2D, w: number, top: number) {
  const rows = board.value
  if (!rows.length) {
    drawText(g, 'BE THE FIRST ON THE BOARD!', w / 2, top + 30, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow: SHADOW,
    })
    return
  }
  rows.forEach((row, i) => {
    const mine = row.id === store.lastSubmittedId
    const color =
      mine && blinkOn() ? '#ffffff' : i === 0 ? '#fde68a' : '#f9a8d4'
    const line = `${String(i + 1).padStart(2, ' ')}. ${row.initials}  ${String(row.score).padStart(7, ' ')}`
    drawText(g, line, w / 2, top + i * 22, {
      scale: 2,
      align: 'center',
      color,
      shadow: SHADOW,
    })
  })
}

function render() {
  const canvas = canvasRef.value
  const info = meta.value
  if (!canvas || !info) return
  const g = canvas.getContext('2d')
  if (!g) return
  const w = info.width
  const h = info.height
  const scale = canvas.width / w
  g.setTransform(scale, 0, 0, scale, 0, 0)
  const current = machine.phase
  const accent = info.accent

  if (current === 'title') {
    drawBackdrop(g, w, h, 0.85)
    const titleScale = fitTitle(info.title.toUpperCase(), w - 24, 5)
    drawText(g, info.title.toUpperCase(), w / 2, h * 0.2, {
      scale: titleScale,
      align: 'center',
      color: '#ffffff',
      shadow: accent,
    })
    drawText(
      g,
      'A KIND ROBOTS ARCADE GAME',
      w / 2,
      h * 0.2 + titleScale * 7 + 12,
      {
        align: 'center',
        color: '#c4b5fd',
        shadow: SHADOW,
      },
    )
    if (blinkOn()) {
      drawText(g, 'PRESS START', w / 2, h * 0.68, {
        scale: 3,
        align: 'center',
        color: '#fde68a',
        shadow: SHADOW,
      })
    }
    const best = board.value[0]
    drawText(
      g,
      best ? `HI SCORE ${best.score} ${best.initials}` : 'HI SCORE 0',
      w / 2,
      h - 34,
      { align: 'center', color: '#f9a8d4', shadow: SHADOW, scale: 2 },
    )
    drawText(g, 'FREE PLAY', w - 8, h - 12, {
      align: 'right',
      color: '#86efac',
      shadow: SHADOW,
    })
    return
  }

  if (current === 'howto') {
    drawBackdrop(g, w, h, 0.3)
    drawText(g, 'HOW TO PLAY', w / 2, 28, {
      scale: 3,
      align: 'center',
      color: '#ffffff',
      shadow: accent,
    })
    info.howTo.forEach((line, i) => {
      drawText(g, line, w / 2, 80 + i * 30, {
        scale: 2,
        align: 'center',
        color: i % 2 ? '#f9a8d4' : '#fde68a',
        shadow: SHADOW,
      })
    })
    return
  }

  if (current === 'scores' || current === 'initials') {
    drawBackdrop(g, w, h, 0.2)
  }

  if (current === 'scores') {
    drawText(g, 'HIGH SCORES', w / 2, 22, {
      scale: 3,
      align: 'center',
      color: '#ffffff',
      shadow: accent,
    })
    drawBoardRows(g, w, 64)
    if (store.offline) {
      drawText(g, 'SAVED ON THIS DEVICE', w / 2, h - 16, {
        align: 'center',
        color: '#94a3b8',
      })
    }
    return
  }

  if (current === 'demo') {
    if (demoGame) demoGame.render(g)
    g.setTransform(scale, 0, 0, scale, 0, 0)
    drawText(g, 'DEMO', w / 2, h * 0.36, {
      scale: 3,
      align: 'center',
      color: '#ffffff',
      shadow: accent,
    })
    if (blinkOn()) {
      drawText(g, 'PRESS START', w / 2, h * 0.36 + 34, {
        scale: 2,
        align: 'center',
        color: '#fde68a',
        shadow: SHADOW,
      })
    }
    return
  }

  if (current === 'initials') {
    drawText(g, 'NEW HIGH SCORE!', w / 2, 30, {
      scale: 3,
      align: 'center',
      color: '#fde68a',
      shadow: accent,
    })
    drawText(g, String(lastScore), w / 2, 64, {
      scale: 3,
      align: 'center',
      color: '#ffffff',
      shadow: SHADOW,
    })
    drawText(g, 'ENTER YOUR INITIALS', w / 2, 106, {
      scale: 2,
      align: 'center',
      color: '#f9a8d4',
      shadow: SHADOW,
    })
    const cell = 46
    const left = w / 2 - cell * 1.5
    initials.forEach((letter, i) => {
      const x = left + i * cell + cell / 2
      drawText(g, letter, x, 140, {
        scale: 5,
        align: 'center',
        color: i === cursor ? '#ffffff' : '#c4b5fd',
        shadow: accent,
      })
      if (i === cursor && blinkOn()) {
        g.fillStyle = '#fde68a'
        g.fillRect(x - 15, 182, 30, 4)
      }
    })
    drawText(g, 'UP/DOWN CHANGE  LEFT/RIGHT MOVE', w / 2, 212, {
      align: 'center',
      color: '#c4b5fd',
    })
    drawText(g, 'A = NEXT LETTER  (OR JUST TYPE)', w / 2, 226, {
      align: 'center',
      color: '#c4b5fd',
    })
    if (initialsNote) {
      drawText(g, initialsNote, w / 2, 250, {
        scale: 2,
        align: 'center',
        color: '#f87171',
      })
    }
    return
  }

  // playing, paused, gameover
  if (game) game.render(g)
  g.setTransform(scale, 0, 0, scale, 0, 0)
  if (current === 'paused') {
    g.fillStyle = 'rgba(11, 6, 32, 0.6)'
    g.fillRect(0, 0, w, h)
    drawText(g, 'PAUSED', w / 2, h / 2 - 20, {
      scale: 4,
      align: 'center',
      color: '#ffffff',
      shadow: accent,
    })
    drawText(g, 'PRESS START TO GO ON', w / 2, h / 2 + 22, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow: SHADOW,
    })
  }
}

// --- sizing, keys, lifecycle -----------------------------------------------

function resizeCanvas() {
  const canvas = canvasRef.value
  const screen = screenRef.value
  if (!canvas || !screen) return
  const rect = screen.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  render()
}

function onScreenPointer() {
  sound?.unlock()
  canvasRef.value?.focus({ preventScroll: true })
  if (ATTRACT_PHASES.includes(machine.phase)) startGame()
  else if (machine.phase === 'paused') dispatch({ type: 'resume' })
  else if (machine.phase === 'gameover') dispatch({ type: 'skip' })
}

function onKey(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement) return
  sound?.unlock()
  if (event.code === 'KeyP' || event.code === 'Escape') {
    togglePause()
    return
  }
  if (machine.phase === 'initials' && /^[a-z0-9]$/i.test(event.key)) {
    initials[cursor] = event.key.toUpperCase()
    if (cursor < 2) cursor++
    sound?.play('blip')
    return
  }
  if (machine.phase === 'initials' && event.code === 'Backspace') {
    cursor = Math.max(0, cursor - 1)
  }
}

function onVisibility() {
  if (document.hidden && machine.phase === 'playing')
    dispatch({ type: 'pause' })
}

function toggleMute() {
  sound?.unlock()
  store.setMuted(!store.muted)
  sound?.setMuted(store.muted)
}

function toggleCrt() {
  store.setCrt(!store.crt)
}

async function boot() {
  const info = meta.value
  if (!info) {
    loadError.value = 'This cabinet is still being built.'
    return
  }
  machine = initialArcadeState()
  phase.value = machine.phase
  if (titleArt) {
    titleArtReady = false
    titleArt.onload = () => {
      titleArtReady = true
    }
    titleArt.src = info.titleArt
  }
  try {
    gameModule = await loadArcadeGame(info.slug)
  } catch {
    loadError.value = 'This cabinet could not start. Try reloading.'
  }
  void store.fetchBoard(info.slug, 'all')
  void store.fetchBoard(info.slug, 'today')
}

onMounted(() => {
  store.loadPreferences(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  sound = createArcadeSound(store.muted)
  touchControls.value = window.matchMedia('(pointer: coarse)').matches
  input.attach(window)
  window.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
  resizeObserver = new ResizeObserver(resizeCanvas)
  if (screenRef.value) resizeObserver.observe(screenRef.value)
  void boot()
  loop = startFixedLoop(tick, render)
})

watch(
  () => props.slug,
  () => void boot(),
)

onBeforeUnmount(() => {
  loop?.stop()
  input.detach()
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVisibility)
  resizeObserver?.disconnect()
  sound?.dispose()
})
</script>

<style scoped>
.arcade-cabinet {
  --arcade-accent: #f472b6;
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  border-radius: 1.5rem 1.5rem 0.75rem 0.75rem;
  background:
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.06),
      transparent 12%,
      transparent 88%,
      rgba(0, 0, 0, 0.25)
    ),
    linear-gradient(180deg, #312e81 0%, #1e1b4b 55%, #0f0a2e 100%);
  border: 3px solid #a78bfa;
  box-shadow:
    0 0 0 3px #1e1b4b,
    0 0 28px color-mix(in srgb, var(--arcade-accent) 45%, transparent),
    inset 0 0 0 2px rgba(253, 230, 138, 0.25);
  overflow: hidden;
}

.cabinet-marquee {
  position: relative;
  aspect-ratio: 4 / 1;
  max-height: 9rem;
  background: linear-gradient(
    90deg,
    #0d9488,
    #7c3aed 30%,
    #db2777 70%,
    #f59e0b
  );
  overflow: hidden;
}

.cabinet-marquee-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cabinet-title-plate {
  display: flex;
  justify-content: center;
  padding: 0.4rem 1rem;
  background: #0b0620;
  border-top: 3px solid #fde68a;
  border-bottom: 3px solid #fde68a;
}

.cabinet-marquee-title {
  font-family: ui-monospace, 'Courier New', monospace;
  font-weight: 900;
  font-size: clamp(1.1rem, 3.5vw, 1.9rem);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
  text-shadow:
    0 0 6px var(--arcade-accent),
    0 0 18px var(--arcade-accent),
    3px 3px 0 #1e1b4b;
}

.cabinet-screen-wrap {
  padding: clamp(0.25rem, 2vw, 1.5rem);
  background: radial-gradient(circle at 50% 40%, #1e1b4b, #0b0620 75%);
}

.cabinet-bezel {
  margin: 0 auto;
  padding: clamp(0.6rem, 4.5%, 2.75rem);
  border-radius: 1.25rem;
  background:
    url('/images/arcade/cabinet-bezel.webp') center / cover no-repeat,
    linear-gradient(135deg, #4c1d95, #1e1b4b 40%, #831843);
  box-shadow: inset 0 0 0 2px rgba(253, 230, 138, 0.35);
}

.cabinet-screen {
  position: relative;
  width: 100%;
  border-radius: 0.9rem;
  overflow: hidden;
  background: #05030f;
  box-shadow:
    inset 0 0 24px rgba(0, 0, 0, 0.9),
    0 0 18px color-mix(in srgb, var(--arcade-accent) 35%, transparent);
}

.cabinet-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  outline: none;
}

.cabinet-crt {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.18) 0 1px,
      transparent 1px 3px
    ),
    radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(0, 0, 0, 0.45) 100%
    );
  mix-blend-mode: multiply;
}

.cabinet-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  text-align: center;
  color: #fde68a;
  font-family: ui-monospace, 'Courier New', monospace;
}

.cabinet-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem 1rem 1.1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 30%),
    linear-gradient(90deg, #5b21b6, #be185d);
  border-top: 4px solid #fde68a;
}

.cabinet-touch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cabinet-dpad {
  display: grid;
  grid-template-columns: repeat(3, 3.25rem);
  grid-template-rows: repeat(3, 3.25rem);
  gap: 0.25rem;
}

.cabinet-key {
  border-radius: 0.75rem;
  background: #1e1b4b;
  color: #fde68a;
  font-size: 1.25rem;
  box-shadow: 0 4px 0 #0b0620;
  touch-action: none;
  user-select: none;
}

.cabinet-key:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #0b0620;
}

.cabinet-key-up {
  grid-column: 2;
  grid-row: 1;
}

.cabinet-key-left {
  grid-column: 1;
  grid-row: 2;
}

.cabinet-key-right {
  grid-column: 3;
  grid-row: 2;
}

.cabinet-key-down {
  grid-column: 2;
  grid-row: 3;
}

.cabinet-buttons {
  display: flex;
  align-items: flex-end;
  gap: 0.9rem;
}

.cabinet-ball {
  width: 4.25rem;
  height: 4.25rem;
  border-radius: 9999px;
  font-weight: 900;
  font-size: 1.25rem;
  color: #fff;
  touch-action: none;
  user-select: none;
  box-shadow:
    0 5px 0 rgba(0, 0, 0, 0.45),
    inset 0 -6px 0 rgba(0, 0, 0, 0.2),
    inset 0 4px 0 rgba(255, 255, 255, 0.35);
}

.cabinet-ball:active {
  transform: translateY(4px);
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.45),
    inset 0 -3px 0 rgba(0, 0, 0, 0.2);
}

.cabinet-ball-a {
  background: #ec4899;
  margin-bottom: 1.25rem;
}

.cabinet-ball-b {
  background: #14b8a6;
}

.cabinet-hint {
  margin: 0;
  text-align: center;
  font-size: 0.8rem;
  color: #fde68a;
}

.cabinet-switches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.cabinet-switch {
  padding: 0.4rem 0.8rem;
  border-radius: 0.6rem;
  background: rgba(15, 10, 46, 0.75);
  color: #f5f3ff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid rgba(253, 230, 138, 0.35);
}

.cabinet-start {
  background: #facc15;
  color: #1e1b4b;
  touch-action: none;
}

.cabinet-coin {
  padding: 0.35rem 0.7rem;
  border-radius: 0.4rem;
  background: #0b0620;
  color: #86efac;
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  box-shadow: inset 0 0 6px rgba(134, 239, 172, 0.5);
}
</style>
