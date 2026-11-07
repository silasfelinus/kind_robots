<!-- A proper one-input fishing fight. The existing deterministic fishing engine
     resolves every stop against fish/rarity/gear-dependent zones, including
     patience and reversal species. No REEL/SLACK web-app action buttons. -->
<template>
  <section class="rh-fishing" aria-labelledby="rh-fishing-title">
    <header class="rh-fishing__header">
      <RulerHookedArt
        class="rh-fishing__portrait"
        :candidates="fishCandidates(encounter.fishSlug)"
        :initial="encounter.fishName.charAt(0)"
        :alt="encounter.fishName"
        fit="cover"
      />
      <div class="rh-fishing__intro">
        <p class="rh-eyebrow">A bite on the line · {{ rarityLabel }}</p>
        <h2 id="rh-fishing-title" class="rh-fishing__name">
          {{ encounter.fishName }}
        </h2>
        <p class="rh-fishing__behavior">{{ encounter.catchBehavior }}</p>
      </div>
      <span class="rh-fishing__beat"
        >{{ encounter.beat + 1 }} / {{ encounter.maxBeats }}</span
      >
    </header>

    <button
      type="button"
      class="rh-fishing__playfield"
      :class="{ 'is-surge': suddenShift, 'is-reversed': encounter.reversed }"
      :aria-label="playfieldLabel"
      @click="stop"
    >
      <span class="rh-fishing__surface" aria-hidden="true">
        <svg
          class="rh-fishing__waterlines"
          viewBox="0 0 600 130"
          preserveAspectRatio="none"
        >
          <path d="M-40 22 Q80 0 180 24 T400 26 T660 16" />
          <path d="M-20 64 Q70 42 190 66 T420 64 T640 59" />
          <path d="M-10 104 Q95 80 210 105 T430 102 T650 105" />
        </svg>
        <span class="rh-fishing__ripple" :style="{ left: marker + '%' }" />
        <span class="rh-fishing__bobber" :style="{ left: marker + '%' }" />
        <span v-if="suddenShift" class="rh-fishing__surge-tag"
          >FISH SURGES!</span
        >
      </span>
      <span class="rh-fishing__target-name">{{ aimLabel }}</span>
      <span class="rh-fishing__track" aria-hidden="true">
        <span
          class="rh-fishing__zone rh-fishing__zone--slack"
          :style="{ width: profile.bandStart + '%' }"
        />
        <span
          class="rh-fishing__zone rh-fishing__zone--reel"
          :style="{
            left: profile.bandStart + '%',
            width: profile.bandWidth + '%',
          }"
        />
        <span
          class="rh-fishing__zone rh-fishing__zone--wait"
          :style="{
            left: profile.bandStart + profile.bandWidth + '%',
            right: 0,
          }"
        />
        <span
          class="rh-fishing__sweetspot"
          :style="{ left: aimStart + '%', width: aimWidth + '%' }"
        />
        <span class="rh-fishing__needle" :style="{ left: marker + '%' }">
          <span class="rh-fishing__needle-core" />
        </span>
      </span>
      <span class="rh-fishing__instruction">
        <strong>SPACE</strong> / CLICK / TAP
        <span aria-hidden="true">✦</span> STOP THE BOBBER
      </span>
    </button>

    <div class="rh-fishing__gauges" aria-label="Fishing status">
      <div class="rh-fishing__gauge">
        <span
          ><strong>Fish in</strong><b>{{ encounter.progress }}%</b></span
        >
        <div
          class="rh-fishing__meter rh-fishing__meter--progress"
          role="progressbar"
          aria-label="Fish caught progress"
          :aria-valuenow="encounter.progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <i :style="{ width: encounter.progress + '%' }" />
        </div>
      </div>
      <div class="rh-fishing__gauge rh-fishing__gauge--tension">
        <span
          ><strong>Tension</strong><b>{{ encounter.tension }}%</b></span
        >
        <div
          class="rh-fishing__meter rh-fishing__meter--tension"
          :class="{ 'is-danger': encounter.tension >= 75 }"
          role="progressbar"
          aria-label="Line tension"
          :aria-valuenow="encounter.tension"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <i
            class="rh-fishing__tension-needle"
            :style="{ left: encounter.tension + '%' }"
          />
        </div>
      </div>
      <p class="rh-fishing__prompt" :data-aim="aimAction" aria-live="polite">
        <kbd class="rh-fishing__key">A</kbd>
        <span>{{ FIGHT_PROMPT[aimAction] }}</span>
      </p>
    </div>

    <p class="rh-fishing__cue" role="status" aria-live="polite">
      {{ encounter.cue }}
    </p>
  </section>
</template>

<script setup lang="ts">
import type { FishingEncounter } from '~/utils/rulerHooked/encounter'
import {
  FIGHT_PROMPT,
  fightAim,
  timingProfileFor,
} from '~/utils/rulerHooked/timingBar'
import { fishCandidates } from '~/utils/rulerHooked/artLibrary'

const props = defineProps<{ encounter: FishingEncounter }>()
const emit = defineEmits<{ stop: [position: number] }>()

const marker = ref(0)
const profile = computed(() => timingProfileFor(props.encounter))
const rarityLabel = computed(() => props.encounter.rarity.toLowerCase())
const suddenShift = computed(
  () =>
    props.encounter.phase === 'FIGHT' &&
    props.encounter.beat > 0 &&
    props.encounter.beat % 3 === 2,
)
const aimAction = computed(() => fightAim(props.encounter))
const aimLabel = computed(() => {
  if (props.encounter.phase === 'APPROACH')
    return 'A wary fish. Wait for the right moment.'
  if (props.encounter.reversed)
    return 'The current reverses! Follow the highlighted water.'
  if (props.encounter.tension >= 70) return 'The line is taut. Let it breathe.'
  return suddenShift.value
    ? 'It darted! Follow the new bright patch.'
    : 'Aim for the luminous current to pull it closer.'
})
const aimStart = computed(() => {
  const band = profile.value
  if (aimAction.value === 'SLACK') return Math.max(0, band.bandStart - 14)
  if (aimAction.value === 'WAIT')
    return Math.min(91, band.bandStart + band.bandWidth + 5)
  return band.bandStart
})
const aimWidth = computed(() =>
  aimAction.value === 'REEL' ? profile.value.bandWidth : 10,
)
const playfieldLabel = computed(
  () =>
    `Fishing ${props.encounter.fishName}. ${aimLabel.value} Press Space, Enter, or click to stop the sweeping bobber.`,
)

let startedAt = 0
let frame: number | null = null
let lastStop = 0
function tick(time: number) {
  if (!startedAt) startedAt = time
  const fraction =
    ((time - startedAt) % (profile.value.sweepMs * 2)) / profile.value.sweepMs
  marker.value = Math.max(
    0,
    Math.min(100, (fraction <= 1 ? fraction : 2 - fraction) * 100),
  )
  frame = requestAnimationFrame(tick)
}
function stop() {
  const now = performance.now()
  if (now - lastStop < 160) return
  lastStop = now
  emit('stop', Math.round(marker.value * 10) / 10)
}
defineExpose({ stop })
function keydown(event: KeyboardEvent) {
  if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) return
  const target = event.target
  if (
    target instanceof HTMLElement &&
    target.closest('button, a, input, textarea, select, [role="textbox"]')
  )
    return
  event.preventDefault()
  stop()
}
watch(
  () => [props.encounter.beat, props.encounter.phase],
  () => {
    startedAt = 0
    marker.value = 0
  },
)
onMounted(() => {
  window.addEventListener('keydown', keydown)
  frame = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', keydown)
  if (frame !== null) cancelAnimationFrame(frame)
})
</script>

<style scoped>
.rh-fishing {
  display: grid;
  gap: 0.5rem;
  width: 100%;
  color: #fff6da;
  border: 2px solid var(--rh-gold);
  border-radius: 1.15rem;
  padding: clamp(0.55rem, 1.5cqi, 0.9rem);
  background: linear-gradient(
    155deg,
    rgb(25 53 69 / 0.95),
    rgb(17 30 46 / 0.94)
  );
  box-shadow:
    0 0 0 3px var(--rh-plum),
    0 14px 35px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(8px);
}
.rh-fishing .rh-eyebrow {
  color: var(--rh-gold-soft, #ffe75d);
}
.rh-fishing__header {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  min-width: 0;
}
.rh-fishing__portrait {
  width: clamp(3.5rem, 10cqi, 6rem);
  aspect-ratio: 4 / 3;
  flex: none;
  border: 1px solid var(--rh-gold);
  border-radius: 0.6rem;
  overflow: hidden;
}
.rh-fishing__intro {
  min-width: 0;
  flex: 1;
}
.rh-fishing__name {
  font-family: var(--rh-display);
  font-weight: 800;
  font-size: clamp(1.05rem, 2.5cqi, 1.65rem);
  line-height: 1.12;
}
.rh-fishing__behavior {
  font-size: 0.75rem;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-fishing__beat {
  flex: none;
  padding: 0.25rem 0.5rem;
  border: 1px solid rgb(255 244 214 / 0.4);
  border-radius: 2rem;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.rh-fishing__playfield {
  display: grid;
  gap: 0.45rem;
  width: 100%;
  padding: 0;
  text-align: center;
  border: 1px solid rgb(255 225 158 / 0.5);
  border-radius: 0.85rem;
  overflow: hidden;
  background: rgb(3 19 32 / 0.55);
  color: #fff8e8;
  cursor: crosshair;
  touch-action: manipulation;
  user-select: none;
}
.rh-fishing__playfield:focus-visible {
  outline: 3px solid #ffdb75;
  outline-offset: 3px;
}
.rh-fishing__surface {
  position: relative;
  display: block;
  height: clamp(4.5rem, 11cqi, 9rem);
  overflow: hidden;
  background: linear-gradient(
    180deg,
    #5f8390 0%,
    #2e627c 34%,
    #16445e 75%,
    #0b324a 100%
  );
}
.rh-fishing__waterlines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: rgb(211 241 233 / 0.4);
  stroke-width: 2.5;
  animation: rh-water-ripple 3s ease-in-out infinite alternate;
}
.rh-fishing__ripple {
  position: absolute;
  bottom: 18%;
  width: 4rem;
  height: 1.1rem;
  border: 2px solid rgb(230 250 223 / 0.65);
  border-radius: 50%;
  transform: translateX(-50%);
  transition: left 35ms linear;
  box-shadow: 0 0 18px rgb(226 250 220 / 0.25);
}
.rh-fishing__bobber {
  position: absolute;
  bottom: 20%;
  width: 1.7rem;
  height: 1.7rem;
  transform: translateX(-50%);
  border: 2px solid #381a16;
  border-radius: 50%;
  background: linear-gradient(180deg, #f44350 0 50%, #fff9ef 50% 100%);
  box-shadow:
    0 2px 12px #071526,
    0 0 0 3px rgb(255 255 255 / 0.2);
  transition: left 35ms linear;
}
.rh-fishing__surge-tag {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  color: #ffe798;
  font-family: var(--rh-display);
  font-weight: 900;
  font-size: 0.85rem;
  text-shadow: 0 2px 4px #000;
  animation: rh-surge 550ms ease-in-out infinite alternate;
}
.rh-fishing__target-name {
  padding: 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
}
.rh-fishing__track {
  position: relative;
  display: block;
  margin: 0 1rem;
  height: 2.5rem;
  border: 2px solid rgb(238 219 176 / 0.65);
  border-radius: 0.55rem;
  background: #163950;
  box-shadow: inset 0 3px 8px rgb(0 0 0 / 0.4);
}
.rh-fishing__zone {
  position: absolute;
  top: 0;
  bottom: 0;
}
.rh-fishing__zone--slack {
  background: linear-gradient(180deg, #3f8490, #18546a);
}
.rh-fishing__zone--reel {
  background: linear-gradient(180deg, #79aa58, #366f43);
  border-inline: 1px solid #c2ef96;
  transition:
    left 170ms ease-out,
    width 170ms ease-out;
}
.rh-fishing__zone--wait {
  background: linear-gradient(180deg, #52728b, #283d66);
}
.rh-fishing__sweetspot {
  position: absolute;
  z-index: 1;
  top: -0.2rem;
  bottom: -0.2rem;
  border: 3px solid #ffe58a;
  border-radius: 0.3rem;
  background: rgb(255 224 128 / 0.15);
  box-shadow:
    0 0 18px rgb(255 231 121 / 0.7),
    inset 0 0 16px rgb(255 230 150 / 0.3);
  transition:
    left 180ms cubic-bezier(0.15, 1.5, 0.55, 1),
    width 180ms ease-out;
}
.rh-fishing__needle {
  position: absolute;
  z-index: 2;
  top: -0.4rem;
  bottom: -0.4rem;
  width: 0.25rem;
  background: #fffaf0;
  border-radius: 0.3rem;
  box-shadow: 0 0 12px #fff2af;
  transform: translateX(-50%);
}
.rh-fishing__needle-core {
  position: absolute;
  top: -0.4rem;
  left: 50%;
  transform: translateX(-50%);
  width: 0.85rem;
  height: 0.85rem;
  background: #f4444b;
  border: 2px solid #fff6d9;
  border-radius: 50%;
}
.rh-fishing__instruction {
  padding: 0.25rem 0.4rem 0.45rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}
.rh-fishing__instruction strong {
  color: #ffda79;
}
.rh-fishing__gauges {
  display: grid;
  grid-template-columns: 1fr 1.25fr auto;
  align-items: end;
  gap: 0.65rem;
}
.rh-fishing__gauge > span {
  display: flex;
  justify-content: space-between;
  gap: 0.3rem;
  font-size: 0.74rem;
  margin-bottom: 0.2rem;
}
.rh-fishing__meter {
  height: 0.65rem;
  overflow: hidden;
  border-radius: 0.4rem;
  background: rgb(1 12 25 / 0.75);
  border: 1px solid rgb(255 249 223 / 0.3);
}
.rh-fishing__meter i {
  display: block;
  height: 100%;
  transition: width 160ms ease-out;
}
.rh-fishing__meter--progress i {
  background: linear-gradient(90deg, #4f8e70, #9ad485);
}
.rh-fishing__meter--tension {
  position: relative;
  height: 0.8rem;
  overflow: visible;
  background: linear-gradient(
    90deg,
    #46db80,
    #c6f432 38%,
    #ffe75d 58%,
    #ffb32b 76%,
    #ef3db4
  );
  border: 2px solid var(--rh-ink, #10133d);
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.45);
}
.rh-fishing__meter--tension .rh-fishing__tension-needle {
  position: absolute;
  top: -0.3rem;
  bottom: -0.3rem;
  width: 0.5rem;
  height: auto;
  translate: -50% 0;
  border-radius: 0.15rem;
  background: #fff;
  box-shadow:
    0 0 0 2px var(--rh-ink, #10133d),
    2px 2px 0 2px var(--rh-hot, #ef3db4);
  transition: left 160ms ease-out;
}
.rh-fishing__meter--tension.is-danger {
  box-shadow:
    inset 0 1px 3px rgb(0 0 0 / 0.45),
    0 0 12px var(--rh-hot, #ef3db4);
}
.rh-fishing__prompt {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.2rem;
  padding: 0.2rem 0.75rem 0.2rem 0.3rem;
  border-radius: 999px;
  background: var(--rh-parch, #e9fff5);
  color: var(--rh-ink, #10133d);
  font-family: var(--rh-display);
  font-weight: 800;
  font-size: 0.9rem;
  white-space: nowrap;
  border: 2px solid var(--rh-ink, #10133d);
  box-shadow: 3px 3px 0 var(--rh-gold, #2beed3);
}
.rh-fishing__prompt[data-aim='SLACK'] {
  background: var(--rh-parch-shade, #ffdaee);
  box-shadow: 3px 3px 0 var(--rh-hot, #ef3db4);
}
.rh-fishing__key {
  display: inline-grid;
  place-items: center;
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 999px;
  background: var(--rh-plum-deep, #080d35);
  color: var(--rh-gold-soft, #ffe75d);
  font-size: 0.8rem;
  font-weight: 900;
  box-shadow: 0 0 0 2px var(--rh-gold, #2beed3);
}
.rh-fishing__cue {
  font-size: 0.76rem;
  line-height: 1.3;
  font-style: italic;
  opacity: 0.9;
}
@keyframes rh-surge {
  to {
    transform: scale(1.08);
    opacity: 0.7;
  }
}
@keyframes rh-water-ripple {
  to {
    transform: translateX(1.5%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rh-fishing__waterlines,
  .rh-fishing__surge-tag {
    animation: none;
  }
  .rh-fishing__zone--reel,
  .rh-fishing__sweetspot {
    transition: none;
  }
}
@container rhconsole (max-width: 560px) {
  .rh-fishing__portrait {
    display: none;
  }
  .rh-fishing__behavior {
    display: none;
  }
  .rh-fishing__surface {
    height: 4.75rem;
  }
  .rh-fishing__instruction {
    font-size: 0.62rem;
  }
  .rh-fishing__gauges {
    grid-template-columns: 1fr 1fr;
  }
  .rh-fishing__prompt {
    grid-column: 1 / -1;
    justify-self: center;
  }
}
</style>
