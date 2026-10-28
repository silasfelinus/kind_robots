<template>
  <section
    class="md-house-stage relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#111c24] p-2 text-[#ebdebf]"
    aria-label="The House That Remembers, thirty-six-room dungeon"
    data-testid="memory-house-console"
  >
    <header
      class="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-[#8e795a] bg-[#29251f] px-3 py-2 text-sm"
    >
      <div>
        <h2 class="font-serif text-lg font-black">The House That Remembers</h2>
        <p class="text-xs text-[#d6c4a1]">
          {{ progress?.visited.length ?? 0 }}/36 rooms explored · each decision
          remembered
        </p>
      </div>
      <button
        v-if="world.houseMayExit"
        type="button"
        class="rounded-lg border border-[#ad946d] bg-[#463e33] px-3 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-white"
        @click="world.exitHouse()"
      >
        Return to Briar ↗
      </button>
      <span v-else class="text-xs text-[#e4d3b2]"
        >Find a marked safe return passage</span
      >
    </header>
    <div class="md-house-grid min-h-0 flex-1">
      <div
        class="md-house-map grid min-h-0 min-w-0 grid-cols-6 grid-rows-6 gap-1 rounded-xl border-2 border-[#958369] bg-[#1c2930] p-2 shadow-inner"
        aria-label="House room atlas, six by six"
      >
        <button
          v-for="item in rooms"
          :key="item.id"
          type="button"
          class="relative min-h-0 min-w-0 rounded-md border text-center focus-visible:outline-2 focus-visible:outline-white"
          :class="{
            'border-[#f8d681] bg-[#786537] text-white shadow-[inset_0_0_12px_#e7c777]':
              progress?.current === item.id,
            'border-[#9bcdb6] bg-[#405949] text-white':
              progress?.visited.includes(item.id) &&
              progress?.current !== item.id,
            'border-[#c6ad77] bg-[#505340] text-white':
              available.includes(item.id) &&
              !progress?.visited.includes(item.id),
            'border-[#374754] bg-[#15212b] text-[#75818c]':
              !available.includes(item.id) &&
              !progress?.visited.includes(item.id),
          }"
          :disabled="
            !available.includes(item.id) || progress?.current === item.id
          "
          :title="
            progress?.visited.includes(item.id) || available.includes(item.id)
              ? item.title
              : 'Unexplored chamber'
          "
          :aria-label="`${item.id}: ${progress?.visited.includes(item.id) || available.includes(item.id) ? item.title : 'unknown'}${progress?.current === item.id ? ', current location' : ''}`"
          @click="world.houseMove(item.id)"
        >
          <memory-dungeon-action-beacon
            v-if="
              available.includes(item.id) &&
              progress?.current !== item.id &&
              (!progress?.visited.includes(item.id) ||
                (item.choices.length > 0 && !progress?.decisions[item.id]))
            "
          />
          <span class="block text-[clamp(9px,1.15vw,13px)] font-black">{{
            item.id.slice(3)
          }}</span>
          <span class="block text-[clamp(10px,1.5vw,19px)]" aria-hidden="true">
            {{
              progress?.current === item.id
                ? '✦'
                : progress?.visited.includes(item.id)
                  ? '✓'
                  : available.includes(item.id)
                    ? '◇'
                    : '·'
            }}
          </span>
        </button>
      </div>
      <div
        class="md-house-encounter min-h-0 overflow-hidden rounded-xl border-2 border-[#ae9263] bg-[#e7d3a9] text-[#2e261a]"
      >
        <div
          class="md-house-portrait relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_55%_30%,#59726a,#25333e_75%)]"
        >
          <img
            v-if="room && displayArtPath && !fallbackArtFailed"
            :key="displayArtPath"
            :src="displayArtPath"
            :alt="`Illustration of ${room.title}`"
            class="h-full w-full object-cover"
            draggable="false"
            @error="handleArtError"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center p-5 text-center text-lg font-serif font-bold text-[#d6c39b]"
            role="img"
            :aria-label="`Illustration unavailable for ${room?.title ?? 'the House'}`"
          >
            <span aria-hidden="true">❖</span>
          </div>
          <span
            class="absolute bottom-0 left-0 rounded-tr-md bg-[#1a2627]/90 px-2 py-1 text-xs font-bold text-white"
          >
            {{ room?.id }} · {{ room?.kind }}
          </span>
        </div>
        <div
          class="md-house-copy kr-scroll min-h-0 overflow-y-auto p-3 sm:p-4"
          data-testid="memory-house-choice-column"
        >
          <h3 class="font-serif text-xl font-black">{{ room?.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed sm:text-base">
            {{ room?.opening }}
          </p>
          <p
            v-if="selectedChoice"
            class="mt-3 rounded-md border border-[#9a804c] bg-[#f9e9c7] p-2 text-sm font-semibold"
            role="status"
          >
            {{ selectedChoice.outcome }}
          </p>
          <div v-else class="mt-3 flex flex-col gap-2">
            <button
              v-for="choice in room?.choices ?? []"
              :key="choice.id"
              class="min-h-12 flex-1 rounded-lg border border-[#807447] bg-[#43563a] px-4 py-3 text-left text-base font-bold leading-snug sm:text-lg lg:text-xl text-white hover:bg-[#617449] focus-visible:outline-2 focus-visible:outline-[#21391e] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              :disabled="!world.canChooseHouse(choice.id)"
              @click="world.chooseHouse(choice.id)"
            >
              {{ choice.label }}
            </button>
          </div>
          <p
            v-if="
              room?.id === 'HD-32' &&
              !world.canChooseHouse('petition') &&
              !progress?.wardenPassed
            "
            class="mt-2 text-xs font-semibold"
          >
            Peaceful passage requires witness testimony from the House or the
            Briar patrol. The telegraphed memory-card challenge remains
            available.
          </p>
          <p v-if="room?.id === 'HD-35'" class="mt-2 text-xs">
            Three outcomes have different consequences. The House will keep
            whichever promise you make here.
          </p>
          <div
            v-if="room?.id === 'HD-36' && epilogue"
            class="mt-3 rounded-md border border-[#9a804c] bg-[#f9e9c7] p-2 text-sm"
            data-testid="memory-house-epilogue"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-[#6b5530]">
              {{ HOUSE_EPILOGUE_LENS_LABELS[epilogue.lens] }}
            </p>
            <h4 class="font-serif text-base font-black">
              {{ epilogue.title }}
            </h4>
            <p class="mt-1 leading-relaxed">{{ epilogue.text }}</p>
            <p class="mt-2 font-bold">The Bramble Chime is within reach.</p>
          </div>
        </div>
      </div>
    </div>
    <footer
      class="kr-scroll mt-2 flex min-h-10 shrink-0 items-center gap-2 overflow-x-auto overscroll-x-contain rounded-lg border border-[#776749] bg-[#272d2b] p-2 text-xs"
      role="group"
      aria-label="Open House passages"
      data-testid="memory-house-passages"
    >
      <span class="shrink-0 whitespace-nowrap font-bold text-[#e6d49d]">Open passages</span>
      <button
        v-for="exit in available"
        :key="exit"
        type="button"
        class="shrink-0 whitespace-nowrap rounded-md border border-[#ac966f] bg-[#3c4f46] px-2 py-1 font-bold text-white focus-visible:outline-2 focus-visible:outline-white"
        :aria-label="`Travel to ${exit}, ${HOUSE_ROOMS[exit]?.title ?? 'unknown chamber'}`"
        @click="world.houseMove(exit)"
      >
        <span class="sm:hidden">{{ exit }}</span>
        <span class="hidden sm:inline"
          >{{ exit }} · {{ HOUSE_ROOMS[exit]?.title }}</span
        >
      </button>
      <span v-if="!available.length"
        >Complete the current challenge to open the next door.</span
      >
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import { houseIllustrationPath } from '~/utils/memoryDungeon/artManifest'
import { HOUSE_ROOMS } from '~/utils/memoryDungeon/house'
import { HOUSE_EPILOGUE_LENS_LABELS } from '~/utils/memoryDungeon/houseEpilogues'

const world = useMemoryWorldStore()
const rooms = Object.values(HOUSE_ROOMS)
const progress = computed(() => world.state.house)
const room = computed(() => world.activeHouseRoom)
const available = computed(() => world.houseAvailableDoors)
const selectedChoice = computed(
  () =>
    room.value?.choices.find(
      (choice) => choice.id === progress.value?.decisions[room.value?.id ?? ''],
    ) ?? null,
)
const epilogue = computed(() => world.houseEpilogue)
const artPath = computed(() =>
  room.value?.id === 'HD-36' && epilogue.value
    ? epilogue.value.artPath
    : houseIllustrationPath(room.value?.id ?? '', selectedChoice.value?.id),
)
const establishingArtPath = computed(() =>
  houseIllustrationPath(room.value?.id ?? ''),
)
const artFailed = ref(false)
const fallbackArtFailed = ref(false)
const displayArtPath = computed(() =>
  artFailed.value ? establishingArtPath.value : artPath.value,
)
function handleArtError() {
  if (!artFailed.value && artPath.value !== establishingArtPath.value)
    artFailed.value = true
  else fallbackArtFailed.value = true
}
watch(artPath, () => {
  artFailed.value = false
  fallbackArtFailed.value = false
})
</script>

<style scoped>
.md-house-stage {
  container: md-house / size;
}
.md-house-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 0.46fr) minmax(0, 0.54fr);
  gap: 0.6rem;
  overflow: hidden;
}
.md-house-map {
  aspect-ratio: 1 / 1;
  place-self: center;
  height: min(100%, 100cqh);
  width: min(100%, 100cqh);
}
.md-house-encounter {
  display: grid;
  grid-template-columns: minmax(0, 0.41fr) minmax(0, 0.59fr);
  min-width: 0;
}
@container md-house (min-width: 760px) {
  .md-house-grid {
    grid-template-columns: minmax(0, 0.48fr) minmax(0, 0.52fr);
    grid-template-rows: minmax(0, 1fr);
  }
}
@container md-house (max-width: 560px) {
  .md-house-encounter {
    grid-template-columns: minmax(0, 0.35fr) minmax(0, 0.65fr);
  }
}
</style>
