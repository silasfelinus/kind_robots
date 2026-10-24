<template>
  <div
    class="relative overflow-hidden rounded-2xl"
    :class="[frame, shaken ? 'grayscale' : '']"
    :style="{ background: companion.palette[0] }"
  >
    <svg
      viewBox="0 0 120 150"
      preserveAspectRatio="xMidYMid slice"
      class="absolute inset-0 h-full w-full"
      role="img"
      :aria-label="`${companion.name}, ${emotion}`"
    >
      <rect width="120" height="150" :fill="companion.palette[0]" />
      <circle cx="60" cy="60" r="56" fill="#000" opacity="0.18" />
      <path
        d="M14 150 Q18 104 60 100 Q102 104 106 150 Z"
        :fill="companion.palette[1]"
      />
      <ellipse cx="60" cy="62" rx="28" ry="32" fill="#1b0b33" opacity="0.85" />
      <g stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none">
        <path :d="face.browL" />
        <path :d="face.browR" />
        <path :d="face.mouth" />
      </g>
      <g fill="#fff">
        <circle cx="49" cy="60" :r="face.eye" />
        <circle cx="71" cy="60" :r="face.eye" />
      </g>
      <path
        v-if="emotion === 'sad'"
        d="M71 66 q-2 6 0 9 q2 -3 0 -9 Z"
        fill="#9be7ff"
      />
      <text
        x="60"
        y="138"
        text-anchor="middle"
        font-size="13"
        font-family="Impact, 'Arial Black', sans-serif"
        fill="#fff"
        letter-spacing="2"
      >
        {{ initials }}
      </text>
    </svg>
    <img
      v-if="!failed"
      :key="src"
      :src="src"
      :alt="`${companion.name}, ${emotion}`"
      class="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="failed = true"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Companion, Emotion } from '~/utils/crystalStreet/types'

const props = withDefaults(
  defineProps<{
    companion: Companion
    emotion?: Emotion
    format?: 'portrait' | 'poster'
    frame?: string
    shaken?: boolean
  }>(),
  {
    emotion: 'neutral',
    format: 'portrait',
    frame: 'aspect-[4/5]',
    shaken: false,
  },
)

const loaded = ref(false)
const failed = ref(false)
const src = computed(() =>
  props.format === 'poster'
    ? `/crystal-street/companions/${props.companion.id}-poster.webp`
    : `/crystal-street/companions/${props.companion.id}-${props.emotion}.webp`,
)
watch(src, () => {
  loaded.value = false
  failed.value = false
})

const initials = computed(() =>
  props.companion.name
    .replace(/".*?"/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase(),
)

const FACES: Record<
  Emotion,
  { browL: string; browR: string; mouth: string; eye: number }
> = {
  neutral: {
    browL: 'M42 50 L56 50',
    browR: 'M64 50 L78 50',
    mouth: 'M50 80 L70 80',
    eye: 3,
  },
  happy: {
    browL: 'M42 49 Q49 45 56 49',
    browR: 'M64 49 Q71 45 78 49',
    mouth: 'M47 77 Q60 90 73 77',
    eye: 3,
  },
  scared: {
    browL: 'M42 47 Q49 42 56 46',
    browR: 'M64 46 Q71 42 78 47',
    mouth: 'M55 82 Q60 74 65 82 Q60 88 55 82',
    eye: 4.5,
  },
  angry: {
    browL: 'M42 46 L56 52',
    browR: 'M64 52 L78 46',
    mouth: 'M50 83 Q60 77 70 83',
    eye: 3,
  },
  sad: {
    browL: 'M42 52 L56 48',
    browR: 'M64 48 L78 52',
    mouth: 'M50 84 Q60 76 70 84',
    eye: 2.6,
  },
  determined: {
    browL: 'M42 49 L56 51',
    browR: 'M64 51 L78 49',
    mouth: 'M50 80 Q60 84 70 79',
    eye: 3,
  },
}
const face = computed(() => FACES[props.emotion])
</script>
