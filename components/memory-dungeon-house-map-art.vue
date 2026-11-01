<template>
  <svg
    viewBox="0 0 600 600"
    preserveAspectRatio="none"
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 h-full w-full select-none"
    data-testid="memory-house-atlas-fallback"
  >
    <rect width="600" height="600" :fill="palette.ground" />
    <g v-for="cell in HOUSE_ATLAS_FALLBACK_CELLS" :key="cell.id">
      <rect
        :x="cell.x + 2"
        :y="cell.y + 2"
        width="96"
        height="96"
        :fill="cell.index % 2 ? palette.floorDark : palette.floorLight"
      />
      <rect
        :x="cell.x + 12"
        :y="cell.y + 12"
        width="76"
        height="76"
        rx="7"
        :fill="palette.rug"
        opacity="0.17"
      />
      <path
        :d="`M ${cell.x + 7} ${cell.y + 86} Q ${cell.x + 38} ${cell.y + 57} ${cell.x + 92} ${cell.y + 88}`"
        fill="none"
        :stroke="palette.root"
        stroke-width="3"
        opacity="0.45"
      />
      <circle
        v-if="['puzzle', 'guardian', 'climax', 'combat'].includes(cell.kind)"
        :cx="cell.x + 50"
        :cy="cell.y + 50"
        r="18"
        fill="none"
        :stroke="palette.accent"
        stroke-width="4"
        opacity="0.7"
      />
      <rect
        v-else-if="['lore', 'treasure', 'secret'].includes(cell.kind)"
        :x="cell.x + 34"
        :y="cell.y + 35"
        width="32"
        height="30"
        rx="3"
        :fill="palette.furniture"
        opacity="0.7"
      />
      <path
        v-else
        :d="`M ${cell.x + 31} ${cell.y + 62} L ${cell.x + 50} ${cell.y + 33} L ${cell.x + 69} ${cell.y + 62} Z`"
        :fill="palette.furniture"
        opacity="0.65"
      />
      <path
        v-for="(segment, index) in cell.walls"
        :key="index"
        :d="segment"
        fill="none"
        :stroke="palette.wall"
        stroke-width="5"
        stroke-linecap="square"
      />
    </g>
  </svg>
  <img
    v-if="available"
    :src="HOUSE_ATLAS_PATHS[reality]"
    alt=""
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
    loading="eager"
    decoding="async"
    draggable="false"
    data-testid="memory-house-painted-atlas"
    @error="available = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { HOUSE_ATLAS_PATHS } from '~/utils/memoryDungeon/houseAtlas'
import { HOUSE_ATLAS_FALLBACK_CELLS } from '~/utils/memoryDungeon/houseAtlasFallback'

const props = defineProps<{ reality: 'original' | 'mirrored' }>()
const available = ref(true)
const palette = computed(() =>
  props.reality === 'original'
    ? {
        ground: '#162b2a',
        floorLight: '#546249',
        floorDark: '#465640',
        rug: '#a88c5a',
        root: '#c0a36b',
        accent: '#e3b966',
        furniture: '#392f2c',
        wall: '#d0b88b',
      }
    : {
        ground: '#18142a',
        floorLight: '#48405e',
        floorDark: '#39334f',
        rug: '#9880ae',
        root: '#b2a4d5',
        accent: '#dfc6f2',
        furniture: '#241f3e',
        wall: '#bcaad3',
      },
)
</script>
