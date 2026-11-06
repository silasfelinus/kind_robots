<!-- components/cthulhuquarium/cthulhuquarium-ui-art.vue
     One piece of the console's painted UI (cthulhuquarium/t-098): a tab icon,
     the coin, a HUD or meter glyph, the plinth or the gilt corner. The painted
     render lands at assets/images/cthulhuquarium/ui/<name>.webp; until it does,
     an SVG of the same box draws in its place, so the swap never moves layout. -->
<template>
  <span class="cq-ui-art" :class="`cq-ui-art-${name}`" aria-hidden="true">
    <img v-if="paintedUrl" :src="paintedUrl" alt="" draggable="false" />
    <svg
      v-else-if="name === 'tab-tank' || name === 'capacity'"
      viewBox="0 0 64 64"
    >
      <rect x="9" y="17" width="46" height="33" rx="3" :fill="ink" />
      <rect x="11" y="23" width="42" height="25" rx="1.5" fill="#1f6f6a" />
      <rect x="11" y="23" width="42" height="5" fill="#7fd4c1" opacity="0.35" />
      <path
        d="M17 48c-3-5 3-8 0-13s2-7 1-9M23 48c2-4-2-6 1-10"
        fill="none"
        stroke="#5c9c6b"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M30 36c4-4 11-4 15 0-4 4-11 4-15 0zm15 0 6-4v8z"
        :fill="bone"
        opacity="0.9"
      />
      <circle cx="41" cy="35" r="1" :fill="ink" />
      <circle cx="47" cy="27" r="1.4" fill="none" :stroke="bone" />
      <circle cx="44" cy="22" r="1" fill="none" :stroke="bone" />
      <rect
        x="9"
        y="17"
        width="46"
        height="33"
        rx="3"
        fill="none"
        :stroke="brass"
        stroke-width="2.4"
      />
      <path d="M6 13h52l-2 5H8z" :fill="brass" />
      <path d="M6 50h52l-3 6H9z" :fill="brassDark" />
      <path d="M8 13h48" :stroke="brassLight" stroke-width="1" />
    </svg>
    <svg
      v-else-if="name === 'tab-feed' || name === 'meter-hunger'"
      viewBox="0 0 64 64"
    >
      <ellipse cx="32" cy="30" rx="22" ry="6" :fill="ink" />
      <circle cx="24" cy="27" r="3.4" :fill="amber" />
      <circle cx="31" cy="25" r="3.6" fill="#c98a3a" />
      <circle cx="38" cy="27" r="3.4" :fill="amber" />
      <circle cx="28" cy="30" r="3.2" fill="#a86d2c" />
      <circle cx="35" cy="30.5" r="3.2" fill="#d79c4b" />
      <circle cx="32" cy="22" r="3" fill="#e8b765" />
      <path
        d="M10 30h44c-1 12-10 20-22 20S11 42 10 30z"
        fill="#3a4a4c"
        :stroke="brass"
        stroke-width="2"
      />
      <path d="M14 34h36" :stroke="brassLight" stroke-width="1" opacity="0.6" />
      <path d="M24 50h16l2 5H22z" :fill="brassDark" />
      <circle cx="32" cy="41" r="3" fill="none" :stroke="brass" />
      <circle cx="32" cy="41" r="1" :fill="brass" />
    </svg>
    <svg v-else-if="name === 'tab-creatures'" viewBox="0 0 64 64">
      <path
        d="M20 38c-6 4-10 10-8 16M26 41c-3 5-3 10 1 14M33 41c1 5 4 10 9 12M38 38c5 3 11 4 15 1"
        fill="none"
        stroke="#a9c7bd"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <circle
        cx="34"
        cy="26"
        r="17"
        fill="#4f7e74"
        :stroke="brass"
        stroke-width="2"
      />
      <path
        d="M34 26m0-12a12 12 0 1 1-12 12a8.5 8.5 0 0 1 8.5-8.5a6 6 0 0 1 6 6a4 4 0 0 1-4 4"
        fill="none"
        :stroke="bone"
        stroke-width="1.6"
        opacity="0.75"
      />
      <path
        d="M19 20c4-1 8 1 10 4"
        fill="none"
        stroke="#2c4d47"
        stroke-width="1.4"
      />
      <ellipse cx="21" cy="31" rx="3.4" ry="2.6" :fill="bone" />
      <circle cx="21.6" cy="31" r="1.3" :fill="ink" />
    </svg>
    <svg v-else-if="name === 'tab-relics'" viewBox="0 0 64 64">
      <path
        d="M14 10h34l4 6v38l-6 4H16l-4-6V14z"
        fill="#56625e"
        stroke="#2c3431"
        stroke-width="1.6"
      />
      <path d="M17 14h28l3 4v32l-4 3H19l-3-4V17z" fill="#6d7b74" />
      <path
        d="M20 33c6-8 18-8 24 0-6 8-18 8-24 0z"
        fill="none"
        :stroke="verdigris"
        stroke-width="2.2"
      />
      <circle cx="32" cy="33" r="4" :fill="verdigris" />
      <circle cx="32" cy="33" r="1.6" :fill="ink" />
      <path
        d="M32 20v4M32 42v4M22 22l3 3M42 22l-3 3"
        :stroke="verdigris"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <path d="M44 12l6 8" stroke="#2c3431" stroke-width="1.2" />
    </svg>
    <svg v-else-if="name === 'tab-market'" viewBox="0 0 64 64">
      <path d="M12 26h40v26H12z" fill="#2b2420" />
      <path d="M8 16 14 8h36l6 8z" :fill="brassDark" />
      <path
        d="M8 16h48v6c0 3-3 5-6 5s-6-2-6-5c0 3-3 5-6 5s-6-2-6-5c0 3-3 5-6 5s-6-2-6-5c0 3-3 5-6 5s-6-2-6-5z"
        :fill="oxblood"
      />
      <path
        d="M20 16v6c0 3-3 5-6 5M32 16v6M44 16v6c0 3 3 5 6 5"
        fill="none"
        :stroke="bone"
        stroke-width="5"
        opacity="0.85"
      />
      <path d="M8 22h48" :stroke="brass" stroke-width="1" />
      <path d="M10 50h44v5H10z" :fill="brass" />
      <path d="M17 29v8M47 29v8" :stroke="brass" stroke-width="1.4" />
      <rect x="14" y="37" width="6" height="8" rx="2" :fill="amber" />
      <rect x="44" y="37" width="6" height="8" rx="2" :fill="amber" />
      <path
        d="M26 41c4-5 8-5 12 0-4 5-8 5-12 0z"
        fill="none"
        :stroke="brass"
        stroke-width="1.6"
      />
      <circle cx="32" cy="41" r="1.6" :fill="brass" />
    </svg>
    <svg v-else-if="name === 'coin'" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="#7a5a22" />
      <circle cx="32" cy="31" r="27" fill="#d9a843" />
      <circle
        cx="32"
        cy="31"
        r="21"
        fill="#c8952f"
        stroke="#f2d488"
        stroke-width="1.4"
      />
      <path
        d="M18 31c7-9 21-9 28 0-7 9-21 9-28 0z"
        fill="#a87a24"
        stroke="#5e4316"
        stroke-width="1.8"
      />
      <circle cx="32" cy="31" r="5" fill="#5e4316" />
      <circle cx="30.5" cy="29.5" r="1.4" fill="#f2d488" />
      <path
        d="M14 22a21 21 0 0 1 12-10"
        fill="none"
        stroke="#fff3c4"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.6"
      />
    </svg>
    <svg
      v-else-if="name === 'plinth'"
      viewBox="0 0 160 48"
      preserveAspectRatio="xMidYMax meet"
    >
      <ellipse cx="80" cy="12" rx="62" ry="9" fill="#3b4644" />
      <ellipse cx="80" cy="10" rx="58" ry="7" fill="#5d6b67" />
      <ellipse
        cx="80"
        cy="10"
        rx="58"
        ry="7"
        fill="none"
        :stroke="brass"
        stroke-width="1.4"
      />
      <path d="M22 12v14c0 6 26 10 58 10s58-4 58-10V12" fill="#2a3230" />
      <path
        d="M22 22c0 6 26 10 58 10s58-4 58-10"
        fill="none"
        :stroke="brass"
        stroke-width="2"
      />
      <path d="M14 36h132l4 10H10z" fill="#1d2321" />
      <path d="M14 36h132" :stroke="brassDark" stroke-width="1.5" />
    </svg>
    <svg v-else-if="name === 'corner-ornament'" viewBox="0 0 80 80">
      <path
        d="M4 76V20C4 11 11 4 20 4h56"
        fill="none"
        :stroke="brassDark"
        stroke-width="6"
      />
      <path
        d="M4 76V20C4 11 11 4 20 4h56"
        fill="none"
        :stroke="brass"
        stroke-width="2.4"
      />
      <path
        d="M11 70V24c0-7 6-13 13-13h46"
        fill="none"
        :stroke="brassLight"
        stroke-width="1"
        opacity="0.6"
      />
      <path
        d="M14 30c0-9 7-16 16-16 6 0 10 4 10 9 0 4-3 7-7 7-3 0-5-2-5-5"
        fill="none"
        :stroke="verdigris"
        stroke-width="2.6"
        stroke-linecap="round"
      />
      <circle cx="12" cy="12" r="4.5" :fill="brass" :stroke="brassDark" />
      <circle cx="12" cy="12" r="1.6" :fill="ink" />
      <circle cx="4" cy="44" r="2" :fill="brassLight" />
      <circle cx="44" cy="4" r="2" :fill="brassLight" />
    </svg>
    <svg v-else-if="name === 'meter-clean'" viewBox="0 0 64 64">
      <path
        d="M24 8h16v22H24z"
        fill="#6b4d2a"
        :stroke="brassDark"
        stroke-width="1.6"
      />
      <path d="M20 30h24l2 6H18z" :fill="brass" />
      <path d="M19 36h26l3 18H16z" :fill="bone" opacity="0.9" />
      <path
        d="M22 40v12M27 40v12M32 40v12M37 40v12M42 40v12"
        stroke="#9f9480"
        stroke-width="1.2"
      />
      <path d="M50 14c3 4 5 7 5 9a5 5 0 0 1-10 0c0-2 2-5 5-9z" fill="#7fd4c1" />
    </svg>
    <svg v-else-if="name === 'meter-mood'" viewBox="0 0 64 64">
      <path
        d="M10 32c8-12 36-12 44 0-8 12-36 12-44 0z"
        fill="#2c4d47"
        :stroke="brass"
        stroke-width="2"
      />
      <circle cx="32" cy="32" r="8" :fill="verdigris" />
      <circle cx="32" cy="32" r="3.5" :fill="ink" />
      <circle cx="30" cy="30" r="1.3" :fill="bone" />
    </svg>
    <svg v-else-if="name === 'day-moon'" viewBox="0 0 64 64">
      <path
        d="M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8z"
        :fill="bone"
        :stroke="brass"
        stroke-width="1.6"
      />
      <circle cx="30" cy="38" r="3" fill="#cfc2a4" />
      <circle cx="22" cy="28" r="2" fill="#cfc2a4" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CthulhuquariumUiArtName } from '~/utils/cthulhuquariumConsole'

const props = defineProps<{ name: CthulhuquariumUiArtName }>()

const painted = import.meta.glob<string>(
  '../../assets/images/cthulhuquarium/ui/*.webp',
  { query: '?url', import: 'default' },
)

const ink = '#0d1517'
const bone = '#e9dfc8'
const brass = '#c49a52'
const brassLight = '#ecd08e'
const brassDark = '#6f5428'
const amber = '#e8a548'
const verdigris = '#5fa892'
const oxblood = '#7a2429'

const paintedUrl = ref<string | null>(null)

watch(
  () => props.name,
  async (name) => {
    paintedUrl.value = null
    const load = painted[`../../assets/images/cthulhuquarium/ui/${name}.webp`]
    if (!load) return
    const url = await load()
    if (name === props.name) paintedUrl.value = url
  },
  { immediate: true },
)
</script>

<style scoped>
.cq-ui-art {
  display: inline-block;
  position: relative;
  flex-shrink: 0;
}
.cq-ui-art > img,
.cq-ui-art > svg {
  display: block;
  height: 100%;
  width: 100%;
  object-fit: contain;
  overflow: visible;
}
</style>
