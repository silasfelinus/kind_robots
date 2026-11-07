<!-- The Royal Atlas: the kingdom map (t-054) on a pale rainbow card. Its regions
     are named where they lie and each one's card is painted in that region's
     CURRENT state, so your decrees, the reign's decay and any tyranny pins
     repaint the atlas. The lake is where you fish. A painted kingdom map is
     queued (backdrops/royal-map); until then the lake vista is the sheet. -->
<template>
  <section class="rh-screen rh-map" aria-label="Royal Atlas">
    <RulerHookedArt
      class="rh-backdrop rh-map__backdrop"
      :candidates="BACKDROPS.map"
      eager
    />
    <div class="rh-map__sheet rh-parchment">
      <header class="rh-map__head">
        <p class="rh-eyebrow">Royal cartography</p>
        <h2 class="rh-title rh-title--big">The Kingdom Atlas</h2>
        <p class="rh-map__lede">
          Every corner is painted as it stands today. Your decrees repaint them.
        </p>
      </header>
      <RulerHookedMap
        ref="chartEl"
        class="rh-map__chart"
        @navigate="emit('navigate', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { BACKDROPS } from '~/utils/rulerHooked/artLibrary'
import type { ConsoleScreen } from '~/utils/rulerHooked/tutorial'

const emit = defineEmits<{ navigate: [screen: ConsoleScreen] }>()
const chartEl = ref<{ step: (n: number) => void; confirm: () => void } | null>(
  null,
)

defineExpose({
  step: (n: number) => chartEl.value?.step(n),
  confirm: () => chartEl.value?.confirm(),
})
</script>

<style scoped>
.rh-map__backdrop {
  filter: blur(2px) brightness(0.6) saturate(0.8);
}
.rh-map__sheet {
  position: absolute;
  z-index: 2;
  inset: clamp(4.25rem, 11cqi, 5.5rem) clamp(0.5rem, 2.5cqi, 2rem)
    clamp(0.5rem, 2cqi, 1.25rem);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  overflow: hidden;
}
.rh-map__head {
  text-align: center;
}
.rh-map__lede {
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.8;
}
.rh-map__chart {
  flex: 1 1 auto;
  min-height: 0;
}
@container rhconsole (max-width: 560px) {
  .rh-map__lede {
    display: none;
  }
}
.rh-map__sheet {
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
}
</style>
