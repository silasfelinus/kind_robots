<template>
  <section
    class="flex flex-col items-center gap-6 py-4"
    aria-labelledby="elevator-heading"
  >
    <div class="elevator relative w-full max-w-xl overflow-hidden rounded-2xl">
      <div class="elevator-panel flex items-center justify-between px-5 py-3">
        <span
          class="font-mono text-xs font-black uppercase tracking-[.3em] text-amber-200"
          >Going down</span
        >
        <span
          class="floor-readout font-mono text-2xl font-black text-amber-300"
        >
          <span class="floor-from">{{ fromFloor }}</span>
          <span class="floor-to">{{ toFloor }}</span>
        </span>
      </div>
      <div class="elevator-shaft relative aspect-[4/3]">
        <shifting-desks-art
          class="!absolute inset-0"
          frame="h-full w-full"
          :src="arrivalSrc"
          :prompt="arrivalPrompt"
          :alt="`${toTitle}, now arriving`"
          :show-brief="false"
        />
        <div
          class="elevator-inside flex flex-col items-center justify-end gap-2 p-5 text-center"
        >
          <p
            class="font-mono text-xs font-black uppercase tracking-[.3em] text-stone-700"
          >
            Now arriving
          </p>
          <p
            id="elevator-heading"
            class="font-mono text-3xl font-black uppercase text-stone-900 sm:text-4xl"
          >
            {{ toTitle }}
          </p>
          <p class="max-w-sm text-sm text-stone-800">{{ toTagline }}</p>
          <p
            v-if="arrivalPrompt"
            class="line-clamp-2 max-w-md text-[10px] italic text-stone-700"
          >
            <span class="font-bold not-italic uppercase tracking-wider"
              >Art brief:</span
            >
            {{ arrivalPrompt }}
          </p>
        </div>
        <div class="door door-left" aria-hidden="true" />
        <div class="door door-right" aria-hidden="true" />
      </div>
    </div>

    <article
      class="memo w-full max-w-xl rounded-2xl border-4 border-stone-800 p-5 text-stone-900"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="font-mono text-xs font-black uppercase tracking-[.25em]">
          Inter-office memo · From PAL
        </p>
        <span class="result-stamp">{{ outcomeTitle }}</span>
      </div>
      <p class="mt-2 text-sm font-semibold">
        {{ fromTitle }}: {{ outcomeSummary }}
      </p>
      <ul class="mt-3 flex flex-col gap-1.5 text-sm">
        <li v-for="(line, i) in memo" :key="i" class="flex gap-2">
          <span aria-hidden="true">▸</span>{{ line }}
        </li>
      </ul>
    </article>

    <button
      ref="stepOut"
      type="button"
      class="btn btn-lg border-stone-900 bg-stone-900 text-amber-50 hover:bg-stone-700"
      @click="emit('descend')"
    >
      <icon name="kind-icon:arrow-right" size="1.25rem" />
      Step out onto {{ toFloor }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
  fromTitle: string
  fromFloor: string
  toTitle: string
  toFloor: string
  toTagline: string
  outcomeTitle: string
  outcomeSummary: string
  memo: string[]
  arrivalSrc: string
  arrivalPrompt: string
}>()

const emit = defineEmits<{ descend: [] }>()
const stepOut = ref<HTMLElement | null>(null)

onMounted(() => {
  stepOut.value?.focus({ preventScroll: true })
})
</script>

<style scoped>
.elevator {
  border: 6px solid #292524;
  background: #44403c;
  box-shadow: 10px 10px 0 #292524;
}

.elevator-panel {
  background: #1c1917;
  border-bottom: 6px solid #292524;
}

.floor-readout {
  position: relative;
  display: inline-block;
  min-width: 7rem;
  height: 2rem;
  overflow: hidden;
  text-align: right;
}

.floor-readout > span {
  position: absolute;
  right: 0;
  animation-duration: 1.4s;
  animation-fill-mode: both;
  animation-timing-function: ease-in-out;
}

.floor-from {
  animation-name: floor-out;
}

.floor-to {
  animation-name: floor-in;
}

@keyframes floor-out {
  0%,
  30% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-120%);
    opacity: 0;
  }
}

@keyframes floor-in {
  0%,
  30% {
    transform: translateY(120%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.elevator-inside {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgb(233 216 166 / 0.95) 0%,
    rgb(233 216 166 / 0.85) 38%,
    rgb(233 216 166 / 0) 70%
  );
}

.door {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: linear-gradient(90deg, #a8a29e, #d6d3d1 45%, #a8a29e);
  border: 3px solid #292524;
  animation-duration: 1.1s;
  animation-delay: 1.5s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.6, 0, 0.3, 1);
}

.door-left {
  left: 0;
  animation-name: door-left;
}

.door-right {
  right: 0;
  animation-name: door-right;
}

@keyframes door-left {
  to {
    transform: translateX(-100%);
  }
}

@keyframes door-right {
  to {
    transform: translateX(100%);
  }
}

.memo {
  background-color: #fef3c7;
  background-image: repeating-linear-gradient(
    transparent 0 1.55rem,
    rgb(41 37 36 / 0.08) 1.55rem 1.6rem
  );
}

.result-stamp {
  transform: rotate(-5deg);
  border: 3px double #7f1d1d;
  border-radius: 0.4rem;
  padding: 0.1rem 0.6rem;
  color: #7f1d1d;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

@media (prefers-reduced-motion: reduce) {
  .door {
    animation: none;
    display: none;
  }

  .floor-readout > span {
    animation: none;
  }

  .floor-from {
    display: none;
  }
}
</style>
