<template>
  <div
    class="alien-guide @container flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-primary/30 bg-base-200 p-3"
    data-testid="space-couch-alien-scrapbook"
  >
    <header class="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div>
        <p class="text-xs uppercase tracking-widest opacity-70">
          Couch Natural History Society
        </p>
        <h2 class="text-xl font-black">101 UNLIKELY LIFE FORMS</h2>
        <p class="text-sm">
          {{ guide.discovered.length }} / {{ ALIEN_SPECIES.length }} recorded ·
          {{ guide.friends.length }} declared friends
        </p>
        <p v-if="syncStatus === 'synced'" class="text-xs opacity-70">
          Saved to your account
        </p>
        <p
          v-else-if="syncStatus === 'error'"
          class="text-xs text-warning"
          role="status"
        >
          Saved on this device; account sync unavailable.
        </p>
      </div>
      <button
        v-if="syncStatus === 'error'"
        type="button"
        class="btn btn-ghost btn-sm"
        @click="$emit('sync')"
      >
        Retry sync
      </button>
      <button
        v-if="pendingIncident"
        type="button"
        class="btn btn-secondary btn-sm"
        data-testid="space-couch-collector-from-scrapbook"
        @click="$emit('incident')"
      >
        ✳ STRANGE COUCH MAIL
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="$emit('close')"
      >
        ← MAIN MENU
      </button>
    </header>
    <div
      class="kr-scroll grid min-h-0 flex-1 gap-3 overflow-y-auto @md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
    >
      <section
        class="order-last flex min-h-0 flex-col gap-2 @md:order-first"
        aria-label="Alien catalogue"
      >
        <div class="grid grid-cols-2 gap-2 pr-1 @sm:grid-cols-3">
          <button
            v-for="(alien, index) in ALIEN_SPECIES"
            :key="alien.id"
            type="button"
            class="flex min-h-28 flex-col justify-between rounded-xl border p-2 text-left transition"
            :class="[
              selectedId === alien.id
                ? 'border-primary bg-primary/15'
                : 'border-base-content/15 bg-base-100/60',
              !known(alien.id) ? 'opacity-75' : '',
            ]"
            :aria-pressed="selectedId === alien.id"
            :data-testid="'space-couch-species-' + (index + 1)"
            @click="selectedId = alien.id"
          >
            <div class="flex items-center justify-between text-xs opacity-70">
              <span>#{{ String(index + 1).padStart(3, '0') }}</span>
              <span>{{ known(alien.id) ? '✦ FOUND' : '◇ ???' }}</span>
            </div>
            <span class="my-2 self-center text-4xl" aria-hidden="true">{{
              known(alien.id) ? '✳' : '◌'
            }}</span>
            <strong class="line-clamp-2 text-sm">{{
              known(alien.id) ? alien.name : 'UNIDENTIFIED'
            }}</strong>
          </button>
        </div>
      </section>
      <section
        class="order-first self-start rounded-xl border border-base-content/15 bg-base-100/50 p-3 @md:sticky @md:top-0 @md:order-last"
        aria-live="polite"
      >
        <div
          class="relative mb-3 grid min-h-48 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-base-300 to-secondary/20"
        >
          <img
            v-if="
              known(selected.id) &&
              selectedArt &&
              !brokenImages.includes(selectedArt)
            "
            :src="selectedArt"
            class="max-h-72 w-full object-contain"
            :alt="'Full illustrated species plate: ' + selected.name"
            @error="brokenImages.push(selectedArt)"
          />
          <div v-else class="grid min-h-48 place-items-center text-center">
            <span class="text-7xl" aria-hidden="true">{{
              known(selected.id) ? '✳' : '◌'
            }}</span>
            <small class="uppercase tracking-widest">{{
              known(selected.id)
                ? 'Illustration in the art queue'
                : 'Species unrecorded'
            }}</small>
          </div>
        </div>
        <p class="text-xs uppercase tracking-widest opacity-70">
          {{ selected.category }} · {{ selected.rarity }}
        </p>
        <h3 class="my-2 text-2xl font-black">
          {{ known(selected.id) ? selected.name : '???' }}
        </h3>
        <template v-if="known(selected.id)">
          <p class="my-2 text-lg">{{ selected.fieldNote }}.</p>
          <p class="text-sm opacity-80">
            Appearance: {{ selected.appearance }}.
          </p>
          <p class="text-sm opacity-80">Habitat: {{ selected.habitat }}.</p>
          <p class="text-sm opacity-80">
            Social pattern: {{ selected.social }}.
          </p>
          <p
            v-if="selectedFieldReport"
            class="mt-3 border-l-2 border-secondary/50 pl-3 text-sm italic"
            data-testid="space-couch-alien-scrapbook-field-note"
          >
            Captain's marginalia: {{ selectedFieldReport }}
          </p>
          <p
            v-if="guide.friends.includes(selected.id)"
            class="mt-3 font-bold text-secondary"
          >
            ✦ OFFICIALLY YOUR BEST FRIEND
          </p>
        </template>
        <template v-else>
          <p class="my-3 text-base">{{ alienHint(selected) }}</p>
          <p class="text-sm opacity-70">
            Each solar-system visit offers three choices. Two may record an
            alien; a runaway can return on a later trip.
          </p>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ALIEN_SPECIES } from '~/utils/gameOfCaptains/alienSpecies'
import {
  alienHint,
  alienObservation,
  type AlienGuide,
} from '~/utils/gameOfCaptains/alienFieldGuide'

const props = defineProps<{
  guide: AlienGuide
  syncStatus?: 'local' | 'syncing' | 'synced' | 'error'
  pendingIncident?: boolean
  artwork?: Record<string, string>
}>()
defineEmits<{ close: []; incident: []; sync: [] }>()
const selectedId = ref(ALIEN_SPECIES[0]!.id)
const selected = computed(
  () =>
    ALIEN_SPECIES.find((species) => species.id === selectedId.value) ??
    ALIEN_SPECIES[0]!,
)
const known = (id: string): boolean => props.guide.discovered.includes(id)
const selectedFieldReport = computed(() => {
  const report = props.guide.fieldReports?.findLast(
    (entry) => entry.speciesId === selected.value.id,
  )
  return report ? alienObservation(report) : null
})
const selectedArt = computed(
  () => props.artwork?.[selected.value.artKey] ?? null,
)
const brokenImages = ref<string[]>([])
</script>
