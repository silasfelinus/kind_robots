<template>
  <main
    class="kr-surface md-encounter-console flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[#111824] text-[#f3e9d7]"
    data-layout="console-fixed"
    data-testid="memory-encounter-inspector"
  >
    <header
      class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#bd9064]/40 bg-[#1c2632] px-3 py-2"
    >
      <div class="min-w-0">
        <p
          class="text-[10px] font-bold uppercase tracking-[.22em] text-[#e3aa77]"
        >
          Memory Dungeon / Internal encounter atlas
        </p>
        <h1 class="truncate text-lg font-black sm:text-2xl">
          {{ heading }}
          <span class="font-light text-[#cbbd9d]">/ The revealed square</span>
        </h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label for="memory-encounter-world" class="sr-only">
          Choose an overworld to inspect
        </label>
        <select
          id="memory-encounter-world"
          :value="inspector.active"
          class="select select-sm max-w-[15rem] border-[#ab936e] bg-[#293747] text-[#fff4dc]"
          @change="selectWorld"
        >
          <option
            v-for="world in inspector.available"
            :key="world.id"
            :value="world.id"
          >
            {{ world.id.toUpperCase() }} · {{ titleFor(world.id) }}
          </option>
        </select>
        <button
          class="btn btn-sm border-[#9c795c] bg-[#45342c] text-[#fff0d8]"
          type="button"
          @click="inspector.restart()"
        >
          Restart this map
        </button>
      </div>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 overflow-hidden p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:grid-rows-1"
    >
      <section
        class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#a78a65]/40 bg-[#182635]"
        aria-label="Overworld exploration"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-2 p-2 text-xs"
        >
          <span class="font-bold tracking-wide text-[#e9bf80]">
            Overworld / {{ inspector.position }}
          </span>
          <span class="tabular-nums text-[#d6c49e]">
            {{ inspector.progress.revealed.length }} / 64 revealed
          </span>
        </div>
        <div
          class="md-reveal-grid grid min-h-0 flex-1 grid-cols-8 grid-rows-8 gap-1 p-2"
          role="group"
          aria-label="Eight by eight persistent realm grid"
        >
          <button
            v-for="tile in inspector.tiles"
            :key="tile.key"
            type="button"
            class="relative min-h-0 min-w-0 overflow-hidden rounded-[5px] border text-center transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f9d18f]"
            :class="tileClass(tile)"
            :disabled="!tile.reachable"
            :aria-label="
              tile.revealed
                ? tile.title +
                  (tile.resolved ? ', decision recorded' : ', unresolved')
                : tile.reachable
                  ? 'Explore neighboring ' + tile.key
                  : 'Unrevealed ' + tile.key
            "
            :aria-current="tile.current ? 'location' : undefined"
            @click="inspector.travel(tile.key)"
          >
            <span
              class="block truncate text-[9px] font-black leading-3 sm:text-[11px]"
            >
              {{
                tile.current
                  ? '◆'
                  : tile.resolved
                    ? '✓'
                    : tile.revealed
                      ? glyphFor(tile.kind)
                      : tile.reachable
                        ? '◇'
                        : '·'
              }}
            </span>
            <span
              v-if="tile.revealed"
              class="hidden truncate text-[8px] font-semibold leading-tight lg:block"
            >
              {{ tile.title.split('/')[0] }}
            </span>
          </button>
        </div>
        <div
          class="flex shrink-0 flex-wrap justify-between gap-x-3 gap-y-1 border-t border-[#a78a65]/30 p-2 text-[11px] text-[#d7c29c]"
        >
          <span>Supplies {{ inspector.progress.supplies }}</span>
          <span>Trust {{ inspector.progress.trust }}</span>
          <span>Evidence {{ inspector.progress.evidence }}</span>
          <span>Danger {{ inspector.progress.danger }}</span>
        </div>
      </section>

      <section
        class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#be9467]/40 bg-[#1c2635]"
        aria-label="Illustrated encounter and choices"
      >
        <template v-if="inspector.current">
          <div
            class="md-encounter-stage relative flex min-h-[9rem] flex-[1_1_40%] flex-col justify-end overflow-hidden border-b border-[#a78a65]/40 p-3 sm:p-4"
            :class="'md-encounter-' + inspector.current.kind"
          >
            <img
              v-if="inspector.current.sceneArt.status === 'delivered'"
              :src="inspector.current.sceneArt.path"
              :alt="'Illustration of ' + inspector.current.title"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div
              v-else
              class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_20%,#a78e7255,transparent_55%),linear-gradient(115deg,#15242c,#39433d_50%,#473448)]"
              aria-hidden="true"
            />
            <div
              class="relative max-w-[44rem] rounded-lg bg-[#10151b]/80 p-2 backdrop-blur-sm"
            >
              <p
                class="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#f3c783]"
              >
                {{ inspector.current.kind }} · {{ inspector.current.speaker }}
              </p>
              <h2 class="text-xl font-black leading-tight sm:text-2xl">
                {{ inspector.current.title }}
              </h2>
              <p
                class="mt-1 max-h-24 overflow-auto text-xs leading-relaxed sm:text-sm"
              >
                {{ inspector.current.opening }}
              </p>
            </div>
            <span
              v-if="inspector.current.sceneArt.status !== 'delivered'"
              class="absolute right-2 top-2 rounded bg-[#10151b]/80 px-2 py-1 text-[10px]"
            >
              Scene illustration pending
            </span>
          </div>

          <div class="kr-scroll min-h-0 flex-1 overflow-auto p-2 sm:p-3">
            <p
              v-if="inspector.notice"
              class="mb-2 rounded-lg border border-[#d2b881]/40 bg-[#3a302c] p-2 text-xs"
              role="status"
            >
              {{ inspector.notice }}
            </p>
            <div
              v-if="inspector.chosen"
              class="rounded-xl border border-[#cfb97e]/50 bg-[#334039] p-3"
              data-testid="memory-encounter-result"
            >
              <p
                class="text-[10px] font-bold uppercase tracking-widest text-[#f2d99d]"
              >
                Recorded in the Chronicle
              </p>
              <p class="mt-1 text-sm leading-relaxed">
                {{ inspector.chosen.outcome }}
              </p>
            </div>
            <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                v-for="(choice, index) in inspector.current.choices"
                :key="choice.id"
                type="button"
                class="overflow-hidden rounded-xl border border-[#9c8868] bg-[#2b3740] text-left transition hover:border-[#ffdda2] hover:bg-[#364752] focus-visible:outline-2 focus-visible:outline-[#f9d18f]"
                :data-testid="'memory-encounter-choice-' + choice.id"
                @click="inspector.choose(choice.id)"
              >
                <div
                  class="relative flex h-16 items-end overflow-hidden bg-[linear-gradient(135deg,#644c60,#2b5758,#7f6048)] p-2 sm:h-24"
                >
                  <img
                    v-if="choice.art.status === 'delivered'"
                    :src="choice.art.path"
                    :alt="'Illustration of ' + choice.label"
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                  <span
                    v-else
                    class="rounded bg-[#121a24]/80 px-2 py-1 text-[10px] text-[#e5d0b0]"
                  >
                    Choice {{ index + 1 }} · art pending
                  </span>
                </div>
                <span
                  class="block px-3 py-2 text-xs font-bold leading-snug sm:text-sm"
                >
                  {{ choice.label }}
                </span>
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>

    <footer
      class="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#a98b5b]/30 px-3 py-1 text-[10px] text-[#d4c09b]"
    >
      <span
        >Admin preview only · Main campaign and Classic Match remain
        unchanged</span
      >
      <span
        >Every coordinate keeps its choices; art is not marked delivered until
        verified</span
      >
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMemoryEncounterInspectorStore } from '~/stores/memoryEncounterInspectorStore'
import recipes from '~/utils/memoryDungeon/overworldEventRecipes.json'
import type { OverworldKind } from '~/utils/memoryDungeon/overworldEventCatalog'

const inspector = useMemoryEncounterInspectorStore()
const titles: Record<string, string> = Object.fromEntries([
  ['e01', 'Briar Marches'],
  ['e02', 'Briar Understory'],
  ['e07', 'Hoshimori · Lantern Village'],
  ...recipes.worlds.map((world) => [world.id, world.title]),
])
const heading = computed(() => titleFor(inspector.active))
function titleFor(id: string): string {
  return titles[id] ?? 'Uncharted realm'
}
function selectWorld(event: Event): void {
  const target = event.target as HTMLSelectElement
  inspector.select(target.value)
}
function glyphFor(kind: OverworldKind): string {
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
  if (tile.current)
    return 'border-[#f3ce88] bg-[#916f44] text-white shadow-[0_0_18px_#ebb76d66]'
  if (tile.resolved) return 'border-[#9fbc9f] bg-[#395c52] text-[#f0ffe9]'
  if (tile.revealed) return 'border-[#99896d] bg-[#46535b] text-[#f7e8c7]'
  if (tile.reachable)
    return 'border-[#d3ae71] bg-[#6c5142] text-[#ffedcf] hover:bg-[#986844]'
  return 'border-[#404d50] bg-[#1c2831] text-[#4a5961]'
}
onMounted(() => inspector.hydrate())
</script>

<style scoped>
.md-reveal-grid {
  background:
    radial-gradient(ellipse at 15% 75%, #65836a55 0%, transparent 50%),
    radial-gradient(ellipse at 78% 18%, #a9855855 0%, transparent 45%),
    repeating-linear-gradient(45deg, #253944 0 10px, #1f323d 10px 20px);
}
.md-encounter-stage {
  isolation: isolate;
}
.md-encounter-monster,
.md-encounter-dungeon {
  box-shadow: inset 0 0 72px #6e293755;
}
.md-encounter-treasure,
.md-encounter-merchant {
  box-shadow: inset 0 0 72px #d39c4755;
}
</style>
