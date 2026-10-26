<template>
  <div
    class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-4 @5xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
  >
    <section class="flex min-h-0 min-w-0 flex-col gap-3">
      <div class="shrink-0">
        <p class="pf-kicker text-secondary">Assumptions</p>
        <p class="pf-display mt-1 text-2xl @3xl:text-3xl">
          What every forecast stands on
        </p>
        <p class="mt-1 text-sm opacity-70">
          Render times are measured; word rates are estimates until a shipped
          playbook calibrates them. Saved in this browser.
        </p>
      </div>
      <ul class="kr-scroll -mx-1 flex min-h-0 flex-col gap-1.5 px-1 py-1">
        <li v-for="(row, i) in rows" :key="row.label">
          <button
            type="button"
            data-nav
            data-adjust
            :data-autofocus="i === 0 ? '' : undefined"
            class="pf-row pf-focusable"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
            @click="row.step(1)"
            @pf-adjust="row.step(($event as CustomEvent<1 | -1>).detail)"
          >
            <span class="pf-label min-w-0 flex-1 truncate text-left text-sm">{{
              row.label
            }}</span>
            <span class="pf-value">
              <span
                class="pf-chev"
                aria-hidden="true"
                @click.stop="row.step(-1)"
                >◀</span
              >
              <span
                class="pf-display min-w-[3.25rem] text-center text-lg @3xl:min-w-[5.5rem]"
                >{{ row.value }}</span
              >
              <span class="pf-chev" aria-hidden="true" @click.stop="row.step(1)"
                >▶</span
              >
            </span>
          </button>
        </li>
      </ul>
      <button
        type="button"
        data-nav
        class="pf-label btn btn-ghost btn-sm shrink-0 self-start pf-focusable"
        @click="forge.resetAssumptions()"
      >
        Restore measured defaults
      </button>
    </section>

    <aside class="pf-panel hidden flex-col gap-3 p-5 @5xl:flex">
      <p class="pf-kicker text-secondary">Render lanes</p>
      <ul class="flex flex-col gap-3">
        <li
          v-for="lane in CHECKPOINT_CLASSES"
          :key="lane.id"
          class="flex flex-col gap-0.5"
        >
          <span class="flex items-baseline justify-between gap-2">
            <span class="pf-label text-sm">{{ lane.label }}</span>
            <span class="pf-display text-xl tabular-nums">{{
              formatDuration(lane.secondsPerImage)
            }}</span>
          </span>
          <span class="text-xs opacity-60"
            >{{ lane.examples }} · {{ lane.evidence }}</span
          >
        </li>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import {
  CHECKPOINT_CLASSES,
  type WordRates,
} from '~/utils/playbookForge/calibration'
import { formatDuration } from '~/utils/playbookForge/estimate'

const forge = usePlaybookForgeStore()

const WORD_LABELS: Record<keyof WordRates, string> = {
  encounterBody: 'Words per encounter',
  outcomeText: 'Words per outcome tier',
  endingText: 'Words per ending',
  revealText: 'Words per reveal',
  castBio: 'Words per character',
  questStep: 'Words per quest step',
  momentCaption: 'Words per caption',
  creatorOption: 'Words per creator option',
  trailerBeat: 'Words per trailer beat',
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

const rows = computed(() => {
  const a = forge.assumptions
  return [
    {
      label: 'Words per agent session',
      value: a.wordsPerSession.toLocaleString(),
      step: (d: number) =>
        forge.setAssumption(
          'wordsPerSession',
          clamp(a.wordsPerSession + d * 500, 1000, 20000),
        ),
    },
    {
      label: 'Reroll overhead',
      value: `${Math.round(a.rerollRate * 100)}%`,
      step: (d: number) =>
        forge.setAssumption(
          'rerollRate',
          clamp(Math.round((a.rerollRate + d * 0.1) * 10) / 10, 0, 2),
        ),
    },
    {
      label: 'Queue wait per image',
      value: formatDuration(a.queueSecondsPerImage),
      step: (d: number) =>
        forge.setAssumption(
          'queueSecondsPerImage',
          clamp(a.queueSecondsPerImage + d * 10, 0, 600),
        ),
    },
    {
      label: 'Render lanes (cold starts)',
      value: String(a.lanes),
      step: (d: number) =>
        forge.setAssumption('lanes', clamp(a.lanes + d, 1, 6)),
    },
    ...(Object.keys(WORD_LABELS) as (keyof WordRates)[]).map((key) => ({
      label: WORD_LABELS[key],
      value: String(a.words[key]),
      step: (d: number) =>
        forge.setAssumption('words', {
          ...a.words,
          [key]: clamp(
            a.words[key] + d * (a.words[key] >= 100 ? 10 : 5),
            5,
            2000,
          ),
        }),
    })),
  ]
})
</script>
