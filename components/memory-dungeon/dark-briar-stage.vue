<template>
  <section
    class="md-dark-stage flex min-h-0 flex-1 flex-col overflow-hidden bg-[#111821] text-[#f5e5ca]"
    aria-label="The other Briar Marches"
    data-testid="dark-briar-stage"
  >
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#9674a7]/45 bg-[#2e2338] px-3 py-2"
    >
      <div class="min-w-0">
        <p
          class="truncate font-serif text-base font-black tracking-wide sm:text-xl"
        >
          The Other Marches
        </p>
        <p class="text-[11px] text-[#dfc8e8]">
          Familiar roads. Different witnesses.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="rounded-md bg-black/40 px-2 py-1 text-xs font-semibold">
          {{
            world.darkMatching
              ? `Round ${world.dark.waveIndex + 1}/4 · Pairs ${world.darkPairsMatched}/8`
              : `${decisions}/60 encounters · ${world.dark.sealInspections.length}/4 seals`
          }}
        </span>
        <button
          type="button"
          class="rounded-lg border border-[#d5a5dc]/70 px-2.5 py-1.5 text-xs font-bold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          @click="world.returnToBriar()"
        >
          Return to Briar
        </button>
      </div>
    </div>

    <memory-dungeon-dark-house-stage
      v-if="world.darkHouseOpen"
      class="min-h-0 flex-1"
    />
    <div
      v-else
      class="md-dark-layout grid min-h-0 flex-1 grid-cols-1 gap-2 p-2"
    >
      <div
        class="relative grid min-h-0 place-items-center overflow-hidden rounded-xl border-2 border-[#886c9e] bg-[#171a2c] p-2 shadow-2xl"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-cover bg-center opacity-60"
          style="
            background-image: url('/memory-dungeon/briar-camp.svg');
            filter: grayscale(0.85) hue-rotate(160deg) brightness(0.45);
          "
          aria-hidden="true"
        ></div>
        <div
          class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_25%,#080b18dc_95%)]"
          aria-hidden="true"
        ></div>
        <div
          v-if="world.darkMatching"
          class="relative grid aspect-square max-h-full w-full max-w-[min(100%,70vh)] grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2"
          aria-label="Sixteen memory pictures in the current Dark Briar reveal round"
        >
          <button
            v-for="card in world.dark.mapCards"
            :key="card.tile"
            type="button"
            class="group relative min-h-0 min-w-0 overflow-hidden rounded-lg border-2 border-[#c4a8dc] bg-[#312846] shadow-xl transition focus-visible:outline-2 focus-visible:outline-white"
            :class="
              card.matched
                ? 'border-emerald-300 bg-[#2b4039]'
                : 'hover:border-[#f6d39e]'
            "
            :disabled="
              card.matched ||
              card.flipped ||
              world.darkTurnLocked ||
              world.darkLoading
            "
            :aria-label="
              card.matched
                ? 'Paired memory found'
                : card.flipped
                  ? 'Memory face revealed'
                  : 'Turn over a memory picture'
            "
            @click="world.darkPickCard(card.tile)"
          >
            <img
              v-if="card.flipped || card.matched"
              :src="card.image"
              alt="Memory card illustration"
              class="h-full w-full object-cover"
              draggable="false"
            />
            <span
              v-else
              class="flex h-full w-full items-center justify-center bg-[radial-gradient(circle,#5c4272,#1c1b33)] text-2xl text-[#e8c6ff]"
              aria-hidden="true"
              >✥</span
            >
            <span
              v-if="card.matched"
              class="absolute bottom-0 right-0 rounded-tl bg-emerald-900/90 px-1 text-xs font-black"
              aria-hidden="true"
              >✓</span
            >
          </button>
          <div
            v-if="world.darkLoading || !world.dark.mapCards.length"
            class="absolute inset-0 grid place-items-center rounded-lg bg-[#181629]/95 p-4"
          >
            <button
              type="button"
              class="rounded-lg border border-[#caa7e6] bg-[#594167] px-4 py-3 font-bold"
              :disabled="world.darkLoading"
              @click="world.prepareDarkDeck()"
            >
              {{
                world.darkLoading
                  ? 'Restoring the reflected cards…'
                  : 'Reveal the reflected cards'
              }}
            </button>
          </div>
        </div>
        <div
          v-else
          class="relative grid aspect-square max-h-full w-full max-w-[min(100%,70vh)] grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border-2 border-[#af91bc] bg-[#151c24]/50 shadow-2xl"
          aria-label="Mirrored eight by eight Briar map"
        >
          <div v-for="tile in tiles" :key="tile.key" class="min-h-0 min-w-0">
            <button
              v-if="world.dark.revealed.includes(tile.key)"
              type="button"
              class="relative grid h-full w-full place-items-center border border-[#b3a1c0]/30 text-[clamp(10px,1.7vw,22px)] transition hover:bg-purple-200/25 focus-visible:outline-2 focus-visible:outline-white"
              :class="{
                'bg-[#f7c47e]/45 outline outline-2 outline-[#ffe7b9]':
                  world.dark.player === tile.key,
                'bg-emerald-500/20':
                  world.dark.sceneChoices[tile.key] ||
                  world.dark.sealInspections.includes(tile.key),
                'bg-violet-500/30':
                  darkSeals[tile.key] &&
                  !world.dark.sealInspections.includes(tile.key),
                'bg-purple-300/20':
                  !world.dark.sceneChoices[tile.key] &&
                  world.dark.player !== tile.key,
              }"
              :aria-label="`${darkScenes[tile.key]?.title ?? darkSeals[tile.key]?.title}; ${darkSeals[tile.key] ? (world.dark.sealInspections.includes(tile.key) ? 'seal inspected' : 'inspectable cross-world seal') : world.dark.sceneChoices[tile.key] ? 'decision remembered' : 'unresolved'}; square ${tile.x}, ${tile.y}`"
              :disabled="
                !darkBriarCanTravel(
                  world.dark.player,
                  tile.key,
                  world.dark.revealed,
                  world.dark,
                )
              "
              @click="world.darkWalk(tile.key)"
            >
              <span aria-hidden="true">{{
                darkSeals[tile.key]
                  ? '✧'
                  : tile.key === '6,2'
                    ? '♜'
                    : tile.key === '2,4'
                      ? '♧'
                      : tile.key === '4,4'
                        ? '♛'
                        : tile.key === '4,3'
                          ? '⚒'
                          : '✦'
              }}</span>
              <span
                v-if="
                  world.dark.sceneChoices[tile.key] ||
                  world.dark.sealInspections.includes(tile.key)
                "
                class="absolute bottom-0 right-0 rounded-tl bg-[#163d35] px-0.5 text-[9px] font-black"
                aria-hidden="true"
                >✓</span
              >
            </button>
            <div
              v-else
              class="h-full w-full border border-[#827391]/20 bg-[#050b15]/75"
              aria-hidden="true"
            ></div>
          </div>
        </div>
      </div>

      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#bc9ac5] bg-[#e6d5d0] text-[#29202e] shadow-xl"
        aria-label="Mirrored story encounter"
      >
        <div
          class="relative h-[35%] min-h-[70px] shrink-0 overflow-hidden border-b border-[#ac8cae] bg-[#29263d] sm:h-[42%]"
        >
          <img
            v-if="!artFailed"
            :key="illustrationPath"
            :src="illustrationPath"
            :alt="`Illustration of ${scene?.title ?? seal?.title ?? 'the other forest'}`"
            class="absolute inset-0 h-full w-full object-cover"
            draggable="false"
            @error="artFailed = true"
          />
          <div
            v-else
            class="absolute inset-0 bg-cover"
            :style="sceneStyle"
            role="img"
            :aria-label="`Illustration unavailable for ${scene?.title ?? seal?.title ?? 'the other forest'}`"
          ></div>
          <div
            class="absolute inset-0 bg-gradient-to-t from-[#15131ee8] to-transparent"
          ></div>
          <p
            class="absolute bottom-2 left-3 font-serif text-xl font-black text-[#fff0d6] drop-shadow-lg sm:text-2xl"
          >
            {{ scene?.title ?? seal?.title ?? 'A Memory Out of Place' }}
          </p>
        </div>
        <div
          class="kr-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 sm:p-4"
        >
          <p
            class="text-[10px] font-black uppercase tracking-[0.18em] text-[#72517c]"
          >
            {{
              world.darkMatching
                ? 'Find the matching memories'
                : seal
                  ? 'Cross-world seal · future puzzle'
                  : 'Encounter · The Other Marches'
            }}
          </p>
          <p
            class="text-sm leading-relaxed sm:text-base"
            data-testid="dark-briar-scene-copy"
          >
            {{ world.darkMatching ? world.dark.status : world.darkCurrentText }}
          </p>
          <p
            v-if="!world.darkMatching && !seal && world.darkPhysicalConsequence"
            class="rounded-md border border-amber-700/40 bg-[#f7ecdf] px-2 py-1.5 text-xs font-semibold"
            data-testid="dark-briar-custody-world-change"
          >
            {{ world.darkPhysicalConsequence }}
          </p>
          <div
            v-if="!world.darkMatching && !seal && world.darkCallbacks.length"
            class="flex flex-col gap-1.5 border-l-2 border-[#926ca0] pl-2"
            data-testid="dark-briar-earned-callbacks"
          >
            <p
              v-for="callback in world.darkCallbacks"
              :key="callback"
              class="text-xs italic leading-relaxed"
            >
              {{ callback }}
            </p>
          </div>
          <button
            v-if="!world.darkMatching && world.dark.waveIndex < 3"
            type="button"
            class="shrink-0 rounded-lg border border-[#694779] bg-[#514062] px-3 py-2 text-sm font-bold text-white hover:bg-[#6b5084] focus-visible:outline-2 focus-visible:outline-[#271a38]"
            :disabled="world.darkLoading"
            data-testid="dark-briar-next-wave"
            @click="world.nextDarkWave()"
          >
            Reveal another ring of the forest · 16 cards
          </button>
          <p
            v-if="!world.darkMatching"
            class="text-xs font-semibold text-[#5e4a68]"
          >
            {{ world.dark.revealed.length }}/64 landmarks revealed ·
            {{ decisions }}/60 encounters ·
            {{ world.dark.sealInspections.length }}/4 seals ·
            {{ witnessCount }}/8 House witnesses
          </p>
          <button
            v-if="
              !world.darkMatching &&
              seal &&
              !world.dark.sealInspections.includes(world.dark.player)
            "
            type="button"
            data-testid="dark-briar-inspect-seal"
            class="rounded-lg border border-violet-600 bg-[#49305e] px-3 py-2 font-bold text-white"
            @click="world.darkInspectSeal(world.dark.player)"
          >
            Record {{ seal.title }} in the cross-world Chronicle
          </button>
          <p
            v-if="
              !world.darkMatching &&
              seal &&
              world.dark.sealInspections.includes(world.dark.player)
            "
            class="rounded-lg border border-emerald-600/50 bg-emerald-100 p-2 text-xs text-[#244b38]"
            data-testid="dark-briar-seal-recorded"
          >
            ✧ Mirrored seal identified. {{ seal.hint }} The paired solution
            remains in a later world.
          </p>
          <p v-if="!world.darkMatching && seal" class="text-xs font-semibold">
            First-world seals: {{ world.crossMapDiscovery.identified }}/4
            identified, {{ world.crossMapDiscovery.originalInspected }}/4
            inspected in original Briar.
          </p>
          <button
            v-if="!world.darkMatching && world.canEnterDarkHouseAtCamp"
            type="button"
            data-testid="dark-house-enter"
            class="rounded-lg border border-[#8a68a6] bg-[#443158] px-3 py-2 font-bold text-white"
            @click="world.enterDarkHouse()"
          >
            Enter the Unremembered House · 36 rooms
          </button>
          <p
            v-if="world.darkDeckError"
            role="alert"
            class="rounded-lg bg-[#ffe5dc] p-2 text-sm font-bold text-[#79392c]"
          >
            {{ world.darkDeckError }}
          </p>
          <p
            v-if="
              !world.darkMatching &&
              world.dark.player === '6,2' &&
              !darkBriarCanChoose(world.dark, world.dark.player) &&
              !world.dark.completed
            "
            class="rounded-lg border border-[#805c8d] bg-[#f7edff] p-2 text-sm"
          >
            The Warden will not hear a verdict yet. The whole forest must
            emerge, and all eight witness accounts must be collected.
            {{ witnessCount }}/8 accounts remembered.
          </p>
          <div
            v-if="
              !world.darkMatching &&
              scene &&
              !world.dark.sceneChoices[world.dark.player]
            "
            class="flex flex-wrap items-start gap-2 pt-1"
            data-testid="dark-briar-choices"
          >
            <button
              v-for="choice in scene.choices"
              :key="choice.id"
              type="button"
              class="rounded-lg border border-[#563462] bg-[#43314f] px-3 py-2 text-left text-sm font-bold text-[#fff0d9] hover:bg-[#654674] disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-[#271a38]"
              :disabled="!darkBriarCanChoose(world.dark, world.dark.player)"
              @click="world.darkChooseScene(choice.id)"
            >
              {{ choice.label }}
            </button>
          </div>
          <p
            v-else-if="
              !world.darkMatching && world.dark.sceneChoices[world.dark.player]
            "
            class="text-xs font-black text-[#315744]"
          >
            ✓ Your decision is remembered, even if this reality changes again.
          </p>
          <div
            v-if="!world.darkMatching && duel"
            class="flex flex-wrap items-center gap-2 pt-1"
            data-testid="dark-briar-duel"
          >
            <button
              v-if="!world.dark.duels.includes(duel.key)"
              type="button"
              class="rounded-lg border border-[#7a2f3a] bg-[#5a2330] px-3 py-2 text-left text-sm font-bold text-[#fff0d9] hover:bg-[#74303f] disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-[#271a38]"
              :disabled="
                world.loading ||
                !darkBriarCanDuel(world.dark, world.dark.player)
              "
              @click="world.startDarkDuel()"
            >
              {{ duel.offer }}
            </button>
            <p v-else class="text-xs font-black text-[#315744]">
              ✓ Bout won against the {{ COMBAT_ROOMS[duel.room].enemy.name }}.
            </p>
          </div>
          <div
            v-if="world.dark.completed"
            class="mt-2 rounded-lg border border-[#846490] bg-[#f9ecff] p-3"
          >
            <strong class="font-serif text-base"
              >A different future is possible.</strong
            >
            <p class="mt-1 text-sm">
              You have crossed the Dark Match. This outcome remains in the
              Chronicle while the next perspective is being authored.
            </p>
            <button
              type="button"
              class="mt-2 rounded-lg bg-[#463252] px-3 py-2 text-sm font-bold text-white"
              @click="world.returnToBriar()"
            >
              Return with your testimony
            </button>
          </div>
          <div
            class="mt-auto border-t border-[#bba4bd] pt-2 text-xs font-semibold text-[#735378]"
          >
            {{ world.dark.status }}
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import MemoryDungeonDarkHouseStage from '~/components/memory-dungeon/dark-house-stage.vue'
import { BRIAR_TILES } from '~/utils/memoryDungeonWorld'
import { darkBriarIllustrationPath } from '~/utils/memoryDungeon/darkBriarArt'
import {
  DARK_BRIAR_SCENES,
  DARK_BRIAR_SEALS,
  darkBriarWitnessCount,
  darkBriarCanTravel,
  darkBriarCanChoose,
} from '~/utils/memoryDungeon/darkBriar'
import {
  DARK_BRIAR_DUELS,
  darkBriarCanDuel,
} from '~/utils/memoryDungeon/darkBriarDuels'
import { COMBAT_ROOMS } from '~/utils/memoryDungeon/rooms'

const world = useMemoryWorldStore()
const tiles = BRIAR_TILES
const darkScenes = DARK_BRIAR_SCENES
const darkSeals = DARK_BRIAR_SEALS
const seal = computed(() => darkSeals[world.dark.player])
const scene = computed(() => darkScenes[world.dark.player])
const duel = computed(() => DARK_BRIAR_DUELS[world.dark.player])
const decisions = computed(
  () =>
    Object.keys(world.dark.sceneChoices).filter((key) => darkScenes[key])
      .length,
)
const witnessCount = computed(() => darkBriarWitnessCount(world.dark))
const illustrationPath = computed(() =>
  darkBriarIllustrationPath(
    world.dark.player,
    world.dark.sceneChoices[world.dark.player],
  ),
)
const artFailed = ref(false)
watch(illustrationPath, () => {
  artFailed.value = false
})
const sceneStyle = computed(() => {
  const [x = 1, y = 1] = world.dark.player.split(',').map(Number)
  return {
    backgroundImage: "url('/memory-dungeon/briar-camp.svg')",
    backgroundSize: '800% 800%',
    backgroundPosition: `${((x - 1) / 7) * 100}% ${((y - 1) / 7) * 100}%`,
    filter: 'grayscale(0.8) hue-rotate(160deg) brightness(0.75)',
  }
})
</script>

<style scoped>
.md-dark-stage {
  container: dark-briar / inline-size;
}
.md-dark-layout {
  grid-template-rows: minmax(0, 0.5fr) minmax(0, 0.5fr);
}
@container dark-briar (min-width: 760px) {
  .md-dark-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
}
</style>
