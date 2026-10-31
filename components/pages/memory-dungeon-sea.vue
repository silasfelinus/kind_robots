<template>
  <section
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[#111b28] text-[#f3eadb]"
    data-layout="console-fixed"
    data-testid="memory-sea-act"
  >
    <header
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#c19c70]/35 bg-[#222b35] px-3 py-2"
    >
      <div class="min-w-0 flex-1">
        <p
          class="text-[10px] font-black uppercase tracking-[.2em] text-[#ebbd84]"
        >
          The Reimaginer · The Sea Remembers
        </p>
        <h2 class="truncate text-lg font-black sm:text-xl">
          {{
            sea.active === 'e05'
              ? 'The Last Days Before'
              : 'The Two Histories of Char'
          }}
        </h2>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          v-if="sea.e06Unlocked && sea.active === 'e06'"
          type="button"
          class="btn btn-sm border-[#a98d70] bg-[#364454] text-[#fff1d7]"
          @click="sea.select('e05')"
        >
          Younger sea
        </button>
        <button
          v-if="sea.e06Unlocked && sea.active === 'e05'"
          type="button"
          class="btn btn-sm border-[#a98d70] bg-[#364454] text-[#fff1d7]"
          @click="sea.select('e06')"
        >
          Distorted court
        </button>
        <button
          class="btn btn-sm border-[#9e866f] bg-[#3c3734] text-[#fff1d7]"
          type="button"
          @click="emit('leave')"
        >
          Morrow’s Earth
        </button>
      </div>
    </header>
    <div
      v-if="!sea.unlocked"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4 text-center"
      data-testid="memory-sea-locked"
    >
      <h3 class="text-xl font-black">
        Scylla has not yet reached this shoreline.
      </h3>
      <p class="max-w-lg text-sm leading-relaxed text-[#d6c5a9]">
        Complete Morrow’s tide-gate crossing before Scylla can wake in the final
        days of her childhood.
      </p>
      <button type="button" class="btn btn-warning" @click="emit('leave')">
        Return to the city
      </button>
    </div>
    <div
      v-else
      class="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,0.88fr)_minmax(0,1.12fr)] gap-2 p-2 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] md:grid-rows-1"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#9f8867]/40 bg-[#1f303d]"
        aria-label="The paired mermaid palace maps"
      >
        <div
          class="flex shrink-0 flex-wrap items-center justify-between gap-2 p-2 text-xs"
        >
          <span class="font-bold text-[#f3cc93]">
            {{
              sea.active === 'e05'
                ? 'Royal palace, before escape'
                : 'Royal palace, unmade'
            }}
          </span>
          <span class="tabular-nums text-[#d3bf9c]">
            {{ sea.progress.revealed.length }}/64 found ·
            {{ Object.keys(sea.progress.choices).length }} resolved
          </span>
        </div>
        <div
          class="grid min-h-0 flex-1 grid-cols-8 grid-rows-8 gap-1 p-2"
          :class="sea.active === 'e05' ? 'md-palace-pearl' : 'md-palace-night'"
          role="group"
          aria-label="Explore the underwater palace one neighboring chamber at a time"
        >
          <button
            v-for="tile in sea.tiles"
            :key="tile.key"
            type="button"
            class="relative min-h-0 min-w-0 rounded-md border text-center transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-200"
            :class="tileClass(tile)"
            :disabled="!tile.reachable"
            :aria-current="tile.current ? 'location' : undefined"
            :aria-label="
              tile.revealed
                ? tile.title +
                  (tile.resolved ? ', decided' : ', needs a decision')
                : tile.reachable
                  ? 'Enter ' + tile.key
                  : 'Undiscovered ' + tile.key
            "
            @click="sea.travel(tile.key)"
          >
            <span class="block text-xs font-black sm:text-base">
              {{
                tile.current
                  ? '◆'
                  : tile.resolved
                    ? '✓'
                    : tile.revealed
                      ? symbolFor(tile.kind)
                      : tile.reachable
                        ? '◇'
                        : '·'
              }}
            </span>
          </button>
        </div>
        <div
          class="flex shrink-0 justify-between gap-3 border-t border-[#a68a6b]/30 p-2 text-xs text-[#e4ceb0]"
        >
          <span>Photos {{ sea.photographs }}/2</span>
          <span>Trust {{ sea.progress.trust }}</span>
          <span>Evidence {{ sea.progress.evidence }}</span>
          <span>Danger {{ sea.progress.danger }}</span>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#9f8867]/40 bg-[#202b36]"
        aria-label="Encounter stage and choices"
      >
        <template v-if="sea.current">
          <div
            class="relative flex min-h-[8rem] flex-[1_1_42%] flex-col justify-end overflow-hidden border-b border-[#a68a6b]/40 p-3"
            :class="
              sea.active === 'e06' ? 'md-sea-stage-night' : 'md-sea-stage-pearl'
            "
          >
            <img
              v-if="sea.current.sceneArt.status === 'delivered'"
              :src="sea.current.sceneArt.path"
              :alt="sea.current.title"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div
              class="relative max-w-[42rem] rounded-lg bg-[#111a26]/85 p-3 backdrop-blur-sm"
            >
              <p
                class="mb-1 text-[10px] font-black uppercase tracking-[.17em] text-[#eac08c]"
              >
                {{ sea.current.kind }} · {{ sea.current.speaker }} ·
                {{ sea.position }}
              </p>
              <h3 class="text-lg font-black leading-snug sm:text-2xl">
                {{ sea.current.title }}
              </h3>
              <p
                class="mt-2 max-h-28 overflow-auto text-xs leading-relaxed sm:text-sm"
              >
                {{ sea.opening }} {{ sea.current.opening }}
              </p>
            </div>
            <span
              v-if="sea.current.sceneArt.status !== 'delivered'"
              class="absolute right-2 top-2 rounded bg-[#151d29]/90 px-2 py-1 text-[10px] text-[#e6cba6]"
            >
              Illustration pending
            </span>
          </div>
          <div class="kr-scroll min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
            <p
              v-if="sea.notice"
              class="mb-2 rounded-lg bg-[#33443d] p-2 text-xs"
              role="status"
            >
              {{ sea.notice }}
            </p>
            <div
              v-if="sea.chosen"
              class="rounded-xl border border-[#8ab49e] bg-[#2b443f] p-3"
              data-testid="memory-sea-consequence"
            >
              <p
                class="text-[10px] font-black uppercase tracking-wider text-[#bce9c8]"
              >
                Remembered consequence
              </p>
              <p class="mt-1 text-sm leading-relaxed">
                {{ sea.chosen.outcome }}
              </p>
            </div>
            <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                v-for="(choice, index) in sea.current.choices"
                :key="choice.id"
                type="button"
                class="overflow-hidden rounded-xl border border-[#9c8569] bg-[#344250] text-left transition hover:border-[#ffe1a6] hover:bg-[#405366] focus-visible:outline-2 focus-visible:outline-[#ffe1a6]"
                :data-testid="'memory-sea-choice-' + choice.id"
                @click="sea.choose(choice.id)"
              >
                <div
                  class="relative flex h-16 items-end bg-[linear-gradient(120deg,#5a6271,#756455,#3b7273)] p-2 sm:h-20"
                >
                  <img
                    v-if="choice.art.status === 'delivered'"
                    :src="choice.art.path"
                    :alt="choice.label"
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                  <span
                    v-else
                    class="relative rounded bg-[#151d29]/85 px-2 py-1 text-[10px]"
                  >
                    Outcome {{ index + 1 }} · art pending
                  </span>
                </div>
                <span
                  class="block p-2 text-xs font-bold leading-relaxed sm:text-sm"
                >
                  {{ choice.label }}
                </span>
              </button>
            </div>
            <div
              v-if="sea.readyToLeave"
              class="mt-2 rounded-xl border border-[#eac68a]/60 bg-[#504033] p-2"
            >
              <p class="mb-2 text-xs text-[#ffe9bf]">
                You have found both photographs and the sisters’ decision at the
                far gate. The remaining palace chambers stay explorable.
              </p>
              <button
                type="button"
                class="btn btn-sm w-full border-[#ffdc99] bg-[#d4a963] font-black text-[#1f252b]"
                data-testid="memory-sea-finish"
                @click="sea.conclude()"
              >
                {{
                  sea.completed
                    ? sea.active === 'e05'
                      ? 'Revisit the distorted court'
                      : 'The twin testimony is remembered'
                    : sea.active === 'e05'
                      ? 'Choose the second-chance route'
                      : 'Record the sisters’ testimony'
                }}
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>
    <footer
      v-if="sea.unlocked"
      class="flex shrink-0 items-center justify-between gap-2 border-t border-[#a78c6f]/30 px-3 py-1 text-[10px] text-[#d4c2a7]"
    >
      <span>
        Neighboring squares only ·
        {{
          sea.progress.choices['8,8']
            ? 'Gate remembered'
            : 'Find the departure gate'
        }}
      </span>
      <span>
        {{
          sea.readyToLeave
            ? 'The next reality is ready'
            : 'Resolve twelve scenes, two photographs and the far-side choice'
        }}
      </span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMemorySeaStore } from '~/stores/memorySeaStore'
import type { OverworldKind } from '~/utils/memoryDungeon/overworldEventCatalog'

const emit = defineEmits<{ leave: [] }>()
const sea = useMemorySeaStore()

function symbolFor(kind: OverworldKind): string {
  return {
    memory: '◈',
    challenge: '◇',
    treasure: '✧',
    monster: '✕',
    dungeon: '▣',
    merchant: '¤',
    puzzle: '◎',
    companion: '✦',
  }[kind]
}
function tileClass(tile: {
  current: boolean
  resolved: boolean
  revealed: boolean
  reachable: boolean
}): string {
  if (tile.current) return 'border-[#ffe1a6] bg-[#a78354] text-white shadow-lg'
  if (tile.resolved) return 'border-[#88b7a5] bg-[#41655b] text-white'
  if (tile.revealed) return 'border-[#a6a092] bg-[#4b5961] text-white'
  if (tile.reachable)
    return 'border-[#f3ca82] bg-[#856048] text-[#fff1d9] hover:bg-[#a47d5b]'
  return 'border-[#3c5361] bg-[#1b2b36] text-[#516575]'
}

onMounted(() => sea.hydrate())
</script>

<style scoped>
.md-palace-pearl {
  background:
    repeating-linear-gradient(0deg, #a1865a44 0 2px, transparent 2px 12.5%),
    repeating-linear-gradient(90deg, #90b0c344 0 2px, #253743 2px 12.5%);
}
.md-palace-night {
  background:
    radial-gradient(ellipse at 40% 70%, #1e9ba244, transparent 60%),
    repeating-linear-gradient(90deg, #6683a433 0 5px, #1b293d 5px 14px);
}
.md-sea-stage-pearl {
  background:
    radial-gradient(ellipse at 68% 20%, #dbaf8166, transparent 45%),
    linear-gradient(130deg, #253b4b, #6b5b55, #43485b);
}
.md-sea-stage-night {
  background:
    radial-gradient(ellipse at 70% 10%, #7bd5d866, transparent 43%),
    linear-gradient(120deg, #25364f, #4a3761, #173f4b);
}
</style>
