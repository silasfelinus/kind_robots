<template>
  <main class="kr-surface lair-root">
    <div class="lair-console kr-scroll">
      <div
        ref="stageEl"
        class="lair-stage relative mx-auto w-full overflow-hidden rounded-2xl bg-black"
        :class="`lair-${nodeKind}`"
        data-testid="lair-stage"
      >
        <zuzu-lair-stage
          :key="run.node + ':' + sceneVersion"
          :scene-id="run.node"
          :window-open="windowOpen"
          data-testid="lair-animation"
        />
        <video
          ref="videoEl"
          class="absolute inset-0 h-full w-full object-contain transition-opacity"
          :class="videoReady ? 'opacity-100' : 'opacity-0'"
          playsinline
          muted
          preload="metadata"
          aria-hidden="true"
          @loadeddata="videoReady = true"
          @error="videoReady = false"
        />

        <!-- Title card -->
        <div v-if="phase === 'title'" class="lair-overlay">
          <p class="lair-title">Zuzu's Lair</p>
          <p class="text-sm opacity-80">{{ chapter.title }}</p>
          <p class="max-w-sm text-sm opacity-90">
            {{
              selectedChapter === 'bats'
                ? 'A playable animated encounter. Duck as the swarm arrives, or face the bats.'
                : 'The full Dry Gulch storyboard. Its generated film clips are still pending.'
            }}
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="btn btn-warning"
              data-testid="lair-start"
              @click="begin"
            >
              {{
                selectedChapter === 'bats'
                  ? 'Enter the corridor'
                  : 'Explore Dry Gulch'
              }}
            </button>
            <button
              type="button"
              class="btn btn-ghost border border-amber-500/40"
              data-testid="lair-chapter-switch"
              @click="
                selectChapter(selectedChapter === 'bats' ? 'gulch' : 'bats')
              "
            >
              {{
                selectedChapter === 'bats'
                  ? 'Dry Gulch storyboard'
                  : 'Play bat corridor'
              }}
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

        <button
          v-if="
            phase === 'play' &&
            selectedChapter === 'bats' &&
            run.node === 'bat-horde' &&
            !showButtons
          "
          type="button"
          class="lair-duck-button"
          data-testid="lair-duck-button"
          @pointerdown.prevent="press('down')"
        >
          ↓ Duck
        </button>

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
          <p class="lair-title">
            {{
              selectedChapter === 'bats'
                ? 'The bats are behind you!'
                : 'Chapter clear'
            }}
          </p>
          <p class="text-lg font-bold" data-testid="lair-score">
            {{ run.score.toLocaleString() }} pts
          </p>
          <p v-if="run.bonus" class="text-xs opacity-80">
            No-death bonus {{ run.bonus.noDeath }} · time bonus
            {{ run.bonus.time }}
          </p>
          <p v-if="selectedChapter === 'bats'" class="text-sm">
            You made it through the corridor. Try the wrong direction to see the
            other outcome.
          </p>
          <form
            v-if="selectedChapter === 'gulch' && !submitted"
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
          <ol
            v-if="selectedChapter === 'gulch'"
            class="lair-board"
            aria-label="Zuzu's Lair high scores"
          >
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
          Arrows or WASD, Space for the sword. Bat Corridor is a playable
          animated proof of concept; Dry Gulch film renders are not yet
          connected.
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
import { BAT_CORRIDOR } from '~/utils/zuzuLair/batCorridor'
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
import { useAchievementStore } from '~/stores/achievementStore'
import { useZuzuLairStore } from '~/stores/zuzuLairStore'

useHead({ title: "Zuzu's Lair" })

const GAME = 'zuzu-lair'
const READY_CLIPS: Record<string, string> = {}
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
const sceneVersion = ref(0)
const selectedChapter = ref<'bats' | 'gulch'>('bats')
const chapter = computed(() =>
  selectedChapter.value === 'bats' ? BAT_CORRIDOR : CHAPTER_1,
)
const run = shallowRef<LairRun>(startRun(BAT_CORRIDOR, 'assist'))
const stageEl = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const videoReady = ref(false)
const initials = ref('')
const submitted = ref(false)
const coarse = ref(false)
const reduced = ref(false)

let sound: ArcadeSound | null = null
let raf = 0
let last = 0
let padHeld: Partial<Record<LairButton, boolean>> = {}

const node = computed(() => nodeById(run.value.chapter, run.value.node))
const nodeKind = computed(() => node.value.kind)
const flashOn = computed(() => flashEnabled(store.difficulty, store.flash))
const showButtons = computed(() => store.buttons ?? coarse.value)
const windowRange = computed(() =>
  node.value.kind === 'moment'
    ? windowFor(run.value.chapter, node.value, run.value.difficulty)
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
  if (after.phase === 'complete' && before.phase !== 'complete') {
    if (selectedChapter.value === 'gulch') awardChapter(after)
    finish()
  }
}

function awardChapter(after: LairRun) {
  const achievements = useAchievementStore()
  void achievements.rewardAchievementByCode('zuzu-lair-dry-gulch')
  if (after.difficulty !== 'classic') return
  void achievements.rewardAchievementByCode('zuzu-lair-classic-gulch')
  if (after.deaths === 0)
    void achievements.rewardAchievementByCode('zuzu-lair-not-a-scratch')
}

function onNode(before: LairRun, after: LairRun) {
  const kind = nodeById(after.chapter, after.node).kind
  if (kind === 'success') sound?.play('zuzuSuccess')
  else if (kind === 'death') sound?.play('zuzuDeath')
  playClip(after.node)
  void before
}

/**
 * No chapter MP4 is bundled or published yet. Opt in each verified, playable
 * URL here only after the production/art-delivery gate clears it.
 * Missing clips must never cause an empty stage or a speculative 404.
 */
function playClip(id: string) {
  const el = videoEl.value
  videoReady.value = false
  if (!el) return
  el.pause()
  const url = READY_CLIPS[id]
  if (!url) {
    el.removeAttribute('src')
    el.load()
    return
  }
  el.src = url
  el.currentTime = 0
  el.muted = store.muted
  void el.play().catch(() => {
    videoReady.value = false
  })
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
  sceneVersion.value++
  run.value = startRun(chapter.value, store.difficulty)
  submitted.value = false
  phase.value = 'play'
  setGamePageLock(true)
  playClip(run.value.node)
}

function continueRun() {
  dispatch({ type: 'continue' })
}

function finish() {
  phase.value = 'end'
  setGamePageLock(false)
  initials.value = arcade.savedInitials || ''
  if (selectedChapter.value === 'gulch') void arcade.fetchBoard(GAME, 'all')
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
  run.value = startRun(chapter.value, store.difficulty)
  videoReady.value = false
}

function selectChapter(value: 'bats' | 'gulch') {
  selectedChapter.value = value
  run.value = startRun(chapter.value, store.difficulty)
  videoReady.value = false
}

function onSound(on: boolean) {
  store.setMuted(!on)
  sound?.setMuted(!on)
  if (videoEl.value) videoEl.value.muted = !on
}

watch(
  () => store.difficulty,
  (d) => {
    if (phase.value !== 'play') run.value = startRun(chapter.value, d)
  },
)

onMounted(async () => {
  store.load()
  arcade.loadPreferences(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  coarse.value = window.matchMedia('(pointer: coarse)').matches
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  run.value = startRun(chapter.value, store.difficulty)
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
.lair-root {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.lair-console {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  gap: 0.55rem;
  padding: 0.4rem;
}
.lair-stage {
  flex: 1 1 auto;
  min-height: 10rem;
  width: 100%;
  aspect-ratio: 16 / 9;
  touch-action: none;
  background: #100e15;
}
.lair-duck-button {
  position: absolute;
  z-index: 4;
  bottom: 1rem;
  right: 1rem;
  border: 2px solid #ffb65b;
  border-radius: 1rem;
  padding: 0.65rem 1rem;
  background: #311b1bdf;
  color: #ffe3ae;
  font-size: 1.2rem;
  font-weight: 900;
}
.lair-duck-button:focus-visible {
  outline: 3px solid white;
}
.lair-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(90deg, #130e19f2, #150e1bba 45%, #150e1b40);
  color: #fff7ed;
  text-align: left;
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
  top: 12%;
  right: 13%;
  display: grid;
  place-items: center;
  font-size: clamp(2rem, 8vw, 5rem);
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
  grid-template-columns: repeat(4, clamp(2.5rem, 6vh, 3.8rem));
  grid-template-rows: repeat(3, clamp(2.5rem, 6vh, 3.8rem));
  gap: 0.35rem;
  width: max-content;
  touch-action: none;
  user-select: none;
}
.lair-pad-btn {
  border-radius: 9999px;
  background: #292524;
  color: #fed7aa;
  font-size: 1.4rem;
  border: 2px solid #fb923c;
}
.lair-pad-btn:active {
  background: #7c2d12;
}
</style>
