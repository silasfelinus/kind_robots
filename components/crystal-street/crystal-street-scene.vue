<template>
  <svg
    viewBox="0 0 400 300"
    preserveAspectRatio="xMidYMid slice"
    class="h-full w-full"
    role="img"
    :aria-label="label"
  >
    <defs>
      <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="sky[0]" />
        <stop offset="0.6" :stop-color="sky[1]" />
        <stop offset="1" :stop-color="sky[2]" />
      </linearGradient>
      <radialGradient :id="`${uid}-orb`" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" :stop-color="orbCore" />
        <stop offset="0.55" :stop-color="orbCore" stop-opacity="0.9" />
        <stop offset="1" :stop-color="accent" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="`${uid}-glow`" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" :stop-color="accent" stop-opacity="0.8" />
        <stop offset="1" :stop-color="accent" stop-opacity="0" />
      </radialGradient>
      <pattern
        :id="`${uid}-scan`"
        width="3"
        height="3"
        patternUnits="userSpaceOnUse"
      >
        <rect width="3" height="1.4" fill="#000" opacity="0.16" />
      </pattern>
    </defs>
    <rect width="400" height="300" :fill="`url(#${uid}-sky)`" />
    <g v-if="!isDay" fill="#fff">
      <circle
        v-for="(s, i) in stars"
        :key="i"
        :cx="s.x"
        :cy="s.y"
        :r="s.r"
        :opacity="s.o"
      />
    </g>
    <circle
      :cx="orb.x"
      :cy="orb.y"
      :r="orb.r * 2.2"
      :fill="`url(#${uid}-orb)`"
    />
    <circle :cx="orb.x" :cy="orb.y" :r="orb.r" :fill="orbCore" />
    <g
      v-if="kind === 'dream'"
      :stroke="accent"
      stroke-width="0.8"
      opacity="0.7"
    >
      <line
        v-for="i in 9"
        :key="`h${i}`"
        x1="0"
        x2="400"
        :y1="200 + i * i * 1.2"
        :y2="200 + i * i * 1.2"
      />
      <line
        v-for="i in 13"
        :key="`v${i}`"
        :x1="200 + (i - 7) * 14"
        y1="200"
        :x2="200 + (i - 7) * 90"
        y2="300"
      />
    </g>
    <path :d="hills" :fill="ground[0]" />
    <g v-if="figure" :fill="ground[1]">
      <ellipse :cx="figure.x" :cy="figure.y + 70" rx="70" ry="90" />
      <circle :cx="figure.x" :cy="figure.y" r="34" />
      <circle
        :cx="figure.x - 12"
        :cy="figure.y - 2"
        r="4"
        :fill="accent"
        class="cs-eye"
      />
      <circle
        :cx="figure.x + 12"
        :cy="figure.y - 2"
        r="4"
        :fill="accent"
        class="cs-eye"
      />
    </g>
    <g :fill="ground[1]">
      <path v-for="(h, i) in houses" :key="i" :d="h.d" />
    </g>
    <g>
      <rect
        v-for="(w, i) in windows"
        :key="i"
        :x="w.x"
        :y="w.y"
        width="8"
        height="7"
        :fill="w.c"
        :opacity="w.o"
      />
    </g>
    <path d="M0 300 Q200 225 400 300 Z" :fill="ground[2]" />
    <g v-if="showStone">
      <circle cx="200" cy="262" r="46" :fill="`url(#${uid}-glow)`" />
      <path d="M182 280 L190 250 L201 238 L214 248 L220 280 Z" fill="#9b3dff" />
      <path d="M190 250 L201 268 L201 238 Z" fill="#f4d4ff" opacity="0.55" />
    </g>
    <text
      v-if="sigil"
      x="384"
      y="290"
      text-anchor="end"
      font-size="11"
      letter-spacing="3"
      :fill="accent"
      opacity="0.75"
      font-family="Impact, 'Arial Black', sans-serif"
    >
      {{ sigil.toUpperCase() }}
    </text>
    <rect width="400" height="300" :fill="`url(#${uid}-scan)`" />
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { hashSeed, nextRandom } from '~/utils/crystalStreet/rules'

const props = withDefaults(
  defineProps<{
    seed: string
    kind?: 'night' | 'day' | 'dream' | 'villain' | 'location' | 'ending'
    palette?: readonly string[]
    sigil?: string
    label?: string
  }>(),
  { kind: 'night', palette: () => [], sigil: '', label: 'Crystal Street' },
)

const uid = `cs${useId().replace(/[^a-zA-Z0-9]/g, '')}`

function series(count: number): number[] {
  let state = hashSeed(props.seed)
  const values: number[] = []
  for (let i = 0; i < count; i++) {
    const [value, next] = nextRandom(state)
    state = next
    values.push(value)
  }
  return values
}

const r = computed(() => series(80))
const isDay = computed(() => props.kind === 'day' || props.kind === 'location')
const accent = computed(
  () => props.palette[0] ?? (isDay.value ? '#ff7a59' : '#ff3d8b'),
)
const sky = computed<[string, string, string]>(() => {
  if (isDay.value) return ['#5ec8e5', '#a9e4ef', '#ffd6a5']
  return ['#07010f', '#1a0636', accent.value]
})
const ground = computed(() =>
  isDay.value
    ? ['#5d9c59', '#3b2f5c', '#2c2347']
    : ['#1a0634', '#0e0320', '#070112'],
)
const orbCore = computed(() => (isDay.value ? '#fff4c2' : '#ffe3f4'))
const orb = computed(() => ({
  x: 60 + (r.value[0] ?? 0) * 280,
  y: 40 + (r.value[1] ?? 0) * 50,
  r: 18 + (r.value[2] ?? 0) * 14,
}))
const stars = computed(() =>
  Array.from({ length: 24 }, (_, i) => ({
    x: (r.value[3 + i] ?? 0) * 400,
    y: (r.value[27 + i] ?? 0) * 160,
    r: 0.4 + (r.value[51 + (i % 20)] ?? 0) * 1.1,
    o: 0.4 + (r.value[(i * 3) % 80] ?? 0) * 0.6,
  })),
)
const hills = computed(() => {
  const a = 170 + (r.value[60] ?? 0) * 30
  const b = 160 + (r.value[61] ?? 0) * 30
  const c = 170 + (r.value[62] ?? 0) * 30
  return `M0 ${a} Q100 ${b - 20} 200 ${b} T400 ${c} V300 H0 Z`
})
const houses = computed(() => {
  const count = 4 + Math.floor((r.value[63] ?? 0) * 3)
  const width = 400 / count
  return Array.from({ length: count }, (_, i) => {
    const w = width * (0.6 + (r.value[64 + i] ?? 0) * 0.3)
    const x = i * width + (width - w) / 2
    const base = 228
    const h = 26 + (r.value[70 + i] ?? 0) * 20
    const roof = 16 + (r.value[(75 + i) % 80] ?? 0) * 12
    return {
      x,
      w,
      top: base - h,
      d: `M${x} ${base} h${w} v-${h} l-${w / 2} -${roof} l-${w / 2} ${roof} Z`,
    }
  })
})
const windows = computed(() => {
  const colors = isDay.value
    ? ['#c7e8f3', '#c7e8f3']
    : [accent.value, '#ffd23d', '#4df2ff']
  return houses.value.flatMap((h, i) =>
    [0.25, 0.65].map((f, j) => ({
      x: h.x + h.w * f - 4,
      y: h.top + 8,
      c: colors[(i + j) % colors.length] as string,
      o: isDay.value
        ? 0.7
        : (r.value[(i * 2 + j) % 80] ?? 0) > 0.3
          ? 0.95
          : 0.15,
    })),
  )
})
const figure = computed(() =>
  props.kind === 'villain' || props.kind === 'ending'
    ? { x: 200 + ((r.value[5] ?? 0.5) - 0.5) * 120, y: 120 }
    : null,
)
const showStone = computed(() => props.kind !== 'location')
</script>

<style scoped>
.cs-eye {
  animation: cs-blink 5s infinite;
}
@keyframes cs-blink {
  0%,
  92%,
  100% {
    opacity: 1;
  }
  95% {
    opacity: 0.1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cs-eye {
    animation: none;
  }
}
</style>
