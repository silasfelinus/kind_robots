<template>
  <svg
    viewBox="0 0 1600 900"
    preserveAspectRatio="xMaxYMid slice"
    xmlns="http://www.w3.org/2000/svg"
    class="plumber-title-scene h-full w-full"
    :style="{ '--px': tilt.x, '--py': tilt.y }"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="plumber-title-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0c2f47" />
        <stop offset=".42" stop-color="#1c6676" />
        <stop offset=".78" stop-color="#e9a578" />
        <stop offset="1" stop-color="#ffd7a0" />
      </linearGradient>
      <radialGradient id="plumber-title-sun" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#ffe7b0" stop-opacity=".95" />
        <stop offset=".4" stop-color="#ffb978" stop-opacity=".45" />
        <stop offset="1" stop-color="#ff9a6a" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="plumber-title-pump" cx=".35" cy=".3" r=".75">
        <stop offset="0" stop-color="#ffe2a2" />
        <stop offset=".55" stop-color="#d79a4d" />
        <stop offset="1" stop-color="#7c4f25" />
      </radialGradient>
      <linearGradient id="plumber-title-pipe" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#2f8f93" />
        <stop offset=".35" stop-color="#7fd6d0" />
        <stop offset=".6" stop-color="#4fb1ae" />
        <stop offset="1" stop-color="#226f76" />
      </linearGradient>
    </defs>

    <rect width="1600" height="900" fill="url(#plumber-title-sky)" />
    <g fill="#fff" class="plumber-twinkle">
      <circle
        v-for="(s, i) in stars"
        :key="i"
        :cx="s[0]"
        :cy="s[1]"
        :r="s[2]"
      />
    </g>
    <circle cx="1080" cy="700" r="420" fill="url(#plumber-title-sun)" />
    <g class="plumber-layer" style="--depth: 0.25">
      <path
        v-for="(r, i) in rivers"
        :key="`r${i}`"
        :d="r"
        class="plumber-rise"
        :style="{ animationDelay: `${i * -0.3}s` }"
        stroke="#a9f0ef"
        :stroke-width="8 - i"
        stroke-linecap="round"
        stroke-dasharray="10 22"
        fill="none"
        opacity=".75"
      />
      <g class="plumber-float">
        <path
          d="M1250 286h380l-60 70-80 62-56 70-46-80-84-48Z"
          fill="#2a2a44"
        />
        <path d="M1250 286h380l-30 26h-322Z" fill="#4c4466" />
        <rect x="1290" y="160" width="38" height="128" fill="#3c4870" />
        <rect x="1550" y="176" width="34" height="112" fill="#3c4870" />
        <path d="M1290 160l19-40 19 40ZM1550 176l17-36 17 36Z" fill="#ffcf82" />
        <rect
          x="1300"
          y="196"
          width="10"
          height="16"
          fill="#ffe7a8"
          class="plumber-glow"
        />
        <rect
          x="1560"
          y="214"
          width="10"
          height="16"
          fill="#ffe7a8"
          class="plumber-glow"
        />
        <circle cx="1440" cy="200" r="86" fill="url(#plumber-title-pump)" />
        <ellipse
          cx="1440"
          cy="200"
          rx="86"
          ry="22"
          fill="none"
          stroke="#ffd99a"
          stroke-width="6"
        />
        <path d="M1440 114v172" stroke="#8b5e2b" stroke-width="6" />
        <circle cx="1440" cy="200" r="24" fill="#9be9ec" class="plumber-glow" />
        <circle cx="1440" cy="200" r="11" fill="#fff" />
        <path
          d="M1354 210h-60q-18 0-18 18v58M1526 214h50q16 0 16 16v56"
          stroke="#b98a4a"
          stroke-width="12"
          fill="none"
        />
      </g>
    </g>
    <g class="plumber-layer" style="--depth: 0.35">
      <g class="plumber-drift" fill="#fff4e4" opacity=".55">
        <ellipse cx="980" cy="420" rx="150" ry="26" />
        <ellipse cx="1060" cy="404" rx="90" ry="26" />
        <ellipse cx="1500" cy="470" rx="170" ry="24" />
        <ellipse cx="560" cy="360" rx="120" ry="20" />
      </g>
    </g>
    <g class="plumber-layer" style="--depth: 0.5">
      <path
        d="M0 640q120-60 260-30t240-10 260-36 220 14 220-30 200 10 200-4V900H0Z"
        fill="#1f5a68"
        opacity=".75"
      />
      <g fill="#174a58">
        <g v-for="t in [380, 450, 520]" :key="`t${t}`">
          <rect :x="t - 5" y="560" width="10" height="70" />
          <circle :cx="t" cy="552" r="34" />
        </g>
        <g transform="translate(760 520)">
          <circle r="78" fill="none" stroke="#174a58" stroke-width="8" />
          <g class="plumber-spin">
            <path
              v-for="a in 6"
              :key="`s${a}`"
              :transform="`rotate(${a * 30})`"
              d="M0-78V78"
              stroke="#174a58"
              stroke-width="4"
            />
          </g>
          <path
            d="M-46 120L0 0l46 120"
            stroke="#174a58"
            stroke-width="10"
            fill="none"
          />
        </g>
        <path d="M934 640l12-130h24l12 130Z" />
        <g transform="translate(958 506)">
          <g class="plumber-spin plumber-spin--fast">
            <path d="M0 0l-9-70h18Z" />
            <path d="M0 0l-9-70h18Z" transform="rotate(90)" />
            <path d="M0 0l-9-70h18Z" transform="rotate(180)" />
            <path d="M0 0l-9-70h18Z" transform="rotate(270)" />
          </g>
        </g>
        <path
          d="M1050 640l20-90 18 90ZM1080 640l24-128 22 128ZM1118 640l16-70 14 70Z"
        />
        <path d="M600 640v-60l40-30 40 30v60ZM660 600h40v40h-40Z" />
      </g>
      <g class="plumber-glow">
        <circle
          v-for="(l, i) in lanterns"
          :key="`l${i}`"
          :cx="l[0]"
          :cy="l[1]"
          r="5"
          :fill="l[2]"
        />
      </g>
    </g>
    <g class="plumber-layer" style="--depth: 0.8">
      <path
        d="M1590 900V560q0-46-46-46h-60"
        stroke="url(#plumber-title-pipe)"
        stroke-width="52"
        fill="none"
      />
      <rect
        x="1460"
        y="484"
        width="26"
        height="60"
        rx="6"
        fill="#e9b65c"
        stroke="#9a6b2a"
        stroke-width="4"
      />
      <path
        v-for="(d, i) in [0, 1, 2]"
        :key="`d${i}`"
        class="plumber-drop"
        :style="{ animationDelay: `${i * 0.5}s` }"
        d="M1446 500c-6 8-6 14 0 16 6-2 6-8 0-16Z"
        fill="#bff3f1"
      />
      <g v-for="pl in platforms" :key="pl.x">
        <rect :x="pl.x" :y="pl.y" :width="pl.w" height="400" fill="#1d4f55" />
        <rect :x="pl.x" :y="pl.y" :width="pl.w" height="22" fill="#e2bc7c" />
        <rect
          :x="pl.x"
          :y="pl.y + 22"
          :width="pl.w"
          height="6"
          fill="#9a6b2a"
          opacity=".6"
        />
        <rect
          v-for="k in Math.floor(pl.w / 46)"
          :key="k"
          :x="pl.x + k * 46 - 26"
          :y="pl.y + 7"
          width="12"
          height="6"
          rx="2"
          fill="#fff1c4"
        />
      </g>
      <g v-for="b in bells" :key="`b${b}`">
        <path :d="`M${b} 760v-30`" stroke="#3e8f62" stroke-width="3" />
        <path
          :d="`M${b - 7} 734c-2-14 3-20 7-20s9 6 7 20q-7-5-14 0Z`"
          fill="#7b8cf2"
        />
      </g>
      <g class="plumber-float plumber-float--quick">
        <g
          v-for="(c, i) in tokens"
          :key="`c${i}`"
          :transform="`translate(${c[0]} ${c[1]})`"
        >
          <ellipse
            rx="13"
            ry="16"
            fill="#f7b83b"
            stroke="#fff4c1"
            stroke-width="4"
          />
          <path d="M0-7v14M-5 0h10" stroke="#a8691c" stroke-width="3" />
        </g>
      </g>
      <g class="plumber-patrol">
        <g transform="translate(1420 722)">
          <path d="M-30 0a30 24 0 0 1 60 0Z" fill="#b77696" />
          <path d="M-18-10a18 12 0 0 1 36 0" fill="#d79ab5" />
          <rect x="22" y="-26" width="8" height="18" rx="3" fill="#8f5a77" />
          <circle cx="-10" cy="-8" r="5" fill="#fff" />
          <circle cx="8" cy="-8" r="5" fill="#fff" />
          <circle cx="-9" cy="-8" r="2.5" fill="#2a2230" />
          <circle cx="9" cy="-8" r="2.5" fill="#2a2230" />
        </g>
      </g>
      <g class="plumber-leap">
        <g transform="translate(1238 700) scale(1.6)">
          <PlumberHeroineRunner :heroine="heroine" />
        </g>
      </g>
    </g>
    <g class="plumber-layer" style="--depth: 1.2">
      <path
        d="M0 900V780q60-30 110 10 30-60 90-40-10 70-60 150Z"
        fill="#0f3b40"
      />
      <path
        d="M1600 900V800q-70-20-120 30-20-50-80-30 20 60 70 100Z"
        fill="#0f3b40"
      />
      <g fill="#c9fbf6" opacity=".7">
        <circle
          v-for="(m, i) in motes"
          :key="`m${i}`"
          class="plumber-mote"
          :style="{ animationDelay: `${m[3]}s`, animationDuration: `${m[4]}s` }"
          :cx="m[0]"
          :cy="m[1]"
          :r="m[2]"
        />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { Heroine } from '~/utils/arcade/games/savePlumberHeroine'

withDefaults(
  defineProps<{ heroine: Heroine; tilt?: { x: number; y: number } }>(),
  { tilt: () => ({ x: 0, y: 0 }) },
)

const stars: [number, number, number][] = [
  [90, 60, 2],
  [210, 140, 1.5],
  [340, 50, 2.2],
  [470, 120, 1.4],
  [600, 40, 1.8],
  [720, 150, 1.3],
  [860, 70, 2],
  [990, 30, 1.5],
  [1120, 110, 1.8],
  [1230, 50, 1.3],
  [1600 - 40, 80, 1.6],
  [150, 250, 1.2],
  [680, 260, 1.4],
  [930, 220, 1.2],
]

const rivers = [
  'M1180 900q-30-200 120-360t120-300',
  'M1260 900q60-220 100-380t70-280',
  'M1350 900q-60-240 30-400t40-260',
  'M1460 900q40-220-10-380t-10-280',
  'M1560 900q-40-230-70-400t-40-260',
]

const lanterns: [number, number, string][] = [
  [370, 560, '#ffcf5a'],
  [462, 548, '#ff9fb8'],
  [530, 562, '#ffcf5a'],
  [640, 590, '#ffd27a'],
  [1104, 600, '#c9b6ff'],
]

const platforms = [
  { x: 840, y: 760, w: 300 },
  { x: 1340, y: 722, w: 300 },
]
const bells = [870, 930, 1090, 1370, 1520]
const tokens: [number, number][] = [
  [1330, 470],
  [1372, 520],
  [1408, 580],
]

const motes: [number, number, number, number, number][] = [
  [120, 880, 3, 0, 9],
  [320, 900, 2, -3, 11],
  [520, 880, 2.5, -6, 10],
  [760, 900, 2, -1, 12],
  [980, 880, 3, -4, 9],
  [1180, 900, 2, -7, 11],
  [1380, 880, 2.5, -2, 10],
  [1540, 900, 2, -5, 12],
]
</script>

<style scoped>
.plumber-layer {
  transform: translate(
    calc(var(--px) * var(--depth) * -26px),
    calc(var(--py) * var(--depth) * -14px)
  );
  transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.plumber-rise {
  animation: plumber-rise 2.4s linear infinite;
}

.plumber-float {
  animation: plumber-float 7s ease-in-out infinite;
}

.plumber-float--quick {
  animation-duration: 2.8s;
}

.plumber-drift {
  animation: plumber-drift 40s ease-in-out infinite alternate;
}

.plumber-glow,
.plumber-twinkle {
  animation: plumber-glow 3s ease-in-out infinite;
}

.plumber-twinkle {
  animation-duration: 4.4s;
}

.plumber-spin {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: plumber-spin 30s linear infinite;
}

.plumber-spin--fast {
  animation-duration: 9s;
}

.plumber-leap {
  animation: plumber-leap 3.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

.plumber-patrol {
  animation: plumber-patrol 6s ease-in-out infinite alternate;
}

.plumber-drop {
  animation: plumber-drop 1.5s ease-in infinite;
}

.plumber-mote {
  animation: plumber-mote 10s linear infinite;
}

@keyframes plumber-rise {
  to {
    stroke-dashoffset: 64;
  }
}

@keyframes plumber-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-14px);
  }
}

@keyframes plumber-drift {
  to {
    transform: translateX(-80px);
  }
}

@keyframes plumber-glow {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

@keyframes plumber-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes plumber-leap {
  0%,
  100% {
    transform: translateY(0);
  }

  45% {
    transform: translateY(-46px);
  }
}

@keyframes plumber-patrol {
  to {
    transform: translateX(-70px);
  }
}

@keyframes plumber-drop {
  from {
    transform: translateY(0);
    opacity: 1;
  }

  to {
    transform: translateY(-90px);
    opacity: 0;
  }
}

@keyframes plumber-mote {
  from {
    transform: translateY(0);
    opacity: 0;
  }

  15% {
    opacity: 0.9;
  }

  to {
    transform: translateY(-640px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .plumber-title-scene * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
