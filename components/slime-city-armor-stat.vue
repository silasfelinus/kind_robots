<template>
  <span
    v-if="armor + guard > 0"
    class="sc-armor-stat"
    :aria-label="armor + guard + ' armor'"
    :title="guard ? armor + ' armor + ' + guard + ' temporary armor' : armor + ' armor'"
    data-testid="slime-armor-stat"
  >
    <svg viewBox="0 0 24 26" aria-hidden="true">
      <path d="M12 1 22 5v8c0 5-5 9-10 12C7 22 2 18 2 13V5Z" />
    </svg>
    <strong>{{ armor + guard }}</strong>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ armor: number; guard?: number }>(), { guard: 0 })
</script>

<style scoped>
.sc-armor-stat {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--sc-armor-size, 1.65rem);
  height: var(--sc-armor-size, 1.65rem);
  font-size: calc(var(--sc-armor-size, 1.65rem) * 0.55);
  color: #fff;
  font-weight: 950;
  line-height: 1;
  pointer-events: none;
}
.sc-armor-stat svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 2px #000c);
}
.sc-armor-stat path {
  fill: #356c9e;
  stroke: #c9ebff;
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.sc-armor-stat strong {
  position: relative;
  font-size: inherit;
  text-shadow: 0 1px 2px #000;
}
</style>
