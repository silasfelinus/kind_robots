<template>
  <div class="@container fixed inset-0 z-[90] grid place-items-center bg-base-300/95 p-3" role="dialog" aria-modal="true" aria-label="Collector incident">
    <section class="grid w-full max-w-5xl min-h-0 max-h-full overflow-hidden rounded-2xl border border-secondary/50 bg-base-200 shadow-2xl @md:grid-cols-[1.1fr_1fr]">
      <div class="relative grid min-h-52 place-items-center overflow-hidden bg-gradient-to-br from-primary/30 via-base-300 to-secondary/25 p-6 text-center">
        <div class="space-y-3">
          <p class="text-xs font-bold uppercase tracking-widest opacity-75">Couch Natural History Society · Emergency Dispatch</p>
          <span class="block text-7xl" aria-hidden="true">✳</span>
          <h2 class="text-2xl font-black">{{ incident?.title ?? 'Incident Report Filed' }}</h2>
          <p class="text-sm uppercase tracking-widest opacity-70">{{ at }} documented species</p>
        </div>
      </div>
      <div class="kr-scroll min-h-0 overflow-y-auto p-4 @md:p-6">
        <template v-if="incident">
          <p class="text-lg">{{ incident.scene }}</p>
          <p class="my-3 text-base opacity-85">{{ incident.complication }}</p>
          <p class="mb-3 text-xs uppercase tracking-widest opacity-70">Three entirely reasonable options</p>
          <div class="grid gap-2">
            <button
              v-for="option in incident.options"
              :key="option.id"
              type="button"
              class="rounded-xl border border-base-content/20 bg-base-100 p-3 text-left font-semibold transition hover:border-secondary hover:bg-secondary/15 focus-visible:outline focus-visible:outline-primary"
              :data-testid="'space-couch-collector-option-' + option.id"
              @click="$emit('choose', option.id)"
            >
              {{ option.label }}
            </button>
          </div>
        </template>
        <template v-else-if="report">
          <p class="text-xs uppercase tracking-widest opacity-70">An official incident has happened</p>
          <p class="my-4 text-lg">{{ report.text }}</p>
          <p class="mb-4 text-sm italic opacity-75">This event will be remembered by the galaxy, even if the captain would prefer otherwise.</p>
          <button type="button" class="btn btn-primary w-full" data-testid="space-couch-collector-finish" @click="$emit('close')">
            RETURN TO THE RED COUCH
          </button>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type {
  CollectorIncident,
  CollectorChoice,
  CollectorEnding,
} from '~/utils/gameOfCaptains/alienMilestones'

defineProps<{
  incident: CollectorIncident | null
  report: { at: number; ending: CollectorEnding; text: string } | null
  at: number
}>()
defineEmits<{ choose: [choice: CollectorChoice]; close: [] }>()
</script>
