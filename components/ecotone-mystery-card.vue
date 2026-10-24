<template>
  <div
    class="ecotone-mystery-card relative isolate aspect-[2/3] overflow-hidden rounded-xl border shadow-lg"
    :style="{
      borderColor: locked ? 'rgba(217,184,119,.35)' : `${palette.ink}99`,
      background: locked ? '#0b151c' : palette.sky,
    }"
    role="img"
    :aria-label="
      locked ? `Case ${numeral}, unopened` : `Case ${numeral}: ${mystery.title}`
    "
  >
    <svg
      viewBox="0 0 200 300"
      class="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient :id="`${uid}-glow`" cx="50%" cy="46%" r="62%">
          <stop
            offset="0%"
            :stop-color="locked ? '#1d2c35' : palette.glow"
            stop-opacity=".75"
          />
          <stop
            offset="70%"
            :stop-color="locked ? '#0b151c' : palette.sky"
            stop-opacity="1"
          />
        </radialGradient>
        <pattern
          :id="`${uid}-back`"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M10 0 L20 10 L10 20 L0 10 Z"
            fill="none"
            stroke="#d9b877"
            stroke-opacity=".12"
          />
        </pattern>
      </defs>
      <rect width="200" height="300" :fill="`url(#${uid}-glow)`" />

      <template v-if="locked">
        <rect width="200" height="300" :fill="`url(#${uid}-back)`" />
        <circle
          cx="100"
          cy="138"
          r="46"
          fill="none"
          stroke="#d9b877"
          stroke-opacity=".45"
          stroke-dasharray="3 5"
        />
        <text
          x="100"
          y="156"
          text-anchor="middle"
          font-family="Georgia, serif"
          font-size="54"
          font-weight="900"
          fill="#d9b877"
          fill-opacity=".7"
        >
          ?
        </text>
      </template>

      <template v-else>
        <g :stroke="palette.ink" stroke-opacity=".28" stroke-width=".8">
          <line
            v-for="([a, b], index) in mystery.design.links"
            :key="`link-${index}`"
            :x1="starX(a)"
            :y1="starY(a)"
            :x2="starX(b)"
            :y2="starY(b)"
          />
        </g>
        <g :fill="palette.ink">
          <circle
            v-for="(star, index) in mystery.design.stars"
            :key="`star-${index}`"
            :cx="starX(index)"
            :cy="starY(index)"
            :r="index % 3 === 0 ? 2.1 : 1.4"
            fill-opacity=".85"
          />
        </g>

        <g
          transform="translate(45 92) scale(1.1)"
          fill="none"
          :stroke="palette.ink"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path v-for="(d, index) in motif.lines" :key="`m-${index}`" :d="d" />
          <path
            v-for="(d, index) in motif.fills ?? []"
            :key="`f-${index}`"
            :d="d"
            :fill="palette.glow"
            fill-opacity=".35"
            stroke-width="1.2"
          />
        </g>

        <g :stroke="palette.ink" stroke-opacity=".18" fill="none">
          <path d="M0 238 q25 -8 50 0 t50 0 t50 0 t50 0" />
          <path d="M-10 250 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0" />
        </g>
      </template>

      <rect
        x="7"
        y="7"
        width="186"
        height="286"
        rx="9"
        fill="none"
        :stroke="locked ? '#d9b877' : palette.ink"
        stroke-opacity=".55"
      />
      <rect
        x="11"
        y="11"
        width="178"
        height="278"
        rx="7"
        fill="none"
        :stroke="locked ? '#d9b877' : palette.ink"
        stroke-opacity=".25"
      />
      <g
        :stroke="locked ? '#d9b877' : palette.ink"
        stroke-opacity=".7"
        fill="none"
        stroke-width="1.3"
      >
        <path
          v-for="(corner, index) in corners"
          :key="`c-${index}`"
          :d="elementMark"
          :transform="corner"
        />
      </g>
      <text
        x="100"
        y="33"
        text-anchor="middle"
        font-family="Georgia, serif"
        font-size="11"
        letter-spacing="4"
        font-weight="700"
        :fill="locked ? '#d9b877' : palette.ink"
      >
        CASE {{ numeral }}
      </text>
    </svg>

    <img
      v-if="!locked && !paintFailed"
      :src="paintedSrc"
      alt=""
      loading="lazy"
      class="absolute inset-0 size-full object-cover transition-opacity duration-500"
      :class="paintLoaded ? 'opacity-100' : 'opacity-0'"
      @load="paintLoaded = true"
      @error="paintFailed = true"
    />

    <div
      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2.5 pb-2.5 pt-8"
    >
      <p
        v-if="paintLoaded && !locked"
        class="text-[9px] font-bold uppercase tracking-[.3em]"
        :style="{ color: palette.ink }"
      >
        Case {{ numeral }}
      </p>
      <p
        class="font-serif font-black uppercase leading-tight text-[#f3e6c8]"
        :class="compact ? 'text-[10px]' : 'text-xs @xs:text-sm'"
      >
        {{ locked ? 'Unopened' : shortTitle }}
      </p>
      <div v-if="record && !compact" class="mt-1.5 flex items-center gap-1">
        <span
          v-for="(gate, index) in record.gates"
          :key="index"
          class="h-1.5 flex-1 rounded-full"
          :class="
            gate === 'pass'
              ? 'bg-[#8fb8b0]'
              : gate === 'fail'
                ? 'bg-[#e08a5a]'
                : 'bg-white/20'
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { caseNumeral } from '~/utils/ecotone/mysteries'
import type {
  CaseRecord,
  Mystery,
  MysteryElement,
  MysteryMotif,
} from '~/utils/ecotone/mysteries'

const props = defineProps<{
  mystery: Mystery
  locked?: boolean
  record?: CaseRecord | null
  /** Small thumbnails drop the gate track. */
  compact?: boolean
}>()

const uid = `mc-${useId()}`
const paintLoaded = ref(false)
const paintFailed = ref(false)
watch(
  () => props.mystery.id,
  () => {
    paintLoaded.value = false
    paintFailed.value = false
  },
)

const numeral = computed(() => caseNumeral(props.mystery.number))
const palette = computed(() => props.mystery.design.palette)
const paintedSrc = computed(
  () => `/images/ecotone/mysteries/${props.mystery.id}.webp`,
)
const shortTitle = computed(() =>
  props.mystery.title.replace(/^The Mystery of /, ''),
)

// Stars sit in the sky band above the motif.
function starX(index: number) {
  return 24 + ((props.mystery.design.stars[index]?.[0] ?? 0) * 152) / 100
}
function starY(index: number) {
  return 46 + ((props.mystery.design.stars[index]?.[1] ?? 0) * 120) / 100
}

const ELEMENT_MARKS: Record<MysteryElement, string> = {
  // A flame, a leaf, a gust and a wave: the four corners carry the element.
  fire: 'M0 8 C-4 3 -1 -1 0 -6 C1 -1 4 3 0 8 Z',
  earth: 'M0 -6 L5 0 L0 6 L-5 0 Z M0 -6 L0 6',
  air: 'M-6 -2 q3 -3 6 0 t6 0 M-6 3 q3 -3 6 0 t6 0',
  water: 'M-7 2 q3.5 -6 7 0 t7 0 M-4 -3 q2 -3 4 0',
}
const elementMark = computed(() => ELEMENT_MARKS[props.mystery.design.element])
const corners = [
  'translate(24 24)',
  'translate(176 24)',
  'translate(24 276)',
  'translate(176 276)',
]

type Drawing = { lines: string[]; fills?: string[] }

// Each motif sits in a 100×100 box and hints at its case without naming anything.
const MOTIFS: Record<MysteryMotif, Drawing> = {
  horns: {
    lines: [
      'M50 42 C34 18 8 30 16 52 C22 68 42 62 38 50 C35 42 26 46 29 53',
      'M50 42 C66 18 92 30 84 52 C78 68 58 62 62 50 C65 42 74 46 71 53',
      'M42 50 Q50 78 58 50',
      'M30 98 L46 72 M70 98 L54 72',
    ],
  },
  herd: {
    lines: [
      'M30 38 Q50 28 70 38',
      'M30 38 L14 32 L27 47 M70 38 L86 32 L73 47',
      'M32 40 Q33 72 42 80 Q50 86 58 80 Q67 72 68 40',
      'M36 30 Q30 18 22 20 M64 30 Q70 18 78 20',
      'M6 96 q11 -7 22 0 t22 0 t22 0 t22 0',
    ],
    fills: ['M44 76 a3 3 0 1 0 0.1 0 Z M56 76 a3 3 0 1 0 0.1 0 Z'],
  },
  'twin-beams': {
    lines: [
      'M44 96 L47 46 L53 46 L56 96 Z',
      'M45 38 h10 v8 h-10 Z',
      'M43 38 L50 30 L57 38',
      'M47 70 h6 M46 82 h8',
    ],
    fills: ['M46 41 L2 22 L2 60 Z', 'M54 41 L98 22 L98 60 Z'],
  },
  'crab-pot': {
    lines: [
      'M22 46 Q50 34 78 46 Q50 58 22 46 Z',
      'M22 46 L24 84 Q50 96 76 84 L78 46',
      'M36 52 L37 90 M50 54 L50 92 M64 52 L63 90',
      'M23 64 Q50 76 77 64',
      'M50 40 L50 10',
      'M14 28 C4 18 10 6 20 10 C14 14 14 20 20 24 Z',
    ],
    fills: ['M50 10 a6 6 0 1 0 0.1 0 Z'],
  },
  mane: {
    lines: [
      'M50 32 a18 18 0 1 0 0.1 0 Z',
      'M50 8 L50 22 M50 82 L50 96 M8 50 L22 50 M78 50 L92 50',
      'M20 20 L30 30 M80 20 L70 30 M20 80 L30 70 M80 80 L70 70',
      'M34 12 L39 25 M66 12 L61 25 M12 34 L25 39 M88 34 L75 39',
      'M12 66 L25 61 M88 66 L75 61 M34 88 L39 75 M66 88 L61 75',
      'M44 46 h0 M56 46 h0 M46 56 L50 60 L54 56',
    ],
  },
  grove: {
    lines: [
      'M50 6 L62 40 L56 40 L66 66 L54 66 L54 96 M50 6 L38 40 L44 40 L34 66 L46 66 L46 96',
      'M22 30 L30 54 L26 54 L32 74 L25 74 L25 96 M22 30 L14 54 L18 54 L12 74 L19 74 L19 96',
      'M78 30 L86 54 L82 54 L88 74 L81 74 L81 96 M78 30 L70 54 L74 54 L68 74 L75 74 L75 96',
      'M6 96 L94 96',
    ],
    fills: ['M45 80 h10 v4 h-10 Z'],
  },
  scales: {
    lines: [
      'M50 16 L50 88',
      'M36 92 L64 92 M42 88 L58 88',
      'M16 30 L84 30',
      'M50 12 a4 4 0 1 0 0.1 0',
      'M18 30 L8 56 M18 30 L28 56 M82 30 L72 56 M82 30 L92 56',
      'M6 56 Q18 66 30 56 Z M70 56 Q82 66 94 56 Z',
    ],
  },
  crows: {
    lines: [
      'M10 84 L90 80',
      'M44 58 Q50 46 62 54 L70 56 L62 58 Q60 70 48 72 L32 80 L40 70 Q38 62 44 58 Z',
      'M16 26 q7 -6 12 2 q5 -8 12 -2',
      'M58 16 q6 -5 10 2 q4 -7 10 -2',
      'M70 36 q5 -4 8 1 q4 -5 8 -1',
    ],
    fills: ['M57 55 a1.5 1.5 0 1 0 0.1 0 Z'],
  },
  arrow: {
    lines: [
      'M14 88 L86 14',
      'M86 14 L72 17 M86 14 L83 28',
      'M14 88 L18 76 M14 88 L26 84 M20 82 L24 70 M20 82 L32 78',
      'M4 96 q12 -6 24 0 t24 0 t24 0 t24 0',
    ],
  },
  'sea-goat': {
    lines: [
      'M40 30 C34 12 18 14 22 28',
      'M50 30 C56 12 72 14 68 28',
      'M38 30 Q36 50 45 56 Q54 50 52 30 Z',
      'M45 56 C52 72 74 68 78 82 C80 92 68 94 66 86',
      'M78 82 L90 76 M78 82 L88 94',
      'M84 8 h8 v44 h-8 Z',
    ],
  },
  jug: {
    lines: [
      'M36 44 Q28 78 40 90 L60 90 Q72 78 64 44 Z',
      'M42 44 L42 32 L58 32 L58 44',
      'M64 52 q14 4 0 24',
      'M24 20 q6 -6 12 0 t12 0 t12 0 t12 0',
      'M30 10 q6 -6 12 0 t12 0 t12 0',
    ],
    fills: ['M40 70 Q50 64 60 70 L59 86 L41 86 Z'],
  },
  'two-fish': {
    lines: [
      'M18 32 Q44 16 70 32 Q44 48 18 32 Z',
      'M70 32 L84 24 L84 40 Z',
      'M82 68 Q56 52 30 68 Q56 84 82 68 Z',
      'M30 68 L16 60 L16 76 Z',
      'M74 38 C98 48 2 52 26 62',
    ],
    fills: ['M28 30 a2 2 0 1 0 0.1 0 Z M72 66 a2 2 0 1 0 0.1 0 Z'],
  },
}

const motif = computed(() => MOTIFS[props.mystery.design.motif])
</script>
