<template>
  <section
    class="kr-surface flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-error/30 bg-base-300 text-base-content"
    data-layout="console-fixed"
    data-testid="memory-hoshimori-night-console"
  >
    <header-page-bar>
      <div class="md-bar" data-testid="memory-hoshimori-night-header">
        <h2
          class="md-bar-title"
          title="Vesper remembers the village. The village will not let anyone leave."
        >
          Hoshimori · Procession of Shut Doors
        </h2>
        <span class="md-bar-chip">
          {{ night.progress.visited.length }}/{{ HOSHIMORI_NIGHT_SITES.length }}
          witnessed
        </span>
        <div class="md-bar-actions">
          <button
            v-if="
              night.progress.current === '4,3' && night.progress.choices['4,3']
            "
            type="button"
            class="btn btn-sm btn-soft btn-error"
            data-testid="memory-enter-furnace"
            @click="emit('furnace')"
          >
            Enter the Furnace of Names
          </button>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            @click="night.restart()"
          >
            New night
          </button>
        </div>
        <div class="md-bar-end">
          <button
            type="button"
            class="btn btn-sm btn-outline"
            @click="emit('leave')"
          >
            Back
          </button>
        </div>
      </div>
    </header-page-bar>
    <div
      class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-2 p-2 md:grid-cols-2 md:grid-rows-1"
    >
      <div
        class="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-error/40 bg-gradient-to-br from-error/20 via-base-300 to-base-100 p-2"
      >
        <div
          class="flex shrink-0 justify-between gap-2 px-1 pb-2 text-xs font-bold"
        >
          <span>Same village, altered promises</span>
          <span class="opacity-70">Adjacent squares only</span>
        </div>
        <div
          class="grid min-h-0 flex-1 grid-cols-8 grid-rows-8 gap-1"
          role="group"
          aria-label="Hoshimori night exploration map"
        >
          <template v-for="key in tiles" :key="key">
            <button
              v-if="siteFor(key)"
              type="button"
              class="min-h-0 min-w-0 rounded-md border text-sm font-black focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-warning sm:text-xl"
              :class="
                key === night.progress.current
                  ? 'border-error bg-error text-error-content shadow-lg'
                  : night.canMove(key)
                    ? 'border-warning/80 bg-warning/20 hover:bg-warning/40'
                    : night.progress.visited.includes(key)
                      ? 'border-base-content/25 bg-base-200/70'
                      : 'border-base-content/10 bg-base-300/40'
              "
              :disabled="!night.canMove(key)"
              :aria-label="
                night.progress.visited.includes(key)
                  ? siteFor(key)?.title
                  : night.canMove(key)
                    ? 'Explore neighboring night site'
                    : 'Unexplored night site'
              "
              :aria-current="
                key === night.progress.current ? 'location' : undefined
              "
              @click="night.act({ type: 'move', to: key })"
            >
              {{
                key === night.progress.current
                  ? '✦'
                  : night.progress.visited.includes(key)
                    ? '◆'
                    : night.canMove(key)
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
        <p class="shrink-0 px-1 pt-2 text-xs opacity-75">
          The wall seals one crossing. The shrine path remains open without a
          bargain.
        </p>
      </div>
      <div
        class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-base-content/15 bg-base-200"
      >
        <div
          class="min-h-0 flex-1 overflow-y-auto p-3 kr-scroll"
          aria-live="polite"
        >
          <p class="text-xs font-bold uppercase tracking-widest text-error">
            Vesper's account · {{ night.progress.current }}
          </p>
          <h3 class="mt-1 text-xl font-black">
            {{ night.currentSite?.title }}
          </h3>
          <p class="mt-2 text-base leading-relaxed">
            {{ night.currentSite?.opening }}
          </p>
          <div
            v-if="night.progress.choices[night.progress.current]"
            class="mt-3 rounded-xl border border-success/40 bg-success/10 p-3"
          >
            <p class="text-xs font-bold uppercase tracking-wide">
              Your recorded choice
            </p>
            <p class="mt-1 text-sm">{{ chosenOutcome }}</p>
          </div>
          <memory-dungeon-choice-hand
            v-else-if="night.currentSite"
            class="mt-3"
            :choices="night.currentSite.choices"
            :deal-key="night.currentSite.key"
            icon="🌙"
            palette="theme"
            testid-prefix="memory-hoshimori-night-choice"
            @play="(choice) => night.act({ type: 'choose', id: choice.id })"
          />
          <div
            v-if="night.progress.current === '4,2' && !night.progress.doorOpen"
            class="mt-3 rounded-xl border border-warning/40 p-3"
          >
            <h4 class="font-bold">Unbind the Nurikabe</h4>
            <p class="mt-1 text-sm">
              Hear the bridge, the choir and the walking coat. Repeat their
              signs in that order, or take the shrine path.
            </p>
            <p class="mt-1 text-xs">
              Witnessed signs: {{ night.clues.length }}/3 ·
              {{ night.clues.join(' → ') || 'none yet' }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <select
                v-for="(_, index) in 3"
                :key="index"
                v-model="selectedSigns[index]"
                class="select select-sm select-bordered min-w-24 flex-1"
                :aria-label="'Procession sign ' + (index + 1)"
              >
                <option value="">Choose sign</option>
                <option v-for="sign in signs" :key="sign" :value="sign">
                  {{ sign }}
                </option>
              </select>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-warning mt-2"
              :disabled="
                night.clues.length !== 3 || selectedSigns.some((sign) => !sign)
              "
              @click="night.act({ type: 'unbind', signs: [...selectedSigns] })"
            >
              Speak the remembered promise
            </button>
          </div>
          <p v-if="night.progress.doorOpen" class="mt-3 text-sm text-success">
            The wall has opened. The procession cannot charge this toll again.
          </p>
          <div
            v-if="night.council"
            class="mt-3 rounded-xl border border-info/40 bg-info/10 p-3"
          >
            <h4 class="font-bold">The southern council's earned testimony</h4>
            <p class="mt-1 text-sm leading-relaxed">{{ night.council }}</p>
          </div>
          <p
            v-if="!night.council"
            class="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-2 text-sm"
          >
            The Windward ridge is sealed until the ledger house, festival path
            and southern council have each recorded a real choice. The shrine
            detour remains open.
          </p>
          <div
            v-if="night.windward"
            class="mt-3 rounded-xl border border-info/40 bg-info/10 p-3"
          >
            <h4 class="font-bold">The Windward Council’s earned account</h4>
            <p class="mt-1 text-sm leading-relaxed">{{ night.windward }}</p>
          </div>
          <p
            v-if="night.council && !night.windward"
            class="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-2 text-sm"
          >
            The Bellroad is closed until the Windward post, weather desk and
            council have recorded a real decision. No traveler is required to
            trade a name for passage.
          </p>
          <div
            v-if="night.bellroad"
            class="mt-3 rounded-xl border border-success/40 bg-success/10 p-3"
          >
            <h4 class="font-bold">The Bellroad's earned witness account</h4>
            <p class="mt-1 text-sm leading-relaxed">{{ night.bellroad }}</p>
          </div>
          <p
            v-if="night.bellroad && !night.lowbank"
            class="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-2 text-sm"
          >
            The Lowbank flood route requires earned testimony from the Mooncake
            Queue, kappa ferry and shrine. No family must surrender its home to
            enter.
          </p>
          <div
            v-if="night.lowbank"
            class="mt-3 rounded-xl border border-info/40 bg-info/10 p-3"
          >
            <h4 class="font-bold">The Lowbank’s earned flood account</h4>
            <p class="mt-1 text-sm leading-relaxed">{{ night.lowbank }}</p>
          </div>
          <p
            v-if="night.notice"
            class="mt-3 text-sm text-warning"
            role="status"
          >
            {{ night.notice }}
          </p>
        </div>
        <div
          class="shrink-0 border-t border-base-content/10 px-3 py-2 text-xs opacity-75"
        >
          {{ HOSHIMORI_NIGHT_SITES.length }} authored night sites. The Furnace
          of Names opens after your decision at the bakery corner (4,3).
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMemoryHoshimoriNightStore } from '~/stores/memoryHoshimoriNightStore'
import { HOSHIMORI_NIGHT_SITES } from '~/utils/memoryDungeon/hoshimoriNight'

const emit = defineEmits<{ leave: []; furnace: [] }>()
const night = useMemoryHoshimoriNightStore()
const tiles = Array.from(
  { length: 64 },
  (_, index) =>
    String((index % 8) + 1) + ',' + String(Math.floor(index / 8) + 1),
)
const signs = ['cedar', 'bell', 'coat', 'ash']
const selectedSigns = ref(['', '', ''])
const siteFor = (key: string) =>
  HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)
const chosenOutcome = computed(
  () =>
    night.currentSite?.choices.find(
      (choice) => choice.id === night.progress.choices[night.progress.current],
    )?.outcome ?? '',
)
onMounted(() => night.hydrate())
</script>
