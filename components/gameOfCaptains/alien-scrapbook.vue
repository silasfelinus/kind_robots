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
        <p
          class="mt-1 text-xs opacity-75"
          data-testid="space-couch-alien-sync-status"
        >
          {{
            syncStatus === 'guest'
              ? 'Guest notebook · sign in for account sync'
              : syncStatus === 'synced'
                ? 'Saved to your account'
                : syncStatus === 'loading'
                  ? 'Loading account scrapbook…'
                  : 'Account save pending'
          }}
        </p>
        <p v-if="syncWarning" class="mt-1 max-w-sm text-xs text-warning">
          {{ syncWarning }}
        </p>
        <button
          v-if="syncStatus === 'pending'"
          type="button"
          class="btn btn-outline btn-xs mt-2"
          data-testid="space-couch-alien-retry-sync"
          @click="$emit('retrySync')"
        >
          RETRY ACCOUNT SAVE
        </button>
      </div>
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
    <div class="flex shrink-0 flex-col gap-2">
      <div
        class="flex flex-wrap gap-1"
        role="group"
        aria-label="Filter alien catalogue"
      >
        <button
          v-for="filter in ALIEN_SHELF_FILTERS"
          :key="filter.id"
          type="button"
          class="btn btn-xs"
          :class="shelfFilter === filter.id ? 'btn-primary' : 'btn-ghost'"
          :aria-pressed="shelfFilter === filter.id"
          :data-testid="'space-couch-alien-shelf-filter-' + filter.id"
          @click="shelfFilter = filter.id"
        >
          {{ filter.label }} · {{ shelfCounts[filter.id] }}
        </button>
      </div>
      <label class="text-xs font-bold" for="space-couch-alien-shelf-search">
        SEARCH THE FIELD GUIDE
      </label>
      <input
        id="space-couch-alien-shelf-search"
        v-model="shelfSearch"
        type="search"
        class="input input-bordered input-sm w-full"
        data-testid="space-couch-alien-shelf-search"
        placeholder="Known name or catalogue number"
        autocomplete="off"
      />
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs opacity-75" role="status" aria-live="polite">
          {{ visibleSpecies.length }} catalogue pages shown
        </p>
        <button
          v-if="shelfFilter !== 'all' || shelfSearch"
          type="button"
          class="btn btn-ghost btn-xs"
          data-testid="space-couch-alien-shelf-reset"
          @click="resetShelf"
        >
          SHOW ALL
        </button>
      </div>
    </div>
    <div
      class="kr-scroll grid min-h-0 flex-1 gap-3 overflow-y-auto @md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
    >
      <section
        class="order-last flex min-h-0 flex-col gap-2 @md:order-first"
        aria-label="Alien catalogue"
      >
        <div
          v-if="visibleSpecies.length"
          class="grid grid-cols-2 gap-2 pr-1 @sm:grid-cols-3"
        >
          <button
            v-for="entry in visibleSpecies"
            :key="entry.species.id"
            type="button"
            class="flex min-h-28 flex-col justify-between rounded-xl border p-2 text-left transition"
            :class="[
              selected?.id === entry.species.id
                ? 'border-primary bg-primary/15'
                : 'border-base-content/15 bg-base-100/60',
              !known(entry.species.id) ? 'opacity-75' : '',
            ]"
            :aria-pressed="selected?.id === entry.species.id"
            :data-testid="'space-couch-species-' + entry.number"
            @click="selectedId = entry.species.id"
          >
            <div class="flex items-center justify-between text-xs opacity-70">
              <span>#{{ String(entry.number).padStart(3, '0') }}</span>
              <span>{{
                known(entry.species.id)
                  ? '✦ FOUND'
                  : escaped(entry.species.id)
                    ? '↺ ESCAPED'
                    : '◇ ???'
              }}</span>
            </div>
            <span class="my-2 self-center text-4xl" aria-hidden="true">{{
              known(entry.species.id) ? '✳' : '◌'
            }}</span>
            <strong class="line-clamp-2 text-sm">{{
              known(entry.species.id) || escaped(entry.species.id)
                ? entry.species.name
                : 'UNIDENTIFIED'
            }}</strong>
          </button>
        </div>
        <p
          v-else
          class="rounded-xl border border-base-content/15 p-4 text-sm opacity-75"
          data-testid="space-couch-alien-shelf-empty"
        >
          No matching field notes. Try another catalogue number or a name
          you've encountered.
        </p>
      </section>
      <section
        v-if="selected"
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
              known(selected.id) && selectedArt
                ? 'Illustration temporarily unavailable'
                : known(selected.id)
                  ? 'Illustration awaiting curation'
                  : 'Species unrecorded'
            }}</small>
            <button
              v-if="\n                known(selected.id) &&\n                selectedArt &&\n                brokenImages.includes(selectedArt)\n              "
              type="button"
              class="btn btn-outline btn-sm mt-3"
              data-testid="space-couch-alien-retry-art"
              @click="retryArt"
            >
              RETRY ILLUSTRATION
            </button>
          </div>
        </div>
        <p class="text-xs uppercase tracking-widest opacity-70">
          {{
            known(selected.id) || escaped(selected.id)
              ? selected.category + ' · ' + selected.rarity
              : 'Classification pending'
          }}
        </p>
        <h3 class="my-2 text-2xl font-black">
          {{
            known(selected.id) || escaped(selected.id) ? selected.name : '???'
          }}
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
          <p
            class="my-3 text-base"
            data-testid="space-couch-alien-scrapbook-hint"
          >
            {{ alienHint(selected, guide) }}
          </p>
          <p class="text-sm opacity-70">
            Each solar-system visit offers three choices. Two may record an
            alien; a runaway always circles back on a later stop.
          </p>
        </template>
      </section>
      <section
        v-else
        class="order-first self-start rounded-xl border border-base-content/15 p-4 text-sm opacity-75"
      >
        Choose a different filter or search to view a field note.
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ALIEN_SPECIES } from '~/utils/gameOfCaptains/alienSpecies'
import {
  ALIEN_SHELF_FILTERS,
  alienScrapbookShelf,
  type AlienShelfFilter,
} from '~/utils/gameOfCaptains/alienScrapbookShelf'
import {
  alienHint,
  alienObservation,
  isAlienRunaway,
  type AlienGuide,
} from '~/utils/gameOfCaptains/alienFieldGuide'

const props = defineProps<{
  guide: AlienGuide
  pendingIncident?: boolean
  syncStatus?: 'guest' | 'loading' | 'synced' | 'pending'
  syncWarning?: string
  artwork?: Record<string, string>
}>()
defineEmits<{ close: []; incident: []; retrySync: [] }>()
const selectedId = ref(ALIEN_SPECIES[0]!.id)
const shelfFilter = ref<AlienShelfFilter>('all')
const shelfSearch = ref('')
const resetShelf = () => {
  shelfFilter.value = 'all'
  shelfSearch.value = ''
}
const visibleSpecies = computed(() =>
  alienScrapbookShelf(props.guide, shelfFilter.value, shelfSearch.value),
)
const selected = computed(
  () =>
    visibleSpecies.value.find((entry) => entry.species.id === selectedId.value)
      ?.species ??
    visibleSpecies.value[0]?.species ??
    null,
)
const known = (id: string): boolean => props.guide.discovered.includes(id)
const escaped = (id: string): boolean => isAlienRunaway(props.guide, id)
const shelfCounts = computed(() => {
  const recorded = props.guide.discovered.length
  const escapedCount = ALIEN_SPECIES.filter((species) =>
    escaped(species.id),
  ).length
  return {
    all: ALIEN_SPECIES.length,
    recorded,
    escaped: escapedCount,
    unseen: ALIEN_SPECIES.length - recorded - escapedCount,
  }
})
const selectedFieldReport = computed(() => {
  if (!selected.value) return null
  const report = props.guide.fieldReports?.findLast(
    (entry) => entry.speciesId === selected.value?.id,
  )
  return report ? alienObservation(report) : null
})
const selectedArt = computed(
  () => props.artwork?.[selected.value?.artKey ?? ''] ?? null,
)
const brokenImages = ref<string[]>([])
const retryArt = () => {
  if (!selectedArt.value) return
  brokenImages.value = brokenImages.value.filter(
    (image) => image !== selectedArt.value,
  )
}
</script>
