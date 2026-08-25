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
          </div>
        </div>
        <div class="rounded-2xl border border-base-300 bg-base-200/50 p-3 text-xs leading-relaxed opacity-80">
          Component roles are labeled separately from dictionary radicals. A radical is useful for indexing and pattern recognition, but it is not automatically the historical “meaning” of the whole character.
        </div>
      </header>

      <div v-if="store.error" class="alert alert-error text-sm" role="alert">
        <span>{{ store.error }}</span>
        <button class="btn btn-sm" type="button" @click="store.loadCatalog()">Retry</button>
      </div>

      <div v-if="loading && !initialized" class="flex min-h-64 items-center justify-center">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else>
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label class="form-control flex-1">
              <span class="label-text mb-1 font-semibold">Find a word, Hanzi, pinyin, or English meaning</span>
              <input
                v-model="searchQuery"
                class="input input-bordered w-full"
                placeholder="说, shuō, speak, casino…"
                autocomplete="off"
              />
            </label>
            <div class="flex gap-2">
              <input
                v-model="newSetName"
                class="input input-bordered min-w-0"
                placeholder="New custom set"
                @keyup.enter="createSet"
              />
              <button class="btn btn-outline" type="button" @click="createSet">
                Create set
              </button>
            </div>
          </div>

          <div v-if="searchQuery.trim()" class="mt-3">
            <div v-if="searchResults.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                v-for="card in searchResults"
                :key="card.key"
                type="button"
                class="rounded-xl border border-base-300 bg-base-200/40 p-3 text-left transition hover:border-accent hover:bg-base-200"
                @click="store.focusCard(card.key)"
              >
                <span class="text-2xl font-semibold">{{ card.simplified }}</span>
                <span class="ml-2 text-sm opacity-65">{{ card.pinyin }}</span>
                <span class="mt-1 block truncate text-xs opacity-70">{{ card.meaning }}</span>
              </button>
            </div>
            <p v-else class="mt-2 text-sm opacity-60">
              That term is not in the starter catalog yet. Free-form word creation is tracked separately so generated translations and etymology never masquerade as curated facts.
            </p>
          </div>
        </section>

        <div class="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside class="space-y-3 lg:sticky lg:top-4 lg:self-start">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
              <div class="mb-2 flex items-center justify-between gap-2">
                <h2 class="font-bold">Study sets</h2>
                <span class="badge badge-ghost">{{ selectedSet?.cardKeys.length ?? 0 }}</span>
              </div>
              <div class="max-h-[32rem] space-y-1 overflow-y-auto pr-1">
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
            </div>
          </aside>

          <main class="min-w-0 space-y-4">
            <div v-if="selectedSet" class="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span class="font-semibold">{{ selectedSet.label }}</span>
                <span class="ml-2 opacity-60">{{ selectedSet.description }}</span>
              </div>
              <button v-if="focusKey" type="button" class="btn btn-ghost btn-sm" @click="store.clearFocus()">
                Return to deck
              </button>
            </div>

            <article
              v-if="currentCard"
              class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl"
            >
              <div class="grid md:grid-cols-[minmax(16rem,0.9fr)_minmax(18rem,1.1fr)]">
                <div class="flex min-h-80 flex-col items-center justify-center gap-4 bg-base-200/70 p-6 text-center">
                  <div class="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-inner">
                    <img
                      v-if="store.illustrationUrl(currentCard.key)"
                      :src="store.illustrationUrl(currentCard.key) || ''"
                      :alt="`Generated study illustration for ${currentCard.meaning}`"
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
                  <button
                    type="button"
                    class="btn btn-accent"
                    :disabled="Boolean(store.audioLoadingKey)"
                    @click="store.speak(currentCard)"
                  >
                    <span
                      v-if="store.audioLoadingKey === currentCard.key"
                      class="loading loading-spinner loading-xs"
                    />
                    {{ store.audioLoadingKey === currentCard.key ? 'Preparing reference…' : 'Hear pronunciation' }}
                  </button>
                  <p v-if="store.speechError" class="text-xs text-error">{{ store.speechError }}</p>
                  <p v-else-if="!audioSupported" class="text-xs opacity-60">
                    This browser cannot play the reference audio.
                  </p>
                  <p v-else class="max-w-sm text-xs opacity-55">
                    The first play may create the shared reference clip; later plays reuse the same cached recording.
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

                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button type="button" class="btn btn-outline" @click="store.previousCard()">Previous</button>
                    <button type="button" class="btn btn-outline" @click="store.nextCard()">Next</button>
                    <button type="button" class="btn btn-outline" @click="store.toggleDetails()">
                      {{ detailsVisible ? 'Hide parts' : 'Parts & history' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline"
                      :disabled="Boolean(store.artQueueingKey || store.artRefreshingKey || store.illustrationUrl(currentCard.key))"
                      @click="artAction(currentCard)"
                    >
                      <span
                        v-if="store.artQueueingKey === currentCard.key || store.artRefreshingKey === currentCard.key"
                        class="loading loading-spinner loading-xs"
                      />
                      {{ artActionLabel(currentCard) }}
                    </button>
                  </div>
                  <p v-if="store.illustrationStatus(currentCard.key)" class="mt-2 text-right text-xs opacity-60">
                    Illustration: {{ store.illustrationStatus(currentCard.key) }}
                  </p>
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
                        class="rounded-2xl border border-base-300 bg-base-100 p-4"
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
                    <p v-if="currentCard.history" class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm leading-relaxed">
                      {{ currentCard.history }}
                    </p>
                    <p v-else class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm leading-relaxed opacity-65">
                      Historical development is pending a dedicated decomposition source. The current radical, when shown, is an indexing clue rather than an etymological claim.
                    </p>
                    <div class="text-xs opacity-55">
                      Source: {{ currentCard.source.label }} · {{ currentCard.source.version }}
                    </div>
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
                  <span v-if="!customSets.length" class="text-xs opacity-55">Create a custom set above to collect cards.</span>
                </div>
              </section>
            </article>

            <div v-else class="rounded-2xl border border-base-300 bg-base-100 p-8 text-center opacity-65">
              This set has no cards yet.
            </div>
          </main>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import MandarinVoiceCoach from '@/components/mandarin/mandarin-voice-coach.vue'
import { useMandarinTutorStore } from '@/stores/mandarinTutorStore'
import type { MandarinCard, MandarinComponentRole } from '@/utils/mandarin'

const store = useMandarinTutorStore()
const {
  cards,
  allSets,
  customSets,
  selectedSetId,
  selectedSet,
  currentCard,
  searchQuery,
  searchResults,
  focusKey,
  meaningVisible,
  detailsVisible,
  loading,
  initialized,
  audioSupported,
} = storeToRefs(store)

const newSetName = ref('')

function createSet() {
  const created = store.createCustomSet(newSetName.value)
  if (!created) return
  newSetName.value = ''
  store.selectSet(`custom:${created.id}`)
}

async function artAction(card: MandarinCard) {
  if (store.illustrationUrl(card.key)) return
  if (store.illustrationJobId(card.key)) {
    await store.refreshIllustration(card)
    return
  }
  await store.queueIllustration(card)
}

function artActionLabel(card: MandarinCard): string {
  if (store.illustrationUrl(card.key)) return 'Art ready'
  const jobId = store.illustrationJobId(card.key)
  return jobId ? `Refresh ArtJob #${jobId}` : 'Queue Krea 2 art'
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
