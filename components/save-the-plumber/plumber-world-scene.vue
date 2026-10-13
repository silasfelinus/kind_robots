<template>
  <svg
    viewBox="0 0 320 180"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
    class="plumber-world-scene"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="p.skyTop" />
        <stop offset="1" :stop-color="p.skyBottom" />
      </linearGradient>
      <radialGradient :id="`${uid}-glow`">
        <stop offset="0" :stop-color="p.accent" stop-opacity=".9" />
        <stop offset="1" :stop-color="p.accent" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="320" height="180" :fill="`url(#${uid}-sky)`" />

    <g v-if="world.id === 1">
      <circle cx="262" cy="40" r="44" :fill="`url(#${uid}-glow)`" />
      <circle cx="262" cy="40" r="16" fill="#ffd79a" />
      <path d="M0 128q60-40 120-12t110-6 90-4V180H0Z" :fill="p.far" />
      <g>
        <rect
          x="214"
          y="58"
          width="34"
          height="84"
          :fill="p.ground"
          opacity=".55"
        />
        <ellipse
          cx="231"
          cy="58"
          rx="28"
          ry="12"
          :fill="p.ground"
          opacity=".6"
        />
        <rect
          x="222"
          y="74"
          width="7"
          height="10"
          fill="#fff3c8"
          opacity=".7"
        />
        <rect
          x="234"
          y="92"
          width="7"
          height="10"
          fill="#fff3c8"
          opacity=".7"
        />
      </g>
      <path
        d="M40 150V98q0-18 18-18h40q16 0 16-16V44"
        stroke="#4fa7a6"
        stroke-width="13"
        fill="none"
      />
      <path
        d="M40 150V98q0-18 18-18h40q16 0 16-16V44"
        stroke="#d9f6ec"
        stroke-width="3"
        fill="none"
      />
      <circle
        cx="114"
        cy="44"
        r="9"
        fill="#e9b65c"
        stroke="#9a6b2a"
        stroke-width="2"
      />
      <path
        class="plumber-rise"
        d="M114 34V0"
        stroke="#bff3f1"
        stroke-width="4"
        stroke-linecap="round"
        stroke-dasharray="3 9"
      />
      <rect y="150" width="320" height="30" :fill="p.ground" />
      <rect y="150" width="320" height="5" fill="#d8b37a" />
      <g fill="#6b7fe0">
        <path
          v-for="x in [20, 70, 150, 182, 280, 300]"
          :key="x"
          :d="`M${x} 150c-3-8 0-13 4-14 4 1 7 6 4 14q-4-3-8 0Z`"
        />
      </g>
      <g fill="#3e8f62">
        <path
          v-for="x in [20, 70, 150, 182, 280, 300]"
          :key="`s${x}`"
          :d="`M${x + 3} 150v-16`"
          stroke="#3e8f62"
          stroke-width="1.5"
        />
      </g>
    </g>

    <g v-else-if="world.id === 2">
      <circle cx="70" cy="44" r="40" :fill="`url(#${uid}-glow)`" />
      <circle cx="70" cy="44" r="13" fill="#fff4cf" />
      <path d="M0 112l40-8 30 6 50-14 60 10 70-8 70 10v20H0Z" :fill="p.far" />
      <path
        class="plumber-rise"
        d="M250 110V0"
        stroke="#e6fbff"
        stroke-width="9"
        stroke-linecap="round"
        stroke-dasharray="6 12"
        opacity=".75"
      />
      <rect y="120" width="320" height="60" :fill="p.ground" />
      <path
        class="plumber-drift"
        d="M-20 132q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0"
        stroke="#9fd8f2"
        stroke-width="2.5"
        fill="none"
      />
      <path
        class="plumber-drift plumber-drift--slow"
        d="M-20 152q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0"
        stroke="#6fb6e3"
        stroke-width="2"
        fill="none"
      />
      <g fill="#7a5134">
        <rect x="20" y="104" width="7" height="40" />
        <rect x="64" y="104" width="7" height="40" />
        <rect x="108" y="104" width="7" height="40" />
        <rect x="14" y="102" width="108" height="7" fill="#b98352" />
      </g>
      <g class="plumber-bob">
        <path
          d="M160 124h76l-12 16h-52Z"
          fill="#c9f1ff"
          fill-opacity=".7"
          stroke="#fff"
          stroke-width="1.5"
        />
        <rect x="196" y="88" width="3" height="36" fill="#7a5134" />
        <path d="M199 90l26 26h-26Z" :fill="p.accent" />
      </g>
      <g stroke="#0d2f57" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M120 40q5-5 10 0 5-5 10 0" />
        <path d="M160 58q4-4 8 0 4-4 8 0" />
      </g>
    </g>

    <g v-else-if="world.id === 3">
      <circle cx="160" cy="112" r="70" :fill="`url(#${uid}-glow)`" />
      <circle cx="160" cy="112" r="28" fill="#ffe0a0" />
      <path d="M0 126q50-34 100-14t120-10 100 8V180H0Z" :fill="p.far" />
      <path d="M0 150q80-24 160-6t160-4V180H0Z" :fill="p.ground" />
      <g v-for="t in orchard" :key="t.x">
        <rect
          :x="t.x - 3"
          :y="t.y"
          width="6"
          :height="150 - t.y"
          fill="#3a1430"
        />
        <circle :cx="t.x" :cy="t.y - 4" :r="t.r" fill="#7d3359" />
        <circle
          :cx="t.x - t.r * 0.4"
          :cy="t.y - 10"
          :r="t.r * 0.6"
          fill="#93406a"
        />
        <g class="plumber-glow">
          <rect
            :x="t.x + t.r * 0.3"
            :y="t.y + 4"
            width="7"
            height="9"
            rx="2"
            :fill="p.accent"
          />
          <rect
            :x="t.x - t.r * 0.8"
            :y="t.y"
            width="6"
            height="8"
            rx="2"
            fill="#ffb347"
          />
        </g>
      </g>
      <g fill="#fff7b0" class="plumber-twinkle">
        <circle cx="40" cy="70" r="1.6" />
        <circle cx="120" cy="60" r="1.4" />
        <circle cx="210" cy="74" r="1.6" />
        <circle cx="290" cy="56" r="1.3" />
      </g>
    </g>

    <g v-else-if="world.id === 4">
      <path d="M0 128q80-26 160-8t160-6V180H0Z" :fill="p.far" />
      <g transform="translate(214 78)">
        <circle r="54" fill="none" stroke="#8e4a43" stroke-width="4" />
        <g class="plumber-spin">
          <path
            v-for="a in 8"
            :key="a"
            :transform="`rotate(${a * 45})`"
            d="M0 0V-54"
            stroke="#8e4a43"
            stroke-width="2.5"
          />
          <g
            v-for="a in 8"
            :key="`g${a}`"
            :transform="`rotate(${a * 45}) translate(0 -54)`"
          >
            <rect
              x="-6"
              y="-4"
              width="12"
              height="10"
              rx="3"
              :fill="a % 2 ? '#e8705f' : p.accent"
            />
          </g>
        </g>
        <circle r="6" fill="#ffe08a" />
        <path
          d="M-30 100L0 0l30 100"
          stroke="#6b3330"
          stroke-width="5"
          fill="none"
        />
      </g>
      <g v-for="(tent, i) in [30, 100]" :key="tent">
        <path
          :d="`M${tent} 150l34-52 34 52Z`"
          :fill="i ? '#3f6fd1' : '#c4524a'"
        />
        <path :d="`M${tent + 22} 150l12-52 12 52Z`" fill="#fff3dc" />
        <path :d="`M${tent + 34} 98v-10l10 4-10 4`" fill="#ffe08a" />
      </g>
      <path
        d="M0 40q80 26 160 0t160 0"
        stroke="#4a1f1d"
        stroke-width="1.2"
        fill="none"
      />
      <g>
        <path
          v-for="x in [20, 52, 84, 116, 236, 268, 300]"
          :key="x"
          :d="`M${x} ${40 + Math.sin(x / 50) * 9}l6 10 6-10Z`"
          :fill="x % 3 ? '#e8705f' : '#ffe08a'"
        />
      </g>
      <rect y="150" width="320" height="30" :fill="p.ground" />
      <rect y="150" width="320" height="4" fill="#e7b46f" />
    </g>

    <g v-else-if="world.id === 5">
      <g class="plumber-drift plumber-drift--slow" fill="#fff" opacity=".9">
        <circle cx="40" cy="60" r="18" />
        <circle cx="62" cy="54" r="22" />
        <circle cx="86" cy="62" r="16" />
        <circle cx="230" cy="40" r="14" />
        <circle cx="250" cy="34" r="18" />
      </g>
      <path d="M0 30L320 96" stroke="#40609e" stroke-width="1.5" />
      <g class="plumber-ride">
        <path d="M150 61v10" stroke="#40609e" stroke-width="1.5" />
        <rect x="140" y="70" width="20" height="14" rx="3" fill="#e8705f" />
        <rect x="144" y="73" width="5" height="5" fill="#fff3b8" />
        <rect x="151" y="73" width="5" height="5" fill="#fff3b8" />
      </g>
      <g class="plumber-bob">
        <ellipse cx="260" cy="76" rx="34" ry="11" fill="#e3a92f" />
        <rect x="248" y="86" width="24" height="7" rx="2" fill="#7a4a2a" />
      </g>
      <path
        d="M0 160q30-30 70-24 30-20 60 0 40-14 70 4 40-18 70-2 30 0 50 22V180H0Z"
        fill="#fff"
      />
      <path d="M40 148V92h26v56Z" :fill="p.ground" />
      <g transform="translate(53 92)">
        <g class="plumber-spin plumber-spin--fast">
          <path d="M0 0l-6-34h12Z" fill="#fff3b8" />
          <path d="M0 0l-6-34h12Z" fill="#fff3b8" transform="rotate(90)" />
          <path d="M0 0l-6-34h12Z" fill="#fff3b8" transform="rotate(180)" />
          <path d="M0 0l-6-34h12Z" fill="#fff3b8" transform="rotate(270)" />
        </g>
        <circle r="4" fill="#40609e" />
      </g>
    </g>

    <g v-else-if="world.id === 6">
      <path
        d="M0 0h320v24l-14 26-12-22-16 34-14-30-18 20-12-24-20 30-12-28-16 18-14-22-18 34-14-30-16 22-12-20-18 28-14-26-16 20-12-18-20 24-14-22-16 18V0Z"
        :fill="p.ground"
      />
      <circle
        cx="160"
        cy="118"
        r="80"
        :fill="`url(#${uid}-glow)`"
        opacity=".45"
      />
      <path d="M0 140h320v40H0Z" :fill="p.ground" />
      <rect
        x="90"
        y="146"
        width="140"
        height="10"
        rx="4"
        fill="#9a7be0"
        opacity=".45"
      />
      <g
        v-for="c in crystals"
        :key="c.x"
        :transform="`translate(${c.x} 142) scale(${c.s})`"
      >
        <path d="M0 0l-10-26 10-30 10 30Z" :fill="p.accent" />
        <path d="M0 0v-56l10 30Z" fill="#fff" opacity=".45" />
        <path d="M-14 0l-8-16 6-16 6 16Z" fill="#9b7be0" />
        <path d="M14 0l6-20 8 12-6 8Z" fill="#b39cff" />
      </g>
      <path
        d="M0 96h60q12 0 12 12v32"
        stroke="#5ed1c3"
        stroke-width="7"
        fill="none"
        class="plumber-glow"
      />
      <g fill="#ffffff" class="plumber-twinkle">
        <circle cx="70" cy="70" r="1.4" />
        <circle cx="200" cy="84" r="1.6" />
        <circle cx="260" cy="64" r="1.2" />
      </g>
    </g>

    <g v-else-if="world.id === 7">
      <g fill="#fff" class="plumber-twinkle">
        <circle cx="30" cy="20" r="1.2" />
        <circle cx="90" cy="34" r="1" />
        <circle cx="150" cy="16" r="1.3" />
        <circle cx="200" cy="40" r="1" />
        <circle cx="300" cy="28" r="1.2" />
      </g>
      <circle cx="252" cy="44" r="20" fill="#fff4d8" />
      <circle cx="244" cy="40" r="20" :fill="p.skyTop" opacity=".25" />
      <path d="M0 110l30-20 30 20v70H0Z" :fill="p.far" />
      <path d="M60 120h60l10-22h50l14 22h60l20-16 46 16v60H60Z" :fill="p.far" />
      <path
        d="M0 140l40-26 40 26h40v-22h18v22h50l26-20 30 20h76v40H0Z"
        :fill="p.ground"
      />
      <rect x="128" y="104" width="10" height="14" :fill="p.ground" />
      <g fill="#ffd27a" opacity=".9">
        <rect x="24" y="150" width="7" height="9" />
        <rect x="52" y="152" width="7" height="9" />
        <rect x="210" y="152" width="7" height="9" />
      </g>
      <path
        d="M0 84q80 30 160 4t160 6"
        stroke="#fbe9ff"
        stroke-width=".8"
        fill="none"
        opacity=".7"
      />
      <g class="plumber-glow">
        <circle
          v-for="(x, i) in [20, 50, 80, 110, 140, 180, 210, 240, 270, 300]"
          :key="x"
          :cx="x"
          :cy="88 + Math.sin(x / 50) * 8 + (x < 160 ? 6 : 2)"
          r="3"
          :fill="['#ff9fb8', '#ffd27a', '#7fe0d6', '#c9b6ff'][i % 4]"
        />
      </g>
    </g>

    <g v-else>
      <g fill="#fff" class="plumber-twinkle">
        <circle cx="40" cy="20" r="1.2" />
        <circle cx="110" cy="40" r="1" />
        <circle cx="290" cy="30" r="1.2" />
      </g>
      <path
        v-for="x in [110, 160, 210]"
        :key="x"
        class="plumber-rise"
        :d="`M${x} 180q${(x - 160) / 2} -40 ${(160 - x) / 3} -100`"
        stroke="#9be9ec"
        stroke-width="4"
        stroke-linecap="round"
        stroke-dasharray="5 9"
        fill="none"
        opacity=".85"
      />
      <g class="plumber-bob">
        <path d="M96 84h128l-30 40-34 22-34-22Z" fill="#3a2f4a" />
        <path d="M96 84h128l-12 10H108Z" fill="#6c5a7a" />
        <rect x="112" y="46" width="18" height="40" fill="#45507a" />
        <rect x="190" y="40" width="18" height="46" fill="#45507a" />
        <path d="M112 46l9-14 9 14ZM190 40l9-14 9 14Z" :fill="p.accent" />
        <circle
          cx="160"
          cy="58"
          r="26"
          fill="#d9a35a"
          stroke="#ffcf82"
          stroke-width="3"
        />
        <path d="M134 58h52M160 32v52" stroke="#8b5e2b" stroke-width="3" />
        <circle cx="160" cy="58" r="8" fill="#9be9ec" class="plumber-glow" />
      </g>
      <path d="M0 160q60-16 120-2t120-6 80 2V180H0Z" fill="#2c3352" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { PlumberWorld } from '~/utils/arcade/games/savePlumberWorlds'

const props = defineProps<{ world: PlumberWorld }>()
const uid = `plw-${useId()}`
const p = computed(() => props.world.palette)

const orchard = [
  { x: 40, y: 104, r: 22 },
  { x: 108, y: 118, r: 18 },
  { x: 228, y: 110, r: 20 },
  { x: 290, y: 100, r: 24 },
]
const crystals = [
  { x: 40, s: 1.1 },
  { x: 120, s: 0.7 },
  { x: 200, s: 1.3 },
  { x: 280, s: 0.9 },
]
</script>

<style scoped>
.plumber-world-scene :deep(.plumber-rise) {
  animation: plumber-rise 1.6s linear infinite;
}

.plumber-world-scene :deep(.plumber-drift) {
  animation: plumber-drift 6s linear infinite;
}

.plumber-world-scene :deep(.plumber-drift--slow) {
  animation-duration: 14s;
}

.plumber-world-scene :deep(.plumber-bob) {
  animation: plumber-bob 3.6s ease-in-out infinite;
}

.plumber-world-scene :deep(.plumber-glow) {
  animation: plumber-glow 2.6s ease-in-out infinite;
}

.plumber-world-scene :deep(.plumber-twinkle) {
  animation: plumber-glow 1.8s ease-in-out infinite;
}

.plumber-world-scene :deep(.plumber-spin) {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: plumber-spin 18s linear infinite;
}

.plumber-world-scene :deep(.plumber-spin--fast) {
  animation-duration: 4s;
}

.plumber-world-scene :deep(.plumber-ride) {
  animation: plumber-ride 9s ease-in-out infinite alternate;
}

@keyframes plumber-rise {
  to {
    stroke-dashoffset: 24;
  }
}

@keyframes plumber-drift {
  to {
    transform: translateX(20px);
  }
}

@keyframes plumber-bob {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

@keyframes plumber-glow {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}

@keyframes plumber-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes plumber-ride {
  from {
    transform: translate(-90px, -28px);
  }

  to {
    transform: translate(90px, 28px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .plumber-world-scene :deep(*) {
    animation: none !important;
  }
}
</style>
