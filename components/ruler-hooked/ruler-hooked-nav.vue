<!-- The console's bottom deck: five painted vignette tabs (Lake, Map, Court,
     Gear, Fishopedia) between L and R bumpers, and on wide consoles the
     button-prompt footer (t-054). The deck takes the reign's tier. -->
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
  padding: 0.45rem clamp(0.35rem, 1.5cqi, 1rem) 0.55rem;
  background:
    radial-gradient(
      ellipse at 0% 100%,
      rgb(14 10 6 / calc(var(--rh-soot) * 0.8)),
      transparent 40%
    ),
    linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 30%),
    linear-gradient(180deg, var(--rh-lapis), var(--rh-lapis-deep));
  border-top: 2px solid var(--rh-gold);
  box-shadow:
    inset 0 2px 0 var(--rh-gold-lo),
    0 -6px 18px rgb(0 0 0 / 0.35);
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
  border-radius: 0.35rem 0.35rem 0.2rem 0.2rem;
  overflow: hidden;
  border: 0;
  background: var(--rh-lapis-deep);
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 3px var(--rh-gold),
    0 4px 10px rgb(0 0 0 / 0.55);
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
  outline: 3px solid var(--rh-gold-hi);
  outline-offset: 2px;
}
.rh-tab__art {
  position: absolute !important;
  inset: 3px;
  opacity: 0.7;
  filter: saturate(0.8) sepia(0.15);
  transition:
    opacity 160ms ease,
    filter 160ms ease;
}
.rh-console[data-tier='rotten'] .rh-tab__art {
  filter: saturate(0.45) sepia(0.4) brightness(0.8);
}
.rh-tab.is-active .rh-tab__art,
.rh-tab:hover .rh-tab__art {
  opacity: 1;
  filter: none;
}
.rh-tab__label {
  position: relative;
  grid-row: 2;
  margin: 0 3px 3px;
  padding: 0.2rem 0.2rem 0.25rem;
  background: linear-gradient(180deg, var(--rh-vellum), var(--rh-vellum-2));
  border-top: 1.5px solid var(--rh-gold);
  color: var(--rh-ink);
  font-family: var(--rh-display);
  font-weight: 800;
  font-variant: small-caps;
  font-size: clamp(0.7rem, 2cqi, 1.15rem);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rh-tab.is-active {
  transform: translateY(-3px);
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 3px var(--rh-gold-hi),
    0 0 0 2px var(--rh-gold-hi),
    0 0 18px color-mix(in oklab, var(--rh-gold-hi) 60%, transparent);
}
.rh-tab.is-active .rh-tab__label {
  background: linear-gradient(180deg, var(--rh-vermilion), var(--rh-madder));
  color: var(--rh-gold-hi);
}
.rh-tab.is-pointed {
  animation: rh-tab-pulse 1.6s ease-in-out infinite;
}
@keyframes rh-tab-pulse {
  50% {
    box-shadow:
      inset 0 0 0 3px var(--rh-gold-hi),
      0 0 22px color-mix(in oklab, var(--rh-gold-hi) 80%, transparent);
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
  background: radial-gradient(
    circle at 38% 35%,
    #d4554a,
    var(--rh-madder) 55%,
    #5e1712
  );
  border: 1.5px solid var(--rh-gold-hi);
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
}
.rh-bumper {
  align-self: center;
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border: 0;
  border-radius: 0.5rem 0.5rem 0.9rem 0.9rem;
  background: linear-gradient(180deg, var(--rh-vellum), var(--rh-vellum-2));
  color: var(--rh-lapis-deep);
  font-family: var(--rh-display);
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-lo),
    inset 0 0 0 2.5px var(--rh-gold),
    0 3px 8px rgb(0 0 0 / 0.5);
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
    color: var(--rh-vellum);
    font-family: var(--rh-display);
    font-size: 0.95rem;
    font-weight: 700;
    text-shadow: 0 1px 3px #000;
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
  background: radial-gradient(
    circle at 40% 35%,
    var(--rh-vellum),
    var(--rh-vellum-2)
  );
  color: var(--rh-lapis-deep);
  font-family: var(--rh-display);
  font-size: 0.8rem;
  font-weight: 900;
  text-shadow: none;
  box-shadow:
    0 0 0 1.5px var(--rh-gold),
    0 2px 4px rgb(0 0 0 / 0.6);
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
