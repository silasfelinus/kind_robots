<template>
  <section
    class="kr-surface flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-base-300 text-base-content"
    data-layout="console-fixed"
    data-testid="memory-hoshimori-console"
  >
    <header
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-base-content/20 bg-base-200 px-3 py-2"
    >
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-lg font-black">Hoshimori · Lantern Village</h2>
        <p class="text-xs opacity-75">
          A village remembers who was invited to supper.
        </p>
      </div>
      <span class="rounded-lg bg-base-300 px-2 py-1 text-xs font-bold">
        {{ hoshimori.progress.visited.length }}/16 paths
      </span>
      <span class="rounded-lg bg-base-300 px-2 py-1 text-xs font-bold">
        Food {{ hoshimori.progress.rations }} · Trust
        {{ hoshimori.progress.trust }}
      </span>
      <button
        type="button"
        class="btn btn-sm btn-outline"
        @click="hoshimori.restart()"
      >
        New journey
      </button>
      <button type="button" class="btn btn-sm" @click="emit('leave')">
        Back
      </button>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-2 p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-1"
    >
      <div
        class="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-warning/40 bg-gradient-to-br from-success/20 via-base-200 to-warning/20 p-2"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-2 px-1 pb-2 text-xs font-bold"
        >
          <span>The mountain paths</span>
          <span class="opacity-70">Move to a neighboring lantern</span>
        </div>
        <div
          class="grid min-h-0 flex-1 grid-cols-8 grid-rows-8 gap-1"
          role="group"
          aria-label="Hoshimori eight by eight exploration map"
        >
          <template v-for="key in tiles" :key="key">
            <button
              v-if="siteFor(key)"
              type="button"
              class="min-h-0 min-w-0 rounded-md border text-sm font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-warning sm:text-xl"
              :class="
                key === hoshimori.progress.current
                  ? 'border-warning bg-warning text-warning-content shadow-lg'
                  : hoshimori.canMove(key)
                    ? 'border-success/80 bg-success/25 hover:bg-success/45'
                    : hoshimori.progress.visited.includes(key)
                      ? 'border-base-content/25 bg-base-300/70'
                      : 'border-base-content/10 bg-base-300/30'
              "
              :disabled="!hoshimori.canMove(key)"
              :aria-label="
                hoshimori.progress.visited.includes(key)
                  ? siteFor(key)?.title
                  : hoshimori.canMove(key)
                    ? 'Explore neighboring location'
                    : 'Unexplored location'
              "
              :aria-current="
                key === hoshimori.progress.current ? 'location' : undefined
              "
              @click="hoshimori.act({ type: 'move', to: key })"
            >
              {{
                key === hoshimori.progress.current
                  ? '✦'
                  : hoshimori.progress.visited.includes(key)
                    ? '◆'
                    : hoshimori.canMove(key)
                      ? '◈'
                      : '·'
              }}
            </button>
            <span
              v-else
              class="rounded-md border border-base-content/5 bg-base-content/5"
              aria-hidden="true"
            />
          </template>
        </div>
        <div class="shrink-0 px-1 pt-2 text-xs opacity-75">
          The other paths are not yet charted. The Red Oven stands at the far
          end of this first village.
        </div>
      </div>

      <div
        class="kr-scroll flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto overscroll-contain rounded-2xl border border-base-content/20 bg-base-200 p-3 sm:p-4"
        aria-live="polite"
      >
        <p
          v-if="hoshimori.notice"
          class="rounded-lg border border-warning/50 bg-warning/10 p-2 text-sm"
          role="status"
        >
          {{ hoshimori.notice }}
        </p>

        <p
          v-if="hoshimori.lastOvenOutcome"
          class="rounded-xl border border-success/30 bg-success/15 p-3 text-base leading-relaxed"
          role="status"
        >
          {{ hoshimori.lastOvenOutcome }}
        </p>

        <template v-if="hoshimori.currentOvenRoom">
          <p class="text-xs font-bold uppercase tracking-widest text-warning">
            The Red Oven
          </p>
          <h3 class="text-xl font-black">
            {{ hoshimori.currentOvenRoom.title }}
          </h3>
          <p class="text-base leading-relaxed">
            {{ hoshimori.currentOvenRoom.opening }}
          </p>
          <p
            v-if="hoshimori.progress.ovenChoices[hoshimori.currentOvenRoom.id]"
            class="rounded-xl bg-success/15 p-3 text-base leading-relaxed"
          >
            {{
              hoshimori.currentOvenRoom.choices.find(
                (choice) =>
                  choice.id ===
                  hoshimori.progress.ovenChoices[hoshimori.currentOvenRoom!.id],
              )?.outcome
            }}
          </p>
          <div class="flex flex-col gap-2">
            <button
              v-for="choice in hoshimori.currentOvenRoom.choices"
              :key="choice.id"
              type="button"
              class="btn h-auto min-h-14 justify-start whitespace-normal py-3 text-left text-base leading-snug"
              :disabled="hoshimori.progress.rations + (choice.rations ?? 0) < 0"
              @click="hoshimori.act({ type: 'oven-choice', id: choice.id })"
            >
              {{ choice.label }}
            </button>
            <button
              type="button"
              class="btn btn-outline"
              @click="hoshimori.act({ type: 'leave' })"
            >
              Return to the village
            </button>
          </div>
        </template>

        <template v-else>
          <p class="text-xs font-bold uppercase tracking-widest text-success">
            Village encounter
          </p>
          <h3 class="text-xl font-black">{{ hoshimori.currentSite?.title }}</h3>
          <p class="text-base leading-relaxed">
            {{ hoshimori.currentSite?.opening }}
          </p>
          <template v-if="selectedChoice">
            <p
              class="rounded-xl border border-success/30 bg-success/15 p-3 text-base leading-relaxed"
            >
              {{ selectedChoice.outcome }}
            </p>
          </template>
          <div v-else class="flex flex-col gap-2">
            <button
              v-for="choice in hoshimori.currentSite?.choices"
              :key="choice.id"
              type="button"
              class="btn h-auto min-h-14 justify-start whitespace-normal py-3 text-left text-base leading-snug"
              :disabled="hoshimori.progress.rations + (choice.rations ?? 0) < 0"
              @click="hoshimori.act({ type: 'choose', id: choice.id })"
            >
              {{ choice.label }}
            </button>
          </div>

          <div
            v-if="hoshimori.clues.length"
            class="rounded-xl border border-warning/30 bg-warning/10 p-3"
          >
            <p class="font-bold">The lantern sequence</p>
            <p class="text-sm">
              Remember the symbols found along the paths, in their numbered
              order.
            </p>
            <p class="mt-1 text-sm font-bold">
              {{
                hoshimori.clues
                  .map((clue) => `${clue.position}. ${clue.symbol}`)
                  .join(' · ')
              }}
            </p>
            <div
              v-if="!hoshimori.progress.lanternLit"
              class="mt-2 flex flex-wrap items-center gap-2"
            >
              <select
                v-for="(_, index) in lanternSymbols"
                :key="index"
                v-model="lanternSymbols[index]"
                class="select select-bordered select-sm min-w-0 flex-1"
                :aria-label="`Lantern symbol ${index + 1}`"
              >
                <option v-for="symbol in symbols" :key="symbol" :value="symbol">
                  {{ symbol }}
                </option>
              </select>
              <button
                type="button"
                class="btn btn-sm btn-warning"
                :disabled="hoshimori.clues.length !== 3"
                @click="
                  hoshimori.act({ type: 'light', symbols: [...lanternSymbols] })
                "
              >
                Light lanterns
              </button>
            </div>
            <p v-else class="mt-2 text-sm font-bold text-success">
              The lantern route is open.
            </p>
          </div>
          <button
            v-if="hoshimori.canEnterOven"
            type="button"
            class="btn btn-warning min-h-12 text-base"
            @click="hoshimori.act({ type: 'enter' })"
          >
            Enter the Red Oven
          </button>
          <p
            v-if="hoshimori.resolution"
            class="rounded-xl border border-success/30 bg-success/15 p-3 text-base leading-relaxed"
          >
            {{ hoshimori.resolution }}
          </p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { HOSHIMORI_WARM_SITES } from '~/utils/memoryDungeon/hoshimoriWarm'
import { useMemoryHoshimoriStore } from '~/stores/memoryHoshimoriStore'

const emit = defineEmits<{ leave: [] }>()
const hoshimori = useMemoryHoshimoriStore()
const symbols = ['bell', 'leaf', 'flame'] as const
const lanternSymbols = ref<string[]>(['bell', 'leaf', 'flame'])
const tiles = Array.from(
  { length: 64 },
  (_, index) => `${(index % 8) + 1},${Math.floor(index / 8) + 1}`,
)
const sites = new Map(HOSHIMORI_WARM_SITES.map((site) => [site.key, site]))
const siteFor = (key: string) => sites.get(key)
const selectedChoice = computed(() =>
  hoshimori.currentSite?.choices.find(
    (choice) =>
      choice.id === hoshimori.progress.choices[hoshimori.progress.current],
  ),
)

onMounted(() => hoshimori.hydrate())
</script>
