<template>
  <main class="kr-surface">
    <div v-if="!court.loaded || !run" class="grid min-h-96 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else
      class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 overflow-hidden px-2 py-2 sm:px-4"
    >
      <p
        v-if="court.storageWarning"
        class="kr-note kr-note-error p-3 text-sm"
        role="alert"
      >
        {{ court.storageWarning }}
      </p>

      <header
        class="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-warning/25 bg-base-200 px-3 py-2"
        aria-label="Reign status"
      >
        <div class="min-w-24">
          <p
            class="text-[10px] font-semibold uppercase tracking-widest opacity-65"
          >
            Act {{ actOf(Math.min(run.day, LAST_DAY)) }}
          </p>
          <p class="font-serif text-xl font-bold">
            {{ over ? 'The reign is over' : `Day ${run.day} / ${LAST_DAY}` }}
          </p>
        </div>
        <ul class="flex flex-1 flex-wrap gap-1" aria-label="Fortress support">
          <li
            v-for="faction in LOCAL_FACTION_DEFS"
            :key="faction.id"
            class="rounded-lg border border-base-content/10 bg-base-100 px-2 py-1 text-center"
            :title="faction.name + ': ' + faction.wants"
          >
            <span class="block text-[9px] font-bold uppercase opacity-60">{{
              shortName(faction.name)
            }}</span>
            <strong
              class="font-serif"
              :class="run.local[faction.id] <= 3 ? 'text-error' : ''"
              >{{ run.local[faction.id] }}</strong
            >
          </li>
        </ul>
        <div
          class="rounded-lg border border-warning/40 bg-warning/10 px-3 py-1 text-center"
        >
          <span class="block text-[9px] font-bold uppercase opacity-60"
            >Brass</span
          >
          <strong class="font-serif text-lg">{{ run.brass }}</strong>
        </div>
      </header>

      <nav
        class="flex shrink-0 gap-1 overflow-x-auto rounded-xl bg-base-300 p-1"
        aria-label="Fortress rooms"
      >
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="btn btn-sm min-w-fit flex-1 whitespace-nowrap"
          :class="activeRoom === room.id ? 'btn-warning' : 'btn-ghost'"
          :aria-current="activeRoom === room.id ? 'page' : undefined"
          @click="enter(room.id)"
        >
          {{ room.label }}
          <span
            v-if="room.badge"
            class="badge badge-error badge-xs ml-1"
            :aria-label="room.badge + ' waiting'"
            >{{ room.badge }}</span
          >
        </button>
      </nav>

      <div
        ref="stage"
        class="kr-scroll @container min-h-0 flex-1 overscroll-contain rounded-xl border border-base-content/10 bg-base-200/20 p-1.5 sm:p-3"
      >
        <section
          v-if="over && activeRoom !== 'chronicle'"
          class="kr-panel space-y-3 p-5"
        >
          <h2 class="font-serif text-3xl font-bold">Fifty days</h2>
          <p>
            The reign is over. The endings are still being written, so this run
            stops here. Rewind to any dawn from the Chronicle, or begin again.
          </p>
          <p v-if="run.hideout" class="text-sm opacity-75">
            The last days were spent in hiding.
          </p>
        </section>
        <template v-else>
          <EmperorFortressThrone v-if="activeRoom === 'throne'" :run="run" />
          <EmperorFortressQuests
            v-else-if="activeRoom === 'quests'"
            :run="run"
          />
          <EmperorFortressBarracks
            v-else-if="activeRoom === 'barracks'"
            :key="'barracks-' + run.day"
            :run="run"
          />
          <EmperorFortressMarket
            v-else-if="activeRoom === 'market'"
            :run="run"
          />
          <EmperorFortressMapRoom v-else-if="activeRoom === 'map'" :run="run" />
        </template>
        <EmperorFortressChronicle
          v-if="activeRoom === 'chronicle'"
          :run="run"
        />
      </div>

      <footer
        v-if="!over"
        class="flex shrink-0 flex-wrap items-center justify-end gap-2 rounded-xl bg-base-300 p-2"
      >
        <p v-if="warnings.length" class="mr-auto text-xs text-warning">
          {{ warnings.join(' · ') }}
        </p>
        <button type="button" class="btn btn-error btn-wide" @click="finish">
          Finish Day {{ run.day }}
        </button>
      </footer>
    </div>

    <EmperorFortressDawn
      v-if="showDawn && court.lastReport"
      :report="court.lastReport"
      @close="showDawn = false"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { LAST_DAY } from '~/utils/emperorOfDust/fortress/content'
import {
  actOf,
  audiencesToday,
  isOver,
} from '~/utils/emperorOfDust/fortress/engine'
import { LOCAL_FACTION_DEFS } from '~/utils/emperorOfDust/fortress/factions'

type RoomId = 'throne' | 'quests' | 'barracks' | 'market' | 'map' | 'chronicle'

const court = useEmperorFortressStore()
const run = computed(() => court.run)
const over = computed(() => !!run.value && isOver(run.value))
const activeRoom = ref<RoomId>('throne')
const showDawn = ref(false)
const stage = ref<HTMLElement | null>(null)

const unheard = computed(() =>
  run.value
    ? audiencesToday(run.value).filter(
        (audience) => !run.value!.audiencesHeard.includes(audience.id),
      ).length
    : 0,
)
const expiring = computed(
  () =>
    run.value?.board.filter((entry) => entry.lastDay === run.value!.day)
      .length ?? 0,
)
const rooms = computed<{ id: RoomId; label: string; badge?: number }[]>(() => [
  { id: 'throne', label: 'Throne room', badge: unheard.value || undefined },
  { id: 'quests', label: 'Quest room', badge: expiring.value || undefined },
  { id: 'barracks', label: 'Barracks' },
  { id: 'market', label: 'Market' },
  { id: 'map', label: 'Map room' },
  { id: 'chronicle', label: 'Chronicle' },
])
const warnings = computed(() => [
  ...(unheard.value
    ? [`${unheard.value} petitioner${unheard.value === 1 ? '' : 's'} unheard`]
    : []),
  ...(expiring.value
    ? [
        `${expiring.value} quest${expiring.value === 1 ? '' : 's'} expire tonight`,
      ]
    : []),
])

const shortName = (name: string) => name.replace(/^The /, '').split(' ')[0]

function enter(room: RoomId) {
  activeRoom.value = room
  stage.value?.scrollTo({ top: 0 })
}

function finish() {
  court.finish()
  showDawn.value = true
  activeRoom.value = 'throne'
}

onMounted(() => court.load())
</script>
