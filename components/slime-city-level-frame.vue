<!--
  LEVEL FRAME. Silas, 2026-11-24 PT: "There needs to be a visual for levels
  1 2 and 3. They need clear color and attractive, generated framing."

  A drawn frame laid over a card or fighter's art (never over its text): a
  gradient ring, a hairline inner rule and four corner ornaments, one look per
  level so the level reads at a glance even at hand-fan size.
    LV 1  STREET  slime mint, plain ring, corner brackets
    LV 2  SPLICED electric violet to cyan, double ring, corner gems
    LV 3  APEX    gold to hot pink, heavy ring, jewelled corners, slow sheen
  The parent must be positioned; the frame takes its rounded corners. It sits
  above the card's own layers (last child, z-index 3) so a rules panel never
  hides the ring; the corners stay small enough to clear the badges.
-->
<template>
  <span
    class="slf"
    :class="'lv-' + tier"
    aria-hidden="true"
    data-testid="slime-level-frame"
  >
    <i class="slf-corner c-tl" />
    <i class="slf-corner c-tr" />
    <i class="slf-corner c-bl" />
    <i class="slf-corner c-br" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ level: number }>()
const tier = computed(() =>
  Math.min(3, Math.max(1, Math.round(props.level || 1))),
)
</script>

<style scoped>
.slf {
  --ring: 2px;
  --corner: clamp(0.5rem, 10%, 1.4rem);
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: inherit;
  pointer-events: none;
}
.slf.lv-1 {
  --a: #8af2c2;
  --b: #2fa57f;
  --glow: #5fe0b055;
}
.slf.lv-2 {
  --ring: 3px;
  --a: #a996ff;
  --b: #3fd6ff;
  --glow: #8f7bff77;
}
.slf.lv-3 {
  --ring: 4px;
  --a: #ffd34d;
  --b: #ff5fa2;
  --c: #fff3c4;
  --glow: #ffb80088;
}
.slf.lv-2,
.slf.lv-3 {
  filter: drop-shadow(0 0 0.3rem var(--glow));
}

/* The gradient ring: a full-size gradient masked down to its border. */
.slf::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: var(--ring);
  border-radius: inherit;
  background: linear-gradient(135deg, var(--a), var(--b) 50%, var(--a));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box exclude,
    linear-gradient(#000 0 0);
}
.slf.lv-3::before {
  background: linear-gradient(
    120deg,
    var(--a) 0%,
    var(--b) 30%,
    var(--c) 45%,
    var(--a) 55%,
    var(--b) 80%,
    var(--a) 100%
  );
  background-size: 260% 100%;
  animation: slf-sheen 5s linear infinite;
}

/* A hairline just inside the ring; LV 2 and LV 3 read as double frames. */
.slf::after {
  content: '';
  position: absolute;
  inset: calc(var(--ring) + 2px);
  border: 1px solid transparent;
  border-radius: inherit;
}
.slf.lv-2::after {
  border-color: #c9bdff66;
}
.slf.lv-3::after {
  border-color: #fff3c488;
  box-shadow: inset 0 0 1.2rem #ffb80033;
}

.slf-corner {
  position: absolute;
  width: var(--corner);
  aspect-ratio: 1;
}
.c-tl {
  top: 0;
  left: 0;
}
.c-tr {
  top: 0;
  right: 0;
  transform: scaleX(-1);
}
.c-bl {
  bottom: 0;
  left: 0;
  transform: scaleY(-1);
}
.c-br {
  bottom: 0;
  right: 0;
  transform: scale(-1);
}

/* LV 1: an L-shaped bracket hugging each corner. */
.lv-1 .slf-corner {
  border-top: calc(var(--ring) + 1px) solid var(--a);
  border-left: calc(var(--ring) + 1px) solid var(--a);
  border-top-left-radius: 0.5rem;
}

/* LV 2: a cut gem on each corner. */
.lv-2 .slf-corner::before {
  content: '';
  position: absolute;
  top: 18%;
  left: 18%;
  width: 34%;
  aspect-ratio: 1;
  transform: rotate(45deg);
  border: 1px solid #e9e4ff;
  background: linear-gradient(135deg, #f0ecff, var(--a) 40%, var(--b));
  box-shadow: 0 0 0.45rem var(--b);
}

/* LV 3: a bracket, a jewel and a little flourish on each corner. */
.lv-3 .slf-corner {
  border-top: calc(var(--ring) - 1px) solid var(--c);
  border-left: calc(var(--ring) - 1px) solid var(--c);
  border-top-left-radius: 0.6rem;
}
.lv-3 .slf-corner::before {
  content: '';
  position: absolute;
  top: 14%;
  left: 14%;
  width: 40%;
  aspect-ratio: 1;
  transform: rotate(45deg);
  border: 1px solid var(--c);
  background: radial-gradient(circle at 35% 35%, #fff, var(--b) 45%, #7a1747);
  box-shadow:
    0 0 0.5rem var(--a),
    0 0 1rem var(--b);
}
.lv-3 .slf-corner::after {
  content: '';
  position: absolute;
  top: 62%;
  left: 62%;
  width: 34%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--a), transparent);
  transform: rotate(45deg);
  transform-origin: 0 50%;
}

@keyframes slf-sheen {
  to {
    background-position: 260% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .slf.lv-3::before {
    animation: none;
  }
}
</style>
