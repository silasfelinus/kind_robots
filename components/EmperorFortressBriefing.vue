<template>
  <div
    class="eod-briefing flex min-h-full flex-col gap-3 @4xl:grid @4xl:grid-cols-[minmax(26rem,0.92fr)_minmax(0,1.08fr)] @7xl:grid-cols-[minmax(32rem,0.85fr)_minmax(0,1.15fr)]"
  >
    <figure
      v-if="advisorArt"
      class="eod-figure-box pointer-events-none relative min-h-56 flex-1 basis-0 @4xl:order-2 @4xl:min-h-0"
    >
      <img
        :key="advisorArt"
        :src="advisorArt"
        :alt="`${advisorName}, with the morning dispatches`"
        class="eod-figure absolute inset-x-0 bottom-0 mx-auto block h-full w-auto max-w-full object-contain object-bottom"
      />
    </figure>
    <div v-else class="hidden @4xl:block" />

    <section
      class="kr-panel kr-scroll flex shrink-0 flex-col gap-3 overflow-y-auto p-4 @4xl:order-1 @4xl:min-h-0 @4xl:p-5 @7xl:p-6"
      aria-live="polite"
    >
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-warning">
          Morning Briefing · Day {{ run.day }}
        </p>
        <h2 class="font-serif text-2xl font-bold text-warning @7xl:text-3xl">
          {{ today?.title ?? 'The morning dispatches' }}
        </h2>
      </div>
      <template v-if="today">
        <p v-if="lines.komodo" class="eod-reading italic">
          <strong class="not-italic text-warning">{{ advisorName }}:</strong> “{{ lines.komodo }}”
        </p>
        <ul class="grid gap-2">
          <li
            v-for="report in reports"
            :key="report.id"
            class="rounded-md border p-3"
            :class="
              eyeReveals(run, report.truth) || forecastMark(run, report)
                ? 'border-warning bg-warning/10'
                : 'border-warning/20 bg-base-200/70'
            "
          >
            <span
              v-if="eyeReveals(run, report.truth)"
              class="block text-xs font-bold text-warning"
              >The Eye marks this report false</span
            >
            <span
              v-if="forecastMark(run, report)"
              class="block text-xs font-bold text-warning"
              >{{
                forecastMark(run, report) === 'false'
                  ? 'Nera reads the wind: this report is false'
                  : 'Nera frowns: this report has no weather in it at all'
              }}</span
            >
            <p
              class="text-xs font-semibold uppercase tracking-wider opacity-75"
            >
              {{ report.source }}
            </p>
            <p class="eod-reading">{{ report.text }}</p>
          </li>
        </ul>
        <p
          v-if="lines.whisper"
          class="eod-reading border-l-2 border-warning/50 pl-3 italic opacity-85"
        >
          {{ lines.whisper.source }}: “{{ lines.whisper.text }}”
        </p>
        <details
          v-if="hindsight.length"
          class="rounded-md border border-error/40 bg-error/5 p-3"
        >
          <summary
            class="cursor-pointer text-xs font-bold uppercase tracking-wider text-error"
          >
            His own reports, read again · {{ hindsight.length }}
          </summary>
          <p class="mt-2 text-xs italic opacity-75">
            The Archive went back through every morning dispatch. These came
            from Young Komodo’s runner.
          </p>
          <ul class="kr-scroll mt-2 grid max-h-72 gap-2 pr-1">
            <li
              v-for="entry in hindsight"
              :key="entry.briefing.id"
              class="border-l-2 border-error/50 pl-3"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wider opacity-75"
              >
                Day {{ entry.day }} · {{ entry.title }}
              </p>
              <p class="text-sm leading-snug line-through opacity-60">
                {{ entry.briefing.text }}
              </p>
              <p class="text-sm leading-snug">{{ entry.hindsight }}</p>
            </li>
          </ul>
        </details>
      </template>
      <p
        v-if="mapLine"
        class="eod-reading border-l-2 border-error/70 pl-3 font-semibold text-error"
      >
        {{ mapLine.source }}: {{ mapLine.text }}
      </p>
      <p
        v-if="candles"
        class="eod-reading border-l-2 border-error/70 pl-3 font-semibold text-error"
      >
        {{ candles.source }}: {{ candles.text }}
      </p>
      <p
        v-if="courting"
        class="eod-reading border-l-2 border-warning/70 pl-3 font-semibold text-warning"
      >
        {{ courting.source }}: {{ courting.text }}
      </p>
      <p v-if="!today" class="eod-reading opacity-85">
        No dispatches came up the road for Day {{ run.day }}. The wasteland’s
        daily chores still reach the quest room.
      </p>
      <button
        type="button"
        class="eod-finish mt-auto self-end px-5 py-2 text-base"
        @click="emit('next')"
      >
        Open the throne room
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { illustration } from '~/utils/emperorOfDust/fortress/castArt'
import {
  dayBriefings,
  dayLines,
  komodoLiesInHindsight,
} from '~/utils/emperorOfDust/fortress/briefings'
import { candlesLine } from '~/utils/emperorOfDust/fortress/endings'
import { komodoCourtingLine } from '~/utils/emperorOfDust/fortress/betrayal'
import { dayDef } from '~/utils/emperorOfDust/fortress/content'
import {
  briefingMapLine,
  forecastMark,
} from '~/utils/emperorOfDust/fortress/engine'
import { eyeReveals } from '~/utils/emperorOfDust/fortress/relics'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

// The day opens here: the advisor's three dispatches, before court sits.
const props = defineProps<{ run: FortressRun }>()
const emit = defineEmits<{ next: [] }>()

const today = computed(() => dayDef(props.run.day))
const mapLine = computed(() => briefingMapLine(props.run))
/** The advisor's line and the whisper, as this run hears them. */
const lines = computed(() => dayLines(props.run, today.value))
/** From Day 45: the Hundred Candles rule and today's count. */
const candles = computed(() => candlesLine(props.run))
/** Days 37-40: who Young Komodo sits up with (t-041). */
const courting = computed(() => komodoCourtingLine(props.run))
/** Today's reports as this run reads them (flag-keyed variants applied). */
const reports = computed(() => dayBriefings(props.run, today.value) ?? [])
/** After the betrayal: every report that was Komodo's own lie. */
const hindsight = computed(() => komodoLiesInHindsight(props.run))
const advisorName = computed(() => today.value?.advisor?.name ?? 'Young Komodo')
/** The advisor's portrait; Komodo is sad on his last morning at court. */
const advisorArt = computed(() =>
  illustration(
    'npcs',
    today.value?.advisor?.npc ?? 'young-komodo',
    !today.value?.advisor && today.value?.day === 40 ? 'sad' : 'neutral',
  ),
)
</script>
