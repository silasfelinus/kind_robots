<template>
  <div class="kr-surface">
    <div class="kr-scroll mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header class="space-y-2">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-3xl font-bold">Mandarin Tutor</p>
            <p class="mt-1 max-w-3xl text-sm opacity-70">
              Learn the word, hear it, then open the character and see what its pieces are actually doing.
            </p>
          </div>
          <div class="stats stats-horizontal border border-base-300 bg-base-100 shadow-sm">
            <div class="stat px-4 py-2">
              <div class="stat-title text-xs">Cards</div>
              <div class="stat-value text-xl">{{ cards.length }}</div>
            </div>
            <div class="stat px-4 py-2">
              <div class="stat-title text-xs">Sets</div>
              <div class="stat-value text-xl">{{ allSets.length }}</div>
            </div>
            <div class="stat px-4 py-2">
              <div class="stat-title text-xs">Requested</div>
              <div class="stat-value text-xl">{{ requestedCards.length }}</div>
            </div>
          </div>
        </div>
        <div class="rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed opacity-80">
          Component roles are labeled separately from dictionary radicals. A radical is useful for indexing and pattern recognition, but it is not automatically the historical “meaning” of the whole character.
        </div>

        <div class="join" role="tablist" aria-label="Interaction mode">
          <button
            type="button"
            role="tab"
            :aria-selected="interactionMode === 'study'"
            class="btn join-item"
            :class="interactionMode === 'study' ? 'btn-primary' : 'btn-outline'"
            @click="store.setInteractionMode('study')"
          >
            Study
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="interactionMode === 'explore'"
            class="btn join-item"
            :class="interactionMode === 'explore' ? 'btn-primary' : 'btn-outline'"
            @click="store.setInteractionMode('explore')"
          >
            Explore
          </button>
        </div>
        <p class="text-xs leading-relaxed opacity-60">
          <template v-if="interactionMode === 'study'">
            Study is a deliberate recall loop: guess from the character, reveal, hear it, then rate yourself.
          </template>
          <template v-else>
            Explore is for searching, browsing decomposition and history, and curating decks.
          </template>
        </p>
      </header>

      <div v-if="store.error" class="alert alert-error text-sm" role="alert">
        <span>{{ store.error }}</span>
        <button class="btn btn-sm" type="button" @click="store.loadCatalog()">Retry</button>
      </div>

      <div v-if="loading && !initialized" class="flex min-h-64 items-center justify-center">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else>
        <section v-if="interactionMode === 'explore'" class="kr-panel-flat p-4 shadow-sm">
          <label class="form-control">
            <span class="label-text mb-1 font-semibold">Find a word, Hanzi, pinyin, or English meaning</span>
            <input
              v-model="searchQuery"
              class="input input-bordered w-full"
              placeholder="说, shuō, speak, casino…"
              autocomplete="off"
            />
          </label>

          <div v-if="searchQuery.trim()" class="mt-3">
            <div v-if="searchResults.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                v-for="card in searchResults"
                :key="card.key"
                type="button"
                class="rounded-xl border border-base-300 bg-base-200/40 p-3 text-left transition hover:border-accent hover:bg-base-200"
                @click="focusSearchCard(card.key)"
              >
                <span class="text-2xl font-semibold">{{ card.simplified }}</span>
                <span class="ml-2 text-sm opacity-65">{{ card.pinyin }}</span>
                <span class="mt-1 block truncate text-xs opacity-70">{{ card.meaning }}</span>
              </button>
            </div>
            <div v-else class="flex flex-col gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-semibold">Not in the catalog yet.</p>
                <p class="mt-1 max-w-2xl text-xs leading-relaxed opacity-65">
                  Create a requested card for “{{ searchQuery.trim() }}”. Its translation and usage fields will be clearly labeled as AI-generated; character decomposition remains separately sourced when available.
                </p>
              </div>
              <button
                class="btn btn-primary shrink-0"
                type="button"
                :disabled="requestingWord"
                @click="requestCurrentWord"
              >
                <span v-if="requestingWord" class="loading loading-spinner loading-xs" />
                {{ requestingWord ? 'Creating card…' : 'Create requested card' }}
              </button>
            </div>
          </div>
        </section>

        <div class="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside class="space-y-3 lg:sticky lg:top-4 lg:self-start">
            <div class="kr-panel-flat p-3 shadow-sm">
              <div class="mb-2 flex items-center justify-between gap-2">
                <h2 class="font-bold">Study sets</h2>
                <span class="badge badge-ghost">{{ selectedSet?.cardKeys.length ?? 0 }}</span>
              </div>
              <div class="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
                <button
                  v-for="set in allSets"
                  :key="set.id"
                  type="button"
                  class="w-full rounded-xl px-3 py-2 text-left text-sm transition"
                  :class="set.id === selectedSetId ? 'bg-accent text-accent-content' : 'hover:bg-base-200'"
                  @click="store.selectSet(set.id)"
                >
                  <span class="flex items-center justify-between gap-2">
                    <span class="font-semibold">{{ set.label }}</span>
                    <span class="text-xs opacity-70">{{ set.cardKeys.length }}</span>
                  </span>
                  <span class="mt-0.5 block text-xs opacity-70">{{ set.description }}</span>
                </button>
              </div>

              <form class="mt-3 space-y-2 border-t border-base-300 pt-3" @submit.prevent="createSet">
                <label class="form-control gap-1">
                  <span class="text-xs font-semibold opacity-65">New custom deck</span>
                  <div class="join w-full">
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
                <p v-if="newSetNotice" class="text-xs leading-relaxed text-success">{{ newSetNotice }}</p>
              </form>
            </div>
          </aside>

          <main class="min-w-0 space-y-4">
            <div v-if="selectedSet" class="space-y-2 text-sm">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <template v-if="focusKey">
                    <span class="font-semibold">Exploring a card</span>
                    <span v-if="focusPosition && focusPosition.total > 1" class="badge badge-ghost">
                      result {{ focusPosition.index + 1 }} of {{ focusPosition.total }}
                    </span>
                    <span v-else class="opacity-60">outside the current deck sequence</span>
                  </template>
                  <template v-else>
                    <span class="font-semibold">{{ selectedSet.label }}</span>
                    <span class="opacity-60">{{ selectedSet.description }}</span>
                    <button
                      v-if="selectedCustomSetId && renamingSetId !== selectedCustomSetId"
                      type="button"
                      class="btn btn-ghost btn-xs"
                      @click="startRenameSelectedSet"
                    >
                      Rename deck
                    </button>
                  </template>
                </div>
                <button v-if="focusKey" type="button" class="btn btn-ghost btn-sm" @click="store.clearFocus()">
                  Return to {{ selectedSet.label }}
                </button>
              </div>

              <form
                v-if="!focusKey && selectedCustomSetId && renamingSetId === selectedCustomSetId"
                class="flex max-w-lg flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
                @submit.prevent="saveRenamedSet"
              >
                <input
                  v-model="renameSetName"
                  class="input input-bordered input-sm min-w-44 flex-1"
                  maxlength="80"
                  aria-label="Custom study set name"
                />
                <button class="btn btn-primary btn-sm" type="submit" :disabled="!renameSetName.trim()">
                  Save name
                </button>
                <button class="btn btn-ghost btn-sm" type="button" @click="cancelRenameSet">
                  Cancel
                </button>
              </form>
            </div>

            <div
              v-if="currentRequested"
              class="rounded-2xl border border-warning/35 bg-warning/8 p-3 text-sm"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge badge-warning badge-outline">AI-generated requested card</span>
                <span class="text-xs opacity-65">requested as “{{ currentRequested.requestText }}”</span>
              </div>
              <p v-if="currentRequested.usageNote" class="mt-2 text-xs leading-relaxed">
                <span class="font-bold">Usage note:</span> {{ currentRequested.usageNote }}
              </p>
              <details class="mt-2 text-xs opacity-70">
                <summary class="cursor-pointer font-semibold">Generation provenance</summary>
                <p class="mt-2 leading-relaxed">
                  Translation and usage fields are AI-generated rather than dictionary-sourced. Character analysis is enriched separately from the sourced character dataset.
                </p>
                <p class="mt-1 opacity-70">
                  {{ currentRequested.provenance.provider }} · {{ currentRequested.provenance.model }} · recipe {{ currentRequested.provenance.recipeVersion }}
                </p>
              </details>
            </div>

            <article
              v-if="interactionMode === 'explore' && currentCard"
              ref="cardPanel"
              class="scroll-mt-4 overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl"
            >
              <div class="grid md:grid-cols-[minmax(16rem,0.9fr)_minmax(18rem,1.1fr)]">
                <div class="flex min-h-80 flex-col items-center justify-center gap-4 bg-base-200/70 p-6 text-center">
                  <div class="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-inner">
                    <img
                      v-if="store.illustrationUrl(currentCard.key)"
                      :src="store.illustrationUrl(currentCard.key) || ''"
                      :alt="`Study illustration for ${currentCard.meaning}`"
                      class="h-full w-full object-cover"
                    />
                    <span v-else class="text-7xl font-semibold leading-none">{{ currentCard.simplified }}</span>
                    <span
                      v-if="store.illustrationUrl(currentCard.key)"
                      class="absolute bottom-2 right-2 rounded-xl bg-base-100/90 px-3 py-1 text-3xl font-semibold shadow"
                    >
                      {{ currentCard.simplified }}
                    </span>
                  </div>
                  <div>
                    <p class="text-2xl font-bold tracking-wide">{{ currentCard.pinyin }}</p>
                    <p v-if="currentCard.traditional" class="mt-1 text-sm opacity-60">
                      Traditional: <span class="text-lg">{{ currentCard.traditional }}</span>
                    </p>
                  </div>
                  <p v-if="friendlyIllustrationStatus" class="max-w-sm text-xs opacity-55">
                    {{ friendlyIllustrationStatus }}
                  </p>
                </div>

                <div class="flex min-h-80 flex-col p-5 sm:p-7">
                  <div class="flex flex-wrap gap-2">
                    <span v-if="currentCard.hskLevel" class="badge badge-outline">HSK {{ currentCard.hskLevel }}</span>
                    <span v-if="currentCard.radical" class="badge badge-outline">Radical {{ currentCard.radical }}</span>
                    <span v-for="category in currentCard.categories.slice(0, 4)" :key="category" class="badge badge-ghost">
                      {{ category }}
                    </span>
                  </div>

                  <div class="my-auto py-8 text-center">
                    <button
                      v-if="!meaningVisible"
                      type="button"
                      class="btn btn-primary btn-lg"
                      @click="store.toggleMeaning()"
                    >
                      Reveal meaning
                    </button>
                    <div v-else class="space-y-2">
                      <p class="text-3xl font-bold">{{ currentCard.meaning }}</p>
                      <p v-if="currentCard.meanings.length > 1" class="mx-auto max-w-xl text-sm leading-relaxed opacity-65">
                        {{ currentCard.meanings.slice(1).join(' · ') }}
                      </p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      class="btn btn-outline"
                      :disabled="Boolean(focusKey && (!focusPosition || focusPosition.total <= 1))"
                      @click="store.previousCard()"
                    >
                      {{ focusKey ? 'Previous result' : 'Previous' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline"
                      :disabled="Boolean(focusKey && (!focusPosition || focusPosition.total <= 1))"
                      @click="store.nextCard()"
                    >
                      {{ focusKey ? 'Next result' : 'Next' }}
                    </button>
                    <button type="button" class="btn btn-outline col-span-2 sm:col-span-1" @click="store.toggleDetails()">
                      {{ detailsVisible ? 'Hide parts' : 'Parts & history' }}
                    </button>
                  </div>
                </div>
              </div>

              <MandarinVoiceCoach :card="currentCard" />

              <section v-if="detailsVisible" class="border-t border-base-300 bg-base-200/30 p-5 sm:p-7">
                <div class="grid gap-5 xl:grid-cols-2">
                  <div class="space-y-3">
                    <h3 class="text-lg font-bold">What is this built from?</h3>
                    <div v-if="currentCard.components.length" class="grid gap-2 sm:grid-cols-2">
                      <div
                        v-for="component in currentCard.components"
                        :key="`${component.glyph}:${component.role}`"
                        class="kr-panel-flat p-4"
                      >
                        <div class="flex items-start gap-3">
                          <span class="text-4xl font-semibold">{{ component.glyph }}</span>
                          <div>
                            <p class="font-semibold">{{ component.label }}</p>
                            <p class="text-xs uppercase tracking-wide opacity-55">{{ roleLabel(component.role) }}</p>
                            <p v-if="component.meaning" class="mt-1 text-sm">{{ component.meaning }}</p>
                          </div>
                        </div>
                        <p v-if="component.note" class="mt-2 text-xs leading-relaxed opacity-70">{{ component.note }}</p>
                      </div>
                    </div>
                    <p v-else class="rounded-xl border border-base-300 bg-base-100 p-4 text-sm opacity-65">
                      A source-backed decomposition has not been attached to this card yet. The tutor leaves that blank rather than inventing a memorable story and calling it history.
                    </p>
                  </div>

                  <div class="space-y-3">
                    <h3 class="text-lg font-bold">How did the character get here?</h3>
                    <p v-if="currentCard.history" class="kr-panel-flat p-4 text-sm leading-relaxed">
                      {{ currentCard.history }}
                    </p>
                    <p v-else class="kr-panel-flat p-4 text-sm leading-relaxed opacity-65">
                      Historical development is pending a dedicated decomposition source. The current radical, when shown, is an indexing clue rather than an etymological claim.
                    </p>
                    <div class="text-xs opacity-55">
                      Source: {{ currentCard.source.label }} · {{ currentCard.source.version }}
                    </div>
                    <p v-if="currentCard.source.licenseNote" class="text-[11px] leading-relaxed opacity-50">
                      {{ currentCard.source.licenseNote }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="border-t border-base-300 p-5 sm:p-7">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="mr-1 text-sm font-semibold">Save this card to:</span>
                  <button
                    v-for="set in customSets"
                    :key="set.id"
                    type="button"
                    class="btn btn-sm"
                    :class="store.cardIsInCustomSet(set.id, currentCard.key) ? 'btn-accent' : 'btn-outline'"
                    @click="store.toggleCardInCustomSet(set.id, currentCard.key)"
                  >
                    {{ set.name }}
                  </button>
                  <span v-if="!customSets.length" class="text-xs opacity-55">Create a custom deck in Study sets to collect cards.</span>
                </div>
              </section>
            </article>

            <article
              v-else-if="interactionMode === 'study' && currentCard"
              ref="cardPanel"
              class="scroll-mt-4 overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl"
            >
              <div class="flex flex-col items-center gap-6 p-6 text-center sm:p-10">
                <div class="flex flex-wrap items-center justify-center gap-2">
                  <span v-if="currentCard.hskLevel" class="badge badge-outline">HSK {{ currentCard.hskLevel }}</span>
                  <span class="badge badge-ghost">{{ studySessionRatedForSet }} rated this session</span>
                  <span
                    v-if="studyDiagnostics && studyDiagnostics.dueCount > 0"
                    class="badge badge-primary badge-outline"
                  >
                    {{ studyDiagnostics.dueCount }} due for review
                  </span>
                  <span
                    v-if="studyDiagnostics && studyDiagnostics.retentionRate !== null"
                    class="badge badge-ghost"
                  >
                    {{ Math.round(studyDiagnostics.retentionRate * 100) }}% retention
                  </span>
                </div>

                <span class="text-8xl font-semibold leading-none">{{ currentCard.simplified }}</span>

                <button
                  v-if="studyPhase !== 'revealed'"
                  type="button"
                  class="btn btn-primary btn-lg"
                  @click="store.revealStudyCard()"
                >
                  Reveal
                </button>

                <div v-else class="w-full max-w-md space-y-3">
                  <div class="relative mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-base-300 bg-base-200/70 shadow-inner">
                    <img
                      v-if="store.illustrationUrl(currentCard.key)"
                      :src="store.illustrationUrl(currentCard.key) || ''"
                      :alt="`Study illustration for ${currentCard.meaning}`"
                      class="h-full w-full object-cover"
                    />
                    <span v-else class="text-5xl font-semibold leading-none opacity-60">{{ currentCard.simplified }}</span>
                  </div>
                  <p class="text-2xl font-bold tracking-wide">{{ currentCard.pinyin }}</p>
                  <p class="text-xl font-semibold">{{ currentCard.meaning }}</p>
                  <p v-if="currentCard.meanings.length > 1" class="text-sm leading-relaxed opacity-65">
                    {{ currentCard.meanings.slice(1).join(' · ') }}
                  </p>
                </div>
              </div>

              <MandarinVoiceCoach v-if="studyPhase === 'revealed'" :card="currentCard" />

              <section v-if="studyPhase === 'revealed'" class="border-t border-base-300 p-5 sm:p-7">
                <p class="mb-2 text-sm font-semibold">How well did you recall this?</p>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button type="button" class="btn btn-outline btn-error" @click="store.rateStudyCard('again')">Again</button>
                  <button type="button" class="btn btn-outline btn-warning" @click="store.rateStudyCard('hard')">Hard</button>
                  <button type="button" class="btn btn-outline btn-success" @click="store.rateStudyCard('good')">Good</button>
                  <button type="button" class="btn btn-outline btn-accent" @click="store.rateStudyCard('easy')">Easy</button>
                </div>
                <p class="mt-2 text-xs leading-relaxed opacity-55">
                  Ratings are saved and scheduled with a simple spaced-repetition model — you'll see this card again around when it's due.
                </p>
              </section>

              <section v-else class="border-t border-base-300 p-4 text-center">
                <button type="button" class="btn btn-ghost btn-sm" @click="store.nextCard()">Skip for now</button>
              </section>
            </article>

            <div v-else class="kr-panel-flat p-8 text-center opacity-65">
              This set has no cards yet.
            </div>
          </main>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import MandarinVoiceCoach from '@/components/mandarin/mandarin-voice-coach.vue'
import { useMandarinTutorStore } from '@/stores/mandarinTutorStore'
import type { MandarinComponentRole } from '@/utils/mandarin'

const store = useMandarinTutorStore()
const {
  cards,
  allSets,
  customSets,
  requestedCards,
  selectedSetId,
  selectedSet,
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
} = storeToRefs(store)

const newSetName = ref('')
const newSetNotice = ref('')
const renamingSetId = ref<string | null>(null)
const renameSetName = ref('')
const cardPanel = ref<HTMLElement | null>(null)
const selectedCustomSetId = computed(() =>
  selectedSetId.value.startsWith('custom:')
    ? selectedSetId.value.slice('custom:'.length)
    : null,
)
const currentRequested = computed(() =>
  currentCard.value ? store.requestedData(currentCard.value.key) : null,
)
const friendlyIllustrationStatus = computed(() => {
  const key = currentCard.value?.key
  if (!key || store.illustrationUrl(key)) return ''
  const status = store.illustrationStatus(key)
  if (status === 'GLYPH ONLY') return 'This card uses the character itself as its visual anchor.'
  if (status) return 'A study illustration is being prepared for this card.'
  return ''
})

async function scrollToCard() {
  await nextTick()
  cardPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function focusSearchCard(key: string) {
  store.focusCard(key)
  await scrollToCard()
}

function createSet() {
  const created = store.createCustomSet(newSetName.value)
  if (!created) return
  newSetName.value = ''
  newSetNotice.value = `Created “${created.name}”. Keep studying, then add useful cards from the card itself.`
}

function startRenameSelectedSet() {
  const id = selectedCustomSetId.value
  if (!id) return
  const set = customSets.value.find((candidate) => candidate.id === id)
  if (!set) return
  renamingSetId.value = id
  renameSetName.value = set.name
}

function saveRenamedSet() {
  const id = selectedCustomSetId.value
  if (!id || renamingSetId.value !== id) return
  if (!store.renameCustomSet(id, renameSetName.value)) return
  renamingSetId.value = null
  renameSetName.value = ''
}

function cancelRenameSet() {
  renamingSetId.value = null
  renameSetName.value = ''
}

async function requestCurrentWord() {
  const created = await store.requestWord(searchQuery.value)
  if (created) await scrollToCard()
}

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
