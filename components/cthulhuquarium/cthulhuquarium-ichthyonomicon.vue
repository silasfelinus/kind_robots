<!-- components/cthulhuquarium/cthulhuquarium-ichthyonomicon.vue
     The book. A scrapbook of plates rather than a list: every species a
     card in its own lineage, the unobserved ones as dark shapes pressed into
     the page, and each observed one opening onto a spread -- the plate, the
     creature moving, the placard, and Wilbur's note on keeping it. -->
<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-3">
      <div class="min-w-40 flex-1">
        <div class="flex items-baseline justify-between text-xs">
          <span class="font-serif italic">
            {{ collectedCount }} of {{ totalCount }} recorded
          </span>
          <span class="opacity-60">{{ percent }}%</span>
        </div>
        <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-base-300">
          <div
            class="h-full rounded-full bg-primary transition-all"
            :style="{ width: `${percent}%` }"
          />
        </div>
      </div>
      <div class="join">
        <button
          v-for="option in FILTERS"
          :key="option.key"
          type="button"
          class="btn join-item btn-xs min-h-9"
          :class="filter === option.key ? 'btn-primary' : 'btn-ghost'"
          @click="filter = option.key"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-1">
      <button
        type="button"
        class="badge badge-sm cursor-pointer"
        :class="plateFilter === '' ? 'badge-primary' : 'badge-ghost'"
        @click="plateFilter = ''"
      >
        Every plate
      </button>
      <button
        v-for="(lineage, key) in PLATE_LINEAGES"
        :key="key"
        type="button"
        class="badge badge-sm cursor-pointer"
        :class="plateFilter === key ? 'badge-primary' : 'badge-ghost'"
        @click="plateFilter = key"
      >
        {{ lineage.name }}
      </button>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
      <button
        v-for="entry in shown"
        :key="entry.id"
        type="button"
        class="group relative flex flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
        :disabled="!entry.collected"
        @click="open = entry"
      >
        <div class="relative aspect-[3/4] w-full overflow-hidden bg-base-300">
          <img
            v-if="entry.collected && cardFor(entry.slug)"
            :src="cardFor(entry.slug) ?? undefined"
            :alt="entry.name"
            loading="lazy"
            class="size-full object-cover"
          />
          <img
            v-else-if="!entry.collected && silhouetteFor(entry.slug)"
            :src="silhouetteFor(entry.slug) ?? undefined"
            alt=""
            loading="lazy"
            class="cq-silhouette absolute inset-0 m-auto size-3/4 object-contain"
          />
          <div
            v-else
            class="flex size-full items-center justify-center opacity-40"
          >
            <Icon
              :name="entry.collected ? 'kind-icon:fish' : 'kind-icon:lock'"
              class="size-8"
            />
          </div>
          <span
            v-if="entry.currentlyOwned"
            class="badge badge-success badge-xs absolute left-1.5 top-1.5"
          >
            in the tank
          </span>
        </div>
        <div class="flex flex-col gap-0.5 p-2">
          <p class="truncate text-xs font-bold">
            {{ entry.collected ? entry.name : 'Not yet observed' }}
          </p>
          <p class="truncate text-[0.65rem] italic opacity-60">
            {{ plateFor(entry.slug)?.name ?? entry.tier.toLowerCase() }}
          </p>
        </div>
      </button>
    </div>
    <p v-if="!shown.length" class="kr-text-faded-xs">
      Nothing on these pages yet.
    </p>

    <dialog class="modal" :open="!!open" @close="open = null">
      <div v-if="open" class="modal-box max-w-3xl p-0">
        <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          <div class="relative bg-base-300">
            <img
              v-if="cardFor(open.slug)"
              :src="cardFor(open.slug) ?? undefined"
              :alt="open.name"
              class="aspect-[3/4] size-full object-cover"
            />
            <cthulhuquarium-sprite
              :slug="open.slug"
              :label="open.name"
              :size="112"
              class="absolute bottom-2 right-2 size-28 rounded-2xl bg-base-100/60 backdrop-blur-sm"
            />
          </div>
          <div class="flex flex-col gap-3 p-4">
            <div>
              <p class="text-[0.65rem] uppercase tracking-widest opacity-60">
                {{ plateFor(open.slug)?.name }}
                <span v-if="plateFor(open.slug)" class="normal-case italic">
                  — {{ plateFor(open.slug)?.note }}
                </span>
              </p>
              <h3 class="font-serif text-2xl font-bold">{{ open.name }}</h3>
              <p v-if="open.species" class="text-sm italic opacity-70">
                {{ open.species }}
              </p>
            </div>
            <p class="font-serif text-base leading-snug">
              {{ open.fieldNote || 'Nothing is written down yet.' }}
            </p>
            <div
              v-if="voiceFor(open.slug)"
              class="flex items-start gap-2 rounded-xl bg-base-200 p-2"
            >
              <img
                :src="portraitFor('wilbur', 'explaining') ?? undefined"
                alt="Wilbur Stint"
                class="size-10 shrink-0 rounded-full object-cover object-top"
              />
              <p class="font-serif text-sm leading-snug">
                “{{ voiceFor(open.slug) }}”
                <span class="block text-xs opacity-60"
                  >— Wilbur, on keeping it</span
                >
              </p>
            </div>
            <div
              class="flex flex-wrap gap-1 text-[0.65rem] uppercase tracking-wide"
            >
              <span class="badge badge-outline badge-sm">{{ open.tier }}</span>
              <span v-if="open.behavior" class="badge badge-outline badge-sm">
                {{ open.behavior }}
              </span>
              <span class="badge badge-outline badge-sm"
                >size {{ open.size }}</span
              >
            </div>
            <p v-if="open.bestStats" class="text-xs opacity-70">
              Best seen: {{ formatBestStats(open.bestStats) }}
            </p>
            <p v-if="open.firstAcquiredAt" class="text-xs italic opacity-60">
              First recorded {{ recordedOn(open.firstAcquiredAt) }}
            </p>
            <div class="mt-auto flex justify-end gap-2">
              <button
                type="button"
                class="btn btn-primary btn-sm min-h-11"
                @click="reorder(open.id)"
              >
                {{ open.currentlyOwned ? 'Buy another' : 'Re-order' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm min-h-11"
                @click="open = null"
              >
                Close the book
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="open = null">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useCthulhuquariumTankStore,
  type BestiaryEntry,
} from '@/stores/cthulhuquariumTankStore'
import { artForSpecies, portraitFor } from '~/utils/cthulhuquariumArt'
import { spriteForSpecies } from '~/utils/cthulhuquariumSprites'
import {
  PLATE_LINEAGES,
  formatBestStats,
  plateFor,
} from '~/utils/cthulhuquariumBook'
import { CTHULHUQUARIUM_VOICES } from '~/utils/cthulhuquariumCanon.generated'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'recorded', label: 'Recorded' },
  { key: 'missing', label: 'Missing' },
] as const

const tankStore = useCthulhuquariumTankStore()
const filter = ref<(typeof FILTERS)[number]['key']>('all')
const plateFilter = ref('')
const open = ref<BestiaryEntry | null>(null)

const collectedCount = computed(() => tankStore.bestiaryCollectedCount)
const totalCount = computed(
  () => tankStore.bestiaryTotalCount || tankStore.bestiary.length,
)
const percent = computed(() =>
  totalCount.value
    ? Math.round((collectedCount.value / totalCount.value) * 100)
    : 0,
)

const shown = computed(() =>
  tankStore.bestiary.filter((entry) => {
    if (filter.value === 'recorded' && !entry.collected) return false
    if (filter.value === 'missing' && entry.collected) return false
    if (plateFilter.value && plateFor(entry.slug)?.key !== plateFilter.value)
      return false
    return true
  }),
)

function cardFor(slug: string): string | null {
  return artForSpecies(slug)
}

function silhouetteFor(slug: string): string | null {
  return spriteForSpecies(slug)
}

function voiceFor(slug: string): string {
  return CTHULHUQUARIUM_VOICES[slug]?.wilbur ?? ''
}

function recordedOn(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

async function reorder(id: number) {
  open.value = null
  await tankStore.unlock(id)
}
</script>

<style scoped>
.cq-silhouette {
  filter: brightness(0) opacity(0.45);
}
</style>
