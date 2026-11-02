<template>
  <div
    class="@container fixed inset-0 z-[90] grid place-items-center bg-base-300/95 p-3"
    role="dialog"
    aria-modal="true"
    aria-label="Collector incident"
  >
    <section
      class="grid w-full max-w-5xl min-h-0 max-h-full overflow-hidden rounded-2xl border border-secondary/50 bg-base-200 shadow-2xl @md:grid-cols-[1.1fr_1fr]"
    >
      <div
        class="relative grid min-h-52 place-items-center overflow-hidden bg-gradient-to-br from-primary/30 via-base-300 to-secondary/25 p-6 text-center"
      >
        <div class="space-y-3">
          <img
            v-if="painting && !imageBroken"
            :src="painting"
            :alt="
              'Illustrated collector event: ' +
              (incident?.title ?? 'Filed incident')
            "
            class="max-h-56 w-full object-contain"
            @error="imageBroken = true"
          />
          <p class="text-xs font-bold uppercase tracking-widest opacity-75">
            Couch Natural History Society · Emergency Dispatch
          </p>
          <span
            v-if="!painting || imageBroken"
            class="block text-7xl"
            aria-hidden="true"
            >✳</span
          >
          <h2 class="text-2xl font-black">
            {{ incident?.title ?? 'Incident Report Filed' }}
          </h2>
          <p class="text-sm uppercase tracking-widest opacity-70">
            {{ at }} documented species
          </p>
        </div>
      </div>
      <div class="kr-scroll min-h-0 overflow-y-auto p-4 @md:p-6">
        <template v-if="incident">
          <p class="text-lg">{{ incident.scene }}</p>
          <p class="my-3 text-base opacity-85">{{ incident.complication }}</p>
          <SpaceCouchChoiceHand
            :choices="choices"
            question="Three entirely reasonable options"
            :deal-key="String(incident.at)"
            testid-prefix="space-couch-collector-option"
            spread
            @play="(choice) => emit('choose', choice.id as CollectorChoice)"
          />
        </template>
        <template v-else-if="report">
          <p class="text-xs uppercase tracking-widest opacity-70">
            An official incident has happened
          </p>
          <p class="my-4 text-lg">{{ report.text }}</p>
          <p class="mb-4 text-sm italic opacity-75">
            This event will be remembered by the galaxy, even if the captain
            would prefer otherwise.
          </p>
          <button
            type="button"
            class="btn btn-primary w-full"
            data-testid="space-couch-collector-finish"
            @click="$emit('close')"
          >
            RETURN TO THE RED COUCH
          </button>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { COLLECTOR_INCIDENTS } from '~/utils/gameOfCaptains/alienMilestones'
import type {
  CollectorIncident,
  CollectorChoice,
  CollectorEnding,
} from '~/utils/gameOfCaptains/alienMilestones'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

const props = defineProps<{
  incident: CollectorIncident | null
  report: { at: number; ending: CollectorEnding; text: string } | null
  at: number
  artwork?: Record<string, string>
}>()
const imageBroken = ref(false)
const painting = computed(
  () =>
    props.artwork?.[
      COLLECTOR_INCIDENTS.find((story) => story.at === props.at)
        ?.illustrationKey ?? ''
    ] ?? null,
)
watch(
  () => props.at,
  () => {
    imageBroken.value = false
  },
)
const choices = computed<KrHandChoice[]>(() =>
  (props.incident?.options ?? []).map((option) => ({
    id: option.id,
    label: option.label,
    image: imageBroken.value ? null : painting.value,
    icon: '✳',
  })),
)
const emit = defineEmits<{ choose: [choice: CollectorChoice]; close: [] }>()
</script>
