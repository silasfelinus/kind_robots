<template>
  <svg
    viewBox="0 0 200 220"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g v-if="who === 'teo'">
      <path d="M30 220c4-34 24-52 52-58h36c28 6 48 24 52 58Z" fill="#3f6fd1" />
      <path d="M86 162l14 22 14-22" fill="#fff4dc" />
      <path
        d="M84 162l16 26 16-26"
        stroke="#2b4fa0"
        stroke-width="4"
        fill="none"
      />
      <rect x="40" y="196" width="120" height="12" fill="#6b3b2a" />
      <rect x="92" y="194" width="16" height="16" rx="3" fill="#e9b65c" />
      <rect x="88" y="120" width="24" height="44" rx="10" fill="#b0784f" />
      <circle cx="63" cy="98" r="8" fill="#b0784f" />
      <circle cx="137" cy="98" r="8" fill="#b0784f" />
      <ellipse cx="100" cy="94" rx="36" ry="40" fill="#c98e64" />
      <path
        d="M68 108q4 26 32 28 28-2 32-28-4 14-32 16-28-2-32-16Z"
        fill="#3a2620"
      />
      <path
        d="M88 116q12 6 24 0"
        stroke="#7a2e3a"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <g fill="none" stroke="#2a2230" stroke-width="3.5">
        <circle cx="85" cy="94" r="11" />
        <circle cx="115" cy="94" r="11" />
        <path d="M96 94h8" />
      </g>
      <circle cx="85" cy="95" r="3.5" fill="#2a2230" />
      <circle cx="115" cy="95" r="3.5" fill="#2a2230" />
      <path
        d="M76 78q8-5 16-1M108 77q8-4 16 1"
        stroke="#3a2620"
        stroke-width="3.5"
        fill="none"
        stroke-linecap="round"
      />
      <path d="M60 80c-2-36 18-50 40-50s42 14 40 50Z" fill="#e8705f" />
      <rect x="58" y="70" width="84" height="14" rx="7" fill="#c4524a" />
      <circle cx="100" cy="28" r="9" fill="#ffd166" />
      <g transform="rotate(-12 150 150)">
        <rect
          x="128"
          y="128"
          width="54"
          height="40"
          rx="3"
          fill="#bfe3ff"
          stroke="#fff"
          stroke-width="2"
        />
        <path
          d="M136 140h20v12h16M140 160h30"
          stroke="#3f6fd1"
          stroke-width="2"
          fill="none"
        />
        <circle
          cx="156"
          cy="146"
          r="4"
          fill="none"
          stroke="#3f6fd1"
          stroke-width="2"
        />
      </g>
    </g>

    <g v-else>
      <path d="M26 220c6-40 30-60 74-64 44 4 68 24 74 64Z" fill="#45507a" />
      <path d="M58 220c2-30 18-48 42-52 24 4 40 22 42 52Z" fill="#2c3352" />
      <path
        v-for="x in [64, 82, 100, 118, 136]"
        :key="x"
        :d="`M${x} 220v-40`"
        stroke="#d9a35a"
        stroke-width="4"
      />
      <path d="M60 162q40 22 80 0l-6 14q-34 16-68 0Z" fill="#d9a35a" />
      <rect x="90" y="124" width="20" height="34" fill="#8b5e2b" />
      <path d="M90 132h20M90 142h20" stroke="#ffcf82" stroke-width="2" />
      <ellipse cx="100" cy="92" rx="34" ry="40" fill="#f4ede4" />
      <path
        d="M66 92q34 10 68 0"
        stroke="#d6cabb"
        stroke-width="2"
        fill="none"
      />
      <ellipse
        cx="86"
        cy="90"
        rx="8"
        ry="6"
        fill="#2bb5b0"
        class="plumber-cast-eye"
      />
      <ellipse
        cx="114"
        cy="90"
        rx="8"
        ry="6"
        fill="#2bb5b0"
        class="plumber-cast-eye"
      />
      <circle cx="84" cy="88" r="2" fill="#fff" />
      <circle cx="112" cy="88" r="2" fill="#fff" />
      <path
        d="M76 78l18 2M124 78l-18 2"
        stroke="#45507a"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path
        d="M90 112q10 5 20 0"
        stroke="#c4524a"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="72" cy="104" r="5" fill="#e8705f" opacity=".3" />
      <circle cx="128" cy="104" r="5" fill="#e8705f" opacity=".3" />
      <path
        d="M64 96h-10v12"
        stroke="#d9a35a"
        stroke-width="5"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M136 96h10v12"
        stroke="#d9a35a"
        stroke-width="5"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="54" cy="114" r="3" fill="#9be9ec" class="plumber-cast-drip" />
      <g transform="translate(100 48)">
        <circle r="30" fill="none" stroke="#d9a35a" stroke-width="7" />
        <path
          d="M0-30V30M-30 0H30M-21-21l42 42M21-21l-42 42"
          stroke="#d9a35a"
          stroke-width="4"
        />
        <circle r="9" fill="#ffcf82" />
        <circle cy="-30" r="5" fill="#e8705f" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ who: 'teo' | 'spigot' }>()
</script>

<style scoped>
.plumber-cast-eye {
  animation: plumber-cast-blink 5s infinite;
  transform-box: fill-box;
  transform-origin: 50% 50%;
}

.plumber-cast-drip {
  animation: plumber-cast-drip 2.2s ease-in infinite;
}

@keyframes plumber-cast-blink {
  0%,
  94%,
  100% {
    transform: scaleY(1);
  }

  97% {
    transform: scaleY(0.1);
  }
}

@keyframes plumber-cast-drip {
  from {
    transform: translateY(0);
    opacity: 1;
  }

  to {
    transform: translateY(26px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .plumber-cast-eye,
  .plumber-cast-drip {
    animation: none;
  }
}
</style>
