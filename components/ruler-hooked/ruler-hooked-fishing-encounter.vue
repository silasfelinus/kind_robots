<!-- components/ruler-hooked/ruler-hooked-fishing-encounter.vue
     The line, as the console's right-hand panel (t-054): the cast/hook marker,
     then the tension meter with Tap to Reel and Give Slack. The rules live in
     simpleFishing.ts; this only draws the encounter and reports the player's
     stops, taps and releases. press()/slack() let the console's A and X
     buttons drive it from a keyboard or gamepad. -->
<template>
  <section
    class="rh-line rh-panel"
    aria-labelledby="fishing-encounter-title"
    data-testid="rh-fishing"
  >
    <header class="rh-line-head">
      <div class="min-w-0">
        <p class="rh-line-eyebrow">The line is alive</p>
        <h3 id="fishing-encounter-title" class="rh-line-title">
          {{ encounter.fishName }}
        </h3>
      </div>
      <span class="rh-line-stage">{{ stageLabel }}</span>
    </header>

    <div
      v-if="encounter.stage === 'CAST' || encounter.stage === 'HOOK'"
      class="rh-line-body"
    >
      <p class="rh-line-hint">
        {{
          encounter.stage === 'CAST'
            ? 'Stop the marker to cast.'
            : 'Stop it again to set the hook.'
        }}
      </p>
      <button
        type="button"
        class="rh-marker"
        :aria-label="
          encounter.stage === 'CAST'
            ? 'Stop moving marker to cast'
            : 'Stop moving marker to hook fish'
        "
        @click="emit('stop', marker)"
      >
        <span class="rh-marker-sweet" aria-hidden="true" />
        <span
          class="rh-marker-needle"
          :style="{ left: marker + '%' }"
          aria-hidden="true"
        />
        <span class="sr-only"
          >The gilded centre improves your reel start. A miss is still
          playable.</span
        >
      </button>
    </div>

    <div v-else-if="encounter.stage === 'REEL'" class="rh-line-body">
      <div class="rh-tension">
        <span class="rh-tension-label">
          <span>Tension</span>
          <span class="tabular-nums">{{ encounter.tension }}%</span>
        </span>
        <span
          class="rh-tension-track"
          role="meter"
          aria-label="Line tension"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="encounter.tension"
        >
          <span
            class="rh-tension-needle"
            :style="{ left: encounter.tension + '%' }"
          />
        </span>
        <span class="rh-tension-label">
          <span>Landed</span>
          <span class="tabular-nums">{{ encounter.progress }}%</span>
        </span>
        <span
          class="rh-landed-track"
          role="meter"
          aria-label="Fish landed"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="encounter.progress"
        >
          <span
            class="rh-landed-fill"
            :style="{ width: encounter.progress + '%' }"
          />
        </span>
      </div>
      <div class="rh-line-actions">
        <button type="button" class="rh-action" @click="tap">
          <kbd class="rh-key">A</kbd> Tap to Reel
        </button>
        <button
          type="button"
          class="rh-action"
          :data-urgent="encounter.tension >= 65 ? 'true' : undefined"
          @click="release"
        >
          <kbd class="rh-key">X</kbd> Give Slack
        </button>
      </div>
    </div>

    <p class="rh-line-cue" role="status" aria-live="polite">
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
const stageLabel = computed(
  () =>
    ({
      CAST: 'I · Cast',
      HOOK: 'II · Hook',
      REEL: 'III · Reel',
      LANDED: 'Landed',
      ESCAPED: 'Escaped',
    })[props.encounter.stage],
)
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

function press() {
  if (props.encounter.stage === 'CAST' || props.encounter.stage === 'HOOK')
    emit('stop', marker.value)
  else if (props.encounter.stage === 'REEL') tap()
}

function slack() {
  if (props.encounter.stage === 'REEL') release()
}

defineExpose({ press, slack })

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
.rh-line {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.8rem 0.9rem 0.85rem;
}
.rh-line-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.rh-line-eyebrow {
  color: var(--rh-vermilion);
  font-size: 0.7rem;
  font-variant: small-caps;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.rh-line-title {
  color: var(--rh-lapis);
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.15;
}
.rh-line-stage {
  flex: none;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--rh-lapis);
  color: var(--rh-gold-hi);
  font-size: 0.72rem;
  font-weight: 700;
}
.rh-line-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.rh-line-hint {
  font-size: 0.85rem;
  font-style: italic;
}
.rh-marker {
  position: relative;
  display: block;
  height: 3rem;
  width: 100%;
  overflow: hidden;
  border: 0;
  border-radius: 0.3rem;
  background: rgb(42 28 16 / 0.86);
  cursor: pointer;
  box-shadow:
    inset 0 0 0 2px var(--rh-gold),
    inset 0 0 0 3px var(--rh-gold-lo);
}
.rh-marker:focus-visible {
  outline: 3px solid var(--rh-gold-hi);
  outline-offset: 2px;
}
.rh-marker-sweet {
  position: absolute;
  inset: 3px auto 3px 28%;
  width: 44%;
  background: var(--rh-gilt);
  opacity: 0.75;
}
.rh-marker-needle {
  position: absolute;
  inset: 0 auto;
  width: 0.4rem;
  transform: translateX(-50%);
  background: var(--rh-vermilion);
  box-shadow:
    0 0 0 1.5px var(--rh-vellum),
    0 0 8px #000;
}
.rh-tension {
  display: grid;
  gap: 0.25rem;
}
.rh-tension-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-variant: small-caps;
  font-weight: 700;
}
.rh-tension-track,
.rh-landed-track {
  position: relative;
  display: block;
  height: 1rem;
  border-radius: 999px;
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    0 0 0 2px var(--rh-gold);
}
.rh-tension-track {
  background: linear-gradient(
    90deg,
    var(--rh-verdigris),
    var(--rh-ochre) 55%,
    var(--rh-vermilion) 80%,
    #4a120c
  );
}
.rh-tension-needle {
  position: absolute;
  top: -0.3rem;
  bottom: -0.3rem;
  width: 0.35rem;
  transform: translateX(-50%);
  border-radius: 0.2rem;
  background: var(--rh-vellum);
  box-shadow:
    0 0 0 1.5px var(--rh-ink),
    0 2px 4px #000a;
  transition: left 0.2s ease;
}
.rh-landed-track {
  overflow: hidden;
  height: 0.55rem;
  background: rgb(42 28 16 / 0.82);
}
.rh-landed-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--rh-lapis);
  transition: width 0.2s ease;
}
.rh-line-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}
.rh-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 3rem;
  padding: 0.3rem 0.5rem;
  border: 0;
  border-radius: 0.3rem;
  background: linear-gradient(180deg, var(--rh-vellum), var(--rh-vellum-2));
  color: var(--rh-ink);
  font-family: var(--rh-chronicle);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 3px var(--rh-gold),
    0 3px 8px #0007;
}
.rh-action:active {
  transform: translateY(1px);
}
.rh-action:focus-visible {
  outline: 3px solid var(--rh-gold-hi);
  outline-offset: 1px;
}
.rh-action[data-urgent='true'] {
  background: linear-gradient(180deg, #f2cdb9, #d9917a);
}
.rh-line-cue {
  padding: 0.4rem 0.55rem;
  border-left: 3px solid var(--rh-vermilion);
  background: rgb(255 250 235 / 0.35);
  font-size: 0.82rem;
  font-style: italic;
}
@media (prefers-reduced-motion: reduce) {
  .rh-tension-needle,
  .rh-landed-fill {
    transition: none;
  }
}
</style>
