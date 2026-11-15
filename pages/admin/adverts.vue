<template>
  <main class="advert-studio kr-surface gap-0">
    <header-page-bar compact>
      <div
        class="flex min-w-0 flex-1 items-center justify-end gap-1"
        data-testid="advert-studio-bar"
      >
        <button
          v-if="selected"
          type="button"
          class="kr-btn-ghost shrink-0"
          aria-label="Back to all posters"
          @click="openPoster(null)"
        >
          <Icon name="kind-icon:grid" class="size-4" />
          <span class="hidden sm:inline">All posters</span>
        </button>
        <span
          v-if="selected"
          class="min-w-0 truncate text-sm font-bold uppercase tracking-[.14em]"
        >
          {{ selected.poster.name }}
        </span>
        <button
          type="button"
          class="kr-btn-ghost shrink-0"
          title="Check for new renders"
          aria-label="Check for new renders"
          :disabled="isSyncing || !userStore.isAdmin"
          @click="advertStore.syncRenders()"
        >
          <span v-if="isSyncing" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
        </button>
        <button
          v-if="!selected"
          type="button"
          class="kr-btn-ghost shrink-0"
          title="Download every poster as a PNG"
          :disabled="Boolean(exportingSlug) || !userStore.isAdmin"
          @click="advertStore.exportAll()"
        >
          <span
            v-if="exportingSlug"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:download" class="size-4" />
          <span class="hidden sm:inline">Download all</span>
        </button>
      </div>
    </header-page-bar>

    <div v-if="!ready" class="grid flex-1 place-items-center">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>
    <div
      v-else-if="!userStore.isAdmin"
      class="m-6 rounded-2xl border border-error/50 p-8 text-center"
    >
      <p class="text-lg font-black">Administrator access required</p>
    </div>

    <div
      v-else-if="!selected"
      class="kr-scroll @container p-3 sm:p-4"
      data-testid="advert-gallery"
    >
      <p v-if="errorMessage" class="mb-2 text-sm text-error">
        {{ errorMessage }}
      </p>
      <p v-else-if="notice" class="mb-2 text-sm text-success">{{ notice }}</p>
      <div class="advert-gallery grid gap-3">
        <article
          v-for="view in posters"
          :key="view.poster.slug"
          class="relative flex min-w-0 flex-col gap-1 rounded-2xl border border-base-300 bg-base-200 p-1.5 transition hover:border-primary"
          :data-testid="`advert-card-${view.poster.slug}`"
        >
          <advert-poster :poster="view.poster" :images="view.images" />
          <p
            class="min-w-0 truncate px-1 pb-0.5 text-sm font-bold"
            :title="view.poster.name"
          >
            {{ view.poster.name }}
          </p>
          <button
            type="button"
            class="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="`Open the ${view.poster.name} poster`"
            @click="openPoster(view.poster.slug)"
          />
        </article>
      </div>
    </div>

    <div
      v-else
      class="advert-focus flex min-h-0 flex-1 flex-col lg:flex-row"
      data-testid="advert-focus"
    >
      <section class="advert-stage" aria-label="Poster preview">
        <div class="advert-stage-poster">
          <advert-poster :poster="selected.poster" :images="selected.images" />
        </div>
      </section>

      <aside
        class="kr-scroll flex flex-col gap-3 border-t border-base-300 p-3 lg:w-[26rem] lg:flex-none lg:border-l lg:border-t-0"
        data-testid="advert-deck"
      >
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="kr-btn-ghost-circle-xs"
            aria-label="Previous poster"
            @click="stepPoster(-1)"
          >
            <Icon name="kind-icon:chevron-left" class="size-4" />
          </button>
          <button
            type="button"
            class="kr-btn-ghost-circle-xs"
            aria-label="Next poster"
            @click="stepPoster(1)"
          >
            <Icon name="kind-icon:chevron-right" class="size-4" />
          </button>
          <span class="min-w-0 truncate text-xs text-base-content/60">
            kindrobots.org{{ selected.poster.path }}
          </span>
          <button
            type="button"
            class="kr-btn-primary ml-auto shrink-0"
            :disabled="Boolean(exportingSlug)"
            @click="advertStore.exportPng(selected.poster.slug)"
          >
            <span
              v-if="exportingSlug"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:download" class="size-4" />
            Download PNG
          </button>
        </div>

        <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
        <p v-else-if="notice" class="text-sm text-success">{{ notice }}</p>

        <div role="tablist" class="tabs-boxed tabs tabs-sm rounded-xl">
          <button
            type="button"
            role="tab"
            class="tab"
            :class="{ 'tab-active': deckTab === 'art' }"
            :aria-selected="deckTab === 'art'"
            @click="deckTab = 'art'"
          >
            Art slots
          </button>
          <button
            type="button"
            role="tab"
            class="tab"
            :class="{ 'tab-active': deckTab === 'edit' }"
            :aria-selected="deckTab === 'edit'"
            @click="deckTab = 'edit'"
          >
            Request an edit
          </button>
        </div>

        <template v-if="deckTab === 'art'">
          <div class="advert-slot-tiles grid gap-2">
            <button
              v-for="slot in posterSlots"
              :key="slot.key"
              type="button"
              class="flex min-w-0 flex-col gap-1 rounded-xl border p-1 text-left"
              :class="
                slot.key === activeSlot?.key
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-base-300'
              "
              :aria-pressed="slot.key === activeSlot?.key"
              @click="activeSlotKey = slot.key"
            >
              <img
                :src="selected.images[slot.key]"
                :alt="slot.label"
                class="aspect-square w-full rounded-lg object-cover"
                :style="{ objectPosition: slot.position }"
              />
              <span class="truncate text-[0.7rem] font-bold">{{
                slot.name === 'hero' ? 'Hero' : slot.label
              }}</span>
            </button>
          </div>
          <advert-slot-panel
            v-if="activeSlot"
            :poster="selected.poster"
            :slot="activeSlot"
            :current-src="selected.images[activeSlot.key] ?? ''"
          />
          <p class="text-xs text-base-content/60">
            Wall collages are fixed art. Chosen renders replace the default on
            every export.
          </p>
        </template>
        <advert-edit-panel v-else :poster="selected.poster" />
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/userStore'
import { useAdvertStore } from '~/stores/advertStore'
import { advertSlots } from '~/utils/adverts/posters'

useHead({ title: 'Advert Studio' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const advertStore = useAdvertStore()
const { posters, selected, isSyncing, exportingSlug, errorMessage, notice } =
  storeToRefs(advertStore)

const ready = ref(false)
const deckTab = ref<'art' | 'edit'>('art')
const activeSlotKey = ref('')

const posterSlots = computed(() =>
  selected.value ? advertSlots(selected.value.poster) : [],
)
const activeSlot = computed(
  () =>
    posterSlots.value.find((slot) => slot.key === activeSlotKey.value) ??
    posterSlots.value[0] ??
    null,
)

function openPoster(slug: string | null): void {
  advertStore.select(slug)
  const query = { ...route.query }
  if (slug) query.poster = slug
  else delete query.poster
  void router.replace({ query })
}

function stepPoster(offset: number): void {
  advertStore.step(offset)
  openPoster(advertStore.selectedSlug)
}

watch(
  () => advertStore.selectedSlug,
  () => {
    activeSlotKey.value = ''
  },
)

watch(
  () => route.query.poster,
  (slug) => advertStore.select(typeof slug === 'string' ? slug : null),
)

onMounted(async () => {
  await userStore.initialize()
  advertStore.select(
    typeof route.query.poster === 'string' ? route.query.poster : null,
  )
  ready.value = true
  if (userStore.isAdmin) await advertStore.open()
})
</script>

<style scoped>
.advert-gallery {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr));
}

.advert-stage {
  flex: none;
  height: 50%;
  container-type: size;
  display: grid;
  place-items: center;
  padding: 0.75rem;
}

.advert-stage-poster {
  width: min(100cqw, 80cqh);
}

.advert-slot-tiles {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (min-width: 1024px) {
  .advert-stage {
    flex: 1 1 0%;
    height: auto;
    min-width: 0;
  }
}
</style>
