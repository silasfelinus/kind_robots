<!-- components/cthulhuquarium/cthulhuquarium-market.vue
     The Market room (cthulhuquarium/t-098): Charlotte or Wilbur behind the
     counter with today's line, and the day's specimens or the tank upgrades
     set out on pedestals. Prices, stock and levels are the store's; buying
     goes through tankStore.unlock() and tankStore.purchaseUpgrade(). -->
<template>
  <div class="cq-market-room">
    <div class="cq-market-scene">
      <img
        v-if="keeperArt"
        :src="keeperArt"
        :alt="keeperName"
        class="cq-keeper"
        :class="{ 'cq-keeper-wilbur': bark?.speaker === 'wilbur' }"
      />
      <span class="cq-counter" aria-hidden="true" />
      <figure v-if="bark" class="cq-speech cq-speech-market">
        <blockquote>{{ bark.text }}</blockquote>
        <figcaption>{{ keeperName }}</figcaption>
      </figure>
      <div class="cq-market-switch" role="tablist" aria-label="Market shelves">
        <button
          type="button"
          role="tab"
          data-nav
          class="cq-switch-button"
          :aria-selected="view === 'specimens'"
          @click="view = 'specimens'"
        >
          Specimens
          <span class="cq-switch-count">{{ tankStore.catalog.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          data-nav
          class="cq-switch-button"
          :aria-selected="view === 'upgrades'"
          @click="view = 'upgrades'"
        >
          Upgrades
          <span class="cq-switch-count">{{ tankStore.upgrades.length }}</span>
        </button>
      </div>
      <p class="cq-market-note">
        <Icon name="kind-icon:clock" class="size-3.5 shrink-0" />
        <span>{{ refreshLabel }}</span>
        <span v-if="tankStore.lastCollectCoins > 0" class="cq-market-earned">
          +{{ tankStore.lastCollectCoins }} from coins
        </span>
      </p>
    </div>

    <p v-if="view === 'specimens' && !fitsRoom" class="cq-market-warning">
      The tank is full. Buy another shelf or release a creature to make room.
    </p>

    <div class="cq-pedestal-shelf">
      <button
        type="button"
        class="cq-shelf-nav cq-shelf-prev"
        aria-label="Earlier on the shelf"
        @click="page(-1)"
      >
        <Icon name="kind-icon:chevron-left" class="size-5" />
      </button>
      <div
        ref="rowRef"
        class="cq-pedestal-row kr-scroll"
        role="list"
        :aria-label="
          view === 'specimens' ? 'Today\'s specimens' : 'Tank upgrades'
        "
      >
        <template v-if="view === 'specimens'">
          <p v-if="tankStore.catalogLoading" class="cq-shelf-empty">
            Reading the bestiary…
          </p>
          <p v-else-if="!tankStore.catalog.length" class="cq-shelf-empty">
            Nothing new today. Re-order discoveries from the book.
          </p>
          <article
            v-for="entry in tankStore.catalog"
            :key="entry.id"
            role="listitem"
            class="cq-pedestal"
            :data-rarity="rarityKey(entry.tier)"
          >
            <div class="cq-pedestal-stage">
              <cthulhuquarium-sprite
                :slug="entry.slug"
                :label="entry.name"
                :fallback="withCthulhuquariumArt(entry)"
                :size="150"
                class="cq-pedestal-creature"
              />
              <cthulhuquarium-ui-art name="plinth" class="cq-pedestal-plinth" />
              <span class="cq-rarity-seal">{{ rarityLabel(entry.tier) }}</span>
            </div>
            <div class="cq-plaque">
              <h4 class="cq-plaque-title">{{ entry.name }}</h4>
              <p class="cq-plaque-text">
                {{ describe(entry.slug, entry.species) }}
              </p>
              <button
                type="button"
                data-nav
                class="cq-price"
                :disabled="!canBuy(entry.cost)"
                :aria-label="`Bring ${entry.name} into the tank for ${entry.cost === 0 ? 'free' : `${entry.cost} coins`}`"
                :title="buyHint(entry.cost)"
                @click="tankStore.unlock(entry.id)"
              >
                <cthulhuquarium-ui-art name="coin" class="cq-price-coin" />
                <span class="tabular-nums">{{
                  entry.cost === 0 ? 'Free' : formatCoins(entry.cost)
                }}</span>
              </button>
            </div>
          </article>
        </template>
        <template v-else>
          <p v-if="!tankStore.upgrades.length" class="cq-shelf-empty">
            Nothing to improve yet.
          </p>
          <article
            v-for="upgrade in tankStore.upgrades"
            :key="upgrade.track"
            role="listitem"
            class="cq-pedestal"
            data-rarity="legendary"
          >
            <div class="cq-pedestal-stage">
              <img
                v-if="upgradeArt(upgrade.track)"
                :src="upgradeArt(upgrade.track) ?? undefined"
                alt=""
                class="cq-pedestal-object"
              />
              <cthulhuquarium-ui-art name="plinth" class="cq-pedestal-plinth" />
              <span
                class="cq-pips"
                role="meter"
                :aria-valuenow="upgrade.level"
                aria-valuemin="0"
                :aria-valuemax="upgrade.maxLevel"
                :aria-label="`${upgrade.title} level`"
              >
                <span
                  v-for="pip in upgrade.maxLevel"
                  :key="pip"
                  :class="{ 'cq-pip-on': pip <= upgrade.level }"
                />
              </span>
            </div>
            <div class="cq-plaque">
              <h4 class="cq-plaque-title">{{ upgrade.title }}</h4>
              <p class="cq-plaque-text">{{ upgrade.description }}</p>
              <button
                v-if="upgrade.nextCost !== null"
                type="button"
                data-nav
                class="cq-price"
                :disabled="
                  tankStore.coins < upgrade.nextCost ||
                  tankStore.upgradePending !== null
                "
                :aria-label="`${upgrade.title} for ${upgrade.nextCost} coins`"
                @click="tankStore.purchaseUpgrade(upgrade.track)"
              >
                <cthulhuquarium-ui-art name="coin" class="cq-price-coin" />
                <span class="tabular-nums">{{
                  formatCoins(upgrade.nextCost)
                }}</span>
              </button>
              <span v-else class="cq-price cq-price-done">Maxed</span>
            </div>
          </article>
        </template>
      </div>
      <button
        type="button"
        class="cq-shelf-nav cq-shelf-next"
        aria-label="Further along the shelf"
        @click="page(1)"
      >
        <Icon name="kind-icon:chevron-right" class="size-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCthulhuquariumTankStore } from '~/stores/cthulhuquariumTankStore'
import {
  artByName,
  plateArt,
  portraitFor,
  withCthulhuquariumArt,
} from '~/utils/cthulhuquariumArt'
import {
  CTHULHUQUARIUM_CHARACTERS,
  CTHULHUQUARIUM_VOICES,
} from '~/utils/cthulhuquariumCanon.generated'
import { formatShopRefreshCountdown } from '~/utils/aquariumShopCountdown'
import { rarityKey, rarityLabel } from '~/utils/cthulhuquariumRarity'

const tankStore = useCthulhuquariumTankStore()

const view = ref<'specimens' | 'upgrades'>('specimens')
const rowRef = ref<HTMLElement | null>(null)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined

const bark = computed(() => tankStore.screenBark('shop'))
const keeperName = computed(() =>
  bark.value
    ? CTHULHUQUARIUM_CHARACTERS[bark.value.speaker].name
    : CTHULHUQUARIUM_CHARACTERS.charlotte.name,
)
const keeperArt = computed(() =>
  bark.value
    ? portraitFor(bark.value.speaker, bark.value.pose)
    : portraitFor('charlotte', 'presenting'),
)
const refreshLabel = computed(() => {
  const dateKey = tankStore.catalogDateKey
  return (
    (dateKey ? formatShopRefreshCountdown(dateKey, now.value) : null) ??
    "Today's arrivals. More tomorrow."
  )
})
const fitsRoom = computed(() => tankStore.occupantSize + 1 <= tankStore.sizeCap)

const UPGRADE_ART: Record<string, { plate: string; standIn: string }> = {
  food: { plate: 'upgrade-food', standIn: 'set-heavier-feed' },
  dropSpeed: { plate: 'upgrade-drops', standIn: 'set-restless-water' },
  room: { plate: 'upgrade-room', standIn: 'set-extra-shelf' },
}

function upgradeArt(track: string): string | null {
  const art = UPGRADE_ART[track]
  if (!art) return null
  return plateArt(art.plate) ?? artByName(art.standIn)
}

function describe(slug: string, species: string | null): string {
  return (
    CTHULHUQUARIUM_VOICES[slug]?.charlotte || species || 'Not yet observed.'
  )
}

function canBuy(cost: number): boolean {
  return tankStore.coins >= cost && fitsRoom.value
}

function buyHint(cost: number): string | undefined {
  if (!fitsRoom.value) return 'Tank full'
  if (cost > tankStore.coins)
    return `${cost - tankStore.coins} more coins needed`
  return undefined
}

function formatCoins(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function page(direction: number) {
  const row = rowRef.value
  if (!row) return
  row.scrollBy({ left: direction * row.clientWidth * 0.9, behavior: 'smooth' })
}

function toggleView() {
  view.value = view.value === 'specimens' ? 'upgrades' : 'specimens'
}

onMounted(() => {
  clock = setInterval(() => (now.value = Date.now()), 30_000)
})
onBeforeUnmount(() => clearInterval(clock))

defineExpose({ view, toggleView })
</script>
