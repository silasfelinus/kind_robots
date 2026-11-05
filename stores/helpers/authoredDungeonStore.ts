import { computed, ref } from 'vue'
import type { AuthoredDungeon } from '~/utils/memoryDungeon/authoredDungeon/engine'
import type { DungeonProgress } from '~/utils/memoryDungeon/authoredDungeon/types'

/** Player-facing labels for one hand-written dungeon's stage. */
export interface AuthoredDungeonUi {
  title: string
  subtitle: string
  entryLabels: Readonly<Record<string, string>>
  guardianPending: string
  guardianPassed: string
  completed: string
  lockedTitle: string
  lockedBody: string
  saveName: string
}

export interface AuthoredDungeonOptions<
  Id extends string,
  Entry extends string,
  Ending extends string,
> {
  dungeon: AuthoredDungeon<Id, Entry, Ending>
  storageKey: string
  defaultEntry: Entry
  unlocked: () => boolean
  entry: () => Entry
  /** Flags from elsewhere in the campaign that this dungeon's echoes read. */
  externalFlags: () => readonly string[]
  /** Hydrate whatever `unlocked`, `entry` and `externalFlags` depend on. */
  beforeHydrate: () => void
  onEnding?: (ending: Ending | null) => void
  ui: AuthoredDungeonUi
}

/**
 * Shared Pinia setup body for a hand-written 36-room dungeon: persistence
 * (decisions and rooms seen only; restore replays them), the card hand
 * with lock hints, the 6x6 atlas and echo-aware openings. Call it inside a
 * `defineStore` setup function.
 */
export function useAuthoredDungeonState<
  Id extends string,
  Entry extends string,
  Ending extends string,
>(options: AuthoredDungeonOptions<Id, Entry, Ending>) {
  const { dungeon } = options
  const save = ref(dungeon.newProgress(options.defaultEntry)) as {
    value: DungeonProgress<Id, Entry, Ending>
  }
  const hydrated = ref(false)
  const notice = ref('')
  const atlas = Array.from(
    { length: dungeon.def.roomCount },
    (_, i) => (dungeon.def.prefix + '-' + String(i + 1).padStart(2, '0')) as Id,
  )

  const unlocked = computed(() => options.unlocked())
  const entry = computed(() => options.entry())
  const progress = computed(() => save.value)
  const room = computed(() => dungeon.rooms[save.value.current])
  const ownFlags = computed(() => dungeon.flags(save.value))
  const opening = computed(() =>
    room.value
      ? dungeon.opening(room.value, [
          ...ownFlags.value,
          ...options.externalFlags(),
        ])
      : '',
  )
  const chosen = computed(() =>
    room.value?.choices.find(
      (choice) => choice.id === save.value.decisions[save.value.current],
    ),
  )
  const hand = computed(() =>
    (room.value?.choices ?? []).map((choice) => {
      const lock = dungeon.choiceLock(save.value, choice)
      return {
        id: choice.id,
        label: choice.label,
        disabled: Boolean(lock),
        hint: lock ?? undefined,
      }
    }),
  )
  const exits = computed(() => dungeon.exits(save.value))
  const tiles = computed(() =>
    atlas.map((id) => {
      const data = dungeon.rooms[id]!
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
  const batteryMax = dungeon.def.batteryMax
  const ui = options.ui

  function persist(): void {
    if (!import.meta.client || !hydrated.value) return
    try {
      window.localStorage.setItem(
        options.storageKey,
        JSON.stringify({
          version: 1,
          visited: save.value.visited,
          order: save.value.order,
          current: save.value.current,
        }),
      )
    } catch {
      notice.value =
        ui.saveName + ' progress could not be saved in this browser.'
    }
  }

  function hydrate(): void {
    options.beforeHydrate()
    if (hydrated.value) return
    hydrated.value = true
    if (!import.meta.client) {
      save.value = dungeon.newProgress(entry.value)
      return
    }
    try {
      const raw = window.localStorage.getItem(options.storageKey)
      save.value = dungeon.restore(raw ? JSON.parse(raw) : null, entry.value)
      options.onEnding?.(save.value.ending)
    } catch {
      save.value = dungeon.newProgress(entry.value)
      notice.value = 'A damaged ' + ui.saveName + ' save was ignored.'
    }
  }

  function travel(id: string): void {
    if (!unlocked.value || !dungeon.isRoomId(id)) return
    const next = dungeon.travel(save.value, id)
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
    const next = dungeon.choose(save.value, choiceId)
    if (next === save.value) {
      const lock = choice ? dungeon.choiceLock(save.value, choice) : null
      if (lock) notice.value = lock
      return
    }
    save.value = next
    options.onEnding?.(next.ending)
    notice.value = choice?.outcome ?? ''
    persist()
  }

  return {
    ui,
    unlocked,
    entry,
    progress,
    room,
    ownFlags,
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
}
