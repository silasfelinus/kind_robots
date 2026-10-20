<template>
  <section
    class="eod-splash absolute inset-0 z-30 grid cursor-pointer place-items-center overflow-hidden bg-base-200"
    :class="leaving ? 'eod-splash-leave' : ''"
    aria-label="Emperor of Dust"
    role="button"
    tabindex="0"
    @click="leave"
    @keydown.enter.prevent="leave"
    @keydown.space.prevent="leave"
  >
    <img
      src="/emperor-of-dust/map/wasteland.webp"
      alt=""
      class="eod-splash-map absolute inset-0 h-full w-full object-cover"
    />
    <div class="eod-splash-veil absolute inset-0" aria-hidden="true" />
    <div class="eod-splash-sun absolute" aria-hidden="true" />
    <span
      v-for="mote in MOTES"
      :key="mote.id"
      class="eod-mote absolute rounded-full"
      :style="mote.style"
      aria-hidden="true"
    />

    <div
      class="relative z-10 flex flex-col items-center gap-3 px-6 text-center"
    >
      <Icon name="kind-icon:crown" class="eod-splash-crown text-6xl" />
      <h2
        class="eod-display eod-splash-title text-4xl text-warning sm:text-6xl"
      >
        <span
          v-for="(letter, i) in TITLE"
          :key="i"
          class="eod-splash-letter inline-block whitespace-pre"
          :style="{ animationDelay: 0.35 + i * 0.06 + 's' }"
          >{{ letter }}</span
        >
      </h2>
      <p
        class="eod-splash-line text-[11px] font-semibold uppercase tracking-[0.3em] sm:text-sm"
      >
        Rule a fractured kingdom. Send them into the wasteland. Remember what
        matters.
      </p>
      <p
        class="eod-splash-hint mt-6 text-sm italic"
        :class="ready ? 'opacity-100' : 'opacity-0'"
      >
        {{ ready ? 'Tap to enter the fortress' : 'The dust is settling…' }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ ready: boolean }>()
const emit = defineEmits<{ done: [] }>()

const TITLE = 'Emperor of Dust'.split('')
const MOTES = Array.from({ length: 26 }, (_, id) => {
  const size = 2 + ((id * 7) % 5)
  return {
    id,
    style: {
      left: `${(id * 37) % 100}%`,
      top: `${(id * 53) % 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${9 + ((id * 3) % 8)}s`,
      animationDelay: `${-((id * 11) % 9)}s`,
    },
  }
})

const leaving = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function leave() {
  if (!props.ready || leaving.value) return
  leaving.value = true
  timer = setTimeout(() => emit('done'), 600)
}

// Kind Robots' own boot loader (.loader-root, app.vue) can still cover the
// page after this mounts; the splash only counts time it is actually seen.
// Its own failsafe retires within 9s, so the wait is capped there.
onMounted(() => {
  let seen = 0
  let waited = 0
  timer = setTimeout(function tick() {
    waited += 250
    if (!document.querySelector('.loader-root') || waited > 9000) seen += 250
    if (seen >= 4500 && props.ready) leave()
    else timer = setTimeout(tick, 250)
  }, 250)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style>
.eod .eod-splash-map {
  animation: eod-pan 18s ease-in-out infinite alternate;
  filter: saturate(0.85) brightness(0.55);
  transform-origin: 40% 45%;
}

.eod .eod-splash-veil {
  background:
    radial-gradient(
      ellipse at 50% 45%,
      transparent 20%,
      oklch(12% 0.02 255 / 0.85) 75%
    ),
    linear-gradient(to bottom, oklch(12% 0.02 255 / 0.5), transparent 40%);
}

.eod .eod-splash-sun {
  left: 50%;
  top: 38%;
  width: min(60vmin, 34rem);
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 9999px;
  background: radial-gradient(
    circle,
    oklch(80% 0.12 75 / 0.45),
    oklch(60% 0.14 50 / 0.15) 45%,
    transparent 70%
  );
  animation: eod-glow 5s ease-in-out infinite alternate;
}

.eod .eod-mote {
  background: oklch(86% 0.08 80 / 0.7);
  box-shadow: 0 0 6px oklch(86% 0.1 80 / 0.6);
  animation: eod-drift linear infinite;
}

.eod .eod-splash-crown {
  animation: eod-rise 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  filter: drop-shadow(0 0 14px oklch(80% 0.13 80 / 0.7));
}

.eod .eod-splash-title {
  text-shadow:
    0 0 18px oklch(78% 0.12 80 / 0.55),
    0 2px 2px oklch(0% 0 0 / 0.8);
}

.eod .eod-splash-letter {
  animation: eod-letter 0.7s ease-out both;
}

.eod .eod-splash-line {
  animation: eod-fade 1.2s ease-out 1.5s both;
}

.eod .eod-splash-hint {
  transition: opacity 0.6s;
  animation: eod-pulse 2.4s ease-in-out infinite;
}

.eod .eod-splash-leave {
  animation: eod-out 0.6s ease-in forwards;
}

@keyframes eod-pan {
  from {
    transform: scale(1.12) translate(-2%, 1%);
  }
  to {
    transform: scale(1.22) translate(3%, -2%);
  }
}

@keyframes eod-glow {
  from {
    opacity: 0.6;
    scale: 0.94;
  }
  to {
    opacity: 1;
    scale: 1.06;
  }
}

@keyframes eod-drift {
  from {
    transform: translate(0, 0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  to {
    transform: translate(-12vmin, -18vmin);
    opacity: 0;
  }
}

@keyframes eod-rise {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes eod-letter {
  from {
    opacity: 0;
    filter: blur(6px);
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    filter: none;
    transform: none;
  }
}

@keyframes eod-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.85;
  }
}

@keyframes eod-pulse {
  50% {
    color: var(--color-warning);
  }
}

@keyframes eod-out {
  to {
    opacity: 0;
    transform: scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .eod .eod-splash-map,
  .eod .eod-splash-sun,
  .eod .eod-mote,
  .eod .eod-splash-crown,
  .eod .eod-splash-letter,
  .eod .eod-splash-line,
  .eod .eod-splash-hint {
    animation: none;
  }
}
</style>
