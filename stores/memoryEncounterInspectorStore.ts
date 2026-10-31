import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
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

const STORAGE_KEY = 'memoryDungeonEncounterInspectorV1'
const WORLDS = Array.from(
  { length: 12 },
  (_, index) => 'e' + String(index + 1).padStart(2, '0'),
)
interface InspectorSnapshot {
  version: 1
  active: string
  positions: Record<string, string>
  progress: Record<string, OverworldEventProgress>
}

export const useMemoryEncounterInspectorStore = defineStore(
  'memoryEncounterInspector',
  () => {
    const active = ref('e03')
    const positions = ref<Record<string, string>>({})
    const saves = ref<Record<string, OverworldEventProgress>>({})
    const hydrated = ref(false)
    const notice = ref('')

    const available = computed(() =>
      WORLDS.map((id) => ({
        id,
        events: worldEvents(id),
        resolved: Object.keys(saves.value[id]?.choices ?? {}).length,
      })),
    )
    const progress = computed(
      () =>
        saves.value[active.value] ?? newOverworldEventProgress(active.value),
    )
    const position = computed(() => positions.value[active.value] ?? '1,1')
    const current = computed(() => worldEvent(active.value, position.value))
    const chosen = computed(() =>
      current.value?.choices.find(
        (choice) => choice.id === progress.value.choices[position.value],
      ),
    )
    const tiles = computed(() =>
      worldEvents(active.value).map((site) => ({
        key: site.key,
        title: site.title,
        kind: site.kind,
        revealed: progress.value.revealed.includes(site.key),
        resolved: Boolean(progress.value.choices[site.key]),
        current: position.value === site.key,
        reachable:
          site.key === position.value ||
          eventNeighbors(position.value).includes(site.key),
      })),
    )

    function persist(): void {
      if (!import.meta.client || !hydrated.value) return
      const snapshot: InspectorSnapshot = {
        version: 1,
        active: active.value,
        positions: positions.value,
        progress: saves.value,
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      } catch {
        notice.value = 'The prototype cannot save in this browser.'
      }
    }

    function hydrate(): void {
      if (hydrated.value) return
      hydrated.value = true
      if (!import.meta.client) return
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (!saved) return
        const input = JSON.parse(saved) as Partial<InspectorSnapshot>
        if (input.version !== 1) return
        if (WORLDS.includes(input.active ?? '')) active.value = input.active!
        for (const id of WORLDS) {
          const restored = restoreOverworldEventProgress(input.progress?.[id])
          if (restored) saves.value[id] = restored
          const candidate = input.positions?.[id]
          if (candidate && restored?.revealed.includes(candidate))
            positions.value[id] = candidate
        }
      } catch {
        notice.value = 'A damaged preview save was ignored.'
      }
    }

    function ensure(id: string): void {
      if (!saves.value[id]) saves.value[id] = newOverworldEventProgress(id)
    }

    function select(id: string): void {
      if (!WORLDS.includes(id) || !worldEvents(id).length) return
      ensure(id)
      active.value = id
      notice.value = ''
      persist()
    }

    function travel(key: string): void {
      ensure(active.value)
      if (
        key !== position.value &&
        !eventNeighbors(position.value).includes(key)
      ) {
        notice.value = 'Travel to a neighboring square first.'
        return
      }
      if (!worldEvent(active.value, key)) return
      saves.value[active.value] = revealOverworldEvent(
        saves.value[active.value]!,
        key,
      )
      positions.value[active.value] = key
      notice.value = ''
      persist()
    }

    function choose(choiceId: string): void {
      ensure(active.value)
      const previous = saves.value[active.value]!
      const next = chooseOverworldEvent(previous, position.value, choiceId)
      if (next === previous) return
      saves.value[active.value] = next
      notice.value =
        current.value?.choices.find((choice) => choice.id === choiceId)
          ?.outcome ?? ''
      persist()
    }

    function restart(): void {
      saves.value[active.value] = newOverworldEventProgress(active.value)
      positions.value[active.value] = '1,1'
      notice.value = ''
      persist()
    }

    return {
      active,
      available,
      position,
      progress,
      current,
      chosen,
      tiles,
      notice,
      hydrated,
      hydrate,
      select,
      travel,
      choose,
      restart,
    }
  },
)
