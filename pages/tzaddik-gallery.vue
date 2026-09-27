<template>
  <div class="kr-surface relative overflow-hidden">
    <div
      class="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute -left-32 -top-32 size-[34rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        class="absolute -right-24 top-1/4 size-[30rem] rounded-full bg-secondary/10 blur-3xl"
      />
      <div
        class="absolute bottom-[-12rem] left-1/3 size-[32rem] rounded-full bg-accent/8 blur-3xl"
      />
    </div>

    <div
      class="kr-scroll kr-container relative z-10 min-h-full max-w-[96rem] p-3 sm:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden lg:p-5"
    >
      <div
        class="mx-auto flex min-h-full w-full flex-col gap-3 lg:h-full lg:min-h-0"
      >
        <header
          class="kr-panel flex shrink-0 flex-col gap-3 rounded-3xl p-3 sm:p-4 lg:flex-row lg:items-center"
        >
          <div class="flex min-w-0 items-center gap-3 lg:w-[19rem] xl:w-[21rem]">
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm"
            >
              <Icon name="kind-icon:stars" class="kr-icon-6" />
            </div>
            <div class="min-w-0">
              <p class="kr-text-black-lg truncate">Tzaddik Gallery</p>
              <p class="kr-text-dim-xs-55 truncate">
                36 just people, sourced with receipts
              </p>
            </div>
          </div>

          <div
            class="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-2xl bg-base-200/70 p-1"
            role="tablist"
            aria-label="Tzaddik Gallery sections"
          >
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              role="tab"
              :aria-selected="activeTab === tab.key"
              class="btn btn-sm min-w-max flex-1 gap-1.5 rounded-xl border-0"
              :class="activeTab === tab.key ? 'btn-primary' : 'btn-ghost'"
              @click="activeTab = tab.key"
            >
              <Icon :name="tab.icon" class="kr-icon-3-5" />
              {{ tab.label }}
            </button>
          </div>

          <div class="flex shrink-0 items-center justify-end lg:w-[19rem] xl:w-[21rem]">
            <button
              v-if="userStore.isLoggedIn"
              type="button"
              class="btn btn-primary btn-sm gap-1.5 rounded-xl"
              @click="showSubmitForm = true"
            >
              <Icon name="kind-icon:plus" class="kr-icon-3-5" />
              Submit a candidate
            </button>
            <span
              v-else
              class="rounded-xl border border-base-300 bg-base-100/70 px-3 py-2 text-xs text-base-content/55"
            >
              Sign in to nominate someone
            </span>
          </div>
        </header>

        <main class="min-h-0 flex-1">
          <section
            v-if="activeTab !== 'info'"
            class="grid gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]"
          >
            <aside
              class="kr-panel flex flex-col gap-4 rounded-3xl p-4 lg:min-h-0 lg:overflow-y-auto"
            >
              <div class="space-y-2">
                <p class="kr-text-eyebrow text-primary">
                  {{ activeRosterEyebrow }}
                </p>
                <h1 class="kr-text-black-2xl leading-tight">
                  {{ activeRosterTitle }}
                </h1>
                <p class="text-sm leading-relaxed text-base-content/70">
                  {{ activeTabBody }}
                </p>
              </div>

              <div
                class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-200/45 p-3"
              >
                <div>
                  <p class="text-2xl font-black leading-none">
                    {{ activeCandidates.length }}
                  </p>
                  <p class="mt-1 text-[0.65rem] font-bold uppercase tracking-wide text-base-content/50">
                    visible profiles
                  </p>
                </div>
                <div>
                  <p class="text-2xl font-black leading-none">
                    {{ selectedTags.size || 'All' }}
                  </p>
                  <p class="mt-1 text-[0.65rem] font-bold uppercase tracking-wide text-base-content/50">
                    tag filters
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <p class="kr-text-bold-xs">Browse by contribution</p>
                  <button
                    v-if="selectedTags.size"
                    type="button"
                    class="btn btn-ghost btn-xs rounded-lg"
                    @click="clearTags"
                  >
                    Clear
                  </button>
                </div>
                <p class="kr-text-dim-xs-55">
                  Multiple tags narrow the gallery to people matching all of them.
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="tag in TZADDIK_TAG_ORDER"
                    :key="tag"
                    type="button"
                    class="kr-badge-xs cursor-pointer transition"
                    :class="
                      selectedTags.has(tag)
                        ? 'badge-primary'
                        : 'badge-ghost border border-base-300'
                    "
                    :aria-pressed="selectedTags.has(tag)"
                    @click="toggleTag(tag)"
                  >
                    {{ tzaddikTagLabel(tag) }}
                  </button>
                </div>
              </div>

              <div
                class="mt-auto rounded-2xl border border-primary/20 bg-primary/5 p-3"
              >
                <p class="kr-text-bold-xs">Not a leaderboard</p>
                <p class="kr-text-dim-xs-55 mt-1 leading-relaxed">
                  Reactions help surface community interest. The canonical 36 is an
                  editorial choice, not an automatic popularity score.
                </p>
              </div>
            </aside>

            <section
              class="kr-panel flex min-h-[30rem] flex-col overflow-hidden rounded-3xl p-3 sm:p-4 lg:min-h-0"
            >
              <div
                class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-3"
              >
                <div>
                  <p class="kr-text-bold-sm">{{ activeRosterTitle }}</p>
                  <p class="kr-text-dim-xs-55">
                    Open a portrait for sources, objections, reactions, and discussion.
                  </p>
                </div>
                <span class="kr-badge-ghost-sm">
                  {{ activeGalleryItems.length }} shown
                </span>
              </div>

              <div class="pt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                <kr-gallery
                  :items="activeGalleryItems"
                  :loading="activeLoading"
                  :error="activeError"
                  :empty-label="activeEmptyLabel"
                  :modes="[]"
                  @open="openDetail"
                />
              </div>
            </section>
          </section>

          <section
            v-else
            class="grid gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(19rem,0.78fr)_minmax(0,1.22fr)]"
          >
            <article
              class="kr-panel relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:flex lg:min-h-0 lg:flex-col lg:justify-between"
            >
              <div
                class="absolute -right-12 -top-16 text-[12rem] font-black leading-none text-primary/7"
                aria-hidden="true"
              >
                36
              </div>
              <div class="relative space-y-4">
                <p class="kr-text-eyebrow text-primary">The borrowed idea</p>
                <h1 class="kr-text-black-2xl max-w-xl leading-tight sm:text-3xl">
                  A ridiculous little premise with serious sourcing underneath.
                </h1>
                <p class="max-w-2xl text-sm leading-relaxed text-base-content/75 sm:text-base">
                  {{ activeTabBody }}
                </p>
              </div>

              <div
                class="relative mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4"
              >
                <p class="kr-text-bold-sm">The important boundary</p>
                <p class="kr-text-dim-sm-70 mt-1 leading-relaxed">
                  This is not a Jewish religious classification. Jewish or Hasidic
                  identity is neither required nor implied by inclusion here.
                </p>
              </div>
            </article>

            <div
              class="grid gap-3 lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]"
            >
              <div class="grid gap-3 sm:grid-cols-3">
                <article
                  v-for="block in sections"
                  :key="block.key"
                  class="kr-panel-flat flex flex-col gap-2 rounded-3xl p-4"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary"
                    >
                      <Icon :name="block.icon" class="kr-icon-4" />
                    </span>
                    <h2 class="kr-text-black-sm">{{ block.title }}</h2>
                  </div>
                  <p class="kr-text-dim-sm-70 leading-relaxed">
                    {{ block.body }}
                  </p>
                </article>
              </div>

              <article
                class="kr-panel flex flex-col gap-4 rounded-3xl p-5 lg:min-h-0 lg:overflow-y-auto"
              >
                <div>
                  <p class="kr-text-eyebrow text-primary">How the gallery behaves</p>
                  <h2 class="kr-text-black-lg mt-1">Admiration without hagiography</h2>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-2xl border border-base-300 bg-base-200/45 p-4">
                    <p class="kr-text-bold-sm">Sources stay visible</p>
                    <p class="kr-text-dim-sm-70 mt-1 leading-relaxed">
                      Wikipedia and Wikimedia are the default factual and image
                      provenance. Editor overrides remain explicit instead of quietly
                      replacing the source record.
                    </p>
                  </div>
                  <div class="rounded-2xl border border-base-300 bg-base-200/45 p-4">
                    <p class="kr-text-bold-sm">Objections stay visible</p>
                    <p class="kr-text-dim-sm-70 mt-1 leading-relaxed">
                      Meaningful controversies belong beside the praise when they are
                      documented. When there is no substantial objection, the gallery
                      does not invent one for symmetry.
                    </p>
                  </div>
                  <div class="rounded-2xl border border-base-300 bg-base-200/45 p-4">
                    <p class="kr-text-bold-sm">Community signal is advisory</p>
                    <p class="kr-text-dim-sm-70 mt-1 leading-relaxed">
                      Users can nominate and react. Those signals help discovery, but
                      they do not automatically promote anyone into the 36.
                    </p>
                  </div>
                  <div class="rounded-2xl border border-base-300 bg-base-200/45 p-4">
                    <p class="kr-text-bold-sm">Discovery should travel</p>
                    <p class="kr-text-dim-sm-70 mt-1 leading-relaxed">
                      Research deliberately reaches beyond familiar US and UK names
                      across regions, languages, disciplines, and kinds of service.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>

      <tzaddik-detail-sheet
        v-if="openCandidateId !== null"
        :candidate-id="openCandidateId"
        :candidate-ids="activeCandidateIds"
        :context-label="activeRosterTitle"
        @navigate="openCandidateId = $event"
        @close="openCandidateId = null"
      />

      <tzaddik-submit-form
        v-if="showSubmitForm"
        @close="showSubmitForm = false"
        @submitted="onSubmitted"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { useTzaddikStore } from '@/stores/tzaddikStore'
import type { TzaddikCandidateWithTags } from '@/stores/tzaddikStore'
import { useUserStore } from '@/stores/userStore'
import type { TzaddikEditorialTag } from '~/prisma/generated/prisma/client'
import { TZADDIK_TAG_ORDER, tzaddikTagLabel } from '@/utils/tzaddikTags'

type TabKey = 'living' | 'memorial' | 'info'

const tabs: { key: TabKey; label: string; icon: string; body: string }[] = [
  {
    key: 'living',
    label: 'Living',
    icon: 'kind-icon:stars',
    body: 'Living profiles under consideration for the playful current 36. Community reactions help discovery, but they do not decide membership.',
  },
  {
    key: 'memorial',
    label: 'Memorial',
    icon: 'kind-icon:heart',
    body: 'A sourced archive for people whose work, courage, care, or public service still belongs in the story after their deaths.',
  },
  {
    key: 'info',
    label: 'Info',
    icon: 'kind-icon:mask',
    body: 'Tzaddik Gallery borrows the folklore idea of 36 righteous or “just” people who quietly sustain the world, then turns it into a playful, sourced pop-culture gallery. It is not a religious classification, and inclusion does not require or imply Jewish or Hasidic identity.',
  },
]

const activeTab = ref<TabKey>('living')
const activeTabBody = computed(
  () => tabs.find((tab) => tab.key === activeTab.value)?.body ?? '',
)

const sections = [
  {
    key: 'sourced',
    title: 'Sourced, not assumed',
    body: 'Wikipedia is the default source for facts and images. Overrides remain explicit and preserve the original provenance.',
    icon: 'kind-icon:database',
  },
  {
    key: 'international',
    title: 'Beyond the usual names',
    body: 'Discovery deliberately pushes past US and Anglosphere celebrity gravity into wider regions, languages, and kinds of service.',
    icon: 'kind-icon:globe',
  },
  {
    key: 'community',
    title: 'Community-suggested',
    body: 'Signed-in users can nominate people and react to entries. Community interest is evidence to inspect, not a canonical ranking.',
    icon: 'kind-icon:people',
  },
]

const tzaddikStore = useTzaddikStore()
const userStore = useUserStore()
const showSubmitForm = ref(false)
const openCandidateId = ref<number | null>(null)
const selectedTags = reactive(new Set<TzaddikEditorialTag>())

function toGalleryItem(candidate: TzaddikCandidateWithTags): GalleryItem {
  const image =
    candidate.imageUrlOverride || candidate.imageFileUrl || undefined
  const meta = [candidate.region, candidate.countryCode]
    .filter(Boolean)
    .join(', ')

  return {
    id: candidate.id,
    title: candidate.displayNameOverride || candidate.displayName,
    description: candidate.rationaleOverride || candidate.rationale,
    card: image,
    icon: image,
    meta: meta || undefined,
    badges: candidate.Tags.map((entry) => ({
      label: tzaddikTagLabel(entry.tag),
    })),
    placeholderIcon: 'kind-icon:stars',
    placeholderLabel: candidate.displayName,
  }
}

function toggleTag(tag: TzaddikEditorialTag): void {
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag)
  } else {
    selectedTags.add(tag)
  }
}

function clearTags(): void {
  selectedTags.clear()
}

function matchesSelectedTags(candidate: TzaddikCandidateWithTags): boolean {
  if (!selectedTags.size) return true
  const candidateTags = new Set(candidate.Tags.map((entry) => entry.tag))
  return [...selectedTags].every((tag) => candidateTags.has(tag))
}

const activeCandidates = computed(() => {
  const source =
    activeTab.value === 'living'
      ? tzaddikStore.living
      : activeTab.value === 'memorial'
        ? tzaddikStore.memorial
        : []

  return source.filter(matchesSelectedTags)
})

const activeGalleryItems = computed(() =>
  activeCandidates.value.map(toGalleryItem),
)

const activeCandidateIds = computed(() =>
  activeCandidates.value.map((candidate) => candidate.id),
)

const activeLoading = computed(() =>
  activeTab.value === 'living'
    ? tzaddikStore.isLoadingLiving
    : activeTab.value === 'memorial'
      ? tzaddikStore.isLoadingMemorial
      : false,
)

const activeError = computed(() =>
  activeTab.value === 'living'
    ? tzaddikStore.livingError
    : activeTab.value === 'memorial'
      ? tzaddikStore.memorialError
      : '',
)

const activeRosterTitle = computed(() =>
  activeTab.value === 'memorial' ? 'Memorial archive' : 'Living gallery',
)

const activeRosterEyebrow = computed(() =>
  activeTab.value === 'memorial' ? 'Past Tzaddik' : 'The current 36',
)

const activeEmptyLabel = computed(() =>
  activeTab.value === 'memorial'
    ? 'memorial profiles matching these filters'
    : 'living profiles matching these filters',
)

function openDetail(item: GalleryItem): void {
  openCandidateId.value = Number(item.id)
}

async function onSubmitted(candidate: TzaddikCandidateWithTags): Promise<void> {
  showSubmitForm.value = false
  await tzaddikStore.fetchOne(candidate.id, true)
  openCandidateId.value = candidate.id
}

onMounted(() => {
  tzaddikStore.fetchLiving()
  tzaddikStore.fetchMemorial()
})
</script>
