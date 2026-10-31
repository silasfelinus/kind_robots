import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useMemoryWorldStore } from './memoryWorldStore'
import {
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  worldEvents,
  type OverworldEventProgress,
} from '~/utils/memoryDungeon/overworldEventCatalog'
import {
  SEA_REALITIES,
  seaNarrative,
  seaRealityReady,
  type SeaReality,
} from '~/utils/memoryDungeon/seaAct'
import {
  compactEarthJournal,
  EARTH_JOURNAL_COMPACT_AT,
  replayEarthJournal,
  type EarthJournalAction,
} from '~/utils/memoryDungeon/earthJournal'
import { memoryCharFate } from '~/utils/memoryDungeon/reimaginerCampaign'

const STORAGE_KEY = 'memory-dungeon-scylla-sea-v1'

interface SeaSave {
  version: 1
  active: SeaReality
  positions: Record<SeaReality, string>
  journals: Record<SeaReality, EarthJournalAction[]>
}

function fresh(): SeaSave {
  return {
    version: 1,
    active: 'e05',
    positions: { e05: '1,1', e06: '1,1' },
    journals: { e05: [], e06: [] },
  }
}

export const useMemorySeaStore = defineStore('memorySea', () => {
  const world = useMemoryWorldStore()
  const save = ref<SeaSave>(fresh())
  const records = ref<Record<SeaReality, OverworldEventProgress>>({
    e05: newOverworldEventProgress('e05'),
    e06: newOverworldEventProgress('e06'),
  })
  const hydrated = ref(false)
  const notice = ref('')

  const unlocked = computed(() => world.campaign.completed.includes('e04'))
  const e06Unlocked = computed(() => world.campaign.completed.includes('e05'))
  const active = computed(() => save.value.active)
  const progress = computed(() => records.value[active.value])
  const position = computed(() => save.value.positions[active.value])
  const current = computed(() => worldEvent(active.value, position.value))
  const opening = computed(() =>
    seaNarrative(active.value, position.value, world.campaign),
  )
  const charFate = computed(() => memoryCharFate(world.campaign))
  const chosen = computed(() =>
    current.value?.choices.find(
      (choice) => choice.id === progress.value.choices[position.value],
    ),
  )
  const readyToLeave = computed(() =>
    seaRealityReady(active.value, progress.value),
  )
  const completed = computed(() =>
    world.campaign.completed.includes(active.value),
  )
  const photographs = computed(
    () =>
      worldEvents(active.value).filter(
        (event) => event.photographId && progress.value.choices[event.key],
      ).length,
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

  function persist(): void {
    if (!import.meta.client || !hydrated.value) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save.value))
    } catch {
      notice.value = 'The story remains playable, but this browser cannot save it.'
    }
  }

  function hydrate(): void {
    if (hydrated.value) return
    hydrated.value = true
    if (!import.meta.client) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const candidate = JSON.parse(raw) as Partial<SeaSave>
        if (candidate.version === 1) {
          const restored = fresh()
          for (const reality of SEA_REALITIES) {
            const journal = candidate.journals?.[reality]
            const replayed = replayEarthJournal(reality, journal)
            if (!replayed || !Array.isArray(journal)) {
              notice.value = 'An invalid palace travel record was ignored.'
              continue
            }
            records.value[reality] = replayed.progress
            restored.positions[reality] = replayed.position
            restored.journals[reality] = journal
          }
          if (candidate.active === 'e06' && e06Unlocked.value)
            restored.active = 'e06'
          save.value = restored
        }
      }
    } catch {
      notice.value = 'A damaged palace save was ignored.'
    }
    syncPhotos()
  }

  function syncPhotos(): void {
    if (unlocked.value)
      world.syncScyllaEarthPhoto('e05', records.value.e05.choices)
    if (e06Unlocked.value)
      world.syncScyllaEarthPhoto('e06', records.value.e06.choices)
  }

  watch(
    () => world.campaign.completed,
    () => {
      if (!hydrated.value) return
      if (!e06Unlocked.value && save.value.active === 'e06')
        save.value.active = 'e05'
      syncPhotos()
    },
  )

  function select(reality: SeaReality): void {
    if (!unlocked.value || (reality === 'e06' && !e06Unlocked.value))
      return
    save.value.active = reality
    notice.value = ''
    persist()
  }

  function makeRoom(): boolean {
    const journal = save.value.journals[active.value]
    if (journal.length < EARTH_JOURNAL_COMPACT_AT) return true
    const compacted = compactEarthJournal(active.value, journal)
    if (!compacted || compacted.length >= EARTH_JOURNAL_COMPACT_AT) {
      notice.value = 'The journey cannot be shortened safely. Your choices were not changed.'
      return false
    }
    save.value.journals[active.value] = compacted
    return true
  }

  function travel(key: string): void {
    if (!unlocked.value || (active.value === 'e06' && !e06Unlocked.value))
      return
    if (key === position.value) return
    if (!eventNeighbors(position.value).includes(key)) {
      notice.value = 'The next passage must border your current room.'
      return
    }
    if (!worldEvent(active.value, key) || !makeRoom()) return
    records.value[active.value] = revealOverworldEvent(progress.value, key)
    save.value.journals[active.value].push({ type: 'travel', key })
    save.value.positions[active.value] = key
    notice.value = ''
    persist()
  }

  function choose(choiceId: string): void {
    if (!unlocked.value || (active.value === 'e06' && !e06Unlocked.value))
      return
    const next = chooseOverworldEvent(progress.value, position.value, choiceId)
    if (next === progress.value || !makeRoom()) return
    records.value[active.value] = next
    save.value.journals[active.value].push({
      type: 'choose',
      key: position.value,
      choiceId,
    })
    syncPhotos()
    notice.value =
      current.value?.choices.find((option) => option.id === choiceId)
        ?.outcome ?? ''
    persist()
  }

  function conclude(): void {
    if (!unlocked.value || !readyToLeave.value) return
    if (completed.value) {
      if (active.value === 'e05') select('e06')
      return
    }
    const success = world.finishScyllaReality(
      active.value,
      progress.value.choices['8,8'],
    )
    if (!success) return
    notice.value =
      active.value === 'e05'
        ? 'The palace remembers the first escape. The next reality will demand a different account.'
        : 'Two histories remain. The Hoshimori passage is now open, but neither sister has been erased.'
    if (active.value === 'e05') save.value.active = 'e06'
    persist()
  }

  return {
    unlocked,
    e06Unlocked,
    active,
    progress,
    position,
    current,
    opening,
    charFate,
    chosen,
    readyToLeave,
    completed,
    photographs,
    tiles,
    notice,
    hydrated,
    hydrate,
    select,
    travel,
    choose,
    conclude,
  }
})
