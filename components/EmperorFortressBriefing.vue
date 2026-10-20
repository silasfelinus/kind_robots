<template>
  <div
    class="flex min-h-full flex-col gap-3 @4xl:grid @4xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] @7xl:grid-cols-[minmax(0,1fr)_minmax(26rem,36rem)]"
  >
    <figure
      v-if="advisorArt"
      class="eod-figure-box pointer-events-none relative min-h-0 flex-1 basis-0"
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
      class="kr-panel flex shrink-0 flex-col gap-3 p-4"
      aria-live="polite"
    >
      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.25em] text-warning"
        >
          {{ advisorName }} · Day {{ run.day }}
        </p>
        <h2 class="font-serif text-xl font-bold text-warning">
          {{ today?.title ?? 'The morning dispatches' }}
        </h2>
      </div>
      <template v-if="today">
        <p class="font-serif text-base italic leading-relaxed">
          “{{ today.komodo }}”
        </p>
        <ul class="grid gap-2">
          <li
            v-for="report in today.briefings"
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
              class="text-[10px] font-semibold uppercase tracking-wider opacity-60"
            >
              {{ report.source }}
            </p>
            <p class="text-sm leading-snug">{{ report.text }}</p>
          </li>
        </ul>
        <p
          v-if="today.whisper"
          class="border-l-2 border-warning/50 pl-3 text-xs italic opacity-80"
        >
          {{ today.whisper.source }}: “{{ today.whisper.text }}”
        </p>
      </template>
      <p
        v-if="mapLine"
        class="border-l-2 border-error/70 pl-3 text-xs font-semibold text-error"
      >
        {{ mapLine.source }}: {{ mapLine.text }}
      </p>
      <p v-if="!today" class="text-sm opacity-75">
        No dispatches came up the road for Day {{ run.day }}. The wasteland’s
        daily chores still reach the quest room.
      </p>
      <button
        type="button"
        class="eod-finish mt-auto self-end px-5 py-1.5 text-sm"
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
