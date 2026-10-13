<template>
  <svg
    viewBox="0 0 200 220"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="`Portrait of ${heroine.name}`"
  >
    <g transform="rotate(-28 150 150)">
      <rect x="146" y="96" width="10" height="92" rx="5" fill="#9fb3bd" />
      <path
        d="M140 82a16 16 0 1 0 32 0l-6 0-4 10h-12l-4-10Z"
        fill="#c3d2d9"
        stroke="#6f8792"
        stroke-width="2"
      />
    </g>

    <g :fill="heroine.hair">
      <template v-if="heroine.hairStyle === 'curls'">
        <circle
          v-for="(c, i) in curlsBack"
          :key="`cb${i}`"
          :cx="c[0]"
          :cy="c[1]"
          :r="c[2]"
        />
      </template>
      <path
        v-else-if="heroine.hairStyle === 'bob'"
        d="M54 96c-4-40 18-62 46-62s50 22 46 62l-2 32c-10 6-24 6-30 2H86c-6 4-20 4-30-2Z"
      />
      <template v-else-if="heroine.hairStyle === 'braids'">
        <circle cx="100" cy="84" r="44" />
        <ellipse
          v-for="i in 6"
          :key="`bl${i}`"
          :cx="62"
          :cy="112 + i * 13"
          rx="9"
          ry="8"
        />
        <ellipse
          v-for="i in 6"
          :key="`br${i}`"
          :cx="138"
          :cy="112 + i * 13"
          rx="9"
          ry="8"
        />
      </template>
      <template v-else-if="heroine.hairStyle === 'ponytail'">
        <circle cx="100" cy="84" r="43" />
        <path d="M128 52c34-6 48 30 40 70-4 22-14 40-26 48 6-26 6-58-20-86Z" />
      </template>
      <template v-else-if="heroine.hairStyle === 'locs'">
        <circle cx="100" cy="82" r="45" />
        <rect
          v-for="i in 9"
          :key="`lc${i}`"
          :x="48 + i * 10"
          y="84"
          width="9"
          :height="74 + ((i * 17) % 22)"
          rx="4.5"
        />
      </template>
      <template v-else-if="heroine.hairStyle === 'bun'">
        <circle cx="100" cy="84" r="42" />
        <circle cx="100" cy="38" r="20" />
      </template>
      <circle v-else cx="100" cy="82" r="41" />
    </g>

    <path
      d="M34 220c2-30 18-50 44-56h44c26 6 42 26 44 56Z"
      :fill="heroine.shirt"
    />
    <path
      d="M70 220v-40c0-6 4-10 10-10h40c6 0 10 4 10 10v40Z"
      :fill="heroine.outfit"
    />
    <path
      d="M66 168l12 22M134 168l-12 22"
      :stroke="heroine.outfit"
      stroke-width="11"
      stroke-linecap="round"
    />
    <circle cx="80" cy="190" r="4" fill="#ffe2a4" />
    <circle cx="120" cy="190" r="4" fill="#ffe2a4" />
    <rect
      x="88"
      y="198"
      width="24"
      height="14"
      rx="3"
      fill="#000"
      fill-opacity=".14"
    />

    <rect
      x="88"
      y="120"
      width="24"
      height="44"
      rx="10"
      :fill="heroine.skinShade"
    />
    <path
      d="M74 156c8 12 44 12 52 0l4 10c-12 14-48 14-60 0Z"
      :fill="heroine.scarf"
    />
    <path
      d="M112 166l14 26-12 2-8-24Z"
      :fill="heroine.scarf"
      class="plumber-scarf-tail"
    />

    <circle cx="63" cy="98" r="8" :fill="heroine.skinShade" />
    <circle cx="137" cy="98" r="8" :fill="heroine.skinShade" />
    <ellipse cx="100" cy="92" rx="37" ry="41" :fill="heroine.skin" />

    <g>
      <path
        d="M78 82q8-6 16-1M106 81q8-5 16 1"
        :stroke="browColour"
        stroke-width="3.5"
        stroke-linecap="round"
        fill="none"
      />
      <ellipse cx="86" cy="96" rx="4.6" ry="5.8" fill="#2a2230" />
      <ellipse cx="114" cy="96" rx="4.6" ry="5.8" fill="#2a2230" />
      <circle cx="87.6" cy="94" r="1.6" fill="#fff" />
      <circle cx="115.6" cy="94" r="1.6" fill="#fff" />
      <path
        d="M100 99q-3 7 1 9"
        :stroke="heroine.skinShade"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M88 114q12 10 24 0"
        stroke="#7a2e3a"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="76" cy="108" r="6" fill="#ff7f8f" fill-opacity=".28" />
      <circle cx="124" cy="108" r="6" fill="#ff7f8f" fill-opacity=".28" />
    </g>

    <g :fill="heroine.hair">
      <template v-if="heroine.hairStyle === 'curls'">
        <circle
          v-for="(c, i) in curlsFront"
          :key="`cf${i}`"
          :cx="c[0]"
          :cy="c[1]"
          :r="c[2]"
        />
      </template>
      <path
        v-else-if="heroine.hairStyle === 'bob'"
        d="M62 88c0-30 16-44 38-44s38 14 38 44c-10-8-22-12-38-12s-28 4-38 12Z"
      />
      <path
        v-else-if="heroine.hairStyle === 'pixie'"
        d="M62 92c-4-34 18-50 42-48 22 2 38 18 34 44-6-14-18-20-30-20-8 6-24 10-46 24Z"
      />
      <path
        v-else-if="heroine.hairStyle === 'ponytail'"
        d="M63 92c-2-32 18-46 40-46 20 0 36 14 34 40-14-4-28-14-36-24-6 14-20 24-38 30Z"
      />
      <path
        v-else
        d="M63 90c-2-30 16-44 37-44s39 14 37 44c-8-12-20-20-35-20h-4c-15 0-27 8-35 20Z"
      />
      <path
        v-if="heroine.hairStyle === 'braids' || heroine.hairStyle === 'locs'"
        d="M100 48v26"
        :stroke="heroine.skinShade"
        stroke-width="2.5"
        stroke-opacity=".6"
      />
    </g>

    <g>
      <path
        d="M62 70q38-16 76 0"
        stroke="#5a4636"
        stroke-width="5"
        fill="none"
      />
      <circle
        cx="84"
        cy="64"
        r="10"
        fill="#e9b65c"
        stroke="#9a6b2a"
        stroke-width="3"
      />
      <circle
        cx="116"
        cy="64"
        r="10"
        fill="#e9b65c"
        stroke="#9a6b2a"
        stroke-width="3"
      />
      <circle cx="84" cy="64" r="5.5" fill="#bff3f1" />
      <circle cx="116" cy="64" r="5.5" fill="#bff3f1" />
      <circle cx="82" cy="62" r="1.8" fill="#fff" />
      <circle cx="114" cy="62" r="1.8" fill="#fff" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Heroine } from '~/utils/arcade/games/savePlumberHeroine'

const props = defineProps<{ heroine: Heroine }>()

// Bright salon colours read better with a natural brow underneath.
const browColour = computed(() =>
  ['#2bb5b0', '#d9468f', '#9b7be0', '#ff8a3d', '#e5c27a'].includes(
    props.heroine.hair,
  )
    ? '#4a3328'
    : props.heroine.hair,
)

const curlsBack: [number, number, number][] = [
  [56, 80, 22],
  [144, 80, 22],
  [62, 112, 20],
  [138, 112, 20],
  [68, 140, 17],
  [132, 140, 17],
  [70, 52, 22],
  [130, 52, 22],
  [100, 40, 24],
]
const curlsFront: [number, number, number][] = [
  [72, 64, 13],
  [88, 54, 14],
  [106, 52, 14],
  [124, 60, 13],
  [134, 76, 10],
  [66, 78, 10],
]
</script>

<style scoped>
.plumber-scarf-tail {
  transform-box: fill-box;
  transform-origin: 30% 0;
  animation: plumber-scarf 2.4s ease-in-out infinite;
}

@keyframes plumber-scarf {
  0%,
  100% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(-9deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .plumber-scarf-tail {
    animation: none;
  }
}
</style>
