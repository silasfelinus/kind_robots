<template>
  <div
    class="floor-indicator"
    role="img"
    :aria-label="`Elevator floor indicator, going down: ${floors.map((floor) => floor.title).join(', ')}`"
  >
    <div class="floor-dial" aria-hidden="true">
      <div class="floor-face">
        <span
          v-for="(floor, i) in floors"
          :key="floor.id"
          class="floor-lamp floor-anim"
          :class="{ 'is-deepest': i === floors.length - 1 }"
          :style="{ '--i': i, '--a': `${floor.angle}deg` }"
          >{{ floor.mark }}</span
        >
        <span class="floor-needle floor-anim" />
        <span class="floor-hub" />
      </div>
    </div>
    <ol class="floor-readout" aria-hidden="true">
      <li
        v-for="(floor, i) in floors"
        :key="floor.id"
        class="floor-name floor-anim"
        :style="{ '--i': i }"
      >
        {{ floor.title }}
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { DEPARTMENTS, DEPARTMENT_FLOORS } from '~/utils/shiftingDesks/rules'

const SWEEP = 120

const floors = DEPARTMENTS.map((pack, i) => {
  const floor = DEPARTMENT_FLOORS[pack.department.order] ?? ''
  return {
    id: pack.department.id,
    title: pack.department.title,
    mark: floor.startsWith('Level ') ? floor.slice(6) : floor.charAt(0),
    angle: -SWEEP / 2 + (SWEEP / (DEPARTMENTS.length - 1)) * i,
  }
})
</script>

<style scoped>
.floor-indicator {
  --floor-cycle: 12s;
  --floor-step: calc(var(--floor-cycle) / 5);
  --brass-hi: #f1d79a;
  --brass: #c9973f;
  --brass-lo: #7a5420;
  --lamp-off: #6b5634;
  --lamp-on: #e8692a;
  --lamp-deep: #9bd88a;
  --oxblood: #6e1f24;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--floor-width, 13rem);
}

.floor-dial {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
  border-radius: 999px 999px 0 0;
  padding: 0.45rem 0.45rem 0;
  background: linear-gradient(
    160deg,
    var(--brass-hi) 0%,
    var(--brass) 38%,
    var(--brass-lo) 72%,
    var(--brass) 100%
  );
  box-shadow:
    inset 0 2px 0 rgb(255 255 255 / 0.55),
    inset 0 -3px 0 rgb(0 0 0 / 0.25),
    0 3px 0 #3b2a10;
}

.floor-face {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 999px 999px 0 0;
  background:
    conic-gradient(
      from -90deg at 50% 100%,
      transparent 0deg 158deg,
      rgb(110 31 36 / 0.85) 158deg 178deg,
      transparent 178deg
    ),
    radial-gradient(circle at 50% 100%, #2a241d 0%, #1b1713 62%, #120f0c 100%);
  box-shadow: inset 0 3px 8px rgb(0 0 0 / 0.7);
}

.floor-lamp {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 1.7em;
  margin-left: -0.85em;
  font-family: 'Bungee', 'Arial Black', Impact, sans-serif;
  font-size: calc(var(--floor-width, 13rem) * 0.062);
  line-height: 1.7em;
  text-align: center;
  color: var(--lamp-off);
  transform-origin: 50% 100%;
  transform: rotate(var(--a))
    translateY(calc(var(--floor-width, 13rem) * -0.34))
    rotate(calc(var(--a) * -1));
}

.floor-lamp:first-child {
  color: var(--lamp-on);
  text-shadow:
    0 0 6px var(--lamp-on),
    0 0 14px rgb(232 105 42 / 0.6);
}

.floor-needle {
  position: absolute;
  bottom: 0.2rem;
  left: 50%;
  width: 0.2rem;
  height: 64%;
  margin-left: -0.1rem;
  border-radius: 999px;
  background: linear-gradient(to top, #2b2622 0%, #e8692a 40%, #f6c08a 100%);
  box-shadow: 0 0 6px rgb(232 105 42 / 0.7);
  transform-origin: 50% 100%;
  transform: rotate(-60deg);
}

.floor-hub {
  position: absolute;
  bottom: -0.55rem;
  left: 50%;
  width: 1.3rem;
  height: 1.3rem;
  margin-left: -0.65rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 35% 35%,
    var(--brass-hi),
    var(--brass-lo)
  );
  box-shadow: 0 0 0 2px #3b2a10;
}

.floor-readout {
  position: relative;
  width: 100%;
  height: calc(var(--floor-width, 13rem) * 0.125);
  overflow: hidden;
  border: 3px solid #3b2a10;
  border-top: 0;
  border-radius: 0 0 0.5rem 0.5rem;
  background:
    repeating-linear-gradient(
      to bottom,
      rgb(255 255 255 / 0.04) 0 1px,
      transparent 1px 3px
    ),
    #0f1a12;
  box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.8);
}

.floor-name {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Bungee', 'Arial Black', Impact, sans-serif;
  font-size: calc(var(--floor-width, 13rem) * 0.056);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--lamp-deep);
  text-shadow: 0 0 8px rgb(155 216 138 / 0.75);
  opacity: 0;
}

.floor-name:first-child {
  opacity: 1;
}

@media (prefers-reduced-motion: no-preference) {
  .floor-needle {
    animation: floor-needle var(--floor-cycle) ease-in-out infinite;
  }

  .floor-lamp {
    animation: floor-lamp var(--floor-cycle) steps(1, end) infinite;
    animation-delay: calc(var(--i) * var(--floor-step) - var(--floor-cycle));
  }

  .floor-lamp.is-deepest {
    animation-name: floor-lamp-deep;
  }

  .floor-name {
    animation: floor-name var(--floor-cycle) ease-out infinite;
    animation-delay: calc(var(--i) * var(--floor-step) - var(--floor-cycle));
  }
}

@keyframes floor-needle {
  0%,
  14% {
    transform: rotate(-60deg);
    opacity: 1;
  }
  20%,
  34% {
    transform: rotate(-30deg);
  }
  40%,
  54% {
    transform: rotate(0deg);
  }
  60%,
  74% {
    transform: rotate(30deg);
  }
  80%,
  88% {
    transform: rotate(60deg);
    opacity: 1;
  }
  93% {
    transform: rotate(82deg);
    opacity: 1;
  }
  96% {
    transform: rotate(78deg);
    opacity: 0;
  }
  98% {
    transform: rotate(-60deg);
    opacity: 0;
  }
  100% {
    transform: rotate(-60deg);
    opacity: 1;
  }
}

@keyframes floor-lamp {
  0% {
    color: var(--lamp-on);
    text-shadow:
      0 0 6px var(--lamp-on),
      0 0 14px rgb(232 105 42 / 0.6);
  }
  20%,
  100% {
    color: var(--lamp-off);
    text-shadow: none;
  }
}

@keyframes floor-lamp-deep {
  0%,
  12% {
    color: var(--lamp-deep);
    text-shadow:
      0 0 6px var(--lamp-deep),
      0 0 16px rgb(155 216 138 / 0.7);
  }
  13% {
    color: var(--lamp-off);
    text-shadow: none;
  }
  14% {
    color: var(--lamp-deep);
    text-shadow:
      0 0 6px var(--lamp-deep),
      0 0 16px rgb(155 216 138 / 0.7);
  }
  20%,
  100% {
    color: var(--lamp-off);
    text-shadow: none;
  }
}

@keyframes floor-name {
  0% {
    opacity: 0;
    transform: translateY(70%);
  }
  2%,
  18.5% {
    opacity: 1;
    transform: translateY(0);
  }
  20%,
  100% {
    opacity: 0;
    transform: translateY(-70%);
  }
}
</style>
