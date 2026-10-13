<template>
  <g>
    <g v-if="world.id === 1">
      <circle r="17" fill="none" :stroke="p.accent" stroke-width="5" />
      <path
        d="M0-17V17M-17 0H17M-12-12l24 24M12-12l-24 24"
        :stroke="p.accent"
        stroke-width="3"
      />
      <circle r="6" fill="#9a6b2a" />
    </g>
    <g v-else-if="world.id === 2">
      <path
        d="M-20 8h40l-8 10h-24Z"
        fill="#c9f1ff"
        stroke="#fff"
        stroke-width="2"
      />
      <path
        d="M0 6V-22M2-20l18 24H2Z"
        :fill="p.accent"
        stroke="#7a5134"
        stroke-width="2"
      />
    </g>
    <g v-else-if="world.id === 3">
      <path d="M0-24v6" stroke="#3a1430" stroke-width="3" />
      <rect x="-12" y="-18" width="24" height="32" rx="8" :fill="p.accent" />
      <path d="M-12-6h24M-12 4h24" stroke="#e8705f" stroke-width="2.5" />
      <path d="M-5 14h10v6h-10Z" fill="#3a1430" />
    </g>
    <g v-else-if="world.id === 4">
      <circle r="17" fill="none" stroke="#8e4a43" stroke-width="3" />
      <path
        d="M0-17V17M-17 0H17M-12-12l24 24M12-12l-24 24"
        stroke="#8e4a43"
        stroke-width="2"
      />
      <circle cy="-17" r="5" fill="#e8705f" />
      <circle cx="17" r="5" :fill="p.accent" />
      <circle cy="17" r="5" fill="#3f6fd1" />
      <circle cx="-17" r="5" :fill="p.accent" />
    </g>
    <g v-else-if="world.id === 5">
      <circle cx="-8" cy="4" r="11" fill="#fff" />
      <circle cx="6" cy="-2" r="13" fill="#fff" />
      <circle cx="16" cy="8" r="8" fill="#fff" />
      <path d="M-22-18L22 -4" stroke="#40609e" stroke-width="2" />
      <rect x="-6" y="-12" width="12" height="9" rx="2" fill="#e8705f" />
    </g>
    <g v-else-if="world.id === 6">
      <path d="M0 20l-11-18L0-22l11 24Z" :fill="p.accent" />
      <path d="M0 20V-22l11 24Z" fill="#fff" opacity=".5" />
      <path d="M-12 20l-8-12 5-12 6 14Z" fill="#9b7be0" />
      <path d="M12 20l7-14 5 8-4 6Z" fill="#b39cff" />
    </g>
    <g v-else-if="world.id === 7">
      <circle cx="6" cy="-8" r="13" fill="#fff4d8" />
      <circle cx="0" cy="-12" r="11" :fill="p.skyTop" />
      <path d="M-22 22V6l12-10 12 10v16ZM2 22V10h20v12Z" fill="#33285e" />
      <circle cx="-10" cy="12" r="3" :fill="p.accent" />
    </g>
    <g v-else>
      <path d="M-22 6h44l-10 12-12 8-12-8Z" fill="#3a2f4a" />
      <rect x="-20" y="-14" width="7" height="20" fill="#45507a" />
      <rect x="13" y="-16" width="7" height="22" fill="#45507a" />
      <circle cy="-6" r="11" fill="#d9a35a" stroke="#ffcf82" stroke-width="2" />
      <circle cy="-6" r="4" fill="#9be9ec" />
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlumberWorld } from '~/utils/arcade/games/savePlumberWorlds'

const props = defineProps<{ world: PlumberWorld }>()
const p = computed(() => props.world.palette)
</script>
