<template>
  <div class="@container fixed inset-0 z-[80] grid place-items-center bg-base-300/90 p-3" role="dialog" aria-modal="true" aria-label="Alien field encounter">
    <section class="alien-encounter-shell grid w-full max-w-5xl min-h-0 max-h-full overflow-hidden rounded-2xl border border-primary/50 bg-base-200 shadow-2xl @md:grid-cols-[1.15fr_1fr]">
      <div class="alien-portrait relative flex min-h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/30 via-base-300 to-primary/30">
        <img v-if="image && !imageBroken" :src="image" :alt="'Field guide illustration of ' + species.name" class="h-full w-full object-contain" @error="imageBroken = true" />
        <div v-else class="grid min-h-48 place-items-center px-6 py-10 text-center">
          <span class="text-7xl" aria-hidden="true">✳</span>
          <span class="block text-sm uppercase tracking-widest opacity-70">An impossible silhouette</span>
          <span class="block text-xl font-bold">{{ species.name }}</span>
        </div>
        <span class="absolute left-3 top-3 rounded-full border border-base-content/30 bg-base-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wide">
          {{ sighting?.milestone ? 'Extraordinary visitation' : 'Unexpected lifeform' }}
        </span>
      </div>
      <div class="kr-scroll min-h-0 overflow-y-auto p-4 md:p-6">
        <template v-if="sighting">
          <p class="text-xs uppercase tracking-widest opacity-70">Couch Natural History Society, chapter {{ sighting.chapter }}</p>
          <h2 class="mt-2 text-2xl font-black">{{ sighting.milestone?.title ?? species.name }}</h2>
          <p v-if="sighting.milestone" class="my-3 rounded-xl bg-secondary/15 p-3">{{ sighting.milestone.scene }}</p>
          <p class="my-3 text-lg">{{ species.appearance }}. It is {{ species.fieldNote.charAt(0).toLowerCase() + species.fieldNote.slice(1) }}.</p>
          <p class="mb-3 text-sm opacity-70">One lifeform. Three terrible decisions. No paperwork.</p>
          <div class="grid gap-2">
            <button
              v-for="choice in ALIEN_CHOICES"
              :key="choice.id"
              type="button"
              class="rounded-xl border border-base-content/20 bg-base-100 p-3 text-left transition hover:border-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-primary"
              :data-testid="'space-couch-alien-' + choice.id"
              @click="$emit('choose', choice.id)"
            >
              <strong class="block text-base">{{ choice.label }}</strong>
              <span class="text-sm opacity-70">{{ choice.hint }}</span>
            </button>
          </div>
        </template>
        <template v-else-if="report">
          <p class="text-xs uppercase tracking-widest opacity-70">Post-contact report</p>
          <h2 class="mt-2 text-2xl font-black">{{ report.recorded ? 'SCRAPBOOK ENTRY UNLOCKED' : 'SPECTACULARLY UNDOCUMENTED' }}</h2>
          <p class="my-4 text-lg">{{ report.text }}</p>
          <p v-if="report.recorded" class="mb-4 border-l-4 border-secondary pl-3 italic">{{ species.fieldNote }}</p>
          <button type="button" class="btn btn-primary w-full" data-testid="space-couch-alien-dismiss" @click="$emit('close')">
            BACK TO THE COUCH
          </button>
        </template>
        <button v-if="sighting" type="button" class="btn btn-ghost mt-4 w-full" @click="$emit('close')">
          NOT NOW
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ALIEN_BY_ID } from '~/utils/gameOfCaptains/alienSpecies'
import {
  ALIEN_CHOICES,
  type AlienChoice,
  type AlienSighting,
} from '~/utils/gameOfCaptains/alienFieldGuide'

const props = defineProps<{
  sighting: AlienSighting | null
  report: { text: string; speciesId: string; recorded: boolean } | null
  artwork?: Record<string, string>
}>()
defineEmits<{ choose: [choice: AlienChoice]; close: [] }>()
const species = computed(() =>
  props.sighting?.species ??
  ALIEN_BY_ID.get(props.report?.speciesId ?? '')!,
)
const imageBroken = ref(false)
watch(() => species.value?.id, () => { imageBroken.value = false })
const image = computed(() => props.artwork?.[species.value?.artKey ?? ''] ?? null)
</script>
