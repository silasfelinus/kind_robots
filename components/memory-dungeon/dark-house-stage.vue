<template>
  <section class="md-mirror-house flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0e1722] text-[#f6e8d5]" aria-label="The Unremembered House dungeon" data-testid="dark-house-console">
    <header class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-violet-400/40 bg-[#2f2439] px-3 py-2">
      <div>
        <h2 class="font-serif text-lg font-black">The Unremembered House</h2>
        <p class="text-xs text-[#d5c2e0]">{{ world.darkHouse.visited.length }}/36 rooms visited · eight witnesses carried inside</p>
      </div>
      <button type="button" class="rounded-md border border-violet-300/70 px-3 py-2 text-xs font-bold hover:bg-white/10" @click="world.leaveDarkHouse()">Return to mirrored forest</button>
    </header>
    <div class="md-mirror-house-layout grid min-h-0 flex-1 gap-2 p-2">
      <div class="relative grid aspect-square max-h-full w-full min-w-0 grid-cols-6 grid-rows-6 gap-1 place-self-center overflow-hidden rounded-xl border-2 border-[#8d76a8] bg-[#171a2d] p-2 shadow-2xl" aria-label="Thirty-six linked House chambers">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="relative min-h-0 min-w-0 rounded-md border text-center focus-visible:outline-2 focus-visible:outline-white"
          :class="world.darkHouse.current === room.id
            ? 'border-[#f5d89a] bg-[#655179] text-white'
            : world.darkHouse.visited.includes(room.id)
              ? 'border-[#81b7a8] bg-[#34544f] text-[#f4fff8]'
              : world.darkHouseDoors.includes(room.id)
                ? 'border-[#b99bcf] bg-[#4d3d61] text-white'
                : 'border-[#42445d] bg-[#1b2031] text-[#8390a3]'"
          :disabled="!world.darkHouseDoors.includes(room.id)"
          :aria-label="`${room.id}: ${world.darkHouse.visited.includes(room.id) || world.darkHouseDoors.includes(room.id) ? room.title : 'unknown room'}`"
          @click="world.walkDarkHouse(room.id)"
        >
          <span class="block text-[10px] font-black sm:text-xs">{{ room.id.slice(3) }}</span>
          <span class="block text-sm" aria-hidden="true">{{ world.darkHouse.current === room.id ? '✦' : world.darkHouse.visited.includes(room.id) ? '✓' : world.darkHouseDoors.includes(room.id) ? '◇' : '·' }}</span>
        </button>
      </div>
      <aside class="flex min-h-0 flex-col overflow-hidden rounded-xl border-2 border-[#9f80b5] bg-[#e7d9d9] text-[#291f30] shadow-xl">
        <div class="relative h-[34%] min-h-[90px] shrink-0 overflow-hidden bg-[#292a42]">
          <img v-if="artAvailable" :key="room?.id" :src="room?.imagePath" class="h-full w-full object-cover" :alt="`Illustration of ${room?.title}`" @error="artAvailable = false" />
          <div v-else class="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_40%,#4b4866,#171b2b_85%)] text-3xl text-[#d8c7ed]" role="img" :aria-label="`Illustration awaiting rendering for ${room?.title}`">✥</div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#090c1dd9] to-transparent"></div>
          <h3 class="absolute bottom-2 left-3 font-serif text-lg font-black text-[#fff5df] sm:text-xl">{{ room?.title }}</h3>
        </div>
        <div class="kr-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <p class="mb-2 text-[10px] font-black uppercase tracking-widest text-[#6c4b78]">{{ room?.id }} · {{ room?.kind }}</p>
          <p class="text-sm leading-relaxed sm:text-base">{{ world.darkHouse.decisions[world.darkHouse.current] ? chosen?.outcome : room?.opening }}</p>
          <div v-if="!world.darkHouse.decisions[world.darkHouse.current]" class="mt-3 flex flex-col gap-2" data-testid="dark-house-choices">
            <button v-for="choice in room?.choices ?? []" :key="choice.id" type="button" class="min-h-10 rounded-lg bg-[#513d65] px-3 py-2 text-left text-sm font-bold text-[#fff5e5] hover:bg-[#694f7e] focus-visible:outline-2 focus-visible:outline-[#211629]" @click="world.chooseDarkHouse(choice.id)">{{ choice.label }}</button>
          </div>
          <p v-else class="mt-2 text-xs font-bold text-[#42604e]">✓ This chamber remembers your decision.</p>
          <p v-if="world.darkHouse.current === 'HD-32' && !world.darkHouse.decisions['HD-32']" class="mt-2 rounded-lg border border-violet-500/30 bg-violet-100 p-2 text-xs">
            The Warden recognizes the eight witnesses. Your testimony decides whether the inner chamber opens.
          </p>
          <p v-if="world.darkHouse.ending" class="mt-3 rounded-lg bg-violet-100 p-2 text-sm font-bold">House resolution: {{ world.darkHouse.ending }}. The world retains every earlier choice.</p>
          <div class="mt-3 flex flex-wrap gap-2 border-t border-[#ac95ac] pt-3">
            <button v-for="door in world.darkHouseDoors" :key="door" class="rounded-md border border-[#78618f] bg-[#493858] px-2 py-1.5 text-xs font-bold text-white" type="button" @click="world.walkDarkHouse(door)">
              {{ door }} · {{ roomsById[door]?.title }}
            </button>
          </div>
          <p class="mt-3 text-xs text-[#765b7b]">{{ world.darkHouse.status }}</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import { DARK_HOUSE_ROOMS } from '~/utils/memoryDungeon/darkHouse'

const world = useMemoryWorldStore()
const roomsById = DARK_HOUSE_ROOMS
const rooms = Object.values(DARK_HOUSE_ROOMS)
const room = computed(() => world.darkHouseRoom)
const chosen = computed(() => room.value?.choices.find((item) => item.id === world.darkHouse.decisions[world.darkHouse.current]))
const artAvailable = ref(true)
watch(() => world.darkHouse.current, () => { artAvailable.value = true })
</script>

<style scoped>
.md-mirror-house { container: mirror-house / inline-size; }
.md-mirror-house-layout { grid-template-rows: minmax(0, .47fr) minmax(0, .53fr); }
@container mirror-house (min-width: 760px) {
  .md-mirror-house-layout { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
}
</style>
