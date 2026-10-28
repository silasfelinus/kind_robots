<template>
  <div
    class="kr-stage relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#161d22] text-[#ffedd3]"
  >
    <img
      src="/images/background/memorydungeon.webp"
      alt=""
      class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-75"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-linear-to-r from-[#0e191a]/95 via-[#172a26]/80 to-[#111a22]/60"
    ></div>

    <div
      v-if="prologueOpen"
      class="relative z-10 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)] overflow-hidden lg:grid-cols-2 lg:grid-rows-1"
      data-testid="memory-dungeon-prologue"
    >
      <section
        class="relative min-h-0 overflow-hidden"
        aria-label="The exchanged lives"
      >
        <img
          src="/images/background/memorydungeon.webp"
          alt="An uncanny forest awaits beyond the border of the everyday world"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-linear-to-t from-[#101c1d] via-[#142226]/20 to-[#111c1b]/40"
        ></div>
        <div
          class="absolute inset-x-4 bottom-4 rounded-xl border border-[#f2d99c]/50 bg-[#102126]/90 p-4 shadow-2xl backdrop-blur-md sm:inset-x-8 sm:bottom-8"
        >
          <p
            class="text-[11px] font-bold uppercase tracking-[.22em] text-[#eac88e]"
          >
            The life you left behind
          </p>
          <p
            class="mt-2 font-serif text-lg font-semibold leading-snug sm:text-2xl"
          >
            One ordinary world. One impossible bargain.
          </p>
        </div>
      </section>
      <section
        class="kr-scroll flex min-h-0 flex-col overflow-y-auto overscroll-contain bg-[#101a1d]/95 p-4 sm:p-7 lg:p-9"
      >
        <p class="text-xs font-bold uppercase tracking-[.22em] text-[#eac88e]">
          Prologue · The Changeling's Trade
        </p>
        <h2
          class="mt-2 font-serif text-3xl font-black text-[#fff1d2] sm:text-4xl"
        >
          A life without magic
        </h2>
        <div
          class="mt-3 space-y-3 text-sm leading-relaxed text-[#f1dfbe] sm:text-base"
        >
          <p>
            You were a data researcher. The deadlines were real, the coffee was
            dreadful, and nobody at the office believed in fairies. You had
            grown used to all three.
          </p>
          <p>
            Morrow appeared after hours, studying your spreadsheets with the
            hunger of someone seeing an entire new universe. A world where
            numbers never changed because a witch was angry. A life that could
            be understood.
          </p>
          <p
            class="border-l-2 border-[#d6b779] pl-3 font-serif italic text-[#ffeac0]"
          >
            “You can have my story,” Morrow said. “And I shall try yours.”
          </p>
          <p>
            You thought it was a joke. The next moment, the fluorescent lights
            were stars and your reflection belonged to somebody else.
          </p>
        </div>
        <p
          class="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[#e9c98b]"
        >
          What did you hold onto as the worlds changed?
        </p>
        <div class="mt-2 grid gap-2">
          <button
            type="button"
            class="min-h-14 rounded-xl border border-[#d7bd84]/75 bg-[#344940] px-4 py-3 text-left text-base font-bold leading-snug sm:text-lg text-[#fff2d6] hover:bg-[#46624e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7dfaa]"
            @click="finishPrologue('terms')"
          >
            Demand the terms of the bargain
            <span
              class="mt-1 block text-sm font-normal leading-relaxed text-[#e4cfab]"
            >
              Keep a question burning. Begin with an extra Lantern.
            </span>
          </button>
          <button
            type="button"
            class="min-h-14 rounded-xl border border-[#d7bd84]/75 bg-[#344940] px-4 py-3 text-left text-base font-bold leading-snug sm:text-lg text-[#fff2d6] hover:bg-[#46624e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7dfaa]"
            @click="finishPrologue('anchor')"
          >
            Remember one unremarkable morning
            <span
              class="mt-1 block text-sm font-normal leading-relaxed text-[#e4cfab]"
            >
              Preserve a fragment of home. Begin with a silver wildflower.
            </span>
          </button>
        </div>
        <button
          type="button"
          class="mt-3 self-start rounded-lg px-2 py-2 text-xs font-semibold text-[#e6c99a] underline underline-offset-4 hover:text-white"
          @click="prologueOpen = false"
        >
          Return to game selection
        </button>
      </section>
    </div>
    <div
      v-else
      class="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center p-2 sm:p-5"
    >
      <div
        class="flex w-full max-w-6xl min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#b79c6d]/60 bg-[#101f20]/75 shadow-2xl backdrop-blur-md lg:flex-row"
      >
        <section
          class="relative flex shrink-0 flex-col justify-end overflow-hidden border-b border-[#b79c6d]/40 p-4 lg:w-[37%] lg:border-b-0 lg:border-r lg:p-7"
        >
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,#647a52,transparent_55%)] opacity-50"
          ></div>
          <img
            src="/memory-dungeon/briar-camp.svg"
            alt=""
            class="absolute inset-0 h-full w-full object-cover opacity-65"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-[#10201e] via-[#10201e]/60 to-transparent"
          ></div>
          <div class="relative z-10 flex flex-col items-start">
            <span
              class="rounded-lg border border-[#d4b974]/60 bg-[#1b302b]/85 px-3 py-1 text-[11px] font-bold tracking-widest text-[#f9e5b2]"
              >A NEW MEMORY ADVENTURE</span
            >
            <h2
              class="mt-3 font-serif text-4xl font-black tracking-tight text-[#fff4d8] sm:text-5xl lg:text-6xl"
            >
              Memory<br />Dungeon
            </h2>
            <p class="mt-2 max-w-sm text-sm text-[#f0ddb8]">
              Morrow took your ordinary life. The fairy tales are yours to
              survive.
            </p>
            <p class="mt-2 text-xs font-semibold text-[#e5c98b]">
              🌿 Briar Marches · World 1 of 16 · House That Remembers
            </p>
          </div>
        </section>
        <section
          class="kr-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-3 sm:gap-4 sm:p-5 lg:p-7"
        >
          <div class="shrink-0">
            <p
              class="text-xs font-bold uppercase tracking-[.18em] text-[#d9be8e]"
            >
              Choose your memory magic
            </p>
            <h2 class="font-serif text-xl font-bold sm:text-2xl">
              Whose pictures fill Briar Camp?
            </h2>
          </div>
          <memory-dungeon-deck-selector
            :selected="world.deck"
            :mature-available="world.matureAvailable"
            :unlocked-realms="world.unlockedRealms"
            :realm-art-ready="world.realmArtReady"
            @change="world.selectDeck"
          />
          <div
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#b79c6d]/35 bg-[#1c2d2b]/90 px-3 py-2 text-xs"
          >
            <span class="font-semibold text-[#ead6b3]"
              >Classic Match difficulty</span
            >
            <select
              v-model="memoryStore.selectedDifficulty"
              aria-label="Classic Match difficulty"
              class="rounded-lg border border-[#bba073]/60 bg-[#293e37] px-3 py-1.5 font-bold text-[#fff2d4]"
            >
              <option
                v-for="difficulty in memoryStore.difficulties"
                :key="difficulty.label"
                :value="difficulty"
              >
                {{ difficulty.label }}
              </option>
            </select>
          </div>
          <div class="mt-auto grid shrink-0 gap-2 pt-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              class="rounded-xl border-2 border-[#efdcaa] bg-[#b9d88d] px-4 py-3 text-sm font-black text-[#202b23] shadow-lg transition hover:bg-[#d4ecaa] sm:text-lg"
              @click="beginAdventure"
            >
              🌿
              {{
                hasExistingSave ? 'Continue Briar Marches' : 'Begin the tale'
              }}
            </button>
            <button
              type="button"
              class="rounded-xl border-2 border-[#bba073] bg-[#293735]/95 px-4 py-3 text-sm font-bold text-[#fff1d1] hover:bg-[#425347]"
              @click="emit('classic')"
            >
              🃏 Classic Match
            </button>
          </div>
          <p class="shrink-0 text-center text-[11px] text-[#d8c39b]">
            Your deck is shared by both modes. Classic difficulty is
            independent. Briar Camp progress autosaves in this browser.
          </p>
          <p
            v-if="error"
            role="alert"
            class="rounded-lg border border-amber-300/80 bg-red-950/80 px-3 py-2 text-sm font-bold text-[#fff0d0]"
          >
            {{ error }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import type { BriarPrologueChoice } from '~/utils/memoryDungeonWorld'
import { useMemoryStore } from '~/stores/memoryStore'
import MemoryDungeonDeckSelector from '~/components/memory-dungeon/deck-selector.vue'
defineProps<{ error?: string }>()
const emit = defineEmits<{ explore: []; classic: [] }>()
const world = useMemoryWorldStore()
const memoryStore = useMemoryStore()
const prologueOpen = ref(false)
const hasExistingSave = computed(
  () =>
    world.state.prologueChoice !== null ||
    world.state.revealed.length > 0 ||
    world.state.mapCards.length > 0 ||
    world.state.attempts > 0,
)

function beginAdventure(): void {
  if (hasExistingSave.value) {
    emit('explore')
    return
  }
  prologueOpen.value = true
}

function finishPrologue(choice: BriarPrologueChoice): void {
  world.recordPrologueChoice(choice)
  prologueOpen.value = false
  emit('explore')
}

onMounted(() => world.hydrate())
</script>
