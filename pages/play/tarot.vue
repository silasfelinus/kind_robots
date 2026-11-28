<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  TAROT_COLLECTION,
  useTarotReaderStore,
  type AutoReadingId,
} from '~/stores/tarotReaderStore'
import { useCollectibleStore } from '~/stores/collectibleStore'
import { useUserStore } from '~/stores/userStore'
import { ORACLE_CARD_BY_ID } from '~/utils/oracle/content'
import {
  aspectReading,
  balanceReading,
  birthCards,
  chartRulerReading,
  dailyHoroscope,
  moonPhaseReading,
  placementReading,
} from '~/utils/astrology/interpret'
import {
  CHART_POINTS,
  ELEMENT_NOTES,
  formatDegree,
  moonPhaseFor,
  signById,
} from '~/utils/astrology/zodiac'

useHead({ title: 'Kind Tarot · Readings, horoscope and birth chart' })

type ReaderView =
  | 'readings'
  | 'horoscope'
  | 'chart'
  | 'deck'
  | 'collection'
  | 'circle'
  | 'achievements'
  | 'settings'

const store = useTarotReaderStore()
const userStore = useUserStore()
const collectibles = useCollectibleStore()
const view = ref<ReaderView>('readings')
const chartPane = ref<'placements' | 'aspects' | 'balance'>('placements')
const formOpen = ref(false)
const deckFocus = ref<string | null>(null)
const birthForm = ref<{
  edit: (id: string) => void
  startNew: () => void
} | null>(null)
let clock: ReturnType<typeof setInterval> | null = null

const VIEWS: Array<{ id: ReaderView; label: string }> = [
  { id: 'readings', label: 'Readings' },
  { id: 'horoscope', label: 'Horoscope' },
  { id: 'chart', label: 'Chart' },
  { id: 'deck', label: 'Deck' },
  { id: 'collection', label: 'Collection' },
  { id: 'circle', label: 'Circle' },
]

const reading = computed(() => store.activeReading)

const moonToday = computed(() => {
  const moon = store.transits?.sky.find((point) => point.id === 'moon')
  const sun = store.transits?.sky.find((point) => point.id === 'sun')
  if (!moon || !sun) return null
  return {
    sign: signById(moon.sign),
    phase: moonPhaseFor(moon.longitude - sun.longitude),
  }
})

const horoscope = computed(() => {
  if (!store.natalChart || !store.transits) return null
  return dailyHoroscope(
    store.natalChart,
    store.transits.sky,
    store.transits.hits,
  )
})

const personalCards = computed(() => {
  if (!store.natalChart) return []
  const cards = birthCards(store.natalChart)
  if (store.moonCardKey && moonToday.value) {
    cards.push({
      role: "Today's Moon",
      cardKey: store.moonCardKey,
      reason: `The Moon moves through ${moonToday.value.sign.name} today.`,
    })
  }
  return cards.map((entry) => {
    const card = store.cardByKey[entry.cardKey]
    return {
      ...entry,
      title: card?.title ?? entry.cardKey,
      imageUrl: card?.imageUrl ?? null,
      oracle: card ? ORACLE_CARD_BY_ID[card.oracleId] : undefined,
    }
  })
})

const placements = computed(() =>
  (store.natalChart?.points ?? []).map((point) => ({
    ...placementReading(point),
    point,
    degree: formatDegree(point.longitude),
  })),
)

const aspects = computed(() =>
  (store.natalChart?.aspects ?? []).slice(0, 18).map((aspect) => ({
    key: `${aspect.a}-${aspect.b}`,
    text: aspectReading(aspect),
  })),
)

const balance = computed(() =>
  store.natalChart ? balanceReading(store.natalChart) : [],
)

const chartRuler = computed(() =>
  store.natalChart ? chartRulerReading(store.natalChart) : null,
)

const moonPhaseBirth = computed(() =>
  store.natalChart ? moonPhaseReading(store.natalChart) : '',
)

const bigThree = computed(() => {
  const chart = store.natalChart
  if (!chart) return []
  return (['sun', 'moon', 'ascendant'] as const)
    .map((id) => chart.points.find((point) => point.id === id))
    .filter((point): point is NonNullable<typeof point> => Boolean(point))
    .map((point) => ({
      id: point.id,
      label: CHART_POINTS[point.id].name,
      glyph: CHART_POINTS[point.id].glyph,
      sign: signById(point.sign),
    }))
})

const focusedCard = computed(() => {
  const card = deckFocus.value ? store.cardByKey[deckFocus.value] : null
  if (!card) return null
  return { card, oracle: ORACLE_CARD_BY_ID[card.oracleId] }
})

function moonDay(at: string) {
  return new Date(at).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const surfaceClass = computed(() => ({
  'text-sm': store.settings.textSize === 'sm',
  'text-base': store.settings.textSize === 'md',
  'text-lg': store.settings.textSize === 'lg',
  'tarot-calm': store.settings.reducedMotion,
}))

watch(view, (next) => {
  if (next === 'chart' && store.natalChart) store.noteChartViewed()
})

watch(deckFocus, (key) => {
  if (key) store.noteCardStudied(key)
})

function linkCollectibleArt() {
  void collectibles.syncArt(TAROT_COLLECTION)
}

function chooseReading(id: AutoReadingId) {
  store.selectReading(id)
  store.noteReadingViewed(id)
}

function editProfile(id: string) {
  formOpen.value = true
  birthForm.value?.edit(id)
}

function newProfile() {
  formOpen.value = true
  birthForm.value?.startNew()
}

onMounted(() => {
  store.init()
  void store.loadDecks()
  void collectibles.loadCatalog(TAROT_COLLECTION)
  void collectibles.loadPlayer(TAROT_COLLECTION)
  if (!store.profiles.length) formOpen.value = true
  clock = setInterval(() => store.refreshClock(), 5 * 60 * 1000)
})

onBeforeUnmount(() => {
  if (clock) clearInterval(clock)
})
</script>

<template>
  <section
    class="kr-surface tarot-reader flex h-full min-h-0 flex-col overflow-hidden"
    :class="surfaceClass"
    :data-contrast="store.settings.highContrast ? 'high' : undefined"
    data-layout="console-fixed"
    data-testid="tarot-reader"
    aria-label="Kind Tarot reader"
  >
    <header-page-bar>
      <div class="flex min-w-0 flex-wrap items-center gap-2 px-2 py-1">
        <strong class="mr-1 text-sm tracking-widest text-primary">
          ✦ KIND TAROT
        </strong>
        <div class="join" role="tablist" aria-label="Reader view">
          <button
            v-for="entry in VIEWS"
            :key="entry.id"
            class="btn join-item btn-xs"
            :class="view === entry.id ? 'btn-primary' : 'btn-ghost'"
            type="button"
            role="tab"
            :aria-selected="view === entry.id"
            @click="view = entry.id"
          >
            {{ entry.label }}
          </button>
        </div>
        <select
          v-if="store.decks.length > 1"
          class="select select-bordered select-xs"
          aria-label="Deck"
          :value="store.activeDeckSlug"
          @change="store.selectDeck(($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="deck in store.decks"
            :key="deck.slug"
            :value="deck.slug"
          >
            {{ deck.title }}
          </option>
        </select>
        <span v-else class="badge badge-ghost badge-sm">
          {{ store.activeDeck.title }}
        </span>
        <div class="ml-auto flex items-center gap-1">
          <button
            class="btn btn-ghost btn-xs"
            :class="{ 'btn-active': view === 'achievements' }"
            type="button"
            aria-label="Achievements"
            title="Achievements"
            @click="view = 'achievements'"
          >
            <icon name="kind-icon:trophy" class="h-4 w-4" />
          </button>
          <button
            class="btn btn-ghost btn-xs"
            :class="{ 'btn-active': view === 'settings' }"
            type="button"
            aria-label="Settings"
            title="Settings"
            data-testid="tarot-settings-button"
            @click="view = 'settings'"
          >
            <icon name="kind-icon:settings" class="h-4 w-4" />
          </button>
          <nuxt-link
            v-if="userStore.isAdmin"
            to="/admin/tarot"
            class="btn btn-secondary btn-xs"
            data-testid="tarot-studio-link"
          >
            Tarot Studio ↗
          </nuxt-link>
        </div>
      </div>
    </header-page-bar>

    <div
      v-if="!store.ready"
      class="grid min-h-0 flex-1 place-content-center text-sm opacity-70"
    >
      Shuffling the deck…
    </div>

    <section
      v-else-if="view === 'readings'"
      class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 sm:p-3"
      aria-label="Automatic readings"
    >
      <div class="flex flex-wrap items-center gap-2">
        <div
          class="flex min-w-0 flex-1 basis-full gap-2 overflow-x-auto sm:basis-0 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
        >
          <button
            v-for="entry in store.readings"
            :key="entry.id"
            class="btn btn-sm h-auto shrink-0 min-h-0 flex-col items-start gap-0 py-1 text-left normal-case"
            :class="
              store.activeReadingId === entry.id
                ? 'btn-primary'
                : 'btn-ghost border border-base-content/15'
            "
            type="button"
            :aria-pressed="store.activeReadingId === entry.id"
            @click="chooseReading(entry.id)"
          >
            <span class="text-xs font-black">{{ entry.title }}</span>
            <span class="block max-w-[14rem] truncate text-[10px] opacity-70">
              {{ entry.reading.cards.map((c) => c.card.title).join(' · ') }}
            </span>
          </button>
        </div>
        <div class="ml-auto flex gap-1">
          <button
            v-if="reading"
            class="btn btn-outline btn-xs"
            type="button"
            @click="store.redraw(reading.id)"
          >
            Draw again
          </button>
          <button
            class="btn btn-ghost btn-xs"
            type="button"
            @click="store.redrawAll()"
          >
            Shuffle all
          </button>
          <button
            class="btn btn-ghost btn-xs"
            type="button"
            @click="store.resetToDaily()"
          >
            Today's draw
          </button>
        </div>
      </div>

      <div
        v-if="reading"
        class="kr-panes grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(300px,34%)]"
      >
        <div
          class="tarot-table kr-pane-scroll rounded-2xl border border-base-content/10 p-3 sm:p-5"
          tabindex="0"
        >
          <p
            class="mb-3 text-center text-xs uppercase tracking-widest opacity-70"
          >
            {{ reading.title }} · {{ reading.subtitle }}
          </p>
          <tarot-spread-stage :reading="reading.reading" />
        </div>
        <article
          class="kr-pane-scroll rounded-2xl border border-base-content/10 bg-base-200/70 p-4 text-sm leading-relaxed"
          aria-live="polite"
          tabindex="0"
        >
          <p class="mb-3 italic opacity-80">{{ reading.reading.opening }}</p>
          <div
            v-for="(drawn, index) in reading.reading.cards"
            :key="drawn.position.id"
            class="mb-3"
          >
            <h3 class="tarot-label text-xs font-black uppercase tracking-wider">
              {{ drawn.position.label }}
            </h3>
            <p>{{ reading.reading.passages[index] }}</p>
          </div>
          <p
            v-for="pair in reading.reading.pairs"
            :key="pair"
            class="mb-2 border-l-2 border-secondary/60 pl-2 text-xs opacity-80"
          >
            {{ pair }}
          </p>
          <p class="mt-3 font-bold">{{ reading.reading.closing }}</p>
          <p
            v-if="moonToday"
            class="mt-4 rounded-xl bg-base-300/70 p-2 text-xs opacity-80"
          >
            {{ moonToday.sign.glyph }} The Moon is in
            {{ moonToday.sign.name }} ({{ moonToday.phase.name }}):
            {{ moonToday.phase.note }}.
            <button
              v-if="!store.activeProfile"
              class="link link-primary"
              type="button"
              @click="view = 'horoscope'"
            >
              Add your birth details
            </button>
            <template v-else>
              Readings are tuned to {{ store.activeProfile.name }}.
            </template>
          </p>
        </article>
      </div>
    </section>

    <section
      v-else-if="view === 'horoscope'"
      class="kr-panes grid-cols-1 gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(280px,32%)_minmax(0,1fr)]"
      aria-label="Horoscope"
    >
      <section
        class="kr-pane-scroll rounded-2xl border border-base-content/10 bg-base-200/70 p-3"
        aria-label="People and horoscope options"
        tabindex="0"
      >
        <div class="mb-2 flex flex-wrap gap-1">
          <button
            v-for="profile in store.profiles"
            :key="profile.id"
            class="btn btn-xs"
            :class="
              profile.id === store.activeProfileId
                ? 'btn-primary'
                : 'btn-ghost border border-base-content/15'
            "
            type="button"
            @click="store.selectProfile(profile.id)"
          >
            {{ profile.name }}
          </button>
          <button
            class="btn btn-outline btn-xs"
            type="button"
            @click="newProfile"
          >
            + Person
          </button>
        </div>
        <div
          v-if="store.activeProfile && !formOpen"
          class="mb-2 flex gap-1 text-xs"
        >
          <button
            class="btn btn-ghost btn-xs"
            type="button"
            @click="editProfile(store.activeProfile.id)"
          >
            Edit details
          </button>
          <button
            class="btn btn-ghost btn-xs text-error"
            type="button"
            @click="store.removeProfile(store.activeProfile.id)"
          >
            Remove
          </button>
        </div>
        <tarot-birth-form
          v-show="formOpen || !store.profiles.length"
          ref="birthForm"
          @saved="formOpen = false"
        />
        <ul
          v-if="store.moonWeek.length && !formOpen"
          class="mt-3 space-y-1 text-xs"
        >
          <li class="font-black uppercase tracking-wider opacity-70">
            Moon this week
          </li>
          <li
            v-for="change in store.moonWeek"
            :key="change.at"
            class="flex justify-between gap-2"
          >
            <span>{{ moonDay(change.at) }}</span>
            <span>
              {{ signById(change.sign).glyph }} {{ signById(change.sign).name }}
            </span>
          </li>
        </ul>
      </section>

      <div
        class="kr-pane-scroll rounded-2xl border border-base-content/10 p-3 sm:p-4"
        tabindex="0"
      >
        <div
          v-if="!store.natalChart"
          class="grid h-full place-content-center text-center text-sm opacity-70"
        >
          <p class="text-3xl text-primary">☽</p>
          <p>Add a birth date, time and place to see your horoscope.</p>
        </div>
        <template v-else>
          <div class="mb-3 flex flex-wrap gap-2">
            <span
              v-for="item in bigThree"
              :key="item.id"
              class="badge badge-lg gap-1"
            >
              {{ item.glyph }} {{ item.label }} in {{ item.sign.glyph }}
              {{ item.sign.name }}
            </span>
            <span
              v-if="!store.natalChart.hasTime"
              class="badge badge-warning badge-lg"
            >
              Birth time unknown
            </span>
            <span
              v-if="store.natalChart.moonSignUncertain"
              class="badge badge-warning badge-lg"
            >
              Moon changed sign that day
            </span>
          </div>
          <h2 v-if="horoscope" class="mb-2 text-lg font-black">
            {{ horoscope.headline }}
          </h2>
          <ul v-if="horoscope" class="mb-4 space-y-1 text-sm">
            <li v-for="line in horoscope.lines" :key="line">{{ line }}</li>
          </ul>
          <h3
            class="mb-2 text-xs font-black uppercase tracking-wider opacity-70"
          >
            Your cards
          </h3>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <figure
              v-for="entry in personalCards"
              :key="entry.role"
              class="min-w-0"
            >
              <tarot-card-face
                :title="entry.title"
                :card-key="entry.cardKey"
                :image-url="entry.imageUrl"
              />
              <figcaption class="mt-1 text-xs">
                <span class="block font-black text-primary">{{
                  entry.role
                }}</span>
                <span class="block font-bold">{{ entry.title }}</span>
                <span class="block opacity-70">{{ entry.reason }}</span>
              </figcaption>
            </figure>
          </div>
        </template>
      </div>
    </section>

    <section
      v-else-if="view === 'chart'"
      class="kr-panes grid-cols-1 gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,40%)]"
      aria-label="Birth chart"
    >
      <div
        v-if="!store.natalChart"
        class="grid place-content-center text-center text-sm opacity-70 lg:col-span-2"
      >
        <p>Cast a chart in the Horoscope tab first.</p>
        <button
          class="btn btn-primary btn-sm mt-2"
          type="button"
          @click="view = 'horoscope'"
        >
          Add birth details
        </button>
      </div>
      <template v-else>
        <div
          class="grid min-h-0 place-items-center rounded-2xl border border-base-content/10 p-2"
        >
          <tarot-chart-wheel
            :chart="store.natalChart"
            class="max-h-[60vh] lg:max-h-full"
          />
        </div>
        <div
          class="kr-pane rounded-2xl border border-base-content/10 bg-base-200/70"
        >
          <div class="join p-2" role="tablist" aria-label="Chart analysis">
            <button
              v-for="pane in ['placements', 'aspects', 'balance'] as const"
              :key="pane"
              class="btn join-item btn-xs capitalize"
              :class="chartPane === pane ? 'btn-primary' : 'btn-ghost'"
              type="button"
              role="tab"
              :aria-selected="chartPane === pane"
              @click="chartPane = pane"
            >
              {{ pane }}
            </button>
          </div>
          <div class="kr-pane-scroll px-3 pb-3 text-sm" tabindex="0">
            <template v-if="chartPane === 'placements'">
              <p class="mb-2 text-xs opacity-70">
                {{
                  store.natalChart.houseSystem === 'whole-sign'
                    ? 'Whole-sign houses (Placidus is undefined this far north or south).'
                    : store.natalChart.houseSystem
                      ? 'Placidus houses, tropical zodiac.'
                      : 'Tropical zodiac. Add a birth time for houses and rising sign.'
                }}
              </p>
              <details
                v-for="entry in placements"
                :key="entry.point.id"
                class="mb-2 rounded-xl bg-base-100/60 p-2"
              >
                <summary class="cursor-pointer">
                  <strong>{{ entry.title }}</strong>
                  <span class="ml-1 text-xs opacity-75">
                    {{ entry.degree }}{{ entry.point.retrograde ? ' ℞' : '' }}
                  </span>
                  <span class="block text-xs opacity-80">{{
                    entry.summary
                  }}</span>
                </summary>
                <p class="mt-1 text-xs">{{ entry.detail }}</p>
              </details>
            </template>
            <template v-else-if="chartPane === 'aspects'">
              <p v-if="!aspects.length" class="opacity-70">
                No major aspects within orb.
              </p>
              <p v-for="entry in aspects" :key="entry.key" class="mb-2 text-xs">
                {{ entry.text }}
              </p>
            </template>
            <template v-else>
              <p v-for="line in balance" :key="line" class="mb-2">{{ line }}</p>
              <p v-if="chartRuler" class="mb-2">{{ chartRuler }}</p>
              <p class="mb-3">{{ moonPhaseBirth }}</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div
                  v-for="(score, element) in store.natalChart.elements"
                  :key="element"
                  class="rounded-lg bg-base-100/70 p-2"
                >
                  <span class="font-black capitalize">{{ element }}</span>
                  <progress
                    class="progress progress-primary w-full"
                    :value="score"
                    max="20"
                  />
                  <span class="opacity-70">{{ ELEMENT_NOTES[element] }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </section>

    <section
      v-else-if="view === 'collection'"
      class="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3"
      aria-label="Kind Tarot collection"
    >
      <kr-collectible-board
        :set="TAROT_COLLECTION"
        @claimed="store.noteClaimed"
        @opened="store.notePackOpened"
        @backs="store.noteBacksUnlocked"
      />
      <button
        v-if="userStore.isAdmin"
        class="btn btn-ghost btn-xs self-start"
        type="button"
        @click="linkCollectibleArt"
      >
        Admin: link rendered collectible art
      </button>
    </section>

    <section
      v-else-if="view === 'circle'"
      class="flex min-h-0 flex-1 flex-col p-2 sm:p-3"
      aria-label="Tarot Circle group chat"
    >
      <kr-group-chat room="tarot" @sent="store.noteChatSent" />
    </section>

    <section
      v-else-if="view === 'achievements'"
      class="kr-panes grid-cols-1 p-2 sm:p-3"
      aria-label="Kind Tarot achievements"
    >
      <div
        class="kr-pane-scroll rounded-2xl border border-base-content/10 p-3"
        tabindex="0"
      >
        <game-achievement-strip game="tarot-studio" layout="list" />
      </div>
    </section>

    <section
      v-else-if="view === 'settings'"
      class="kr-panes grid-cols-1 p-2 sm:p-3"
      aria-label="Kind Tarot settings"
    >
      <div
        class="kr-pane-scroll rounded-2xl border border-base-content/10 p-4"
        tabindex="0"
      >
        <tarot-settings-panel />
      </div>
    </section>

    <section
      v-else
      class="kr-panes grid-cols-1 gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,30%)]"
      aria-label="The full deck"
    >
      <div
        class="kr-pane-scroll rounded-2xl border border-base-content/10 p-2"
        tabindex="0"
      >
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-8">
          <button
            v-for="card in store.activeDeck.cards"
            :key="card.key"
            class="min-w-0 rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
            :aria-pressed="deckFocus === card.key"
            @click="deckFocus = card.key"
          >
            <tarot-card-face
              :title="card.title"
              :card-key="card.key"
              :image-url="card.imageUrl"
            />
            <span class="mt-1 block truncate text-[10px] font-bold">{{
              card.title
            }}</span>
          </button>
        </div>
      </div>
      <section
        class="kr-pane-scroll rounded-2xl border border-base-content/10 bg-base-200/70 p-3 text-sm"
        aria-label="Card meanings"
        tabindex="0"
      >
        <template v-if="focusedCard">
          <h2 class="text-lg font-black">{{ focusedCard.card.title }}</h2>
          <template v-if="focusedCard.oracle">
            <h3 class="tarot-label mt-2 text-xs font-black uppercase">
              Upright
            </h3>
            <p>{{ focusedCard.oracle.upright }}</p>
            <h3 class="tarot-label mt-2 text-xs font-black uppercase">
              Reversed
            </h3>
            <p>{{ focusedCard.oracle.reversed }}</p>
            <p class="mt-3 italic">{{ focusedCard.oracle.prompt }}</p>
          </template>
        </template>
        <p v-else class="opacity-70">Choose any card to read its meanings.</p>
      </section>
    </section>
  </section>
</template>

<style scoped>
.tarot-reader[data-contrast='high'] {
  --color-base-100: #ffffff;
  --color-base-200: #f2f2f2;
  --color-base-300: #e6e6e6;
  --color-base-content: #000000;
}

/* Small uppercase labels: primary's hue, darkened toward the text color so
   12px bold labels clear WCAG AA (plain text-primary measured 4.2:1). */
.tarot-label {
  color: color-mix(
    in oklab,
    var(--color-primary) 80%,
    var(--color-base-content)
  );
}

.tarot-calm :deep(*) {
  animation: none !important;
  transition: none !important;
}

.tarot-table {
  background:
    radial-gradient(
      ellipse at 50% 30%,
      color-mix(in oklch, var(--color-primary) 22%, transparent),
      transparent 60%
    ),
    radial-gradient(
      ellipse at 50% 120%,
      color-mix(in oklch, var(--color-secondary) 25%, transparent),
      transparent 55%
    ),
    var(--color-base-300);
}
</style>
