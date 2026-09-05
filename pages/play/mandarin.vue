<template>
  <div class="kr-surface">
    <div class="kr-scroll kr-container max-w-7xl space-y-4 p-3 sm:p-4">
      <MandarinBanner
        :tiles="bannerTiles"
        :card-count="cards.length"
        :set-count="allSets.length"
        :requested-count="requestedCards.length"
        :active-set-label="selectedSet?.label || ''"
        :active-set-size="selectedSet?.cardKeys.length || 0"
        @art-error="markArtBroken"
      />

      <section class="kr-panel-flat flex flex-wrap items-center justify-between gap-2 p-2 shadow-sm">
        <div class="join" role="tablist" aria-label="Learning mode">
          <button
            type="button"
            role="tab"
            :aria-selected="interactionMode === 'study'"
            class="kr-btn-join-sm"
            :class="interactionMode === 'study' ? 'btn-primary' : 'btn-ghost'"
            @click="setMode('study')"
          >
            Study
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="interactionMode === 'explore'"
            class="kr-btn-join-sm"
            :class="interactionMode === 'explore' ? 'btn-primary' : 'btn-ghost'"
            @click="setMode('explore')"
          >
            Explore
          </button>
        </div>

        <div class="join" role="tablist" aria-label="Mandarin view">
          <button
            v-for="view in workspaceViews"
            :key="view.value"
            type="button"
            role="tab"
            class="kr-btn-join-sm"
            :class="workspaceView === view.value ? 'btn-accent' : 'btn-ghost'"
            :aria-selected="workspaceView === view.value"
            @click="workspaceView = view.value"
          >
            <Icon :name="view.icon" class="size-4" />
            {{ view.label }}
          </button>
        </div>
      </section>

      <div v-if="store.error" class="alert alert-error text-sm" role="alert">
        <span>{{ store.error }}</span>
        <button class="kr-btn-plain" type="button" @click="store.loadCatalog()">Retry</button>
      </div>

      <div v-if="loading && !initialized" class="flex min-h-64 items-center justify-center">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else>
        <section v-if="workspaceView === 'sets'" class="kr-panel-flat space-y-4 p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold">Study sets</h2>
              <p class="text-xs opacity-60">Pick a deck, then jump straight back to the flash card.</p>
            </div>
            <span class="badge badge-ghost">{{ allSets.length }} decks</span>
          </div>

          <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-2">
            <button
              v-for="set in allSets"
              :key="set.id"
              type="button"
              class="rounded-2xl border p-3 text-left transition"
              :class="set.id === selectedSetId ? 'border-accent bg-accent/10' : 'border-base-300 bg-base-100 hover:border-primary/40'"
              @click="selectDeck(set.id)"
            >
              <span class="flex items-start justify-between gap-2">
                <span class="font-bold">{{ set.label }}</span>
                <span class="badge badge-ghost badge-sm">{{ set.cardKeys.length }}</span>
              </span>
              <span class="mt-1 block text-xs leading-relaxed opacity-65">{{ set.description }}</span>
            </button>
          </div>

          <form class="border-t border-base-300 pt-3" @submit.prevent="createSet">
            <label class="form-control gap-1">
              <span class="text-xs font-semibold opacity-65">New custom deck</span>
              <div class="join w-full max-w-xl">
                <input
                  v-model="newSetName"
                  class="input input-bordered input-sm join-item min-w-0 flex-1"
                  placeholder="Work phrases"
                  maxlength="80"
                />
                <button class="btn btn-outline btn-sm join-item" type="submit" :disabled="!newSetName.trim()">
                  Create
                </button>
              </div>
            </label>
            <p v-if="newSetNotice" class="mt-1 text-xs text-success">{{ newSetNotice }}</p>
          </form>
        </section>

        <section v-else-if="workspaceView === 'gallery'" class="kr-panel-flat p-3 shadow-sm">
          <kr-gallery
            v-model:mode="galleryMode"
            :items="galleryItems"
            empty-label="cards in this set"
            @open="openGalleryCard"
          >
            <template #toolbar>
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <b class="truncate">{{ selectedSet?.label || 'Study set' }}</b>
                <span class="badge badge-ghost badge-sm">{{ galleryItems.length }}</span>
                <span class="text-xs opacity-55">Tap a card to study it.</span>
              </div>
            </template>
          </kr-gallery>
        </section>

        <template v-else>
          <section v-if="interactionMode === 'explore'" class="kr-panel-flat p-3 shadow-sm">
            <label class="form-control">
              <span class="label-text mb-1 font-semibold">Find Hanzi, pinyin, or English</span>
              <input
                v-model="searchQuery"
                class="input input-bordered input-sm w-full"
                placeholder="说, shuō, speak, casino…"
                autocomplete="off"
              />
            </label>

            <div v-if="searchQuery.trim()" class="mt-2">
              <div
                v-if="searchResults.length"
                class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-2"
              >
                <button
                  v-for="card in searchResults"
                  :key="card.key"
                  type="button"
                  class="rounded-xl border border-base-300 bg-base-100 p-2 text-left transition hover:border-accent"
                  @click="focusSearchCard(card.key)"
                >
                  <span class="text-xl font-semibold">{{ card.simplified }}</span>
                  <span class="ml-2 text-xs opacity-65">{{ card.pinyin }}</span>
                  <span class="mt-1 block truncate text-xs opacity-70">{{ card.meaning }}</span>
                </button>
              </div>
              <div v-else class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-base-300 p-3">
                <div>
                  <p class="font-semibold">Not in the catalog yet.</p>
                  <p class="text-xs opacity-60">Create “{{ searchQuery.trim() }}” as a requested learning card.</p>
                </div>
                <button class="kr-btn-primary-plain" type="button" :disabled="requestingWord" @click="requestCurrentWord">
                  <span v-if="requestingWord" class="loading loading-spinner loading-xs" />
                  {{ requestingWord ? 'Creating…' : 'Create requested card' }}
                </button>
              </div>
            </div>
          </section>

          <div v-if="selectedSet" class="flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
            <div class="min-w-0">
              <b>{{ focusKey ? 'Focused card' : selectedSet.label }}</b>
              <span v-if="!focusKey" class="ml-2 opacity-55">{{ selectedSet.description }}</span>
              <span v-else-if="focusPosition && focusPosition.total > 1" class="ml-2 badge badge-ghost badge-sm">
                result {{ focusPosition.index + 1 }} / {{ focusPosition.total }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button v-if="focusKey" type="button" class="kr-btn-ghost-xs-plain" @click="store.clearFocus()">
                Return to deck
              </button>
              <button type="button" class="kr-btn-ghost-xs-plain" @click="workspaceView = 'sets'">Change set</button>
              <button type="button" class="kr-btn-ghost-xs-plain" @click="workspaceView = 'gallery'">Gallery</button>
            </div>
          </div>

          <div v-if="currentRequested" class="rounded-xl border border-warning/35 bg-warning/8 p-3 text-sm">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-warning badge-outline">AI-generated requested card</span>
              <span class="text-xs opacity-65">requested as “{{ currentRequested.requestText }}”</span>
            </div>
            <p v-if="currentRequested.usageNote" class="mt-1 text-xs">
              <b>Usage:</b> {{ currentRequested.usageNote }}
            </p>
          </div>

          <article
            v-if="interactionMode === 'study' && currentCard"
            ref="cardPanel"
            class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-lg"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 p-3">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span v-if="currentCard.hskLevel" class="badge badge-outline badge-sm">HSK {{ currentCard.hskLevel }}</span>
                <span class="badge badge-ghost badge-sm">{{ currentPositionLabel }}</span>
                <span class="badge badge-ghost badge-sm">{{ studySessionRatedForSet }} rated</span>
                <span v-if="studyDiagnostics?.dueCount" class="badge badge-primary badge-outline badge-sm">
                  {{ studyDiagnostics.dueCount }} due
                </span>
                <span v-if="studyDiagnostics?.retentionRate !== null && studyDiagnostics?.retentionRate !== undefined" class="badge badge-ghost badge-sm">
                  {{ Math.round(studyDiagnostics.retentionRate * 100) }}% retention
                </span>
              </div>

              <div class="join" aria-label="Study prompt type">
                <button
                  v-for="prompt in promptModes"
                  :key="prompt.value"
                  type="button"
                  class="btn btn-xs join-item"
                  :class="studyPromptMode === prompt.value ? 'btn-secondary' : 'btn-ghost'"
                  :title="prompt.title"
                  @click="studyPromptMode = prompt.value"
                >
                  <Icon :name="prompt.icon" class="size-3.5" />
                  <span class="hidden sm:inline">{{ prompt.label }}</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
              <div class="flex min-h-72 items-center justify-center bg-base-200/55 p-5 text-center">
                <div v-if="studyPhase !== 'revealed'" class="flex min-h-52 w-full flex-col items-center justify-center gap-4">
                  <span v-if="studyPromptMode === 'hanzi'" class="text-7xl font-semibold leading-none">
                    {{ currentCard.simplified }}
                  </span>
                  <span v-else-if="studyPromptMode === 'pinyin'" class="text-4xl font-bold tracking-wide">
                    {{ currentCard.pinyin }}
                  </span>
                  <div v-else-if="studyPromptMode === 'picture'" class="space-y-3">
                    <div class="mx-auto h-48 w-48 overflow-hidden rounded-3xl border border-base-300 shadow-inner">
                      <!-- reveal-glyph is off here on purpose: in picture-prompt
                           mode the character is the answer being recalled. -->
                      <MandarinCardArt
                        :card-key="currentCard.key"
                        :simplified="currentCard.simplified"
                        :meaning="currentCard.meaning"
                        :art="currentArtUrl"
                        :reveal-glyph="false"
                        eager
                        @error="markArtBroken"
                      />
                    </div>
                    <button v-if="canQueueArt" type="button" class="kr-btn-outline-xs" :disabled="artBusy" @click="queueCurrentIllustration">
                      {{ artBusy ? 'Submitting…' : 'Request illustration' }}
                    </button>
                    <p v-if="artNotice" class="mt-1 text-xs text-success">{{ artNotice }}</p>
                  </div>
                  <div v-else class="space-y-3">
                    <Icon name="kind-icon:volume" class="mx-auto size-12 opacity-60" />
                    <button type="button" class="btn btn-primary" @click="store.speak(currentCard)">Hear prompt</button>
                    <p class="text-xs opacity-55">Listen without seeing the answer.</p>
                  </div>
                </div>

                <div v-else class="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] items-center gap-4">
                  <div class="mx-auto h-44 w-44 overflow-hidden rounded-3xl border border-base-300 shadow-inner">
                    <MandarinCardArt
                      :card-key="currentCard.key"
                      :simplified="currentCard.simplified"
                      :meaning="currentCard.meaning"
                      :art="currentArtUrl"
                      eager
                      @error="markArtBroken"
                    />
                  </div>
                  <div class="space-y-2 text-center">
                    <p class="text-5xl font-semibold leading-none">{{ currentCard.simplified }}</p>
                    <p class="text-2xl font-bold tracking-wide">{{ currentCard.pinyin }}</p>
                    <p class="text-xl font-semibold">{{ currentCard.meaning }}</p>
                    <p v-if="currentCard.meanings.length > 1" class="text-xs leading-relaxed opacity-60">
                      {{ currentCard.meanings.slice(1).join(' · ') }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex min-h-72 flex-col justify-between gap-4 p-4 sm:p-5">
                <div v-if="studyPhase !== 'revealed'" class="my-auto space-y-3 text-center">
                  <p class="text-sm font-semibold opacity-55">Recall the meaning before revealing.</p>
                  <button type="button" class="btn btn-primary" @click="store.revealStudyCard()">Reveal answer</button>
                </div>

                <div v-else class="space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-bold">How well did you recall it?</p>
                    <div class="flex flex-wrap items-center gap-1">
                      <button
                        v-if="canQueueArt"
                        type="button"
                        class="kr-btn-outline-xs"
                        :disabled="artBusy"
                        @click="queueCurrentIllustration"
                      >
                        <Icon name="kind-icon:image" class="size-3.5" />
                        {{ artBusy ? 'Submitting…' : 'Request art' }}
                      </button>
                      <button
                        v-if="currentArtJobId"
                        type="button"
                        class="kr-btn-ghost-xs-plain"
                        :disabled="artBusy"
                        @click="refreshCurrentIllustration"
                      >
                        Check art #{{ currentArtJobId }}
                      </button>
                    </div>
                    <p v-if="artNotice" class="text-xs text-success">{{ artNotice }}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button type="button" class="btn btn-sm btn-outline btn-error" @click="store.rateStudyCard('again')">Again</button>
                    <button type="button" class="btn btn-sm btn-outline btn-warning" @click="store.rateStudyCard('hard')">Hard</button>
                    <button type="button" class="btn btn-sm btn-outline btn-success" @click="store.rateStudyCard('good')">Good</button>
                    <button type="button" class="btn btn-sm btn-outline btn-accent" @click="store.rateStudyCard('easy')">Easy</button>
                  </div>
                  <p class="text-xs opacity-55">Rating saves the review and advances. Previous and Next never rate the card.</p>

                  <details class="rounded-2xl border border-base-300 bg-base-200/25">
                    <summary class="cursor-pointer p-3 text-sm font-semibold">Pronunciation practice</summary>
                    <MandarinVoiceCoach :card="currentCard" />
                  </details>
                </div>

                <div class="flex items-center justify-between gap-2 border-t border-base-300 pt-3">
                  <button type="button" class="kr-btn-ghost-plain" :disabled="focusNavigationLocked" @click="store.previousCard()">
                    <Icon name="kind-icon:back" class="size-4" />
                    Previous
                  </button>
                  <span class="text-xs opacity-55">{{ currentPositionLabel }}</span>
                  <button type="button" class="kr-btn-ghost-plain" :disabled="focusNavigationLocked" @click="store.nextCard()">
                    Next
                    <Icon name="kind-icon:forward" class="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article
            v-else-if="interactionMode === 'explore' && currentCard"
            ref="cardPanel"
            class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-lg"
          >
            <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
              <div class="flex min-h-64 flex-col items-center justify-center gap-3 bg-base-200/55 p-5 text-center">
                <div class="h-48 w-48 overflow-hidden rounded-3xl border border-base-300 shadow-inner">
                  <MandarinCardArt
                    :card-key="currentCard.key"
                    :simplified="currentCard.simplified"
                    :meaning="currentCard.meaning"
                    :art="currentArtUrl"
                    eager
                    @error="markArtBroken"
                  />
                </div>
                <p class="text-3xl font-bold">{{ currentCard.simplified }}</p>
                <p class="text-xl font-bold tracking-wide">{{ currentCard.pinyin }}</p>
                <p v-if="currentCard.traditional" class="text-xs opacity-55">Traditional: {{ currentCard.traditional }}</p>
                <div class="flex flex-wrap justify-center gap-1">
                  <button v-if="canQueueArt" type="button" class="kr-btn-outline-xs" :disabled="artBusy" @click="queueCurrentIllustration">
                    {{ artBusy ? 'Submitting…' : 'Request illustration' }}
                  </button>
                  <button v-if="currentArtJobId" type="button" class="kr-btn-ghost-xs-plain" :disabled="artBusy" @click="refreshCurrentIllustration">
                    Check art #{{ currentArtJobId }}
                  </button>
                </div>
                <p v-if="artNotice" class="text-xs text-success">{{ artNotice }}</p>
              </div>

              <div class="flex min-h-64 flex-col p-5">
                <div class="flex flex-wrap gap-1">
                  <span v-if="currentCard.hskLevel" class="badge badge-outline badge-sm">HSK {{ currentCard.hskLevel }}</span>
                  <span v-if="currentCard.radical" class="badge badge-outline badge-sm">Radical {{ currentCard.radical }}</span>
                  <span v-for="category in currentCard.categories.slice(0, 4)" :key="category" class="badge badge-ghost badge-sm">{{ category }}</span>
                </div>

                <div class="my-auto py-5 text-center">
                  <button v-if="!meaningVisible" type="button" class="btn btn-primary" @click="store.toggleMeaning()">Reveal meaning</button>
                  <div v-else class="space-y-1">
                    <p class="text-3xl font-bold">{{ currentCard.meaning }}</p>
                    <p v-if="currentCard.meanings.length > 1" class="text-sm opacity-60">{{ currentCard.meanings.slice(1).join(' · ') }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-2 border-t border-base-300 pt-3">
                  <button type="button" class="kr-btn-ghost-plain" :disabled="focusNavigationLocked" @click="store.previousCard()">Previous</button>
                  <button type="button" class="kr-btn-outline-plain" @click="store.toggleDetails()">{{ detailsVisible ? 'Hide parts' : 'Parts & history' }}</button>
                  <button type="button" class="kr-btn-ghost-plain" :disabled="focusNavigationLocked" @click="store.nextCard()">Next</button>
                </div>
              </div>
            </div>

            <details class="border-t border-base-300 bg-base-200/20">
              <summary class="cursor-pointer p-3 text-sm font-semibold">Pronunciation practice</summary>
              <MandarinVoiceCoach :card="currentCard" />
            </details>

            <section v-if="detailsVisible" class="border-t border-base-300 bg-base-200/25 p-4">
              <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
                <div class="space-y-2">
                  <h3 class="font-bold">What is this built from?</h3>
                  <div v-if="currentCard.components.length" class="space-y-2">
                    <div v-for="component in currentCard.components" :key="`${component.glyph}:${component.role}`" class="kr-panel-flat p-3">
                      <div class="flex items-start gap-3">
                        <span class="text-3xl font-semibold">{{ component.glyph }}</span>
                        <div>
                          <p class="font-semibold">{{ component.label }}</p>
                          <p class="text-xs uppercase tracking-wide opacity-55">{{ roleLabel(component.role) }}</p>
                          <p v-if="component.meaning" class="mt-1 text-sm">{{ component.meaning }}</p>
                        </div>
                      </div>
                      <p v-if="component.note" class="mt-2 text-xs opacity-65">{{ component.note }}</p>
                    </div>
                  </div>
                  <p v-else class="text-sm opacity-60">No source-backed decomposition is attached yet.</p>
                </div>
                <div class="space-y-2">
                  <h3 class="font-bold">Character history</h3>
                  <p class="kr-panel-flat p-3 text-sm leading-relaxed" :class="!currentCard.history ? 'opacity-60' : ''">
                    {{ currentCard.history || 'Historical development is still awaiting a dedicated source for this card.' }}
                  </p>
                  <p class="text-xs opacity-50">Source: {{ currentCard.source.label }} · {{ currentCard.source.version }}</p>
                </div>
              </div>
            </section>

            <section class="border-t border-base-300 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-semibold">Save to:</span>
                <button
                  v-for="set in customSets"
                  :key="set.id"
                  type="button"
                  class="btn btn-xs"
                  :class="store.cardIsInCustomSet(set.id, currentCard.key) ? 'btn-accent' : 'btn-outline'"
                  @click="store.toggleCardInCustomSet(set.id, currentCard.key)"
                >
                  {{ set.name }}
                </button>
                <span v-if="!customSets.length" class="text-xs opacity-55">Create a custom deck in Decks.</span>
              </div>
            </section>
          </article>

          <div v-else class="kr-panel-flat p-8 text-center opacity-65">This set has no cards yet.</div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMandarinTutorStore } from '@/stores/mandarinTutorStore'
import type { MandarinComponentRole } from '@/utils/mandarin'
import type { MandarinBannerTile } from '@/components/mandarin/mandarin-banner.vue'

const store = useMandarinTutorStore()
const {
  cards,
  allSets,
  customSets,
  requestedCards,
  selectedSetId,
  selectedSet,
  studyCards,
  currentCard,
  searchQuery,
  searchResults,
  focusKey,
  focusPosition,
  meaningVisible,
  detailsVisible,
  loading,
  initialized,
  requestingWord,
  interactionMode,
  studyPhase,
  studySessionRatedForSet,
  studyDiagnostics,
  canonicalArtUrls,
  canonicalArtStrategies,
  artQueueingKey,
  artRefreshingKey,
} = storeToRefs(store)

type WorkspaceView = 'card' | 'sets' | 'gallery'
type StudyPromptMode = 'hanzi' | 'pinyin' | 'picture' | 'audio'
type GalleryMode = 'cards' | 'heroes' | 'icons'

const workspaceView = ref<WorkspaceView>('card')
const studyPromptMode = ref<StudyPromptMode>('hanzi')
const galleryMode = ref<GalleryMode>('cards')
const newSetName = ref('')
const newSetNotice = ref('')
const cardPanel = ref<HTMLElement | null>(null)
const brokenArtKeys = ref(new Set<string>())
const artNotice = ref('')
let artNoticeTimer: ReturnType<typeof setTimeout> | null = null

const workspaceViews: Array<{ value: WorkspaceView; label: string; icon: string }> = [
  { value: 'card', label: 'Card', icon: 'kind-icon:cards' },
  { value: 'sets', label: 'Decks', icon: 'kind-icon:collection' },
  { value: 'gallery', label: 'Gallery', icon: 'kind-icon:image' },
]

const promptModes: Array<{ value: StudyPromptMode; label: string; title: string; icon: string }> = [
  { value: 'hanzi', label: 'Hanzi', title: 'Prompt with the Chinese characters', icon: 'kind-icon:language' },
  { value: 'pinyin', label: 'Pinyin', title: 'Prompt with pinyin', icon: 'kind-icon:text' },
  { value: 'picture', label: 'Picture', title: 'Prompt with the illustration', icon: 'kind-icon:image' },
  { value: 'audio', label: 'Audio', title: 'Prompt by listening', icon: 'kind-icon:volume' },
]

const currentRequested = computed(() =>
  currentCard.value ? store.requestedData(currentCard.value.key) : null,
)

const bannerTiles = computed<MandarinBannerTile[]>(() => {
  const source = studyCards.value.length ? studyCards.value : cards.value
  return source.slice(0, 4).map((card) => ({
    key: card.key,
    simplified: card.simplified,
    pinyin: card.pinyin,
    meaning: card.meaning,
    art: artCandidate(card.key),
  }))
})

const currentArtUrl = computed(() => {
  const key = currentCard.value?.key
  return key ? artCandidate(key) : ''
})

const currentArtJobId = computed(() => {
  const key = currentCard.value?.key
  return key ? store.illustrationJobId(key) : null
})

const artBusy = computed(() => {
  const key = currentCard.value?.key
  return Boolean(key && (artQueueingKey.value === key || artRefreshingKey.value === key))
})

const canQueueArt = computed(() => {
  const key = currentCard.value?.key
  if (!key || currentRequested.value || currentArtUrl.value) return false
  return canonicalArtStrategies.value[key] === 'illustrate'
})

const currentPositionLabel = computed(() => {
  if (!currentCard.value || !studyCards.value.length) return '0 / 0'
  if (focusKey.value && focusPosition.value) {
    return `${focusPosition.value.index + 1} / ${focusPosition.value.total}`
  }
  const index = studyCards.value.findIndex((card) => card.key === currentCard.value?.key)
  return `${Math.max(0, index) + 1} / ${studyCards.value.length}`
})

const focusNavigationLocked = computed(
  () => Boolean(focusKey.value && (!focusPosition.value || focusPosition.value.total <= 1)),
)

const galleryItems = computed(() =>
  studyCards.value.map((card) => {
    const art = artCandidate(card.key)
    const strategy = canonicalArtStrategies.value[card.key]
    const status = store.illustrationStatus(card.key)
    const badges = [] as Array<{ label: string; class?: string }>
    if (strategy === 'glyph-only') badges.push({ label: 'Glyph card', class: 'badge-ghost' })
    else if (status === 'DONE' || status === 'V2 READY') badges.push({ label: 'Illustrated', class: 'badge-success badge-outline' })
    else badges.push({ label: 'Needs art', class: 'badge-warning badge-outline' })
    if (card.hskLevel) badges.push({ label: `HSK ${card.hskLevel}`, class: 'badge-ghost' })
    return {
      id: card.key,
      title: card.simplified,
      description: `${card.pinyin} · ${card.meaning}`,
      card: art || undefined,
      hero: art || undefined,
      icon: art || undefined,
      meta: selectedSet.value?.label,
      badges,
      placeholderIcon: 'kind-icon:language',
      placeholderLabel: card.simplified,
    }
  }),
)

function artCandidate(cardKey: string): string {
  if (brokenArtKeys.value.has(cardKey)) return ''
  return store.illustrationUrl(cardKey) || canonicalArtUrls.value[cardKey] || ''
}

function markArtBroken(cardKey: string) {
  if (brokenArtKeys.value.has(cardKey)) return
  brokenArtKeys.value = new Set(brokenArtKeys.value).add(cardKey)
}

function setMode(mode: 'study' | 'explore') {
  store.setInteractionMode(mode)
  workspaceView.value = 'card'
}

function selectDeck(id: string) {
  store.selectSet(id)
  workspaceView.value = 'card'
}

async function scrollToCard() {
  await nextTick()
  cardPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function focusSearchCard(key: string) {
  store.focusCard(key)
  await scrollToCard()
}

function openGalleryCard(item: { id: string | number }) {
  const key = String(item.id)
  const index = studyCards.value.findIndex((card) => card.key === key)
  if (index < 0) return
  store.clearFocus()
  store.studyIndex = index
  workspaceView.value = 'card'
}

function createSet() {
  const created = store.createCustomSet(newSetName.value)
  if (!created) return
  newSetName.value = ''
  newSetNotice.value = `Created “${created.name}”.`
}

async function requestCurrentWord() {
  const created = await store.requestWord(searchQuery.value)
  if (created) await scrollToCard()
}

function setArtNotice(message: string) {
  if (artNoticeTimer) {
    clearTimeout(artNoticeTimer)
    artNoticeTimer = null
  }
  artNotice.value = message
  if (message) {
    artNoticeTimer = setTimeout(() => {
      artNotice.value = ''
      artNoticeTimer = null
    }, 4000)
  }
}

async function queueCurrentIllustration() {
  setArtNotice('')
  const jobId = await store.queueIllustration(currentCard.value)
  if (jobId) setArtNotice(`Illustration queued as ArtJob ${jobId}.`)
}

async function refreshCurrentIllustration() {
  const card = currentCard.value
  if (!card) return
  setArtNotice('')
  const canonical = await store.probeCanonicalIllustration(card.key)
  if (canonical) {
    setArtNotice('Illustration ready.')
    return
  }
  const url = currentRequested.value
    ? await store.refreshRequestedIllustration(card)
    : await store.refreshIllustration(card)
  if (url) {
    brokenArtKeys.value.delete(card.key)
    setArtNotice('Illustration ready.')
    return
  }
  // Nothing came back. Saying so beats leaving the button looking inert while
  // the home relay is still working through the queue.
  setArtNotice('Still rendering — check again in a moment.')
}

// A notice about one card is meaningless on the next one.
watch(
  () => currentCard.value?.key ?? null,
  () => setArtNotice(''),
)

onBeforeUnmount(() => {
  if (artNoticeTimer) clearTimeout(artNoticeTimer)
})

function roleLabel(role: MandarinComponentRole): string {
  if (role === 'semantic') return 'meaning clue'
  if (role === 'phonetic') return 'sound clue'
  if (role === 'radical') return 'indexing radical'
  if (role === 'form') return 'written form'
  return 'uncertain role'
}

onMounted(() => {
  void store.initialize()
})

useHead({
  title: 'Mandarin Tutor · Kind Robots',
})
</script>
