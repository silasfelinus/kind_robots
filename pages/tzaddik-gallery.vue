<template>
  <div class="kr-surface relative overflow-hidden">
    <div
      class="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute inset-0 hidden bg-cover bg-center bg-no-repeat opacity-25 dark:opacity-20 lg:block"
        style="
          background-image: url('/images/tzaddik-gallery/tzaddik-gallery-splash.webp');
        "
      />
      <div
        class="absolute inset-0 bg-linear-to-b from-base-100/70 via-base-100/60 to-base-100/85"
      />
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
        <header-page-bar>
          <div
            class="flex min-w-0 flex-1 items-center gap-2"
            title="Tzaddikim: 36 just people, sourced with receipts"
          >
            <div
              class="flex min-w-0 flex-1 gap-1 overflow-x-auto"
              role="tablist"
              aria-label="Tzaddikim sections"
            >
              <button
                v-for="tab in tabs"
                :id="`tzaddik-tab-${tab.key}`"
                :key="tab.key"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab.key"
                :aria-controls="`tzaddik-panel-${tab.key}`"
                :tabindex="activeTab === tab.key ? 0 : -1"
                class="btn btn-sm min-w-max shrink-0 gap-1.5 rounded-xl border-0"
                :class="activeTab === tab.key ? 'btn-primary' : 'btn-ghost'"
                @click="activeTab = tab.key"
                @keydown="onTabKeydown($event, tab.key)"
              >
                <Icon :name="tab.icon" class="kr-icon-3-5" />
                {{ tab.label }}
              </button>
            </div>

            <button
              v-if="userStore.isLoggedIn"
              type="button"
              class="btn btn-primary btn-sm shrink-0 gap-1.5 rounded-xl"
              title="Submit a candidate"
              @click="showSubmitForm = true"
            >
              <Icon name="kind-icon:plus" class="kr-icon-3-5" />
              <span class="sr-only @2xl:not-sr-only">Submit a candidate</span>
            </button>
            <span
              v-else
              class="hidden shrink-0 text-xs text-base-content/55 @2xl:inline"
            >
              Sign in to nominate someone
            </span>
          </div>
        </header-page-bar>

        <main class="min-h-0 flex-1">
          <section
            :id="`tzaddik-panel-${activeTab}`"
            role="tabpanel"
            :aria-labelledby="`tzaddik-tab-${activeTab}`"
            class="grid gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]"
          >
            <aside
              class="kr-panel flex flex-col gap-4 rounded-3xl p-4 lg:min-h-0 lg:overflow-y-auto"
            >
              <div class="space-y-2">
                <p class="kr-text-eyebrow text-primary">
                  {{ activeRosterEyebrow }}
                </p>
                <h2 class="kr-text-black-2xl leading-tight">
                  {{ activeRosterTitle }}
                </h2>
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
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-wide text-base-content/50"
                  >
                    visible profiles
                  </p>
                </div>
                <div>
                  <p class="text-2xl font-black leading-none">
                    {{ selectedTags.size || 'All' }}
                  </p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-wide text-base-content/50"
                  >
                    tag filters
                  </p>
                </div>
              </div>

              <div v-if="activeTab === 'review'" class="space-y-2">
                <p class="kr-text-bold-xs">Queue</p>
                <div class="flex gap-1.5">
                  <button
                    type="button"
                    class="btn btn-xs flex-1 rounded-lg border-0"
                    :class="
                      reviewCurationState === 'PENDING'
                        ? 'btn-primary'
                        : 'btn-ghost bg-base-200/60'
                    "
                    @click="setReviewCurationState('PENDING')"
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    class="btn btn-xs flex-1 rounded-lg border-0"
                    :class="
                      reviewCurationState === 'ARCHIVED'
                        ? 'btn-primary'
                        : 'btn-ghost bg-base-200/60'
                    "
                    @click="setReviewCurationState('ARCHIVED')"
                  >
                    Archived
                  </button>
                  <button
                    type="button"
                    class="btn btn-xs flex-1 rounded-lg border-0"
                    :class="
                      reviewCurationState === 'NEEDS_REVIEW'
                        ? 'btn-primary'
                        : 'btn-ghost bg-base-200/60'
                    "
                    @click="setReviewCurationState('NEEDS_REVIEW')"
                  >
                    Needs review
                  </button>
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
                  Multiple tags narrow the gallery to people matching all of
                  them.
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
                <p class="kr-text-bold-xs">How the Top 36 works</p>
                <p class="kr-text-dim-xs-55 mt-1 leading-relaxed">
                  Every category has a community Top 36, scored from upvotes,
                  downvotes, and star reviews. Other approved nominees stay
                  below in their own gallery. Approval remains editorial.
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
                    Open a portrait for sources, objections, reactions, and
                    discussion.
                  </p>
                </div>
                <span class="kr-badge-ghost-sm">
                  {{ activeGalleryItems.length }} shown
                </span>
              </div>

              <p
                v-if="tzaddikStore.voteError"
                class="text-sm text-error"
                role="alert"
              >
                {{ tzaddikStore.voteError }}
              </p>
              <div
                class="space-y-8 pt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
              >
                <template v-if="isRankingTab">
                  <div class="space-y-2">
                    <div class="flex items-baseline justify-between gap-2">
                      <h3 class="font-black text-primary">Top 36</h3>
                      <span class="kr-text-dim-xs-55">
                        {{ topCandidates.length }} ranked nominees
                      </span>
                    </div>
                    <kr-gallery
                      :items="topGalleryItems"
                      :loading="activeLoading"
                      :error="activeError"
                      :empty-label="activeEmptyLabel"
                      :modes="[]"
                      @open="openDetail"
                    >
                      <template #item="{ item }">
                        <tzaddik-ranked-card
                          v-if="candidateById.get(Number(item.id))"
                          :candidate="candidateById.get(Number(item.id))!"
                          :earned-karma="
                            earnedKarmaByCandidateId[Number(item.id)]
                          "
                          @open="openCandidateId = $event"
                        />
                      </template>
                    </kr-gallery>
                  </div>
                  <div
                    v-if="otherCandidates.length"
                    class="space-y-2 border-t border-base-300 pt-6"
                  >
                    <div class="flex items-baseline justify-between gap-2">
                      <h3 class="font-bold">Other eligible nominees</h3>
                      <span class="kr-text-dim-xs-55">
                        {{ otherCandidates.length }} more
                      </span>
                    </div>
                    <kr-gallery
                      :items="otherGalleryItems"
                      :modes="[]"
                      @open="openDetail"
                    >
                      <template #item="{ item }">
                        <tzaddik-ranked-card
                          v-if="candidateById.get(Number(item.id))"
                          :candidate="candidateById.get(Number(item.id))!"
                          :earned-karma="
                            earnedKarmaByCandidateId[Number(item.id)]
                          "
                          @open="openCandidateId = $event"
                        />
                      </template>
                    </kr-gallery>
                  </div>
                </template>
                <kr-gallery
                  v-else
                  :items="activeGalleryItems"
                  :loading="activeLoading"
                  :error="activeError"
                  :empty-label="activeEmptyLabel"
                  :modes="[]"
                  @open="openDetail"
                >
                  <template #item="{ item }">
                    <tzaddik-card
                      v-if="candidateById.get(Number(item.id))"
                      :candidate="candidateById.get(Number(item.id))!"
                      :earned-karma="earnedKarmaByCandidateId[Number(item.id)]"
                      @open="openCandidateId = $event"
                    />
                  </template>
                </kr-gallery>
              </div>
            </section>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { useTzaddikStore } from '@/stores/tzaddikStore'
import type {
  TzaddikCandidateWithTags,
  TzaddikModerationQueueFilter,
} from '@/stores/tzaddikStore'
import { useUserStore } from '@/stores/userStore'
import type { TzaddikEditorialTag } from '~/prisma/generated/prisma/client'
import { TZADDIK_TAG_ORDER, tzaddikTagLabel } from '@/utils/tzaddikTags'
import { resolveTzaddikImageSrc } from '@/utils/tzaddikImage'

type TabKey = 'living' | 'memorial' | 'popculture' | 'suggestions' | 'review'

const BASE_TABS: { key: TabKey; label: string; icon: string; body: string }[] =
  [
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
      key: 'popculture',
      label: 'Pop Culture',
      icon: 'kind-icon:stars',
      body: 'Living and memorial profiles whose public impact runs through entertainment, celebrity, television, film, music, sports, or mass culture.',
    },
  ]

const SUGGESTIONS_TAB = {
  key: 'suggestions' as const,
  label: 'Suggestions',
  icon: 'kind-icon:lightbulb',
  body: 'A rotating admin discovery pool kept above 100 sourced candidates. These are options for human review, never automatic canon.',
}

const REVIEW_TAB = {
  key: 'review' as const,
  label: 'Review queue',
  icon: 'kind-icon:flag',
  body: 'Admin-only: submissions awaiting approval, archived entries that can be restored, and candidates whose Wikipedia recheck needs a human look.',
}

// Admin-only tab, inserted right before Info -- the review queue is where an
// unapproved (PENDING) or retired (ARCHIVED) candidate is discoverable at
// all (tzaddik-gallery/t-008); a non-admin never sees the tab.
const tabs = computed(() =>
  userStore.isAdmin ? [...BASE_TABS, SUGGESTIONS_TAB, REVIEW_TAB] : BASE_TABS,
)

const activeTab = ref<TabKey>('living')
const activeTabBody = computed(
  () => tabs.value.find((tab) => tab.key === activeTab.value)?.body ?? '',
)
const reviewCurationState = ref<TzaddikModerationQueueFilter>('PENDING')

function onTabKeydown(event: KeyboardEvent, currentKey: TabKey): void {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()

  const order = tabs.value
  const currentIndex = order.findIndex((tab) => tab.key === currentKey)
  let nextIndex = currentIndex

  if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + order.length) % order.length
  } else if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % order.length
  } else if (event.key === 'Home') {
    nextIndex = 0
  } else if (event.key === 'End') {
    nextIndex = order.length - 1
  }

  const nextTab = order[nextIndex]
  if (!nextTab) return
  activeTab.value = nextTab.key
  document.getElementById(`tzaddik-tab-${nextTab.key}`)?.focus()
}

const tzaddikStore = useTzaddikStore()
const userStore = useUserStore()
const showSubmitForm = ref(false)
const openCandidateId = ref<number | null>(null)
const selectedTags = reactive(new Set<TzaddikEditorialTag>())

const REVIEW_STATE_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ARCHIVED: 'Archived',
  NEEDS_REVIEW: 'Needs review',
}

function toGalleryItem(candidate: TzaddikCandidateWithTags): GalleryItem {
  const image = resolveTzaddikImageSrc(candidate) || undefined
  const meta = [candidate.region, candidate.countryCode]
    .filter(Boolean)
    .join(', ')
  // The Needs-review queue holds APPROVED candidates too (a curationState
  // badge would be blank for them), so that queue always shows its own
  // label regardless of the candidate's actual curationState.
  const stateLabel =
    activeTab.value === 'review' && reviewCurationState.value === 'NEEDS_REVIEW'
      ? REVIEW_STATE_LABELS.NEEDS_REVIEW
      : REVIEW_STATE_LABELS[candidate.curationState]

  return {
    id: candidate.id,
    title: candidate.displayNameOverride || candidate.displayName,
    description: candidate.rationaleOverride || candidate.rationale,
    card: image,
    icon: image,
    meta: meta || undefined,
    badges: [
      ...(stateLabel ? [{ label: stateLabel }] : []),
      ...candidate.Tags.map((entry) => ({ label: tzaddikTagLabel(entry.tag) })),
    ],
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
        : activeTab.value === 'popculture'
          ? [...tzaddikStore.living, ...tzaddikStore.memorial].filter(
              (candidate) =>
                candidate.Tags.some((entry) => entry.tag === 'POP_CULTURE'),
            )
          : activeTab.value === 'suggestions'
            ? tzaddikStore.discoveryQueue
            : activeTab.value === 'review'
              ? tzaddikStore.moderationQueue
              : []

  return source.filter(matchesSelectedTags)
})

const isRankingTab = computed(
  () =>
    activeTab.value === 'living' ||
    activeTab.value === 'memorial' ||
    activeTab.value === 'popculture',
)

const rankedCandidates = computed(() =>
  [...activeCandidates.value].sort(
    (a, b) =>
      (b.community?.score ?? 0) - (a.community?.score ?? 0) ||
      (b.community?.reviewCount ?? 0) - (a.community?.reviewCount ?? 0) ||
      (b.community?.upvotes ?? 0) - (a.community?.upvotes ?? 0) ||
      (a.displayNameOverride || a.displayName).localeCompare(
        b.displayNameOverride || b.displayName,
      ),
  ),
)
const topCandidates = computed(() => rankedCandidates.value.slice(0, 36))
const otherCandidates = computed(() => rankedCandidates.value.slice(36))
const topGalleryItems = computed(() => topCandidates.value.map(toGalleryItem))
const otherGalleryItems = computed(() =>
  otherCandidates.value.map(toGalleryItem),
)
const activeGalleryItems = computed(() =>
  activeCandidates.value.map(toGalleryItem),
)

const activeCandidateIds = computed(() =>
  (isRankingTab.value ? rankedCandidates.value : activeCandidates.value).map(
    (candidate) => candidate.id,
  ),
)

const candidateById = computed(
  () =>
    new Map(
      activeCandidates.value.map((candidate) => [candidate.id, candidate]),
    ),
)

// tzaddik-gallery/t-025: earned karma for the rendered set, batched through
// the shared userStore earned-karma tracker, same pattern as bot-gallery.
const { earnedKarma: earnedKarmaByCandidateId } = userStore.trackEarnedKarma(
  'tzaddikCandidate',
  () => activeCandidateIds.value,
)

const activeLoading = computed(() =>
  activeTab.value === 'living'
    ? tzaddikStore.isLoadingLiving
    : activeTab.value === 'memorial'
      ? tzaddikStore.isLoadingMemorial
      : activeTab.value === 'review'
        ? tzaddikStore.isLoadingModerationQueue
        : false,
)

const activeError = computed(() =>
  activeTab.value === 'living'
    ? tzaddikStore.livingError
    : activeTab.value === 'memorial'
      ? tzaddikStore.memorialError
      : activeTab.value === 'review'
        ? tzaddikStore.moderationQueueError
        : '',
)

const activeRosterTitle = computed(() => {
  if (activeTab.value === 'memorial') return 'Memorial archive'
  if (activeTab.value === 'popculture') return 'Pop Culture'
  if (activeTab.value === 'suggestions') return 'Suggestion pool'
  if (activeTab.value === 'review') return 'Review queue'
  return 'Living gallery'
})

const activeRosterEyebrow = computed(() => {
  if (activeTab.value === 'memorial') return 'The memorial Top 36'
  if (activeTab.value === 'popculture') return 'Culture lane'
  if (activeTab.value === 'suggestions') return '100+ fresh options'
  if (activeTab.value === 'review') {
    return REVIEW_STATE_LABELS[reviewCurationState.value]
  }
  return 'The living Top 36'
})

const activeEmptyLabel = computed(() => {
  if (activeTab.value === 'memorial')
    return 'memorial profiles matching these filters'
  if (activeTab.value === 'popculture')
    return 'Pop Culture profiles matching these filters'
  if (activeTab.value === 'suggestions')
    return 'discovery suggestions matching these filters'
  if (activeTab.value === 'review') {
    if (reviewCurationState.value === 'ARCHIVED') return 'archived candidates'
    if (reviewCurationState.value === 'NEEDS_REVIEW')
      return 'candidates needing editor review'
    return 'candidates awaiting review'
  }
  return 'living profiles matching these filters'
})

function setReviewCurationState(filter: TzaddikModerationQueueFilter): void {
  reviewCurationState.value = filter
  tzaddikStore.fetchModerationQueue(filter, true)
}

watch(activeTab, (tab) => {
  if (tab === 'suggestions') {
    tzaddikStore.fetchDiscoveryQueue()
  } else if (tab === 'review') {
    tzaddikStore.fetchModerationQueue(reviewCurationState.value)
  }
})

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
