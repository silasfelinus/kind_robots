<template>
  <Teleport to="body" :disabled="!locked">
    <div
      class="showdown-stage"
      :class="{ 'showdown-stage--locked': locked }"
      @contextmenu="onContextMenu"
    >
      <div ref="screenRef" class="showdown-screen">
        <canvas
          ref="canvasRef"
          :width="VIEW_WIDTH"
          :height="VIEW_HEIGHT"
          :style="{ width: canvasWidth }"
          class="showdown-canvas"
          tabindex="0"
          aria-label="Zuzu Showdown fight"
          role="img"
        />
        <div
          v-if="store.crt && !store.reducedMotion"
          class="showdown-crt"
          :style="{ width: canvasWidth }"
        />
      </div>

      <div
        v-if="touchControls"
        class="showdown-touch"
        aria-label="Touch controls"
      >
        <div
          ref="dpadRef"
          class="showdown-dpad"
          role="group"
          aria-label="Move"
          @pointerdown.prevent="onDpad"
          @pointermove.prevent="onDpad"
          @pointerup.prevent="releaseDpad"
          @pointercancel="releaseDpad"
          @lostpointercapture="releaseDpad"
        >
          <span class="showdown-dpad-knob" :style="knobStyle" />
        </div>
        <div class="showdown-buttons">
          <button
            v-for="button in touchButtons"
            :key="button.key"
            type="button"
            class="showdown-button"
            :class="button.tone"
            :aria-label="button.label"
            @pointerdown.prevent="holdButton($event, button.key)"
            @pointerup.prevent="press(button.key, false)"
            @pointercancel="press(button.key, false)"
            @lostpointercapture="press(button.key, false)"
          >
            {{ button.short }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createArcadeSound, type ArcadeSound } from '~/utils/arcade/sound'
import { setGamePageLock } from '~/utils/arcade/pageLock'
import { startFixedLoop, type FixedLoop } from '~/utils/arcade/loop'
import type { ButtonInput } from '~/utils/arcade/input'
import {
  P1_KEYS,
  P2_KEYS,
  SOLO_KEYS,
  createPlayerInput,
  toSimInput,
  type FightButton,
} from '~/utils/zuzuShowdown/input'
import { createMatch, step } from '~/utils/zuzuShowdown/sim'
import {
  VIEW_HEIGHT,
  VIEW_WIDTH,
  advanceCallouts,
  drawCard,
  drawMatch,
  type Callout,
} from '~/utils/zuzuShowdown/render'
import { findFighter } from '~/utils/zuzuShowdown/fighters'
import {
  advanceSlowdown,
  advanceSparks,
  koFlash,
  koSlowdownFor,
  slowdownSteps,
  type KoSlowdown,
  type Spark,
} from '~/utils/zuzuShowdown/effects'
import { cpuInput, newCpu, type CpuState } from '~/utils/zuzuShowdown/cpu'
import { introFor } from '~/utils/zuzuShowdown/matchups'
import {
  VS_SLAM_FRAMES,
  drawVsScreen,
  drawWinScreen,
  vsDuration,
} from '~/utils/zuzuShowdown/screens'
import {
  SPRITE_FIGHTERS,
  SPRITE_ROOT,
  spriteFile,
  type LoadedSprites,
  type SpriteSheet,
} from '~/utils/zuzuShowdown/sprites'
import {
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
} from '~/utils/zuzuShowdown/types'
import { useZuzuShowdownStore } from '~/stores/zuzuShowdownStore'

type StagePhase = 'title' | 'vs' | 'fight' | 'paused' | 'result'
type Direction = 'up' | 'down' | 'left' | 'right'

const RESULT_DELAY = 150

// Fighter art (t-010), loaded once; until a fighter's atlas arrives it draws as a placeholder.
const sprites: Partial<Record<string, LoadedSprites>> = {}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

async function loadSprites() {
  await Promise.all(
    SPRITE_FIGHTERS.map(async (slug) => {
      try {
        const response = await fetch(
          `${SPRITE_ROOT}/${spriteFile(slug)}-pixel.json`,
        )
        if (!response.ok) return
        const sheet = (await response.json()) as SpriteSheet
        const [image, p2] = await Promise.all([
          loadImage(`${SPRITE_ROOT}/${sheet.atlas}`),
          loadImage(`${SPRITE_ROOT}/${sheet.atlas_p2}`),
        ])
        if (image) sprites[slug] = { sheet, image, p2 }
      } catch {
        // Missing art is not an error: the placeholder fighter still plays.
      }
    }),
  )
}

const store = useZuzuShowdownStore()

function currentRoster(): [FighterData, FighterData] {
  return [findFighter(store.fighters[0]), findFighter(store.fighters[1])]
}

let roster = currentRoster()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const screenRef = ref<HTMLElement | null>(null)
const dpadRef = ref<HTMLElement | null>(null)
const canvasWidth = ref('100%')
const phase = ref<StagePhase>('title')
const touchControls = ref(false)
const dpadHeld = ref<Record<Direction, boolean>>({
  up: false,
  down: false,
  left: false,
  right: false,
})

const touchButtons: Array<{
  key: FightButton
  short: string
  label: string
  tone: string
}> = [
  { key: 'lp', short: 'LP', label: 'Light punch', tone: 'is-punch' },
  { key: 'hp', short: 'HP', label: 'Heavy punch', tone: 'is-punch' },
  { key: 'special', short: 'SP', label: 'Special', tone: 'is-special' },
  { key: 'lk', short: 'LK', label: 'Light kick', tone: 'is-kick' },
  { key: 'hk', short: 'HK', label: 'Heavy kick', tone: 'is-kick' },
  { key: 'dodge', short: 'D', label: 'Dodge', tone: 'is-dodge' },
  { key: 'start', short: '❚❚', label: 'Pause', tone: 'is-start' },
]

let match: MatchState = createMatch(roster)
let callouts: Callout[] = []
let sparks: Spark[] = []
// The finishing blow's slow-down and flash (t-019).
let slowdown: KoSlowdown = null
// The CPU opponent (t-020) plays P2 in CPU mode, seeded fresh for each match.
let cpu: CpuState = newCpu('normal', 1)
let resultCountdown = 0
// Frames into the VS screen, or into the win screen.
let screenFrame = 0
let loop: FixedLoop | null = null
let sound: ArcadeSound | null = null
let resizer: ResizeObserver | null = null
let dpadPointer: number | null = null

const p1: ButtonInput<FightButton> = createPlayerInput(SOLO_KEYS, 0)
const p2: ButtonInput<FightButton> = createPlayerInput(P2_KEYS, 1)

const locked = computed(
  () =>
    touchControls.value &&
    (phase.value === 'fight' || phase.value === 'paused'),
)

const knobStyle = computed(() => {
  const held = dpadHeld.value
  const x = (held.right ? 1 : 0) - (held.left ? 1 : 0)
  const y = (held.down ? 1 : 0) - (held.up ? 1 : 0)
  return { transform: `translate(${x * 28}%, ${y * 28}%)` }
})

function applyKeyMaps() {
  p1.setKeyMap(store.mode === 'versus' ? P1_KEYS : SOLO_KEYS)
}

/** The VS screen: the fighters slam in and trade their matchup lines, then the fight starts. */
function startVs() {
  screenFrame = 0
  phase.value = 'vs'
}

function startMatch() {
  match = createMatch(roster)
  callouts = advanceCallouts([], match.events)
  sparks = []
  slowdown = null
  cpu = newCpu(store.cpuLevel, Math.floor(Math.random() * 0xffffffff))
  resultCountdown = RESULT_DELAY
  phase.value = 'fight'
  sound?.play('start')
}

function playSounds(events: SimEvent[]) {
  if (!sound) return
  for (const e of events) {
    switch (e.type) {
      case 'hit':
        sound.play(e.damage >= 70 ? 'boom' : 'pop')
        break
      case 'block':
        sound.play('blip')
        break
      case 'throw':
        sound.play('boom')
        break
      case 'read':
        sound.play('pickup')
        break
      case 'super':
        sound.play('extra')
        break
      case 'parry':
        sound.play('level')
        break
      case 'fight':
        sound.play('start')
        break
      case 'ko':
        sound.play('die')
        break
      case 'timeOver':
        sound.play('warn')
        break
      default:
        break
    }
  }
}

function tick() {
  const one = p1.poll()
  const two = p2.poll()
  const start = one.pressed.start || two.pressed.start
  if (phase.value === 'title' || phase.value === 'result') {
    screenFrame += 1
    if (start || one.pressed.lp) startVs()
    return
  }
  if (phase.value === 'vs') {
    screenFrame += 1
    const lines = introFor(roster[0].slug, roster[1].slug).length
    const skip = (start || one.pressed.lp) && screenFrame > VS_SLAM_FRAMES
    if (skip || screenFrame >= vsDuration(lines)) startMatch()
    return
  }
  if (phase.value === 'paused') {
    if (start) phase.value = 'fight'
    return
  }
  if (start) {
    phase.value = 'paused'
    return
  }
  // After a KO the match plays slowed: the sim steps only every few screen frames.
  const stepping = slowdownSteps(slowdown)
  slowdown = advanceSlowdown(slowdown)
  if (!stepping) return
  const first = toSimInput(one.held)
  let second = neutralInput()
  if (store.mode === 'versus') second = toSimInput(two.held)
  else if (store.mode === 'cpu') {
    const turn = cpuInput(cpu, match, 1, roster)
    cpu = turn.cpu
    second = turn.input
  }
  if (!store.easySpecials) {
    first.special = false
    second.special = false
  }
  match = step(match, [first, second], roster)
  callouts = advanceCallouts(callouts, match.events)
  sparks = advanceSparks(sparks, match, roster)
  playSounds(match.events)
  slowdown = slowdown ?? koSlowdownFor(match.events)
  if (match.phase === 'over') {
    resultCountdown -= 1
    if (resultCountdown <= 0) {
      screenFrame = 0
      phase.value = 'result'
    }
  }
}

function render() {
  const g = canvasRef.value?.getContext('2d')
  if (!g) return
  const sides = [sprites[roster[0].slug], sprites[roster[1].slug]] as const
  if (phase.value === 'vs') {
    g.imageSmoothingEnabled = false
    drawVsScreen(g, roster, [...sides], screenFrame, store.reducedMotion)
    return
  }
  drawMatch(g, match, roster, callouts, {
    showBoxes: store.showBoxes,
    reducedMotion: store.reducedMotion,
    sprites,
    sparks,
  })
  const flash = koFlash(slowdown, store.reducedMotion)
  if (flash > 0) {
    g.fillStyle = `rgba(255, 255, 255, ${(0.7 * flash).toFixed(2)})`
    g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  }
  if (phase.value === 'title') {
    drawCard(g, [
      { text: 'ZUZU SHOWDOWN', scale: 3, color: '#fdba74' },
      {
        text: `${roster[0].name} VS ${roster[1].name}`.toUpperCase(),
        color: '#fde68a',
      },
      {
        text:
          store.mode === 'versus'
            ? '2 PLAYERS'
            : store.mode === 'cpu'
              ? `P1 VS CPU (${store.cpuLevel.toUpperCase()})`
              : 'P1 VS TRAINING DUMMY',
      },
      { text: 'PRESS START OR LP', scale: 2, color: '#fde047' },
    ])
  } else if (phase.value === 'paused') {
    drawCard(g, [
      { text: 'PAUSED', scale: 3 },
      { text: 'PRESS START', color: '#fde047' },
    ])
  } else if (phase.value === 'result') {
    drawWinScreen(
      g,
      match,
      roster,
      [...sides],
      screenFrame,
      store.reducedMotion,
    )
  }
}

function press(button: FightButton, down: boolean) {
  if (down) sound?.unlock()
  p1.setTouch(button, down)
}

function capture(target: HTMLElement | null, pointerId: number) {
  try {
    target?.setPointerCapture?.(pointerId)
  } catch {
    return
  }
}

function holdButton(event: PointerEvent, button: FightButton) {
  capture(event.currentTarget as HTMLElement | null, event.pointerId)
  press(button, true)
}

const DPAD_DEAD_ZONE = 0.22

function onDpad(event: PointerEvent) {
  const pad = dpadRef.value
  if (!pad) return
  if (event.type === 'pointerdown') {
    dpadPointer = event.pointerId
    capture(pad, event.pointerId)
  } else if (event.pointerId !== dpadPointer) {
    return
  }
  const rect = pad.getBoundingClientRect()
  const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
  const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
  const next = { up: false, down: false, left: false, right: false }
  if (Math.hypot(dx, dy) > DPAD_DEAD_ZONE) {
    const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
    next.right = sector >= -1 && sector <= 1
    next.left = sector >= 3 || sector <= -3
    next.down = sector >= 1 && sector <= 3
    next.up = sector >= -3 && sector <= -1
  }
  setDpad(next)
}

function releaseDpad() {
  dpadPointer = null
  setDpad({ up: false, down: false, left: false, right: false })
}

function setDpad(next: Record<Direction, boolean>) {
  for (const button of ['up', 'down', 'left', 'right'] as const) {
    if (next[button] !== dpadHeld.value[button]) press(button, next[button])
  }
  dpadHeld.value = next
}

function onContextMenu(event: Event) {
  if (touchControls.value) event.preventDefault()
}

let pageLocked = false

/** No page scroll or zoom while a touch game runs (see utils/arcade/pageLock). */
function setPageLock(on: boolean) {
  if (on === pageLocked) return
  pageLocked = on
  setGamePageLock(on)
}

function fitCanvas() {
  const available = screenRef.value?.clientWidth ?? VIEW_WIDTH
  const scale = Math.floor(available / VIEW_WIDTH)
  canvasWidth.value = scale >= 2 ? `${VIEW_WIDTH * scale}px` : '100%'
}

function onBlur() {
  if (phase.value === 'fight') phase.value = 'paused'
}

watch(locked, (on) => {
  setPageLock(on)
  if (!on) releaseDpad()
})

watch(() => store.mode, applyKeyMaps)
watch(
  () => [...store.fighters],
  () => {
    roster = currentRoster()
    match = createMatch(roster)
    callouts = []
    sparks = []
    slowdown = null
    phase.value = 'title'
  },
)
watch(
  () => store.muted,
  (muted) => sound?.setMuted(muted),
)

onMounted(() => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const reduced =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  touchControls.value = coarse
  store.loadPreferences({ reducedMotion: reduced, coarsePointer: coarse })
  applyKeyMaps()
  sound = createArcadeSound(store.muted)
  p1.attach(window)
  p2.attach(window)
  window.addEventListener('blur', onBlur)
  fitCanvas()
  if (screenRef.value && typeof ResizeObserver !== 'undefined') {
    resizer = new ResizeObserver(fitCanvas)
    resizer.observe(screenRef.value)
  }
  loop = startFixedLoop(tick, render)
  void loadSprites()
})

onBeforeUnmount(() => {
  loop?.stop()
  resizer?.disconnect()
  p1.detach()
  p2.detach()
  window.removeEventListener('blur', onBlur)
  sound?.dispose()
  setPageLock(false)
})
</script>

<style scoped>
.showdown-stage {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.showdown-stage--locked {
  position: fixed;
  inset: 0;
  z-index: 100;
  justify-content: center;
  padding: 0.5rem;
  background: #0b0507;
  touch-action: none;
  overscroll-behavior: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.showdown-screen {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
}

.showdown-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  image-rendering: pixelated;
  border-radius: 0.75rem;
  background: #000;
  outline: none;
}

.showdown-crt {
  position: absolute;
  top: 0;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  pointer-events: none;
  border-radius: 0.75rem;
  background: repeating-linear-gradient(
    to bottom,
    rgb(0 0 0 / 0.18) 0,
    rgb(0 0 0 / 0.18) 1px,
    transparent 1px,
    transparent 3px
  );
}

.showdown-touch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.25rem;
}

.showdown-dpad {
  position: relative;
  width: 8.5rem;
  height: 8.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.08);
  border: 2px solid rgb(255 255 255 / 0.2);
  touch-action: none;
}

.showdown-dpad-knob {
  position: absolute;
  inset: 30%;
  border-radius: 9999px;
  background: rgb(253 186 116 / 0.85);
  transition: transform 60ms linear;
}

.showdown-buttons {
  display: grid;
  grid-template-columns: repeat(3, 3.4rem);
  gap: 0.5rem;
}

.showdown-button {
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 9999px;
  font-weight: 800;
  font-size: 0.85rem;
  color: #fff;
  touch-action: none;
  border: 2px solid rgb(255 255 255 / 0.35);
}

.showdown-button.is-punch {
  background: #c2410c;
}

.showdown-button.is-kick {
  background: #0f766e;
}

.showdown-button.is-special {
  background: #7e22ce;
}

.showdown-button.is-dodge {
  background: #334155;
}

.showdown-button.is-start {
  background: #1f2937;
}
</style>
