<!-- /components/slime-city-takeback-choice.vue -->
<template>
  <div
    class="sctb"
    role="radiogroup"
    aria-label="Take-backs allowed each turn"
    data-testid="slime-takeback-choice"
  >
    <span class="sctb-label">TAKE-BACKS</span>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="pvp.takebackChoice === option.value"
      :title="option.title"
      :data-testid="'slime-takeback-' + option.value"
      @click="pvp.setTakebackChoice(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSlimeCityPvpStore } from '~/stores/slimeCityPvp'
import { PVP_TAKEBACKS_ANY } from '~/utils/slimeCity/pvp'

const pvp = useSlimeCityPvpStore()
const options = [
  { value: 0, label: 'OFF', title: 'Every play stands' },
  {
    value: 1,
    label: '1 / TURN',
    title: 'Each player may take back one play per turn',
  },
  {
    value: PVP_TAKEBACKS_ANY,
    label: 'ANY',
    title: 'Take back any play until you FIGHT',
  },
]
</script>

<style scoped>
.sctb {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.sctb-label {
  margin-right: 0.15rem;
  color: #a6c7bc;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.sctb button {
  padding: 0.3rem 0.55rem;
  border: 1px solid #586e68;
  border-radius: 999px;
  background: #16262b;
  color: #c7d6d0;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.sctb button[aria-checked='true'] {
  border-color: #c4f25d;
  color: #c4f25d;
}
</style>
