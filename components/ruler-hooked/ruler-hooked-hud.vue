<!-- The console's painted HUD: title crest + kingdom health on the left,
     coin / day / time-of-day plaques on the right, and the crown menu
     (Chronicle, Saves). Sits over the screen's painting, never beside it. -->
<template>
  <div class="rh-hud">
    <div class="rh-hud__left">
      <button
        type="button"
        class="rh-crest"
        :aria-expanded="healthOpen"
        aria-controls="rh-health"
        @click="healthOpen = !healthOpen"
      >
        <span class="rh-crest__title">
          <span class="rh-crest__the">The</span>
          Ruler <em>is</em> Hooked
        </span>
      </button>
      <section
        id="rh-health"
        class="rh-panel rh-health"
        :class="{ 'is-open': healthOpen }"
        aria-label="Kingdom health"
      >
        <h2 class="rh-health__title">Kingdom Health</h2>
        <ul>
          <li
            v-for="axis in axes"
            :key="axis.key"
            :title="`${axis.label}: ${axis.value}%`"
          >
            <RulerHookedGlyph :name="axis.key" />
            <span class="rh-health__label">{{ axis.label }}</span>
            <span class="rh-health__value">{{ axis.value }}%</span>
            <span class="rh-health__bar" aria-hidden="true">
              <span
                :style="{ width: axis.value + '%', background: axis.color }"
              />
            </span>
          </li>
        </ul>
      </section>
    </div>

    <div class="rh-hud__right">
      <span class="rh-plaque" title="Royal purse">
        <RulerHookedGlyph name="coin" />
        <span class="sr-only">Coins:</span>{{ coins.toLocaleString() }}
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
import {
  AXIS_KEYS,
  type AxisKey,
  type KingdomHealth,
  type TimeKey,
} from '~/types/ruler-hooked'
import { TIME_LABEL } from '~/utils/rulerHooked/artLibrary'

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

const LABEL: Record<AxisKey, string> = {
  nature: 'Nature',
  prosperity: 'Prosperity',
  treasury: 'Treasury',
  joy: 'Joy',
  order: 'Order',
}
const COLOR: Record<AxisKey, string> = {
  nature: 'linear-gradient(90deg,#3f7d2e,#8cc860)',
  prosperity: 'linear-gradient(90deg,#b07a1c,#ecc25a)',
  treasury: 'linear-gradient(90deg,#a86a12,#f3d070)',
  joy: 'linear-gradient(90deg,#b8344f,#f08aa0)',
  order: 'linear-gradient(90deg,#4b55a3,#9eb0ec)',
}
const axes = computed(() =>
  AXIS_KEYS.map((key) => ({
    key,
    label: LABEL[key],
    color: COLOR[key],
    value: Math.round(props.health[key] ?? 0),
  })),
)
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
.rh-hud__left {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: min(16rem, 46%);
}
.rh-hud__right {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
}
.rh-crest {
  text-align: left;
  padding: 0.3rem 0.75rem 0.4rem;
  border-radius: 0.9rem 0.9rem 0.9rem 0.3rem;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 40%),
    var(--rh-plum);
  border: 1.5px solid var(--rh-gold);
  box-shadow:
    0 0 0 3px rgb(59 21 48 / 0.55),
    0 6px 14px rgb(0 0 0 / 0.35);
  color: var(--rh-gold-soft);
  cursor: pointer;
}
.rh-crest__title {
  display: block;
  font-family: var(--rh-display);
  font-weight: 700;
  font-size: clamp(0.95rem, 2.6cqi, 1.45rem);
  line-height: 1;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 0 rgb(0 0 0 / 0.45);
  white-space: nowrap;
}
.rh-crest__the {
  display: block;
  font-size: 0.55em;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.85;
}
.rh-crest em {
  font-style: italic;
  font-size: 0.8em;
  color: #fff1c9;
}
.rh-health {
  display: none;
  padding: 0.55rem 0.7rem 0.65rem;
  font-size: 0.8rem;
}
.rh-health.is-open {
  display: block;
}
@container rhconsole (min-width: 900px) {
  .rh-health {
    display: block;
  }
}
.rh-health__title {
  font-family: var(--rh-display);
  color: var(--rh-gold-soft);
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 0.35rem;
  border-bottom: 1px solid rgb(217 164 65 / 0.35);
  padding-bottom: 0.2rem;
}
.rh-health ul {
  display: grid;
  gap: 0.3rem;
}
.rh-health li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'g l v' 'g b b';
  column-gap: 0.4rem;
  align-items: center;
  color: #fbeed3;
}
.rh-health li > :first-child {
  grid-area: g;
  width: 1.6rem;
  height: 1.6rem;
}
.rh-health__label {
  grid-area: l;
  font-weight: 600;
}
.rh-health__value {
  grid-area: v;
  font-variant-numeric: tabular-nums;
  opacity: 0.9;
}
.rh-health__bar {
  grid-area: b;
  height: 0.4rem;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.45);
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.5);
  overflow: hidden;
}
.rh-health__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 600ms ease;
}
.rh-plaque {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.5rem;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #4d1d40, var(--rh-plum-deep));
  border: 1.5px solid var(--rh-gold);
  box-shadow:
    0 0 0 2px rgb(37 11 31 / 0.6),
    0 4px 10px rgb(0 0 0 / 0.35);
  color: #fff3d6;
  font-family: var(--rh-display);
  font-weight: 700;
  font-size: clamp(0.85rem, 1.8cqi, 1.1rem);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rh-plaque :deep(.rh-glyph) {
  width: 1.4em;
  height: 1.4em;
}
.rh-plaque--menu {
  padding: 0.25rem 0.55rem;
  cursor: pointer;
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
  color: #fbeed3;
  font-weight: 600;
}
.rh-menu__list button:hover,
.rh-menu__list button:focus-visible {
  background: rgb(217 164 65 / 0.2);
}
</style>
