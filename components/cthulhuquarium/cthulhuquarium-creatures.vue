<!-- components/cthulhuquarium/cthulhuquarium-creatures.vue
     The Creatures room (cthulhuquarium/t-098): a filter rail, one featured
     creature with its field note and its own meters, and a strip of cards
     beneath. "In the tank" is the roster (feed, buy another, release);
     "Observed" is everything the book has recorded; "The book" opens the
     full Ichthyonomicon in the same frame. Every number is the store's. -->
<template>
  <div class="cq-creatures-room" :class="{ 'cq-creatures-book': book }">
    <nav class="cq-rail" aria-label="Creature filters">
      <p class="cq-rail-title">
        <cthulhuquarium-ui-art name="tab-creatures" class="cq-rail-glyph" />
        Creatures
      </p>
      <button
        type="button"
        data-nav
        class="cq-rail-item"
        :aria-pressed="!book && view === 'tank'"
        @click="showView('tank')"
      >
        <span>In the tank</span>
        <span class="cq-rail-count tabular-nums">{{
          tankStore.stock.length
        }}</span>
      </button>
      <button
        type="button"
        data-nav
        class="cq-rail-item"
        :aria-pressed="!book && view === 'observed'"
        @click="showView('observed')"
      >
        <span>Observed</span>
        <span class="cq-rail-count tabular-nums">{{
          tankStore.bestiaryCollectedCount
        }}</span>
      </button>
      <button
        type="button"
        data-nav
        class="cq-rail-item"
        :aria-pressed="book"
        @click="book = true"
      >
        <span>The book</span>
        <Icon name="kind-icon:book" class="size-4 opacity-70" />
      </button>
      <div v-if="!book" class="cq-rail-rarity" role="group" aria-label="Rarity">
        <button
          v-for="option in rarityOptions"
          :key="option"
          type="button"
          data-nav
          class="cq-rarity-chip"
          :data-rarity="option === 'all' ? undefined : option"
          :aria-pressed="rarity === option"
          @click="rarity = option"
        >
          {{ option === 'all' ? 'Any rarity' : rarityLabel(option) }}
        </button>
      </div>
    </nav>

    <div v-if="book" class="cq-book kr-scroll">
      <cthulhuquarium-bark context="bestiary" />
      <p v-if="tankStore.bestiaryLoading" class="cq-shelf-empty">
        Reading the book…
      </p>
      <cthulhuquarium-ichthyonomicon v-else />
    </div>

    <template v-else>
      <section
        v-if="featured"
        class="cq-featured"
        :data-rarity="rarityKey(featured.tier)"
        aria-live="polite"
      >
        <div class="cq-featured-art">
          <cthulhuquarium-sprite
            :key="featured.slug"
            :slug="featured.slug"
            :label="featured.name"
            :fallback="withCthulhuquariumArt(featured)"
            :size="260"
            class="cq-featured-sprite"
          />
        </div>
        <div class="cq-featured-card">
          <div class="cq-featured-head">
            <div class="min-w-0">
              <h3 class="cq-featured-name">{{ featured.name }}</h3>
              <p v-if="featured.species" class="cq-featured-epithet">
                {{ featured.species }}
              </p>
            </div>
            <span class="cq-rarity-seal cq-rarity-seal-lg">{{
              rarityLabel(featured.tier)
            }}</span>
          </div>
          <p class="cq-featured-note">
            {{
              featured.fieldNote
                ? `“${featured.fieldNote}”`
                : 'Nothing is written about this one yet.'
            }}
          </p>
          <div class="cq-featured-stats">
            <div v-if="featured.hungriest" class="cq-stat">
              <cthulhuquarium-ui-art name="meter-hunger" class="cq-stat-icon" />
              <span class="cq-stat-label">Fed</span>
              <span class="cq-stat-value tabular-nums"
                >{{ featured.hungriest.hunger }}%</span
              >
              <span class="cq-stat-bar" aria-hidden="true">
                <span
                  :style="{ width: `${featured.hungriest.hunger}%` }"
                  :class="{ 'cq-bar-low': featured.hungriest.hunger < 50 }"
                />
              </span>
            </div>
            <div class="cq-stat">
              <cthulhuquarium-ui-art name="capacity" class="cq-stat-icon" />
              <span class="cq-stat-label">In the tank</span>
              <span class="cq-stat-value tabular-nums"
                >×{{ featured.owned.length }}</span
              >
            </div>
            <div v-if="featured.coinValue" class="cq-stat">
              <cthulhuquarium-ui-art name="coin" class="cq-stat-icon" />
              <span class="cq-stat-label">Each coin</span>
              <span class="cq-stat-value tabular-nums">{{
                featured.coinValue
              }}</span>
            </div>
            <div v-if="featured.behavior" class="cq-stat">
              <cthulhuquarium-ui-art name="meter-mood" class="cq-stat-icon" />
              <span class="cq-stat-label">Habit</span>
              <span class="cq-stat-value capitalize">{{
                featured.behavior
              }}</span>
            </div>
          </div>
          <div class="cq-featured-actions">
            <template v-if="featured.hungriest">
              <button
                type="button"
                data-nav
                class="cq-plate-button"
                :disabled="featured.hungriest.hunger >= 100"
                @click="feedFeatured"
              >
                Feed
              </button>
              <button
                type="button"
                data-nav
                class="cq-plate-button"
                :disabled="tankStore.coins < featured.buyCost || !fitsRoom"
                :title="fitsRoom ? undefined : 'Tank full'"
                @click="tankStore.unlock(featured.monsterId)"
              >
                Another
                <span class="cq-plate-price tabular-nums">
                  <cthulhuquarium-ui-art name="coin" class="cq-price-coin" />
                  {{ featured.buyCost }}
                </span>
              </button>
              <button
                type="button"
                data-nav
                class="cq-plate-button cq-plate-button-quiet"
                @click="tankStore.sell(featured.hungriest.id)"
              >
                Release
                <span
                  v-if="featured.sellPrice > 0"
                  class="cq-plate-price tabular-nums"
                  >+{{ featured.sellPrice }}</span
                >
              </button>
            </template>
            <button
              v-else
              type="button"
              data-nav
              class="cq-plate-button"
              :disabled="tankStore.coins < featured.reorderCost || !fitsRoom"
              @click="tankStore.unlock(featured.monsterId)"
            >
              Re-order
              <span class="cq-plate-price tabular-nums">
                <cthulhuquarium-ui-art name="coin" class="cq-price-coin" />
                {{ featured.reorderCost }}
              </span>
            </button>
          </div>
        </div>
      </section>
      <section v-else class="cq-featured cq-featured-empty">
        <p>
          {{
            view === 'tank'
              ? 'An empty tank, waiting. The Market has today’s specimens.'
              : 'Nothing recorded yet.'
          }}
        </p>
      </section>

      <div class="cq-strip-wrap">
        <p class="cq-collected">
          <span>Collected</span>
          <span class="tabular-nums">
            {{ tankStore.bestiaryCollectedCount }} /
            {{ tankStore.bestiaryTotalCount || '—' }}
          </span>
        </p>
        <div
          class="cq-card-strip kr-scroll"
          role="listbox"
          aria-label="Creatures"
          aria-orientation="horizontal"
        >
          <button
            v-for="card in shown"
            :key="card.key"
            type="button"
            role="option"
            data-nav
            class="cq-creature-card"
            :data-rarity="rarityKey(card.tier)"
            :aria-selected="card.key === featured?.key"
            @click="selectedKey = card.key"
            @focus="selectedKey = card.key"
          >
            <span class="cq-creature-plate">
              <img
                v-if="artForSpecies(card.slug)"
                :src="artForSpecies(card.slug) ?? undefined"
                alt=""
                loading="lazy"
              />
              <Icon v-else name="kind-icon:fish" class="size-8 opacity-50" />
              <span v-if="card.owned.length > 1" class="cq-creature-count"
                >×{{ card.owned.length }}</span
              >
            </span>
            <span class="cq-creature-name">{{ card.name }}</span>
            <span class="cq-creature-ribbon">{{ rarityLabel(card.tier) }}</span>
            <span
              v-if="card.hungriest"
              class="cq-creature-fed"
              aria-hidden="true"
            >
              <span
                :style="{ width: `${card.hungriest.hunger}%` }"
                :class="{ 'cq-bar-low': card.hungriest.hunger < 50 }"
              />
            </span>
          </button>
          <p v-if="!shown.length" class="cq-shelf-empty">
            Nothing of that rarity here.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useCthulhuquariumTankStore,
  type TankStock,
} from '~/stores/cthulhuquariumTankStore'
import { artForSpecies, withCthulhuquariumArt } from '~/utils/cthulhuquariumArt'
import {
  RARITY_ORDER,
  rarityKey,
  rarityLabel,
  rarityRank,
  type RarityKey,
} from '~/utils/cthulhuquariumRarity'

const book = defineModel<boolean>('book', { default: false })

const tankStore = useCthulhuquariumTankStore()

type CreatureCard = {
  key: string
  monsterId: number
  slug: string
  name: string
  species: string | null
  tier: string
  behavior: string | null
  fieldNote: string | null
  owned: TankStock[]
  hungriest: TankStock | null
  coinValue: number
  buyCost: number
  sellPrice: number
  reorderCost: number
}

const view = ref<'tank' | 'observed'>('tank')
const rarity = ref<RarityKey | 'all'>('all')
const selectedKey = ref<string | null>(null)

const fitsRoom = computed(() => tankStore.occupantSize + 1 <= tankStore.sizeCap)

const ownedByMonster = computed(() => {
  const groups = new Map<number, TankStock[]>()
  for (const entry of tankStore.stock) {
    const list = groups.get(entry.monsterId)
    if (list) list.push(entry)
    else groups.set(entry.monsterId, [entry])
  }
  return groups
})

function hungriestOf(entries: TankStock[]): TankStock | null {
  return entries.reduce<TankStock | null>(
    (worst, entry) => (!worst || entry.hunger < worst.hunger ? entry : worst),
    null,
  )
}

const tankCards = computed<CreatureCard[]>(() =>
  [...ownedByMonster.value.values()].map((entries) => {
    const hungriest = hungriestOf(entries)!
    const monster = hungriest.Monster
    return {
      key: `m${hungriest.monsterId}`,
      monsterId: hungriest.monsterId,
      slug: monster.slug,
      name: monster.name,
      species: monster.species,
      tier: monster.tier,
      behavior: monster.behavior,
      fieldNote: monster.fieldNote,
      owned: entries,
      hungriest,
      coinValue: hungriest.coinValue,
      buyCost: hungriest.buyCost,
      sellPrice: hungriest.sellPrice,
      reorderCost: hungriest.buyCost,
    }
  }),
)

const observedCards = computed<CreatureCard[]>(() => {
  const owned = new Map(tankCards.value.map((card) => [card.monsterId, card]))
  return tankStore.bestiary
    .filter((entry) => entry.collected)
    .map(
      (entry) =>
        owned.get(entry.id) ?? {
          key: `m${entry.id}`,
          monsterId: entry.id,
          slug: entry.slug,
          name: entry.name,
          species: entry.species,
          tier: entry.tier,
          behavior: entry.behavior,
          fieldNote: entry.fieldNote,
          owned: [],
          hungriest: null,
          coinValue: 0,
          buyCost: entry.cost,
          sellPrice: 0,
          reorderCost: entry.cost,
        },
    )
})

const cards = computed(() =>
  view.value === 'tank' ? tankCards.value : observedCards.value,
)

const rarityOptions = computed<Array<RarityKey | 'all'>>(() => {
  const present = new Set(cards.value.map((card) => rarityKey(card.tier)))
  return ['all', ...RARITY_ORDER.filter((key) => present.has(key))]
})

const shown = computed(() =>
  cards.value
    .filter(
      (card) => rarity.value === 'all' || rarityKey(card.tier) === rarity.value,
    )
    .sort((a, b) => rarityRank(b.tier) - rarityRank(a.tier)),
)

const featured = computed<CreatureCard | null>(
  () =>
    shown.value.find((card) => card.key === selectedKey.value) ??
    shown.value[0] ??
    null,
)

watch(rarityOptions, (options) => {
  if (!options.includes(rarity.value)) rarity.value = 'all'
})

function showView(next: 'tank' | 'observed') {
  view.value = next
  book.value = false
  if (next === 'observed' && !tankStore.bestiary.length)
    void tankStore.loadBestiary()
}

const canFeed = computed(
  () => !!featured.value?.hungriest && featured.value.hungriest.hunger < 100,
)

function feedFeatured() {
  const target = featured.value?.hungriest
  if (target) void tankStore.feed(target.id)
}

function toggleBook() {
  book.value = !book.value
}

defineExpose({ canFeed, feedFeatured, toggleBook })
</script>
