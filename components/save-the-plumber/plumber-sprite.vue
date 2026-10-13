<template>
  <svg
    viewBox="-40 -40 80 80"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="plumber-sprite"
  >
    <g v-if="kind === 'pumpbug'" class="plumber-sprite-bob">
      <path d="M-28 16a28 24 0 0 1 56 0Z" fill="#b77696" />
      <path d="M-16 6a16 11 0 0 1 32 0" fill="#d79ab5" />
      <rect x="20" y="-12" width="8" height="18" rx="3" fill="#8f5a77" />
      <circle cx="-9" cy="8" r="5" fill="#fff" />
      <circle cx="8" cy="8" r="5" fill="#fff" />
      <circle cx="-8" cy="8" r="2.5" fill="#2a2230" />
      <circle cx="9" cy="8" r="2.5" fill="#2a2230" />
      <path
        d="M-20 16v6M-6 16v6M8 16v6M20 16v6"
        stroke="#6d3f58"
        stroke-width="3"
      />
    </g>
    <g v-else-if="kind === 'rivet-roller'" class="plumber-sprite-roll">
      <circle r="24" fill="#8a97a3" stroke="#56636e" stroke-width="5" />
      <circle
        v-for="a in 6"
        :key="a"
        :cx="Math.cos((a * Math.PI) / 3) * 16"
        :cy="Math.sin((a * Math.PI) / 3) * 16"
        r="3"
        fill="#d9e1e6"
      />
      <circle cx="-7" cy="-3" r="5" fill="#fff" />
      <circle cx="7" cy="-3" r="5" fill="#fff" />
      <circle cx="-6" cy="-3" r="2.5" fill="#2a2230" />
      <circle cx="8" cy="-3" r="2.5" fill="#2a2230" />
    </g>
    <g v-else-if="kind === 'umbrella-mite'" class="plumber-sprite-bob">
      <path
        d="M-28-6a28 22 0 0 1 56 0q-7-6-14 0-7-6-14 0-7-6-14 0-7-6-14 0Z"
        fill="#ef5da8"
      />
      <path d="M0-28v-6" stroke="#3a3245" stroke-width="3" />
      <circle cy="10" r="10" fill="#3a3245" />
      <circle cx="-4" cy="8" r="2.5" fill="#fff" />
      <circle cx="4" cy="8" r="2.5" fill="#fff" />
      <path
        d="M-6 18l-6 10M6 18l6 10M0 20v10"
        stroke="#3a3245"
        stroke-width="2.5"
      />
      <path
        d="M-20 4v8M20 4v8"
        stroke="#9fd8f2"
        stroke-width="2"
        stroke-dasharray="2 3"
      />
    </g>
    <g v-else-if="kind === 'moss-lantern'" class="plumber-sprite-glow">
      <circle r="30" fill="#ffcf5a" opacity=".2" />
      <path d="M0-30v8" stroke="#3a1430" stroke-width="3" />
      <rect x="-16" y="-22" width="32" height="40" rx="10" fill="#ffcf5a" />
      <path d="M-16-14q16 8 32 0v-8h-32Z" fill="#5f9b4a" />
      <path d="M-16 12q16-6 32 0v6h-32Z" fill="#5f9b4a" />
      <circle cx="-5" cy="0" r="2.5" fill="#3a1430" />
      <circle cx="5" cy="0" r="2.5" fill="#3a1430" />
    </g>
    <g v-else-if="kind === 'glass-gull'" class="plumber-sprite-bob">
      <path
        d="M-30-4q15-18 30 0 15-18 30 0-10 4-16 0-6 14-14 14t-14-14q-6 4-16 0Z"
        fill="#c9f1ff"
        fill-opacity=".8"
        stroke="#fff"
        stroke-width="2"
      />
      <circle cx="-4" cy="2" r="2" fill="#0d2f57" />
      <path d="M2 4l8 2-8 2Z" fill="#ffd166" />
      <ellipse
        cx="0"
        cy="20"
        rx="7"
        ry="8"
        fill="#f7b83b"
        stroke="#fff4c1"
        stroke-width="2"
      />
    </g>
    <g v-else-if="kind === 'cork-crab'" class="plumber-sprite-scuttle">
      <rect x="-16" y="-14" width="32" height="26" rx="8" fill="#c99a63" />
      <path
        d="M-16-6h32M-16 4h32"
        stroke="#a87a45"
        stroke-width="2"
        stroke-dasharray="3 3"
      />
      <circle cx="-6" cy="-20" r="4" fill="#fff" />
      <circle cx="6" cy="-20" r="4" fill="#fff" />
      <circle cx="-6" cy="-20" r="2" fill="#2a2230" />
      <circle cx="6" cy="-20" r="2" fill="#2a2230" />
      <path
        d="M-16-4q-14-4-14-14 6 0 10 6M16-4q14-4 14-14-6 0-10 6"
        fill="#e8705f"
      />
      <path
        d="M-12 12l-6 10M-4 12l-2 10M4 12l2 10M12 12l6 10"
        stroke="#a87a45"
        stroke-width="3"
      />
    </g>

    <g v-else-if="kind === 'springstep'" class="plumber-sprite-bounce">
      <path d="M-18 4h30q8 0 8 8v6h-38Z" fill="#7a2f3f" />
      <path d="M-18 4V-20h16V4" fill="#7a2f3f" />
      <path
        d="M-14 22l20 4-20 4 20 4-20 4"
        stroke="#e9b65c"
        stroke-width="4"
        fill="none"
        stroke-linejoin="round"
      />
      <path
        d="M-22-30l-6-6M0-34v-6M20-26l6-6"
        stroke="#ffd166"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
    <g v-else-if="kind === 'bottled-storm'" class="plumber-sprite-glow">
      <rect x="-6" y="-34" width="12" height="10" rx="2" fill="#a87a45" />
      <path
        d="M-10-24h20v8q14 6 14 22v14q0 14-14 14h-20q-14 0-14-14V6q0-16 14-22Z"
        fill="#c9f1ff"
        fill-opacity=".7"
        stroke="#fff"
        stroke-width="2"
      />
      <circle cx="-6" cy="8" r="9" fill="#6f7f99" />
      <circle cx="6" cy="6" r="10" fill="#7f8fa9" />
      <path
        d="M2 14l-6 10h6l-4 10"
        stroke="#ffd166"
        stroke-width="3"
        fill="none"
        stroke-linejoin="round"
      />
    </g>
    <g v-else class="plumber-sprite-bob">
      <rect
        x="-14"
        y="-30"
        width="28"
        height="22"
        rx="3"
        fill="#c99a63"
        stroke="#8a6234"
        stroke-width="2"
      />
      <path d="M-14-19h28M0-30v22" stroke="#8a6234" stroke-width="2" />
      <path
        d="M-10-4q10 8 20 0"
        stroke="#5ed1c3"
        stroke-width="3"
        fill="none"
        stroke-dasharray="3 3"
      />
      <path d="M-20 30v-14q0-10 10-10h20q10 0 10 10v14Z" fill="#f1c4a0" />
      <path
        d="M-12 6v-8M-4 6v-10M4 6v-10M12 6v-8"
        stroke="#dba37d"
        stroke-width="4"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ kind: string }>()
</script>

<style scoped>
.plumber-sprite-bob {
  animation: plumber-sprite-bob 2.4s ease-in-out infinite;
}

.plumber-sprite-bounce {
  animation: plumber-sprite-bob 0.9s ease-in-out infinite;
}

.plumber-sprite-roll {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: plumber-sprite-roll 3s linear infinite;
}

.plumber-sprite-scuttle {
  animation: plumber-sprite-scuttle 1.2s ease-in-out infinite alternate;
}

.plumber-sprite-glow {
  animation: plumber-sprite-glow 2.4s ease-in-out infinite;
}

@keyframes plumber-sprite-bob {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}

@keyframes plumber-sprite-roll {
  to {
    transform: rotate(360deg);
  }
}

@keyframes plumber-sprite-scuttle {
  to {
    transform: translateX(6px);
  }
}

@keyframes plumber-sprite-glow {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.75;
  }
}

@media (prefers-reduced-motion: reduce) {
  .plumber-sprite * {
    animation: none !important;
  }
}
</style>
