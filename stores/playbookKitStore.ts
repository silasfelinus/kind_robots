import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DEFAULT_KIT_SETTINGS,
  decodeKitSave,
  emptyKitProgress,
  isKitSetting,
  kitStorageKey,
  trailerDue,
  type KitProgress,
  type KitSave,
  type KitSettingKey,
  type KitSettings,
} from '~/utils/playbookKit/settings'

// Playbook Kit (conductor playbook-kit t-001): the settings, scrapbook,
// secrets, endings and trailer state every playbook game shares. One
// localStorage record per game; unreadable records are held, never overwritten.

export type KitPane =
  'cast' | 'factions' | 'secrets' | 'scrapbook' | 'endings' | 'settings'

export type KitUnlockKind = 'moments' | 'reveals' | 'endings'

const BLOCKED =
  'Browser storage is blocked. Progress this visit may not persist.'
const FULL =
  'Local save unavailable or full. Progress this visit is not backed up.'
const HELD =
  'Saved progress for this playbook could not be read. It was left untouched; new progress lasts only this visit.'

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function readText(store: Storage | null, key: string): string | null {
  try {
    return store?.getItem(key) ?? null
  } catch {
    return null
  }
}

function freshSave(): KitSave {
  return {
    version: 1,
    settings: { ...DEFAULT_KIT_SETTINGS },
    progress: emptyKitProgress(),
  }
}

export const usePlaybookKitStore = defineStore('playbookKit', () => {
  const saves = ref<Record<string, KitSave>>({})
  const held = ref<Record<string, boolean>>({})
  const writeWarning = ref('')
  const game = ref('')
  const pane = ref<KitPane | null>(null)
  const trailerOpen = ref(false)
  const lightbox = ref<string | null>(null)

  const save = computed(() => saves.value[game.value] ?? freshSave())
  const settings = computed<KitSettings>(() => save.value.settings)
  const progress = computed<KitProgress>(() => save.value.progress)
  const storageWarning = computed(() =>
    [held.value[game.value] ? HELD : '', writeWarning.value]
      .filter(Boolean)
      .join(' '),
  )

  function persist(gameId: string) {
    if (held.value[gameId]) return
    const store = storage()
    if (!store) {
      writeWarning.value = BLOCKED
      return
    }
    try {
      store.setItem(kitStorageKey(gameId), JSON.stringify(saves.value[gameId]))
      writeWarning.value = ''
    } catch {
      writeWarning.value = FULL
    }
  }

  function open(gameId: string) {
    game.value = gameId
    pane.value = null
    lightbox.value = null
    if (!saves.value[gameId]) {
      const store = storage()
      if (!store) writeWarning.value = BLOCKED
      const decoded = decodeKitSave(readText(store, kitStorageKey(gameId)))
      held.value = { ...held.value, [gameId]: decoded === null }
      saves.value = { ...saves.value, [gameId]: decoded ?? freshSave() }
    }
    trailerOpen.value = trailerDue(save.value.settings, save.value.progress)
  }

  function update(change: (current: KitSave) => KitSave) {
    if (!game.value) return
    saves.value = { ...saves.value, [game.value]: change(save.value) }
    persist(game.value)
  }

  function setSetting<K extends KitSettingKey>(key: K, value: KitSettings[K]) {
    if (!isKitSetting(key, value)) return
    update((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }))
  }

  function resetSettings() {
    update((current) => ({ ...current, settings: { ...DEFAULT_KIT_SETTINGS } }))
  }

  /** Records a moment, reveal or ending the first time it happens. Returns whether it was new. */
  function unlock(kind: KitUnlockKind, id: string): boolean {
    if (progress.value[kind][id]) return false
    const stamp = new Date().toISOString()
    update((current) => ({
      ...current,
      progress: {
        ...current.progress,
        [kind]: { ...current.progress[kind], [id]: stamp },
      },
    }))
    return true
  }

  function isUnlocked(kind: KitUnlockKind, id: string): boolean {
    return !!progress.value[kind][id]
  }

  function resetProgress() {
    update((current) => ({ ...current, progress: emptyKitProgress() }))
  }

  function playTrailer() {
    trailerOpen.value = true
  }

  function finishTrailer() {
    trailerOpen.value = false
    if (!progress.value.trailerSeen)
      update((current) => ({
        ...current,
        progress: { ...current.progress, trailerSeen: true },
      }))
  }

  function togglePane(next: KitPane) {
    pane.value = pane.value === next ? null : next
  }

  function openPane(next: KitPane) {
    pane.value = next
  }

  function closePane() {
    pane.value = null
  }

  function showMoment(id: string | null) {
    lightbox.value = id
  }

  return {
    game,
    pane,
    trailerOpen,
    lightbox,
    settings,
    progress,
    storageWarning,
    open,
    setSetting,
    resetSettings,
    unlock,
    isUnlocked,
    resetProgress,
    playTrailer,
    finishTrailer,
    togglePane,
    openPane,
    closePane,
    showMoment,
  }
})
