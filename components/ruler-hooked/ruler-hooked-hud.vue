<!-- The console's painted HUD (t-054 restyle of the inline realm HUD, in the
     section 10 rainbow lock): the title badge, the four kingdom meters
     (Hearts, Nature, Prosperity, Order) and the coin/day/time capsules share
     ONE compact top row. Treasury rides the coin capsule. The meters only
     open as a flyout on narrow viewports when explicitly requested, so a
     court presenter or an illustrated choice is never hidden by the default
     HUD. The chrome is flat dark ink with bold spectrum outlines and takes
     the reign's tier from the console (data-tier): the accents clash and warp
     when strained and turn chartreuse and hot pink when rotten. -->
<template>
  <div class="rh-hud">
    <div class="rh-crest" role="banner">
      <svg
        class="rh-crest__crown"
        viewBox="0 0 24 16"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M2 14 L3 4 L8 9 L12 2 L16 9 L21 4 L22 14 Z" />
      </svg>
      <span class="rh-crest__title"> The Ruler <em>is</em> Hooked </span>
    </div>

    <div class="rh-hud__health">
      <button
        type="button"
        class="rh-health__compact rh-plaque"
        :aria-expanded="healthOpen"
        aria-controls="rh-health"
        aria-label="Show kingdom health"
        @click="healthOpen = !healthOpen"
      >
        <RulerHookedGlyph :name="lowest.key" />
        <span class="rh-health__compact-label">Realm</span>
        <span class="rh-health__compact-value">{{ lowest.value }}%</span>
      </button>
      <section
        id="rh-health"
        class="rh-health"
        :class="{ 'is-open': healthOpen }"
        aria-label="Kingdom health"
      >
        <h2 class="sr-only">Kingdom Health</h2>
        <ul>
          <li
            v-for="axis in axes"
            :key="axis.key"
            :data-axis="axis.key"
            :data-low="axis.value <= 30 ? 'true' : undefined"
            :title="`${axis.label}: ${axis.value}%`"
            role="progressbar"
            :aria-label="axis.label"
            :aria-valuenow="axis.value"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span class="rh-health__roundel">
              <RulerHookedGlyph :name="axis.key" />
            </span>
            <span class="rh-health__label">{{ axis.label }}</span>
            <span class="rh-health__value">{{ axis.value }}%</span>
            <span class="rh-health__bar" aria-hidden="true">
              <span :style="{ width: axis.value + '%' }" />
            </span>
          </li>
        </ul>
      </section>
    </div>

    <div class="rh-hud__right">
      <span
        class="rh-plaque rh-plaque--coins"
        :title="`Royal purse · Treasury ${treasury}%`"
      >
        <RulerHookedGlyph name="coin" />
        <span class="sr-only">Coins:</span>{{ coins.toLocaleString() }}
        <span class="sr-only">, treasury {{ treasury }}%</span>
        <span class="rh-plaque__meter" aria-hidden="true">
          <span :style="{ width: treasury + '%' }" />
        </span>
      </span>
      <span class="rh-plaque" title="Day of the reign">
        <RulerHookedGlyph name="calendar" />Day {{ day }}
      </span>
      <span
        class="rh-plaque rh-plaque--time"
        title="Time of day: it only moves when you fish"
      >
        <RulerHookedGlyph
          :name="time === 'night' || time === 'dusk' ? 'moon' : 'sun'"
        />
        {{ timeLabel }}
      </span>
      <div class="rh-menu">
        <button
          type="button"
          class="rh-plaque rh-plaque--menu"
          :aria-expanded="menuOpen"
          aria-label="Royal menu"
          @click="menuOpen = !menuOpen"
        >
          <RulerHookedGlyph name="crown" />
        </button>
        <div v-if="menuOpen" class="rh-panel rh-menu__list" role="menu">
          <button type="button" role="menuitem" @click="pick('chronicle')">
            Chronicle of the reign
          </button>
          <button type="button" role="menuitem" @click="pick('saves')">
            Saves &amp; new reign
          </button>
          <button type="button" role="menuitem" @click="pick('settings')">
            Fishing settings
          </button>
          <button
            v-if="lessonsLeft"
            type="button"
            role="menuitem"
            @click="skipLessons"
          >
            Skip Quill's lessons
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KingdomHealth, TimeKey } from '~/types/ruler-hooked'
import { TIME_LABEL } from '~/utils/rulerHooked/artLibrary'
import { AXIS_LABEL, METER_AXES } from '~/utils/rulerHooked/console'

const props = defineProps<{
  health: KingdomHealth
  coins: number
  day: number
  time: TimeKey
  lessonsLeft: number
}>()
const emit = defineEmits<{
  navigate: ['chronicle' | 'saves' | 'settings']
  skipTutorial: []
}>()

const healthOpen = ref(false)
const menuOpen = ref(false)

const axes = computed(() =>
  METER_AXES.map((key) => ({
    key,
    label: AXIS_LABEL[key],
    value: Math.round(props.health[key] ?? 0),
  })),
)
const lowest = computed(
  () =>
    [...axes.value].sort((a, b) => a.value - b.value)[0] ?? {
      key: 'nature' as const,
      value: 0,
    },
)
const treasury = computed(() => Math.round(props.health.treasury ?? 0))
const timeLabel = computed(() => TIME_LABEL[props.time])

function skipLessons() {
  menuOpen.value = false
  emit('skipTutorial')
}
function pick(screen: 'chronicle' | 'saves' | 'settings') {
  menuOpen.value = false
  emit('navigate', screen)
}
</script>

<style scoped>
.rh-hud {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  pointer-events: none;
}
.rh-hud > * {
  pointer-events: auto;
}
.rh-hud__health {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: center;
  position: relative;
}
.rh-health__compact {
  display: none !important;
}
.rh-hud__right {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 0.35rem;
}

/* The title badge: flat ink, a bold cyan outline and a screenprint offset. */
.rh-crest {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem 0.4rem 0.55rem;
  border-radius: 0.7rem;
  background: var(--rh-plum-deep);
  border: 2px solid var(--rh-gold);
  box-shadow: 3px 3px 0 var(--rh-hot);
  color: #fff;
  flex: 0 1 auto;
  min-width: 0;
  rotate: var(--rh-warp);
}
.rh-crest__crown {
  flex: none;
  width: 1.35rem;
  height: 0.95rem;
  fill: var(--rh-gold-soft);
  stroke: var(--rh-hot);
  stroke-width: 1.4;
  stroke-linejoin: round;
}
.rh-crest__title {
  display: block;
  font-family: var(--rh-display);
  font-weight: 900;
  font-size: clamp(0.95rem, 2.4cqi, 1.4rem);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  text-shadow: var(--rh-echo);
}
.rh-crest em {
  font-style: italic;
  font-size: 0.8em;
  color: var(--rh-gold-soft);
}

/* The four kingdom meters: a ringed roundel, label, value and a flat bar. */
.rh-health {
  display: block;
  width: min(100%, 37rem);
  padding: 0.4rem 0.7rem 0.45rem;
  border-radius: 0.7rem;
  background: color-mix(in oklab, var(--rh-plum-deep) 92%, transparent);
  border: 2px solid var(--rh-gold);
  box-shadow: 3px 3px 0 var(--rh-plum);
  color: #fff;
}
.rh-health ul {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
  align-items: center;
}
.rh-health li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'g l v' 'g b b';
  gap: 0.1rem 0.35rem;
  align-items: center;
  min-width: 0;
  font-size: 0.72rem;
}
.rh-health li[data-axis='joy'] {
  --meter-ink: var(--rh-magenta);
}
.rh-health li[data-axis='nature'] {
  --meter-ink: var(--rh-green);
}
.rh-health li[data-axis='prosperity'] {
  --meter-ink: var(--rh-orange);
}
.rh-health li[data-axis='order'] {
  --meter-ink: var(--rh-violet);
}
.rh-health__roundel {
  grid-area: g;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: var(--rh-parch);
  box-shadow: 0 0 0 2.5px var(--meter-ink);
}
.rh-health__roundel :deep(.rh-glyph) {
  width: 1.15rem;
  height: 1.15rem;
}
.rh-health__label {
  grid-area: l;
  font-family: var(--rh-display);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-health__value {
  grid-area: v;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.rh-health li[data-low='true'] .rh-health__value {
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--rh-hot);
  color: var(--rh-ink);
}
.rh-health__bar {
  grid-area: b;
  position: relative;
  height: 0.45rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.16);
  overflow: hidden;
}
.rh-health__bar span {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: var(--meter-ink);
  transition: width 600ms ease;
}
@container rhconsole (max-width: 899px) {
  .rh-health__compact {
    display: inline-flex !important;
  }
  .rh-health {
    display: none;
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 50%;
    translate: -50% 0;
    width: min(26rem, calc(100vw - 1rem));
    z-index: 31;
  }
  .rh-health ul {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rh-health.is-open {
    display: block;
  }
}
@container rhconsole (max-width: 560px) {
  .rh-hud {
    gap: 0.25rem;
    padding: 0.35rem;
  }
  .rh-crest {
    flex: none;
    padding: 0.25rem 0.4rem;
    border-radius: 0.5rem;
    box-shadow: 2px 2px 0 var(--rh-hot);
  }
  .rh-crest__crown {
    display: none;
  }
  .rh-crest__title {
    font-size: 0.74rem;
    white-space: normal;
    max-width: 4.8rem;
  }
  .rh-hud .rh-plaque {
    gap: 0.2rem;
    min-height: 2rem;
    padding: 0.15rem 0.45rem;
    font-size: 0.74rem;
  }
  .rh-hud .rh-plaque :deep(.rh-glyph) {
    width: 1.15em;
    height: 1.15em;
  }
  .rh-hud .rh-health__compact {
    padding: 0.15rem 0.35rem;
  }
  .rh-health__compact-label {
    display: none;
  }
  .rh-hud__right {
    gap: 0.2rem;
  }
}

/* HUD capsules: flat ink pills with a cyan outline. */
.rh-plaque {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.4rem;
  padding: 0.25rem 0.85rem;
  border-radius: 999px;
  background: var(--rh-plum-deep);
  border: 2px solid var(--rh-gold);
  box-shadow: 2px 2px 0 var(--rh-plum);
  color: #fff;
  font-family: var(--rh-display);
  font-weight: 800;
  font-size: clamp(0.85rem, 1.8cqi, 1.05rem);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rh-plaque :deep(.rh-glyph) {
  width: 1.4em;
  height: 1.4em;
}
.rh-plaque__meter {
  position: absolute;
  left: 1.1rem;
  right: 1.1rem;
  bottom: 0.2rem;
  height: 3px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.2);
  overflow: hidden;
}
.rh-plaque__meter span {
  display: block;
  height: 100%;
  background: var(--rh-gold-soft);
}
.rh-plaque--menu {
  padding: 0.25rem 0.55rem;
  cursor: pointer;
}
.rh-plaque--menu:focus-visible,
.rh-health__compact:focus-visible {
  outline: 3px solid var(--rh-gold-soft);
  outline-offset: 2px;
}
.rh-health__compact-value {
  font-variant-numeric: tabular-nums;
}
.rh-health__compact :deep(.rh-glyph) {
  padding: 0.1em;
  border-radius: 999px;
  background: var(--rh-parch);
}
@container rhconsole (max-width: 560px) {
  .rh-plaque--time {
    display: none;
  }
}
.rh-menu {
  position: relative;
}
.rh-menu__list {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  display: grid;
  min-width: 13rem;
  padding: 0.35rem;
}
.rh-menu__list button {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  color: #f4faff;
  font-weight: 700;
}
.rh-menu__list button:hover,
.rh-menu__list button:focus-visible {
  background: rgb(43 238 211 / 0.2);
}
</style>
