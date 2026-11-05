<!-- The console's illustrated bottom nav: five painted vignette tabs. -->
<template>
  <nav class="rh-nav" aria-label="Ruler Hooked screens">
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
  </nav>
</template>

<script setup lang="ts">
import { TAB_ART } from '~/utils/rulerHooked/artLibrary'
import type { ConsoleScreen } from '~/utils/rulerHooked/tutorial'

defineProps<{
  modelValue: ConsoleScreen
  badges: Partial<Record<ConsoleScreen, boolean>>
  pointed?: ConsoleScreen | null
}>()
const emit = defineEmits<{ 'update:modelValue': [screen: ConsoleScreen] }>()

const TABS: { id: ConsoleScreen; label: string; position: string }[] = [
  { id: 'lake', label: 'Lake', position: 'center 70%' },
  { id: 'map', label: 'Map', position: 'center 45%' },
  { id: 'court', label: 'Court', position: 'center 35%' },
  { id: 'gear', label: 'Gear', position: 'center' },
  { id: 'fishopedia', label: 'Fishopedia', position: '62% center' },
]
</script>

<style scoped>
.rh-nav {
  position: relative;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(0.25rem, 1cqi, 0.6rem);
  padding: 0.45rem clamp(0.35rem, 1.5cqi, 1rem) 0.55rem;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 30%),
    linear-gradient(180deg, var(--rh-plum), var(--rh-plum-deep));
  border-top: 2px solid var(--rh-gold);
  box-shadow: 0 -6px 18px rgb(0 0 0 / 0.35);
}
.rh-tab {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 3.75rem;
  height: clamp(3.75rem, 11cqi, 6.5rem);
  border-radius: 0.8rem;
  overflow: hidden;
  border: 1.5px solid rgb(217 164 65 / 0.55);
  background: var(--rh-plum-deep);
  box-shadow: inset 0 0 0 2px rgb(0 0 0 / 0.35);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
  cursor: pointer;
}
.rh-tab:hover {
  transform: translateY(-2px);
}
.rh-tab:focus-visible {
  outline: 3px solid #fff1c9;
  outline-offset: 2px;
}
.rh-tab__art {
  position: absolute !important;
  inset: 0;
  opacity: 0.72;
  filter: saturate(0.85);
  transition:
    opacity 160ms ease,
    filter 160ms ease;
}
.rh-tab.is-active .rh-tab__art,
.rh-tab:hover .rh-tab__art {
  opacity: 1;
  filter: none;
}
.rh-tab__label {
  position: relative;
  grid-row: 2;
  padding: 1.4rem 0.2rem 0.3rem;
  background: linear-gradient(180deg, transparent, rgb(37 11 31 / 0.92) 55%);
  color: #fff3d6;
  font-family: var(--rh-display);
  font-weight: 700;
  font-size: clamp(0.72rem, 2.2cqi, 1.25rem);
  text-shadow: 0 2px 2px rgb(0 0 0 / 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rh-tab.is-active {
  border-color: #ffd977;
  box-shadow:
    0 0 0 2px #ffd977,
    0 0 18px rgb(255 217 119 / 0.55);
}
.rh-tab.is-pointed {
  animation: rh-tab-pulse 1.6s ease-in-out infinite;
}
@keyframes rh-tab-pulse {
  50% {
    box-shadow:
      0 0 0 3px #ffd977,
      0 0 22px rgb(255 217 119 / 0.8);
  }
}
.rh-tab__badge {
  position: absolute;
  top: 0.25rem;
  right: 0.3rem;
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: #c0304a;
  border: 1.5px solid #ffe1a0;
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .rh-tab,
  .rh-tab.is-pointed {
    animation: none;
    transition: none;
  }
}
</style>
