<!-- /components/storybook/storybook-table.vue -->
<!--
  THE TABLE. One open surface where a story is dealt, not a four-step form.

  Silas, 2026-09-09, rejecting the setup screen this replaces: "too
  text-and-button driven ... one open selection surface ... tarot-deck/tableau
  feeling." And 2026-09-12, on where the line falls: "All selections before the
  story begins should be card hand based" -- clarified as "that doesn't count
  reasonable settings, start story, etc. I just meant all the flavor bits,
  including mode select, narrator, etc."

  So the board holds CARDS for every creative choice (mode, genre, place, hero,
  company, narrator, thread, treasures) and the settings row holds ORDINARY
  CONTROLS for the title, the spark and the length dial. Round 1 of the mockups
  failed by keeping the form and adding cards underneath it; the board and the
  hand are the page.

  Silas, 2026-09-13: "we just want things functional at this point. we can
  tweak what it looks like afterwards." This screen is built for that -- it
  works against the shipped engine end to end, and the visual pass comes after.

  THE HAND IS IN THIS PAGE, not the global workspace hand. Taking that over
  needs stores/helpers/modelCards.ts decks to carry live entity art, which they
  do not; it buys nothing functional and is filed as its own polish task.
-->
<template>
  <!--
    THREE BANDS, and the order is the point (storybook/t-010, 2026-09-13).
    Silas: configuration "should really be at the very top", the cards "should
    appear as a horizontal row at the very bottom of the screen", and the
    tableau between them should evoke "laying out cards on a velvet tablecloth
    to tell a story like a tarot reading, with different rows and columns."

    The middle band is the ONLY scroll region (verifyLayoutContract one-scroll);
    the bar and the hand are fixed ends of the same flex column.
  -->
  <section class="flex size-full min-h-0 flex-col gap-2">
    <!-- BAND 1: configuration and the two commands -->
    <header
      class="shrink-0 rounded-2xl border border-base-300 bg-(--kr-surface-raised) p-2 shadow-sm"
    >
      <div class="flex flex-wrap items-end gap-2">
        <label class="form-control min-w-0 flex-1 basis-40">
          <span class="kr-text-eyebrow mb-0.5">Working title</span>
          <input
            v-model="title"
            type="text"
            class="input input-sm input-bordered"
            placeholder="Optional"
          />
        </label>

        <label class="form-control min-w-0 flex-[2] basis-56">
          <span class="kr-text-eyebrow mb-0.5">
            {{ isTaskmaster ? 'Objective' : 'Spark' }}
          </span>
          <input
            v-model="spark"
            type="text"
            class="input input-sm input-bordered"
            :placeholder="
              isTaskmaster
                ? 'What are you actually trying to get done?'
                : 'Optional — the narrator will invent one'
            "
          />
        </label>

        <label class="form-control min-w-0 basis-40">
          <span class="kr-text-eyebrow mb-0.5">Length</span>
          <select
            v-model.number="turnBudget"
            class="select select-sm select-bordered"
          >
            <option v-if="isEndlessChoice" :value="-1">Endless</option>
            <option :value="0">Deck default</option>
            <option
              v-for="preset in lengthPresets"
              :key="preset.value"
              :value="preset.value"
            >
              {{ preset.label }} — {{ preset.hint }}
            </option>
          </select>
        </label>

        <label
          v-if="placed('narrator').length"
          class="form-control min-w-0 basis-36"
        >
          <span class="kr-text-eyebrow mb-0.5">Delivery</span>
          <select
            v-model="narratorStyle"
            class="select select-sm select-bordered"
          >
            <option
              v-for="delivery in deliveries"
              :key="delivery.value"
              :value="delivery.value"
            >
              {{ delivery.label }}
            </option>
          </select>
        </label>

        <div class="ml-auto flex items-center gap-1">
          <!-- One word and an icon, so it survives a phone (Silas, 2026-09-13). -->
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl border border-base-300"
            :aria-expanded="chronicleOpen"
            @click="chronicleOpen = !chronicleOpen"
          >
            <Icon name="kind-icon:bookshelf" class="kr-icon-4" />
            <span>Chronicle</span>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-ghost rounded-xl border border-base-300"
            @click="clearTable"
          >
            Clear
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="!readyToOpen || runStore.isOpening"
            @click="openStory"
          >
            <span
              v-if="runStore.isOpening"
              class="loading loading-spinner loading-xs"
            />
            Open this story
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="kr-text-dim-xs mt-1 text-error">
        {{ errorMessage }}
      </p>
    </header>

    <!-- BAND 2: the cloth. The page's one scroll region. -->
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div v-if="chronicleOpen" class="mb-2">
        <StorybookCollection @open="openAdventure" />
      </div>

      <div class="kr-table-felt space-y-3" data-testid="storybook-board">
        <div v-for="row in slotRows" :key="row.title">
          <p class="kr-text-eyebrow mb-1 opacity-70">{{ row.title }}</p>
          <div
            class="mx-auto grid w-full gap-3"
            :class="
              row.specs.length === 2
                ? 'max-w-xl grid-cols-2'
                : 'max-w-3xl grid-cols-3'
            "
          >
            <button
              v-for="spec in row.specs"
              :key="spec.key"
              type="button"
              class="group w-full max-w-[9rem] justify-self-center rounded-2xl border-2 bg-base-100/70 p-1.5 text-left transition"
              :class="[
                spec.key === activeSlot
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300/70 hover:border-primary/50',
                placed(spec.key).length ? 'kr-table-slot-filled' : '',
              ]"
              :aria-pressed="spec.key === activeSlot"
              @click="activeSlot = spec.key"
            >
              <span class="mb-1 flex items-center gap-1">
                <Icon :name="spec.icon" class="kr-icon-4 text-primary" />
                <span class="kr-text-semibold-sm truncate">
                  {{ labelFor(spec) }}
                </span>
                <span
                  v-if="spec.required || requiredInMode(spec.key)"
                  class="kr-text-dim-xs"
                  >*</span
                >
              </span>

              <span
                class="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border bg-base-200/60"
                :class="
                  placed(spec.key).length
                    ? 'border-primary/40'
                    : 'border-dashed border-base-300'
                "
              >
                <template v-if="placed(spec.key).length">
                  <img
                    v-if="artFor(placed(spec.key)[0])"
                    :src="artFor(placed(spec.key)[0]) || undefined"
                    :alt="placed(spec.key)[0]?.title || spec.label"
                    class="kr-img-cover absolute inset-0"
                  />
                  <Icon
                    v-else
                    :name="placed(spec.key)[0]?.icon || spec.icon"
                    class="kr-icon-8 text-primary/70"
                  />
                  <span
                    class="absolute inset-x-0 bottom-0 bg-base-100/85 px-1 py-0.5 text-center kr-text-semibold-sm"
                  >
                    {{ placed(spec.key)[0]?.title }}
                  </span>
                  <span
                    v-if="placed(spec.key).length > 1"
                    class="absolute left-1 top-1 rounded-full bg-primary px-1.5 text-primary-content kr-text-dim-xs"
                  >
                    +{{ placed(spec.key).length - 1 }}
                  </span>
                  <span
                    class="absolute right-1 top-1 rounded-full bg-base-100/90 px-1 kr-text-dim-xs"
                    role="button"
                    tabindex="0"
                    aria-label="Take this card back"
                    @click.stop="clearSlot(spec.key)"
                    @keydown.enter.stop.prevent="clearSlot(spec.key)"
                  >
                    ×
                  </span>
                </template>
                <span v-else class="kr-text-dim-xs px-1 text-center">
                  {{ hintFor(spec) }}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- BAND 3: the hand, on the floor -->
    <div
      class="shrink-0 rounded-2xl border border-base-300 bg-(--kr-surface-raised) p-2 shadow-sm"
      data-testid="storybook-hand"
    >
      <div class="mb-1 flex flex-wrap items-center gap-2">
        <span class="kr-text-semibold-sm">
          {{ activeSpec.label }}
          <span class="kr-text-dim-xs">
            · {{ placed(activeSlot).length }} of {{ activeSpec.capacity }}
          </span>
        </span>
        <input
          v-model="search"
          type="search"
          :placeholder="`Search ${activeSpec.label.toLowerCase()}`"
          class="input input-xs input-bordered ml-auto w-32 sm:w-48"
        />
      </div>

      <p v-if="!activeDeck.length" class="kr-text-dim-xs py-4 text-center">
        Nothing to deal here yet.
      </p>
      <div v-else class="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
        <div
          v-for="card in activeDeck"
          :key="card.slug"
          class="w-[9.5rem] shrink-0 snap-start"
        >
          <NarrativeIngredientCard
            :item="card"
            :selected="isPlaced(activeSlot, card.slug)"
            @select="toggleCard(activeSlot, card)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/characterStore'
import { useProjectStore } from '@/stores/projectStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import {
  useStorybookRunStore,
  type StorybookBoard,
  type StorybookBoardSlugs,
  type StorybookRunMode,
} from '@/stores/storybookRunStore'
import { performFetch } from '@/stores/utils'
import {
  LENGTH_PRESETS,
  MODE_CARDS,
  NARRATOR_DELIVERIES,
  STORYBOOK_SLOTS,
  STORYBOOK_SLOT_ROWS,
  STORYBOOK_SLOT_SPECS,
  isGenreFacet,
  type StorybookSlotSpec,
  isPlaceDream,
  toGenreCard,
  toHeroCard,
  toNarratorCard,
  toPlaceCard,
  toThreadCard,
  toTreasureCard,
  type NarratorLike,
  type StorybookSlot,
} from '@/utils/storybookTableDecks'
import {
  narrativeIngredientArtwork,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'

const emit = defineEmits<{ opened: [runId: number]; resume: [runId: number] }>()

const route = useRoute()
const router = useRouter()
const runStore = useStorybookRunStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const projectStore = useProjectStore()

const slotSpecs = STORYBOOK_SLOT_SPECS
const lengthPresets = LENGTH_PRESETS
const deliveries = NARRATOR_DELIVERIES

const activeSlot = ref<StorybookSlot>('genre')
const chronicleOpen = ref(false)
const search = ref('')
const title = ref('')
const spark = ref('')
const narratorStyle = ref<string>('storybook')
/** 0 = the deck's default, -1 = endless. Anything else is a turn count. */
const turnBudget = ref(0)
const errorMessage = ref('')
const narrators = ref<NarratorLike[]>([])

const board = ref<Record<StorybookSlot, NarrativeIngredientOption[]>>({
  mode: [MODE_CARDS[0] as NarrativeIngredientOption],
  genre: [],
  place: [],
  hero: [],
  company: [],
  narrator: [],
  thread: [],
  treasures: [],
})

/**
 * The reader's conductor-backed projects, as Thread cards for taskmaster mode.
 *
 * Only projects carrying a conductorSlug: that slug is what the server deals
 * checkpoints from, so a Kind Robots project with no Conductor side would put
 * an objective on the board with nothing behind it.
 */
const projectCards = computed<NarrativeIngredientOption[]>(() =>
  projectStore.projects
    .filter((project) => project.conductorSlug)
    .map((project) => ({
      id: project.id,
      slug: project.conductorSlug as string,
      title: project.title || `Project ${project.id}`,
      description: project.description,
      imagePath: project.imagePath,
      icon: 'kind-icon:gearhammer',
      badge: 'Your project',
    })),
)

/** The spread, resolved to real slot specs so the template stays declarative. */
const slotRows = computed(() =>
  STORYBOOK_SLOT_ROWS.map((row) => ({
    title: row.title,
    specs: row.slots
      .map((slot) => slotSpecs.find((spec) => spec.key === slot))
      .filter((spec): spec is StorybookSlotSpec => Boolean(spec)),
  })),
)

const activeSpec = computed(
  () =>
    slotSpecs.find((spec) => spec.key === activeSlot.value) || slotSpecs[0]!,
)

const mode = computed<StorybookRunMode>(
  () => (board.value.mode[0]?.slug as StorybookRunMode) || 'open-ended',
)
const isTaskmaster = computed(() => mode.value === 'taskmaster')
const isEndlessChoice = computed(() => mode.value === 'open-ended')

/**
 * The Thread slot changes job in taskmaster mode -- it is the project the real
 * work is dealt from, and it stops being optional. Renaming the well rather
 * than adding a ninth slot keeps the board the same board in every mode, which
 * is the point of absorbing Taskmaster instead of porting it.
 */
function labelFor(spec: StorybookSlotSpec): string {
  if (spec.key === 'thread' && isTaskmaster.value) return 'Project'
  return spec.label
}

function hintFor(spec: StorybookSlotSpec): string {
  if (spec.key === 'thread' && isTaskmaster.value) {
    return 'Whose real work this quest is'
  }
  return spec.hint
}

function requiredInMode(slot: StorybookSlot): boolean {
  return slot === 'thread' && isTaskmaster.value
}

function placed(slot: StorybookSlot): NarrativeIngredientOption[] {
  return board.value[slot]
}

function isPlaced(slot: StorybookSlot, slug: string): boolean {
  return board.value[slot].some((card) => card.slug === slug)
}

function artFor(card?: NarrativeIngredientOption): string | null {
  return card ? narrativeIngredientArtwork(card) : null
}

/**
 * Play a card into the active slot, or take it back off.
 *
 * A full one-card slot SWAPS rather than refusing: tapping a second hero
 * obviously means "that one instead", and making the reader clear the slot
 * first is the kind of friction the old four-step setup was made of.
 */
function toggleCard(slot: StorybookSlot, card: NarrativeIngredientOption) {
  // Belt and suspenders: the card button is already disabled while locked,
  // but toggleCard is also reachable from a keyboard/testing path that
  // bypasses the DOM disabled state.
  if (card.locked) return
  const spec = slotSpecs.find((entry) => entry.key === slot)!
  const current = board.value[slot]
  const already = current.findIndex((entry) => entry.slug === card.slug)
  if (already >= 0) {
    board.value[slot] = current.filter((_, index) => index !== already)
    return
  }
  board.value[slot] =
    spec.capacity === 1 ? [card] : [...current, card].slice(-spec.capacity)
}

/** Take every card back off a slot. The × on a laid card. */
function clearSlot(slot: StorybookSlot): void {
  board.value[slot] = []
  activeSlot.value = slot
}

function matches(card: NarrativeIngredientOption): boolean {
  const term = search.value.trim().toLowerCase()
  if (!term) return true
  return `${card.title} ${card.description || ''}`.toLowerCase().includes(term)
}

/**
 * Gating (storybook/t-038): a genre card is locked when its deck (key
 * `genre-{slug}`) reports `unlocked: false`; a hero/company card is locked
 * when its slug appears in the gated-character list as unlocked: false. An
 * ungated card is absent from both lookups and stays exactly as it was.
 */
const genreDeckBySlug = computed(() => {
  const map = new Map<string, (typeof runStore.decks)[number]>()
  for (const deck of runStore.decks) {
    if (deck.key.startsWith('genre-')) {
      map.set(deck.key.slice('genre-'.length), deck)
    }
  }
  return map
})

const gatedCharacterBySlug = computed(() => {
  const map = new Map<string, (typeof runStore.gatedCharacters)[number]>()
  for (const character of runStore.gatedCharacters) {
    map.set(character.slug, character)
  }
  return map
})

function withGenreLock(
  card: NarrativeIngredientOption,
): NarrativeIngredientOption {
  const deck = genreDeckBySlug.value.get(card.slug)
  if (!deck || deck.unlocked !== false) return card
  return { ...card, locked: true, unlockHint: deck.unlockHint }
}

function withCharacterLock(
  card: NarrativeIngredientOption,
): NarrativeIngredientOption {
  const gated = gatedCharacterBySlug.value.get(card.slug)
  if (!gated || gated.unlocked) return card
  return { ...card, locked: true, unlockHint: gated.unlockHint }
}

const activeDeck = computed<NarrativeIngredientOption[]>(() => {
  const deck = (() => {
    switch (activeSlot.value) {
      case 'mode':
        return MODE_CARDS as NarrativeIngredientOption[]
      case 'genre':
        return facetStore.activeFacets
          .filter(isGenreFacet)
          .map(toGenreCard)
          .map(withGenreLock)
      case 'place':
        return dreamStore.dreams.filter(isPlaceDream).map(toPlaceCard)
      case 'hero':
      case 'company':
        return characterStore.browseCharacters
          .map(toHeroCard)
          .map(withCharacterLock)
      case 'narrator':
        return narrators.value.map(toNarratorCard)
      case 'thread':
        // In taskmaster mode the Thread slot is where the real work comes
        // from, so it deals the reader's own projects instead of Scenarios
        // (storybook/t-046). Silas chose that scope on 2026-09-13: one
        // project's work, because a quest that sweeps up every loose to-do
        // stops having an objective.
        return isTaskmaster.value
          ? projectCards.value
          : scenarioStore.scenarios
              .filter((scenario) => scenario.slug)
              .map(toThreadCard)
      case 'treasures':
        return rewardStore.rewards
          .filter((reward) => reward.isActive && reward.slug)
          .map(toTreasureCard)
      default:
        return []
    }
  })()
  return deck.filter(matches)
})

const readyToOpen = computed(() =>
  slotSpecs
    .filter((spec) => spec.required)
    .every((spec) => board.value[spec.key].length > 0),
)

function clearTable() {
  board.value = {
    mode: [MODE_CARDS[0] as NarrativeIngredientOption],
    genre: [],
    place: [],
    hero: [],
    company: [],
    narrator: [],
    thread: [],
    treasures: [],
  }
  title.value = ''
  spark.value = ''
  turnBudget.value = 0
  errorMessage.value = ''
  activeSlot.value = 'genre'
}

async function openStory() {
  errorMessage.value = ''
  const hero = board.value.hero[0]
  if (!hero) return

  // Said here rather than let the server say it: a taskmaster quest with no
  // objective is a story with nothing to serve, and one with no project has no
  // real work in it.
  if (isTaskmaster.value && !spark.value.trim()) {
    errorMessage.value =
      'A taskmaster quest needs an objective: say what you are trying to get done.'
    return
  }
  if (isTaskmaster.value && !board.value.thread[0]) {
    errorMessage.value =
      'Deal a project into the Thread slot — that is where the real work comes from.'
    return
  }

  const payload: StorybookBoard = {
    mode: mode.value,
    // The Genre card IS the deck: a genre facet's slug is its deck key.
    deckKey: isTaskmaster.value
      ? 'taskmaster'
      : `genre-${board.value.genre[0]?.slug}`,
    title: title.value.trim() || null,
    spark: spark.value.trim() || null,
    narratorStyle: narratorStyle.value,
    botId: board.value.narrator[0]?.id
      ? Number(board.value.narrator[0]!.id)
      : null,
    castSlugs: [hero.slug, ...board.value.company.map((card) => card.slug)],
    locationSlug: board.value.place[0]?.slug ?? null,
    facetSlugs: board.value.genre.map((card) => card.slug),
    // The Thread card is a project in taskmaster mode and a Scenario in every
    // other, so it goes into a different field depending on which.
    projectSlug: isTaskmaster.value
      ? (board.value.thread[0]?.slug ?? null)
      : null,
    scenarioSlug: isTaskmaster.value
      ? null
      : (board.value.thread[0]?.slug ?? null),
    rewardSlugs: board.value.treasures.map((card) => card.slug),
  }

  // 0 means "whatever the deck says", so it is omitted rather than sent as a
  // number; -1 is the reader asking for an endless run, which is an explicit
  // null on the wire.
  if (turnBudget.value === -1) payload.turnBudget = null
  else if (turnBudget.value > 0) payload.turnBudget = turnBudget.value

  // Captured here, at the moment the story actually opens, because by the
  // time playAgain() runs this Table has long since unmounted (storybook/
  // t-060) -- the store is what carries it forward, not this component.
  const boardSlugs: StorybookBoardSlugs = {
    mode: board.value.mode.map((card) => card.slug),
    genre: board.value.genre.map((card) => card.slug),
    place: board.value.place.map((card) => card.slug),
    hero: board.value.hero.map((card) => card.slug),
    company: board.value.company.map((card) => card.slug),
    narrator: board.value.narrator.map((card) => card.slug),
    thread: board.value.thread.map((card) => card.slug),
    treasures: board.value.treasures.map((card) => card.slug),
  }

  chronicleOpen.value = false
  const opened = await runStore.openStory(payload, boardSlugs)
  if (!opened) {
    errorMessage.value = runStore.errorMessage || 'That story would not open.'
    return
  }
  if (runStore.run) emit('opened', runStore.run.id)
}

/** Reopening an adventure from the Chronicle is the parent's job. */
function openAdventure(runId: number): void {
  chronicleOpen.value = false
  emit('resume', runId)
}

/*
 * ARRIVING WITH AN INGREDIENT ALREADY CHOSEN.
 *
 * storybook/t-055: dream-narration.vue, reward-encounter.vue and
 * facet-profile.vue each link here with `?location=`/`?reward=`/`?facet=`,
 * expecting the same seeding the legacy storybook-page.vue's own
 * seedFromQuery() used to give them. Rebuilt on the same cardForSlug()/
 * playCardIfAbsent() pair seedFromPlayAgain() uses (storybook/t-060,
 * storybook/t-061) instead of five hand-rolled per-slot lookups: each query
 * key maps to a slot, cardForSlug() resolves the slug to a real card (or
 * null when it doesn't exist or -- for genre/hero -- is gated, t-038), and
 * playCardIfAbsent() plays it without re-toggling an already-placed card.
 * The Thread slot only reads `?scenario=` outside taskmaster mode, matching
 * that slot's own dual meaning (project vs. scenario) elsewhere in this
 * file. The query is cleared immediately so a reload, bookmark or share does
 * not silently re-seed after the reader removes the card.
 */
function seedFromQuery(): void {
  const single = (value: unknown): string | null => {
    const raw = Array.isArray(value) ? value[0] : value
    return typeof raw === 'string' && raw ? raw : null
  }

  const querySeeds: Array<[StorybookSlot, string | null]> = [
    ['place', single(route.query.location)],
    ['hero', single(route.query.character)],
    ['genre', single(route.query.facet)],
    ['treasures', single(route.query.reward)],
    ['thread', isTaskmaster.value ? null : single(route.query.scenario)],
  ]

  for (const [slot, slug] of querySeeds) {
    if (!slug) continue
    const card = cardForSlug(slot, slug)
    if (card) playCardIfAbsent(slot, card)
  }

  const consumed = ['scenario', 'location', 'character', 'facet', 'reward']
  if (!consumed.some((key) => route.query[key])) return
  const query = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => !consumed.includes(key)),
  )
  void router.replace({ query })
}

/**
 * The same per-slot deck lookup seedFromQuery() uses above, generalized to
 * any slot/slug pair so it can also serve a whole retained board rather
 * than one query value at a time (storybook/t-060).
 */
function cardForSlug(
  slot: StorybookSlot,
  slug: string,
): NarrativeIngredientOption | null {
  switch (slot) {
    case 'mode':
      return (
        (MODE_CARDS as NarrativeIngredientOption[]).find(
          (card) => card.slug === slug,
        ) ?? null
      )
    case 'genre': {
      const facet = facetStore.activeFacets
        .filter(isGenreFacet)
        .find((entry) => entry.slug === slug)
      if (!facet) return null
      const card = withGenreLock(toGenreCard(facet))
      return card.locked ? null : card
    }
    case 'place': {
      const dream = dreamStore.dreams
        .filter(isPlaceDream)
        .find((entry) => entry.slug === slug)
      return dream ? toPlaceCard(dream) : null
    }
    case 'hero':
    case 'company': {
      const character = characterStore.browseCharacters.find(
        (entry) => entry.slug === slug,
      )
      if (!character) return null
      const card = withCharacterLock(toHeroCard(character))
      return card.locked ? null : card
    }
    case 'narrator': {
      const narrator = narrators.value.find((entry) => entry.slug === slug)
      return narrator ? toNarratorCard(narrator) : null
    }
    case 'thread': {
      const pool = isTaskmaster.value
        ? projectCards.value
        : scenarioStore.scenarios
            .filter((entry) => entry.slug)
            .map(toThreadCard)
      return pool.find((entry) => entry.slug === slug) ?? null
    }
    case 'treasures': {
      const reward = rewardStore.rewards
        .filter((entry) => entry.isActive && entry.slug)
        .find((entry) => entry.slug === slug)
      return reward ? toTreasureCard(reward) : null
    }
    default:
      return null
  }
}

/**
 * Play a resolved card into its slot unless it is already there. Seeding
 * must never TOGGLE an already-placed card off -- the 'mode' slot starts
 * with MODE_CARDS[0] already played, so a blind toggleCard() call there
 * would deselect it instead of confirming it.
 */
function playCardIfAbsent(
  slot: StorybookSlot,
  card: NarrativeIngredientOption,
): void {
  if (isPlaced(slot, card.slug)) return
  toggleCard(slot, card)
}

/**
 * Re-deal the board "Play Again" retained (storybook/t-060). One-shot: the
 * store hands the snapshot over exactly once, so an ordinary visit or a
 * "start over" never re-seeds a stale board. A slug that no longer resolves
 * (or now resolves locked) simply stays off the board, same as any other
 * seed path here.
 */
function seedFromPlayAgain(): void {
  const snapshot = runStore.consumePlayAgainBoard()
  if (!snapshot) return
  for (const slot of STORYBOOK_SLOTS) {
    for (const slug of snapshot[slot]) {
      const card = cardForSlug(slot, slug)
      if (card) playCardIfAbsent(slot, card)
    }
  }
}

onMounted(async () => {
  // allSettled, not all: one slow or failing deck must not leave the whole
  // table empty. A board missing its treasures still opens a story.
  await Promise.allSettled([
    projectStore.fetchProjects(),
    characterStore.initialize(),
    dreamStore.initialize(),
    facetStore.fetchFacets(),
    rewardStore.initialize(),
    scenarioStore.initialize(),
    // Gating (storybook/t-038): both are empty/absent whenever nothing is
    // gated, so this costs two small requests, not two round-trips of
    // waiting on real content.
    runStore.fetchDecks(),
    runStore.fetchGatedCharacters(),
    // In the same batch, not fetched afterward, so a retained narrator slug
    // has a deck to resolve against by the time seedFromPlayAgain() runs
    // (storybook/t-060) -- seedFromQuery() never seeded narrator, so this
    // was previously moot.
    performFetch<NarratorLike[]>('/api/narrators').then((response) => {
      if (response.success && response.data) narrators.value = response.data
    }),
  ])
  // After the decks are loaded, so a deep-linked or retained card can
  // actually be found in them (storybook/t-055, t-060).
  seedFromPlayAgain()
  seedFromQuery()
})
</script>
