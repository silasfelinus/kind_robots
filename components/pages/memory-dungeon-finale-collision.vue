<template>
  <section
    class="kr-surface flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl text-[#f4ead7]"
    :class="theme.surface"
    data-layout="console-fixed"
    :data-testid="`memory-finale-collision-${world}`"
  >
    <header-page-bar console-theme="memory-dungeon">
      <div class="md-bar" data-testid="memory-finale-collision-header">
        <h2 class="md-bar-title" :title="theme.subtitle">
          {{ theme.title }}
        </h2>
        <span class="md-bar-chip">{{ collision.fragments }}/2 memories</span>
        <div class="md-bar-end">
          <button
            type="button"
            class="btn btn-sm btn-outline"
            @click="emit('leave')"
          >
            Briar camp
          </button>
        </div>
      </div>
    </header-page-bar>

    <div
      v-if="!collision.unlocked"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-5 text-center"
      data-testid="memory-finale-collision-locked"
    >
      <h3 class="text-2xl font-black">{{ theme.lockedTitle }}</h3>
      <p class="max-w-lg text-sm leading-relaxed">{{ theme.lockedText }}</p>
      <button type="button" class="btn btn-warning" @click="emit('leave')">
        Return to the journey
      </button>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 grid-rows-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2 p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:grid-rows-1"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#b8a47e]/40"
        :class="theme.panel"
        :aria-label="theme.mapLabel"
      >
        <div class="flex shrink-0 justify-between gap-2 px-3 py-2 text-xs">
          <strong>{{ theme.mapTitle }}</strong>
          <span>
            {{ collision.progress.revealed.length }}/64 explored ·
            {{ Object.keys(collision.progress.choices).length }} decisions
          </span>
        </div>
        <div
          class="grid min-h-0 flex-1 grid-cols-8 grid-rows-8 gap-1 p-2"
          role="group"
          aria-label="Move one adjacent square to explore"
        >
          <button
            v-for="tile in collision.tiles"
            :key="tile.key"
            type="button"
            class="relative min-h-0 min-w-0 rounded-md border text-xs font-black transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ffe3a7] sm:text-base"
            :class="
              tile.current
                ? 'border-[#ffe3a7] bg-[#c69a62] text-[#17232c]'
                : tile.resolved
                  ? 'border-[#8dc6ae] bg-[#3d695c]'
                  : tile.revealed
                    ? 'border-[#b8a47e] bg-[#4c626a]'
                    : tile.reachable
                      ? 'border-[#edc18c] bg-[#765d47] hover:bg-[#937454]'
                      : 'border-[#34494b] bg-black/30 text-[#81959a]'
            "
            :disabled="!tile.reachable || collision.completed"
            :aria-current="tile.current ? 'location' : undefined"
            :aria-label="
              tile.revealed
                ? tile.title + (tile.resolved ? ', resolved' : ', unresolved')
                : tile.reachable
                  ? 'Explore ' + tile.key
                  : 'Undiscovered ' + tile.key
            "
            @click="collision.travel(tile.key)"
          >
            {{
              tile.current
                ? '◆'
                : tile.resolved
                  ? '✓'
                  : tile.revealed
                    ? tile.fragment
                      ? '✦'
                      : '◇'
                    : tile.reachable
                      ? '◈'
                      : '·'
            }}
          </button>
        </div>
        <div
          class="flex shrink-0 flex-wrap justify-between gap-2 border-t border-[#b8a47e]/30 px-3 py-2 text-xs"
        >
          <span>Supplies {{ collision.progress.supplies }}</span>
          <span>Trust {{ collision.progress.trust }}</span>
          <span>Evidence {{ collision.progress.evidence }}</span>
          <span>Danger {{ collision.progress.danger }}</span>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#b8a47e]/40 bg-[#2b3540]"
        aria-label="Current encounter and consequences"
      >
        <div
          v-if="collision.current && !collision.ending"
          class="relative flex min-h-[6rem] flex-[1_1_42%] flex-col justify-end overflow-hidden border-b border-[#b8a47e]/30 p-3"
          :class="theme.stage"
        >
          <img
            v-if="collision.current.sceneArt.status === 'delivered'"
            :src="collision.current.sceneArt.path"
            :alt="collision.current.title"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div class="relative max-w-2xl rounded-lg bg-[#121e26]/85 p-3">
            <p
              class="text-[10px] font-black uppercase tracking-widest text-[#e9c48c]"
            >
              {{ collision.current.speaker }} · {{ collision.position }}
            </p>
            <h3 class="mt-1 text-lg font-black sm:text-2xl">
              {{ collision.current.title }}
            </h3>
            <p class="mt-2 text-xs leading-relaxed sm:text-sm">
              {{ collision.current.opening }}
            </p>
          </div>
          <span
            v-if="collision.current.sceneArt.status !== 'delivered'"
            class="absolute right-2 top-2 rounded bg-[#141d25]/85 px-2 py-1 text-[10px]"
          >
            Scene illustration pending
          </span>
        </div>
        <div
          v-else-if="collision.ending"
          class="relative flex min-h-[6rem] flex-[1_1_42%] flex-col justify-end overflow-hidden border-b border-[#b8a47e]/30 p-3"
          :class="theme.stage"
          data-testid="memory-finale-ending-stage"
        >
          <div class="relative max-w-2xl rounded-lg bg-[#121e26]/85 p-3">
            <p
              class="text-[10px] font-black uppercase tracking-widest text-[#e9c48c]"
            >
              Ending {{ collision.ending.id + 1 }} of 32
            </p>
            <h3 class="mt-1 text-lg font-black sm:text-2xl">
              {{ collision.ending.title }}
            </h3>
          </div>
        </div>
        <div
          class="kr-scroll min-h-0 flex-[0_1_auto] overflow-y-auto p-3 empty:hidden"
        >
          <p
            v-if="collision.notice"
            class="mb-2 text-xs text-[#f6d49a]"
            role="status"
          >
            {{ collision.notice }}
          </p>
          <div
            v-if="collision.ending"
            class="rounded-xl border border-[#87c6ae]/60 bg-[#34524c] p-3"
            data-testid="memory-finale-ending"
          >
            <p class="text-sm leading-relaxed">
              {{ collision.ending.closing }}
            </p>
            <ul class="mt-3 space-y-1 text-xs leading-relaxed text-[#d8ecd9]">
              <li v-for="line in collision.epilogue" :key="line">
                {{ line }}
              </li>
            </ul>
          </div>
          <div
            v-else-if="collision.completed"
            class="rounded-xl border border-[#87c6ae]/60 bg-[#34524c] p-3"
            data-testid="memory-finale-collision-complete"
          >
            <p class="text-sm leading-relaxed">{{ theme.completeText }}</p>
          </div>
          <div
            v-else-if="collision.atCrossing"
            class="rounded-xl border border-[#e9c48c]/60 bg-[#514336] p-3"
            data-testid="memory-finale-crossing"
          >
            <p class="text-sm leading-relaxed">
              {{
                world === 'e12'
                  ? collision.verdict
                    ? 'Every road Vesper opened or closed waits behind the Last Door. One choice remains, and it belongs to everyone the worlds have carried this far.'
                    : 'The Last Door will not open until Vesper says what the broken roads become.'
                  : theme.crossingText
              }}
            </p>
          </div>
          <div
            v-else-if="collision.chosen"
            class="rounded-xl border border-[#87c6ae]/60 bg-[#34524c] p-3"
            data-testid="memory-finale-collision-outcome"
          >
            <p class="text-xs font-black uppercase tracking-wider">
              {{ theme.lead }}'s recorded decision
            </p>
            <p class="mt-2 text-sm leading-relaxed">
              {{ collision.chosen.outcome }}
            </p>
          </div>
          <div
            v-if="
              collision.crossingEarned &&
              !collision.atCrossing &&
              !collision.completed
            "
            class="mt-3 rounded-xl border border-[#e9c48c]/60 bg-[#514336] p-3"
            data-testid="memory-finale-collision-crossing-pending"
          >
            <p class="text-sm leading-relaxed">
              Both displaced memories and twelve witnessed decisions are
              recorded. Walk to 8,8 and face the crossing there.
            </p>
          </div>
        </div>
        <memory-dungeon-choice-hand
          v-if="collision.atCrossing && world === 'e11'"
          class="shrink-0"
          :choices="crossOver"
          deal-key="crossing"
          icon="✦"
          testid-prefix="memory-finale-crossing-choice"
          @play="() => collision.conclude()"
        />
        <memory-dungeon-choice-hand
          v-else-if="collision.atCrossing && !collision.verdict"
          class="shrink-0"
          :choices="collision.verdictChoices"
          deal-key="verdict"
          icon="⌛"
          testid-prefix="memory-finale-verdict-choice"
          @play="(choice) => collision.chooseVerdict(choice.id)"
        />
        <memory-dungeon-choice-hand
          v-else-if="collision.atCrossing"
          class="shrink-0"
          :choices="collision.lastChoices"
          deal-key="last-door"
          icon="✦"
          testid-prefix="memory-finale-last-choice"
          @play="(choice) => collision.conclude(choice.id)"
        />
        <memory-dungeon-choice-hand
          v-else-if="
            !collision.completed && !collision.chosen && collision.current
          "
          class="shrink-0"
          :choices="collision.current.choices"
          :deal-key="collision.current.id"
          icon="◈"
          testid-prefix="memory-finale-collision-choice"
          @play="(choice) => collision.choose(choice.id)"
        />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  useMemoryHoshimoriCollisionStore,
  useMemorySeaCollisionStore,
} from '~/stores/memoryFinaleCollisionStore'

const props = defineProps<{ world: 'e11' | 'e12' }>()
const emit = defineEmits<{ leave: [] }>()
const sea = useMemorySeaCollisionStore()
const village = useMemoryHoshimoriCollisionStore()
const collision = computed(() => (props.world === 'e11' ? sea : village))

const THEMES = {
  e11: {
    title: 'The Sea Collision',
    subtitle: 'Char · The Sea of Strangers',
    lead: 'Char',
    mapTitle: 'Coral / Station / Refuge',
    mapLabel: "Char's eight by eight sea collision map",
    surface: 'bg-[#10222b]',
    panel: 'bg-[#1f3f4a]',
    stage: 'bg-[linear-gradient(130deg,#1d4a57,#3e5f6b,#1b2c3d)]',
    lockedTitle: 'The sea has no safe crossing yet.',
    lockedText:
      "Char's crossing opens only after Morrow's city is resolved and both of its displaced memories are recovered.",
    crossingText:
      'The station sea holds both of its displaced memories. Char can cross with what she chose to keep and leave the rest to the tide.',
    completeText:
      "Char's crossing is complete, carried in her own words. Vesper's last road is next.",
  },
  e12: {
    title: 'The Last Road',
    subtitle: 'Vesper · Hoshimori, the last unwritten road',
    lead: 'Vesper',
    mapTitle: 'Bridge / Wolf Road / Tide Oven',
    mapLabel: "Vesper's eight by eight Hoshimori collision map",
    surface: 'bg-[#1d1626]',
    panel: 'bg-[#33283f]',
    stage: 'bg-[linear-gradient(130deg,#3c2a4a,#6b4a3c,#22263a)]',
    lockedTitle: 'The village road is still unwritten.',
    lockedText:
      "Vesper's road opens only after Char's crossing is complete and both of the sea's displaced memories are recovered.",
    crossingText: '',
    completeText: 'The Last Door has answered.',
  },
} as const
const theme = computed(() => THEMES[props.world])
const crossOver = [
  {
    id: 'cross',
    label: 'Carry both memories across the station sea',
    hint: THEMES.e11.completeText,
  },
]

onMounted(() => collision.value.hydrate())
</script>
