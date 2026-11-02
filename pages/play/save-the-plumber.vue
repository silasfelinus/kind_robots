<template>
  <main class="kr-surface plumber-page">
    <div
      class="plumber-console kr-scroll"
      aria-label="Save the Plumber handheld game menu"
    >
      <header-page-bar compact>
        <div class="plumber-bar" title="Kind Robots ◆ Adventure System">
          <span class="plumber-progress" aria-live="polite">
            {{
              plumber.chosen ? 'SAVE ' + plumber.percent + '%' : 'NEW ADVENTURE'
            }}
          </span>
        </div>
      </header-page-bar>
      <page-help label="Save the Plumber controls" @open="go('guide')" />

      <div
        ref="viewport"
        class="plumber-viewport"
        tabindex="-1"
        @keydown="onScreenKey"
      >
        <!-- These are the shipped moving Krea world-map plates, not CSS-animated SVG shapes.
             A real still remains visible on unsupported codecs and for reduced motion. -->
        <div
          v-if="screen !== 'play' && screen !== 'maker' && screen !== 'guide'"
          class="plumber-motion"
          aria-hidden="true"
        >
          <img
            :src="poster"
            alt=""
            decoding="async"
            class="plumber-motion-image"
          />
          <video
            v-if="!reducedMotion"
            :key="clipWorld"
            autoplay
            loop
            muted
            playsinline
            preload="metadata"
            class="plumber-motion-video"
            :poster="poster"
          >
            <source :src="clipRoot + '.webm'" type="video/webm" />
            <source :src="clipRoot + '.mp4'" type="video/mp4" />
          </video>
        </div>

        <Transition name="plumber-screen" mode="out-in">
          <section
            v-if="screen === 'title'"
            key="title"
            class="plumber-view plumber-title-view"
            aria-labelledby="plumber-name"
          >
            <div class="plumber-title-content">
              <p class="plumber-eyebrow">THE RIVERS ARE RUNNING UPHILL</p>
              <h2 id="plumber-name" class="plumber-logo">
                <span>SAVE THE</span>
                <strong>PLUMBER!</strong>
              </h2>
              <p class="plumber-tagline">
                Eight worlds. One fearless heroine. A missing boyfriend. A very
                badly behaved waterworks corporation.
              </p>
              <nav class="plumber-main-menu" aria-label="Game menu">
                <button
                  type="button"
                  class="plumber-option plumber-option--primary"
                  @click="go('play')"
                >
                  <span class="plumber-option-icon">▶</span>
                  {{
                    plumber.chosen ? 'CONTINUE ADVENTURE' : 'START ADVENTURE'
                  }}
                  <span class="plumber-option-arrow">A</span>
                </button>
                <button
                  type="button"
                  class="plumber-option"
                  @click="go('maker')"
                >
                  <span class="plumber-option-icon">▦</span>
                  LEVEL MAKER <span>›</span>
                </button>
                <button
                  type="button"
                  class="plumber-option"
                  @click="go('story')"
                >
                  THE STORY <span>›</span>
                </button>
                <button
                  type="button"
                  class="plumber-option"
                  @click="go('worlds')"
                >
                  WORLD SELECT <span>›</span>
                </button>
                <button
                  type="button"
                  class="plumber-option"
                  @click="go('crew')"
                >
                  THE HEROINES <span>›</span>
                </button>
                <button
                  type="button"
                  class="plumber-option"
                  @click="go('guide')"
                >
                  CONTROLS <span>›</span>
                </button>
              </nav>
            </div>
            <span class="plumber-title-count"
              >08 WORLDS · 32 STAGES · 08 BOSSES</span
            >
          </section>

          <section
            v-else-if="screen === 'story'"
            key="story"
            class="plumber-view plumber-story-view"
            aria-labelledby="story-heading"
          >
            <div class="plumber-story-panel">
              <p class="plumber-eyebrow">
                PROLOGUE / {{ storyIndex + 1 }} OF {{ storySlides.length }}
              </p>
              <h2 id="story-heading" class="plumber-section-title">
                {{ storySlides[storyIndex]!.title }}
              </h2>
              <p class="plumber-story-copy">
                {{ storySlides[storyIndex]!.description }}
              </p>
              <div class="plumber-inline-controls">
                <button
                  type="button"
                  class="plumber-control"
                  :disabled="storyIndex === 0"
                  @click="stepStory(-1)"
                >
                  ‹ PREVIOUS
                </button>
                <button
                  type="button"
                  class="plumber-control plumber-control--accent"
                  @click="
                    storyIndex === storySlides.length - 1
                      ? go('play')
                      : stepStory(1)
                  "
                >
                  {{
                    storyIndex === storySlides.length - 1 ? 'PLAY ▶' : 'NEXT ›'
                  }}
                </button>
              </div>
              <div class="plumber-progress-dots" aria-hidden="true">
                <span
                  v-for="(_, index) in storySlides"
                  :key="index"
                  :class="{ active: storyIndex === index }"
                />
              </div>
            </div>
            <p class="plumber-scene-mark">CHAPTER ZERO · THE GREAT UPHILL</p>
          </section>

          <section
            v-else-if="screen === 'worlds'"
            key="worlds"
            class="plumber-view plumber-world-view"
            aria-labelledby="world-heading"
          >
            <div class="plumber-world-panel">
              <p class="plumber-eyebrow">WORLD {{ currentWorld.id }} / 08</p>
              <h2 id="world-heading" class="plumber-section-title">
                {{ currentWorld.name }}
              </h2>
              <p class="plumber-world-tag">{{ currentWorld.tagline }}</p>
              <p class="plumber-world-mechanic">{{ currentWorld.mechanic }}</p>
              <div class="plumber-stage-grid" aria-label="World stages">
                <div
                  v-for="stage in currentWorld.stages"
                  :key="stage.code"
                  class="plumber-stage-tile"
                >
                  <small>{{ stage.code }} · {{ stage.beat }}</small>
                  <strong>{{ stage.name }}</strong>
                </div>
              </div>
              <div class="plumber-world-nav">
                <button
                  type="button"
                  class="plumber-control"
                  aria-label="Previous world"
                  @click="stepWorld(-1)"
                >
                  ‹
                </button>
                <span>{{ currentWorld.boss.name }} · BOSS</span>
                <button
                  type="button"
                  class="plumber-control"
                  aria-label="Next world"
                  @click="stepWorld(1)"
                >
                  ›
                </button>
              </div>
              <button
                type="button"
                class="plumber-control plumber-control--accent plumber-enter-world"
                @click="go('play')"
              >
                ENTER GAME ▶
              </button>
            </div>
          </section>

          <section
            v-else-if="screen === 'crew'"
            key="crew"
            class="plumber-view plumber-crew-view"
            aria-labelledby="crew-heading"
          >
            <div class="plumber-crew-portrait" aria-hidden="true">
              <PlumberHeroineFace
                :heroine="heroine"
                class="plumber-crew-face"
              />
            </div>
            <div class="plumber-crew-panel">
              <p class="plumber-eyebrow">PLAYER CHARACTER</p>
              <h2 id="crew-heading" class="plumber-section-title">
                {{ heroine.name }}
              </h2>
              <p class="plumber-world-tag">
                {{
                  plumber.chosen
                    ? 'Your current heroine'
                    : 'Your adventure begins with a heroine select'
                }}
              </p>
              <p class="plumber-crew-copy">
                Eight heroines, each with a different special ability. Pick your
                fighter inside the game. Saved progress follows the heroine you
                chose.
              </p>
              <div class="plumber-crew-info">
                <span>CAST</span><strong>8 PLAYABLE HEROINES</strong>
                <span>STORY</span><strong>RESCUE TEO</strong>
                <span>PROGRESS</span
                ><strong>{{ plumber.percent }}% COMPLETE</strong>
              </div>
              <button
                type="button"
                class="plumber-control plumber-control--accent"
                @click="go('play')"
              >
                CHOOSE HEROINE IN GAME ▶
              </button>
            </div>
          </section>

          <section
            v-else-if="screen === 'guide'"
            key="guide"
            class="plumber-view plumber-guide-view"
            aria-labelledby="guide-heading"
          >
            <div class="plumber-guide-inner">
              <p class="plumber-eyebrow">CONTROLLER MANUAL</p>
              <h2 id="guide-heading" class="plumber-section-title">
                HOW TO PLAY
              </h2>
              <div class="plumber-guide-grid">
                <div
                  v-for="control in controls"
                  :key="control.label"
                  class="plumber-guide-action"
                >
                  <kbd>{{ control.key }}</kbd>
                  <span
                    ><strong>{{ control.label }}</strong
                    ><small>{{ control.does }}</small></span
                  >
                </div>
              </div>
              <div class="plumber-guide-bottom">
                <p>
                  Find secrets, collect Golden Gears and clear the goal valve.
                  Your three local save slots live inside the game.
                </p>
                <button
                  type="button"
                  class="plumber-control plumber-control--accent"
                  @click="go('play')"
                >
                  START GAME ▶
                </button>
              </div>
            </div>
          </section>

          <section
            v-else-if="screen === 'maker'"
            key="maker"
            class="plumber-view plumber-game-view"
            aria-label="Save the Plumber Level Maker"
          >
            <ArcadePlumberLevelMaker :share-code="shareCode" />
          </section>

          <section
            v-else
            key="play"
            class="plumber-view plumber-game-view"
            aria-label="Save the Plumber playable game"
          >
            <ArcadeCabinet slug="save-the-plumber" contained />
          </section>
        </Transition>
      </div>

      <footer class="plumber-console-bottom">
        <span
          ><span class="plumber-dpad">✚</span>
          {{
            screen === 'story' || screen === 'worlds'
              ? 'CHANGE SCENE'
              : 'SELECT'
          }}</span
        >
        <div class="plumber-footer-actions">
          <button
            v-if="screen !== 'title'"
            type="button"
            class="plumber-footer-back"
            aria-label="Return to Save the Plumber title menu"
            @click="go('title')"
          >
            <b>B</b> MENU
          </button>
          <span v-if="screen !== 'play' && screen !== 'maker'"
            ><b>A</b> CONFIRM</span
          >
          <span v-else>GAME CONTROLS ACTIVE</span>
        </div>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ArcadePlumberLevelMaker from '~/components/arcade/plumber-level-maker.vue'
import { useSavePlumberStore } from '~/stores/savePlumberStore'
import { PLUMBER_WORLDS } from '~/utils/arcade/games/savePlumberWorlds'

type Screen = 'title' | 'story' | 'worlds' | 'crew' | 'guide' | 'maker' | 'play'
const route = useRoute()
const shareCode = computed(() =>
  typeof route.query.level === 'string' ? route.query.level : undefined,
)
const screen = ref<Screen>(shareCode.value ? 'maker' : 'title')
const plumber = useSavePlumberStore()
const heroine = computed(() => plumber.heroine)
const viewport = ref<HTMLElement | null>(null)
const storyIndex = ref(0)
const worldIndex = ref(0)
const reducedMotion = ref(false)
const currentWorld = computed(() => PLUMBER_WORLDS[worldIndex.value]!)
const clipWorld = computed(() =>
  screen.value === 'worlds'
    ? currentWorld.value.id
    : screen.value === 'story' && storyIndex.value === 2
      ? 8
      : 1,
)
const clipRoot = computed(
  () => '/save-the-plumber/maps/world-' + clipWorld.value,
)
const poster = computed(() => clipRoot.value + '.webp')

const storySlides = [
  {
    title: 'THE WATER WENT THE WRONG WAY.',
    description:
      'One morning the rivers of Bluebell began flowing uphill. No rain, no warning, and no explanation. The town needed someone brave enough to investigate.',
  },
  {
    title: 'TEO DID NOT COME HOME.',
    description:
      'Teo, a local plumber, followed the reversed current to its source. The trail ended at the abandoned pumping works, and so did his last message.',
  },
  {
    title: 'SHE HAS EIGHT WORLDS TO CROSS.',
    description:
      'Lady Spigot has taken Teo to the sky-pump. The valves are turning, the worlds are changing, and now the rescue belongs to you.',
  },
]

const controls = [
  { key: '← →', label: 'MOVE', does: 'Run across platforms' },
  { key: 'A / ↑', label: 'JUMP', does: 'Hold for more height' },
  { key: 'B', label: 'SPRINT', does: 'Hold while moving' },
  { key: 'X', label: 'WRENCH', does: 'Break, stun and turn valves' },
  { key: 'Y', label: 'SPECIAL', does: 'Heroine ability' },
  { key: '↓', label: 'DUCK / PIPE', does: 'Crawl, drop or enter' },
]

function go(next: Screen) {
  screen.value = next
}
function stepStory(direction: number) {
  storyIndex.value = Math.max(
    0,
    Math.min(storySlides.length - 1, storyIndex.value + direction),
  )
}
function stepWorld(direction: number) {
  worldIndex.value =
    (worldIndex.value + direction + PLUMBER_WORLDS.length) %
    PLUMBER_WORLDS.length
}
function onScreenKey(event: KeyboardEvent) {
  if (
    screen.value === 'play' ||
    screen.value === 'maker' ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return
  const target = event.target
  if (
    target instanceof HTMLElement &&
    target.closest('button, a, input, select, textarea')
  )
    return
  if (screen.value === 'story' || screen.value === 'worlds') {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const step = event.key === 'ArrowLeft' ? -1 : 1
      if (screen.value === 'story') stepStory(step)
      else stepWorld(step)
    }
  }
}
function onEscape(event: KeyboardEvent) {
  if (
    event.key !== 'Escape' ||
    screen.value === 'play' ||
    screen.value === 'maker' ||
    screen.value === 'title'
  )
    return
  event.preventDefault()
  go('title')
}

watch(screen, async () => {
  await nextTick()
  viewport.value?.focus({ preventScroll: true })
})
onMounted(() => {
  reducedMotion.value = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  window.addEventListener('keydown', onEscape)
})
onUnmounted(() => window.removeEventListener('keydown', onEscape))
useSeoMeta(
  gameLinkPreviewMeta(
    'save-the-plumber',
    useRuntimeConfig().public.appBaseUrl,
  ) ?? {},
)
useHead({ title: 'Save the Plumber · Kind Robots Arcade' })
</script>

<style scoped>
.plumber-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #080f1b;
  color: #fff6df;
}
.plumber-console {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: max(0.4rem, env(safe-area-inset-top))
    max(0.4rem, env(safe-area-inset-right))
    max(0.4rem, env(safe-area-inset-bottom))
    max(0.4rem, env(safe-area-inset-left));
  background: linear-gradient(120deg, #222b38, #111a29);
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.plumber-console-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  min-height: 2.5rem;
  padding: 0.35rem clamp(0.45rem, 1.5vw, 1.25rem);
  font-size: clamp(0.6rem, 1.1vw, 0.8rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #d0e6e8;
}
.plumber-console-bottom {
  background: #121f2d;
  border-radius: 0 0 0.8rem 0.8rem;
}
.plumber-bar {
  display: flex;
  flex: 1;
  min-width: 0;
  justify-content: flex-end;
}
.plumber-progress {
  padding: 0.2rem 0.7rem;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 18%, transparent);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  white-space: nowrap;
  color: var(--color-base-content);
}
.plumber-footer-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.plumber-footer-actions b,
.plumber-dpad {
  display: inline-grid;
  place-items: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.25rem;
  border-radius: 0.4rem;
  margin-right: 0.3rem;
  color: #142335;
  background: #fbd090;
}
.plumber-footer-back {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  color: inherit;
}
.plumber-viewport {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 0;
  background: radial-gradient(ellipse at 65% 40%, #235b65, #081b2e 80%);
  border: 2px solid #a5c9c5;
  border-radius: 0.8rem 0.8rem 0 0;
  outline-offset: -4px;
}
.plumber-motion,
.plumber-motion-image,
.plumber-motion-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.plumber-motion {
  z-index: 0;
  overflow: hidden;
}
.plumber-motion-image,
.plumber-motion-video {
  object-fit: cover;
  object-position: center center;
}
.plumber-motion::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(6, 19, 30, 0.94) 0%,
      rgba(6, 19, 30, 0.83) 32%,
      rgba(6, 19, 30, 0.25) 78%
    ),
    linear-gradient(0deg, rgba(6, 19, 30, 0.85), transparent 45%);
}
.plumber-view {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}
.plumber-title-view {
  align-items: center;
  padding: clamp(0.8rem, 3vw, 3rem);
}
.plumber-title-content {
  width: min(43rem, 76%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: clamp(0.35rem, 1.4vh, 1rem);
}
.plumber-eyebrow {
  font-size: clamp(0.63rem, 1.1vw, 0.8rem);
  font-weight: 900;
  letter-spacing: 0.18em;
  color: #fbd090;
}
.plumber-logo {
  display: flex;
  flex-direction: column;
  font-weight: 1000;
  font-size: clamp(2.2rem, min(7vw, 10vh), 6.2rem);
  line-height: 0.88;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  text-shadow:
    0 4px #12313e,
    0 8px 24px #07101a;
}
.plumber-logo strong {
  color: #ffd18b;
  font-size: 1.12em;
}
.plumber-tagline {
  max-width: 33rem;
  font-size: clamp(0.74rem, 1.2vw, 1.08rem);
  line-height: 1.4;
  color: #ecf5f0;
}
.plumber-main-menu {
  display: flex;
  flex-direction: column;
  width: min(24rem, 100%);
  gap: clamp(0.2rem, 0.7vh, 0.55rem);
}
.plumber-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: clamp(2rem, 5vh, 3.2rem);
  width: 100%;
  padding: 0.32rem 0.9rem;
  background: rgba(9, 28, 42, 0.74);
  border: 1px solid rgba(216, 243, 235, 0.35);
  border-radius: 0.45rem;
  color: #fff8e9;
  font-size: clamp(0.72rem, 1vw, 0.96rem);
  font-weight: 900;
  letter-spacing: 0.1em;
  text-align: left;
  transition:
    background-color 0.15s ease,
    transform 0.15s ease;
}
.plumber-option:hover,
.plumber-option:focus-visible {
  background: #235e68;
  transform: translateX(0.2rem);
}
.plumber-option--primary {
  color: #082437;
  background: #ffd18b;
  border-color: #fff3d5;
}
.plumber-option--primary:hover,
.plumber-option--primary:focus-visible {
  color: #081b2e;
  background: #fff0cb;
}
.plumber-option-icon {
  margin-right: 0.3rem;
}
.plumber-option-arrow {
  margin-left: auto;
  border: 1px solid currentColor;
  border-radius: 0.3rem;
  padding: 0.05rem 0.4rem;
}
.plumber-title-count,
.plumber-scene-mark {
  position: absolute;
  bottom: clamp(0.7rem, 2vw, 1.6rem);
  right: clamp(0.7rem, 2vw, 2rem);
  color: #ffebc8;
  font-weight: 800;
  letter-spacing: 0.18em;
  font-size: clamp(0.6rem, 1vw, 0.8rem);
}
.plumber-story-view {
  align-items: center;
  padding: clamp(0.8rem, 4vw, 4rem);
}
.plumber-story-panel,
.plumber-world-panel,
.plumber-crew-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.5rem, 1.5vh, 1.3rem);
  width: min(31rem, 75%);
  max-height: 100%;
}
.plumber-section-title {
  font-size: clamp(1.7rem, min(4.5vw, 8vh), 4.6rem);
  font-weight: 1000;
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: #fff5dd;
}
.plumber-story-copy,
.plumber-crew-copy {
  font-size: clamp(0.84rem, 1.5vw, 1.22rem);
  line-height: 1.5;
  color: #e5f3ef;
}
.plumber-inline-controls,
.plumber-world-nav {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.plumber-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.4rem;
  padding: 0.45rem 1rem;
  border-radius: 0.45rem;
  border: 1px solid #91c8c9;
  background: rgba(8, 30, 44, 0.8);
  color: #fdf6df;
  font-weight: 900;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
}
.plumber-control:hover:not(:disabled),
.plumber-control:focus-visible {
  background: #28626e;
}
.plumber-control:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}
.plumber-control--accent {
  color: #092334;
  background: #ffd18b;
  border-color: #fff3d5;
}
.plumber-control--accent:hover:not(:disabled) {
  background: #fff0cb;
  color: #092334;
}
.plumber-progress-dots {
  display: flex;
  gap: 0.5rem;
}
.plumber-progress-dots span {
  display: block;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  border: 1px solid #ffdf9c;
}
.plumber-progress-dots span.active {
  background: #ffdf9c;
}
.plumber-world-view {
  justify-content: flex-end;
}
.plumber-world-panel {
  width: min(33rem, 49%);
  height: 100%;
  max-height: none;
  justify-content: center;
  gap: clamp(0.25rem, 1.1vh, 0.85rem);
  padding: clamp(0.75rem, 2vw, 2.5rem);
  background: linear-gradient(
    90deg,
    rgba(6, 20, 32, 0.85),
    rgba(6, 20, 32, 0.95)
  );
  border-left: 2px solid #4e8d91;
}
.plumber-world-tag {
  font-size: clamp(0.9rem, 1.3vw, 1.1rem);
  color: #ffe3b4;
  font-weight: 800;
}
.plumber-world-mechanic {
  color: #d4e9e9;
  font-size: clamp(0.73rem, 1vw, 0.96rem);
}
.plumber-stage-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}
.plumber-stage-tile {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  padding: clamp(0.4rem, 1vw, 0.8rem);
  border: 1px solid #527981;
  background: #132e3e;
  border-radius: 0.4rem;
}
.plumber-stage-tile small {
  font-size: clamp(0.55rem, 0.75vw, 0.7rem);
  color: #fbd090;
}
.plumber-stage-tile strong {
  font-size: clamp(0.65rem, 1vw, 0.88rem);
  line-height: 1.2;
}
.plumber-world-nav {
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: #fbd090;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-align: center;
}
.plumber-enter-world {
  align-self: flex-start;
}
.plumber-crew-view {
  align-items: center;
  justify-content: center;
  padding: clamp(0.8rem, 3vw, 3rem);
  gap: clamp(1rem, 4vw, 5rem);
}
.plumber-crew-portrait {
  flex: 0 1 34%;
  display: grid;
  place-items: center;
  align-self: stretch;
  min-width: 0;
  max-width: 24rem;
}
.plumber-crew-face {
  width: 100%;
  max-height: 100%;
  filter: drop-shadow(0 20px 18px rgba(0, 0, 0, 0.5));
}
.plumber-crew-panel {
  flex: 1;
  max-width: 30rem;
  width: auto;
}
.plumber-crew-info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  font-size: clamp(0.65rem, 0.9vw, 0.85rem);
}
.plumber-crew-info span {
  color: #ffdf9c;
}
.plumber-guide-view {
  align-items: center;
  justify-content: center;
  padding: clamp(0.6rem, 3vw, 2rem);
  background: radial-gradient(ellipse at center, #174357, #071521);
}
.plumber-guide-inner {
  width: min(100%, 57rem);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(0.5rem, 1.4vh, 1rem);
}
.plumber-guide-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.35rem, 1vw, 0.8rem);
}
.plumber-guide-action {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  padding: clamp(0.5rem, 1.1vw, 1rem);
  border: 1px solid #437c89;
  border-radius: 0.6rem;
  background: #132c3d;
}
.plumber-guide-action kbd {
  flex: 0 0 auto;
  min-width: 2.8rem;
  padding: 0.5rem;
  border: 2px solid #ffc977;
  border-radius: 0.4rem;
  text-align: center;
  font-weight: 900;
  color: #ffdf9c;
}
.plumber-guide-action span {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.plumber-guide-action strong {
  font-size: 0.83rem;
}
.plumber-guide-action small {
  font-size: 0.74rem;
  color: #c7e0df;
}
.plumber-guide-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.8rem;
}
.plumber-game-view {
  background: #070c19;
}
.plumber-game-view :deep(.arcade-cabinet) {
  height: 100%;
  max-width: none;
}
.plumber-screen-enter-active,
.plumber-screen-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.plumber-screen-enter-from {
  opacity: 0;
  transform: translateX(1.5%);
}
.plumber-screen-leave-to {
  opacity: 0;
  transform: translateX(-1.5%);
}

@media (max-width: 640px) and (orientation: portrait) {
  .plumber-motion::after {
    background: linear-gradient(
      0deg,
      rgba(6, 19, 30, 0.98) 0%,
      rgba(6, 19, 30, 0.87) 48%,
      rgba(6, 19, 30, 0.22) 100%
    );
  }
  .plumber-motion-image,
  .plumber-motion-video {
    object-position: 62% center;
  }
  .plumber-title-view {
    align-items: flex-end;
    padding: 1rem 1rem 1.5rem;
  }
  .plumber-title-content {
    width: 100%;
  }
  .plumber-logo {
    font-size: clamp(2rem, 11vw, 3.9rem);
  }
  .plumber-main-menu {
    width: 100%;
  }
  .plumber-option {
    min-height: 2.8rem;
  }
  .plumber-tagline {
    max-width: 22rem;
  }
  .plumber-title-count,
  .plumber-scene-mark {
    display: none;
  }
  .plumber-story-view {
    align-items: flex-end;
    padding: 1.3rem;
  }
  .plumber-story-panel {
    width: 100%;
  }
  .plumber-world-view {
    align-items: flex-end;
  }
  .plumber-world-panel {
    width: 100%;
    height: auto;
    max-height: 71%;
    justify-content: flex-start;
    border-left: 0;
    border-top: 2px solid #4e8d91;
  }
  .plumber-world-panel .plumber-section-title {
    font-size: clamp(1.5rem, 7vw, 2.5rem);
  }
  .plumber-crew-view {
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.4rem;
  }
  .plumber-crew-portrait {
    flex: 1 1 0;
    min-height: 0;
    width: min(65%, 17rem);
  }
  .plumber-crew-panel {
    flex: 0 0 auto;
    width: 100%;
    gap: 0.4rem;
  }
  .plumber-crew-panel .plumber-section-title {
    font-size: 2rem;
  }
  .plumber-crew-copy {
    font-size: 0.8rem;
  }
  .plumber-guide-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .plumber-guide-action {
    gap: 0.4rem;
  }
  .plumber-guide-action kbd {
    min-width: 2rem;
    padding: 0.25rem;
    font-size: 0.75rem;
  }
  .plumber-guide-action strong {
    font-size: 0.68rem;
  }
  .plumber-guide-action small {
    font-size: 0.63rem;
  }
  .plumber-guide-bottom {
    flex-direction: column;
    align-items: flex-start;
    font-size: 0.7rem;
  }
}
@media (max-height: 520px) and (orientation: landscape) {
  .plumber-console-bottom {
    min-height: 1.8rem;
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
  }
  .plumber-title-content {
    width: min(37rem, 67%);
    gap: 0.22rem;
  }
  .plumber-logo {
    font-size: clamp(1.6rem, 6vh, 3rem);
  }
  .plumber-tagline {
    font-size: 0.7rem;
    line-height: 1.1;
  }
  .plumber-option {
    min-height: 1.45rem;
    padding: 0.15rem 0.6rem;
    font-size: 0.65rem;
  }
  .plumber-title-count {
    display: none;
  }
  .plumber-guide-action {
    padding: 0.3rem;
  }
  .plumber-guide-action kbd {
    padding: 0.2rem;
  }
  .plumber-guide-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .plumber-guide-bottom {
    font-size: 0.7rem;
  }
  .plumber-world-panel {
    gap: 0.22rem;
  }
  .plumber-world-panel .plumber-section-title {
    font-size: 1.55rem;
  }
  .plumber-stage-tile {
    padding: 0.26rem;
  }
  .plumber-world-tag,
  .plumber-world-mechanic {
    font-size: 0.68rem;
  }
  .plumber-crew-copy {
    font-size: 0.73rem;
  }
  .plumber-crew-info {
    gap: 0.2rem 0.7rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .plumber-screen-enter-active,
  .plumber-screen-leave-active {
    transition: none;
  }
  .plumber-option {
    transition: none;
  }
}
</style>
