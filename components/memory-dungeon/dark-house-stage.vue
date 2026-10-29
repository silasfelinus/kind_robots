<template>
  <section
    class="md-mirror-house flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0e1722] text-[#f6e8d5]"
    aria-label="The Unremembered House dungeon"
    data-testid="dark-house-console"
  >
    <header
      class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-violet-400/40 bg-[#2f2439] px-3 py-2"
    >
      <div>
        <h2 class="font-serif text-lg font-black">The Unremembered House</h2>
        <p class="text-xs text-[#d5c2e0]">
          {{ world.darkHouse.visited.length }}/36 rooms visited · eight
          witnesses carried inside · {{ world.darkHouseEchoCount }} echoes ·
          {{ world.darkHouseScarCount }} fractures
        </p>
      </div>
      <button
        type="button"
        class="rounded-md border border-violet-300/70 px-3 py-2 text-xs font-bold hover:bg-white/10"
        @click="world.leaveDarkHouse()"
      >
        Return to mirrored forest
      </button>
    </header>
    <div class="md-mirror-house-layout grid min-h-0 flex-1 gap-2 p-2">
      <div
        class="relative isolate grid aspect-square max-h-full w-full min-w-0 grid-cols-6 grid-rows-6 gap-0 place-self-center overflow-hidden rounded-xl border-2 border-[#8d76a8] bg-[#171a2d] p-0 shadow-2xl"
        aria-label="Thirty-six linked House chambers"
      >
        <memory-dungeon-house-map-art reality="mirrored" />
        <button
          v-for="tileRoom in rooms"
          :key="tileRoom.id"
          type="button"
          class="relative z-10 min-h-0 min-w-0 rounded-none border text-center focus-visible:outline-2 focus-visible:outline-white"
          :class="
            world.darkHouse.current === tileRoom.id
              ? 'border-[#f5d89a] bg-[#655179]/45 text-white'
              : world.darkHouse.visited.includes(tileRoom.id)
                ? 'border-[#81b7a8] bg-[#34544f]/30 text-[#f4fff8]'
                : world.darkHouseDoors.includes(tileRoom.id)
                  ? 'border-[#b99bcf] bg-[#4d3d61]/30 text-white'
                  : 'border-[#42445d] bg-[#1b2031]/75 text-[#8390a3]'
          "
          :disabled="!world.darkHouseDoors.includes(tileRoom.id)"
          :aria-label="`${tileRoom.id}: ${world.darkHouse.visited.includes(tileRoom.id) || world.darkHouseDoors.includes(tileRoom.id) ? tileRoom.title : 'unknown room'}`"
          @click="world.walkDarkHouse(tileRoom.id)"
        >
          <memory-dungeon-action-beacon
            v-if="
              world.darkHouseDoors.includes(tileRoom.id) &&
              world.darkHouse.current !== tileRoom.id &&
              (!world.darkHouse.visited.includes(tileRoom.id) ||
                (tileRoom.choices.length > 0 &&
                  !world.darkHouse.decisions[tileRoom.id]))
            "
          />
          <span class="block text-[10px] font-black sm:text-xs">{{
            tileRoom.id.slice(3)
          }}</span>
          <span class="block text-sm" aria-hidden="true">{{
            world.darkHouse.current === tileRoom.id
              ? '✦'
              : world.darkHouse.visited.includes(tileRoom.id)
                ? '✓'
                : world.darkHouseDoors.includes(tileRoom.id)
                  ? '◇'
                  : '·'
          }}</span>
        </button>
      </div>
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border-2 border-[#9f80b5] bg-[#e7d9d9] text-[#291f30] shadow-xl"
      >
        <div
          class="relative h-[34%] min-h-[90px] shrink-0 overflow-hidden bg-[#292a42]"
        >
          <img
            v-if="artAvailable"
            :key="room?.id"
            :src="room?.imagePath"
            class="h-full w-full object-cover"
            :alt="`Illustration of ${room?.title}`"
            @error="artAvailable = false"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_40%,#4b4866,#171b2b_85%)] text-3xl text-[#d8c7ed]"
            role="img"
            :aria-label="`Illustration awaiting rendering for ${room?.title}`"
          >
            ✥
          </div>
          <div
            class="absolute inset-0 bg-gradient-to-t from-[#090c1dd9] to-transparent"
          ></div>
          <h3
            class="absolute bottom-2 left-3 font-serif text-lg font-black text-[#fff5df] sm:text-xl"
          >
            {{ room?.title }}
          </h3>
        </div>
        <div class="kr-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <p
            class="mb-2 text-[10px] font-black uppercase tracking-widest text-[#6c4b78]"
          >
            {{ room?.id }} · {{ room?.kind }}
          </p>
          <p class="text-sm leading-relaxed sm:text-base">
            {{
              world.darkHouse.decisions[world.darkHouse.current]
                ? chosen?.outcome
                : room?.opening
            }}
          </p>
          <div
            v-if="world.darkHouseTrial"
            class="mt-3 rounded-lg border border-[#9674a1] bg-[#ede6f5] p-2 sm:p-3"
            data-testid="dark-house-memory-trial"
          >
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-sm font-black">
                {{ world.darkHouseTrial.title }}
              </h4>
              <span class="shrink-0 text-xs font-bold"
                >{{ matchedPairs }}/{{
                  world.darkHouseCards.length / 2
                }}
                pairs</span
              >
            </div>
            <p class="mt-1 text-xs leading-relaxed">
              {{ world.darkHouseTrial.story }}
            </p>
            <div
              class="mt-2 grid grid-cols-4 gap-1.5"
              role="group"
              :aria-label="world.darkHouseTrial.title"
            >
              <button
                v-for="face in world.darkHouseCards"
                :key="face.id"
                type="button"
                class="flex min-h-[72px] min-w-0 flex-col items-center justify-center rounded-md border px-1 py-2 text-center focus-visible:outline-2 focus-visible:outline-violet-950"
                :class="
                  trialProgress?.matched.includes(face.id)
                    ? 'border-emerald-500 bg-[#d9ede0] text-[#25513f]'
                    : trialProgress?.faceUp.includes(face.id)
                      ? 'border-violet-600 bg-white text-[#372349]'
                      : 'border-violet-700 bg-[#483958] text-white'
                "
                :aria-label="
                  faceVisible(face.id) ? face.label : 'Face-down memory card'
                "
                :aria-pressed="Boolean(trialProgress?.faceUp.includes(face.id))"
                :disabled="
                  Boolean(trialProgress?.matched.includes(face.id)) ||
                  (trialProgress?.faceUp.length ?? 0) >= 2 ||
                  world.darkHouseTrialComplete
                "
                @click="world.darkHouseFlipCard(face.id)"
              >
                <template v-if="faceVisible(face.id)">
                  <span class="text-xl" aria-hidden="true">{{
                    face.symbol
                  }}</span>
                  <span
                    class="mt-0.5 text-[10px] font-semibold leading-tight"
                    >{{ face.label }}</span
                  >
                </template>
                <template v-else>
                  <span class="font-serif text-xl" aria-hidden="true">✥</span>
                  <span class="text-[10px]">Memory</span>
                </template>
              </button>
            </div>
            <p
              v-if="trialProgress?.note"
              class="mt-2 text-xs font-semibold"
              role="status"
            >
              {{ trialProgress.note }}
            </p>
            <p
              v-if="trialProgress?.clue"
              class="mt-2 rounded-md bg-[#fff7dc] p-2 text-xs"
            >
              Recalled link: {{ rememberedPair }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <button
                v-if="(trialProgress?.faceUp.length ?? 0) === 2"
                type="button"
                class="rounded-md bg-[#55406b] px-3 py-2 text-xs font-bold text-white"
                @click="world.darkHouseTurnCardsOver()"
              >
                Remember these cards and turn them over
              </button>
              <button
                v-if="!world.darkHouseTrialComplete && !trialProgress?.clue"
                type="button"
                class="rounded-md border border-[#74548b] px-3 py-2 text-xs font-bold"
                :disabled="world.darkHouseEchoCount < 1"
                @click="world.darkHouseUseRecall()"
              >
                Recall one pair · 1 echo
              </button>
            </div>
            <p
              v-if="world.darkHouseTrialComplete"
              class="mt-2 text-xs font-bold text-emerald-800"
            >
              ✓ The physical evidence is paired. Both narrative choices are now
              available.
            </p>
          </div>
          <div
            v-if="world.darkHousePuzzle"
            class="mt-3 rounded-lg border border-[#9c89ac] bg-[#f2e7f4] p-3"
            data-testid="dark-house-logic-puzzle"
          >
            <h4 class="font-serif text-base font-black">
              {{ world.darkHousePuzzle.title }}
            </h4>
            <p class="mt-1 text-xs leading-relaxed">
              {{ world.darkHousePuzzle.evidence }}
            </p>
            <p class="mt-2 text-sm font-bold">
              {{ world.darkHousePuzzle.question }}
            </p>
            <div
              v-if="!puzzleProgress?.solved"
              class="mt-2 flex flex-col gap-2"
            >
              <button
                v-for="answer in world.darkHousePuzzle.options"
                :key="answer.id"
                type="button"
                class="min-h-12 rounded-md border border-[#80608a] bg-[#554266] px-4 py-3 text-left text-base font-bold leading-snug sm:text-lg text-white disabled:opacity-50"
                :disabled="Boolean(puzzleProgress?.wrong.includes(answer.id))"
                @click="world.darkHouseAnswer(answer.id)"
              >
                {{ answer.label }}
              </button>
            </div>
            <p
              v-if="puzzleProgress?.note"
              class="mt-2 text-xs font-bold"
              role="status"
            >
              {{ puzzleProgress.note }}
            </p>
            <p
              v-if="
                puzzleProgress?.hint || (puzzleProgress?.wrong.length ?? 0) > 0
              "
              class="mt-2 rounded-md bg-[#fff7d9] p-2 text-xs"
            >
              Clue: {{ world.darkHousePuzzle.hint }}
            </p>
            <button
              v-if="
                !puzzleProgress?.solved &&
                !puzzleProgress?.hint &&
                (puzzleProgress?.wrong.length ?? 0) === 0
              "
              type="button"
              class="mt-2 rounded-md border border-[#816690] px-3 py-2 text-xs font-bold"
              :disabled="
                !world.darkHouseEarnedClue && world.darkHouseEchoCount < 1
              "
              @click="world.darkHouseUseHint()"
            >
              {{
                world.darkHouseEarnedClue === 'route'
                  ? 'Oren’s route ledger · free clue'
                  : world.darkHouseEarnedClue === 'supplies'
                    ? 'Oren’s provision ledger · free clue'
                    : world.darkHouseEarnedClue === 'names'
                      ? 'Witness testimony · free clue'
                      : world.darkHouseEarnedClue === 'consent'
                        ? 'Protected witnesses · free clue'
                        : world.darkHouseEarnedClue === 'earth-photo'
                          ? 'Dated Earth photograph · free clue'
                          : 'Consult the Chronicle · 1 echo'
              }}
            </button>
            <p
              v-if="puzzleProgress?.solved"
              class="mt-2 text-xs font-black text-emerald-800"
            >
              ✓ The contradiction is resolved. You can decide how to respond.
            </p>
          </div>
          <p
            v-if="
              !world.darkHouseReady &&
              !world.darkHouse.decisions[world.darkHouse.current]
            "
            class="mt-3 rounded-md border border-[#a58aa1] bg-[#fbf4e5] px-3 py-2 text-xs font-bold"
          >
            Reconstruct the evidence to move deeper into the House. Earlier
            passages remain available.
          </p>
          <p
            v-if="
              !world.darkHouse.decisions[world.darkHouse.current] &&
              world.darkHouseReady
            "
            class="mt-3 rounded-md border border-[#b9a3c2] bg-[#f8f0e4] p-2 text-xs font-semibold"
            role="status"
            data-testid="dark-house-choice-gate"
          >
            Choose a response to unlock new rooms. Already visited passages
            remain available if you need to retreat.
          </p>
          <div
            v-if="
              !world.darkHouse.decisions[world.darkHouse.current] &&
              world.darkHouseReady
            "
            class="mt-3 flex flex-col gap-2"
            data-testid="dark-house-choices"
          >
            <button
              v-for="choice in room?.choices ?? []"
              :key="choice.id"
              type="button"
              class="min-h-12 flex-1 rounded-lg bg-[#513d65] px-4 py-3 text-left text-base font-bold leading-snug sm:text-lg lg:text-xl text-[#fff5e5] hover:bg-[#694f7e] focus-visible:outline-2 focus-visible:outline-[#211629]"
              @click="world.chooseDarkHouse(choice.id)"
            >
              {{ choice.label }}
            </button>
          </div>
          <p
            v-else-if="world.darkHouse.decisions[world.darkHouse.current]"
            class="mt-2 text-xs font-bold text-[#42604e]"
            data-testid="dark-house-decision-recorded"
          >
            ✓ This chamber remembers your decision.
          </p>
          <p
            v-if="
              world.darkHouse.current === 'HD-32' &&
              !world.darkHouse.decisions['HD-32']
            "
            class="mt-2 rounded-lg border border-violet-500/30 bg-violet-100 p-2 text-xs"
          >
            The Warden recognizes the eight witnesses. Your testimony decides
            whether the inner chamber opens.
          </p>
          <p
            v-if="world.darkHouse.ending"
            class="mt-3 rounded-lg bg-violet-100 p-2 text-sm font-semibold"
            data-testid="dark-house-verdict"
          >
            {{ world.darkHouseEndingCopy }}
          </p>
          <p class="mt-3 text-xs text-[#765b7b]">
            {{ world.darkHouse.status }}
          </p>
        </div>
      </aside>
    </div>
    <footer
      class="mx-2 mb-2 flex min-h-10 shrink-0 items-center gap-2 overflow-x-auto overscroll-x-contain rounded-lg border border-[#8d76a8] bg-[#29213a] p-2 text-xs"
      role="group"
      aria-label="Open Unremembered House passages"
      data-testid="dark-house-passages"
    >
      <span class="shrink-0 whitespace-nowrap font-bold text-[#f3dcaf]"
        >Open passages</span
      >
      <button
        v-for="door in world.darkHouseDoors"
        :key="door"
        type="button"
        class="shrink-0 whitespace-nowrap rounded-md border border-[#a992c0] bg-[#493858] px-2 py-1.5 font-bold text-white focus-visible:outline-2 focus-visible:outline-white"
        :aria-label="`Travel to ${door}, ${roomsById[door]?.title ?? 'unknown chamber'}`"
        @click="world.walkDarkHouse(door)"
      >
        <span class="sm:hidden">{{ door }}</span>
        <span class="hidden sm:inline"
          >{{ door }} · {{ roomsById[door]?.title }}</span
        >
      </button>
      <span v-if="!world.darkHouseDoors.length" class="shrink-0">
        Resolve this chamber to open a passage.
      </span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import { DARK_HOUSE_ROOMS } from '~/utils/memoryDungeon/darkHouse'
import { HOUSE_ATLAS_ROOM_IDS } from '~/utils/memoryDungeon/houseAtlas'

const world = useMemoryWorldStore()
const roomsById = DARK_HOUSE_ROOMS
const rooms = HOUSE_ATLAS_ROOM_IDS.map((id) => DARK_HOUSE_ROOMS[id]!)
const room = computed(() => world.darkHouseRoom)
const chosen = computed(() =>
  room.value?.choices.find(
    (item) => item.id === world.darkHouse.decisions[world.darkHouse.current],
  ),
)
const trialProgress = computed(
  () => world.darkHouse.trials[world.darkHouse.current],
)
const puzzleProgress = computed(
  () => world.darkHouse.puzzles[world.darkHouse.current],
)
const matchedPairs = computed(
  () => (trialProgress.value?.matched.length ?? 0) / 2,
)
function faceVisible(id: string): boolean {
  return Boolean(
    trialProgress.value?.matched.includes(id) ||
    trialProgress.value?.faceUp.includes(id),
  )
}
const rememberedPair = computed(() =>
  world.darkHouseCards
    .filter((face) => face.pair === trialProgress.value?.clue)
    .map((face) => face.label)
    .join(' + '),
)
const artAvailable = ref(true)
watch(
  () => world.darkHouse.current,
  () => {
    artAvailable.value = true
  },
)
</script>

<style scoped>
.md-mirror-house {
  container: mirror-house / inline-size;
}
.md-mirror-house-layout {
  grid-template-rows: minmax(0, 0.47fr) minmax(0, 0.53fr);
}
@container mirror-house (min-width: 760px) {
  .md-mirror-house-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
}
</style>
