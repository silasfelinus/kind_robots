<template>
  <section
    class="results-sheet relative overflow-hidden rounded-2xl border-2 border-stone-800 p-4 text-stone-900"
    :aria-label="final ? 'Your Test Results' : 'Interim Test Results'"
  >
    <p
      class="font-mono text-[11px] font-black uppercase tracking-[.25em] text-stone-700"
    >
      {{
        final
          ? 'Test Results · final reading'
          : 'PAL has prepared your interim results'
      }}
    </p>
    <template v-if="verdict">
      <p class="mt-1 font-mono text-2xl font-black uppercase">
        {{ verdict.title }}
      </p>
      <p class="mt-1 text-sm font-semibold">{{ verdict.text }}</p>
    </template>
    <p v-else class="mt-1 text-sm">
      Your choices have been quietly graded since the front desk. PAL may share
      {{ readings.length === 1 ? 'one result' : `${readings.length} results` }}
      at this review.
    </p>

    <ul class="mt-3 flex flex-col gap-2.5">
      <li v-for="r in readings" :key="r.grade" class="flex flex-col gap-1">
        <span class="flex items-baseline justify-between gap-2">
          <span class="font-mono text-sm font-black uppercase">{{
            r.title
          }}</span>
          <span class="font-mono text-xs font-bold uppercase">
            {{ r.level }} · {{ r.score }}
          </span>
        </span>
        <span class="results-track" aria-hidden="true">
          <span
            class="results-fill"
            :class="r.score < 0 ? 'is-low' : ''"
            :style="{ width: `${fill(r.score)}%` }"
          />
        </span>
        <span class="text-xs italic">{{ r.line }}</span>
      </li>
      <li
        v-for="n in sealed"
        :key="`sealed-${n}`"
        class="flex flex-col gap-1"
        aria-label="Sealed result"
      >
        <span class="results-redaction" aria-hidden="true" />
        <span class="font-mono text-[10px] font-bold uppercase opacity-70"
          >Sealed until a deeper review</span
        >
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { GradeReading } from '~/utils/shiftingDesks/rules'

withDefaults(
  defineProps<{
    readings: GradeReading[]
    sealed?: number
    final?: boolean
    verdict?: { title: string; text: string } | null
  }>(),
  { sealed: 0, final: false, verdict: null },
)

const MAX_SHOWN = 8

function fill(score: number): number {
  if (score <= 0) return score < 0 ? 6 : 0
  return Math.min(100, Math.round((score / MAX_SHOWN) * 100))
}
</script>

<style scoped>
.results-sheet {
  background-color: #efe3bf;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 23px,
    rgb(41 37 36 / 0.08) 23px,
    rgb(41 37 36 / 0.08) 24px
  );
}
.results-track {
  display: block;
  height: 0.6rem;
  border: 2px solid rgb(41 37 36);
  border-radius: 999px;
  background: rgb(250 250 249 / 0.6);
  overflow: hidden;
}
.results-fill {
  display: block;
  height: 100%;
  background: rgb(41 37 36);
  transition: width 700ms ease-out;
}
.results-fill.is-low {
  background: rgb(185 28 28);
}
.results-redaction {
  display: block;
  height: 1.1rem;
  border-radius: 0.25rem;
  background: rgb(28 25 23);
}
@media (prefers-reduced-motion: reduce) {
  .results-fill {
    transition: none;
  }
}
</style>
