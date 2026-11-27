<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTarotStudioStore } from '~/stores/tarotStudioStore'
import { useUserStore } from '~/stores/userStore'
import { filterTarotCards } from '~/utils/tarotStudio'
import type { TarotCardEdit, TarotDeckEdit } from '~/types/tarotStudio'

const store = useTarotStudioStore()
const userStore = useUserStore()
const arcana = ref('all')
const suit = ref('all')
const rank = ref('all')
const checkpoint = ref('all')
const status = ref('all')
const query = ref('')
const editorOpen = ref(false)
const editorTab = ref<'card' | 'deck'>('card')
const newDeckOpen = ref(false)
const newDeckTitle = ref('')
const view = ref<'designs' | 'cards'>('designs')

function closeEditor() {
  editorOpen.value = false
  editorTab.value = 'card'
}

const emptyCard: TarotCardEdit = {
  title: '',
  prompt: '',
  checkpoint: null,
  loras: '',
  upright: '',
  reversed: '',
  notes: '',
  status: 'DRAFT',
}
const cardDraft = ref<TarotCardEdit>({ ...emptyCard })
const deckDraft = ref<TarotDeckEdit>({
  title: '',
  description: '',
  styleBible: '',
  defaultEngine: 'krea2',
  defaultCheckpoint: null,
  defaultLoras: '',
  backPrompt: '',
  isPublic: false,
})

const filteredCards = computed(() =>
  filterTarotCards(store.cards, {
    arcana: arcana.value,
    suit: suit.value,
    rank: rank.value,
    checkpoint: checkpoint.value,
    status: status.value,
    query: query.value,
  }),
)
const rankOptions = computed(() => [
  ...new Set(store.cards.map((card) => card.rank)),
])
const selected = computed(() => store.selectedCard)
const totalCards = computed(() => store.cards.length)
const reviewable = computed(
  () =>
    selected.value?.status === 'DRAFT' ||
    selected.value?.status === 'REVIEW' ||
    selected.value?.status === 'REJECTED',
)

watch(
  () => store.selectedCard,
  (card) => {
    if (!card) return
    cardDraft.value = {
      title: card.title,
      prompt: card.prompt,
      checkpoint: card.checkpoint,
      loras: card.loras,
      upright: card.upright,
      reversed: card.reversed,
      notes: card.notes,
      status: card.status,
    }
  },
  { immediate: true },
)
watch(
  () => store.activeDeck,
  (deck) => {
    if (!deck) return
    deckDraft.value = {
      title: deck.title,
      description: deck.description,
      styleBible: deck.styleBible,
      defaultEngine: deck.defaultEngine,
      defaultCheckpoint: deck.defaultCheckpoint,
      defaultLoras: deck.defaultLoras,
      backPrompt: deck.backPrompt,
      isPublic: deck.isPublic,
    }
  },
  { immediate: true },
)

function openCard(id: number) {
  store.selectCard(id)
  editorTab.value = 'card'
  editorOpen.value = true
}

function openDeck() {
  editorTab.value = 'deck'
  editorOpen.value = true
}

function changeDeck(slug: string) {
  store.selectDeck(slug)
  arcana.value = 'all'
  suit.value = 'all'
  rank.value = 'all'
  checkpoint.value = 'all'
  status.value = 'all'
  query.value = ''
  editorOpen.value = false
}

async function save() {
  if (editorTab.value === 'deck') {
    await store.saveDeck(deckDraft.value)
  } else if (selected.value) {
    await store.saveCard(selected.value.id, cardDraft.value)
  }
}

async function revise(designId: number) {
  const card = selected.value
  if (!card) return
  if (!(await store.saveCard(card.id, cardDraft.value))) return
  await store.requestArt('cards', { cardIds: [card.id], designId })
}

async function createDeck() {
  if (!newDeckTitle.value.trim()) return
  if (await store.createDeck(newDeckTitle.value)) {
    newDeckTitle.value = ''
    newDeckOpen.value = false
    editorTab.value = 'deck'
    editorOpen.value = true
  }
}

async function loadAndSync() {
  if (!(await store.load())) return
  if (store.openArtCount) {
    await store.syncArt(true)
    store.startAutoSync()
  }
}

watch(
  () => store.activeSlug,
  () => {
    if (store.openArtCount) store.startAutoSync()
  },
)

onMounted(() => {
  if (userStore.isAdmin) void loadAndSync()
})
onBeforeUnmount(() => store.stopAutoSync())
watch(
  () => userStore.isAdmin,
  (isAdmin) => {
    if (isAdmin && !store.decks.length) void loadAndSync()
  },
)
</script>

<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden bg-base-300"
    data-layout="console-fixed"
    data-testid="tarot-studio"
  >
    <header-page-bar>
      <div class="flex min-w-0 flex-wrap items-center gap-2 px-2 py-1">
        <strong class="mr-2 text-sm tracking-widest text-primary">
          ✦ TAROT STUDIO
        </strong>
        <span class="badge badge-outline badge-sm">Private art bible</span>
        <span class="badge badge-ghost badge-sm">
          {{ store.approvedCount }}/{{ totalCards }} approved
        </span>
        <span class="badge badge-ghost badge-sm">
          {{ store.renderedCount }} with art
        </span>
        <div class="join" role="tablist" aria-label="Studio view">
          <button
            class="btn join-item btn-xs"
            :class="view === 'designs' ? 'btn-primary' : 'btn-ghost'"
            type="button"
            role="tab"
            :aria-selected="view === 'designs'"
            @click="view = 'designs'"
          >
            Designs
          </button>
          <button
            class="btn join-item btn-xs"
            :class="view === 'cards' ? 'btn-primary' : 'btn-ghost'"
            type="button"
            role="tab"
            :aria-selected="view === 'cards'"
            @click="view = 'cards'"
          >
            Cards
          </button>
        </div>
        <nuxt-link to="/play/tarot" class="btn btn-ghost btn-xs">
          Reader ↗
        </nuxt-link>
        <button
          v-if="userStore.isAdmin && store.activeDeck"
          class="btn btn-ghost btn-xs ml-auto"
          type="button"
          :disabled="store.syncing"
          @click="store.syncArt()"
        >
          {{ store.syncing ? 'Syncing…' : '⟳ Sync art' }}
        </button>
        <button
          v-if="userStore.isAdmin"
          class="btn btn-ghost btn-xs"
          type="button"
          :disabled="store.loading"
          @click="store.load()"
        >
          {{ store.loading ? 'Loading…' : '↻ Refresh' }}
        </button>
      </div>
    </header-page-bar>

    <div
      v-if="!userStore.isAdmin"
      class="grid min-h-0 flex-1 place-content-center p-8 text-center"
    >
      <p class="font-bold">Administrator access required.</p>
    </div>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="deck in store.decks"
          :key="deck.slug"
          class="btn btn-sm"
          :class="
            deck.slug === store.activeSlug
              ? 'btn-primary'
              : 'btn-ghost border border-base-content/15'
          "
          type="button"
          :aria-pressed="deck.slug === store.activeSlug"
          @click="changeDeck(deck.slug)"
        >
          {{ deck.title }}
          <span class="opacity-60">{{ deck.Cards.length }}</span>
        </button>
        <button
          class="btn btn-sm btn-outline"
          type="button"
          @click="newDeckOpen = !newDeckOpen"
        >
          + New deck
        </button>
        <button
          v-if="store.activeDeck"
          class="btn btn-sm btn-ghost"
          type="button"
          @click="openDeck"
        >
          Deck bible &amp; back
        </button>
      </div>

      <form
        v-if="newDeckOpen"
        class="flex gap-2 rounded-xl border border-primary/30 bg-base-200 p-2"
        @submit.prevent="createDeck"
      >
        <input
          v-model="newDeckTitle"
          class="input input-sm min-w-0 flex-1"
          maxlength="200"
          aria-label="New deck title"
          placeholder="Another tarot universe"
        />
        <button class="btn btn-primary btn-sm" type="submit">Create 78</button>
      </form>

      <div
        v-if="store.error"
        class="alert alert-error py-2 text-xs"
        role="alert"
      >
        {{ store.error }}
      </div>
      <div
        v-if="store.notice"
        class="rounded-lg bg-success/15 px-3 py-2 text-xs text-success"
        role="status"
      >
        {{ store.notice }}
      </div>

      <tarot-design-board v-if="view === 'designs' && store.activeDeck" />

      <template v-if="view === 'cards'">
        <section
          class="flex flex-wrap items-center gap-2 rounded-xl border border-base-content/10 bg-base-200/75 p-2"
          aria-label="Filter tarot cards"
        >
          <input
            v-model="query"
            class="input input-bordered input-sm min-w-24 flex-1 sm:max-w-56"
            aria-label="Search tarot cards"
            placeholder="Search card…"
          />
          <select
            v-model="arcana"
            class="select select-bordered select-sm"
            aria-label="Arcana"
          >
            <option value="all">All arcana</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
          <select
            v-model="suit"
            class="select select-bordered select-sm"
            aria-label="Suit"
          >
            <option value="all">All suits</option>
            <option value="wands">Wands</option>
            <option value="cups">Cups</option>
            <option value="swords">Swords</option>
            <option value="pentacles">Pentacles</option>
          </select>
          <select
            v-model="rank"
            class="select select-bordered select-sm"
            aria-label="Rank"
          >
            <option value="all">All ranks</option>
            <option v-for="item in rankOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
          <select
            v-model="checkpoint"
            class="select select-bordered select-sm"
            aria-label="Checkpoint"
          >
            <option v-for="item in store.checkpoints" :key="item" :value="item">
              {{ item === 'default' ? 'Inherited checkpoint' : item }}
            </option>
          </select>
          <select
            v-model="status"
            class="select select-bordered select-sm"
            aria-label="Review status"
          >
            <option value="all">All stages</option>
            <option value="DRAFT">Draft</option>
            <option value="QUEUED">Queued</option>
            <option value="RENDERED">Rendered</option>
            <option value="REVIEW">Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <span class="ml-auto text-xs opacity-65" aria-live="polite">
            {{ filteredCards.length }} / {{ totalCards }} cards
          </span>
        </section>

        <div
          class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(320px,25%)]"
        >
          <section
            class="kr-scroll min-h-0 overflow-y-auto rounded-xl border border-base-content/10 bg-base-200/40 p-2 sm:p-3"
            aria-label="Tarot card gallery"
          >
            <p v-if="store.loading" class="p-5 text-center">
              Opening the deck vault…
            </p>
            <div
              v-else-if="!filteredCards.length"
              class="grid min-h-32 place-content-center text-sm opacity-60"
            >
              No cards match these filters.
            </div>
            <div
              v-else
              class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
            >
              <button
                v-for="card in filteredCards"
                :key="card.id"
                class="group min-w-0 overflow-hidden rounded-xl border-2 bg-base-300 text-left transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                :class="
                  selected?.id === card.id
                    ? 'border-primary'
                    : 'border-base-content/15'
                "
                type="button"
                :aria-label="`Edit ${card.title}`"
                :aria-pressed="selected?.id === card.id"
                @click="openCard(card.id)"
              >
                <div class="tarot-face relative aspect-[2/3] overflow-hidden">
                  <img
                    v-if="card.imageUrl"
                    :src="card.imageUrl"
                    :alt="`${card.title} illustration`"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="tarot-placeholder absolute inset-0 grid place-items-center p-3 text-center"
                    aria-hidden="true"
                  >
                    <div class="tarot-insignia">
                      {{ card.arcana === 'major' ? '✧' : '❖' }}
                    </div>
                    <span
                      class="absolute bottom-6 px-3 text-[10px] font-bold uppercase tracking-widest text-amber-100/80"
                    >
                      Art recipe ready
                    </span>
                  </div>
                  <span
                    class="absolute left-2 top-2 rounded bg-neutral/80 px-1.5 py-0.5 text-[10px] font-bold text-neutral-content"
                  >
                    {{
                      card.arcana === 'major'
                        ? card.rank
                        : card.rank.slice(0, 2)
                    }}
                  </span>
                  <span
                    class="absolute right-2 top-2 rounded bg-neutral/80 px-1.5 py-0.5 text-[10px] font-bold text-neutral-content"
                  >
                    {{ card.status }}
                  </span>
                </div>
                <div class="p-2">
                  <strong class="block truncate text-xs">{{
                    card.title
                  }}</strong>
                  <span class="block truncate text-[10px] opacity-55">
                    {{
                      card.checkpoint ||
                      store.activeDeck?.defaultCheckpoint ||
                      'Krea 2 default'
                    }}
                  </span>
                </div>
              </button>
            </div>
          </section>

          <aside
            v-if="store.activeDeck && (editorOpen || editorTab === 'deck')"
            class="kr-scroll fixed inset-0 z-50 overflow-y-auto bg-base-200 p-4 shadow-2xl lg:static lg:inset-auto lg:z-auto lg:min-h-0 lg:rounded-xl lg:border lg:border-base-content/10 lg:p-3"
            aria-label="Tarot art bible editor"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <h2 class="text-base font-black">
                {{ editorTab === 'deck' ? 'Deck art bible' : selected?.title }}
              </h2>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                aria-label="Close editor"
                @click="closeEditor"
              >
                ✕
              </button>
            </div>

            <form
              v-if="editorTab === 'deck'"
              class="space-y-3"
              @submit.prevent="save"
            >
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold">Deck title</span>
                <input
                  v-model="deckDraft.title"
                  class="input input-bordered input-sm w-full"
                  maxlength="200"
                  required
                />
              </label>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold">Description</span>
                <textarea
                  v-model="deckDraft.description"
                  class="textarea textarea-bordered w-full"
                  rows="2"
                  maxlength="2000"
                />
              </label>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold">Style bible</span>
                <textarea
                  v-model="deckDraft.styleBible"
                  class="textarea textarea-bordered w-full"
                  rows="7"
                  maxlength="30000"
                />
              </label>
              <div class="grid grid-cols-2 gap-2">
                <label class="form-control block text-xs">
                  <span class="mb-1 block font-bold">Engine</span>
                  <input
                    v-model="deckDraft.defaultEngine"
                    class="input input-bordered input-sm w-full"
                    maxlength="40"
                  />
                </label>
                <label class="form-control block text-xs">
                  <span class="mb-1 block font-bold">Checkpoint</span>
                  <input
                    v-model="deckDraft.defaultCheckpoint"
                    class="input input-bordered input-sm w-full"
                    maxlength="255"
                    placeholder="Engine default"
                  />
                </label>
              </div>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold"
                  >Default LoRAs (recipe only)</span
                >
                <textarea
                  v-model="deckDraft.defaultLoras"
                  class="textarea textarea-bordered w-full"
                  rows="2"
                  maxlength="4000"
                />
              </label>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold"
                  >Shared card-back prompt</span
                >
                <textarea
                  v-model="deckDraft.backPrompt"
                  class="textarea textarea-bordered w-full"
                  rows="4"
                  maxlength="12000"
                />
              </label>
              <label class="label cursor-pointer justify-start gap-2 text-xs">
                <input
                  v-model="deckDraft.isPublic"
                  type="checkbox"
                  class="toggle toggle-sm toggle-primary"
                />
                <span>
                  Show in the public reader (approved card art only)
                </span>
              </label>
              <p class="text-[11px] opacity-65">
                {{ store.activeDeck.printStatus }} · private · No store listing
                or print order
              </p>
              <button
                class="btn btn-primary w-full"
                :disabled="store.saving"
                type="submit"
              >
                {{ store.saving ? 'Saving…' : 'Save deck bible' }}
              </button>
            </form>

            <form v-else-if="selected" class="space-y-3" @submit.prevent="save">
              <div class="flex flex-wrap gap-1 text-[11px] opacity-70">
                <span class="badge badge-ghost badge-sm">{{
                  selected.arcana
                }}</span>
                <span class="badge badge-ghost badge-sm">{{
                  selected.suit || 'Major'
                }}</span>
                <span class="badge badge-ghost badge-sm"
                  >Rank {{ selected.rank }}</span
                >
                <span class="badge badge-ghost badge-sm"
                  >Oracle: {{ selected.oracleId }}</span
                >
              </div>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold">Card name</span>
                <input
                  v-model="cardDraft.title"
                  class="input input-bordered input-sm w-full"
                  maxlength="120"
                  required
                />
              </label>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold">Art prompt</span>
                <textarea
                  v-model="cardDraft.prompt"
                  class="textarea textarea-bordered w-full font-mono text-xs"
                  rows="7"
                  maxlength="12000"
                />
              </label>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold">Checkpoint override</span>
                <input
                  v-model="cardDraft.checkpoint"
                  class="input input-bordered input-sm w-full"
                  maxlength="255"
                  :placeholder="
                    store.activeDeck.defaultCheckpoint || 'Inherit deck default'
                  "
                />
              </label>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold"
                  >LoRA overrides (one per line)</span
                >
                <textarea
                  v-model="cardDraft.loras"
                  class="textarea textarea-bordered w-full font-mono text-xs"
                  rows="2"
                  maxlength="4000"
                />
              </label>
              <tarot-card-art-panel :card="selected" @revise="revise" />
              <div class="grid grid-cols-2 gap-2">
                <label class="form-control block text-xs">
                  <span class="mb-1 block font-bold">Upright reading</span>
                  <textarea
                    v-model="cardDraft.upright"
                    class="textarea textarea-bordered w-full"
                    rows="3"
                    maxlength="4000"
                  />
                </label>
                <label class="form-control block text-xs">
                  <span class="mb-1 block font-bold">Reversed reading</span>
                  <textarea
                    v-model="cardDraft.reversed"
                    class="textarea textarea-bordered w-full"
                    rows="3"
                    maxlength="4000"
                  />
                </label>
              </div>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold"
                  >Art direction / review notes</span
                >
                <textarea
                  v-model="cardDraft.notes"
                  class="textarea textarea-bordered w-full"
                  rows="3"
                  maxlength="16000"
                />
              </label>
              <label class="form-control block text-xs">
                <span class="mb-1 block font-bold">Review stage</span>
                <select
                  v-model="cardDraft.status"
                  class="select select-bordered select-sm w-full"
                  :disabled="!reviewable"
                >
                  <option v-if="!reviewable" :value="selected.status">
                    {{ selected.status }} (system-managed)
                  </option>
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review requested</option>
                  <option value="REJECTED">Needs revision</option>
                </select>
              </label>
              <p class="text-[11px] opacity-65">
                Saving a prompt does not render art. Submit a revision to queue
                an ArtJob; renders appear as variants once delivered.
              </p>
              <button
                class="btn btn-primary w-full"
                :disabled="store.saving"
                type="submit"
              >
                {{ store.saving ? 'Saving…' : 'Save card recipe' }}
              </button>
            </form>
          </aside>

          <aside
            v-else
            class="hidden min-h-0 place-content-center rounded-xl border border-dashed border-primary/30 p-6 text-center lg:grid"
          >
            <span class="text-4xl text-primary">✦</span>
            <p class="mt-3 text-sm font-bold">
              Choose a card to edit its recipe
            </p>
            <p class="text-xs opacity-60">
              Or open the deck bible for global defaults.
            </p>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.tarot-face {
  background: #16112e;
}

.tarot-placeholder {
  background:
    radial-gradient(ellipse at 52% 37%, #ad6dbe65, transparent 40%),
    repeating-conic-gradient(
      from 45deg at 50% 50%,
      #e6b76b0c 0 12deg,
      transparent 12deg 24deg
    ),
    linear-gradient(155deg, #34234e, #151027 65%, #112b3a);
  box-shadow:
    inset 0 0 0 5px #aa8d4f55,
    inset 0 0 0 8px #141026;
}

.tarot-insignia {
  color: #e9bd72;
  font-size: clamp(3rem, 5vw, 6rem);
  text-shadow: 0 0 26px #f8b45c70;
}
</style>
