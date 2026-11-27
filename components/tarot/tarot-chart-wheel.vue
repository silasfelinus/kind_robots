<script setup lang="ts">
import { computed } from 'vue'
import type { NatalChart } from '~/utils/astrology/chart'
import { ASPECTS, CHART_POINTS, ZODIAC_SIGNS } from '~/utils/astrology/zodiac'

const props = defineProps<{ chart: NatalChart }>()

const SIZE = 400
const C = SIZE / 2
const R_OUTER = 192
const R_SIGN = 162
const R_HOUSE = 132
const R_PLANET = 112
const R_ASPECT = 86

const ELEMENT_FILL: Record<string, string> = {
  fire: 'color-mix(in oklch, var(--color-error) 20%, transparent)',
  earth: 'color-mix(in oklch, var(--color-success) 20%, transparent)',
  air: 'color-mix(in oklch, var(--color-info) 20%, transparent)',
  water: 'color-mix(in oklch, var(--color-primary) 20%, transparent)',
}

const anchor = computed(
  () =>
    props.chart.points.find((point) => point.id === 'ascendant')?.longitude ??
    0,
)

function angleFor(longitude: number) {
  return ((180 + longitude - anchor.value) * Math.PI) / 180
}

function polar(longitude: number, radius: number) {
  const angle = angleFor(longitude)
  return { x: C + radius * Math.cos(angle), y: C - radius * Math.sin(angle) }
}

function arc(start: number, end: number, outer: number, inner: number) {
  const a = polar(start, outer)
  const b = polar(end, outer)
  const c = polar(end, inner)
  const d = polar(start, inner)
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 1 ${d.x} ${d.y} Z`
}

const signs = computed(() =>
  ZODIAC_SIGNS.map((sign, index) => ({
    ...sign,
    path: arc(index * 30, index * 30 + 30, R_OUTER, R_SIGN),
    label: polar(index * 30 + 15, (R_OUTER + R_SIGN) / 2),
    fill: ELEMENT_FILL[sign.element],
  })),
)

const houseLines = computed(() =>
  (props.chart.houses ?? []).map((cusp, index) => ({
    index: index + 1,
    from: polar(cusp, R_SIGN),
    to: polar(cusp, R_ASPECT),
    label: polar(
      cusp +
        (((props.chart.houses?.[(index + 1) % 12] ?? cusp + 30) - cusp + 360) %
          360) /
          2,
      (R_HOUSE + R_ASPECT) / 2 + 6,
    ),
    angle: index === 0 || index === 3 || index === 6 || index === 9,
  })),
)

const planets = computed(() => {
  const placed: Array<{
    id: string
    glyph: string
    longitude: number
    display: number
    retrograde: boolean
  }> = []
  const sorted = props.chart.points
    .filter((point) => point.id !== 'ascendant' && point.id !== 'midheaven')
    .map((point) => ({
      id: point.id,
      glyph: CHART_POINTS[point.id].glyph,
      longitude: point.longitude,
      display: point.longitude,
      retrograde: point.retrograde,
    }))
    .sort((a, b) => a.longitude - b.longitude)
  for (const point of sorted) {
    const previous = placed[placed.length - 1]
    if (previous && point.display - previous.display < 7) {
      point.display = previous.display + 7
    }
    placed.push(point)
  }
  return placed.map((point) => ({
    ...point,
    at: polar(point.display, R_PLANET),
    tick: polar(point.longitude, R_HOUSE),
    tickInner: polar(point.longitude, R_HOUSE - 6),
  }))
})

const aspectLines = computed(() =>
  props.chart.aspects
    .filter((aspect) => aspect.aspect !== 'conjunction')
    .map((aspect) => {
      const a = props.chart.points.find((point) => point.id === aspect.a)
      const b = props.chart.points.find((point) => point.id === aspect.b)
      const info = ASPECTS.find((entry) => entry.id === aspect.aspect)
      if (!a || !b || !info) return null
      return {
        key: `${aspect.a}-${aspect.b}`,
        from: polar(a.longitude, R_ASPECT),
        to: polar(b.longitude, R_ASPECT),
        tone: info.tone,
      }
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line)),
)
</script>

<template>
  <svg
    :viewBox="`0 0 ${SIZE} ${SIZE}`"
    class="tarot-wheel h-full max-h-full w-full"
    role="img"
    aria-label="Natal chart wheel"
  >
    <circle :cx="C" :cy="C" :r="R_OUTER" class="wheel-ring" />
    <path
      v-for="sign in signs"
      :key="sign.id"
      :d="sign.path"
      :fill="sign.fill"
      class="wheel-sign"
    />
    <text
      v-for="sign in signs"
      :key="`${sign.id}-glyph`"
      :x="sign.label.x"
      :y="sign.label.y"
      class="wheel-sign-glyph"
      text-anchor="middle"
      dominant-baseline="central"
    >
      {{ sign.glyph }}
    </text>
    <circle :cx="C" :cy="C" :r="R_SIGN" class="wheel-ring" />
    <circle :cx="C" :cy="C" :r="R_HOUSE" class="wheel-ring faint" />
    <circle :cx="C" :cy="C" :r="R_ASPECT" class="wheel-ring" />
    <line
      v-for="house in houseLines"
      :key="`house-${house.index}`"
      :x1="house.from.x"
      :y1="house.from.y"
      :x2="house.to.x"
      :y2="house.to.y"
      class="wheel-house"
      :class="{ angle: house.angle }"
    />
    <text
      v-for="house in houseLines"
      :key="`house-label-${house.index}`"
      :x="house.label.x"
      :y="house.label.y"
      class="wheel-house-label"
      text-anchor="middle"
      dominant-baseline="central"
    >
      {{ house.index }}
    </text>
    <line
      v-for="line in aspectLines"
      :key="line.key"
      :x1="line.from.x"
      :y1="line.from.y"
      :x2="line.to.x"
      :y2="line.to.y"
      class="wheel-aspect"
      :class="line.tone"
    />
    <g v-for="planet in planets" :key="planet.id">
      <line
        :x1="planet.tick.x"
        :y1="planet.tick.y"
        :x2="planet.tickInner.x"
        :y2="planet.tickInner.y"
        class="wheel-tick"
      />
      <text
        :x="planet.at.x"
        :y="planet.at.y"
        class="wheel-planet"
        text-anchor="middle"
        dominant-baseline="central"
      >
        {{ planet.glyph }}
        <tspan v-if="planet.retrograde" class="wheel-retro" dy="-6">ʀ</tspan>
      </text>
    </g>
  </svg>
</template>

<style scoped>
.wheel-ring {
  fill: none;
  stroke: currentColor;
  stroke-opacity: 0.45;
  stroke-width: 1;
}

.wheel-ring.faint {
  stroke-opacity: 0.15;
}

.wheel-sign {
  stroke: currentColor;
  stroke-opacity: 0.25;
  stroke-width: 0.6;
}

.wheel-sign-glyph {
  fill: currentColor;
  font-size: 16px;
}

.wheel-house {
  stroke: currentColor;
  stroke-opacity: 0.3;
  stroke-width: 0.8;
}

.wheel-house.angle {
  stroke-opacity: 0.85;
  stroke-width: 1.6;
}

.wheel-house-label {
  fill: currentColor;
  fill-opacity: 0.5;
  font-size: 9px;
}

.wheel-aspect {
  stroke-width: 1;
  stroke-opacity: 0.7;
}

.wheel-aspect.flow {
  stroke: var(--color-info);
}

.wheel-aspect.friction {
  stroke: var(--color-error);
}

.wheel-tick {
  stroke: currentColor;
  stroke-width: 1.2;
}

.wheel-planet {
  fill: currentColor;
  font-size: 15px;
  font-weight: 700;
}

.wheel-retro {
  font-size: 8px;
}
</style>
