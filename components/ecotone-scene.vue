<template>
  <div class="ecotone-scene overflow-hidden bg-[#0b1d1f]">
    <div class="relative size-full">
      <svg
        class="absolute inset-0 size-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        :aria-label="label"
      >
        <defs>
          <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :stop-color="palette.top" />
            <stop offset="0.65" :stop-color="palette.mid" />
            <stop offset="1" :stop-color="palette.low" />
          </linearGradient>
          <radialGradient :id="`${uid}-glow`" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stop-color="#b6ffcf" stop-opacity="0.9" />
            <stop offset="1" stop-color="#b6ffcf" stop-opacity="0" />
          </radialGradient>
          <linearGradient :id="`${uid}-water`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :stop-color="palette.water" />
            <stop offset="1" stop-color="#06100f" />
          </linearGradient>
          <filter
            :id="`${uid}-blur`"
            x="-20%"
            y="-50%"
            width="140%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter :id="`${uid}-soft`">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <rect width="1600" height="900" :fill="`url(#${uid}-sky)`" />
        <g v-if="palette.night" fill="#fdf6d8">
          <circle
            v-for="star in stars"
            :key="star.key"
            :cx="star.x"
            :cy="star.y"
            :r="star.r"
            :opacity="star.o"
          />
        </g>
        <g v-if="palette.moon">
          <circle
            cx="1240"
            cy="170"
            r="120"
            :fill="`url(#${uid}-glow)`"
            opacity="0.35"
          />
          <circle cx="1240" cy="170" r="58" fill="#f6efd0" />
          <circle
            cx="1262"
            cy="156"
            r="52"
            :fill="palette.top"
            opacity="0.18"
          />
        </g>

        <path
          class="ecotone-signal"
          d="M-20 300 C 160 250, 260 350, 420 300 S 700 240, 860 300 S 1160 360, 1320 290 S 1560 250, 1640 290"
          fill="none"
          stroke="#7dffb2"
          stroke-width="5"
          stroke-linecap="round"
          opacity="0.55"
          :filter="`url(#${uid}-soft)`"
        />
        <path
          d="M-20 300 C 160 250, 260 350, 420 300 S 700 240, 860 300 S 1160 360, 1320 290 S 1560 250, 1640 290"
          fill="none"
          stroke="#d8ffe6"
          stroke-width="1.5"
          opacity="0.7"
        />

        <path
          d="M0 560 L120 470 L260 520 L420 430 L560 500 L720 420 L880 510 L1040 440 L1200 500 L1380 430 L1600 520 L1600 900 L0 900 Z"
          :fill="palette.ridgeFar"
        />
        <path
          d="M0 640 L180 560 L340 610 L520 540 L700 620 L860 560 L1060 630 L1240 560 L1420 620 L1600 580 L1600 900 L0 900 Z"
          :fill="palette.ridgeNear"
        />

        <g :fill="palette.trees">
          <polygon
            v-for="tree in trees"
            :key="tree.key"
            :points="tree.points"
            :opacity="tree.o"
          />
        </g>

        <g v-if="kind === 'meadow'">
          <rect x="0" y="700" width="1600" height="200" fill="#16301f" />
          <g fill="#2a1d14">
            <ellipse cx="420" cy="430" rx="78" ry="92" />
            <rect x="370" y="500" width="100" height="210" rx="30" />
            <rect
              x="300"
              y="520"
              width="80"
              height="22"
              rx="10"
              transform="rotate(-24 340 531)"
            />
            <rect
              x="462"
              y="520"
              width="80"
              height="22"
              rx="10"
              transform="rotate(24 502 531)"
            />
          </g>
          <g fill="#5d8a3c" opacity="0.8">
            <ellipse cx="400" cy="372" rx="60" ry="14" />
            <ellipse cx="446" cy="395" rx="30" ry="10" />
          </g>
          <circle cx="396" cy="430" r="8" fill="#ffe08a" />
          <circle cx="444" cy="430" r="8" fill="#ffe08a" />
          <path
            d="M120 520 Q 520 600 900 520 T 1600 540"
            fill="none"
            stroke="#3b2a1a"
            stroke-width="2"
          />
          <circle
            v-for="bulb in bulbs"
            :key="bulb.key"
            class="ecotone-bulb"
            :cx="bulb.x"
            :cy="bulb.y"
            r="6"
            :fill="bulb.c"
          />
          <rect x="1180" y="560" width="10" height="150" fill="#3b2a1a" />
          <rect
            x="1110"
            y="560"
            width="150"
            height="62"
            rx="6"
            fill="#e7d3a5"
          />
          <rect
            x="1126"
            y="578"
            width="118"
            height="6"
            rx="3"
            fill="#6b4a2a"
            opacity="0.6"
          />
          <rect
            x="1126"
            y="594"
            width="90"
            height="6"
            rx="3"
            fill="#6b4a2a"
            opacity="0.6"
          />
          <ellipse cx="920" cy="780" rx="130" ry="26" fill="#2c4f52" />
          <g stroke="#9fd8a8" stroke-width="3" opacity="0.7">
            <line x1="900" y1="780" x2="880" y2="806" />
            <line x1="940" y1="780" x2="960" y2="806" />
          </g>
        </g>

        <g v-else-if="kind === 'theater'">
          <rect
            x="0"
            y="0"
            width="1600"
            height="900"
            fill="#1c0b0e"
            opacity="0.88"
          />
          <path
            d="M180 900 L180 180 Q 800 40 1420 180 L1420 900 Z"
            fill="#2b1212"
          />
          <path
            d="M180 180 Q 800 40 1420 180 L1420 230 Q 800 100 180 230 Z"
            fill="#c9a24d"
          />
          <path d="M180 230 Q 260 480 220 900 L180 900 Z" fill="#7a1420" />
          <path d="M180 230 Q 380 300 360 900 L180 900 Z" fill="#9e1b2b" />
          <path d="M1420 230 Q 1340 480 1380 900 L1420 900 Z" fill="#7a1420" />
          <path d="M1420 230 Q 1220 300 1240 900 L1420 900 Z" fill="#9e1b2b" />
          <polygon
            points="760,120 840,120 1040,700 560,700"
            fill="#fff3c4"
            opacity="0.12"
          />
          <rect x="300" y="690" width="1000" height="40" fill="#5a3a22" />
          <rect x="300" y="730" width="1000" height="170" fill="#1a0f0b" />
          <rect x="700" y="676" width="200" height="16" fill="#3a2414" />
          <rect
            x="700"
            y="688"
            width="200"
            height="6"
            fill="#ffe9a6"
            class="ecotone-bulb"
          />
          <g fill="#f4f1ea">
            <rect
              x="770"
              y="640"
              width="46"
              height="40"
              rx="8"
              transform="rotate(-8 793 660)"
            />
            <rect
              x="810"
              y="628"
              width="44"
              height="30"
              rx="2"
              transform="rotate(6 832 643)"
              fill="#efe4c4"
            />
          </g>
        </g>

        <g v-else-if="kind === 'beach' || kind === 'bay'">
          <rect
            x="0"
            y="560"
            width="1600"
            height="340"
            :fill="`url(#${uid}-water)`"
          />
          <g stroke="#cfeee4" stroke-width="2" opacity="0.35" fill="none">
            <path v-for="wave in waves" :key="wave.key" :d="wave.d" />
          </g>
          <template v-if="kind === 'beach'">
            <polygon
              points="1040,560 1090,360 1150,330 1210,380 1250,560"
              fill="#132424"
            />
            <polygon
              points="1280,560 1310,430 1360,420 1390,560"
              fill="#0f1e1e"
            />
            <polygon points="200,560 230,470 280,450 320,560" fill="#0f1e1e" />
            <path
              d="M0 720 Q 400 660 800 700 T 1600 690 L1600 900 L0 900 Z"
              fill="#c9b48a"
            />
            <rect
              x="560"
              y="740"
              width="200"
              height="90"
              rx="6"
              fill="#c24a3a"
              transform="rotate(-6 660 785)"
            />
            <g fill="#f5efe1" transform="rotate(-6 660 785)">
              <rect x="580" y="760" width="40" height="40" />
              <rect x="660" y="760" width="40" height="40" />
              <rect x="620" y="800" width="40" height="30" />
            </g>
            <rect
              x="800"
              y="730"
              width="80"
              height="54"
              rx="8"
              fill="#3a6f8f"
            />
            <g fill="#8a7550" opacity="0.8">
              <ellipse
                v-for="print in prints"
                :key="print.key"
                :cx="print.x"
                :cy="print.y"
                rx="26"
                ry="11"
              />
            </g>
          </template>
          <template v-else>
            <g fill="#1d2a2c">
              <polygon points="80,560 80,400 140,350 200,400 200,560" />
              <polygon points="220,560 220,430 300,380 380,430 380,560" />
              <rect x="400" y="440" width="140" height="120" />
              <polygon points="400,440 470,390 540,440" />
            </g>
            <g fill="#ffd27a" opacity="0.85">
              <rect
                v-for="win in windows"
                :key="win.key"
                :x="win.x"
                :y="win.y"
                width="14"
                height="20"
              />
            </g>
            <rect x="700" y="600" width="900" height="16" fill="#3a2a1c" />
            <rect
              v-for="post in posts"
              :key="post.key"
              :x="post.x"
              y="610"
              width="10"
              height="90"
              fill="#2a1d14"
            />
            <path
              d="M1120 640 L1300 640 L1270 680 L1150 680 Z"
              fill="#e8e1d2"
            />
            <rect x="1205" y="560" width="6" height="80" fill="#e8e1d2" />
            <ellipse
              cx="900"
              cy="700"
              rx="90"
              ry="14"
              fill="#7dffb2"
              opacity="0.25"
              :filter="`url(#${uid}-soft)`"
            />
            <g fill="#f2e6c6">
              <circle cx="780" cy="585" r="9" />
              <circle cx="812" cy="585" r="9" />
              <circle cx="844" cy="585" r="9" />
            </g>
          </template>
        </g>

        <g v-else-if="kind === 'plaza'">
          <rect x="0" y="620" width="1600" height="280" fill="#1f2a24" />
          <g fill="#221a1a">
            <rect x="60" y="380" width="260" height="240" />
            <rect x="340" y="420" width="220" height="200" />
            <rect x="1040" y="400" width="240" height="220" />
            <rect x="1300" y="370" width="260" height="250" />
          </g>
          <g fill="#ffcf6b" opacity="0.9">
            <rect
              v-for="win in windows"
              :key="win.key"
              :x="win.x"
              :y="win.y"
              width="18"
              height="26"
            />
          </g>
          <rect x="580" y="430" width="440" height="190" fill="#2a1414" />
          <rect
            x="600"
            y="440"
            width="400"
            height="70"
            rx="8"
            fill="#f2c14e"
            class="ecotone-bulb"
            opacity="0.9"
          />
          <rect x="620" y="455" width="360" height="40" rx="4" fill="#3a1f12" />
          <rect x="780" y="660" width="40" height="80" fill="#4b4f4a" />
          <rect x="788" y="610" width="24" height="56" rx="10" fill="#5d625c" />
          <ellipse cx="800" cy="760" rx="200" ry="30" fill="#2f4a33" />
          <rect x="1000" y="380" width="8" height="300" fill="#2c3b2a" />
          <g fill="#2f5233">
            <ellipse
              cx="1004"
              cy="380"
              rx="70"
              ry="16"
              transform="rotate(-20 1004 380)"
            />
            <ellipse
              cx="1004"
              cy="380"
              rx="70"
              ry="16"
              transform="rotate(20 1004 380)"
            />
          </g>
          <circle
            cx="300"
            cy="700"
            r="40"
            fill="#7dffb2"
            opacity="0.35"
            :filter="`url(#${uid}-soft)`"
          />
          <rect x="296" y="640" width="8" height="120" fill="#2b2b2b" />
        </g>

        <g v-else-if="kind === 'highway'">
          <path
            d="M800 900 C 700 760, 980 700, 860 620 S 760 540, 820 500"
            fill="none"
            stroke="#2c2c2c"
            stroke-width="120"
          />
          <path
            d="M800 900 C 700 760, 980 700, 860 620 S 760 540, 820 500"
            fill="none"
            stroke="#e8d27a"
            stroke-width="4"
            stroke-dasharray="26 22"
          />
          <rect x="1280" y="300" width="10" height="220" fill="#1b1b1b" />
          <polygon
            points="1285,300 1250,520 1320,520"
            fill="none"
            stroke="#1b1b1b"
            stroke-width="6"
          />
          <circle
            cx="1285"
            cy="296"
            r="9"
            fill="#ff4d4d"
            class="ecotone-bulb"
          />
          <g class="ecotone-hover">
            <ellipse
              cx="520"
              cy="230"
              rx="90"
              ry="20"
              fill="#cfe9ff"
              opacity="0.8"
            />
            <ellipse cx="520" cy="222" rx="40" ry="18" fill="#e9f6ff" />
            <polygon
              points="470,250 570,250 640,520 400,520"
              fill="#cfe9ff"
              opacity="0.12"
            />
          </g>
          <rect x="240" y="600" width="200" height="90" fill="#2a1f18" />
          <rect
            x="260"
            y="620"
            width="160"
            height="30"
            fill="#ffcf6b"
            opacity="0.8"
          />
          <g fill="#3a2c20">
            <ellipse cx="500" cy="580" rx="30" ry="40" />
            <rect x="474" y="610" width="52" height="90" rx="20" />
          </g>
          <g>
            <rect
              x="980"
              y="740"
              width="160"
              height="60"
              rx="10"
              fill="#3d4a3a"
            />
            <polygon
              points="900,770 980,750 980,790"
              fill="#fff6c8"
              opacity="0.4"
            />
          </g>
        </g>

        <g v-else-if="kind === 'grove'">
          <g fill="#2a1712">
            <rect x="140" y="0" width="150" height="900" />
            <rect x="560" y="0" width="210" height="900" />
            <rect x="1180" y="0" width="170" height="900" />
          </g>
          <g fill="#fff1b8" opacity="0.14">
            <polygon points="320,0 420,0 700,900 520,900" />
            <polygon points="860,0 940,0 1160,900 1000,900" />
          </g>
          <rect
            x="610"
            y="560"
            width="100"
            height="160"
            rx="50"
            fill="#120806"
          />
          <circle cx="690" cy="650" r="7" fill="#e7c46a" />
          <rect x="0" y="760" width="1600" height="140" fill="#1b2e1d" />
          <path
            d="M0 830 Q 800 760 1600 830"
            fill="none"
            stroke="#6b5a3a"
            stroke-width="40"
          />
          <rect x="900" y="790" width="80" height="34" rx="10" fill="#3b5d73" />
        </g>

        <g v-else-if="kind === 'dunes'">
          <rect
            x="800"
            y="0"
            width="800"
            height="560"
            fill="#3a3a44"
            opacity="0.65"
          />
          <g fill="#1d1d24" opacity="0.8">
            <rect x="1180" y="330" width="40" height="170" />
            <rect x="1240" y="280" width="60" height="220" />
            <rect x="1320" y="360" width="40" height="140" />
          </g>
          <path
            d="M0 640 Q 300 540 600 640 T 1200 620 T 1600 640 L1600 900 L0 900 Z"
            fill="#d8c08a"
          />
          <path
            d="M0 760 Q 400 680 800 760 T 1600 740 L1600 900 L0 900 Z"
            fill="#c4a970"
          />
          <g
            v-for="cart in carts"
            :key="cart.key"
            :transform="`translate(${cart.x} ${cart.y})`"
          >
            <rect
              x="-60"
              y="-50"
              width="120"
              height="44"
              rx="14"
              :fill="cart.c"
            />
            <circle cx="-38" cy="0" r="18" fill="#2a2a2a" />
            <circle cx="38" cy="0" r="18" fill="#2a2a2a" />
            <path
              d="M40 -50 Q 70 -100 100 -70"
              fill="none"
              :stroke="cart.c"
              stroke-width="10"
            />
          </g>
        </g>

        <g v-else-if="kind === 'marsh'">
          <rect x="0" y="600" width="1600" height="300" fill="#2c3b2e" />
          <ellipse
            v-for="pond in ponds"
            :key="pond.key"
            :cx="pond.x"
            :cy="pond.y"
            :rx="pond.rx"
            :ry="pond.ry"
            :fill="`url(#${uid}-water)`"
          />
          <g stroke="#5f7d3a" stroke-width="4" stroke-linecap="round">
            <line
              v-for="reed in reeds"
              :key="reed.key"
              :x1="reed.x"
              :y1="reed.y"
              :x2="reed.x + reed.lean"
              :y2="reed.y - reed.h"
            />
          </g>
          <rect x="300" y="700" width="1000" height="14" fill="#6b5236" />
          <rect
            v-for="post in posts"
            :key="post.key"
            :x="post.x - 400"
            y="712"
            width="8"
            height="40"
            fill="#4d3a26"
          />
          <g fill="#f4f1ea">
            <path d="M1120 690 q 20 -60 30 -110 l 6 0 q -6 50 -20 110 Z" />
            <ellipse cx="1150" cy="575" rx="14" ry="8" />
          </g>
          <g stroke="#1d2a2c" stroke-width="3" fill="none">
            <path d="M420 240 q 20 -16 40 0 q 20 -16 40 0" />
            <path d="M560 200 q 14 -12 28 0 q 14 -12 28 0" />
            <path d="M980 260 q 18 -14 36 0 q 18 -14 36 0" />
          </g>
        </g>

        <g v-else-if="kind === 'rivermouth'">
          <rect
            x="0"
            y="560"
            width="1600"
            height="340"
            :fill="`url(#${uid}-water)`"
          />
          <g stroke="#cfeee4" stroke-width="2" opacity="0.35" fill="none">
            <path v-for="wave in waves" :key="wave.key" :d="wave.d" />
          </g>
          <path
            d="M0 700 Q 300 640 620 690 L 760 900 L 0 900 Z"
            fill="#b9a67e"
          />
          <path
            d="M1600 680 Q 1260 640 980 700 L 860 900 L 1600 900 Z"
            fill="#b09c72"
          />
          <g fill="#6d5a3e">
            <rect
              x="220"
              y="740"
              width="200"
              height="18"
              rx="9"
              transform="rotate(-8 320 749)"
            />
            <rect
              x="1180"
              y="760"
              width="240"
              height="16"
              rx="8"
              transform="rotate(6 1300 768)"
            />
          </g>
          <g fill="#2a2420">
            <rect x="420" y="620" width="16" height="60" rx="6" />
            <rect x="460" y="626" width="16" height="54" rx="6" />
            <rect x="500" y="618" width="16" height="62" rx="6" />
            <rect x="1060" y="612" width="18" height="70" rx="6" />
          </g>
          <circle cx="1069" cy="604" r="12" fill="#2a2420" />
          <rect x="1078" y="630" width="30" height="6" fill="#c9a24d" />
        </g>

        <g class="ecotone-fog" :filter="`url(#${uid}-blur)`" opacity="0.55">
          <ellipse cx="400" cy="620" rx="520" ry="46" fill="#dfe9e4" />
          <ellipse cx="1200" cy="560" rx="560" ry="40" fill="#dfe9e4" />
        </g>
        <g
          class="ecotone-fog ecotone-fog-slow"
          :filter="`url(#${uid}-blur)`"
          opacity="0.4"
        >
          <ellipse cx="900" cy="700" rx="700" ry="50" fill="#e6efe9" />
        </g>
      </svg>
      <img
        v-if="src && !failed"
        :src="src"
        :alt="label"
        class="ecotone-art absolute inset-0 size-full object-cover"
        :class="[
          loadedArt ? 'opacity-100' : 'opacity-0',
          portrait ? 'object-[50%_18%]' : '',
        ]"
        @load="loadedArt = true"
        @error="failed = true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, useId, watch, type Ref } from 'vue'
import type { SceneKind } from '~/utils/ecotone/content'
import {
  DEFAULT_ECOTONE_ART_STYLE,
  ECOTONE_ART_STYLE_INJECTION,
  ecotoneArtSrc,
  type EcotoneArtStyle,
} from '~/utils/ecotone/artStyles'

const props = defineProps<{
  kind: SceneKind
  art?: string
  label: string
  portrait?: boolean
  /** Overrides the board's chosen style (the style picker previews each one). */
  artStyle?: EcotoneArtStyle
}>()

const uid = `eco${(useId() ?? 'scene').replace(/[^a-zA-Z0-9]/g, '')}`
const failed = ref(false)
const loadedArt = ref(false)
// The player's art style comes from the board; outside it, Painted.
const chosenStyle = inject<Ref<EcotoneArtStyle>>(
  ECOTONE_ART_STYLE_INJECTION,
  ref(DEFAULT_ECOTONE_ART_STYLE),
)
const src = computed(() =>
  ecotoneArtSrc(props.art, props.artStyle ?? chosenStyle.value),
)

watch(src, () => {
  failed.value = false
  loadedArt.value = false
})

const PALETTES: Record<
  SceneKind,
  {
    top: string
    mid: string
    low: string
    ridgeFar: string
    ridgeNear: string
    trees: string
    water: string
    night: boolean
    moon: boolean
  }
> = {
  meadow: {
    top: '#0b1630',
    mid: '#243b55',
    low: '#5b6b5a',
    ridgeFar: '#1d3330',
    ridgeNear: '#142622',
    trees: '#0c1a16',
    water: '#2c4f52',
    night: true,
    moon: true,
  },
  theater: {
    top: '#140608',
    mid: '#2a0d12',
    low: '#3a1418',
    ridgeFar: '#1a0a0c',
    ridgeNear: '#140708',
    trees: '#120607',
    water: '#000000',
    night: false,
    moon: false,
  },
  beach: {
    top: '#93a7a8',
    mid: '#c5cfc8',
    low: '#e4e2d4',
    ridgeFar: '#7f9692',
    ridgeNear: '#647c78',
    trees: '#3e5650',
    water: '#3c6670',
    night: false,
    moon: false,
  },
  bay: {
    top: '#7d8f96',
    mid: '#aab5b2',
    low: '#d5d6cb',
    ridgeFar: '#6f8582',
    ridgeNear: '#556b68',
    trees: '#344a45',
    water: '#3f5f68',
    night: false,
    moon: false,
  },
  plaza: {
    top: '#090f22',
    mid: '#1b2742',
    low: '#3a3f4f',
    ridgeFar: '#141d2b',
    ridgeNear: '#101722',
    trees: '#0b1412',
    water: '#1b2742',
    night: true,
    moon: false,
  },
  highway: {
    top: '#05070f',
    mid: '#121a2c',
    low: '#24304a',
    ridgeFar: '#0e1622',
    ridgeNear: '#0a1019',
    trees: '#070d0c',
    water: '#121a2c',
    night: true,
    moon: true,
  },
  grove: {
    top: '#2c3b2a',
    mid: '#566b45',
    low: '#8a915e',
    ridgeFar: '#3b4c33',
    ridgeNear: '#2b3a26',
    trees: '#2a1712',
    water: '#3b5d73',
    night: false,
    moon: false,
  },
  dunes: {
    top: '#6ea7c4',
    mid: '#a9cfc4',
    low: '#e8dcb0',
    ridgeFar: '#7d9a8a',
    ridgeNear: '#5f7d6c',
    trees: '#33493d',
    water: '#4b7a8a',
    night: false,
    moon: false,
  },
  marsh: {
    top: '#3b4f6b',
    mid: '#c98f5e',
    low: '#e8c48a',
    ridgeFar: '#4f6158',
    ridgeNear: '#3e5048',
    trees: '#2a3a30',
    water: '#6f8fa0',
    night: false,
    moon: false,
  },
  rivermouth: {
    top: '#8a9a9c',
    mid: '#b8c2bc',
    low: '#d9d8cc',
    ridgeFar: '#748a84',
    ridgeNear: '#5c726c',
    trees: '#3a504a',
    water: '#46666e',
    night: false,
    moon: false,
  },
}

const palette = computed(() => PALETTES[props.kind])

function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const kindIndex = computed(() =>
  [
    'meadow',
    'theater',
    'beach',
    'bay',
    'plaza',
    'highway',
    'grove',
    'dunes',
    'marsh',
    'rivermouth',
  ].indexOf(props.kind),
)

const stars = computed(() =>
  Array.from({ length: 70 }, (_, i) => ({
    key: i,
    x: Math.round(seeded(i + 1) * 1600),
    y: Math.round(seeded(i + 101) * 380),
    r: 0.8 + seeded(i + 201) * 1.8,
    o: 0.35 + seeded(i + 301) * 0.6,
  })),
)

const trees = computed(() => {
  if (props.kind === 'theater' || props.kind === 'grove') return []
  const count = ['beach', 'bay', 'dunes', 'marsh', 'rivermouth'].includes(
    props.kind,
  )
    ? 10
    : 22
  return Array.from({ length: count }, (_, i) => {
    const s = i + kindIndex.value * 50
    const x = Math.round(seeded(s + 11) * 1600)
    const h = 220 + seeded(s + 23) * 260
    const w = 26 + seeded(s + 37) * 30
    const base = ['beach', 'bay', 'marsh', 'rivermouth'].includes(props.kind)
      ? 560
      : 640 + seeded(s + 41) * 60
    const top = base - h
    const points = [
      `${x},${top}`,
      `${x + w * 0.7},${top + h * 0.35}`,
      `${x + w * 0.4},${top + h * 0.35}`,
      `${x + w},${top + h * 0.7}`,
      `${x + w * 0.2},${top + h * 0.7}`,
      `${x + w * 0.2},${base}`,
      `${x - w * 0.2},${base}`,
      `${x - w * 0.2},${top + h * 0.7}`,
      `${x - w},${top + h * 0.7}`,
      `${x - w * 0.4},${top + h * 0.35}`,
      `${x - w * 0.7},${top + h * 0.35}`,
    ].join(' ')
    return { key: i, points, o: 0.55 + seeded(s + 53) * 0.45 }
  })
})

const bulbs = computed(() =>
  Array.from({ length: 24 }, (_, i) => {
    const x = 120 + i * 62
    const t = (x - 120) / 1480
    const y = 520 + Math.sin(t * Math.PI * 2) * 30 + 20
    return {
      key: i,
      x,
      y,
      c: ['#ffd36e', '#ff8fa3', '#8ee6ff', '#b6ff8f'][i % 4],
    }
  }),
)

const waves = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const y = 600 + i * 38
    return {
      key: i,
      d: `M0 ${y} Q 200 ${y - 10} 400 ${y} T 800 ${y} T 1200 ${y} T 1600 ${y}`,
    }
  }),
)

const prints = computed(() =>
  Array.from({ length: 6 }, (_, i) => ({
    key: i,
    x: 940 + i * 50,
    y: 800 - i * 22 + (i % 2) * 14,
  })),
)

const windows = computed(() => {
  const spots: { key: string; x: number; y: number }[] = []
  const blocks =
    props.kind === 'plaza'
      ? [
          [80, 400],
          [360, 440],
          [1060, 420],
          [1320, 390],
        ]
      : [
          [100, 430],
          [240, 460],
          [420, 470],
        ]
  blocks.forEach(([bx, by], b) => {
    for (let r = 0; r < 3; r += 1)
      for (let c = 0; c < 4; c += 1)
        if (seeded(b * 31 + r * 7 + c) > 0.3)
          spots.push({
            key: `${b}-${r}-${c}`,
            x: (bx ?? 0) + c * 46,
            y: (by ?? 0) + r * 52,
          })
  })
  return spots
})

const ponds = [
  { key: 1, x: 260, y: 780, rx: 240, ry: 50 },
  { key: 2, x: 820, y: 820, rx: 300, ry: 46 },
  { key: 3, x: 1360, y: 770, rx: 220, ry: 44 },
]

const reeds = computed(() =>
  Array.from({ length: 60 }, (_, i) => ({
    key: i,
    x: Math.round(seeded(i + 601) * 1600),
    y: 640 + Math.round(seeded(i + 701) * 240),
    h: 40 + seeded(i + 801) * 70,
    lean: -10 + seeded(i + 901) * 20,
  })),
)

const posts = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({ key: i, x: 720 + i * 74 })),
)

const carts = [
  { key: 1, x: 300, y: 700, c: '#e2574c' },
  { key: 2, x: 760, y: 760, c: '#4cb5e2' },
  { key: 3, x: 1200, y: 720, c: '#f2c14e' },
]
</script>

<style scoped>
.ecotone-fog {
  animation: ecotone-drift 26s ease-in-out infinite alternate;
}
.ecotone-fog-slow {
  animation-duration: 40s;
  animation-direction: alternate-reverse;
}
.ecotone-signal {
  animation: ecotone-pulse 4s ease-in-out infinite;
}
.ecotone-bulb {
  animation: ecotone-twinkle 3s ease-in-out infinite;
}
.ecotone-hover {
  animation: ecotone-bob 6s ease-in-out infinite;
}
.ecotone-art {
  transition: opacity 0.6s ease;
}
@keyframes ecotone-drift {
  from {
    transform: translateX(-60px);
  }
  to {
    transform: translateX(60px);
  }
}
@keyframes ecotone-pulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.8;
  }
}
@keyframes ecotone-twinkle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
@keyframes ecotone-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ecotone-fog,
  .ecotone-signal,
  .ecotone-bulb,
  .ecotone-hover {
    animation: none;
  }
  .ecotone-art {
    transition: none;
  }
}
</style>
