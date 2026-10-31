import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useMemoryWorldStore } from './memoryWorldStore'
import {
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  worldEvents,
  type OverworldEventProgress,
} from '~/utils/memoryDungeon/overworldEventCatalog'
import {
  earthRealityReady,
  EARTH_REALITIES,
  type EarthReality,
} from '~/utils/memoryDungeon/earthAct'

const STORAGE_KEY = 'memory-dungeon-morrow-earth-v1'

interface EarthSave {
  version: 1
  active: EarthReality
  positions: Record<EarthReality, string>
  records: Record<EarthReality, OverworldEventProgress>
}

function fresh(): EarthSave {
  return {
    version: 1,
    active: 'e03',
    positions: { e03: '1,1', e04: '1,1' },
    records: {
      e03: newOverworldEventProgress('e03'),
      e04: newOverworldEventProgress('e04'),
    },
  }
}

export const useMemoryEarthStore = defineStore('memoryEarth', () => {
  const world = useMemoryWorldStore()
  const save = ref<EarthSave>(fresh())
  const hydrated = ref(false)
  const notice = ref('')

  const unlocked = computed(() => world.campaign.completed.includes('e02'))
  const active = computed(() => save.value.active)
  const e04Unlocked = computed(() =>
    world.campaign.completed.includes('e03'),
  )
  const progress = computed(() => save.value.records[active.value])
  const position = computed(() => save.value.positions[active.value])
  const current = computed(() => worldEvent(active.value, position.value))
  const chosen = computed(() =>
    current.value?.choices.find(
      (choice) => choice.id === progress.value.choices[position.value],
    ),
  )
  const readyToLeave = computed(() =>
    earthRealityReady(active.value, progress.value),
  )
  const completed = computed(() =>
    world.campaign.completed.includes(active.value),
  )
  const tiles = computed(() =>
    worldEvents(active.value).map((event) => ({
      key: event.key,
      title: event.title,
      kind: event.kind,
      current: event.key === position.value,
      revealed: progress.value.revealed.includes(event.key),
      resolved: Boolean(progress.value.choices[event.key]),
      reachable:
        event.key === position.value ||
        eventNeighbors(position.value).includes(event.key),
    })),
  )
  const photographs = computed(() =>
    worldEvents(active.value).filter(
      (event) =>
        event.photographId && progress.value.choices[event.key],
    ).length,
  )

  function persist(): void {
    if (!import.meta.client || !hydrated.value) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save.value))
    } catch {
      notice.value = 'Your choices remain playable but could not be saved.'
    }
  }

  function hydrate(): void {
    if (hydrated.value) return
    hydrated.value = true
    if (!import.meta.client) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const candidate = JSON.parse(raw) as Partial<EarthSave>
        if (candidate.version === 1) {
          const restored = fresh()
          for (const reality of EARTH_REALITIES) {
            const progress = restoreOverworldEventProgress(
              candidate.records?.[reality],
            )
            if (progress?.experience === reality) {
              restored.records[reality] = progress
              const position = candidate.positions?.[reality]
              if (
                typeof position === 'string' &&
                progress.revealed.includes(position)
              )
                restored.positions[reality] = position
            }
          }
          if (
            candidate.active === 'e04' &&
            world.campaign.completed.includes('e03')
          )
            restored.active = 'e04'
          save.value = restored
        }
      }
    } catch {
      notice.value = 'A damaged Earth chapter save was ignored.'
    }
    if (unlocked.value)
      world.syncMorrowEarthPhoto('e03', save.value.records.e03.choices)
    if (e04Unlocked.value)
      world.syncMorrowEarthPhoto('e04', save.value.records.e04.choices)
  }

  watch(
    () => world.campaign.completed,
    () => {
      if (!hydrated.value) return
      if (!e04Unlocked.value && save.value.active === 'e04')
        save.value.active = 'e03'
      if (unlocked.value)
        world.syncMorrowEarthPhoto('e03', save.value.records.e03.choices)
      if (e04Unlocked.value)
        world.syncMorrowEarthPhoto('e04', save.value.records.e04.choices)
    },
  )

  function select(reality: EarthReality): void {
    if (!unlocked.value) return
    if (reality === 'e04' && !e04Unlocked.value) return
    save.value.active = reality
    notice.value = ''
    persist()
  }

  function travel(key: string): void {
    if (!unlocked.value || (active.value === 'e04' && !e04Unlocked.value))
      return
    if (
      key !== position.value &&
      !eventNeighbors(position.value).includes(key)
    ) {
      notice.value = 'The next stop must share a border with your position.'
      return
    }
    if (!worldEvent(active.value, key)) return
    save.value.records[active.value] = revealOverworldEvent(
      progress.value,
      key,
    )
    save.value.positions[active.value] = key
    notice.value = ''
    persist()
  }

  function choose(choiceId: string): void {
    if (!unlocked.value || (active.value === 'e04' && !e04Unlocked.value))
      return
    const next = chooseOverworldEvent(
      progress.value,
      position.value,
      choiceId,
    )
    if (next === progress.value) return
    save.value.records[active.value] = next
    world.syncMorrowEarthPhoto(active.value, next.choices)
    notice.value =
      current.value?.choices.find((option) => option.id === choiceId)
        ?.outcome ?? ''
    persist()
  }

  function conclude(): void {
    if (!unlocked.value || !readyToLeave.value) return
    if (completed.value) {
      if (active.value === 'e03') select('e04')
      return
    }
    const success = world.finishMorrowEarthReality(
      active.value,
      active.value === 'e04' ? progress.value.choices['8,8'] : undefined,
    )
    if (!success) return
    notice.value =
      active.value === 'e03'
        ? 'Morrow follows the impossible tide toward a city with two histories.'
        : 'Scylla has witnessed the crossing. Her next memory will be younger than she is.'
    if (active.value === 'e03') save.value.active = 'e04'
    persist()
  }

  return {
    unlocked,
    e04Unlocked,
    active,
    progress,
    position,
    current,
    chosen,
    tiles,
    photographs,
    readyToLeave,
    completed,
    hydrated,
    notice,
    hydrate,
    select,
    travel,
    choose,
    conclude,
  }
})
