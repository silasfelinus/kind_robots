<template>
  <g class="plumber-runner" :class="{ 'plumber-runner--still': !running }">
    <path
      class="plumber-runner-scarf"
      d="M-6-58c-14 2-26 8-38 4 6 6 18 10 30 8-8 6-20 8-30 6 10 8 26 6 38-6Z"
      :fill="heroine.scarf"
    />
    <g :fill="heroine.hair">
      <path
        v-if="heroine.hairStyle === 'ponytail'"
        class="plumber-runner-tail"
        d="M-10-84c-16-2-28 10-30 26 8-6 16-8 24-6Z"
      />
      <circle v-else-if="heroine.hairStyle === 'bun'" cx="-8" cy="-92" r="8" />
      <path
        v-else-if="heroine.hairStyle === 'braids'"
        d="M-12-74c-4 10-6 22-2 30l6-2c-2-8-2-18 2-26Z"
      />
      <path
        v-else-if="heroine.hairStyle === 'locs'"
        d="M-16-80c-8 12-10 28-6 40h8c-2-12 0-26 6-36Z"
      />
      <path
        v-else-if="heroine.hairStyle === 'bob'"
        d="M-16-86c-6 12-6 22-2 30h10l2-28Z"
      />
      <g v-else-if="heroine.hairStyle === 'curls'">
        <circle cx="-14" cy="-80" r="10" />
        <circle cx="-14" cy="-64" r="8" />
      </g>
    </g>

    <g class="plumber-runner-leg-back">
      <rect
        x="-6"
        y="-34"
        width="10"
        height="26"
        rx="5"
        :fill="shade(heroine.outfit)"
      />
      <path d="M-8-10h16l4 10H-8Z" :fill="heroine.boots" />
    </g>
    <g class="plumber-runner-arm-back">
      <rect
        x="-4"
        y="-60"
        width="8"
        height="24"
        rx="4"
        :fill="heroine.skinShade"
      />
    </g>

    <rect x="-13" y="-64" width="26" height="22" rx="8" :fill="heroine.shirt" />
    <path
      d="M-12-50h24v16c0 3-3 6-6 6H-6c-3 0-6-3-6-6Z"
      :fill="heroine.outfit"
    />
    <path
      d="M-10-62l4 12M10-62l-4 12"
      :stroke="heroine.outfit"
      stroke-width="4"
    />

    <g class="plumber-runner-leg-front">
      <rect
        x="-5"
        y="-34"
        width="10"
        height="26"
        rx="5"
        :fill="heroine.outfit"
      />
      <path d="M-7-10h16l4 10H-7Z" :fill="heroine.boots" />
    </g>

    <rect x="-4" y="-70" width="8" height="8" :fill="heroine.skinShade" />
    <circle cx="2" cy="-80" r="15" :fill="heroine.skin" />
    <path
      d="M-14-80c-2-14 6-22 18-22 10 0 16 6 15 14-6-4-12-4-18-2-4 6-10 9-15 10Z"
      :fill="heroine.hair"
    />
    <g v-if="heroine.hairStyle === 'curls'" :fill="heroine.hair">
      <circle cx="-6" cy="-96" r="7" />
      <circle cx="6" cy="-98" r="7" />
      <circle cx="-14" cy="-88" r="7" />
    </g>
    <circle cx="9" cy="-80" r="2.2" fill="#2a2230" />
    <path
      d="M8-73q4 2 7-1"
      stroke="#7a2e3a"
      stroke-width="1.8"
      fill="none"
      stroke-linecap="round"
    />
    <circle cx="5" cy="-75" r="3" fill="#ff7f8f" fill-opacity=".3" />
    <path
      d="M-13-90q14-6 28 0"
      stroke="#5a4636"
      stroke-width="2.5"
      fill="none"
    />
    <circle
      cx="10"
      cy="-91"
      r="4.5"
      fill="#e9b65c"
      stroke="#9a6b2a"
      stroke-width="1.5"
    />

    <g class="plumber-runner-arm-front">
      <rect x="-4" y="-60" width="8" height="24" rx="4" :fill="heroine.skin" />
      <g transform="translate(0 -38) rotate(30)">
        <rect x="-2" y="-2" width="5" height="22" rx="2.5" fill="#9fb3bd" />
        <path d="M-6 20a7 7 0 1 0 14 0h-3l-2 4h-4l-2-4Z" fill="#c3d2d9" />
      </g>
    </g>
  </g>
</template>

<script setup lang="ts">
import type { Heroine } from '~/utils/arcade/games/savePlumberHeroine'

withDefaults(defineProps<{ heroine: Heroine; running?: boolean }>(), {
  running: true,
})

/** Darken a #rrggbb colour for the far-side limb. */
function shade(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  const ch = (shift: number) =>
    Math.round(((n >> shift) & 255) * 0.72)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(16)}${ch(8)}${ch(0)}`
}
</script>

<style scoped>
.plumber-runner-leg-front,
.plumber-runner-leg-back,
.plumber-runner-arm-front,
.plumber-runner-arm-back {
  transform-box: fill-box;
}

.plumber-runner-scarf,
.plumber-runner-tail {
  transform-box: fill-box;
  transform-origin: 100% 0;
}

.plumber-runner-leg-front {
  transform-origin: 50% 0;
  transform: rotate(-30deg);
  animation: plumber-stride 0.52s ease-in-out infinite;
}

.plumber-runner-leg-back {
  transform-origin: 50% 0;
  transform: rotate(26deg);
  animation: plumber-stride 0.52s ease-in-out infinite reverse;
}

.plumber-runner-arm-front {
  transform-origin: 50% 0;
  transform: rotate(24deg);
  animation: plumber-stride 0.52s ease-in-out infinite reverse;
}

.plumber-runner-arm-back {
  transform-origin: 50% 0;
  transform: rotate(-24deg);
  animation: plumber-stride 0.52s ease-in-out infinite;
}

.plumber-runner-scarf {
  animation: plumber-flutter 0.4s ease-in-out infinite alternate;
}

.plumber-runner-tail {
  animation: plumber-flutter 0.4s ease-in-out infinite alternate-reverse;
}

@keyframes plumber-stride {
  0%,
  100% {
    transform: rotate(32deg);
  }

  50% {
    transform: rotate(-32deg);
  }
}

@keyframes plumber-flutter {
  from {
    transform: rotate(-6deg) scaleX(1);
  }

  to {
    transform: rotate(5deg) scaleX(0.92);
  }
}

.plumber-runner--still * {
  animation: none !important;
}

.plumber-runner--still .plumber-runner-leg-front,
.plumber-runner--still .plumber-runner-leg-back,
.plumber-runner--still .plumber-runner-arm-front,
.plumber-runner--still .plumber-runner-arm-back {
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .plumber-runner * {
    animation: none !important;
  }
}
</style>
