<!-- The console's bottom deck: five painted vignette tabs (Lake, Map, Court,
     Gear, Fishopedia) between L and R bumpers, and on wide consoles the
     button-prompt footer (t-054). Flat indigo under a spectrum rule, bold
     outlines and dark label bands; the deck takes the reign's tier. -->
<template>
  <nav class="rh-nav" aria-label="Ruler Hooked screens">
    <button
      type="button"
      class="rh-bumper"
      aria-label="Previous screen (Q)"
      aria-keyshortcuts="Q"
      @click="emit('update:modelValue', stepTab(current, -1))"
    >
      L
    </button>
    <button
      v-for="tab in TABS"
      :key="tab.id"
      type="button"
      class="rh-tab"
      :class="{
        'is-active': modelValue === tab.id,
        'is-pointed': pointed === tab.id,
      }"
      :aria-current="modelValue === tab.id ? 'page' : undefined"
      :data-testid="`rh-tab-${tab.id}`"
      @click="emit('update:modelValue', tab.id)"
    >
      <RulerHookedArt
        class="rh-tab__art"
        :candidates="TAB_ART[tab.id] ?? []"
        :position="tab.position"
      />
      <span class="rh-tab__label">{{ tab.label }}</span>
      <span
        v-if="badges[tab.id]"
        class="rh-tab__badge"
        :aria-label="`${tab.label} needs you`"
        >!</span
      >
    </button>
    <button
      type="button"
      class="rh-bumper"
      aria-label="Next screen (E)"
      aria-keyshortcuts="E"
      @click="emit('update:modelValue', stepTab(current, 1))"
    >
      R
    </button>
    <footer v-if="prompts.length" class="rh-prompts" aria-hidden="true">
      <span v-for="hint in prompts" :key="hint.key" class="rh-prompt">
        <kbd class="rh-key">{{ hint.key }}</kbd>
        {{ hint.label }}
      </span>
    </footer>
  </nav>
</template>

<script setup lang="ts">
import { TAB_ART } from '~/utils/rulerHooked/artLibrary'
import {
  CONSOLE_TABS,
  stepTab,
  type ConsoleTab,
} from '~/utils/rulerHooked/console'
import type { ConsoleScreen } from '~/utils/rulerHooked/tutorial'

const props = withDefaults(
  defineProps<{
    modelValue: ConsoleScreen
    badges: Partial<Record<ConsoleScreen, boolean>>
    pointed?: ConsoleScreen | null
    prompts?: { key: string; label: string }[]
  }>(),
  { pointed: null, prompts: () => [] },
)
const emit = defineEmits<{ 'update:modelValue': [screen: ConsoleScreen] }>()

const POSITION: Record<ConsoleTab, string> = {
  lake: 'center 70%',
  map: 'center 45%',
  court: 'center 35%',
  gear: 'center',
  fishopedia: '62% center',
}
const TABS = CONSOLE_TABS.map((t) => ({ ...t, position: POSITION[t.id] }))
const current = computed<ConsoleTab>(() =>
  TABS.some((t) => t.id === props.modelValue)
    ? (props.modelValue as ConsoleTab)
    : 'lake',
)
</script>

<style scoped>
.rh-nav {
  position: relative;
  z-index: 30;
  display: grid;
  grid-template-columns: auto repeat(5, minmax(0, 1fr)) auto;
  align-items: stretch;
  gap: clamp(0.25rem, 1cqi, 0.6rem);
  padding: 0.55rem clamp(0.35rem, 1.5cqi, 1rem) 0.55rem;
  background:
    var(--rh-spectrum) top / 100% 4px no-repeat,
    var(--rh-plum-deep);
  box-shadow: 0 -6px 18px rgb(0 0 0 / 0.35);
}
@container rhconsole (min-width: 900px) {
  .rh-nav {
    grid-template-columns: auto repeat(5, minmax(0, 8.5rem)) auto minmax(
        0,
        1fr
      );
    justify-content: start;
  }
}
.rh-tab {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 3.75rem;
  height: clamp(3.75rem, 10cqi, 6rem);
  border-radius: 0.6rem;
  overflow: hidden;
  border: 2px solid var(--rh-gold);
  background: var(--rh-plum-deep);
  box-shadow: 2px 2px 0 var(--rh-plum);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
  cursor: pointer;
}
.rh-tab:hover {
  transform: translateY(-2px);
}
.rh-tab:focus-visible,
.rh-bumper:focus-visible {
  outline: 3px solid var(--rh-gold-soft);
  outline-offset: 2px;
}
.rh-tab__art {
  position: absolute !important;
  inset: 0;
  opacity: 0.78;
  transition: opacity 160ms ease;
}
.rh-console[data-tier='strained'] .rh-tab__art {
  filter: saturate(1.3) hue-rotate(22deg);
}
.rh-console[data-tier='rotten'] .rh-tab__art {
  filter: saturate(1.5) hue-rotate(-30deg) contrast(1.12);
}
.rh-tab.is-active .rh-tab__art,
.rh-tab:hover .rh-tab__art {
  opacity: 1;
}
.rh-tab__label {
  position: relative;
  grid-row: 2;
  padding: 0.2rem 0.2rem 0.25rem;
  background: color-mix(in oklab, var(--rh-plum-deep) 88%, transparent);
  color: #fff;
  font-family: var(--rh-display);
  font-weight: 800;
  font-size: clamp(0.7rem, 2cqi, 1.1rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: skewX(calc(var(--rh-warp) * 5));
}
.rh-tab.is-active {
  transform: translateY(-3px);
  border-color: var(--rh-gold-soft);
  box-shadow:
    3px 3px 0 var(--rh-hot),
    0 0 0 2px var(--rh-plum-deep);
}
.rh-tab.is-active .rh-tab__label {
  background: var(--rh-gold-soft);
  color: var(--rh-ink);
}
.rh-tab.is-pointed {
  animation: rh-tab-pulse 1.6s ease-in-out infinite;
}
@keyframes rh-tab-pulse {
  50% {
    box-shadow:
      0 0 0 3px var(--rh-gold-soft),
      0 0 22px color-mix(in oklab, var(--rh-gold-soft) 80%, transparent);
  }
}
.rh-tab__badge {
  position: absolute;
  top: 0.3rem;
  right: 0.35rem;
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: var(--rh-hot);
  border: 2px solid var(--rh-ink);
  color: var(--rh-ink);
  font-weight: 900;
  font-size: 0.8rem;
}
.rh-bumper {
  align-self: center;
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border: 2px solid var(--rh-ink);
  border-radius: 0.5rem 0.5rem 0.9rem 0.9rem;
  background: var(--rh-parch);
  color: var(--rh-ink);
  font-family: var(--rh-display);
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--rh-gold);
}
.rh-bumper:hover {
  transform: translateY(-1px);
}
.rh-prompts {
  display: none;
}
@container rhconsole (min-width: 900px) {
  .rh-prompts {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    padding: 0 0.4rem;
    color: #fff;
    font-family: var(--rh-display);
    font-size: 0.95rem;
    font-weight: 800;
  }
}
.rh-prompt {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}
.rh-key {
  display: inline-grid;
  place-items: center;
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--rh-gold-soft);
  border: 2px solid var(--rh-ink);
  color: var(--rh-ink);
  font-family: var(--rh-display);
  font-size: 0.8rem;
  font-weight: 900;
  box-shadow: 2px 2px 0 var(--rh-hot);
}
@container rhconsole (max-width: 460px) {
  .rh-nav {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .rh-bumper {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rh-tab,
  .rh-tab.is-pointed {
    animation: none;
    transition: none;
  }
}
</style>
