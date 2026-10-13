<template>
  <section
    class="flex min-h-0 flex-col gap-2 lg:flex-row lg:gap-4"
    aria-labelledby="elevator-heading"
  >
    <div
      class="elevator relative flex min-h-[40%] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl"
    >
      <div
        class="elevator-panel flex shrink-0 items-center justify-between px-4 py-2"
      >
        <span
          class="font-mono text-xs font-black uppercase tracking-[.3em] text-amber-200"
          >Going down</span
        >
        <span
          class="floor-readout font-mono text-lg font-black text-amber-300 sm:text-2xl"
        >
          <span class="floor-from">{{ fromFloor }}</span>
          <span class="floor-to">{{ toFloor }}</span>
        </span>
      </div>
      <div class="elevator-shaft relative min-h-0 flex-1">
        <shifting-desks-art
          class="!absolute inset-0"
          frame="h-full w-full"
          :src="arrivalSrc"
          :prompt="arrivalPrompt"
          :alt="`${toTitle}, now arriving`"
          :show-brief="false"
        />
        <div
          class="elevator-inside flex h-full flex-col items-center justify-end gap-1 p-3 text-center sm:gap-2 sm:p-5"
        >
          <p
            class="font-mono text-xs font-black uppercase tracking-[.3em] text-stone-700"
          >
            Now arriving
          </p>
          <p
            id="elevator-heading"
            class="font-mono text-2xl font-black uppercase text-stone-900 sm:text-4xl"
          >
            {{ toTitle }}
          </p>
          <p class="line-clamp-3 max-w-sm text-sm text-stone-800">
            {{ toTagline }}
          </p>
          <p
            v-if="arrivalPrompt"
            class="hidden max-w-md text-[10px] italic text-stone-700 sm:line-clamp-2"
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

    <div
      class="flex min-h-0 shrink flex-col gap-2 lg:w-[44%] lg:justify-center"
    >
      <article
        class="memo min-h-0 overflow-y-auto rounded-2xl border-4 border-stone-800 p-3 text-stone-900 sm:p-5"
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
        <ul class="mt-2 flex flex-col gap-1 text-sm">
          <li v-for="(line, i) in memo" :key="i" class="flex gap-2">
            <span aria-hidden="true">▸</span>{{ line }}
          </li>
        </ul>
        <div
          v-if="restructuring"
          class="mt-3 rounded-xl border-2 border-dashed border-stone-800 bg-stone-50/60 p-2 sm:p-3"
        >
          <p class="font-mono text-[11px] font-black uppercase tracking-widest">
            Restructuring notice · {{ restructuring.headline }}
          </p>
          <p class="mt-1 text-sm">{{ restructuring.reason }}</p>
          <p
            class="mt-3 font-mono text-[10px] font-black uppercase tracking-widest opacity-70"
          >
            {{ toTitle }} floor plan
          </p>
          <ul class="mt-1 flex flex-wrap gap-2" aria-label="Floor plan">
            <li
              v-for="slot in board"
              :key="`${slot.change}-${slot.title}`"
              class="rounded-md border-2 border-stone-800 px-2 py-1 text-xs font-bold"
              :class="BOARD_STYLE[slot.change]"
            >
              <span :class="slot.change === 'closed' ? 'line-through' : ''">{{
                slot.title
              }}</span>
              <span class="ml-1 font-mono text-[10px] uppercase">{{
                BOARD_LABEL[slot.change]
              }}</span>
            </li>
          </ul>
        </div>
      </article>

      <button
        ref="stepOut"
        type="button"
        class="btn shrink-0 border-stone-900 bg-stone-900 text-amber-50 hover:bg-stone-700 sm:btn-lg"
        @click="emit('descend')"
      >
        <icon name="kind-icon:arrow-right" size="1.25rem" />
        Step out onto {{ toFloor }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { BoardSlot } from '~/utils/shiftingDesks/rules'

withDefaults(
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
    restructuring?: { headline: string; reason: string } | null
    board?: BoardSlot[]
  }>(),
  { restructuring: null, board: () => [] },
)

const BOARD_LABEL: Record<BoardSlot['change'], string> = {
  open: 'Open',
  closed: 'Closed',
  merged: 'Merged',
  added: 'Added',
}
const BOARD_STYLE: Record<BoardSlot['change'], string> = {
  open: 'bg-stone-50',
  closed: 'bg-stone-300 opacity-70',
  merged: 'bg-amber-200',
  added: 'bg-lime-200',
}

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
  min-width: 9rem;
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
