<template>
  <div
    class="kr-surface flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl bg-[#141f24] text-[#f8edce]"
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
          Reveal the world, one square at a time.
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
      class="kr-scroll z-10 max-h-[min(40%,18rem)] shrink-0 border-b border-[#9f875e]/50 bg-[#302b25] p-2 sm:p-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-bold"
          >Choose images for the dungeon matching rooms</span
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
      class="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-hidden p-2 lg:flex-row lg:p-3"
    >
      <div
        class="relative aspect-square h-auto max-h-[64%] w-full max-w-[min(100%,74vh)] shrink-0 overflow-hidden rounded-lg lg:max-h-full border-2 border-[#aa9266] bg-[#253c35] shadow-2xl"
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
              v-if="world.state.revealed.includes(tile.key)"
              type="button"
              class="group relative h-full w-full outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[#fff0a9]"
              :class="world.state.player === tile.key ? 'bg-yellow-200/10' : ''"
              :aria-label="`Travel to square ${tile.x}, ${tile.y}${sites[tile.key] ? ', ' + sites[tile.key].name : ''}`"
              @click="world.walk(tile.key)"
            >
              <span
                v-if="sites[tile.key]"
                class="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#162522]/75 px-0.5 text-[clamp(11px,1.7vw,24px)] leading-tight shadow-lg"
                :title="sites[tile.key].name"
              >
                {{ siteSymbol(sites[tile.key].kind) }}
              </span>
              <span
                v-if="world.state.player === tile.key"
                class="absolute bottom-0.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#f3d177] px-1 text-[clamp(10px,1.5vw,18px)] leading-tight text-[#1b2c22] shadow"
                aria-hidden="true"
                >🧭</span
              >
            </button>
            <button
              v-else-if="world.state.frontier.includes(tile.key)"
              type="button"
              class="group flex h-full w-full items-center justify-center border border-[#b29b6b]/60 bg-[#252f3b]/95 text-base text-[#e8c88f] shadow-inner transition hover:bg-[#46546a] focus-visible:outline-2 focus-visible:outline-[#fff0a9] sm:text-2xl"
              :aria-label="`Reveal square ${tile.x}, ${tile.y}`"
              @click="world.reveal(tile.key)"
            >
              <span class="group-hover:scale-110" aria-hidden="true">✧</span>
            </button>
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
          {{ world.state.revealed.length }}/64 revealed ·
          {{ world.state.frontier.length }} available
        </div>
      </div>

      <aside
        class="w-full min-h-0 max-h-[34%] shrink-0 overflow-y-auto rounded-xl border border-[#b69961] bg-[#f1dfba]/95 p-3 text-[#322819] shadow-xl backdrop-blur-sm lg:max-h-[calc(100%-1rem)] lg:w-64"
      >
        <h3 class="mb-1 text-base font-black">
          {{ world.selectedSite?.name ?? 'The Crooked Trail' }}
        </h3>
        <p class="text-xs leading-relaxed">{{ world.state.status }}</p>

        <div v-if="world.selectedSite" class="mt-3 flex flex-wrap gap-1.5">
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
          class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#bda47b] pt-2 text-xs font-semibold"
        >
          <span>🌼 {{ world.state.wildflowers }}</span>
          <span>🏮 {{ world.state.lanterns }}</span>
          <span>🔔 {{ world.hasChime ? 'Chime found' : 'Chime missing' }}</span>
        </div>
        <p class="mt-2 text-[11px] leading-snug text-[#675536]">
          Explore a glowing square; tap a revealed square to return along known
          trails. The sealed sigil's partner appears in a later region.
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
      <div
        class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3"
      >
        <div
          class="grid aspect-square max-h-full w-full max-w-[min(100%,65vh)] grid-cols-4 gap-2 sm:gap-3"
        >
          <button
            v-for="card in world.state.cards"
            :key="card.id"
            type="button"
            class="relative aspect-square min-h-0 min-w-0 overflow-hidden rounded-xl border-2 border-[#c1a56f] shadow-xl transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white"
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
            <img
              v-if="card.flipped || card.matched"
              :src="card.image"
              class="h-full w-full object-cover"
              alt="Selected gallery art"
              draggable="false"
            />
            <span
              v-else
              class="flex h-full w-full items-center justify-center bg-[#29384b] text-3xl text-[#dec28a]"
              aria-hidden="true"
              >✦</span
            >
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
import { onMounted, ref } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import {
  BRIAR_SITES,
  BRIAR_TILES,
  type BriarSiteKind,
} from '~/utils/memoryDungeonWorld'
import MemoryDungeonDeckSelector from '~/components/memory-dungeon/deck-selector.vue'

const emit = defineEmits<{ leave: [] }>()
const world = useMemoryWorldStore()
const tiles = BRIAR_TILES
const sites = BRIAR_SITES
const settingsOpen = ref(false)

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

function siteSymbol(kind: BriarSiteKind): string {
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
  return icons[kind]
}

onMounted(() => world.hydrate())
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
