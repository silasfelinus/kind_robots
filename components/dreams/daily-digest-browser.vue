<template>
  <section
    class="relative isolate overflow-hidden rounded-[2rem] border border-primary/20 bg-base-100 shadow-sm"
  >
    <div
      v-if="loading"
      class="grid min-h-[24rem] animate-pulse lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]"
    >
      <div class="min-h-64 bg-base-300" />
      <div class="space-y-4 p-6 sm:p-8">
        <div class="h-5 w-32 rounded-full bg-base-300" />
        <div class="h-10 w-4/5 rounded-2xl bg-base-300" />
        <div class="h-24 rounded-2xl bg-base-200" />
        <div class="grid grid-cols-2 gap-3">
          <div class="h-28 rounded-2xl bg-base-200" />
          <div class="h-28 rounded-2xl bg-base-200" />
        </div>
      </div>
    </div>

    <div v-else class="min-h-[24rem]">
      <div
        class="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]"
      >
        <figure
          class="relative min-h-72 overflow-hidden bg-primary/10 lg:min-h-[29rem]"
        >
          <img
            :src="displayImage"
            :alt="activeDream ? `${activeDream.title} artwork` : 'Ami butterfly logo'"
            class="absolute inset-0 size-full"
            :class="hasDreamArtwork ? 'object-cover' : 'object-contain p-12 sm:p-16'"
            @error="imageFailed = true"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-content/75 via-base-content/5 to-transparent"
          />

          <div
            class="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-4 sm:p-5"
          >
            <span class="badge badge-primary gap-1 rounded-xl shadow-sm">
              <Icon name="kind-icon:moon" class="size-3.5" />
              Daily digest
            </span>
            <span
              v-if="activeDate"
              class="badge badge-neutral rounded-xl shadow-sm"
            >
              {{ formatDate(activeDate) }}
            </span>
            <span
              v-if="digestDreams.length"
              class="badge badge-ghost rounded-xl border-base-100/40 bg-base-100/80 text-base-content shadow-sm backdrop-blur"
            >
              {{ activeIndex + 1 }} of {{ digestDreams.length }}
            </span>
          </div>

          <div class="absolute inset-x-0 bottom-0 p-5 text-base-100 sm:p-7">
            <p
              class="text-xs font-black uppercase tracking-[0.18em] text-base-100/70"
            >
              {{
                activeDream
                  ? 'A world from the archive'
                  : 'The archive is waking up'
              }}
            </p>
            <h2 class="mt-1 text-2xl font-black leading-tight sm:text-3xl">
              {{ activeDream?.title || 'Fresh worlds will gather here' }}
            </h2>
          </div>
        </figure>

        <div class="flex min-w-0 flex-col justify-center p-5 sm:p-7">
          <template v-if="activeDream">
            <span
              v-if="activeDream.PitchSheet?.hook"
              class="badge badge-accent mb-4 h-auto w-fit rounded-xl px-3 py-2 text-left"
            >
              {{ activeDream.PitchSheet.hook }}
            </span>

            <p
              v-if="activeDream.PitchSheet?.subtitle"
              class="mb-3 text-sm font-bold leading-relaxed text-primary"
            >
              {{ activeDream.PitchSheet.subtitle }}
            </p>

            <p class="text-sm leading-relaxed text-base-content/75">
              {{
                activeDream.pitch ||
                activeDream.description ||
                activeDream.flavorText ||
                digestFallback
              }}
            </p>

            <div class="mt-5 flex flex-wrap gap-2">
              <span
                v-if="relatedDreamCount"
                class="badge badge-outline gap-1 rounded-xl"
              >
                <Icon name="kind-icon:map" class="size-3.5" />
                {{ relatedDreamCount }} place{{ relatedDreamCount === 1 ? '' : 's' }}
              </span>
              <span
                v-if="activeDream.Characters.length"
                class="badge badge-outline gap-1 rounded-xl"
              >
                <Icon name="kind-icon:users" class="size-3.5" />
                {{ activeDream.Characters.length }} cast
              </span>
              <span
                v-if="activeDream.Rewards.length"
                class="badge badge-outline gap-1 rounded-xl"
              >
                <Icon name="kind-icon:gift" class="size-3.5" />
                {{ activeDream.Rewards.length }} discoveries
              </span>
              <span
                v-if="activeDream.Scenarios.length"
                class="badge badge-outline gap-1 rounded-xl"
              >
                <Icon name="kind-icon:story" class="size-3.5" />
                {{ activeDream.Scenarios.length }} scenario{{
                  activeDream.Scenarios.length === 1 ? '' : 's'
                }}
              </span>
              <span
                v-if="activeDream.Bots.length"
                class="badge badge-outline gap-1 rounded-xl"
              >
                <Icon name="kind-icon:robot" class="size-3.5" />
                {{ activeDream.Bots.length }} narrator{{
                  activeDream.Bots.length === 1 ? '' : 's'
                }}
              </span>
            </div>
          </template>

          <div v-else class="py-5">
            <p class="text-lg font-black">No Daily Dreams have landed yet.</p>
            <p
              class="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60"
            >
              This space follows the current Daily Dream model. As the backlog is
              built and artwork finishes rendering, each day will appear here with
              its world, cast, discoveries, scenarios, and images.
            </p>
            <p
              v-if="archiveStore.lastError"
              class="mt-3 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
            >
              {{ archiveStore.lastError }}
            </p>
          </div>
        </div>
      </div>

      <daily-digest-object-gallery
        v-if="activeDream"
        :dream="activeDream"
      />

      <div
        class="flex flex-col gap-3 border-t border-base-300 p-5 sm:flex-row sm:items-center sm:p-7"
      >
        <div class="join shrink-0">
          <button
            type="button"
            class="btn join-item btn-sm"
            :disabled="!canGoOlder"
            aria-label="Show the previous daily digest"
            @click="showOlder"
          >
            <Icon name="kind-icon:chevron-left" class="size-4" />
            Previous
          </button>
          <button
            type="button"
            class="btn join-item btn-sm"
            :disabled="!canGoNewer"
            aria-label="Show the next daily digest"
            @click="showNewer"
          >
            Next
            <Icon name="kind-icon:chevron-right" class="size-4" />
          </button>
        </div>

        <select
          v-if="digestDreams.length"
          v-model.number="selectedDreamId"
          class="select select-bordered select-sm min-w-0 flex-1 rounded-xl"
          aria-label="Choose a daily digest"
        >
          <option v-for="dream in digestDreams" :key="dream.id" :value="dream.id">
            {{ formatDate(dateKey(dream)) }} · {{ dream.title }}
          </option>
        </select>

        <button
          type="button"
          class="btn btn-ghost btn-sm shrink-0 rounded-xl"
          :disabled="loading"
          @click="loadDigests"
        >
          <Icon name="kind-icon:refresh-cw" class="size-4" />
          Refresh archive
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  useDailyDreamArchiveStore,
  type DailyDreamArchiveEntry,
} from '@/stores/dailyDreamArchiveStore'
import { resolveEntityArtwork } from '@/utils/artImageSrc'

const archiveStore = useDailyDreamArchiveStore()
const selectedDreamId = ref<number | null>(null)
const loading = ref(true)
const imageFailed = ref(false)

const digestDreams = computed<DailyDreamArchiveEntry[]>(() =>
  [...archiveStore.dreams].sort((left, right) => {
    const dateOrder = dateKey(right).localeCompare(dateKey(left))
    return dateOrder || right.id - left.id
  }),
)

const activeIndex = computed(() => {
  const index = digestDreams.value.findIndex(
    (dream) => dream.id === selectedDreamId.value,
  )
  return index >= 0 ? index : 0
})

const activeDream = computed<DailyDreamArchiveEntry | null>(
  () => digestDreams.value[activeIndex.value] ?? null,
)
const activeDate = computed(() =>
  activeDream.value ? dateKey(activeDream.value) : '',
)
const relatedDreamCount = computed(() => {
  const dream = activeDream.value
  if (!dream) return 0

  return new Set([
    ...dream.RelationsFrom.map((relation) => relation.ToDream.id),
    ...dream.RelationsTo.map((relation) => relation.FromDream.id),
  ]).size
})
const canGoOlder = computed(
  () => activeIndex.value < digestDreams.value.length - 1,
)
const canGoNewer = computed(() => activeIndex.value > 0)

const activeArtwork = computed(() => {
  const dream = activeDream.value
  if (!dream) return ''
  return (
    resolveEntityArtwork(dream.ArtImage) ||
    resolveEntityArtwork(dream.ArtImages?.[0]) ||
    resolveEntityArtwork(dream.ArtCollection) ||
    resolveEntityArtwork(dream.ArtCollections?.[0]?.ArtImages?.[0]) ||
    resolveEntityArtwork(dream.ArtCollections?.[0]) ||
    dream.PitchSheet?.imagePath ||
    resolveEntityArtwork(dream) ||
    ''
  )
})

const hasDreamArtwork = computed(() =>
  Boolean(activeArtwork.value && !imageFailed.value),
)
const displayImage = computed(() =>
  hasDreamArtwork.value ? activeArtwork.value : '/images/amilogo.webp',
)

const digestFallback =
  'A freshly assembled world from the Daily Dream engine, waiting for its story to unfold.'

function dateKey(dream: DailyDreamArchiveEntry): string {
  const slugDate = String(dream.slug || '').match(
    /^daily-dream-(\d{4}-\d{2}-\d{2})-/,
  )?.[1]
  if (slugDate) return slugDate
  return String(dream.createdAt || '').slice(0, 10)
}

function formatDate(value: string): string {
  if (!value) return 'Undated dream'
  const date = new Date(`${value}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function showOlder(): void {
  const dream = digestDreams.value[activeIndex.value + 1]
  if (dream) selectedDreamId.value = dream.id
}

function showNewer(): void {
  const dream = digestDreams.value[activeIndex.value - 1]
  if (dream) selectedDreamId.value = dream.id
}

async function loadDigests(): Promise<void> {
  loading.value = true
  try {
    await archiveStore.fetchArchive(true)
  } finally {
    loading.value = false
  }
}

watch(
  digestDreams,
  (dreams) => {
    if (!dreams.length) {
      selectedDreamId.value = null
      return
    }
    if (!dreams.some((dream) => dream.id === selectedDreamId.value)) {
      selectedDreamId.value = dreams[0]?.id ?? null
    }
  },
  { immediate: true },
)

watch(activeArtwork, () => {
  imageFailed.value = false
})

onMounted(() => {
  void loadDigests()
})
</script>
