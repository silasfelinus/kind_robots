<template>
  <!-- While locked for touch play the cabinet moves to <body>, so it can sit
       above the site header and shell (their stacking contexts would trap it). -->
  <Teleport to="body" :disabled="!locked">
    <div
      ref="cabinetRef"
      class="arcade-cabinet"
      :class="{
        'arcade-cabinet--locked': locked,
        'arcade-cabinet--fullscreen': fullscreen,
      }"
      :style="{ '--arcade-accent': meta?.accent ?? '#f472b6' }"
      @contextmenu="onContextMenu"
    >
      <div
        v-if="(locked || fullscreen) && meta?.titleArt"
        class="cabinet-splash"
        :style="{ backgroundImage: `url(${meta.titleArt})` }"
        aria-hidden="true"
      />
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

      <div ref="wrapRef" class="cabinet-screen-wrap">
        <div class="cabinet-bezel" :style="{ maxWidth: screenMaxWidth }">
          <div
            ref="screenRef"
            class="cabinet-screen"
            :style="{
              aspectRatio: `${meta?.width ?? 4} / ${meta?.height ?? 3}`,
            }"
          >
            <canvas
              v-if="isWebGLCabinet"
              ref="stageRef"
              class="cabinet-stage"
              :style="{
                imageRendering: renderStyle === 'pixel' ? 'pixelated' : 'auto',
              }"
              aria-hidden="true"
            />
            <canvas
              ref="canvasRef"
              class="cabinet-canvas"
              :style="canvasStyle"
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

      <div
        v-if="locked"
        class="cabinet-overlay"
        :class="[
          `cabinet-overlay--seats-${players}`,
          { 'cabinet-overlay--duo': duo },
        ]"
        aria-label="Touch controls"
      >
        <ArcadePinballTouch
          v-if="pinballPad"
          ref="pinballPadRef"
          :hints="pinballHints"
          @press="(button, down) => press(button, down)"
          @plunger="(depth) => (pinballPull = depth)"
        />
        <button
          type="button"
          class="cabinet-pause-chip"
          aria-label="Pause"
          @click="togglePause"
        >
          <span aria-hidden="true">❚❚</span>
        </button>
        <div
          v-for="seat in pinballPad ? [] : seatList"
          :key="seat"
          class="cabinet-cluster"
          :class="`cabinet-cluster-${seat + 1}`"
        >
          <div
            :ref="(el) => setDpadRef(seat, el)"
            class="cabinet-dpad"
            role="group"
            :aria-label="
              duo ? `Player ${seat + 1} direction pad` : 'Direction pad'
            "
            @pointerdown.prevent="onDpad($event, seat)"
            @pointermove.prevent="onDpad($event, seat)"
            @pointerup.prevent="releaseDpad(seat)"
            @pointercancel="releaseDpad(seat)"
            @lostpointercapture="releaseDpad(seat)"
          >
            <span
              v-for="pad in dpad"
              :key="pad.button"
              class="cabinet-key"
              :class="[
                pad.class,
                { 'cabinet-key-held': dpadHeld[seat]?.[pad.button] },
              ]"
              aria-hidden="true"
            >
              {{ pad.glyph }}
            </span>
          </div>
          <div class="cabinet-buttons">
            <button
              type="button"
              class="cabinet-ball cabinet-ball-b"
              :aria-label="duo ? `Player ${seat + 1} B button` : 'B button'"
              @pointerdown.prevent="holdButton($event, 'b', seat)"
              @pointerup.prevent="press('b', false, seat)"
              @pointercancel="press('b', false, seat)"
              @lostpointercapture="press('b', false, seat)"
            >
              B
            </button>
            <button
              type="button"
              class="cabinet-ball cabinet-ball-a"
              :aria-label="duo ? `Player ${seat + 1} A button` : 'A button'"
              @pointerdown.prevent="holdButton($event, 'a', seat)"
              @pointerup.prevent="press('a', false, seat)"
              @pointercancel="press('a', false, seat)"
              @lostpointercapture="press('a', false, seat)"
            >
              A
            </button>
          </div>
          <span v-if="duo" class="cabinet-seat-tag" aria-hidden="true">
            {{ seat + 1 }}P
          </span>
        </div>
      </div>

      <div v-else class="cabinet-panel">
        <p v-if="!touchControls && duo" class="cabinet-hint">
          1P: WASD · Space or F = A · G or X = B &nbsp;·&nbsp; 2P: arrows · / =
          A · . or right Shift = B &nbsp;·&nbsp;
          <template v-if="players > 2">
            {{ players === 3 ? '3P' : '3P and 4P' }}: a gamepad each
            &nbsp;·&nbsp;
          </template>
          Enter = Start · P pauses · a gamepad each works too
        </p>
        <p v-else-if="!touchControls" class="cabinet-hint">
          Arrows or WASD move · Space or Z = A · X or Shift = B · Enter = Start
          · P pauses · gamepads work too
        </p>
        <div class="cabinet-switches">
          <button
            type="button"
            class="cabinet-switch cabinet-start"
            @pointerdown.prevent="holdButton($event, 'start')"
            @pointerup.prevent="press('start', false)"
            @pointercancel="press('start', false)"
            @lostpointercapture="press('start', false)"
          >
            {{ phase === 'paused' ? 'Resume' : 'Start' }}
          </button>
          <button
            v-if="maxPlayers > 1"
            type="button"
            class="cabinet-switch"
            :disabled="!choosingPlayers"
            :title="
              choosingPlayers
                ? 'Same-device co-op'
                : 'Pick players on the title screen'
            "
            @click="onPlayersClick"
          >
            {{ players === 1 ? '1 player' : `${players} players` }}
          </button>
          <button
            v-if="!touchControls"
            type="button"
            class="cabinet-switch"
            :aria-pressed="phase === 'paused'"
            @click="togglePause"
          >
            {{ phase === 'paused' ? 'Resume' : 'Pause' }}
          </button>
          <button
            v-if="hasGuide"
            type="button"
            class="cabinet-switch"
            :aria-pressed="guideOpen"
            :disabled="!guideOpen && !canOpenGuide"
            title="How this table plays"
            @click="toggleGuide"
          >
            {{ guideOpen ? 'Close guide' : 'Table guide' }}
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
          <button
            type="button"
            class="cabinet-switch"
            :title="`Render style: ${RENDER_STYLE_NAMES[renderStyle]} (click for ${RENDER_STYLE_NAMES[otherStyle]})`"
            @click="toggleRenderStyle"
          >
            {{ RENDER_STYLE_NAMES[renderStyle] }}
          </button>
          <button
            type="button"
            class="cabinet-switch"
            :aria-pressed="fullscreen"
            @click="toggleFullscreen"
          >
            {{ fullscreen ? 'Exit fullscreen' : 'Fullscreen' }}
          </button>
          <span class="cabinet-coin">Free play</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// /components/arcade/arcade-cabinet.vue
//
// One Kind Robots Arcade cabinet (conductor kr-arcade): marquee, CRT screen
// in a painted bezel, control panel. Runs the attract loop (title, how to
// play, high scores, demo), the game, game over and three-initial entry.
// The flow itself is the pure reducer in utils/arcade/machine.ts.

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArcadeStore } from '@/stores/arcadeStore'
import ArcadePinballTouch from './arcade-pinball-touch.vue'
import { useUserStore } from '@/stores/userStore'
import type { CSSProperties } from 'vue'
import {
  fitDisplay,
  MAX_DPR,
  RENDER_STYLE_NAMES,
  type DisplayFit,
  type RenderStyle,
} from '~/utils/arcade/display'
import { findArcadeGame, loadArcadeGame } from '~/utils/arcade/games'
import {
  ArcadeInput,
  assignPads,
  keepPads,
  KEY_MAP,
  P1_KEYS,
  P2_KEYS,
} from '~/utils/arcade/input'
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
import { setGamePageLock } from '~/utils/arcade/pageLock'
import { drawText, lineStep, measureText } from '~/utils/arcade/font'
import { mulberry32 } from '~/utils/arcade/curve'
import { INITIALS_ALPHABET, isAllowedInitials } from '~/utils/arcade/initials'
import { initialsFromUsername } from '~/utils/arcade/leaderboard'
import { masteryLine, masteryProgress } from '~/utils/arcade/mastery'
import {
  isWebGLInstance,
  type ArcadeButton,
  type ArcadeGameModule,
  type ArcadeGuidePage,
  type ArcadeMasteryGoal,
  type ArcadePlayableInstance,
  type InputFrame,
} from '~/utils/arcade/types'

const props = defineProps<{ slug: string }>()
const emit = defineEmits<{ (e: 'scored', score: number): void }>()

const store = useArcadeStore()
const userStore = useUserStore()
const meta = computed(() => findArcadeGame(props.slug))
/** A WebGL game draws on a stage canvas under the 2D UI canvas. */
const isWebGLCabinet = computed(() => meta.value?.renderMode === 'webgl')

/** The most players a cabinet seats on one device. */
const MAX_SEATS = 4

const cabinetRef = ref<HTMLDivElement | null>(null)
const fullscreen = ref(false)
const screenRef = ref<HTMLDivElement | null>(null)
const wrapRef = ref<HTMLDivElement | null>(null)
/** Bezel width (px) that fits the space actually left for the screen while locked. */
const fittedWidth = ref(0)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stageRef = ref<HTMLCanvasElement | null>(null)
const phase = ref<ArcadePhase>('title')
const muted = computed(() => store.muted)
const crt = computed(() => store.crt)
const renderStyle = computed(() => store.styleFor(props.slug))
const otherStyle = computed<RenderStyle>(() =>
  renderStyle.value === 'hd' ? 'pixel' : 'hd',
)
/** The canvas's current fit (display.ts): backing size, scale, CSS width, filtering. */
const fit = ref<DisplayFit>({
  canvasWidth: 1,
  canvasHeight: 1,
  scale: 1,
  cssWidth: 0,
  smoothing: true,
  rendering: 'auto',
})
/** Pixel style shows the canvas at a whole multiple, centred; HD fills the screen. */
const canvasStyle = computed<CSSProperties>(() => {
  const info = meta.value
  const shown = fit.value
  const base = { imageRendering: shown.rendering }
  if (!info || !shown.cssWidth || renderStyle.value === 'hd') return base
  return {
    ...base,
    position: 'absolute',
    inset: '0',
    margin: 'auto',
    width: `${shown.cssWidth}px`,
    height: `${(shown.cssWidth * info.height) / info.width}px`,
  }
})
const touchControls = ref(false)
/** Directions held on each seat's touch d-pad. */
const dpadHeld = ref<Array<Record<DpadDirection, boolean>>>(
  Array.from({ length: MAX_SEATS }, () => noDirections()),
)
/** Players seated: the title screen's switch, for games that seat more than one. */
const players = ref(1)
const maxPlayers = computed(() =>
  Math.min(MAX_SEATS, meta.value?.maxPlayers ?? 1),
)
const duo = computed(() => players.value > 1)
const seatList = computed(() =>
  Array.from({ length: players.value }, (_, seat) => seat),
)
const choosingPlayers = computed(() => ATTRACT_PHASES.includes(phase.value))
/** Gamepads connected right now. */
const padCount = ref(0)
/**
 * Seats somebody can actually play from: every seat on a touch screen (each
 * gets controls), otherwise the two keyboard seats plus one per gamepad.
 */
const seatLimit = computed(() =>
  touchControls.value
    ? maxPlayers.value
    : Math.min(maxPlayers.value, 2 + padCount.value),
)
const loadError = ref('')
const marqueeArt = ref('/images/arcade/cabinet-marquee.webp')

let machine = initialArcadeState()
let gameModule: ArcadeGameModule | null = null
let game: ArcadePlayableInstance | null = null
let demoGame: ArcadePlayableInstance | null = null
let sound: ArcadeSound | null = null
let loop: FixedLoop | null = null
let resizeObserver: ResizeObserver | null = null
let wrapObserver: ResizeObserver | null = null
const input = new ArcadeInput()
/**
 * Every seat's controls, read only while seated: player 2 has the arrows,
 * players 3 and 4 a gamepad (or a touch cluster) each.
 */
const inputs = [
  input,
  new ArcadeInput(P2_KEYS),
  new ArcadeInput({}),
  new ArcadeInput({}),
]
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

type DpadDirection = 'up' | 'down' | 'left' | 'right'

function noDirections(): Record<DpadDirection, boolean> {
  return { up: false, down: false, left: false, right: false }
}

function seatInput(seat: number): ArcadeInput {
  return inputs[seat] ?? input
}

const dpad: Array<{
  button: DpadDirection
  glyph: string
  label: string
  class: string
}> = [
  { button: 'up', glyph: '▲', label: 'Up', class: 'cabinet-key-up' },
  { button: 'left', glyph: '◀', label: 'Left', class: 'cabinet-key-left' },
  { button: 'right', glyph: '▶', label: 'Right', class: 'cabinet-key-right' },
  { button: 'down', glyph: '▼', label: 'Down', class: 'cabinet-key-down' },
]

// While a touch game is in progress the cabinet pins itself to the viewport
// and swallows every gesture, so mashing the controls can't scroll, zoom or
// resize the page. Pausing unlocks it again (the way back out).
const LOCKED_PHASES: ArcadePhase[] = ['playing', 'gameover', 'initials']
const locked = computed(
  () => touchControls.value && LOCKED_PHASES.includes(phase.value),
)

// A game with its own touch layout (Kind Pinball, t-010) takes over the
// whole screen while it plays; initials and the rest keep the d-pad.
const pinballPad = computed(
  () =>
    locked.value &&
    phase.value === 'playing' &&
    meta.value?.touchLayout === 'pinball',
)
const pinballPadRef = ref<{ release(): void } | null>(null)
/** The plunger's pull from a finger on the lane (0..1), or null. */
const pinballPull = ref<number | null>(null)
/** The touch hints show until the first ball of the visit is lost. */
const pinballHints = ref(true)
let hintLives: number | null = null

// On the page, small-viewport units (svh) don't change when a phone's URL bar
// slides in and out, so the screen keeps one size. While locked, the screen is
// fitted to the space measured around it instead (fitScreen), so no resize,
// rotation or split view can push part of it off screen.
const screenMaxWidth = computed(() => {
  if ((locked.value || fullscreen.value) && fittedWidth.value > 0)
    return `${fittedWidth.value}px`
  const ratio = (meta.value?.width ?? 4) / (meta.value?.height ?? 3)
  return `min(100%, calc(62svh * ${ratio.toFixed(4)}))`
})

/** Size the bezel to the largest screen that fits the measured play area. */
function fitScreen() {
  const wrap = wrapRef.value
  if ((!locked.value && !fullscreen.value) || !wrap) {
    fittedWidth.value = 0
    return
  }
  const style = getComputedStyle(wrap)
  const width =
    wrap.clientWidth -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight)
  const height =
    wrap.clientHeight -
    parseFloat(style.paddingTop) -
    parseFloat(style.paddingBottom)
  if (width <= 0 || height <= 0) return
  // The locked bezel has no padding: the screen gets the whole wrap.
  const ratio = (meta.value?.width ?? 4) / (meta.value?.height ?? 3)
  fittedWidth.value = Math.max(0, Math.floor(Math.min(width, height * ratio)))
}

function syncFullscreen() {
  fullscreen.value = document.fullscreenElement === cabinetRef.value
  void nextTick(fitScreen)
}

async function toggleFullscreen() {
  const cabinet = cabinetRef.value
  if (!cabinet) return
  try {
    if (document.fullscreenElement === cabinet) {
      await document.exitFullscreen()
    } else if (!document.fullscreenElement) {
      await cabinet.requestFullscreen()
    }
  } catch {
    fullscreen.value = document.fullscreenElement === cabinet
  }
}

const board = computed(() => store.board(props.slug, 'all'))
const hiScore = () => board.value[0]?.score ?? 0

function unlockArcadeAudio() {
  sound?.unlock()
  if (game && 'unlockAudio' in game && typeof game.unlockAudio === 'function') {
    game.unlockAudio()
  }
}

function press(button: ArcadeButton, down: boolean, seat = 0) {
  if (down) unlockArcadeAudio()
  seatInput(seat).setTouch(button, down)
}

/** Hold a button until this finger lifts, even if it drifts off the button. */
function holdButton(event: PointerEvent, button: ArcadeButton, seat = 0) {
  capture(event.currentTarget as HTMLElement | null, event.pointerId)
  press(button, true, seat)
}

/** Best-effort pointer capture: it throws if the browser already dropped the pointer. */
function capture(target: HTMLElement | null, pointerId: number) {
  try {
    target?.setPointerCapture?.(pointerId)
  } catch {
    // The press still counts; it just isn't captured.
  }
}

/** Each seat's d-pad element, and the finger currently on it. */
const dpadEls: Array<HTMLElement | null> = Array(MAX_SEATS).fill(null)
const dpadPointers: Array<number | null> = Array(MAX_SEATS).fill(null)

function setDpadRef(seat: number, el: unknown) {
  dpadEls[seat] = el instanceof HTMLElement ? el : null
}

const DPAD_DEAD_ZONE = 0.22

/** Map a finger on the d-pad to directions (8-way, with a small dead zone). */
function onDpad(event: PointerEvent, seat = 0) {
  const pad = dpadEls[seat]
  if (!pad) return
  if (event.type === 'pointerdown') {
    dpadPointers[seat] = event.pointerId
    capture(pad, event.pointerId)
  } else if (event.pointerId !== dpadPointers[seat]) {
    return
  }
  const rect = pad.getBoundingClientRect()
  const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
  const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
  const next = { up: false, down: false, left: false, right: false }
  if (Math.hypot(dx, dy) > DPAD_DEAD_ZONE) {
    const angle = Math.atan2(dy, dx)
    // Eight 45-degree sectors; diagonals hold two directions.
    const sector = Math.round(angle / (Math.PI / 4))
    next.right = sector >= -1 && sector <= 1
    next.left = sector >= 3 || sector <= -3
    next.down = sector >= 1 && sector <= 3
    next.up = sector >= -3 && sector <= -1
  }
  setDpad(next, seat)
}

function releaseDpad(seat = 0) {
  dpadPointers[seat] = null
  setDpad(noDirections(), seat)
}

function setDpad(next: Record<DpadDirection, boolean>, seat = 0) {
  const held = dpadHeld.value[seat] ?? noDirections()
  for (const button of ['up', 'down', 'left', 'right'] as const) {
    if (next[button] !== held[button]) press(button, next[button], seat)
  }
  dpadHeld.value[seat] = next
}

/** Let go of every touch control on every seat. */
function releaseTouch() {
  pinballPadRef.value?.release()
  pinballPull.value = null
  for (let seat = 0; seat < MAX_SEATS; seat++) {
    releaseDpad(seat)
    for (const button of ['a', 'b', 'start'] as const)
      seatInput(seat).setTouch(button, false)
  }
}

function togglePlayers() {
  if (!choosingPlayers.value) return
  players.value = players.value >= seatLimit.value ? 1 : players.value + 1
  store.setPlayers(props.slug, players.value)
  unlockArcadeAudio()
  sound?.play('blip')
}

/** A click leaves the switch unfocused, so Space and Enter go back to the game. */
function onPlayersClick(event: MouseEvent) {
  ;(event.currentTarget as HTMLElement | null)?.blur()
  togglePlayers()
}

/** Each seat's gamepad slot (see assignPads / keepPads). */
let padSlots: Array<number | null> = [null]

/**
 * Seat the controls: one player gets every key and pad; with more, players
 * 1 and 2 split the keyboard (WASD and the arrows), and the gamepads go
 * round. On the attract screens the seats are dealt afresh (assignPads), and
 * the remembered player count is restored as far as the controls allow;
 * during a game each pad stays with its player (keepPads).
 */
function applySeats() {
  if (typeof window === 'undefined') return
  const pads =
    typeof navigator !== 'undefined' && navigator.getGamepads
      ? Array.from(navigator.getGamepads())
          .filter((pad): pad is Gamepad => Boolean(pad))
          .map((pad) => pad.index)
      : []
  padCount.value = pads.length
  if (choosingPlayers.value) {
    const want = store.playersFor(props.slug, seatLimit.value)
    if (want !== players.value) {
      // The players watcher seats them (and calls back here).
      players.value = want
      return
    }
  }
  padSlots = choosingPlayers.value
    ? assignPads(pads, players.value)
    : keepPads(padSlots, pads, players.value)
  const slots = padSlots
  input.setPadIndex(slots[0] ?? null)
  input.setKeyMap(duo.value ? P1_KEYS : KEY_MAP)
  inputs.forEach((seatIn, seat) => {
    if (seat === 0) return
    if (seat < players.value) {
      seatIn.setPadIndex(slots[seat] ?? -1)
      seatIn.attach(window)
    } else {
      seatIn.detach()
      seatIn.clear()
    }
  })
}

function onContextMenu(event: Event) {
  // A long press on a touch control should never open the browser menu.
  if (touchControls.value) event.preventDefault()
}

/** Lock page scrolling while the cabinet is pinned (and undo it after). */
let pageLocked = false

/** No page scroll or zoom while a touch game runs (see utils/arcade/pageLock). */
function setPageLock(on: boolean) {
  if (on === pageLocked) return
  pageLocked = on
  setGamePageLock(on)
}

// --- flow -----------------------------------------------------------------

function dispatch(event: ArcadeEvent) {
  const before = machine.phase
  machine = arcadeReducer(machine, event, qualifies)
  if (machine.phase !== before) enterPhase(machine.phase)
}

/** Give a new WebGL game the stage canvas and its current size. */
function adopt<T extends ArcadePlayableInstance>(instance: T): T {
  const stage = stageRef.value
  if (isWebGLInstance(instance) && stage) {
    instance.mount(stage)
    sizeStage(instance)
  }
  return instance
}

/** Free a WebGL game's GPU, physics and audio resources (2D games hold none). */
function retire(instance: ArcadePlayableInstance | null) {
  // Goals earned in a game left unfinished still count.
  if (instance?.mastered?.length)
    store.recordMastery(props.slug, instance.mastered)
  if (isWebGLInstance(instance)) instance.dispose()
}

function sizeStage(instance: ArcadePlayableInstance | null) {
  const screen = screenRef.value
  if (!isWebGLInstance(instance) || !screen) return
  const rect = screen.getBoundingClientRect()
  // Pixel draws the table at 1x and lets the browser enlarge it; HD uses the device's ratio.
  const dpr = window.devicePixelRatio || 1
  instance.resize(
    rect.width,
    rect.height,
    renderStyle.value === 'pixel' ? 1 : Math.min(dpr, MAX_DPR),
  )
}

function enterPhase(next: ArcadePhase) {
  phase.value = next
  for (const seatIn of inputs) {
    seatIn.clear()
    seatIn.typing = next === 'initials'
  }
  // Back on the attract screens, pads are dealt afresh for the next game.
  if (ATTRACT_PHASES.includes(next)) applySeats()
  if (next === 'demo' && gameModule) {
    retire(demoGame)
    demoGame = adopt(
      gameModule.create({
        rng: mulberry32(demoSeed++),
        sound: { play: () => {} },
        demo: true,
        hiScore: hiScore(),
      }),
    )
  } else if (next !== 'demo') {
    retire(demoGame)
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
  if (next === 'title' || next === 'scores') {
    retire(game)
    game = null
  }
}

function startGame() {
  if (!gameModule) return
  hintLives = null
  unlockArcadeAudio()
  sound?.play('start')
  // One WebGL game owns the stage at a time: free the demo and any old game.
  retire(demoGame)
  demoGame = null
  retire(game)
  game = adopt(
    gameModule.create({
      rng: Math.random,
      sound: sound ?? { play: () => {} },
      demo: false,
      hiScore: hiScore(),
      players: players.value,
      mastery: store.masteryFor(props.slug),
    }),
  )
  dispatch({ type: 'start' })
}

// --- the table guide (conductor kind-pinball/t-015) -------------------------

/** The guide's pages while it is open, and the one showing. */
const guide = ref<{ pages: ArcadeGuidePage[]; page: number } | null>(null)
const guideOpen = computed(() => guide.value !== null)
/** The cabinet's game has a guide (its module is loaded). */
const hasGuide = ref(false)
/** The guide opens from the attract loop and the pause screen. */
const canOpenGuide = computed(
  () =>
    hasGuide.value &&
    (ATTRACT_PHASES.includes(phase.value) || phase.value === 'paused'),
)

function openGuide() {
  if (!gameModule?.guide || !canOpenGuide.value) return
  const pages = gameModule.guide(new Set(store.masteryFor(props.slug)))
  if (pages.length) guide.value = { pages, page: 0 }
  sound?.play('blip')
}

function closeGuide() {
  guide.value = null
}

function toggleGuide() {
  unlockArcadeAudio()
  if (guide.value) closeGuide()
  else openGuide()
}

/** Page on; past the last page the guide closes. */
function turnGuide(by: number) {
  const open = guide.value
  if (!open) return
  const page = open.page + by
  if (page >= open.pages.length) closeGuide()
  else guide.value = { ...open, page: Math.max(0, page) }
  sound?.play('blip')
}

function stepGuide(frame: InputFrame) {
  if (frame.pressed.b || frame.pressed.start) closeGuide()
  else if (frame.pressed.right || frame.pressed.a) turnGuide(1)
  else if (frame.pressed.left) turnGuide(-1)
}

function togglePause() {
  unlockArcadeAudio()
  if (machine.phase === 'playing') dispatch({ type: 'pause' })
  else if (machine.phase === 'paused') dispatch({ type: 'resume' })
}

function readSavedInitials(): string[] {
  const saved = store.savedInitials
  if (isAllowedInitials(saved)) return saved.toUpperCase().split('')
  // A signed-in player who never saved initials starts from their username.
  const fromName = initialsFromUsername(userStore.user?.username)
  return fromName && isAllowedInitials(fromName)
    ? fromName.split('')
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

/** Either player's buttons, for the menus around the game. */
function eitherFrame(frames: InputFrame[]): InputFrame {
  const [first, ...rest] = frames
  const frame: InputFrame = {
    held: { ...first!.held },
    pressed: { ...first!.pressed },
  }
  for (const other of rest) {
    for (const key of Object.keys(frame.held) as ArcadeButton[]) {
      frame.held[key] ||= other.held[key]
      frame.pressed[key] ||= other.pressed[key]
    }
  }
  return frame
}

function tick() {
  ticks++
  const frames: InputFrame[] = inputs
    .slice(0, players.value)
    .map((seatIn) => seatIn.poll())
  const frame = frames.length > 1 ? eitherFrame(frames) : frames[0]!
  const current = machine.phase
  // The table guide holds the cabinet where it was (attract or paused).
  if (guide.value) {
    stepGuide(frame)
    return
  }
  if (ATTRACT_PHASES.includes(current)) {
    if (frame.pressed.start || frame.pressed.a) {
      startGame()
      return
    }
    // B picks how many play, without reaching for the mouse or the screen;
    // on a one-player cabinet with a guide, it opens the guide.
    if (frame.pressed.b && maxPlayers.value > 1) togglePlayers()
    else if (frame.pressed.b && hasGuide.value) openGuide()
    if (current === 'demo' && demoGame) {
      demoGame.update(frame)
      if (demoGame.over) dispatch({ type: 'demoOver' })
    }
    if (frame.pressed.right) dispatch({ type: 'skip' })
    dispatch({ type: 'tick', ms: TICK_MS })
    return
  }
  if (current === 'playing' && game) {
    if (pinballPad.value && pinballPull.value !== null)
      frames[0]!.plunger = pinballPull.value
    // The first ball gone: the touch hints have done their job.
    if (hintLives === null) hintLives = game.lives
    else if (game.lives < hintLives) pinballHints.value = false
    game.update(frames[0]!, frames)
    if (game.over) {
      if (game.mastered?.length) store.recordMastery(props.slug, game.mastered)
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
    else if (frame.pressed.b && hasGuide.value) openGuide()
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

/** On a co-op cabinet's attract screens: how many will play, and how to change it. */
function drawPlayersLine(g: CanvasRenderingContext2D, w: number, y: number) {
  if (maxPlayers.value <= 1) return
  const seated = players.value === 1 ? '1 PLAYER' : `${players.value} PLAYERS`
  drawText(
    g,
    touchControls.value
      ? `${seated}  (UP TO ${seatLimit.value})`
      : `${seated}  B TO CHANGE (UP TO ${seatLimit.value})`,
    w / 2,
    y,
    { align: 'center', color: '#a5f3fc', shadow: SHADOW },
  )
}

/**
 * A cabinet's mastery ladder under its how-to-play lines: earned goals with a
 * heart, open ones with what to do, open secrets as question marks.
 */
function drawMastery(
  g: CanvasRenderingContext2D,
  ladder: readonly ArcadeMasteryGoal[],
  w: number,
  h: number,
  top: number,
) {
  const earned = new Set(store.masteryFor(props.slug))
  const { earned: count, total } = masteryProgress(ladder, earned)
  const step = Math.min(16, Math.floor((h - top - 30) / ladder.length))
  if (step < 9) return
  drawText(g, `MASTERY ${count}/${total}`, w / 2, top, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    shadow: SHADOW,
  })
  ladder.forEach((goal, i) => {
    const have = earned.has(goal.id)
    const line = masteryLine(goal, earned)
    drawText(g, have ? `* ${line}` : line, w / 2, top + 26 + i * step, {
      align: 'center',
      color: have ? '#f9a8d4' : '#94a3b8',
      shadow: SHADOW,
    })
  })
}

/** The open guide page: its title, diagram, lines and how to turn the page. */
function drawGuide(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
) {
  const open = guide.value!
  const page = open.pages[open.page]!
  drawBackdrop(g, w, h, 0.1)
  g.fillStyle = 'rgba(11, 6, 32, 0.55)'
  g.fillRect(0, 0, w, h)
  drawText(g, page.title, w / 2, 16, {
    scale: fitTitle(page.title, w - 24, 3),
    align: 'center',
    color: '#ffffff',
    shadow: accent,
  })
  let y = 46
  if (page.diagram) {
    page.diagram.draw(g, 8, y, w - 16, page.diagram.height)
    y += page.diagram.height + 10
  }
  const scale = page.scale ?? 2
  const step = Math.max(
    scale * 9,
    Math.min(scale * 12 + 4, Math.floor((h - 40 - y) / page.lines.length)),
  )
  page.lines.forEach((line, i) => {
    drawText(g, line, w / 2, y + i * step, {
      scale,
      align: 'center',
      color: line.startsWith('* ') ? '#f9a8d4' : '#fde68a',
      shadow: SHADOW,
    })
  })
  drawText(
    g,
    `< ${open.page + 1}/${open.pages.length} >   B CLOSE`,
    w / 2,
    h - 18,
    { align: 'center', color: '#a5f3fc', shadow: SHADOW },
  )
}

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
    // Narrow screens (Kind Pinball is 288 wide) take the message on two lines.
    const message = 'BE THE FIRST ON THE BOARD!'
    const lines =
      measureText(message, 2) > w - 16
        ? ['BE THE FIRST', 'ON THE BOARD!']
        : [message]
    lines.forEach((line, i) => {
      drawText(g, line, w / 2, top + 30 + i * 22, {
        scale: 2,
        align: 'center',
        color: '#fde68a',
        shadow: SHADOW,
      })
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

/**
 * A 2D game draws on the UI canvas; a WebGL game draws on the stage below
 * it, so the UI canvas is cleared to let the stage show through.
 */
function drawGame(
  instance: ArcadePlayableInstance,
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  if (isWebGLInstance(instance)) {
    g.clearRect(0, 0, w, h)
    instance.render()
    if (instance.over) {
      drawText(g, 'GAME OVER', w / 2, h * 0.4, {
        scale: 4,
        align: 'center',
        color: '#ffffff',
        shadow: SHADOW,
      })
    }
  } else {
    instance.render(g)
  }
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
  g.imageSmoothingEnabled = fit.value.smoothing
  const current = machine.phase
  const accent = info.accent

  if (guide.value) {
    drawGuide(g, w, h, accent)
    return
  }

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
    drawPlayersLine(g, w, h * 0.68 + 27)
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
    // Short screens (Repair Rampage is 240 tall) squeeze the lines together.
    const step = lineStep(info.howTo.length, h, 80)
    info.howTo.forEach((line, i) => {
      drawText(g, line, w / 2, 80 + i * step, {
        scale: 2,
        align: 'center',
        color: i % 2 ? '#f9a8d4' : '#fde68a',
        shadow: SHADOW,
      })
    })
    if (info.mastery)
      drawMastery(g, info.mastery, w, h, 80 + info.howTo.length * step + 16)
    if (hasGuide.value)
      drawText(g, 'B  TABLE GUIDE', w / 2, h - 18, {
        align: 'center',
        color: '#a5f3fc',
        shadow: SHADOW,
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
    if (demoGame) drawGame(demoGame, g, w, h)
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
    drawPlayersLine(g, w, h * 0.36 + 56)
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
  if (game) drawGame(game, g, w, h)
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
    if (hasGuide.value)
      drawText(g, 'B  TABLE GUIDE', w / 2, h / 2 + 50, {
        scale: 2,
        align: 'center',
        color: '#a5f3fc',
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
  const info = meta.value
  const next = fitDisplay({
    width: info?.width ?? 4,
    height: info?.height ?? 3,
    available: rect.width,
    dpr: window.devicePixelRatio || 1,
    // A 3D cabinet's 2D layer sits over the full-size stage, so it always fills the screen.
    style: isWebGLCabinet.value ? 'hd' : renderStyle.value,
  })
  fit.value = next
  canvas.width = next.canvasWidth
  canvas.height = next.canvasHeight
  sizeStage(game)
  sizeStage(demoGame)
  render()
}

function onScreenPointer() {
  unlockArcadeAudio()
  canvasRef.value?.focus({ preventScroll: true })
  if (guide.value) turnGuide(1)
  else if (ATTRACT_PHASES.includes(machine.phase)) startGame()
  else if (machine.phase === 'paused') dispatch({ type: 'resume' })
  else if (machine.phase === 'gameover') dispatch({ type: 'skip' })
}

function onKey(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement) return
  unlockArcadeAudio()
  if (guide.value && (event.code === 'KeyP' || event.code === 'Escape')) {
    closeGuide()
    return
  }
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

function onOnline() {
  // Back online: send any scores that are waiting for the global board.
  void store.flushPending()
}

function onVisibility() {
  if (document.hidden && machine.phase === 'playing')
    dispatch({ type: 'pause' })
}

function toggleMute() {
  unlockArcadeAudio()
  store.setMuted(!store.muted)
  sound?.setMuted(store.muted)
}

function toggleRenderStyle() {
  store.setGameStyle(props.slug, otherStyle.value)
  resizeCanvas()
}

function toggleCrt() {
  store.setCrt(!store.crt)
}

async function boot() {
  retire(game)
  retire(demoGame)
  game = null
  demoGame = null
  gameModule = null
  hasGuide.value = false
  closeGuide()
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
    hasGuide.value = typeof gameModule.guide === 'function'
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
  applySeats()
  window.addEventListener('gamepadconnected', applySeats)
  window.addEventListener('gamepaddisconnected', applySeats)
  window.addEventListener('keydown', onKey)
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('fullscreenchange', syncFullscreen)
  resizeObserver = new ResizeObserver(resizeCanvas)
  if (screenRef.value) resizeObserver.observe(screenRef.value)
  wrapObserver = new ResizeObserver(fitScreen)
  if (wrapRef.value) wrapObserver.observe(wrapRef.value)
  void boot()
  loop = startFixedLoop(tick, render)
})

watch(
  () => props.slug,
  () => {
    void boot().then(applySeats)
  },
)

watch(players, () => {
  releaseTouch()
  applySeats()
})

watch(fullscreen, () => {
  void nextTick(fitScreen)
})

watch(locked, (on) => {
  setPageLock(on)
  // Locking swaps the settings panel for the overlay and back, so the button
  // under the finger is gone before it can see the finger lift: let go of all.
  releaseTouch()
  void nextTick(fitScreen)
})

onBeforeUnmount(() => {
  loop?.stop()
  for (const seatIn of inputs) seatIn.detach()
  window.removeEventListener('gamepadconnected', applySeats)
  window.removeEventListener('gamepaddisconnected', applySeats)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('online', onOnline)
  document.removeEventListener('visibilitychange', onVisibility)
  document.removeEventListener('fullscreenchange', syncFullscreen)
  if (document.fullscreenElement === cabinetRef.value)
    void document.exitFullscreen()
  resizeObserver?.disconnect()
  wrapObserver?.disconnect()
  sound?.dispose()
  retire(game)
  retire(demoGame)
  game = null
  demoGame = null
  setPageLock(false)
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

.arcade-cabinet--fullscreen {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: none;
  border: 0;
  border-radius: 0;
  margin: 0;
  background: radial-gradient(circle at 50% 40%, #1e1b4b, #05030f 75%);
}

.arcade-cabinet--fullscreen .cabinet-marquee,
.arcade-cabinet--fullscreen .cabinet-title-plate {
  display: none;
}

.arcade-cabinet--fullscreen .cabinet-screen-wrap {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 0.5rem;
  background: none;
}

.arcade-cabinet--fullscreen .cabinet-bezel {
  width: 100%;
  padding: 0;
}

.arcade-cabinet--fullscreen .cabinet-panel {
  flex: 0 0 auto;
}

/* Behind the screen in fullscreen and pinned play: the game's splash art,
   blurred and dimmed so the screen stays the brightest thing (t-020). The
   cabinet isolates its stacking, so the splash sits under everything in it. */
.arcade-cabinet--fullscreen,
.arcade-cabinet--locked {
  isolation: isolate;
  overflow: hidden;
}

.cabinet-splash {
  position: absolute;
  inset: -6%;
  z-index: -1;
  background-size: cover;
  background-position: center;
  filter: blur(26px) brightness(0.45) saturate(1.3);
  transform: scale(1.06);
  pointer-events: none;
}

.cabinet-splash::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(5, 3, 15, 0) 30%,
    rgba(5, 3, 15, 0.7) 85%
  );
}

@media (prefers-reduced-motion: no-preference) {
  .cabinet-splash {
    animation: cabinet-splash-drift 40s ease-in-out infinite alternate;
  }
}

@keyframes cabinet-splash-drift {
  from {
    transform: scale(1.06) translate(-1%, -1%);
  }
  to {
    transform: scale(1.12) translate(1%, 1%);
  }
}

/* Pinned play view on touch devices: the game screen fills the device and owns
   every touch, so nothing a thumb does can scroll, zoom or move the page. The
   controls float over it; the marquee, title and settings wait on the title
   screen (pause to get back to them). */
.arcade-cabinet--locked {
  position: fixed;
  inset: 0;
  z-index: 100;
  max-width: none;
  margin: 0;
  border-radius: 0;
  border-width: 0;
  box-shadow: none;
  background: radial-gradient(circle at 50% 40%, #1e1b4b, #05030f 75%);
  touch-action: none;
  overscroll-behavior: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.arcade-cabinet--locked .cabinet-marquee,
.arcade-cabinet--locked .cabinet-title-plate {
  display: none;
}

.arcade-cabinet--locked .cabinet-screen-wrap {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: none;
  padding: max(0.4rem, env(safe-area-inset-top))
    max(0.4rem, env(safe-area-inset-right))
    max(0.4rem, env(safe-area-inset-bottom))
    max(0.4rem, env(safe-area-inset-left));
}

.arcade-cabinet--locked .cabinet-bezel {
  width: 100%;
  padding: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
}

.arcade-cabinet--locked .cabinet-screen {
  border-radius: 0.5rem;
}

.cabinet-overlay {
  --key: clamp(2.9rem, 8.5vmin, 4.75rem);
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.cabinet-overlay > *,
.cabinet-cluster > * {
  position: absolute;
  pointer-events: auto;
}

/* Each seat's controls; the cluster itself lets touches through to the game. */
.cabinet-overlay > .cabinet-cluster {
  inset: 0;
  pointer-events: none;
}

.cabinet-overlay .cabinet-dpad {
  left: max(1rem, env(safe-area-inset-left));
  bottom: max(1rem, env(safe-area-inset-bottom));
  grid-template-columns: repeat(3, var(--key));
  grid-template-rows: repeat(3, var(--key));
}

.cabinet-overlay .cabinet-key {
  background: rgba(15, 10, 46, 0.42);
  border: 2px solid rgba(253, 230, 138, 0.5);
  color: rgba(253, 230, 138, 0.9);
  box-shadow: none;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.cabinet-overlay .cabinet-key-held {
  transform: none;
  background: rgba(253, 230, 138, 0.4);
  box-shadow: none;
}

.cabinet-overlay .cabinet-buttons {
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
}

.cabinet-overlay .cabinet-ball {
  width: calc(var(--key) * 1.3);
  height: calc(var(--key) * 1.3);
  border: 2px solid rgba(255, 255, 255, 0.45);
  box-shadow: none;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.cabinet-overlay .cabinet-ball-a {
  background: rgba(236, 72, 153, 0.55);
  margin-bottom: calc(var(--key) * 0.45);
}

.cabinet-overlay .cabinet-ball-b {
  background: rgba(20, 184, 166, 0.55);
}

.cabinet-overlay .cabinet-ball:active {
  transform: scale(0.94);
  box-shadow: none;
}

.cabinet-pause-chip {
  top: max(0.6rem, env(safe-area-inset-top));
  right: max(0.6rem, env(safe-area-inset-right));
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 9999px;
  background: rgba(15, 10, 46, 0.5);
  border: 2px solid rgba(253, 230, 138, 0.5);
  color: #fde68a;
  font-size: 0.8rem;
  letter-spacing: -0.1em;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* Upright, the screen sits at the top so the controls get the room below it,
   and the pause chip moves down between them, off the score. */
@media (orientation: portrait) {
  .arcade-cabinet--locked .cabinet-screen-wrap {
    align-items: start;
  }

  .cabinet-pause-chip {
    top: auto;
    right: auto;
    left: calc(50% - 1.3rem);
    bottom: calc(max(1rem, env(safe-area-inset-bottom)) + var(--key) * 2);
  }
}

/* Two or more seated: smaller clusters, each player's tinted its own colour.
   Sideways, player 1 takes the bottom left and player 2 the bottom right;
   upright, each player's row sits above the one before. */
.cabinet-overlay--duo {
  --key: clamp(2.4rem, 7vmin, 4rem);
  --ball: calc(var(--key) * 1.15);
  /* One player's rows of controls, and where the bottom row starts. */
  --row: calc(var(--key) * 3 + 1.4rem);
  --base: max(1rem, env(safe-area-inset-bottom));
}

.cabinet-overlay--duo .cabinet-buttons {
  gap: 0.5rem;
}

.cabinet-overlay--duo .cabinet-ball {
  width: var(--ball);
  height: var(--ball);
}

.cabinet-overlay--duo .cabinet-ball-a {
  margin-bottom: calc(var(--key) * 0.35);
}

.cabinet-cluster-2 .cabinet-key {
  border-color: rgba(244, 114, 182, 0.6);
  color: rgba(251, 207, 232, 0.95);
}

.cabinet-seat-tag {
  pointer-events: none;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fde68a;
  text-shadow: 0 1px 2px #000;
  left: max(1rem, env(safe-area-inset-left));
  bottom: calc(
    max(1rem, env(safe-area-inset-bottom)) + var(--key) * 3 + 0.2rem
  );
}

.cabinet-cluster-2 .cabinet-seat-tag {
  color: #fbcfe8;
}

@media (orientation: landscape) {
  .cabinet-cluster-1 .cabinet-buttons {
    right: auto;
    left: calc(max(1rem, env(safe-area-inset-left)) + var(--key) * 3 + 0.75rem);
  }

  .cabinet-cluster-2 .cabinet-dpad {
    left: auto;
    right: calc(
      max(1rem, env(safe-area-inset-right)) + var(--ball) * 2 + 1.25rem
    );
  }

  .cabinet-cluster-2 .cabinet-seat-tag {
    left: auto;
    right: calc(
      max(1rem, env(safe-area-inset-right)) + var(--ball) * 2 + 1.25rem
    );
  }
}

/* Three or four seated: smaller keys still. Sideways, player 3 sits above
   player 1 on the left and player 4 above player 2 on the right, leaving the
   top of the screen (the score) clear; upright, every player gets a row,
   player 1's at the bottom. */
.cabinet-overlay--seats-3,
.cabinet-overlay--seats-4 {
  --key: clamp(2.1rem, 6vmin, 3.4rem);
}

.cabinet-cluster-3 .cabinet-key {
  border-color: rgba(103, 232, 249, 0.6);
  color: rgba(207, 250, 254, 0.95);
}

.cabinet-cluster-4 .cabinet-key {
  border-color: rgba(163, 230, 53, 0.6);
  color: rgba(236, 252, 203, 0.95);
}

.cabinet-cluster-3 .cabinet-seat-tag {
  color: #a5f3fc;
}

.cabinet-cluster-4 .cabinet-seat-tag {
  color: #d9f99d;
}

@media (orientation: landscape) {
  .cabinet-cluster-3 .cabinet-buttons {
    right: auto;
    left: calc(max(1rem, env(safe-area-inset-left)) + var(--key) * 3 + 0.75rem);
  }

  .cabinet-cluster-4 .cabinet-dpad,
  .cabinet-cluster-4 .cabinet-seat-tag {
    left: auto;
    right: calc(
      max(1rem, env(safe-area-inset-right)) + var(--ball) * 2 + 1.25rem
    );
  }

  .cabinet-cluster-3 .cabinet-dpad,
  .cabinet-cluster-3 .cabinet-buttons,
  .cabinet-cluster-4 .cabinet-dpad,
  .cabinet-cluster-4 .cabinet-buttons {
    bottom: calc(var(--base) + var(--row));
  }

  .cabinet-cluster-3 .cabinet-seat-tag,
  .cabinet-cluster-4 .cabinet-seat-tag {
    bottom: calc(var(--base) + var(--row) + var(--key) * 3 + 0.2rem);
  }
}

@media (orientation: portrait) {
  .cabinet-cluster-2 .cabinet-dpad,
  .cabinet-cluster-2 .cabinet-buttons {
    bottom: calc(var(--base) + var(--row));
  }

  .cabinet-cluster-3 .cabinet-dpad,
  .cabinet-cluster-3 .cabinet-buttons {
    bottom: calc(var(--base) + var(--row) * 2);
  }

  .cabinet-cluster-4 .cabinet-dpad,
  .cabinet-cluster-4 .cabinet-buttons {
    bottom: calc(var(--base) + var(--row) * 3);
  }

  .cabinet-cluster-2 .cabinet-seat-tag {
    bottom: calc(var(--base) + var(--row) + var(--key) * 3 + 0.2rem);
  }

  .cabinet-cluster-3 .cabinet-seat-tag {
    bottom: calc(var(--base) + var(--row) * 2 + var(--key) * 3 + 0.2rem);
  }

  .cabinet-cluster-4 .cabinet-seat-tag {
    bottom: calc(var(--base) + var(--row) * 3 + var(--key) * 3 + 0.2rem);
  }

  .cabinet-overlay--duo .cabinet-pause-chip {
    left: auto;
    right: max(0.6rem, env(safe-area-inset-right));
    bottom: calc(var(--base) + var(--row) * 2);
  }

  .cabinet-overlay--seats-3 .cabinet-pause-chip {
    bottom: calc(var(--base) + var(--row) * 3);
  }

  .cabinet-overlay--seats-4 .cabinet-pause-chip {
    bottom: calc(var(--base) + var(--row) * 4);
  }
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
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  outline: none;
}

.cabinet-stage {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
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
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cabinet-dpad {
  touch-action: none;
  display: grid;
  grid-template-columns: repeat(3, 3.25rem);
  grid-template-rows: repeat(3, 3.25rem);
  gap: 0.25rem;
}

.cabinet-key {
  display: grid;
  place-items: center;
  pointer-events: none;
  border-radius: 0.75rem;
  background: #1e1b4b;
  color: #fde68a;
  font-size: 1.25rem;
  box-shadow: 0 4px 0 #0b0620;
  touch-action: none;
  user-select: none;
}

.cabinet-key-held {
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
