<template>
  <main class="kr-surface">
    <div class="kr-scroll kr-container max-w-5xl space-y-3 p-2 sm:p-4">
      <div
        ref="stageEl"
        class="lair-stage relative mx-auto w-full overflow-hidden rounded-2xl bg-black"
        :class="`lair-${nodeKind}`"
        data-testid="lair-stage"
      >
        <!-- Placeholder still with Ken Burns motion until real clips exist. -->
        <div :key="run.node" class="lair-still absolute inset-0">
          <p class="lair-still-label">{{ nodeLabel }}</p>
        </div>
        <video
          v-for="n in 2"
          :key="n"
          :ref="(el) => (videos[n - 1] = el as HTMLVideoElement | null)"
          class="absolute inset-0 h-full w-full object-cover transition-opacity"
          :class="
            activeVideo === n - 1 && videoReady ? 'opacity-100' : 'opacity-0'
          "
          playsinline
          muted
          preload="auto"
          aria-hidden="true"
          @loadeddata="onVideoReady(n - 1)"
          @error="onVideoError(n - 1)"
        />

        <!-- Title card -->
        <div v-if="phase === 'title'" class="lair-overlay">
          <p class="lair-title">Zuzu's Lair</p>
          <p class="text-sm opacity-80">{{ CHAPTER_1.title }}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="btn btn-warning"
              data-testid="lair-start"
              @click="begin"
            >
              Start
            </button>
          </div>
        </div>

        <!-- Input hint: the needed direction glows during the window -->
        <div
          v-if="phase === 'play' && windowOpen"
          class="lair-hint"
          :class="{ 'lair-hint-lit': hintOn }"
          data-testid="lair-hint"
          aria-live="polite"
        >
          <span aria-hidden="true">{{ hintGlyph }}</span>
          <span class="sr-only">Press {{ hintName }} now</span>
        </div>

        <!-- Game over -->
        <div
          v-if="phase === 'play' && run.phase === 'gameover'"
          class="lair-overlay"
        >
          <p class="lair-title">Game over</p>
          <button
            type="button"
            class="btn btn-warning"
            data-testid="lair-continue"
            @click="continueRun"
          >
            Continue (keeps half your score)
          </button>
        </div>

        <!-- Finish: score, initials, board -->
        <div v-if="phase === 'end'" class="lair-overlay lair-end">
          <p class="lair-title">Chapter clear</p>
          <p class="text-lg font-bold" data-testid="lair-score">
            {{ run.score.toLocaleString() }} pts
          </p>
          <p v-if="run.bonus" class="text-xs opacity-80">
            No-death bonus {{ run.bonus.noDeath }} · time bonus
            {{ run.bonus.time }}
          </p>
          <form
            v-if="!submitted"
            class="flex items-center gap-2"
            @submit.prevent="submit"
          >
            <input
              v-model="initials"
              class="input input-sm w-20 text-center font-mono uppercase"
              maxlength="3"
              aria-label="Three initials"
              autocomplete="off"
            />
            <button
              type="submit"
              class="btn btn-sm btn-warning"
              :disabled="!initialsOk"
            >
              Save score
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="submitted = true"
            >
              Skip
            </button>
          </form>
          <ol class="lair-board" aria-label="Zuzu's Lair high scores">
            <li v-for="row in boardRows" :key="row.id">
              <span class="font-mono">{{ row.initials }}</span>
              <span>{{ row.score.toLocaleString() }}</span>
            </li>
          </ol>
          <button type="button" class="btn btn-sm btn-outline" @click="toTitle">
            Play again
          </button>
        </div>

        <!-- HUD -->
        <div v-if="phase === 'play'" class="lair-hud" aria-label="Status">
          <span>{{
            run.difficulty === 'assist' ? '♥ ∞' : '♥ ' + run.lives
          }}</span>
          <span>{{ run.score.toLocaleString() }}</span>
        </div>
      </div>

      <!-- On-screen d-pad and sword -->
      <div
        v-if="showButtons"
        class="lair-pad mx-auto"
        data-testid="lair-buttons"
        aria-label="On-screen controls"
      >
        <button
          v-for="b in PAD"
          :key="b.button"
          type="button"
          class="lair-pad-btn"
          :style="{ gridArea: b.area }"
          :aria-label="b.name"
          @pointerdown.prevent="press(b.button)"
        >
          {{ b.glyph }}
        </button>
      </div>

      <!-- Options -->
      <section
        class="kr-panel flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl p-3 text-sm"
      >
        <label class="flex items-center gap-2">
          <span class="font-semibold">Difficulty</span>
          <select
            class="kr-select-sm"
            :value="store.difficulty"
            :disabled="phase === 'play'"
            @change="
              store.setDifficulty(
                ($event.target as HTMLSelectElement).value as LairDifficulty,
              )
            "
          >
            <option value="assist">Assist</option>
            <option value="classic">Classic</option>
          </select>
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            :checked="flashOn"
            @change="
              store.setFlash(($event.target as HTMLInputElement).checked)
            "
          />
          Flash assist
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            :checked="showButtons"
            @change="
              store.setButtons(($event.target as HTMLInputElement).checked)
            "
          />
          On-screen buttons
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            :checked="!store.muted"
            @change="onSound(($event.target as HTMLInputElement).checked)"
          />
          Sound
        </label>
        <p class="kr-text-dim-sm w-full">
          Arrows or WASD, Space for the sword. Clips are coming; until then each
          moment is a placeholder still.
        </p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { CHAPTER_1 } from '~/utils/zuzuLair/chapter1'
import {
  lairReducer,
  nodeById,
  startRun,
  windowFor,
} from '~/utils/zuzuLair/engine'
import { flashEnabled, hintLit } from '~/utils/zuzuLair/prefs'
import type {
  LairAction,
  LairButton,
  LairDifficulty,
  LairRun,
} from '~/utils/zuzuLair/types'
import { createArcadeSound, type ArcadeSound } from '~/utils/arcade/sound'
import { setGamePageLock } from '~/utils/arcade/pageLock'
import { isAllowedInitials, normalizeInitials } from '~/utils/arcade/initials'
import { readGamepad } from '~/utils/arcade/input'
import { useArcadeStore } from '~/stores/arcadeStore'
import { useZuzuLairStore } from '~/stores/zuzuLairStore'

useHead({ title: "Zuzu's Lair" })

const GAME = 'zuzu-lair'
const CLIP_BASE = '/zuzu-lair/ch1'
const PAD: Array<{
  button: LairButton
  glyph: string
  name: string
  area: string
}> = [
  { button: 'up', glyph: '▲', name: 'Up', area: '1 / 2' },
  { button: 'left', glyph: '◀', name: 'Left', area: '2 / 1' },
  { button: 'right', glyph: '▶', name: 'Right', area: '2 / 3' },
  { button: 'down', glyph: '▼', name: 'Down', area: '3 / 2' },
  { button: 'sword', glyph: '⚔', name: 'Sword', area: '2 / 4' },
]
const GLYPH: Record<LairButton, string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
  sword: '⚔',
}
const KEYS: Record<string, LairButton> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'sword',
  KeyZ: 'sword',
  KeyJ: 'sword',
}

const store = useZuzuLairStore()
const arcade = useArcadeStore()

const phase = ref<'title' | 'play' | 'end'>('title')
const run = shallowRef<LairRun>(startRun(CHAPTER_1, 'assist'))
const stageEl = ref<HTMLElement | null>(null)
const videos: Array<HTMLVideoElement | null> = [null, null]
const activeVideo = ref(0)
const videoReady = ref(false)
const initials = ref('')
const submitted = ref(false)
const coarse = ref(false)
const reduced = ref(false)

let sound: ArcadeSound | null = null
let raf = 0
let last = 0
let padHeld: Partial<Record<LairButton, boolean>> = {}

const node = computed(() => nodeById(CHAPTER_1, run.value.node))
const nodeKind = computed(() => node.value.kind)
const nodeLabel = computed(() => node.value.id.replace(/-/g, ' '))
const flashOn = computed(() => flashEnabled(store.difficulty, store.flash))
const showButtons = computed(() => store.buttons ?? coarse.value)
const windowRange = computed(() =>
  node.value.kind === 'moment'
    ? windowFor(CHAPTER_1, node.value, run.value.difficulty)
    : null,
)
const windowOpen = computed(() => {
  const w = windowRange.value
  return !!w && run.value.phase === 'playing' && run.value.t >= w[0]
})
const hintButton = computed(() => node.value.expect ?? 'up')
const hintGlyph = computed(() => GLYPH[hintButton.value])
const hintName = computed(() => hintButton.value)
const hintOn = computed(() => {
  if (!flashOn.value) return false
  return hintLit(run.value.t - (windowRange.value?.[0] ?? 0), reduced.value)
})
const initialsOk = computed(() => isAllowedInitials(initials.value))
const boardRows = computed(() => arcade.board(GAME, 'all'))

function dispatch(action: LairAction) {
  const before = run.value
  const after = lairReducer(before, action)
  if (after === before) return
  run.value = after
  if (after.node !== before.node) onNode(before, after)
  if (after.phase === 'complete' && before.phase !== 'complete') finish()
}

function onNode(before: LairRun, after: LairRun) {
  const kind = nodeById(CHAPTER_1, after.node).kind
  if (kind === 'success') sound?.play('zuzuSuccess')
  else if (kind === 'death') sound?.play('zuzuDeath')
  playClip(after.node)
  preloadNext(after.node)
  void before
}

function clipUrl(id: string) {
  return `${CLIP_BASE}/${id}.mp4`
}

function playClip(id: string) {
  const el = videos[activeVideo.value]
  if (!el) return
  videoReady.value = false
  el.src = clipUrl(id)
  el.currentTime = 0
  el.muted = store.muted
  void el.play().catch(() => {})
}

function preloadNext(id: string) {
  const n = nodeById(CHAPTER_1, id)
  const target = n.kind === 'moment' ? n.success : (n.next ?? n.retry)
  const other = videos[1 - activeVideo.value]
  if (other && target) other.src = clipUrl(target)
}

function onVideoReady(i: number) {
  if (i === activeVideo.value) videoReady.value = true
}
function onVideoError(i: number) {
  if (i === activeVideo.value) videoReady.value = false
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  pollPad()
  if (phase.value === 'play' && run.value.phase === 'playing')
    dispatch({ type: 'tick', dt })
}

function pollPad() {
  const pad = navigator.getGamepads?.().find(Boolean)
  if (!pad) return
  const r = readGamepad(pad)
  const now: Partial<Record<LairButton, boolean>> = {
    up: r.up,
    down: r.down,
    left: r.left,
    right: r.right,
    sword: r.a || r.b,
  }
  for (const b of Object.keys(now) as LairButton[])
    if (now[b] && !padHeld[b]) press(b)
  padHeld = now
}

function press(button: LairButton) {
  sound?.unlock()
  if (phase.value !== 'play') return
  dispatch({ type: 'press', button })
}

function onKey(event: KeyboardEvent) {
  if (event.repeat) return
  const target = event.target as HTMLElement | null
  if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return
  const button = KEYS[event.code]
  if (!button) return
  if (phase.value === 'play') event.preventDefault()
  press(button)
}

function begin() {
  sound?.unlock()
  run.value = startRun(CHAPTER_1, store.difficulty)
  submitted.value = false
  phase.value = 'play'
  setGamePageLock(true)
  playClip(run.value.node)
  preloadNext(run.value.node)
}

function continueRun() {
  dispatch({ type: 'continue' })
  playClip(run.value.node)
}

function finish() {
  phase.value = 'end'
  setGamePageLock(false)
  initials.value = arcade.savedInitials || ''
  void arcade.fetchBoard(GAME, 'all')
}

async function submit() {
  if (!initialsOk.value) return
  const name = normalizeInitials(initials.value)
  arcade.rememberInitials(name)
  submitted.value = true
  await arcade.submitScore({
    game: GAME,
    initials: name,
    score: run.value.score,
    level: 1,
  })
}

function toTitle() {
  phase.value = 'title'
  run.value = startRun(CHAPTER_1, store.difficulty)
}

function onSound(on: boolean) {
  store.setMuted(!on)
  sound?.setMuted(!on)
}

watch(
  () => store.difficulty,
  (d) => {
    if (phase.value !== 'play') run.value = startRun(CHAPTER_1, d)
  },
)

onMounted(async () => {
  store.load()
  arcade.loadPreferences(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  coarse.value = window.matchMedia('(pointer: coarse)').matches
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  run.value = startRun(CHAPTER_1, store.difficulty)
  sound = createArcadeSound(store.muted)
  window.addEventListener('keydown', onKey)
  last = performance.now()
  raf = requestAnimationFrame(frame)
  await nextTick()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKey)
  if (phase.value === 'play') setGamePageLock(false)
  sound?.dispose()
})
</script>

<style scoped>
.lair-stage {
  aspect-ratio: 16 / 9;
  max-height: 70vh;
  touch-action: none;
}
.lair-still {
  display: grid;
  place-items: end start;
  padding: 0.75rem 1rem;
  background:
    radial-gradient(circle at 70% 30%, #c2410c55, transparent 55%),
    linear-gradient(160deg, #1c1917, #431407 60%, #0c0a09);
  animation: lair-kenburns 6s ease-in-out forwards;
}
.lair-death .lair-still {
  background:
    radial-gradient(circle at 50% 50%, #7f1d1d99, transparent 60%),
    linear-gradient(160deg, #1c1917, #450a0a);
}
.lair-success .lair-still {
  background:
    radial-gradient(circle at 50% 40%, #ca8a0455, transparent 60%),
    linear-gradient(160deg, #1c1917, #422006);
}
.lair-still-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #fed7aa;
  opacity: 0.7;
}
@keyframes lair-kenburns {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.08) translate(-1%, -1%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .lair-still {
    animation: none;
  }
}
.lair-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: #000000b3;
  color: #fff7ed;
  text-align: center;
  padding: 1rem;
}
.lair-title {
  font-family: serif;
  font-size: clamp(1.5rem, 6vw, 3rem);
  font-weight: 900;
  color: #fb923c;
}
.lair-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: clamp(3rem, 14vw, 7rem);
  color: #fed7aa;
  opacity: 0.35;
  pointer-events: none;
}
.lair-hint-lit {
  opacity: 1;
  text-shadow:
    0 0 24px #fb923c,
    0 0 48px #f97316;
}
.lair-hud {
  position: absolute;
  top: 0.5rem;
  left: 0.75rem;
  right: 0.75rem;
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  color: #fed7aa;
  text-shadow: 0 1px 2px #000;
}
.lair-end {
  overflow-y: auto;
  justify-content: flex-start;
}
.lair-board {
  display: grid;
  gap: 0.15rem;
  font-size: 0.8rem;
  min-width: 10rem;
}
.lair-board li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.lair-pad {
  display: grid;
  grid-template-columns: repeat(4, 4.5rem);
  grid-template-rows: repeat(3, 4.5rem);
  gap: 0.35rem;
  width: max-content;
  touch-action: none;
  user-select: none;
}
.lair-pad-btn {
  border-radius: 9999px;
  background: #292524;
  color: #fed7aa;
  font-size: 1.6rem;
  border: 2px solid #fb923c;
}
.lair-pad-btn:active {
  background: #7c2d12;
}
</style>
