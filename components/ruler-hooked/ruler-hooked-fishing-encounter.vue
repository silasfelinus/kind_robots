<template>
  <section
    class="rh-parchment rh-fight"
    aria-labelledby="fishing-encounter-title"
  >
    <header class="rh-fight__head">
      <div>
        <p class="rh-eyebrow">The line is alive</p>
        <h3 id="fishing-encounter-title" class="rh-title">
          {{ encounter.fishName }}
        </h3>
        <p class="rh-fight__behavior">{{ encounter.catchBehavior }}</p>
      </div>
      <ol class="rh-fight__steps" aria-label="Stage">
        <li
          v-for="s in STEPS"
          :key="s"
          :class="{ 'is-on': s === encounter.stage }"
        >
          {{ STEP_LABEL[s] }}
        </li>
      </ol>
    </header>

    <div
      v-if="encounter.stage === 'CAST' || encounter.stage === 'HOOK'"
      class="rh-fight__body"
    >
      <p class="rh-fight__ask">
        {{
          encounter.stage === 'CAST'
            ? 'Stop the bobber to cast your line.'
            : 'Again! Stop it to set the hook.'
        }}
      </p>
      <button
        type="button"
        class="rh-timing"
        :aria-label="
          encounter.stage === 'CAST'
            ? 'Stop moving marker to cast'
            : 'Stop moving marker to hook fish'
        "
        @click="emit('stop', marker)"
      >
        <span class="rh-timing__band" aria-hidden="true" />
        <span
          class="rh-timing__marker"
          :style="{ left: marker + '%' }"
          aria-hidden="true"
        />
        <span class="sr-only"
          >The center gold band improves your reel start. A miss is still
          playable.</span
        >
      </button>
      <p class="rh-fight__help">
        Tap the bar, Space, or Enter. The gold band is a bonus, not a must.
      </p>
    </div>

    <div v-else-if="encounter.stage === 'REEL'" class="rh-fight__body">
      <div class="rh-gauges">
        <label>
          <span
            ><span>Landed</span><span>{{ encounter.progress }}%</span></span
          >
          <span class="rh-gauge rh-gauge--landed"
            ><span :style="{ width: encounter.progress + '%' }"
          /></span>
        </label>
        <label>
          <span
            ><span>Tension</span><span>{{ encounter.tension }}%</span></span
          >
          <span
            class="rh-gauge rh-gauge--tension"
            :class="{ 'is-hot': encounter.tension >= 75 }"
          >
            <span :style="{ width: encounter.tension + '%' }" />
          </span>
        </label>
      </div>
      <div class="rh-actions rh-actions--split">
        <button
          type="button"
          class="rh-btn rh-btn--gold rh-btn--big"
          @click="tap"
        >
          Tap to reel
        </button>
        <button type="button" class="rh-btn rh-btn--big" @click="release">
          Give slack
        </button>
      </div>
      <p class="rh-fight__help">
        Tap to reel. Pause and the line eases on its own.
      </p>
    </div>

    <p class="rh-fight__cue" role="status" aria-live="polite">
      {{ encounter.cue }}
    </p>
  </section>
</template>

<script setup lang="ts">
import type { SimpleFishingEncounter } from '~/utils/rulerHooked/simpleFishing'

const props = defineProps<{ encounter: SimpleFishingEncounter }>()
const emit = defineEmits<{
  stop: [position: number]
  tap: []
  release: []
}>()

const marker = ref(0)
const STEPS = ['CAST', 'HOOK', 'REEL'] as const
const STEP_LABEL: Record<(typeof STEPS)[number], string> = {
  CAST: 'Cast',
  HOOK: 'Hook',
  REEL: 'Reel',
}
let animationId: number | null = null
let start = 0
let lastTapAt = 0
let slackTimer: ReturnType<typeof setInterval> | null = null

function tap() {
  lastTapAt = performance.now()
  emit('tap')
}

function release() {
  lastTapAt = performance.now()
  emit('release')
}

watch(
  () => props.encounter.stage,
  () => {
    lastTapAt = performance.now()
  },
)
function tick(now: number) {
  if (!start) start = now
  const fraction = ((now - start) % 2400) / 1200
  marker.value =
    fraction <= 1
      ? Math.round(fraction * 100)
      : Math.round((2 - fraction) * 100)
  animationId = requestAnimationFrame(tick)
}
onMounted(() => {
  lastTapAt = performance.now()
  animationId = requestAnimationFrame(tick)
  slackTimer = setInterval(() => {
    if (
      props.encounter.stage === 'REEL' &&
      performance.now() - lastTapAt >= 900
    ) {
      lastTapAt = performance.now()
      emit('release')
    }
  }, 300)
})
onBeforeUnmount(() => {
  if (animationId !== null) cancelAnimationFrame(animationId)
  if (slackTimer !== null) clearInterval(slackTimer)
})
</script>

<style scoped>
.rh-fight {
  width: 100%;
  display: grid;
  gap: 0.6rem;
}
.rh-fight__head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.rh-fight__behavior {
  font-size: 0.8rem;
  font-style: italic;
  opacity: 0.8;
}
.rh-fight__steps {
  display: flex;
  gap: 0.2rem;
  align-self: start;
}
.rh-fight__steps li {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  border: 1px solid rgb(58 38 22 / 0.3);
  opacity: 0.55;
}
.rh-fight__steps li.is-on {
  opacity: 1;
  background: var(--rh-plum);
  border-color: var(--rh-gold);
  color: #fff3d6;
}
.rh-fight__body {
  display: grid;
  gap: 0.5rem;
}
.rh-fight__ask {
  font-family: var(--rh-display);
  font-weight: 700;
  font-size: 1.05rem;
}
.rh-fight__help {
  font-size: 0.75rem;
  opacity: 0.75;
}
.rh-timing {
  position: relative;
  display: block;
  height: 3.25rem;
  width: 100%;
  border-radius: 999px;
  overflow: hidden;
  background:
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.08) 0 2px,
      transparent 2px 22px
    ),
    linear-gradient(180deg, #3d6f8f, #24465c);
  border: 2px solid var(--rh-ink);
  box-shadow:
    inset 0 3px 8px rgb(0 0 0 / 0.45),
    0 0 0 3px var(--rh-gold);
  cursor: pointer;
}
.rh-timing:focus-visible {
  outline: 3px solid var(--rh-plum);
  outline-offset: 4px;
}
.rh-timing__band {
  position: absolute;
  inset: 0 auto 0 28%;
  width: 44%;
  background: linear-gradient(
    180deg,
    rgb(255 217 119 / 0.75),
    rgb(217 164 65 / 0.6)
  );
  border-inline: 2px solid #fff1c9;
}
.rh-timing__marker {
  position: absolute;
  top: 50%;
  width: 1.6rem;
  height: 1.6rem;
  translate: -50% -50%;
  border-radius: 999px;
  background: linear-gradient(180deg, #e8445a 50%, #fff6e6 50%);
  border: 2px solid #3a1010;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
}
.rh-gauges {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.rh-gauges label > span:first-child {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}
.rh-gauge {
  display: block;
  height: 0.85rem;
  border-radius: 999px;
  background: rgb(58 38 22 / 0.2);
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.35);
  overflow: hidden;
}
.rh-gauge > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 180ms ease;
}
.rh-gauge--landed > span {
  background: linear-gradient(90deg, #3f7d2e, #8cc860);
}
.rh-gauge--tension > span {
  background: linear-gradient(90deg, #6fae4b, #ecc25a 60%, #d2453c);
}
.rh-gauge--tension.is-hot {
  animation: rh-hot 0.5s ease-in-out infinite alternate;
}
@keyframes rh-hot {
  to {
    box-shadow:
      0 0 0 2px #d2453c,
      inset 0 1px 3px rgb(0 0 0 / 0.35);
  }
}
.rh-fight__cue {
  padding: 0.5rem 0.7rem;
  border-radius: 0.6rem;
  background: rgb(58 38 22 / 0.08);
  font-size: 0.85rem;
  font-style: italic;
}
@media (prefers-reduced-motion: reduce) {
  .rh-gauge--tension.is-hot {
    animation: none;
  }
}
</style>
