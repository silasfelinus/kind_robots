import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useMemoryEarthStore } from './memoryEarthStore'
import {
  SUBLEVEL_BATTERY_MAX,
  SUBLEVEL_ROOMS,
  chooseSublevel,
  newSublevelProgress,
  restoreSublevelProgress,
  sublevelChoiceLock,
  sublevelExits,
  sublevelFlags,
  sublevelOpening,
  travelSublevel,
  type SublevelEntry,
  type SublevelProgress,
  type SublevelRoomId,
} from '~/utils/memoryDungeon/sublevelB'

const STORAGE_KEY = 'memory-dungeon-sublevel-b-v1'
const ATLAS: SublevelRoomId[] = Array.from(
  { length: 36 },
  (_, i) => ('SB-' + String(i + 1).padStart(2, '0')) as SublevelRoomId,
)

export const useMemorySublevelStore = defineStore('memorySublevel', () => {
  const earth = useMemoryEarthStore()
  const save = ref<SublevelProgress>(newSublevelProgress('badge'))
  const hydrated = ref(false)
  const notice = ref('')

  /** Opens once Morrow has made his choice at the Sublevel B door (e03 6,2). */
  const unlocked = computed(() => Boolean(earth.e03Choices['6,2']))
  const entry = computed<SublevelEntry>(() =>
    earth.e03Choices['6,2'] === 'care' ? 'escort' : 'badge',
  )
  const progress = computed(() => save.value)
  const room = computed(() => SUBLEVEL_ROOMS[save.value.current])
  const flags = computed(() => [
    ...sublevelFlags(save.value),
    ...earth.e03Flags,
  ])
  const opening = computed(() =>
    room.value ? sublevelOpening(room.value, flags.value) : '',
  )
  const chosen = computed(() =>
    room.value?.choices.find(
      (choice) => choice.id === save.value.decisions[save.value.current],
    ),
  )
  const hand = computed(() =>
    (room.value?.choices ?? []).map((choice) => {
      const lock = sublevelChoiceLock(save.value, choice)
      return {
        id: choice.id,
        label: choice.label,
        disabled: Boolean(lock),
        hint: lock ?? undefined,
      }
    }),
  )
  const exits = computed(() => sublevelExits(save.value))
  const tiles = computed(() =>
    ATLAS.map((id) => {
      const data = SUBLEVEL_ROOMS[id]!
      const visited = save.value.visited.includes(id)
      return {
        id,
        title: visited ? data.title : '',
        kind: data.kind,
        current: id === save.value.current,
        visited,
        resolved: Boolean(save.value.decisions[id]),
        reachable: exits.value.includes(id),
      }
    }),
  )
  const batteryMax = SUBLEVEL_BATTERY_MAX

  function persist(): void {
    if (!import.meta.client || !hydrated.value) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          visited: save.value.visited,
          order: save.value.order,
          current: save.value.current,
        }),
      )
    } catch {
      notice.value = 'Sublevel B progress could not be saved in this browser.'
    }
  }

  function hydrate(): void {
    earth.hydrate()
    if (hydrated.value) return
    hydrated.value = true
    if (!import.meta.client) {
      save.value = newSublevelProgress(entry.value)
      return
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      save.value = restoreSublevelProgress(
        raw ? JSON.parse(raw) : null,
        entry.value,
      )
      earth.recordSublevelEnding(save.value.ending)
    } catch {
      save.value = newSublevelProgress(entry.value)
      notice.value = 'A damaged Sublevel B save was ignored.'
    }
  }

  function travel(id: SublevelRoomId): void {
    if (!unlocked.value) return
    const next = travelSublevel(save.value, id)
    if (next === save.value) {
      notice.value = 'That door is not open from here.'
      return
    }
    save.value = next
    notice.value = ''
    persist()
  }

  function choose(choiceId: string): void {
    if (!unlocked.value) return
    const choice = room.value?.choices.find((item) => item.id === choiceId)
    const next = chooseSublevel(save.value, choiceId)
    if (next === save.value) {
      const lock = choice ? sublevelChoiceLock(save.value, choice) : null
      if (lock) notice.value = lock
      return
    }
    save.value = next
    earth.recordSublevelEnding(next.ending)
    notice.value = choice?.outcome ?? ''
    persist()
  }

  return {
    unlocked,
    entry,
    progress,
    room,
    opening,
    chosen,
    hand,
    exits,
    tiles,
    batteryMax,
    notice,
    hydrated,
    hydrate,
    travel,
    choose,
  }
})
