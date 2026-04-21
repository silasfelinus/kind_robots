<template>
  <!-- position is runtime-only; scale/colors come from the Butterfly record -->
  <div
    class="butterfly-sprite"
    :style="spriteStyle"
    :aria-label="`butterfly: ${butterfly.name}`"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="svgWidth"
      :height="svgHeight"
      viewBox="0 0 36 28"
      :style="wingStyle"
    >
      <!-- upper wings -->
      <ellipse
        cx="9"
        cy="10"
        rx="9"
        ry="6"
        :fill="butterfly.wingTopColor"
        opacity="0.93"
      />
      <ellipse
        cx="27"
        cy="10"
        rx="9"
        ry="6"
        :fill="butterfly.wingTopColor"
        opacity="0.93"
      />
      <!-- lower wings -->
      <ellipse
        cx="8"
        cy="18"
        rx="7"
        ry="5"
        :fill="butterfly.wingBottomColor"
        opacity="0.83"
      />
      <ellipse
        cx="28"
        cy="18"
        rx="7"
        ry="5"
        :fill="butterfly.wingBottomColor"
        opacity="0.83"
      />
      <!-- body -->
      <ellipse cx="18" cy="14" rx="2" ry="6" fill="#2c2c2a" opacity="0.85" />
      <!-- antennae -->
      <line x1="17" y1="8" x2="13" y2="3" stroke="#2c2c2a" stroke-width="0.9" />
      <line x1="19" y1="8" x2="23" y2="3" stroke="#2c2c2a" stroke-width="0.9" />
      <circle cx="13" cy="3" r="1" fill="#2c2c2a" />
      <circle cx="23" cy="3" r="1" fill="#2c2c2a" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Butterfly } from '~/stores/helpers/butterflyHelper'

// Runtime flight state — position is kept in the game store, not the DB model
export interface RuntimeButterfly extends Butterfly {
  /** 0–100 percentage of game field width */
  rx: number
  /** 0–100 percentage of game field height */
  ry: number
  /** current wing flap scalar 0.4–1.0 */
  flapScale: number
}

const props = defineProps<{
  butterfly: RuntimeButterfly
}>()

const BASE_SIZE = 36

const svgWidth = computed(() => Math.round(BASE_SIZE * props.butterfly.scale))
const svgHeight = computed(() => Math.round(28 * props.butterfly.scale))

const spriteStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.butterfly.rx}%`,
  top: `${props.butterfly.ry}%`,
  transform: `translate(-50%, -50%)`,
  pointerEvents: 'none' as const,
  zIndex: props.butterfly.zIndex,
  willChange: 'left, top',
}))

const wingStyle = computed(() => ({
  display: 'block',
  transform: `scaleX(${props.butterfly.flapScale})`,
  transformOrigin: 'center',
  transition: 'none',
}))
</script>

<style scoped>
.butterfly-sprite {
  position: absolute;
  pointer-events: none;
  transition: opacity 0.4s;
}

.butterfly-sprite.caught {
  opacity: 0;
}
</style>
