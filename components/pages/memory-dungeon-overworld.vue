<template>
  <div
    class="kr-surface relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl bg-[#141f24] text-[#f8edce]"
  >
    <header
      class="flex shrink-0 items-center gap-2 border-b border-[#a98b5b]/40 bg-[#302b25] px-2 py-2 sm:gap-3 sm:px-4"
    >
      <span class="shrink-0 text-xl" aria-hidden="true">🌿</span>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-sm font-black tracking-tight sm:text-lg">
          Memory Dungeon
          <span class="font-normal text-[#d1c19c]">/ Briar Camp</span>
        </h2>
        <p class="hidden text-xs text-[#d1c19c] sm:block">
          Remember matching pictures to reveal the world.
        </p>
      </div>
      <span
        class="shrink-0 rounded-lg bg-[#1c201d] px-2 py-1 text-xs font-bold tabular-nums sm:px-3"
      >
        Attempts {{ world.state.attempts }}
      </span>
      <span
        class="shrink-0 text-xs"
        :aria-label="`${world.state.hearts} hearts`"
      >
        ❤️ {{ world.state.hearts }}
      </span>
      <button
        type="button"
        class="rounded-lg border border-[#9f875e] p-2 text-xs hover:bg-[#514b3d]"
        aria-label="Choose gallery and game settings"
        @click="settingsOpen = !settingsOpen"
      >
        ⚙️
      </button>
      <button
        type="button"
        class="rounded-lg border border-[#9f875e] px-2 py-2 text-xs hover:bg-[#514b3d]"
        @click="emit('leave')"
      >
        Menu
      </button>
    </header>

    <div
      v-if="settingsOpen"
      role="dialog"
      aria-label="Choose Memory Dungeon artwork"
      class="kr-scroll absolute right-2 top-14 z-50 max-h-[min(80dvh,42rem)] w-[min(94vw,46rem)] overflow-y-auto overscroll-contain rounded-xl border-2 border-[#9f875e] bg-[#302b25]/98 p-3 shadow-2xl sm:p-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-bold"
          >Artwork for the current map and dungeon rooms</span
        >
        <button
          type="button"
          class="rounded border border-[#9f875e] px-2 py-1 text-xs"
          @click="settingsOpen = false"
        >
          Close
        </button>
      </div>
      <memory-dungeon-deck-selector
        :selected="world.deck"
        :mature-available="world.matureAvailable"
        @change="world.selectDeck"
      />
      <p class="mt-2 text-xs text-[#e7d29e]">
        Selecting art refreshes unmatched cards immediately. Revealed terrain,
        completed pairs and attempts stay intact.
      </p>
      <p
        v-if="world.loading && world.mapMatching"
        role="status"
        class="mt-2 text-xs font-bold text-[#ffe09b]"
      >
        Loading images from the selected collection…
      </p>
      <p
        v-if="world.mapDeckError"
        role="alert"
        class="mt-2 rounded-lg border border-[#eead8c] bg-[#5c2826] p-2 text-sm font-semibold text-[#fff0d9]"
      >
        {{ world.mapDeckError }}
      </p>
      <button
        v-if="
          world.mapMatching && (world.deckNeedsRefresh || world.mapDeckError)
        "
        type="button"
        class="md-btn mt-2"
        :disabled="world.loading"
        @click="world.refreshMapDeck()"
      >
        Retry applying selected art
      </button>
      <button
        type="button"
        class="mt-1 rounded border border-[#9f875e] px-2 py-1 text-xs hover:bg-[#514b3d]"
        @click="restart"
      >
        Begin a new overworld run
      </button>
    </div>

    <div
      v-if="world.state.room === 'map'"
      class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-hidden p-2 xl:flex-row xl:p-3"
    >
      <div
        class="relative aspect-square min-h-0 shrink-0 overflow-hidden rounded-lg border-2 border-[#aa9266] bg-[#253c35] shadow-2xl"
        :class="
          world.mapMatching
            ? 'w-[min(100%,47dvh)] xl:w-[min(56%,72dvh)]'
            : 'w-[min(100%,34dvh)] xl:w-[min(48%,66dvh)]'
        "
      >
        <div
          class="absolute inset-0 bg-cover bg-center"
          style="background-image: url('/memory-dungeon/briar-camp.svg')"
          role="img"
          aria-label="Briar Camp: an illustrated woodland with stone paths, a bridge, ferns and a river. Individual locations are discovered through the overlay."
        ></div>
        <div class="absolute inset-0 grid grid-cols-8 grid-rows-8">
          <div
            v-for="tile in tiles"
            :key="tile.key"
            class="relative min-h-0 min-w-0"
          >
            <button
              v-if="
                world.mapMatching &&
                world.mapCardAt(tile.key) &&
                !world.state.revealed.includes(tile.key)
              "
              type="button"
              class="md-card-container relative h-full w-full border border-[#bba16e]/75 focus-visible:outline-2 focus-visible:outline-[#fff0a9]"
              :disabled="
                world.turnLocked ||
                world.loading ||
                world.deckNeedsRefresh ||
                !!world.mapDeckError ||
                world.mapCardAt(tile.key)?.flipped
              "
              :aria-label="
                world.mapCardAt(tile.key)?.flipped
                  ? 'Revealed memory picture; find its matching twin'
                  : 'Flip map memory card'
              "
              @click="world.pickMapCard(tile.key)"
            >
              <span
                class="md-card-inner"
                :class="{ flipped: world.mapCardAt(tile.key)?.flipped }"
              >
                <span
                  class="md-card-back flex items-center justify-center bg-[#263951] text-[clamp(14px,2vw,28px)] text-[#e4cf9c]"
                  aria-hidden="true"
                  >✥</span
                >
                <img
                  class="md-card-front h-full w-full bg-[#162733]"
                  :src="world.mapCardAt(tile.key)?.image"
                  alt="Picture to match"
                  draggable="false"
                />
              </span>
            </button>
            <button
              v-else-if="world.state.revealed.includes(tile.key)"
              type="button"
              class="group relative h-full w-full outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[#fff0a9]"
              :class="world.state.player === tile.key ? 'bg-yellow-200/10' : ''"
              :aria-label="`Travel to square ${tile.x}, ${tile.y}${sites[tile.key]?.name ? ', ' + sites[tile.key]?.name : ''}`"
              @click="world.walk(tile.key)"
            >
              <span
                v-if="sites[tile.key]"
                class="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#162522]/75 px-0.5 text-[clamp(11px,1.7vw,24px)] leading-tight shadow-lg"
                :title="sites[tile.key]?.name"
              >
                {{ siteSymbol(sites[tile.key]?.kind) }}
              </span>
              <span
                v-if="world.state.player === tile.key"
                class="absolute bottom-0.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#f3d177] px-1 text-[clamp(10px,1.5vw,18px)] leading-tight text-[#1b2c22] shadow"
                aria-hidden="true"
                >🧭</span
              >
            </button>
            <div
              v-else-if="crossMapKeys.includes(tile.key)"
              class="relative h-full w-full border border-[#a98b5b]/50 bg-[#28283f]/95"
            >
              <button
                v-if="world.state.waveIndex === 3 && !world.mapMatching"
                type="button"
                class="h-full w-full overflow-hidden rounded border border-amber-200/80 shadow-inner focus-visible:outline-2 focus-visible:outline-white"
                :aria-label="`Examine cross-world sigil: ${crossMapPuzzles[tile.key]?.title ?? 'Mystery'}`"
                @click="world.examineCrossMapSigil(tile.key)"
              >
                <img
                  :src="crossMapImage(tile.key)"
                  alt="A unique cross-world memory sigil"
                  class="h-full w-full object-cover"
                />
                <span
                  class="absolute bottom-0 right-0 rounded bg-[#201a2f] px-0.5 text-[11px]"
                  aria-hidden="true"
                  >🔒</span
                >
              </button>
              <span
                v-else
                class="flex h-full items-center justify-center text-sm text-[#c5b28a]/50"
                aria-label="A mysterious unrevealed seal awaits"
                >✧</span
              >
            </div>
            <div
              v-else
              class="h-full w-full border border-[#a99877]/20 bg-[#202935]/[0.98]"
              aria-hidden="true"
            >
              <span
                class="flex h-full items-center justify-center text-[clamp(8px,1.4vw,18px)] text-[#b29c76]/20"
                >✦</span
              >
            </div>
          </div>
        </div>
        <div
          class="pointer-events-none absolute bottom-1 left-2 rounded-md bg-[#1d2a24]/90 px-2 py-1 text-[10px] font-bold text-[#f5e7c7]"
        >
          {{ world.state.revealed.length }}/60 paired squares · 4 cross-region
          seals
        </div>
      </div>

      <aside
        class="kr-scroll min-h-0 w-full flex-1 overflow-y-auto rounded-xl border border-[#b69961] bg-[#f1dfba]/95 text-[#322819] shadow-xl backdrop-blur-sm"
        :class="
          world.mapMatching
            ? 'p-3 sm:p-4 xl:max-h-full xl:min-w-[17rem] xl:p-5'
            : 'p-4 sm:p-6 xl:max-h-full xl:min-w-[20rem] xl:p-7'
        "
      >
        <div
          class="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-[#735128]"
        >
          <span>Round {{ world.state.waveIndex + 1 }}/4</span>
          <span v-if="world.mapMatching"
            >Pairs {{ world.mapPairsMatched }}/{{ world.waveSize / 2 }}</span
          >
          <span v-else>Explore the map</span>
        </div>
        <button
          v-if="world.mapMatching && !world.state.mapCards.length"
          type="button"
          class="md-btn mb-2 w-full"
          :disabled="world.loading"
          @click="world.prepareWave()"
        >
          {{
            world.loading
              ? 'Preparing picture cards…'
              : 'Retry loading picture cards'
          }}
        </button>
        <button
          v-if="!world.mapMatching && world.state.waveIndex < 3"
          type="button"
          class="md-btn mb-2 w-full"
          :disabled="world.loading"
          @click="world.nextWave()"
        >
          Begin next memory round · {{ nextWaveCount }} cards
        </button>
        <div
          v-if="!world.mapMatching"
          class="mb-4 flex items-center gap-4 rounded-xl border border-[#d7bb80]/70 bg-[#f8ebd2] p-3"
        >
          <div
            class="flex size-20 shrink-0 items-center justify-center rounded-xl bg-[#27463f] text-5xl shadow-inner sm:size-24 sm:text-6xl"
            aria-hidden="true"
          >
            {{ siteSymbol(world.selectedSite?.kind) || '🧭' }}
          </div>
          <div class="min-w-0">
            <p
              class="text-sm font-bold uppercase tracking-widest text-[#906f41]"
            >
              Current location
            </p>
            <p class="font-serif text-xl font-black sm:text-2xl">
              {{ world.selectedSite?.name ?? 'The Crooked Trail' }}
            </p>
          </div>
        </div>
        <h3 class="mb-2 font-serif text-xl font-black sm:text-2xl">
          {{
            world.mapMatching
              ? 'The Whispering Fog'
              : (world.selectedSite?.name ?? 'The Crooked Trail')
          }}
        </h3>
        <p class="text-sm leading-relaxed sm:text-base">
          {{ world.state.status }}
        </p>
        <p
          v-if="world.mapDeckError"
          role="alert"
          class="mt-3 rounded-lg border border-[#bd6651] bg-[#fbe5da] p-3 text-sm font-bold text-[#682821]"
        >
          {{ world.mapDeckError }}
        </p>
        <button
          v-if="world.mapMatching && world.deckNeedsRefresh && !world.loading"
          class="md-btn mt-3"
          type="button"
          @click="world.refreshMapDeck()"
        >
          Retry loading selected gallery
        </button>

        <div
          v-if="world.selectedSite && !world.mapMatching"
          class="mt-5 flex flex-wrap gap-3"
        >
          <button
            v-if="world.selectedSite.kind === 'merchant'"
            type="button"
            class="md-btn"
            :disabled="world.state.wildflowers < 1"
            @click="world.buyLantern()"
          >
            Buy Lantern (1 🌼)
          </button>
          <button
            v-if="
              world.selectedSite.kind === 'chest' &&
              !world.state.chestClaims.includes(world.state.player)
            "
            type="button"
            class="md-btn"
            @click="world.claimChest()"
          >
            Open chest
          </button>
          <span
            v-if="
              world.selectedSite.kind === 'chest' &&
              world.state.chestClaims.includes(world.state.player)
            "
            class="text-xs font-bold"
            >✓ Chest claimed</span
          >
          <button
            v-if="world.selectedSite.kind === 'dungeon'"
            type="button"
            class="md-btn"
            :disabled="world.loading"
            @click="world.startEncounter('dungeon')"
          >
            {{ world.loading ? 'Loading gallery…' : 'Enter Rootbound Vault' }}
          </button>
          <button
            v-if="
              world.selectedSite.kind === 'enemy' &&
              !world.state.completedEncounters.includes(world.state.player)
            "
            type="button"
            class="md-btn"
            :disabled="world.loading"
            @click="
              world.startEncounter(
                world.state.player === '5,5' ? 'sprite' : 'patrol',
              )
            "
          >
            {{ world.loading ? 'Loading…' : 'Accept memory duel' }}
          </button>
          <button
            v-if="
              world.selectedSite.kind === 'gate' &&
              world.hasChime &&
              !world.state.gateOpened
            "
            type="button"
            class="md-btn"
            @click="world.openGate()"
          >
            Ring Bramble Chime
          </button>
          <span
            v-if="world.selectedSite.kind === 'gate' && world.state.gateOpened"
            class="text-xs font-bold"
            >✓ Briar Camp cleared</span
          >
          <template
            v-if="
              world.selectedSite.kind === 'puzzle' && !world.state.puzzleSolved
            "
          >
            <button
              type="button"
              class="md-btn"
              @click="world.enterRune('leaf')"
            >
              🍃 Leaf
            </button>
            <button
              type="button"
              class="md-btn"
              @click="world.enterRune('sun')"
            >
              ☀️ Sun
            </button>
            <span class="w-full text-xs"
              >{{ world.runeInput.length }}/3 runes</span
            >
          </template>
          <span
            v-if="
              world.selectedSite.kind === 'puzzle' && world.state.puzzleSolved
            "
            class="text-xs font-bold"
            >✓ Stones solved</span
          >
        </div>

        <div
          class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#bda47b] pt-3 text-sm font-semibold"
        >
          <span>🌼 {{ world.state.wildflowers }}</span>
          <span>🏮 {{ world.state.lanterns }}</span>
          <span>🔔 {{ world.hasChime ? 'Chime found' : 'Chime missing' }}</span>
        </div>
        <p class="mt-3 text-xs leading-relaxed text-[#675536] sm:text-sm">
          Matched picture pairs uncover two terrain squares. After each round,
          explore the cleared paths, meet characters and claim treasure. Four
          near-matching sigils link future world maps.
        </p>
      </aside>
    </div>

    <div
      v-else
      class="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#536b4e,#1b242b_75%)] p-3"
    >
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-lg font-black">{{ roomTitle }}</h3>
          <p class="text-xs text-[#dccca9]">{{ world.state.status }}</p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!world.state.combat"
            type="button"
            class="rounded-lg border border-[#c4aa72] bg-[#342e2a] px-3 py-2 text-xs font-bold"
            :disabled="world.turnLocked"
            @click="world.peekPair()"
          >
            🏮 Peek ({{ world.state.lanterns }})
          </button>
          <button
            type="button"
            class="rounded-lg border border-[#c4aa72] bg-[#342e2a] px-3 py-2 text-xs font-bold"
            @click="world.leaveRoom()"
          >
            Retreat to map
          </button>
        </div>
      </div>
      <template v-if="world.state.combat">
        <memory-dungeon-combat-board class="mt-2" />
        <button
          v-if="world.roomComplete"
          type="button"
          :disabled="world.turnLocked || world.loading"
          class="mx-auto mt-2 shrink-0 rounded-lg bg-[#f2d68f] px-4 py-2 font-black text-[#2b271b]"
          @click="world.finishRoom()"
        >
          Claim victory ✓
        </button>
      </template>
      <div
        v-else
        class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3"
      >
        <div
          class="grid aspect-square max-h-full w-full max-w-[min(100%,65vh)] grid-cols-4 gap-2 sm:gap-3"
        >
          <button
            v-for="card in world.state.cards"
            :key="card.id"
            type="button"
            class="md-card-container relative aspect-square min-h-0 min-w-0 overflow-hidden rounded-xl border-2 border-[#c1a56f] shadow-xl hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white"
            :class="card.matched ? 'border-[#b6dc88] opacity-65' : ''"
            :disabled="
              card.flipped ||
              card.matched ||
              world.turnLocked ||
              world.roomComplete
            "
            :aria-label="
              card.flipped || card.matched
                ? 'Revealed gallery image'
                : 'Reveal memory image'
            "
            @click="world.pickCard(card.id)"
          >
            <span
              class="md-card-inner"
              :class="{ flipped: card.flipped || card.matched }"
            >
              <span
                class="md-card-back bg-[#29384b] text-3xl text-[#dec28a]"
                aria-hidden="true"
                >✦</span
              >
              <img
                class="md-card-front"
                :src="card.image"
                alt="Selected gallery art"
                draggable="false"
              />
            </span>
          </button>
        </div>
        <div
          class="flex shrink-0 items-center gap-4 rounded-lg bg-[#172120]/85 px-4 py-2 text-sm"
        >
          <span
            >Pairs {{ world.matchedPairs }}/{{
              world.state.cards.length / 2
            }}</span
          >
          <span>Mistakes {{ world.state.roomMisses }}/3</span>
          <button
            v-if="world.roomComplete"
            type="button"
            :disabled="world.turnLocked || world.loading"
            class="rounded-lg bg-[#f2d68f] px-3 py-2 font-black text-[#2b271b]"
            @click="world.finishRoom()"
          >
            {{
              world.state.roomId === 'vault-1'
                ? 'Continue deeper →'
                : 'Claim victory ✓'
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import {
  BRIAR_SITES,
  BRIAR_TILES,
  type BriarSiteKind,
} from '~/utils/memoryDungeonWorld'
import {
  BRIAR_CROSS_MAP_KEYS,
  BRIAR_CROSS_MAP_PUZZLES,
  BRIAR_WAVE_SIZES,
} from '~/utils/memoryDungeonWaves'
import { DESIGNED_DUNGEON_ART } from '~/utils/memoryDungeonDeck'
import MemoryDungeonDeckSelector from '~/components/memory-dungeon/deck-selector.vue'
import MemoryDungeonCombatBoard from '~/components/memory-dungeon/combat-board.vue'

const emit = defineEmits<{ leave: [] }>()
const world = useMemoryWorldStore()
const tiles = BRIAR_TILES
const crossMapKeys: readonly string[] = BRIAR_CROSS_MAP_KEYS
const crossMapPuzzles: Record<string, { hint: string; title: string }> =
  BRIAR_CROSS_MAP_PUZZLES
const nextWaveCount = computed(
  () => BRIAR_WAVE_SIZES[world.state.waveIndex + 1] ?? 0,
)
function crossMapImage(key: string): string {
  const index = BRIAR_CROSS_MAP_KEYS.indexOf(
    key as (typeof BRIAR_CROSS_MAP_KEYS)[number],
  )
  return DESIGNED_DUNGEON_ART[30 + index]?.imagePath ?? ''
}
const sites = BRIAR_SITES
const settingsOpen = ref(false)
const roomTitle = computed(() =>
  world.state.roomId === 'vault-1'
    ? 'Rootbound Vault · Echo Chamber'
    : world.state.roomId === 'vault-2'
      ? 'Rootbound Vault · The Warden'
      : 'Forest Memory Duel',
)

function restart(): void {
  if (
    window.confirm(
      'Start a new Briar Camp run? This resets your exploration and match-attempt counter.',
    )
  ) {
    world.reset()
    settingsOpen.value = false
  }
}

function siteSymbol(kind: BriarSiteKind | undefined): string {
  const icons: Record<BriarSiteKind, string> = {
    camp: '⛺',
    merchant: '🏡',
    dungeon: '🏰',
    chest: '🎁',
    puzzle: '✨',
    sealed: '🔒',
    enemy: '⚔️',
    gate: '🌿',
    rune: '🪨',
  }
  return kind ? icons[kind] : ''
}

onMounted(() => {
  world.hydrate()
  void world.syncActiveMapDeck()
})
</script>

<style scoped>
.md-btn {
  border: 1px solid #927043;
  border-radius: 0.5rem;
  background: #4a5b36;
  padding: 0.5rem 0.7rem;
  color: #fff4da;
  font-size: 0.75rem;
  font-weight: 700;
}
.md-btn:hover:not(:disabled) {
  background: #617746;
}
.md-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
