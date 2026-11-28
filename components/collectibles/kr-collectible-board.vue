<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCollectibleStore, type OpenedCard } from '~/stores/collectibleStore'
import { useUserStore } from '~/stores/userStore'
import type { CollectibleRarity } from '~/utils/collectibles/types'

const props = defineProps<{ set: string }>()
const emit = defineEmits<{
  claimed: [streak: number]
  opened: [cards: OpenedCard[]]
  backs: [keys: string[]]
  selectBack: [key: string]
}>()

const store = useCollectibleStore()
const userStore = useUserStore()
const view = ref<'today' | 'album' | 'backs' | 'history'>('today')
const rarityFilter = ref<CollectibleRarity | 'all'>('all')
const groupFilter = ref('all')
const revealed = ref(0)

const state = computed(() => store.set(props.set))
const catalog = computed(() => state.value.catalog)
const player = computed(() => state.value.player)
const economy = computed(() => catalog.value?.economy ?? null)

const ownedCount = computed(() =>
  catalog.value
    ? catalog.value.cards.filter((card) => player.value?.owned[card.key]).length
    : 0,
)

const groups = computed(() => [
  ...new Set((catalog.value?.cards ?? []).map((card) => card.group)),
])

const albumCards = computed(() =>
  (catalog.value?.cards ?? []).filter(
    (card) =>
      (rarityFilter.value === 'all' || card.rarity === rarityFilter.value) &&
      (groupFilter.value === 'all' || card.group === groupFilter.value),
  ),
)

const cardByKey = computed(
  () =>
    new Map(
      [...(catalog.value?.cards ?? []), ...(catalog.value?.backs ?? [])].map(
        (item) => [item.key, item],
      ),
    ),
)

const canAffordPack = computed(
  () =>
    !!player.value &&
    !!economy.value &&
    (player.value.packTickets > 0 ||
      player.value.balance >= economy.value.packCost),
)

function artFor(key: string) {
  return catalog.value?.art[key] ?? null
}

function titleFor(key: string) {
  return cardByKey.value.get(key)?.title ?? key
}

async function claim() {
  const result = await store.claimDaily(props.set)
  if (!result) return
  emit('claimed', result.streak)
  if (result.newBacks.length) emit('backs', result.newBacks)
}

async function openPack() {
  revealed.value = 0
  const result = await store.openPack(props.set)
  if (!result) return
  emit('opened', result.cards)
  if (result.newBacks.length) emit('backs', result.newBacks)
}

async function chooseBack(key: string) {
  if (await store.selectBack(props.set, key)) emit('selectBack', key)
}

function revealNext() {
  revealed.value = Math.min(revealed.value + 1, state.value.lastPack.length)
}

function revealAll() {
  revealed.value = state.value.lastPack.length
}

function closePack() {
  store.dismissPack(props.set)
  revealed.value = 0
}

onMounted(() => {
  if (!catalog.value) void store.loadCatalog(props.set)
  void store.loadPlayer(props.set)
})

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) void store.loadPlayer(props.set)
  },
)
</script>

<template>
  <section
    class="flex min-h-0 flex-1 flex-col gap-2"
    aria-label="Collection"
    data-testid="collectible-board"
  >
    <div
      class="flex flex-wrap items-center gap-2 rounded-2xl border border-base-content/10 bg-base-200/70 p-2"
    >
      <template v-if="player && economy">
        <span class="badge badge-lg gap-1 font-bold">
          {{ economy.currencyGlyph }} {{ player.balance }}
          <span class="font-normal opacity-70">{{ economy.currencyName }}</span>
        </span>
        <span v-if="player.packTickets" class="badge badge-warning badge-lg">
          🎟 {{ player.packTickets }} free pack{{
            player.packTickets > 1 ? 's' : ''
          }}
        </span>
        <span class="badge badge-ghost badge-lg">
          🔥 {{ player.streak }}-day streak
        </span>
        <span class="badge badge-ghost badge-lg">
          {{ ownedCount }} / {{ catalog?.cards.length }} cards
        </span>
      </template>
      <span v-else-if="!userStore.isLoggedIn" class="text-sm">
        Sign in to claim daily rewards, open packs and keep a scrapbook across
        devices.
      </span>
      <div class="join ml-auto" role="tablist" aria-label="Collection view">
        <button
          v-for="tab in ['today', 'album', 'backs', 'history'] as const"
          :key="tab"
          class="btn join-item btn-xs capitalize"
          :class="view === tab ? 'btn-primary' : 'btn-ghost'"
          type="button"
          role="tab"
          :aria-selected="view === tab"
          @click="view = tab"
        >
          {{ tab === 'album' ? 'Scrapbook' : tab }}
        </button>
      </div>
    </div>

    <p v-if="state.error" class="alert alert-error py-1 text-xs" role="alert">
      {{ state.error }}
    </p>
    <p
      v-if="state.notice"
      class="rounded-lg bg-success/15 px-3 py-1 text-xs text-success"
      role="status"
    >
      {{ state.notice }}
    </p>

    <div class="kr-scroll rounded-2xl border border-base-content/10 p-2 sm:p-3">
      <div v-if="view === 'today'" class="grid gap-3">
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 rounded-2xl bg-base-200/70 p-3"
        >
          <div>
            <h3 class="text-sm font-black">Daily reward</h3>
            <p v-if="player?.claimedToday" class="text-xs opacity-75">
              Claimed for today. Come back tomorrow to grow your streak.
            </p>
            <p v-else-if="player?.nextClaim" class="text-xs opacity-75">
              Today: {{ economy?.currencyGlyph }}{{ player.nextClaim.reward }}
              <template v-if="player.nextClaim.tickets">
                and {{ player.nextClaim.tickets }} free pack
              </template>
              · day {{ player.nextClaim.streak }} of your streak. Every
              {{ economy?.ticketEvery }}th day adds a free pack.
            </p>
            <button
              class="btn btn-primary btn-sm mt-2"
              type="button"
              :disabled="!player || player.claimedToday || state.busy"
              @click="claim"
            >
              {{ player?.claimedToday ? 'Claimed ✓' : 'Claim daily reward' }}
            </button>
          </div>
          <div>
            <h3 class="text-sm font-black">Today's tasks</h3>
            <ul class="space-y-1 text-xs">
              <li
                v-for="task in economy?.tasks ?? []"
                :key="task.key"
                class="flex items-center gap-2"
              >
                <span>{{
                  player?.tasksDone.includes(task.key) ? '✓' : '○'
                }}</span>
                <span class="flex-1">{{ task.label }}</span>
                <span class="opacity-70">
                  +{{ task.reward }} {{ economy?.currencyGlyph }}
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div
          class="tarot-pack-stage grid place-items-center gap-2 rounded-2xl p-4 text-center"
        >
          <div class="kr-pack" aria-hidden="true">
            <span>✦</span>
          </div>
          <p class="text-sm font-black">
            {{ catalog?.title }} · {{ economy?.packSize }}-card pack
          </p>
          <p class="text-xs opacity-75">
            {{
              player?.packTickets
                ? 'Uses a free pack ticket.'
                : `${economy?.packCost} ${economy?.currencyName}. One ${economy?.packFloor} or better in every pack.`
            }}
          </p>
          <button
            class="btn btn-secondary"
            type="button"
            :disabled="!canAffordPack || state.busy"
            @click="openPack"
          >
            {{ state.busy ? 'Opening…' : 'Open a pack' }}
          </button>
          <details class="w-full max-w-sm text-left text-xs">
            <summary class="cursor-pointer opacity-70">Odds per card</summary>
            <ul class="mt-1 space-y-0.5">
              <li
                v-for="row in catalog?.odds ?? []"
                :key="row.rarity"
                class="flex justify-between capitalize"
              >
                <span>{{ row.rarity }} ({{ row.count }} cards)</span>
                <span>{{ row.percent }}%</span>
              </li>
              <li class="opacity-70">
                A legendary is guaranteed within {{ economy?.pityAt }} cards.
                Duplicates refund {{ economy?.currencyName }}. Rewards are
                earned only; nothing here is for sale.
              </li>
            </ul>
          </details>
        </div>
      </div>

      <div v-else-if="view === 'album'">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <select
            v-model="rarityFilter"
            class="select select-bordered select-xs"
            aria-label="Rarity"
          >
            <option value="all">All rarities</option>
            <option
              v-for="row in catalog?.odds ?? []"
              :key="row.rarity"
              :value="row.rarity"
            >
              {{ row.rarity }}
            </option>
          </select>
          <select
            v-model="groupFilter"
            class="select select-bordered select-xs"
            aria-label="Group"
          >
            <option value="all">All groups</option>
            <option v-for="group in groups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
          <span class="ml-auto text-xs opacity-70">
            {{ ownedCount }} of {{ catalog?.cards.length }} found
          </span>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
          <kr-collectible-card
            v-for="card in albumCards"
            :key="card.key"
            :title="card.title"
            :subtitle="card.subtitle"
            :rarity="card.rarity"
            :image-url="artFor(card.key)"
            :locked="!player?.owned[card.key]"
            :count="player?.owned[card.key] ?? 0"
          />
        </div>
      </div>

      <div v-else-if="view === 'backs'">
        <p class="mb-2 text-xs opacity-70">
          {{ player?.backs.length ?? 1 }} of {{ catalog?.backs.length }} backs
          unlocked. Your chosen back appears on every reading.
        </p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
          <button
            v-for="back in catalog?.backs ?? []"
            :key="back.key"
            class="min-w-0 rounded-xl text-left disabled:cursor-not-allowed"
            type="button"
            :disabled="!player?.backs.includes(back.key)"
            :aria-pressed="player?.selectedBack === back.key"
            @click="chooseBack(back.key)"
          >
            <kr-collectible-card
              :title="back.title"
              rarity="back"
              :image-url="artFor(back.key)"
              :locked="!player?.backs.includes(back.key)"
            />
            <span
              v-if="player?.selectedBack === back.key"
              class="badge badge-primary badge-xs mt-1"
            >
              in use
            </span>
            <span class="block text-[10px] opacity-70">{{ back.hint }}</span>
          </button>
        </div>
      </div>

      <ol v-else class="space-y-1 text-xs">
        <li v-if="!player?.history.length" class="opacity-70">
          Nothing pulled yet.
        </li>
        <li
          v-for="entry in player?.history ?? []"
          :key="entry.id"
          class="flex items-center gap-2"
        >
          <span class="w-20 shrink-0 opacity-75">
            {{ new Date(entry.createdAt).toLocaleDateString() }}
          </span>
          <span class="flex-1 truncate font-bold">
            {{ titleFor(entry.itemKey) }}
          </span>
          <span class="capitalize opacity-70">{{ entry.rarity }}</span>
          <span v-if="entry.duplicate" class="opacity-75">
            duplicate +{{ entry.refund }}
          </span>
          <span v-if="entry.source === 'unlock'" class="badge badge-xs">
            unlocked
          </span>
        </li>
      </ol>
    </div>

    <div
      v-if="state.lastPack.length"
      class="fixed inset-0 z-50 grid place-items-center bg-neutral/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pack opening"
    >
      <div class="w-full max-w-3xl rounded-3xl bg-base-100 p-4 shadow-2xl">
        <h3 class="mb-3 text-center text-lg font-black">Your pack</h3>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="(card, index) in state.lastPack"
            :key="`${card.key}-${index}`"
            class="kr-pack-slot min-w-0"
            type="button"
            :class="{ 'is-revealed': index < revealed }"
            :aria-label="index < revealed ? titleFor(card.key) : 'Reveal card'"
            @click="index === revealed ? revealNext() : undefined"
          >
            <kr-collectible-card
              v-if="index < revealed"
              :title="titleFor(card.key)"
              :rarity="card.rarity"
              :image-url="artFor(card.key)"
            />
            <kr-collectible-card v-else title="" rarity="back" locked />
            <span
              v-if="index < revealed && card.duplicate"
              class="block text-center text-[10px] opacity-70"
            >
              duplicate +{{ card.refund }}
            </span>
            <span
              v-else-if="index < revealed"
              class="block text-center text-[10px] font-bold text-success"
            >
              new!
            </span>
          </button>
        </div>
        <p
          v-if="state.newBacks.length && revealed >= state.lastPack.length"
          class="mt-3 text-center text-sm font-bold text-primary"
        >
          New card back unlocked:
          {{ state.newBacks.map(titleFor).join(', ') }}
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <button
            v-if="revealed < state.lastPack.length"
            class="btn btn-primary btn-sm"
            type="button"
            @click="revealNext"
          >
            Reveal next
          </button>
          <button
            v-if="revealed < state.lastPack.length"
            class="btn btn-ghost btn-sm"
            type="button"
            @click="revealAll"
          >
            Reveal all
          </button>
          <button
            v-else
            class="btn btn-primary btn-sm"
            type="button"
            @click="closePack"
          >
            Add to scrapbook
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tarot-pack-stage {
  background:
    radial-gradient(
      ellipse at 50% 30%,
      color-mix(in oklch, var(--color-secondary) 25%, transparent),
      transparent 60%
    ),
    var(--color-base-200);
}

.kr-pack {
  display: grid;
  place-items: center;
  width: 92px;
  aspect-ratio: 2 / 3;
  border-radius: 14px;
  color: var(--color-warning);
  font-size: 2.5rem;
  background:
    repeating-linear-gradient(45deg, #ffffff14 0 3px, transparent 3px 10px),
    linear-gradient(160deg, var(--color-secondary), var(--color-primary));
  box-shadow: 0 10px 30px
    color-mix(in oklch, var(--color-secondary) 40%, transparent);
  animation: kr-pack-bob 3s ease-in-out infinite;
}

.kr-pack-slot.is-revealed {
  animation: kr-pack-pop 0.35s ease-out;
}

@keyframes kr-pack-bob {
  50% {
    transform: translateY(-6px) rotate(-2deg);
  }
}

@keyframes kr-pack-pop {
  from {
    transform: scale(0.85) rotateY(90deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kr-pack,
  .kr-pack-slot.is-revealed {
    animation: none;
  }
}
</style>
