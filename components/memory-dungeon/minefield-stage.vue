<template>
  <section
    class="flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_15%,#364d4c,#111d23_78%)] px-2 py-2 text-[#f9eacc] sm:px-5"
    aria-label="The Minefield Archive, a logic puzzle"
    data-testid="memory-minefield-stage"
  >
    <header
      class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#bf9b5b]/50 pb-2"
    >
      <div class="min-w-0">
        <p
          class="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c8b78e]"
        >
          The Three Quiet Stones · Secret chamber
        </p>
        <h3 class="font-serif text-xl font-black tracking-wide sm:text-2xl">
          The Minefield Archive
        </h3>
        <p class="text-xs text-[#d0ccb9]">
          Every danger has a clue. Find the far door without guessing.
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg border border-[#bca477] bg-[#282a29] px-3 py-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-white"
        @click="world.closeMinefield()"
      >
        Back to the Marches
      </button>
    </header>

    <div
      v-if="board"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-2"
    >
      <div
        class="flex w-full shrink-0 flex-wrap items-center justify-center gap-2 text-[11px] font-bold sm:text-sm"
        aria-live="polite"
      >
        <span class="rounded border border-[#b49a68]/60 bg-[#17262a] px-2 py-1"
          >♥ {{ board.hearts }} hearts</span
        >
        <span class="rounded border border-[#b49a68]/60 bg-[#17262a] px-2 py-1"
          >⚒ {{ board.disarms }} disarms</span
        >
        <span class="rounded border border-[#b49a68]/60 bg-[#17262a] px-2 py-1"
          >{{ revealedCount }}/{{ board.rows * board.cols }} exposed</span
        >
        <span class="rounded border border-[#b49a68]/60 bg-[#17262a] px-2 py-1"
          >{{ board.rows }}×{{ board.cols }}</span
        >
        <button
          type="button"
          class="rounded border border-[#b49a68] px-2 py-1 focus-visible:outline-2"
          :aria-pressed="zoomed"
          @click="zoomed = !zoomed"
        >
          {{ zoomed ? 'Fit board' : 'Zoom board' }}
        </button>
      </div>

      <div
        class="flex min-h-0 min-w-0 max-w-full flex-1 items-center justify-center overflow-auto rounded-xl border-2 border-[#937957] bg-[#0d1c22] p-1.5 shadow-[0_0_45px_#ad924c25,inset_0_0_20px_#000]"
        :class="zoomed ? 'w-full' : 'w-[min(100%,62dvh)]'"
        data-testid="memory-minefield-board-container"
      >
        <div
          role="grid"
          :aria-label="`Deduction board, ${board.rows} rows, ${board.cols} columns. Arrow keys move, Enter reveals, Space flags, D disarms.`"
          class="grid aspect-square w-full max-h-full gap-[2px]"
          :class="
            zoomed
              ? 'min-w-[min(94vw,570px)] max-w-[570px]'
              : 'max-w-[min(100%,62dvh)]'
          "
          :style="{
            gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
          }"
        >
          <button
            v-for="(tile, index) in board.tiles"
            :key="index"
            type="button"
            role="gridcell"
            :tabindex="focused === index ? 0 : -1"
            :aria-disabled="
              board.outcome !== 'exploring' ||
              tile.revealed ||
              tile.sprung ||
              tile.disarmed
            "
            :aria-label="describeCell(board, point(index))"
            :aria-selected="focused === index"
            class="relative aspect-square min-h-0 min-w-0 rounded-[3px] border border-[#a18e63]/30 font-mono text-[10px] font-black outline-offset-1 transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#f6d99a] sm:text-sm"
            :class="[
              tile.sprung
                ? 'bg-[#9b3939] text-white'
                : tile.disarmed
                  ? 'bg-[#367565] text-white'
                  : tile.revealed
                    ? 'bg-[#d8d0ac] text-[#29383a]'
                    : tile.flagged
                      ? 'bg-[#6e485c] text-[#fff0dd]'
                      : 'bg-[linear-gradient(135deg,#41575b,#263941)] text-[#f8dca1] hover:bg-[#506569]',
              hintAt(index) ? 'ring-2 ring-inset ring-[#ffe17a]' : '',
            ]"
            @focus="focused = index"
            @click="act(index, tool)"
            @keydown="handleKey($event, index)"
          >
            <span v-if="tile.sprung" aria-hidden="true">✕</span>
            <span v-else-if="tile.disarmed" aria-hidden="true">✧</span>
            <span v-else-if="tile.revealed" aria-hidden="true">{{
              tile.clue || '·'
            }}</span>
            <span v-else-if="tile.flagged" aria-hidden="true">⚑</span>
            <span v-else-if="index === exitIndex" aria-hidden="true">⇥</span>
            <span v-else aria-hidden="true" class="opacity-45">✦</span>
          </button>
        </div>
      </div>

      <div
        v-if="
          board.outcome === 'exploring' &&
          world.state.minefield &&
          minefieldRunExhausted(world.state.minefield)
        "
        class="flex max-w-lg shrink-0 flex-col items-center gap-2 rounded-lg border border-[#c2ab76] bg-[#202e2c] p-3 text-center"
        role="alert"
        data-testid="memory-minefield-exhausted"
      >
        <p class="font-serif text-base font-bold">
          The archive has forgotten its way.
        </p>
        <p class="text-xs">
          Your map is intact, but this floor has exhausted its recorded moves.
          Start a new layout to continue exploring.
        </p>
        <button
          type="button"
          class="rounded-md bg-[#ddca98] px-3 py-2 text-sm font-bold text-[#1c302b]"
          @click="world.retryExhaustedMinefield()"
        >
          Restart this floor
        </button>
      </div>
      <div
        v-else-if="board.outcome === 'exploring'"
        class="flex w-full shrink-0 flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Minefield tools"
      >
        <button
          v-for="item in tools"
          :key="item.id"
          type="button"
          :aria-pressed="tool === item.id"
          class="rounded-lg border px-3 py-1.5 text-xs font-bold focus-visible:outline-2"
          :class="
            tool === item.id
              ? 'border-[#ffe2a0] bg-[#dcc58b] text-[#17262c]'
              : 'border-[#947a58] bg-[#263c3d] text-[#f7e8c8]'
          "
          @click="tool = item.id"
        >
          {{ item.label }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-[#947a58] bg-[#263c3d] px-3 py-1.5 text-xs font-bold focus-visible:outline-2 disabled:opacity-40"
          :disabled="world.state.lanterns < 1 || !!world.minefieldHint"
          @click="world.requestMinefieldHint()"
        >
          {{ world.minefieldHint ? 'Hint revealed' : 'Lantern hint' }} ({{
            world.state.lanterns
          }})
        </button>
      </div>
      <div
        v-if="board.outcome !== 'exploring'"
        class="max-w-lg rounded-lg border border-[#c2ab76] bg-[#202e2c] px-4 py-2 text-center"
        role="status"
      >
        <p class="font-serif text-lg font-bold">
          {{
            board.outcome === 'escaped'
              ? 'The far door remembers you.'
              : 'The thorns spring shut.'
          }}
        </p>
        <p class="text-xs">
          {{
            board.outcome === 'escaped'
              ? 'Victory recorded. The archive yields its treasure once per size.'
              : 'The floor may be retried. The wider world is still open.'
          }}
        </p>
        <button
          type="button"
          class="mt-2 rounded-md bg-[#ddca98] px-3 py-1.5 text-xs font-bold text-[#1c302b]"
          @click="world.closeMinefield()"
        >
          Return to map
        </button>
      </div>
      <p
        class="max-w-xl shrink-0 text-center text-[11px] text-[#eee0bb]"
        role="status"
        aria-live="polite"
      >
        {{
          world.minefieldHint
            ? `Proved ${world.minefieldHint.type}: ${coordinate(world.minefieldHint.cell)}`
            : 'Reveal every safe space to open the far door ⇥. Flags are notes, not proof.'
        }}
      </p>
      <p class="hidden text-center text-[10px] text-[#b9b6a5] sm:block">
        Arrows: navigate · Enter: reveal · Space: flag · D: disarm · H: lantern
        hint · Esc: leave
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import { coordinate, describeCell } from '~/utils/memoryDungeon/minefield'
import {
  minefieldRunExhausted,
  type MinefieldMove,
} from '~/utils/memoryDungeon/minefieldRun'

const world = useMemoryWorldStore()
const board = computed(() => world.minefieldBoard)
const focused = ref(0)
const zoomed = ref(false)
const tool = ref<MinefieldMove['action']>('step')
const tools: { id: MinefieldMove['action']; label: string }[] = [
  { id: 'step', label: 'Reveal ↳' },
  { id: 'flag', label: 'Flag ⚑' },
  { id: 'disarm', label: 'Disarm ⚒' },
]
const revealedCount = computed(
  () =>
    board.value?.tiles.filter((t) => t.revealed || t.sprung || t.disarmed)
      .length ?? 0,
)
const exitIndex = computed(() =>
  board.value
    ? board.value.exit.row * board.value.cols + board.value.exit.col
    : 0,
)
function point(i: number) {
  return {
    row: Math.floor(i / (board.value?.cols || 8)),
    col: i % (board.value?.cols || 8),
  }
}
function hintAt(i: number) {
  const h = world.minefieldHint
  return h && h.cell.row === point(i).row && h.cell.col === point(i).col
}
function act(index: number, action: MinefieldMove['action']) {
  const state = board.value
  if (!state || state.outcome !== 'exploring') return
  const cell = point(index)
  world.minefieldMove({ ...cell, action })
}
function handleKey(event: KeyboardEvent, index: number) {
  const state = board.value
  if (!state) return
  const movement: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -state.cols,
    ArrowDown: state.cols,
  }
  if (event.key in movement) {
    event.preventDefault()
    let next = index + movement[event.key]!
    if (event.key === 'ArrowLeft' && index % state.cols === 0) next = index
    if (event.key === 'ArrowRight' && index % state.cols === state.cols - 1)
      next = index
    if (next < 0 || next >= state.tiles.length) return
    focused.value = next
    const buttons = (
      event.currentTarget as HTMLElement
    ).parentElement?.querySelectorAll<HTMLButtonElement>('button')
    buttons?.[next]?.focus()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    act(index, 'step')
  } else if (event.key === ' ' || event.key.toLowerCase() === 'f') {
    event.preventDefault()
    act(index, 'flag')
  } else if (event.key.toLowerCase() === 'd') {
    event.preventDefault()
    act(index, 'disarm')
  } else if (event.key.toLowerCase() === 'h') {
    event.preventDefault()
    world.requestMinefieldHint()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    world.closeMinefield()
  }
}
</script>
