<!-- The lake, in first person. The painted far shore reacts to your decrees
     (pristine / farmed / industrial), and to the reign's decay and tyranny
     pins (t-054: gallows, a poisoned lake) as their paintings land; a rotten
     reign also stains the water. Your own rod reaches in from the
     bottom-right. The ruler is never drawn in the scene (consolePOV contract). -->
<template>
  <section class="rh-screen rh-lake" aria-label="Castle Lake">
    <RulerHookedArt
      class="rh-backdrop"
      :candidates="backdrop"
      eager
      position="center 60%"
    />
    <div class="rh-lake__tint" :class="`is-${time}`" aria-hidden="true" />
    <div class="rh-lake__blight" aria-hidden="true" />

    <!-- The royal rod, first person: reaches in from the bottom-right corner,
         line and bobber drawn in the same box so they always meet. -->
    <svg
      class="rh-rod"
      :class="{ 'is-biting': fishing }"
      viewBox="0 0 500 300"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rh-rod-wood" x1="0" x2="1">
          <stop offset="0" stop-color="#4a1c12" />
          <stop offset=".5" stop-color="#9a4a2a" />
          <stop offset="1" stop-color="#5a2418" />
        </linearGradient>
        <linearGradient id="rh-sleeve" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#7b2350" />
          <stop offset="1" stop-color="#3b1530" />
        </linearGradient>
      </defs>
      <ellipse class="rh-rod__ripple" cx="112" cy="214" rx="26" ry="6" />
      <path class="rh-rod__line" d="M262 96 Q 190 150 112 206" />
      <g class="rh-rod__bobber">
        <path
          d="M100 206 a12 12 0 0 1 24 0 Z"
          fill="#e8445a"
          stroke="#3a1010"
          stroke-width="2"
        />
        <path
          d="M100 206 a12 12 0 0 0 24 0 Z"
          fill="#fff6e6"
          stroke="#3a1010"
          stroke-width="2"
        />
      </g>
      <path
        d="M520 330 L262 96"
        stroke="url(#rh-rod-wood)"
        stroke-width="9"
        stroke-linecap="round"
      />
      <path
        d="M520 330 L262 96"
        stroke="#f0c04a"
        stroke-width="1.5"
        stroke-dasharray="2 30"
        stroke-linecap="round"
      />
      <g fill="#e0b04a" stroke="#6a3a12" stroke-width="1.5">
        <circle cx="300" cy="131" r="4" />
        <circle cx="352" cy="178" r="4" />
      </g>
      <g transform="translate(418 238) rotate(-48)">
        <rect
          x="-17"
          y="-13"
          width="34"
          height="26"
          rx="7"
          fill="#d9a441"
          stroke="#6a3a12"
          stroke-width="2"
        />
        <circle
          cx="0"
          cy="0"
          r="7"
          fill="#7b2350"
          stroke="#f3d28a"
          stroke-width="2"
        />
      </g>
      <path
        d="M500 300 L500 252 Q 462 250 446 276 L 436 300 Z"
        fill="url(#rh-sleeve)"
        stroke="#d9a441"
        stroke-width="2"
      />
      <path
        d="M447 276 q 12 -6 24 1"
        stroke="#fff3df"
        stroke-width="7"
        stroke-linecap="round"
        fill="none"
      />
    </svg>

    <div
      class="rh-lake__dock"
      :class="{ 'rh-lake__dock--classic': !!store.activeClassicFishing }"
    >
      <RulerHookedQuizEncounter
        v-if="store.activeFishing && !store.activeClassicFishing"
        :encounter="store.activeFishing"
      />
      <RulerHookedFishingEncounter
        v-else-if="store.activeClassicFishing"
        ref="encounterEl"
        :encounter="store.activeClassicFishing"
        @stop="store.classicStop($event)"
      />

      <div
        v-else-if="store.lastCatch && showReveal"
        class="rh-parchment rh-reveal"
        role="status"
      >
        <RulerHookedArt
          class="rh-reveal__art"
          :candidates="fishCandidates(store.lastCatch.fishSlug)"
          :initial="store.lastCatch.name.charAt(0)"
          fit="cover"
        />
        <div class="rh-reveal__copy">
          <p class="rh-eyebrow">
            {{
              store.lastCatch.newDiscovery
                ? 'New to the Fishopedia!'
                : `Caught · ${store.lastCatch.countCaught} total`
            }}
          </p>
          <h2 class="rh-title">{{ store.lastCatch.name }}</h2>
          <p class="rh-reveal__stats">
            <span
              :class="`rh-rarity rh-rarity--${store.lastCatch.rarity.toLowerCase()}`"
              >{{ titleCase(store.lastCatch.rarity) }}</span
            >
            <span>{{ formatSize(store.lastCatch.sizeCm) }}</span>
            <span>{{ titleCase(store.lastCatch.quality) }}</span>
            <span v-if="store.lastCatch.coinsFound" class="rh-reveal__coins">
              <RulerHookedGlyph name="coin" />+{{ store.lastCatch.coinsFound }}
            </span>
          </p>
          <p class="rh-reveal__note">{{ store.lastCatch.fishopediaNote }}</p>
          <div class="rh-actions">
            <button type="button" class="rh-btn rh-btn--gold" @click="dismiss">
              {{ store.activeCard ? 'Answer the court' : 'Cast again' }}
            </button>
            <button
              type="button"
              class="rh-btn"
              @click="emit('navigate', 'fishopedia')"
            >
              Fishopedia
            </button>
          </div>
        </div>
      </div>

      <div
        v-else-if="store.lastEscape && showReveal"
        class="rh-parchment rh-callout"
        role="status"
      >
        <p class="rh-eyebrow">It got away</p>
        <h2 class="rh-title">{{ store.lastEscape.fishName }}</h2>
        <p>{{ store.lastEscape.cue }}</p>
        <button type="button" class="rh-btn rh-btn--gold" @click="dismiss">
          {{ store.activeCard ? 'Answer the court' : 'Try again' }}
        </button>
      </div>

      <div v-else-if="store.activeCard" class="rh-parchment rh-callout">
        <p class="rh-eyebrow">A royal petition</p>
        <h2 class="rh-title">{{ store.activeCard.title }}</h2>
        <p>The court will not let you cast until you have heard it.</p>
        <button
          type="button"
          class="rh-btn rh-btn--gold"
          @click="emit('navigate', 'court')"
        >
          Go to Court
        </button>
      </div>

      <div v-else-if="store.pendingEnding" class="rh-parchment rh-callout">
        <p class="rh-eyebrow">A finale is available</p>
        <h2 class="rh-title">
          Your choices have unlocked a possible conclusion
        </h2>
        <button
          type="button"
          class="rh-btn rh-btn--gold"
          @click="emit('navigate', 'court')"
        >
          Consider the finale
        </button>
      </div>

      <button
        v-else-if="store.canFish"
        type="button"
        class="rh-cast"
        @click="store.startFishing(quiz.mode)"
      >
        <span class="rh-cast__label">Cast a line</span>
        <span class="rh-cast__hint">{{ castHint }}</span>
      </button>

      <div
        v-else-if="store.save?.status === 'COMPLETE'"
        class="rh-parchment rh-callout"
      >
        <p class="rh-eyebrow">This reign is written</p>
        <h2 class="rh-title">The lake will wait for the next ruler</h2>
        <button
          type="button"
          class="rh-btn rh-btn--gold"
          @click="emit('navigate', 'saves')"
        >
          Begin another reign
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { useRulerHookedQuizStore } from '~/stores/rulerHookedQuizStore'
import {
  fishCandidates,
  lakeBackdropCandidates,
} from '~/utils/rulerHooked/artLibrary'
import type { ConsoleScreen } from '~/utils/rulerHooked/tutorial'

const emit = defineEmits<{ navigate: [screen: ConsoleScreen] }>()
const store = useRulerHookedStore()
const quiz = useRulerHookedQuizStore()

const time = computed(() => store.timeOfDay)
const backdrop = computed(() =>
  lakeBackdropCandidates(store.save, time.value, store.scene),
)
const fishing = computed(() => !!store.activeFishing)

// The catch/escape reveal shows once per landing; dismissing it returns to the rod.
const showReveal = ref(true)
watch(
  () => [store.lastCatch, store.lastEscape],
  () => {
    showReveal.value = true
  },
)
function dismiss() {
  showReveal.value = false
  if (store.activeCard || store.pendingEnding) emit('navigate', 'court')
}

const CAST_HINTS = [
  'The crown can wait. The fish cannot.',
  'Just one more cast, Your Majesty.',
  'Something large is moving under the lilies.',
  'Quill is pretending not to watch.',
]
const castHint = computed(
  () => CAST_HINTS[(store.save?.turnCount ?? 0) % CAST_HINTS.length],
)

// The console's A button: whatever the one visible lake action is now.
const encounterEl = ref<{ stop: () => void } | null>(null)
function press() {
  if (store.activeClassicFishing) return encounterEl.value?.stop()
  if (store.activeFishing) return
  if ((store.lastCatch || store.lastEscape) && showReveal.value)
    return dismiss()
  if (store.activeCard || store.pendingEnding) return emit('navigate', 'court')
  if (store.canFish) return store.startFishing(quiz.mode)
  if (store.save?.status === 'COMPLETE') emit('navigate', 'saves')
}
defineExpose({ press })

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}
function formatSize(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(cm >= 1000 ? 1 : 2)} m`
  return `${cm.toFixed(1)} cm`
}
</script>

<style scoped>
.rh-lake__tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 900ms ease;
}
.rh-lake__tint.is-golden {
  background: linear-gradient(
    180deg,
    rgb(255 170 60 / 0.18),
    rgb(255 120 40 / 0.12)
  );
  mix-blend-mode: soft-light;
}
.rh-lake__tint.is-dusk {
  background: linear-gradient(
    180deg,
    rgb(120 60 140 / 0.3),
    rgb(255 120 60 / 0.15)
  );
}
.rh-lake__tint.is-dawn {
  background: linear-gradient(
    180deg,
    rgb(255 200 220 / 0.22),
    rgb(160 200 255 / 0.12)
  );
}
.rh-lake__blight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: calc(var(--rh-soot) * 0.9);
  background:
    radial-gradient(
      60% 22% at 38% 78%,
      rgb(60 30 90 / 0.45),
      rgb(20 60 40 / 0.25) 45%,
      transparent 70%
    ),
    linear-gradient(180deg, rgb(40 36 30 / 0.35), transparent 35%),
    linear-gradient(0deg, rgb(10 14 8 / 0.45), transparent 40%);
  mix-blend-mode: multiply;
  transition: opacity 900ms ease;
}
.rh-rod {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(62%, 52rem);
  height: auto;
  pointer-events: none;
  overflow: visible;
  filter: drop-shadow(0 6px 8px rgb(0 0 0 / 0.35));
}
@container rhconsole (max-width: 899px) {
  .rh-rod {
    width: 92%;
    bottom: 34%;
  }
}
.rh-rod__line {
  fill: none;
  stroke: rgb(255 255 255 / 0.8);
  stroke-width: 1;
}
.rh-rod.is-biting .rh-rod__line {
  stroke: #fff6d8;
  stroke-width: 1.4;
}
.rh-rod__bobber {
  animation: rh-bob 2.4s ease-in-out infinite;
}
.rh-rod.is-biting .rh-rod__bobber {
  animation-duration: 0.45s;
}
.rh-rod__ripple {
  fill: none;
  stroke: rgb(255 255 255 / 0.6);
  stroke-width: 1.5;
  transform-origin: 112px 214px;
  animation: rh-ripple 2.4s ease-out infinite;
}
@keyframes rh-bob {
  50% {
    transform: translateY(2px);
  }
}
@keyframes rh-ripple {
  from {
    transform: scale(0.4);
    opacity: 0.9;
  }
  to {
    transform: scale(1.5);
    opacity: 0;
  }
}
.rh-lake__dock {
  position: absolute;
  z-index: 10;
  left: 50%;
  bottom: clamp(0.6rem, 3cqi, 1.5rem);
  translate: -50% 0;
  width: min(36rem, calc(100% - 1.25rem));
  display: grid;
  justify-items: center;
}
@container rhconsole (min-width: 900px) {
  .rh-lake__dock {
    left: auto;
    right: clamp(1rem, 4cqi, 3rem);
    translate: none;
    bottom: auto;
    top: 50%;
    transform: translateY(-40%);
    width: min(25rem, 36%);
  }
  .rh-lake__dock--classic {
    left: 50%;
    right: auto;
    bottom: clamp(0.6rem, 2cqi, 1.25rem);
    top: auto;
    width: min(49rem, 75%);
    transform: translateX(-50%);
  }
}
.rh-cast {
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  min-width: min(22rem, 100%);
  padding: 0.9rem 1.6rem 1rem;
  border-radius: 1.2rem;
  background:
    radial-gradient(
      120% 140% at 50% 0%,
      rgb(255 255 255 / 0.25),
      transparent 50%
    ),
    linear-gradient(180deg, #f0c04a, #b87a1c);
  border: 2px solid #fff1c9;
  box-shadow:
    0 0 0 3px var(--rh-plum),
    0 10px 24px rgb(0 0 0 / 0.4);
  color: var(--rh-plum-deep);
  cursor: pointer;
  transition: transform 140ms ease;
}
.rh-cast:hover {
  transform: translateY(-2px) scale(1.01);
}
.rh-cast:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}
.rh-cast__label {
  font-family: var(--rh-display);
  font-weight: 800;
  font-size: clamp(1.35rem, 3.6cqi, 2rem);
  line-height: 1;
}
.rh-cast__hint {
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.85;
}
.rh-reveal {
  display: grid;
  grid-template-columns: 1fr;
  overflow: hidden;
  width: 100%;
  padding: 0;
}
.rh-reveal__art {
  aspect-ratio: 7 / 4;
  border-bottom: 2px solid var(--rh-gold);
}
.rh-reveal__copy {
  padding: 0.8rem 1rem 1rem;
  display: grid;
  gap: 0.35rem;
}
.rh-reveal__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.8rem;
}
.rh-reveal__stats > span {
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  background: rgb(58 38 22 / 0.1);
  border: 1px solid rgb(58 38 22 / 0.25);
}
.rh-reveal__coins {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-weight: 700;
}
.rh-reveal__note {
  font-size: 0.9rem;
  font-style: italic;
}
.rh-callout {
  width: 100%;
  display: grid;
  gap: 0.4rem;
  justify-items: start;
}
@media (prefers-reduced-motion: reduce) {
  .rh-rod__bobber,
  .rh-rod__ripple {
    animation: none;
  }
}
</style>
