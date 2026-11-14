<!--
  CARD EVOLUTIONS. Silas, 2026-11-11 PT: "If I select a card I should see a
  large display with all three of its evolutions", then (inspector) "Layout
  issues with the card display". One card at LV 1, LV 2 and LV 3 side by side
  with its rules showing; a choose-one level three shows both options. The
  parent sizes it: --evo-w (room across), --evo-h (room for a card's height),
  --evo-max and --evo-min (card width bounds; below the minimum it swipes).
-->
<template>
  <ol
    class="sce"
    :style="{ '--count': stages.length }"
    :aria-label="cardName + ': every evolution'"
    data-testid="slime-card-evolutions"
  >
    <li v-for="stage in stages" :key="stage.label">
      <span class="sce-tag">{{ stage.label }}</span>
      <span class="sce-card">
        <SlimeCityClashCardFace
          :card-id="cardId"
          :level="stage.level"
          :pick="stage.pick"
        />
      </span>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CLASH_MAX_LEVEL } from '~/utils/slimeCity/clash'
import {
  clashEvolutionChoice,
  type EvoPick,
} from '~/utils/slimeCity/clashEvolutions'
import { cardById } from '~/utils/slimeCity/prototypes'

const props = defineProps<{ cardId: string }>()

const cardName = computed(() => cardById(props.cardId)?.name ?? props.cardId)
const stages = computed(() => {
  const out: { label: string; level: number; pick?: EvoPick }[] = Array.from(
    { length: CLASH_MAX_LEVEL },
    (_, i) => ({ label: 'LV ' + (i + 1), level: i + 1 }),
  )
  if (clashEvolutionChoice(props.cardId, CLASH_MAX_LEVEL)) {
    out[CLASH_MAX_LEVEL - 1]!.label = 'LV 3 · OPTION A'
    out[CLASH_MAX_LEVEL - 1]!.pick = 0
    out.push({ label: 'LV 3 · OPTION B', level: CLASH_MAX_LEVEL, pick: 1 })
  }
  return out
})
</script>

<style scoped>
.sce {
  --gap: 0.6rem;
  --E: max(
    var(--evo-min, 0rem),
    min(
      var(--evo-max, 15rem),
      (var(--evo-w, 100cqw) - (var(--count) - 1) * var(--gap)) / var(--count),
      var(--evo-h, 100rem) * 2 / 3
    )
  );
  display: flex;
  gap: var(--gap);
  max-width: var(--evo-w, 100cqw);
  margin: 0 auto;
  padding: 0 0 0.2rem;
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
}
.sce li {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: var(--E);
  scroll-snap-align: center;
}
.sce-tag {
  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  color: #c5ff59;
}
.sce-card {
  --rules-open: 1;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 0.8rem;
  container-type: inline-size;
  box-shadow: 0 8px 20px #000a;
}
</style>
