<template>
  <section
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[#10161d] text-[#eae6dc]"
    data-layout="console-fixed"
    data-testid="memory-sublevel"
  >
    <header-page-bar console-theme="memory-dungeon">
      <div class="md-bar" data-testid="memory-sublevel-header">
        <h2 class="md-bar-title" title="Under the Research Annex">
          Sublevel B
        </h2>
        <span class="md-bar-chip" :title="'Torch charge'">
          🔦 {{ sub.progress.battery }}/{{ sub.batteryMax }}
        </span>
        <span class="md-bar-chip" title="Evidence">
          ◎ {{ sub.progress.evidence }}
        </span>
        <span class="md-bar-chip" title="Trust">
          ✦ {{ sub.progress.trust }}
        </span>
        <span class="md-bar-chip" title="Danger">
          ✕ {{ sub.progress.danger }}
        </span>
        <div class="md-bar-end">
          <button
            class="btn btn-sm btn-outline"
            type="button"
            data-testid="memory-sublevel-leave"
            @click="emit('leave')"
          >
            Back upstairs
          </button>
        </div>
      </div>
    </header-page-bar>

    <div
      v-if="!sub.unlocked"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4 text-center"
      data-testid="memory-sublevel-locked"
    >
      <h3 class="text-xl font-black">The archive door is still shut.</h3>
      <p class="max-w-lg text-sm leading-relaxed text-[#cbc3b4]">
        Find the Sublevel B door in the Research Annex and decide how Morrow
        gets past it.
      </p>
      <button type="button" class="btn btn-warning" @click="emit('leave')">
        Return to the city
      </button>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 p-2 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] md:grid-rows-1"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#7d8b8f]/40 bg-[#18232b]"
        aria-label="Sublevel B six by six archive plan"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-2 p-2 text-xs"
        >
          <span class="font-bold text-[#d8e2c6]">
            {{
              sub.entry === 'escort'
                ? 'Signed in, Walt beside you'
                : 'On a borrowed badge'
            }}
          </span>
          <span class="tabular-nums text-[#b9c3b9]">
            {{ sub.progress.visited.length }}/36 rooms
          </span>
        </div>
        <div
          class="md-archive grid min-h-0 flex-1 grid-cols-6 grid-rows-6 gap-1 p-2"
          role="group"
          aria-label="Move to a room that shares an open door"
        >
          <button
            v-for="tile in sub.tiles"
            :key="tile.id"
            type="button"
            class="relative min-h-0 min-w-0 overflow-hidden rounded-md border p-0.5 text-center transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-200"
            :class="tileClass(tile)"
            :disabled="!tile.reachable"
            :aria-current="tile.current ? 'location' : undefined"
            :aria-label="
              tile.visited
                ? tile.title + (tile.resolved ? ', settled' : ', unsettled')
                : tile.reachable
                  ? 'Open the door to ' + tile.id
                  : 'Unexplored ' + tile.id
            "
            :data-testid="'memory-sublevel-room-' + tile.id"
            @click="sub.travel(tile.id)"
          >
            <span class="block text-sm font-black leading-none sm:text-lg">
              {{
                tile.current
                  ? '◆'
                  : tile.visited
                    ? symbolFor(tile.kind)
                    : tile.reachable
                      ? '◇'
                      : '·'
              }}
            </span>
            <span
              v-if="tile.visited"
              class="mt-0.5 hidden truncate text-[9px] leading-tight sm:block"
            >
              {{ tile.title }}
            </span>
          </button>
        </div>
        <p
          class="shrink-0 border-t border-[#7d8b8f]/30 p-2 text-[10px] text-[#b9c3b9]"
        >
          {{
            sub.progress.completed
              ? 'You climbed out. The archive keeps what you chose.'
              : sub.progress.hollisPassed
                ? 'Hollis has let you through to the night archive.'
                : 'Hollis keeps the night archive. Bring her something true.'
          }}
        </p>
      </section>

      <section
        v-if="sub.room"
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#7d8b8f]/40 bg-[#1a242c]"
        aria-label="Archive room and choices"
      >
        <div
          class="md-room relative flex min-h-[6rem] flex-[1_1_42%] flex-col justify-end overflow-hidden border-b border-[#7d8b8f]/40 p-3"
        >
          <div
            class="relative flex max-h-full min-h-0 max-w-[42rem] flex-col rounded-lg bg-[#0e151b]/85 p-3 backdrop-blur-sm"
          >
            <p
              class="mb-1 text-[10px] font-black uppercase tracking-[.17em] text-[#d7c99a]"
            >
              {{ sub.room.kind }} · {{ sub.room.speaker }} · {{ sub.room.id }}
            </p>
            <h3 class="text-lg font-black leading-snug sm:text-2xl">
              {{ sub.room.title }}
            </h3>
            <p
              class="kr-scroll mt-2 max-h-28 min-h-0 flex-1 overflow-auto text-xs leading-relaxed sm:text-sm"
              data-testid="memory-sublevel-opening"
            >
              {{ sub.opening }}
            </p>
          </div>
          <span
            class="absolute right-2 top-2 rounded bg-[#10161d]/90 px-2 py-1 text-[10px] text-[#cbc3b4]"
          >
            Illustration pending
          </span>
        </div>
        <div
          class="kr-scroll min-h-0 flex-[0_1_auto] overflow-y-auto p-2 empty:hidden sm:p-3"
        >
          <p
            v-if="sub.notice && !sub.chosen"
            class="mb-2 rounded-lg bg-[#2f3b3a] p-2 text-xs"
            role="status"
          >
            {{ sub.notice }}
          </p>
          <div
            v-if="sub.chosen"
            class="rounded-xl border border-[#8fae9c] bg-[#263c37] p-3"
            data-testid="memory-sublevel-consequence"
          >
            <p
              class="text-[10px] font-black uppercase tracking-wider text-[#c3e6cd]"
            >
              What the archive keeps
            </p>
            <p class="mt-1 text-sm leading-relaxed">
              {{ sub.chosen.outcome }}
            </p>
          </div>
        </div>
        <memory-dungeon-choice-hand
          v-if="!sub.chosen"
          class="shrink-0"
          :choices="sub.hand"
          :deal-key="sub.room.id"
          :icon="symbolFor(sub.room.kind)"
          palette="violet"
          testid-prefix="memory-sublevel-choice"
          @play="(choice) => sub.choose(choice.id)"
        />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMemorySublevelStore } from '~/stores/memorySublevelStore'
import type { SublevelKind } from '~/utils/memoryDungeon/sublevelB'

const emit = defineEmits<{ leave: [] }>()
const sub = useMemorySublevelStore()

function symbolFor(kind: SublevelKind): string {
  return {
    entry: '▣',
    lore: '◈',
    puzzle: '◎',
    treasure: '✧',
    choice: '◇',
    hazard: '✕',
    companion: '✦',
    shortcut: '↯',
    rest: '☾',
    secret: '◉',
    guardian: '♜',
    climax: '✺',
    exit: '⇡',
  }[kind]
}

function tileClass(tile: {
  current: boolean
  resolved: boolean
  visited: boolean
  reachable: boolean
}): string {
  if (tile.current) return 'border-[#f1e2a6] bg-[#8b7a4e] text-white shadow-lg'
  if (tile.reachable)
    return 'border-[#e8cf8e] bg-[#5d5640] text-[#fff4d6] hover:bg-[#7a6f50]'
  if (tile.resolved) return 'border-[#7fa592] bg-[#33534b] text-white'
  if (tile.visited) return 'border-[#8f9b9c] bg-[#3a474d] text-white'
  return 'border-[#2c3a42] bg-[#141d23] text-[#45545d]'
}

onMounted(() => sub.hydrate())
</script>

<style scoped>
.md-archive {
  background:
    repeating-linear-gradient(0deg, #7d8b8f22 0 2px, transparent 2px 16.66%),
    repeating-linear-gradient(90deg, #7d8b8f22 0 2px, #121b21 2px 16.66%);
}
.md-room {
  background:
    radial-gradient(ellipse at 30% 15%, #e6dca066, transparent 40%),
    linear-gradient(135deg, #1d2a31, #39433f, #1a1f2a);
}
</style>
